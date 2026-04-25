---
title: Decisoes e Planejamento Sprint — LyneImob
date: 2026-04-11
tags: [produto, sprint, lyneimob, lynedesk, decisoes, planejamento]
empresa: lynedesk
produto: lyneimob
projeto: LyneImob
status: em-andamento
---

# Decisoes e Planejamento Sprint — LyneImob

**Data:** 11/04/2026
**Participantes:** Joao Lucas Ucceli (CTO)
**Contexto:** Sessao de auditoria completa + planejamento de sprint com organizacao do backlog, decisoes de produto e definicao de cronograma

---

## 1. Equipe definida

| Membro | Papel | Responsabilidades |
|--------|-------|-------------------|
| Joao Lucas Ucceli | CTO / PO | Decisoes tecnicas, estrategia, aprovacao de clientes, reunioes |
| Vitoria | Desenvolvedora | Infra, frontend, backend, banco de dados — tudo do sistema |
| Gabriel | Desenvolvedor IA | Agente WhatsApp, automacoes, inteligencia artificial |
| Mateus | Comercial / Ops | Clientes, demos, vendas, operacao comercial |
| Eduardo | CEO / Socio | Visao de mercado, posicionamento, validacao estrategica |

**Regra:** toda decisao tecnica e do Joao. Vitoria executa demandas do sistema. Gabriel executa demandas de IA. Mateus cuida do comercial. Eduardo valida estrategia.

> **Atualizado em 14/04/2026** — equipe completa definida na [[2026-04-14-reuniao-equipe-onboarding|reuniao de onboarding]].

---

## 2. Decisoes de produto

### Site institucional (nao e landing page)
- O site de venda evolui diretamente pro site institucional
- Paginas: Home, Sobre Nos, Modulos (hub + paginas individuais), Precos, Blog, Contato, Seguranca
- Navegacao: `Home | Sobre Nos | Modulos ▼ | Precos | Blog | Contato [CTA] [Entrar]`

### Referencias visuais aprovadas
- **TOP 1 — Linear** (linear.app): hero, efeitos, menu, site inteiro. Nota 1000.
- **TOP 2 — Monday** (monday.com): branco/preto, limpo, simples
- **Complementares:** Stripe (logos/integracoes), Notion (visual simples), Webflow (dark/efeitos), HubSpot (institucional), Calendly (minimalista)
- **Removidos pelo Joao:** Vercel, Figma, Airtable, Slack, Compass, Pipedrive, Zillow, Redfin, Salesforce, Twilio, Intercom, Auth0, Zapier

### Layout do dashboard
- Seguir pattern do shadcn/ui blocks dashboard-01
- Content area com bordas arredondadas
- Fundo da pagina mesma cor da sidebar (contraste com area de conteudo branca)
- Referencia: https://ui.shadcn.com/blocks
- Comando: `npx shadcn@latest add dashboard-01`

### Blog automatizado
- **LLM:** OpenAI (modelo a definir — GPT-4o ou GPT-4o-mini)
- **Imagens:** Ideogram (API)
- **Storage:** Supabase (tabela posts_blog)
- **Publicacao:** 100% automatizada, sem revisao manual
- **Frequencia:** 3 posts/dia (8h, 13h, 18h)
- **50 keywords mapeadas** — ver comentario na LYNEDES-52 no Linear

### Video de venda
- Video real de 2-3 minutos (nao placeholder)
- Mateus grava e edita
- Roteiro: Dashboard → Cadastro imovel → Pipeline Kanban → Agente WhatsApp → Site publico

### Onboarding
- Onboarding atual removido 100% (quebrado, impacta performance)
- Joao vai definir novo onboarding depois

### Amenities de imovel
- Configuravel por organizacao
- Lista padrao pre-carregada (varanda, piscina, churrasqueira, etc.) + admin pode editar

### Beta testers
- Periodo beta 100% gratuito
- Mateus cria lista de 8-10 candidatos, Joao aprova 5
- Clientes atuais: Jader (ativo), Angelo (aguardando implementacao)

### Limite de fotos validado
- 20 fotos e o limite correto (OLX hard limit, ZAP recomenda 20, +12% views)

---

## 3. Feedback do Jader (beta tester)

### Bugs identificados
1. **Agente WhatsApp IA parou de responder** — causa raiz: `agente-sdr.ts` linhas 72-84, IA verifica etapa do pipeline e para silenciosamente se card moveu
2. **Botao salvar descricao IA nao aparece** — widget salva em `descricao_ia` mas nao tem botao "Aplicar" no formulario

### Sugestoes de UX aprovadas
1. Wizard/stepper no cadastro de imovel (multi-step, 6 etapas)
2. Barra de progresso visivel por etapa
3. Dropdowns em vez de texto livre pra caracteristicas (quartos, suites, vagas)
4. IA so disponivel apos preencher dados basicos + endereco + caracteristicas

### Feedback de comunicacao
- Nao misturar assuntos no grupo (prints + audios intercalados)

---

## 4. Limpeza do banco de producao

Realizada em 11/04/2026:
- **Removidos:** 7 usuarios de teste, 6 organizacoes de teste e todos os dados vinculados
- **Mantidos:** Jader Bolsoni (admin) + Aline Bertholdi (gerente) na org "Corretor Jader"
- **Criado:** usuario joao@lynedesk.com (org Lynedesk) com 3 imoveis, 4 clientes e 4 negocios de teste

---

## 5. Backlog organizado (Linear)

### Sprint 1 — Ate 17/04

```
LYNEDES-40  Infraestrutura e Estabilidade (3 sub)
  63  Setup ambiente, Git, Linear — 12/04, Vitoria
  65  CI, build, tipos banco — 15/04, Vitoria
  67  Testes fluxos criticos — 16/04, Vitoria

LYNEDES-74  Ajustes Dashboard (5 sub)
  75  Remover onboarding 100% — 14/04, Vitoria
  76  Layout dashboard-01 (content redonda) — 14/04, Vitoria
  77  Widget IA posicao/responsividade — 15/04, Vitoria
  78  Responsividade mobile — 16/04, Vitoria
  79  Loading/error states — 17/04, Vitoria

LYNEDES-70  Feedback Jader (3 sub)
  71  Fix WhatsApp IA — 16/04, Gabriel (reatribuido 14/04)
  72  Botao aplicar descricao — 18/04, Vitoria
  73  Wizard formulario imovel — 22/04, Vitoria

LYNEDES-60  Operacao 5 Clientes (3 sub)
  68  Mapear 5 clientes — 13/04, Mateus
  37  Clientes ativos Jader + Angelo — 17/04, Joao
  61  Infra operacional — 17/04, Vitoria

LYNEDES-69  Video de venda — 21/04, Mateus
LYNEDES-36  Reuniao Lynedesk — 14/04, Joao ✅ CONCLUIDA
LYNEDES-39  Reuniao Eduardo — 15/04, Joao

Gabriel (IA):
LYNEDES-82  Onboarding tecnico IA (4 sub) — 21/04, Gabriel
  83  Mapear stack IA — 16/04, Gabriel
  84  Documentar processos IA — 18/04, Gabriel
  85  Mapear atividades IA — 18/04, Gabriel
  86  Documentacao consolidada — 21/04, Gabriel

Issues criadas pos-reuniao 14/04:
LYNEDES-93  Protocolo unificado no repo — 15/04, Joao
LYNEDES-94  Planejamento marketing — 28/04, Joao
LYNEDES-95  Rafael Doni beta tester — 18/04, Mateus
LYNEDES-96  Grupo WhatsApp geral — 18/04, Mateus
```

### Sprint 2 — Ate 28/04

```
LYNEDES-57  Site Institucional (2 sub)
  41  Redesign completo (Home, Sobre, Modulos, SEO) — 25/04, Vitoria
  52  Blog automatizado (OpenAI + Ideogram) — 28/04, Vitoria
```

---

## 6. Codigo

### Principios definidos
- Maximo de componentes reutilizaveis
- Maximo de variaveis centralizadas
- Sistema otimizado a nivel de codigo (DRY)
- Paleta monocromatica: branco, preto, azul

### Pattern visual
- Inspiracao: Linear (hero, efeitos) + Monday (branco/preto, limpo)
- Dashboard: shadcn/ui dashboard-01 (content area redonda)
- Icons: monocromaticos (azul ou cinza), nunca coloridos

---

## Links

- **Linear:** [[https://linear.app/joao-lucas-ucceli/project/lyneimob]]
- **GitHub:** [[https://github.com/lynedesktech/lyneimob]]
- **Producao:** [[https://lyne-imob.vercel.app]]
- **Supabase:** [[https://ldahoecercachalpmvkh.supabase.co]]
- **Auditoria tecnica:** [[lyneimob-auditoria-2026-04-11]]
