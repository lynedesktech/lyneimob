---
title: "Callback HTTP Railway → Next.js para criar cliente e negocio"
date: 2026-04-28
tags: [arquitetura, ia, railway, decisao]
---

# Decisao arquitetural: callback HTTP em vez de DB direto

Documento valida a arquitetura adicionada no PR #2 (LYNEDES-71) onde o agente Python no Railway chama um endpoint HTTP do Next.js (`/api/interno/criar-cliente-negocio`) em vez de criar cliente/negocio direto via Supabase admin client.

## Contexto

Quando o agente Python (Railway) recebe a primeira mensagem de um lead, ele:

1. Cria a conversa no banco (direto via Supabase admin)
2. **Chama o Next.js via HTTP** com fire-and-forget + 1 retry pra criar o cliente e o negocio no pipeline
3. Continua o atendimento sem esperar a resposta do callback

## Por que callback HTTP e nao Supabase admin direto

A logica de criar cliente + negocio nao e trivial:

- Buscar etapa "Pre-atendimento IA" do pipeline da org
- Buscar corretor padrao (config) ou primeiro admin da org
- Reusar cliente existente se ja tiver telefone cadastrado (dedup)
- Calcular `posicao` no pipeline
- Detectar origem do lead (portal, site, whatsapp) inspecionando `leads_portais` recente
- Vincular tudo na conversa

Essa logica vive em `src/lib/whatsapp/conversa-utils.ts:criarClienteENegocioInicial()`. Replicar isso em Python significa:

- Manter duas implementacoes do mesmo fluxo (drift garantido)
- Refatorar viraria ginastica cross-language
- Bug em uma implementacao nao se propaga pra outra → silencioso

A escolha foi: **logica de dominio fica em um lugar so (TS)**, e o agente chama via HTTP. O custo extra de 1 round-trip vale a coerencia do dominio.

## Resposta aos pontos da LYNEDES-110

### 1. Arquitetura

Faz sentido — vide acima. Single-source-of-truth pra logica de criacao de cliente/negocio. Custo de 1 HTTP-hop e baixo (ambos rodam em sao-paulo, p99 < 300ms).

### 2. Seguranca

Endpoint protegido por `validarAuthInterna()` desde a LYNEDES-148 (PR #24). Antes era `x-internal-secret = SUPABASE_SERVICE_ROLE_KEY`; agora e `Authorization: Bearer $INTERNAL_API_SECRET`. Sem header valido → 401 imediato, sem chegar perto do banco.

### 3. Idempotencia

**Idempotente por design:**

- Endpoint verifica antes de criar: `conversa.cliente_id && conversa.negocio_id` → retorna `{status: "ja_existe"}` sem efeito colateral
- Cliente: `criarClienteENegocioInicial` busca por telefone OU whatsapp (`or(telefone.eq.X,whatsapp.eq.X)`) e **reusa** se ja existe
- Negocio: cria sempre (cada conversa novo ciclo = novo negocio); aceito como design (cada lead pode ter multiplos negocios ao longo do tempo)

**Caveat:** se o callback for chamado 2x **simultaneamente** (race antes da primeira completar), pode criar 2 clientes. Mitigacao: o Railway hoje faz fire-and-forget com 1 retry **apos erro**, nao em paralelo. Risco residual baixo. Se virar problema, adicionar advisory lock por `numero_cliente`.

### 4. Tratamento de erro

**Cenario A** — callback inicial falha mas retry passa:
- Railway aguarda resposta, se status >= 400 ou exception → 1 retry
- Conversa fica sem `cliente_id`/`negocio_id` ate o retry
- Agente continua o atendimento normalmente (a IA usa `numero_cliente` pra contexto, nao precisa do cliente_id)

**Cenario B** — ambos falham:
- Conversa fica sem cliente/negocio vinculado
- Logs no Railway: `[CRM] Falha ao chamar Next.js (tentativa 2)`
- Logs no Next.js: erro do endpoint (se chegou)
- **Lead nao fica orfao** — a conversa existe no banco e o agente atende
- **Pendencia:** quando o lead manda proxima mensagem, o webhook do Next.js NAO recria porque `isNova=false` (conversa ja existe). Cliente/negocio ficam vazios.

**Acao recomendada (issue filha):** cron diario que varre conversas com `cliente_id IS NULL` e dispara reprocessamento. Sem isso, lead pode ficar sem registro CRM se ambos retries falharem (raro, mas possivel).

### 5. Observabilidade

**O que tem hoje:**
- Logs estruturados em ambas as pontas
- Railway: `[CRM] Cliente/negócio criado: {status}` ou `[CRM] Falha ao chamar Next.js`
- Next.js: `[criar-cliente-negocio] Cliente X e negócio Y criados`

**O que falta:**
- Metrica de taxa de sucesso (sem Sentry, sem dashboard)
- Latencia do callback nao e medida
- Alerta quando taxa de falha > X%

**Acao recomendada (issue filha):** instrumentar com counter simples no Redis (`crm:callback:success` / `crm:callback:fail`) e endpoint de leitura pro painel super_admin. Implementacao baixa, valor alto.

### 6. Rollback

**Reverter e barato:**
- Codigo: revert do PR no agente Python (3 funcoes em `main.py` + 1 settings em `config.py`). Endpoint Next.js fica orfao mas inofensivo.
- Banco: nada pra reverter — registros criados continuam validos.
- Orfaos: query `SELECT id FROM conversas_whatsapp WHERE cliente_id IS NULL AND negocio_id IS NULL AND criado_em > '...'` identifica os perdidos do periodo.

**Sinal pra revert:** se latencia p99 do callback subir > 1s OU taxa de erro > 5% por 2h consecutivas, considerar mover a logica pro Python (replicar `criarClienteENegocioInicial`). Hoje, sem dados sugerindo isso, a abordagem HTTP esta validada.

## Conclusao

**Arquitetura aprovada como esta**, com 2 melhorias recomendadas como issues filhas:

1. **Cron de reconciliacao** — varrer conversas com cliente_id/negocio_id null e disparar reprocessamento (mitiga cenario B do tratamento de erro).
2. **Observabilidade basica** — counter Redis + endpoint de leitura pra acompanhar taxa de sucesso/falha do callback.

Sem essas duas, o sistema funciona, mas fica vulneravel a falhas silenciosas em casos de borda.
