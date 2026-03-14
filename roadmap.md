# Roadmap — LyneImob

> Arquivo de gestão de tarefas do projeto.
> Atualizado pelo Claude a cada início e fim de tarefa.
> Para saber o que está pendente: "Claude, leia o roadmap.md e me diga o próximo passo."

---

## 🔄 Fazendo

> Tarefas em andamento agora. Só uma por vez sempre que possível.

- [ ] Criar projeto Next.js 15 + TypeScript + Tailwind CSS 4 + shadcn/ui
      Contexto: setup inicial do repositório com todas as dependências base

---

## 📋 A Fazer

> Tarefas prontas para execução, em ordem de prioridade.

### Fase 0 — Fundação
- [ ] Configurar Supabase — clientes browser, server e admin
      Contexto: conexão com banco, variáveis de ambiente, helpers de acesso
- [ ] Migration: tabelas organizacoes + usuarios com RLS
      Contexto: estrutura base do multi-tenancy, tudo em português BR
- [ ] Implementar auth completo — login, cadastro, esqueci senha, middleware
      Contexto: fluxo de autenticação com Supabase Auth, proteção de rotas
- [ ] Montar layout do dashboard — sidebar azul-marinho + header + navegação
      Contexto: estrutura visual principal que todos os módulos vão usar
- [ ] Implementar multi-tenancy — hook use-organizacao, RLS policies, teste de isolamento
      Contexto: garantir que dados de uma imobiliária nunca vazem para outra
- [ ] Atualizar CLAUDE.md com stack, estrutura e padrões definidos
      Contexto: manter a documentação do projeto como fonte de verdade

### Fase 1 — Imóveis com IA

- [ ] Migration: tabelas imoveis + imovel_fotos com RLS
      Contexto: estrutura de dados para cadastro de imóveis e fotos
- [ ] CRUD de imóveis — Server Actions + formulário com validação Zod
      Contexto: criar, editar, excluir imóveis com todos os campos do schema
- [ ] Upload e galeria de fotos — Supabase Storage, reordenação, foto de capa
      Contexto: corretor precisa subir e organizar fotos dos imóveis
- [ ] Listagem de imóveis com filtros e paginação
      Contexto: busca por tipo, finalidade, bairro, faixa de preço, status
- [ ] Página de detalhe do imóvel — dados completos, galeria, histórico
      Contexto: visão completa do imóvel para o corretor
- [ ] IA em imóveis — gerar descrição, melhorar texto, gerar título
      Contexto: diferencial do produto, IA ajuda o corretor a criar anúncios melhores

### Fase 2 — Clientes com IA

- [ ] Migration: tabelas clientes + cliente_interesses com RLS
      Contexto: estrutura para gestão de contatos e perfil de busca
- [ ] CRUD de clientes — Server Actions + formulário com validação Zod
      Contexto: cadastrar e gerenciar contatos da imobiliária
- [ ] Perfil de interesse do cliente — tipo de imóvel, bairros, faixa de preço
      Contexto: registrar o que o cliente busca para fazer match depois
- [ ] Match automático — cruzamento cliente × imóveis disponíveis
      Contexto: mostrar ao corretor quais imóveis combinam com cada cliente
- [ ] Timeline de interações do cliente
      Contexto: histórico de tudo que aconteceu com aquele contato
- [ ] IA em clientes — score de lead, resumo do perfil, match inteligente
      Contexto: IA analisa engajamento e sugere imóveis além dos filtros básicos

### Fase 3 — Negócios/Pipeline com IA

- [ ] Migration: tabelas pipeline_etapas + negocios com RLS + seed etapas padrão
      Contexto: funil de vendas com etapas customizáveis por imobiliária
- [ ] Kanban visual com drag-and-drop (dnd-kit)
      Contexto: interface visual do pipeline onde o corretor arrasta negócios entre etapas
- [ ] CRUD de negócios — criar, editar, ganhar, perder com motivo
      Contexto: gestão completa do deal vinculado a cliente + imóvel
- [ ] Filtros do pipeline por corretor, tipo e valor
      Contexto: gerente precisa visualizar pipeline filtrado
- [ ] IA em negócios — análise de contexto, sugestão de ação, análise de perda
      Contexto: IA analisa o negócio inteiro e sugere próximos passos ao corretor

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

- [x] CLAUDE.md hierárquico implementado — pesquisas/ e requisitos/ com contexto específico ✓ validado
- [x] roadmap.md criado — sistema de gestão de tarefas com 5 seções e regras no CLAUDE.md ✓ validado
- [x] Pesquisa CRM imobiliário — mapeamento completo de CRMs, portais e funcionalidades MVP ✓ validado (2026-03-14)
