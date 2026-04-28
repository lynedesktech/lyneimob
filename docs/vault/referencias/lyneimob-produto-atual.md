---
title: "LyneImob — Produto Atual"
date: 2026-04-14
tags: [referencia, produto, lyneimob, documento-fundacional]
---

# LyneImob — Produto Atual
## Estado completo do sistema em 14/04/2026

---

## O que é o LyneImob

O LyneImob é um CRM imobiliário com inteligência artificial. Um SaaS multi-tenant onde cada imobiliária tem seu próprio ambiente isolado — com dashboard, pipeline de vendas, gestão de imóveis, agente IA no WhatsApp e site público personalizado.

Cada cliente paga R$2.000/mês pelo acesso completo.

---

## Arquitetura

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 14 (App Router) |
| UI | shadcn/ui + Tailwind CSS |
| Banco de dados | PostgreSQL via Supabase |
| Autenticação | NextAuth.js (Credentials + JWT) |
| Cache | Redis via Upstash |
| Inteligência Artificial | OpenAI GPT-4o |
| WhatsApp | Uazapi v2 (API de integração) |
| Data Fetching | SWR |
| Validação | Zod |
| Deploy | Vercel |
| Pagamentos | Stripe |

**Multi-tenancy:** Row Level Security (RLS) no Supabase. Cada organização só vê seus próprios dados. Isolamento a nível de banco.

---

## Módulos funcionais

### 1. Dashboard
- Métricas em tempo real: imóveis ativos, leads, negócios, atividades
- Cards de resumo com indicadores
- Painel diferenciado por cargo (admin vs corretor)
- Suporte a light/dark mode

### 2. Gestão de Imóveis
- CRUD completo (criar, editar, listar, excluir)
- Galeria de fotos com upload múltiplo
- Campos: tipo, finalidade, endereço (CEP auto-fill), características, valores
- Publicação no site público e portais
- Geração de descrição com IA (OpenAI GPT-4o)
- Filtros e busca avançada

### 3. Pipeline de Vendas (Kanban)
- Funil visual drag-and-drop
- Etapas configuráveis por organização
- Cada negócio vinculado a cliente + imóvel
- Histórico de movimentação
- Valores e previsão de fechamento

### 4. Gestão de Clientes
- CRUD completo com dados de contato
- Interesses (tipo de imóvel, faixa de preço, região)
- Histórico de interações
- Vinculação com negócios e atividades

### 5. Atividades e Calendário
- Agendamento de visitas, ligações, follow-ups
- Calendário visual
- Vinculação com clientes e negócios
- Notificações e lembretes

### 6. Agente IA WhatsApp SDR
- Atendimento automático 24/7 via WhatsApp
- Qualificação de leads (orçamento, localização, interesse)
- Apresentação de imóveis disponíveis
- Agendamento de visitas
- Movimentação automática no pipeline
- Registro de conversas no banco
- Handoff para corretor humano

### 7. Site Público da Imobiliária
- Rota dinâmica por slug: `/slug-da-imobiliaria`
- Totalmente personalizável por organização
- Listagem de imóveis com filtros
- Página individual do imóvel com galeria
- Formulário de contato
- Botão flutuante WhatsApp
- SEO automático (OG tags, JSON-LD)

### 8. Billing (Stripe)
- 3 planos: Trial, CRM+IA, CRM+IA+SDR
- Checkout integrado
- Portal do cliente (gerenciar assinatura)
- Webhooks: pagamento, upgrade, cancelamento
- Trial de 14 dias

### 9. Loteamentos
- CRUD de loteamentos
- Importação em massa de lotes
- Visualização de disponibilidade
- Integração com pipeline

### 10. Administração
- Painel super admin (gestão de organizações)
- Gestão de usuários e permissões
- Configurações da organização
- Health check de integrações

---

## Integrações ativas

| Integração | Função | Status |
|------------|--------|--------|
| WhatsApp (Uazapi v2) | Agente IA SDR, mensagens automáticas | Ativo |
| Stripe | Pagamentos, assinaturas, portal | Ativo |
| OpenAI GPT-4o | Geração de descrições, agente conversacional | Ativo |
| Redis (Upstash) | Cache, rate limiting, sessões | Ativo |
| ZAP Imóveis | Importação de leads do portal | Ativo |
| VivaReal | Importação de leads do portal | Ativo |
| OLX | Importação de leads do portal | Ativo |
| Supabase Storage | Upload de imagens (imóveis, logos, site) | Ativo |

---

## Clientes atuais

| Cliente | Status | Detalhes |
|---------|--------|----------|
| [[jader]] | Beta tester ativo | Usando o sistema, enviando feedback de bugs e melhorias |
| [[angelo]] | Em implementação | Pagou R$15.000 pelo setup. Customização do dashboard em andamento |

---

## Segurança

- Row Level Security (RLS) em todas as tabelas
- Autenticação JWT com NextAuth.js
- Credenciais nunca no repositório (.env + Vercel)
- HTTPS em produção (Vercel)
- Dados isolados por organização a nível de banco
- Stripe PCI compliant para pagamentos

---

## Pontos de atenção identificados (auditoria 11/04)

1. Onboarding quebrado — impacta performance (15+ queries extras por page load)
2. Agente WhatsApp para de responder após primeira mensagem em alguns cenários
3. Sem CI/CD — PRs podem chegar em main sem build
4. Tipos do banco manuais — risco de drift
5. Responsividade mobile precisa de ajustes
6. Widget IA com problemas de posicionamento

Todos esses pontos já estão como tasks no Linear com specs completas.

---

*Documento criado por João Lucas Ucceli — CTO Lynedesk*
*14 de abril de 2026*
