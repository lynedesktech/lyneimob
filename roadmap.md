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

- [ ] Exportação de dados (relatórios PDF, planilhas Excel)

---

## ✅ A Validar

> Tarefas concluídas pelo Claude que aguardam sua validação manual.

(nada aguardando validação)

---

## 💡 Orientações Futuras

> Ideias para pensar quando os blocos acima estiverem concluídos.

- [ ] Integração com Google Calendar (atividades ↔ agenda do Google)
- [ ] Integração com e-mail (envio e tracking de abertura)
- [ ] Relatórios e dashboards analíticos (conversão, tempo médio, performance por corretor)
- [ ] Notificações push/email (atividades vencidas, leads novos, negócios parados)
- [ ] IA preditiva — probabilidade de fechamento por negócio
- [ ] App mobile (PWA ou React Native)

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
