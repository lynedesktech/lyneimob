---
title: "Vault — LyneImob"
date: 2026-04-14
tags: [vault, lyneimob]
---

# Vault — LyneImob

## O que e este vault

Base de conhecimento compartilhada do projeto **LyneImob** — CRM imobiliario SaaS com IA integrada. Multi-tenancy com RLS. Produto da Lynedesk.

Stack: Next.js (App Router), Supabase (PostgreSQL + RLS), shadcn/ui, Tailwind CSS, NextAuth.js, SWR, Zod, OpenAI GPT-4o, Stripe, Upstash Redis, Uazapi v2, Vercel.

## Equipe

| Membro | Papel | Foco |
|--------|-------|------|
| Joao Lucas | CTO / PO | Gestao, arquitetura, prioridades, aprovacoes |
| Eduardo | CEO / Socio | Visao de mercado, posicionamento, validacao estrategica |
| Vitoria | Desenvolvedora | Infraestrutura, frontend, backend, banco de dados |
| Gabriel | Desenvolvedor IA | Agente IA WhatsApp, automacoes, inteligencia artificial |
| Mateus | Comercial / Ops | Clientes, demos, vendas, operacao comercial |

## Estrutura

- `decisoes/` — Decisoes tecnicas e de produto com justificativas
- `aprendizados/` — Licoes aprendidas, erros evitados, descobertas
- `processos/` — Protocolos e fluxos de trabalho do projeto
- `reunioes/` — Atas e notas de reunioes com a equipe e clientes
- `pessoas/` — Membros da equipe, clientes e contatos relevantes
- `referencias/` — Material de apoio externo

## Frontmatter padrao

Todo arquivo .md deve ter:

```yaml
---
title: "Titulo descritivo"
date: YYYY-MM-DD
tags: [categoria, topico]
---
```

## Regras

- Usar wikilinks `[[nome-do-arquivo]]` para conectar notas
- Nomes de arquivo em kebab-case (ex: `decisao-remover-onboarding.md`)
- Datas absolutas, nunca relativas (ex: `2026-04-14`, nunca "ontem")
- Conteudo em portugues brasileiro
- Codigo pode usar ingles para termos tecnicos
- Toda decisao importante deve ter registro em `decisoes/`
- Toda reuniao deve gerar ata em `reunioes/`
- Todo erro significativo deve gerar aprendizado em `aprendizados/`

## Gestao de tarefas

Tarefas sao gerenciadas no **Linear** (workspace "Joao Lucas Ucceli", equipe "Lynedesk", projeto "Lyneimob"). O vault NAO substitui o Linear — complementa com contexto, decisoes e aprendizados.

## Clientes ativos

- [[jader]] — Beta tester ativo (R$2.000/mes)
- [[angelo]] — Implementacao em andamento (R$15.000 setup + R$2.000/mes)
