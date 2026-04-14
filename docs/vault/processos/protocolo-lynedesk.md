---
title: Protocolo de Trabalho — Lynedesk
date: 2026-04-14
tags: [processo, lynedesk, equipe, protocolo]
---

# Protocolo de Trabalho — Equipe Lynedesk

Documento de referencia obrigatoria para toda a equipe Lynedesk.
Define como operamos, quais ferramentas usamos e qual o fluxo de trabalho.

Vigencia: 14/04/2026 em diante.

---

## 1. Nossas Ferramentas

| Prioridade | Ferramenta | Funcao |
|-----------|-----------|--------|
| 1 | **Git/GitHub** | Codigo — toda alteracao vive aqui |
| 2 | **Linear** | Gestao de produto — tasks, planejamento, specs, progresso |
| 3 | **WhatsApp (grupo Lynedesk)** | Comunicacao rapida — avisos curtos e alinhamentos |

**Regra de ouro:** O que nao esta no Linear ou no Git nao existe formalmente.

- O repositorio e para **codigo**. Nenhum .md de plano, requisito ou roadmap no repo.
- O Linear e para **gestao**. Tasks, specs, progresso, decisoes.
- O WhatsApp e para **comunicacao**. Avisos curtos com referencia ao Linear.

---

## 2. Papeis

| Papel | Quem | Responsabilidade |
|-------|------|-----------------|
| **CTO / PO** | Joao | Define prioridades, cria tasks, aprova entregas, decide arquitetura |
| **Dev** | Vitoria | Executa tasks, commita codigo, atualiza Linear |
| **Comercial / Ops** | Mateus | Beta testers, contatos, operacao comercial |
| **Socio** | Eduardo | Consultado em decisoes estrategicas e de produto |

---

## 3. Fluxo de Trabalho — Como executar uma task

```
1. Joao cria a task no Linear com spec completa
2. Dev le a spec COMPLETA antes de qualquer coisa
3. Dev move a task para "Em andamento" no Linear
4. Dev implementa (codigo + testes)
5. Dev faz commit + push para main
6. Dev atualiza o Linear:
   - Marca checkboxes do que foi feito
   - Adiciona comentario de progresso
7. Dev avisa no WhatsApp: 1 linha curta referenciando a task
8. Joao valida (audita Git + Linear)
9. Joao move para "Concluido" se aprovado
```

### Cadencia obrigatoria (NUNCA inverter):

```
Codigo → Git (commit + push) → Linear (checkboxes + comentario) → WhatsApp (1 linha)
```

### O que Joao audita:
- Git: commits existem?
- Linear: checkboxes marcados? Comentario de progresso?
- Criterios de aceite atendidos?

**Mensagem no WhatsApp SEM commit no Git = nada pra validar.**

---

## 4. Regras Inegociaveis

### 4.1 Uma task por vez, na sequencia do Linear
Nao antecipar tasks, nao pular etapas. A sequencia esta no Linear com prioridades claras.
Excecao: somente se Joao autorizar duas tasks simultaneas.

### 4.2 Somente Joao cria tasks
Devs nao criam tasks no Linear. Se identificar algo necessario, comunica no WhatsApp e Joao cria.

### 4.3 Somente Joao fecha tasks
O dev NUNCA move task para "Concluido". Implementa, posta evidencia e aguarda aprovacao do Joao.

### 4.4 Credenciais nunca no repositorio
Nenhuma chave de API, token, senha ou variavel de ambiente vai pro repo.
Tudo em `.env` (no .gitignore) ou variaveis na Vercel/Supabase.

### 4.5 Build tem que passar
Antes de qualquer commit: `npm run build` sem erros. Codigo que nao builda nao vai pra main.

### 4.6 Qualidade > Velocidade
Se uma task levar mais tempo que o estimado, avisar no WhatsApp pedindo ajuste.
Joao ajusta o prazo — o dev NAO corre pra entregar incompleto.

### 4.7 Tasks bloqueadas sao intocaveis
Tasks com status "Aguardando cliente" ou marcadas como bloqueadas nao podem ser iniciadas sem comunicado do Joao.

---

## 5. Linear — Como usar

### Status das tasks

| Status | Significado |
|--------|-------------|
| **Backlog** | Ideia registrada, sem prioridade definida |
| **A fazer** | Priorizada, aguardando execucao |
| **Em andamento** | Em execucao pelo dev |
| **Revisao** | Implementado, aguardando revisao do Joao |
| **Agendado** | Task com data marcada (reuniao, entrega) |
| **Aguardando cliente** | Depende de retorno externo |
| **Concluido** | Aprovado e validado pelo Joao |
| **Duplicado** | Task duplicada (desconsiderar) |
| **Cancelado** | Task cancelada |

### Boas praticas

- Ler a spec **completa** antes de comecar
- Mover pra **"Em andamento"** antes de comecar a codar
- Marcar checkboxes conforme vai concluindo
- Adicionar comentario de progresso ao terminar
- Se encontrar bug durante implementacao, comentar na task (nao criar task separada)

---

## 6. Git — Como usar

### Fluxo

```
main (branch principal)
  └── feature/LYNEDES-XX-descricao (branch da task)
       └── PR → review (Joao) → merge em main
```

### Convencao de commits

| Prefixo | Quando usar |
|---------|-------------|
| `feat:` | Nova funcionalidade |
| `fix:` | Correcao de bug |
| `refactor:` | Refatoracao sem mudar comportamento |
| `chore:` | Configuracao, deps, infra |
| `docs:` | Documentacao |

Formato: `prefixo: LYNEDES-XX descricao curta`

Exemplo: `feat: LYNEDES-75 remover onboarding`

### Regras

- Commits pequenos e frequentes (nao acumular tudo num commit gigante)
- Sempre fazer push apos commit
- PR obrigatorio — Joao revisa antes do merge

### Antes de cada commit (checklist):

```
[ ] Build passa? (npm run build)
[ ] Zero credenciais no codigo?
[ ] Novas env vars documentadas no .env.example?
[ ] Commit message no formato correto?
```

---

## 7. WhatsApp — Como usar

### Formato de aviso no grupo:

```
[LYNEDES-75] Onboarding removido — detalhes no Linear
```

### Regras

- Maximo 2 linhas por aviso de entrega
- Detalhes ficam no Linear, nao no WhatsApp
- Se a conversa virar decisao de produto, Joao registra no Linear
- Impedimentos e bloqueios: avisar imediatamente no grupo

---

## 8. Checklists Obrigatorios

### Antes de comecar a codar

```
[ ] Task aberta no Linear? Li a spec completa?
[ ] Sei o que "pronto" significa? (criterios de aceite claros)
[ ] Task movida pra "Em andamento"?
[ ] Task NAO esta bloqueada?
```

### Antes de cada commit/push

```
[ ] Build passa localmente?
[ ] Zero credenciais no codigo?
[ ] Novas env vars documentadas?
[ ] Commit message no formato correto? (prefixo: LYNEDES-XX descricao)
```

### Depois do push

```
[ ] PR criado no GitHub?
[ ] Linear atualizado? (checkboxes + comentario)
[ ] Aviso no WhatsApp? (1 linha curta)
[ ] Aguardando validacao do Joao?
```

---

## 9. Stack do Projeto (Lyneimob)

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js (App Router) |
| UI | shadcn/ui + Tailwind CSS |
| Banco | PostgreSQL via Supabase |
| Auth | NextAuth.js (Credentials + JWT) |
| Cache | Redis (Upstash) |
| IA | OpenAI GPT-4o |
| WhatsApp | Uazapi v2 |
| Data Fetching | SWR |
| Validacao | Zod |
| Deploy | Vercel |

---

## 10. Modelo Mental

> "Um commit sem update no Linear e uma entrega incompleta,
> da mesma forma que codigo que nao builda e codigo incompleto."

O processo NAO e burocracia. O processo E PARTE do trabalho.

- Se o Linear nao reflete o que voce fez → voce nao fez.
- Se o Git nao tem o commit → o codigo nao existe.
- Se o WhatsApp nao tem o aviso → ninguem sabe.

---

*Documento criado por Joao Lucas Ucceli em 14/04/2026.*
