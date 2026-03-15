# Roadmap — LyneImob

> Arquivo de gestão de tarefas do projeto.
> Atualizado pelo Claude a cada início e fim de tarefa.
> Para saber o que está pendente: "Claude, leia o roadmap.md e me diga o próximo passo."

---

## 🔄 Fazendo

> Tarefas em andamento agora. Só uma por vez sempre que possível.

(nenhuma tarefa em andamento)

---

## 📋 A Fazer

> Tarefas prontas para execução, em ordem de prioridade.

### Fase 4 — Atividades com IA

- [ ] Migration: tabela atividades com RLS
      Contexto: agenda de tarefas e compromissos dos corretores
- [ ] CRUD de atividades — criar, editar, marcar realizada, reagendar, cancelar
      Contexto: gestão de visitas, ligações, follow-ups, propostas
- [ ] Visão calendário — diária, semanal e mensal
      Contexto: corretor precisa ver sua agenda de forma visual
- [ ] Notificações por email — lembretes de atividades via Resend
      Contexto: corretor recebe lembrete antes de visitas e follow-ups
- [ ] IA em atividades — sugestão pós-atividade, briefing de visita
      Contexto: IA prepara o corretor antes da visita e sugere próximo passo depois

### Fase 5 — Integração com Portais

- [ ] Migration: tabela leads_portais com RLS
      Contexto: armazenar leads que chegam dos portais imobiliários
- [ ] Gerador XML VRSync — endpoint /api/xml/[slug].xml
      Contexto: feed XML para publicar imóveis nos portais (ZAP, OLX, VivaReal)
- [ ] Webhook receptor de leads — endpoint /api/webhooks/portais
      Contexto: receber leads dos portais automaticamente
- [ ] Normalizador de leads — ZAP, OLX, VivaReal → formato único
      Contexto: cada portal manda dados em formato diferente, precisa padronizar
- [ ] Auto-criação de cliente + negócio a partir do lead recebido
      Contexto: lead chega do portal e já vira contato + negócio no pipeline

### Fase 6 — Site Próprio

- [ ] Rotas dinâmicas /[slug]/ — home, listagem de imóveis, detalhe, contato
      Contexto: cada imobiliária ganha um site próprio com URL única
- [ ] SSR + SEO — meta tags, OpenGraph, sitemap dinâmico
      Contexto: site precisa aparecer bem no Google para gerar leads orgânicos
- [ ] Tema customizável — cores, logo, textos configuráveis no dashboard
      Contexto: imobiliária personaliza o visual do site sem precisar de desenvolvedor
- [ ] Formulário de contato → cria lead automaticamente
      Contexto: visitante do site preenche formulário e vira lead no CRM
- [ ] Widget de chat IA no site público
      Contexto: chatbot que responde perguntas sobre imóveis e coleta dados do visitante

### Fase 7 — Agente SDR WhatsApp + Billing

- [ ] Migration: tabelas conversas_ia + ia_uso com RLS
      Contexto: histórico de conversas do agente e controle de consumo de IA
- [ ] Webhook WhatsApp — endpoint /api/webhooks/whatsapp (Meta Business API)
      Contexto: receber e enviar mensagens via WhatsApp Business
- [ ] Integração n8n + Claude API para o agente SDR
      Contexto: fluxo de automação que gerencia as conversas do agente
- [ ] Fluxo completo do agente — receber, processar, responder, transferir para corretor
      Contexto: agente conversa com lead, coleta dados, sugere imóveis, agenda visita
- [ ] Painel de conversas do agente no dashboard
      Contexto: corretor visualiza histórico de conversas e pode assumir atendimento
- [ ] Stripe — produtos, checkout, customer portal, webhooks
      Contexto: cobrança recorrente com 2 planos (CRM+IA e CRM+IA+SDR)
- [ ] Middleware de limites por plano — controlar acesso a features por assinatura
      Contexto: cada plano tem limites de corretores, imóveis e conversas IA

---

## ✅ A Validar

> Tarefas concluídas pelo Claude que aguardam sua validação manual.

(nenhuma tarefa aguardando validação)

---

## 💡 Futuras

> Ideias, melhorias e implementações planejadas para mais adiante.

- [ ] App mobile nativo para corretores
- [ ] Espelho de vendas para empreendimentos
- [ ] Módulo financeiro (comissões, repasses)
- [ ] Dashboard avançado com BI e relatórios
- [ ] Domínio customizado por imobiliária
- [ ] Integração com sistemas de incorporadoras

---

## ✔️ Concluído

> Tarefas validadas. As 10 mais recentes ficam aqui para contexto.

- [x] Fase 0 — Fundação completa (projeto Next.js, Supabase, auth, layout dashboard, multi-tenancy, CLAUDE.md) ✓ validado (2026-03-14)
- [x] Fase 1 — Imóveis com IA completa (migration, CRUD, upload fotos, listagem, detalhe, IA com descrição/título) ✓ validado (2026-03-14)
- [x] Fase 2 — Clientes com IA completa (migration, CRUD, interesses, match, timeline, IA com score/resumo/match inteligente) ✓ validado (2026-03-14)
- [x] Fase 3 — Negócios/Pipeline com IA completa (migration, Kanban drag-and-drop, CRUD, ganhar/perder/reabrir, filtros, IA com análise/sugestão/perda) ✓ validado (2026-03-14)
- [x] Pesquisa CRM imobiliário — mapeamento completo de CRMs, portais e funcionalidades MVP ✓ validado (2026-03-14)
- [x] roadmap.md criado — sistema de gestão de tarefas com 5 seções e regras no CLAUDE.md ✓ validado
- [x] CLAUDE.md hierárquico implementado — pesquisas/ e requisitos/ com contexto específico ✓ validado
