# Roadmap — LyneImob

> Arquivo de gestão de tarefas do projeto.
> Atualizado pelo Claude a cada início e fim de tarefa.
> Para saber o que está pendente: "Claude, leia o roadmap.md e me diga o próximo passo."

---

## 🔄 Fazendo

> Tarefas em andamento agora. Só uma por vez sempre que possível.

(nada em andamento)

---

## 📋 A Fazer

> Tarefas prontas para execução, em ordem de prioridade.

- [ ] Adicionar logos SVG da Lynedesk ao projeto
      Contexto: receber os SVGs do usuário e salvar em public/ (logo colorido, logo branco, ícone "L"). Substituir o ícone Building2 pelo logo real nos 5 pontos: sidebar, auth desktop, auth mobile, header e footer do site público. Manter Building2 como fallback para orgs sem logo próprio.
      Bloqueio: aguardando os arquivos SVG do usuário
- [ ] Atualizar paleta de cores para #023373 (azul marinho Lynedesk)
      Contexto: converter #023373 para OKLCH e usar como --primary no globals.css. Ajustar sidebar, accent e tokens derivados. Atualizar dark mode (azul claro da marca, não cinza). Atualizar cores padrão em configuracoes-site.ts e referência no CLAUDE.md.
- [ ] Adicionar favicon e meta tags da marca Lynedesk
      Contexto: criar favicon.ico e apple-touch-icon com o ícone "L" da Lynedesk. Atualizar app/layout.tsx com metadata da marca.
      Bloqueio: aguardando ícone "L" em SVG do usuário
- [ ] Polimento visual pós-rebranding (frontend-design)
      Contexto: usar skill frontend-design para revisar todas as telas após as mudanças de cor e logo. Garantir contraste e legibilidade em ambos os temas (claro/escuro).
      Depende de: tarefas de logo e paleta concluídas
- [ ] Configurar Stripe Sandbox
      Contexto: código de billing já está 95% pronto. Falta o usuário fornecer as chaves (pk_test_, sk_test_) e criar 2 produtos no Stripe Dashboard (CRM+IA R$199/mês, CRM+IA+SDR R$399/mês). Depois configurar os Price IDs no .env.local.
      Bloqueio: aguardando chaves do usuário
- [ ] Criar 3 contas de teste (admin, gerente, corretor) com senha 123456
      Contexto: emails aleatórios, testar cada perfil de acesso. Admin via signup, gerente e corretor via convite.
      Depende de: app rodando localmente ou na Vercel
- [ ] Rodar seed.sql para popular o sistema
      Contexto: supabase/seed.sql já criado com 20 imóveis, 15 clientes, 10 negócios, 15 atividades. Rodar no Supabase SQL Editor após criar as contas.
      Depende de: contas criadas
- [ ] Validar permissões por perfil
      Contexto: admin vê tudo, gerente vê registros mas não config, corretor vê só os dele
      Depende de: seed rodado
- [ ] Validar fluxo Stripe end-to-end
      Contexto: checkout, webhook, portal, upgrade, cancelamento — cartão de teste 4242 4242 4242 4242
      Depende de: Stripe configurado
- [ ] Deploy na Vercel
      Contexto: conectar GitHub, env vars, build de produção, webhook Stripe para URL final
- [ ] Site institucional do LyneImob (mesmo projeto)
      Contexto: landing page, funcionalidades, preços, contato — rotas públicas no mesmo Next.js, design profissional focado em conversão

---

## ✅ A Validar

> Tarefas concluídas pelo Claude que aguardam sua validação manual.

(nada aguardando validação)

---

## 💡 Orientações Futuras

> Ideias para pensar quando os blocos acima estiverem concluídos.

(nenhuma ideia registrada)

---

## ✔️ Concluído

> Histórico de entregas em ordem cronológica de desenvolvimento.

- [x] Auditoria e padronização do Design System — 6 tokens semânticos, 4 variantes (Badge/Button), 150+ cores substituídas em ~25 arquivos, tipografia e spacing padronizados ✓ validado (2026-03-15)
- [x] Componentes reutilizáveis — constantes centralizadas, StatusBadge, ConfirmacaoExclusao, PaginacaoListagem, useAcaoIA, useFiltrosListagem (9 criados, 6 excluídos, ~25 modificados) ✓ validado por auditoria (2026-03-16)
- [x] Auditoria e limpeza geral — constantes negócios, formulários com constantes, StatusBadge expandido, useAcaoIA expandido, formatadores centralizados, EstadoVazio, design system fix, console.error padronizados (3 novos, ~40 modificados) ✓ validado por auditoria (2026-03-16)
- [x] Auditoria visual completa — headers responsivos (6 páginas), botão Voltar (4 formulários), cards padronizados com hover+StatusBadge (6 componentes), filtros alinhados (3 componentes), paginação reutilizável (3 páginas), tipografia Kanban, estado vazio (~22 arquivos) ✓ validado (2026-03-16)
- [x] Gestão de canais de publicação por imóvel (site e portais) — migration 014, Switch UI, toggles no formulário, filtros em 4 queries públicas, badges no card, card Publicação no detalhe, filtro de canal no CRM ✓ validado por auditoria (2026-03-16)
- [x] Dashboard com dados reais — 3 queries Supabase (negócios abertos, clientes, imóveis disponíveis) ✓ validado por auditoria (2026-03-16)
- [x] Modo escuro — ThemeProvider + toggle no header (ícone Sol/Lua) ✓ validado por auditoria (2026-03-16)
- [x] Validação OLX/VivaReal — conformidade XML VRSync + rota de validação + fallback webhook ✓ validado por auditoria (2026-03-16)
- [x] Busca global no CRM (Bloco 3) — Command palette Ctrl+K, 4 queries paralelas, ações rápidas, navegação por teclado, StatusBadge ✓ validado por auditoria (2026-03-16)
- [x] Onboarding guiado para novos usuários (Bloco 4) — Tour Onborda 4 passos + checklist primeiros passos + migration 015 + hook TanStack Query ✓ validado por auditoria (2026-03-16)
- [x] Polimento visual final (frontend-design) — auth split screen, AlertCircle/CheckCircle2 nos alertas, badge trial, dark mode toggle, dashboard com ícones coloridos + grid responsivo + ações rápidas ✓ validado por auditoria (2026-03-16)
- [x] Gestão de instância WhatsApp — migration 017, wrapper Uazapi (criar/conectar/status/desconectar/webhook), Server Actions, hook com polling, componente ConexaoWhatsapp com 4 estados visuais, fix multi-tenant webhook ✓ validado por auditoria (2026-03-16)
- [x] Sugestão automática de próxima ação por negócio — migration 018, prompt JSON estruturado, fire-and-forget ao criar/mover negócio, Kanban card com sugestão resumida, card completo no detalhe com botão "Criar Atividade", formulário pré-preenchido via searchParams ✓ validado por auditoria (2026-03-16)
- [x] Resumo semanal gerado por IA — migration 016, Server Action com coleta de métricas + OpenAI, componente CardResumoSemanal no dashboard, cache no banco (1x por semana), botão regenerar ✓ validado por auditoria (2026-03-16)
- [x] Importação em massa de imóveis (CSV/Excel) — wizard 3 etapas (upload → preview → resultado), papaparse + xlsx, mapeamento de colunas com aliases PT-BR, Zod, batch insert 50, limite plano, relatório erros, modelo dinâmico ✓ validado por auditoria (2026-03-16)
- [x] Exportação de dados (relatórios PDF, planilhas Excel) — botão "Exportar" em 4 listagens, dropdown Excel/PDF, respeita filtros, geração client-side (xlsx + jspdf-autotable), Server Actions filtradas, PDF azul-marinho + paginação, limite 5000 ✓ validado por auditoria (2026-03-16)
- [x] Ajustes de billing + seed de dados de teste — página /planos com números reais de uso (corretores, imóveis, conversas IA) + seed.sql com 20 imóveis, 15 clientes, 10 negócios, 15 atividades ✓ validado por auditoria (2026-03-16)
