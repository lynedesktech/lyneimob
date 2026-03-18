# Roadmap — LyneImob

> Registro completo de todas as atividades do projeto.
> O Claude atualiza automaticamente a cada início e fim de tarefa.
> Nenhuma demanda se perde — tudo fica documentado aqui.

---

## 📋 A Fazer (0 tarefas)

> Tarefas prontas para execução, em ordem de prioridade.

### Fila (fazer depois)

_(nenhuma tarefa na fila)_

---

## 🔄 Fazendo (1 tarefa)

> Tarefa em andamento agora.

- [ ] Teste completo do sistema com Playwright — 61 páginas, 3 perfis (admin/gerente/corretor), 10 iterações, site público + auth. Corrigir todos os erros encontrados.

---

## ✅ Pronto (0 tarefas)

> Implementação concluída. Aguardando validação do usuário.

_(nenhuma tarefa aguardando validação)_

---

## ✔️ Concluído (62 tarefas)

> Histórico completo de entregas auditadas e aprovadas.

### 2026-03-18

- [x] Fix permissões gerente em configurações — cards filtrados por cargo, gerente acessa configurações com permissões corretas (2026-03-18)
- [x] Fix debounce WhatsApp — race condition na criação de conversas, endpoint separado /api/whatsapp/processar, maxDuration=60 (2026-03-18)
- [x] Validar fluxo Stripe end-to-end — checkout com cartão teste 4242, redirect com toast de sucesso, UI mostra plano correto, "Gerenciar assinatura" só para admin, gerente/corretor bloqueados com toast de erro. Webhook handler correto (precisa Stripe CLI em dev local) (2026-03-18)
- [x] Validar permissões por perfil — testado com Playwright nos 3 perfis (admin/gerente/corretor): sidebar, configurações, bloqueio de URL, dashboard personalizado. Nenhum bug encontrado (2026-03-18)
- [x] Favicon e meta tags da marca Lynedesk — icon.svg e apple-icon.svg com "L" gradiente azul, favicon.ico em public/, metadata completa com OpenGraph e keywords (2026-03-18)
- [x] Página de Organizações — detalhe — /admin/organizacoes/[id] com métricas, dados da empresa, financeiro, tabela de usuários. Listagem com linhas clicáveis (2026-03-18)
- [x] Central de Ajuda — página /ajuda com 9 módulos, placeholder de vídeo + passo a passo em Accordion, HelpCircle na sidebar e busca global (2026-03-18)
- [x] Módulo de Loteamentos completo (11 etapas) — banco (migration 026), tipos/schemas, server actions, sidebar, CRUD (5 páginas + 9 componentes), importador CSV, galeria de fotos, IA, site público (5 funções + 4 componentes + 2 páginas), integração com negócios, limites de plano (migration 028). Auditado e confirmado (2026-03-18)
- [x] Site Público completo (4 fases) — homepage 7 seções + busca rápida + tipos + estatísticas + CTA, animações Framer Motion, WhatsApp flutuante + menu mobile, imóveis similares. Auditado e confirmado (2026-03-18)
- [x] Upload de logo do cliente no site público — aba Logo em Meu Site, exibição no header público (2026-03-18)
- [x] Deploy na Vercel — GitHub conectado, env vars configuradas, build de produção, webhook Stripe apontando para URL final (2026-03-18)
- [x] Fix SDR agent crash — lock Redis, debounce melhorado, proteções contra crash no agente (2026-03-18)
- [x] Fix Vercel 404 + log webhook — corrigir domínio na Vercel, melhorar logs do webhook WhatsApp (2026-03-18)
- [x] Fix token Uazapi — sincronizar token da instância com o banco, identificar org por token (2026-03-18)

### 2026-03-17

- [x] Auditoria estrutural + limpeza completa — eliminar .agent/ e .agents/ (symlink resolvido), unificar CLAUDE.md (3→1), consolidar toggle-visualizacao (3→1), renumerar migrations (022-025), dividir tools-sdr.ts e importador-imoveis.tsx em módulos menores, remover PNGs/SVGs/pesquisas/requisitos não utilizados (2026-03-17)
- [x] Agente WhatsApp v4 — Consciência de canal (multi-canal) — migration 024, webhook detecta portal/site por telefone, IA recebe canal e imóvel de interesse, PASSO -1 com modos LEAD_QUENTE/LEAD_MORNO/LEAD_FRIO (2026-03-17)
- [x] Agente WhatsApp v3 — Prompt algorítmico + ferramentas renomeadas — prompt com árvore de decisão (PASSO 0–5), 3 cenários (PRIMEIRA_RESPOSTA / EM_ANDAMENTO / REATIVACAO), ferramentas `atualizar_cliente` e `atualizar_negocio` (2026-03-17)
- [x] Agente WhatsApp v2 — Regras de negócio + comportamento da IA — gate de etapa (só atende em pré-atendimento IA), archive da conversa ao ganhar negócio, upsert de cliente por telefone ao retornar, remoção da página /conversas, sidebar corrigida (2026-03-17)
- [x] Agente WhatsApp v1 — Primeiro agente SDR com ferramentas básicas, unificação de configurações + memória do agente para super_admin (2026-03-17)
- [x] Etapa 7 — Auditoria final shadcn — 49 páginas auditadas, 5 correções aplicadas (botao-exportar, secao-funcionalidades, secao-hero, estado-vazio), 90%+ do projeto seguia o design system corretamente (2026-03-17)
- [x] Reorganização completa do roadmap — auditoria de código confirmou 100% dos itens implementados; roadmap limpo e atualizado (2026-03-17)
- [x] Auditoria geral + implementação final — sidebar /financeiro, botao-exportar DropdownMenu, tab Preferências + Negócios do Cliente, redesign negócio 2 colunas, Calendar + Toggle Group instalados (2026-03-17)
- [x] Adoção 100% shadcn/ui — Etapas 1 a 6: preset Mira/Blue, 7+ componentes instalados, sidebar ajustada, landing e auth preservadas, Skills e MCP shadcn configurados, build verificado (2026-03-17)
- [x] Etapa 7A — Field + InputGroup + Combobox nos formulários — 5 formulários migrados, prefixos R$ e m², ComboboxCampo com busca em cliente/imóvel/negócio (2026-03-17)
- [x] Etapa 7B — Dashboard com Charts — 3 gráficos: Funil de Negócios (BarChart), Portfólio de Imóveis (PieChart), Evolução Mensal (AreaChart) (2026-03-17)
- [x] Etapa 7C — Command Palette (BuscaGlobal) — migrada para CommandDialog shadcn com Ctrl+K, grupos Criar/Navegar/Plataforma, busca async com debounce (2026-03-17)
- [x] Configurações de Funil de Vendas e Tipos de Atividade — migration 021, /configuracoes/pipeline, /configuracoes/tipos-atividade, 7 tipos padrão, reordenamento com setas (2026-03-17)
- [x] Negócios: visualização Kanban + Lista com ações em massa — toggle-visualizacao.tsx, filtros avançados, barra de ações em massa (excluir, mover etapa, ganhar, perder) (2026-03-17)
- [x] Wizard de conexão WhatsApp — 4 etapas (credenciais → QR code → agente IA → sucesso), polling automático de status, seletor visual de horário e corretor por nome (2026-03-17)
- [x] Resumo Semanal via Cron — gerar-resumo.ts extraído para lib/, rota /api/cron/resumo-semanal com CRON_SECRET, vercel.json com schedule toda segunda 9h Brasília (2026-03-17)
- [x] PageHeader unificado — componente reutilizável para cabeçalhos de página em todo o sistema (2026-03-17)
- [x] Redesign ficha do cliente — layout reformulado com DropdownMenu corrigido, paginação melhorada (2026-03-17)
- [x] Fixes de integração Uazapi — auth header corrigido, endpoints API v2, campos corretos, webhook payload adaptado ao formato real (2026-03-17)
- [x] Bugs críticos nos formulários — redirect server-side nas 6 actions (criar/editar cliente, negócio, imóvel, atividade), botão Cancelar no negócio, valor zero aceito, formulários sem useRouter (2026-03-17)
- [x] Corrigir bugs de criação/edição — toast de sucesso + crash ao voltar resolvido em todos os módulos CRUD (2026-03-17)
- [x] Corrigir login: preservar email ao errar + mensagens específicas (email inexistente / senha incorreta / não confirmado) + link "Recuperar senha" condicional (2026-03-17)
- [x] Reorganizar sidebar + configurações como hub central — /configuracoes com 8 cards, sidebar com 3 grupos (Principal, Gestão, Administração) (2026-03-17)
- [x] Corrigir formulários: React Hook Form + Zod em 4 formulários (atividade, negócio, cliente, imóvel) — sem perda de dados, borda vermelha em erros (2026-03-17)
- [x] Implementar cargo Super Admin — migration 020, 3 páginas /admin/*, sidebar condicional, conta superadmin@lyneimob.com criada (2026-03-17)
- [x] Remover separadores da sidebar + criar página Meu Perfil (2026-03-17)
- [x] Redesign telas de auth — estilo visual reformulado, overlay escurecido, animação de zoom removida (2026-03-17)
- [x] Corrigir visual das páginas de auth — texto branco no painel esquerdo, espaçamento CardFooter (2026-03-17)
- [x] Corrigir erros de produção — /negocios/[id] crash, login com imagem, middleware configurado (2026-03-17)
- [x] Trocar paleta de cores para gradiente azul vibrante — variáveis CSS grad-start/mid/end/accent-blue, 11 arquivos atualizados (2026-03-17)
- [x] Rebranding "CRM" → "Gestão Imobiliária" + novos nomes de planos — 17 arquivos, landing page, sidebar, auth, planos, onboarding (2026-03-17)
- [x] Limpar banco de dados para produção — TRUNCATE organizacoes CASCADE + DELETE auth.users, sistema pronto para uso real (2026-03-17)
- [x] Criar 3 contas de produção (admin, gerente, corretor) — org "Imobiliária Lynedesk", emails padrão @lyneimob.com (2026-03-17)
- [x] Fixes de deploy Vercel — TypeScript errors corrigidos, Redis protegido contra variáveis ausentes no build (2026-03-17)

### 2026-03-16

- [x] Polimento visual pós-rebranding — auditoria completa por 3 agentes UI/UX em todas as telas, design system consistente, dark mode OK (2026-03-16)
- [x] Criar 3 contas de teste (admin, gerente, corretor) — contas criadas no Supabase na mesma org "Imobiliária Teste", fix do bug EstadoFormulario no Turbopack (2026-03-16)
- [x] Fix loop infinito de renderização no dashboard — causa raiz: recursão infinita no RLS do PostgreSQL. Migration 019, policies reescritas em 16+ tabelas (2026-03-16)
- [x] Garantir fontes sans-serif em todo o sistema — fallback chain no globals.css, font-sans no body (2026-03-16)
- [x] Configurar Stripe Sandbox + auditoria de integração — 2 produtos criados, 5 env vars, webhook handler com 7 correções (2026-03-16)
- [x] Módulo de Atividades — agenda com calendário mensal, semanal e diário, CRUD completo de atividades (2026-03-16)
- [x] Integração WhatsApp (v1) — webhook para receber mensagens, envio via Uazapi, agente IA básico com Redis (2026-03-16)
- [x] Site Público (v1) — estrutura inicial do site público por slug da imobiliária, listagem de imóveis, detalhe, contato (2026-03-16)
- [x] Importação em massa de imóveis — importador com parsing de arquivo, validação de dados, inserção em lote (2026-03-16)
- [x] Exportação de dados — botão Exportar em 4 listagens com opções Excel e PDF (2026-03-16)
- [x] Módulo Financeiro/Billing — estrutura base do Stripe: checkout, assinaturas, webhooks, customer portal, 3 planos (trial, crm_ia, crm_ia_sdr) (2026-03-16)
- [x] Landing page de vendas — página pública na rota / com seções de funcionalidades, planos, CTA (2026-03-16)
- [x] Seed de dados de teste — dados iniciais para desenvolvimento e validação do sistema (2026-03-16)
- [x] Redesign sidebar — grupos organizados, header visual com ícone, imagens Unsplash permitidas (2026-03-16)

### 2026-03-14

- [x] Módulo de Negócios/Pipeline — Kanban com drag-and-drop, análise IA, etapas configuráveis (2026-03-14)
- [x] Módulo de Clientes — CRUD completo, interesses, timeline de atividades, match IA com imóveis (2026-03-14)
- [x] Módulo de Imóveis — CRUD completo, listagem com filtros, galeria de fotos, análise IA (2026-03-14)
- [x] Fundação do projeto — auth com Supabase, layout dashboard com sidebar, multi-tenancy com RLS, middleware de proteção, componentes base (2026-03-14)
- [x] Estrutura inicial do projeto — Next.js 16, TypeScript, Tailwind CSS 4, Supabase, estrutura de pastas, configuração do repositório (2026-03-14)

---

## 💬 Sugestões de Refatoração Técnica (2 pendentes / 10 concluídas)

> Melhorias identificadas pelo Claude durante o trabalho. Não são urgentes — executar quando houver espaço no roadmap.

- [x] **Dashboard com Charts** ✓ — 3 gráficos implementados (funil, portfólio, evolução mensal)
- [x] **Command palette** ✓ — BuscaGlobal migrada para CommandDialog com Ctrl+K
- [x] **Field + Input Group nos formulários** ✓ — 5 formulários com prefixos R$ e m²
- [x] **Combobox em seleções longas** ✓ — ComboboxCampo implementado em cliente/imóvel/negócio
- [x] **Alert para avisos inline** ✓ — alert.tsx + banner-trial.tsx com Alert/AlertAction
- [x] **Alert Dialog** ✓ — alert-dialog.tsx + confirmacao-exclusao.tsx com AlertDialog
- [x] **Calendar shadcn** ✓ — instalado em src/components/ui/calendar.tsx
- [x] **Collapsible** ✓ — collapsible.tsx disponível para uso
- [x] **Toggle Group** ✓ — toggle-group.tsx + toggle.tsx instalados
- [x] **Migrar botao-exportar para DropdownMenu** ✓ — feito

- [ ] **Context Menu no Kanban** — click-direito nos cards de negócios: editar, mover etapa, ganhar/perder
- [ ] **Carousel na galeria de imóveis** — instalar `carousel` shadcn para galeria de fotos no detalhe do imóvel
