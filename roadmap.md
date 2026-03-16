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

- [ ] Adicionar favicon e meta tags da marca Lynedesk
      Contexto: criar favicon.ico e apple-touch-icon com o ícone "L" da Lynedesk. Atualizar app/layout.tsx com metadata da marca.
      Bloqueio: aguardando ícone "L" em SVG do usuário
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

(nenhuma tarefa aguardando validação)

---

## 💡 Orientações Futuras

> Ideias para pensar quando os blocos acima estiverem concluídos.

(nenhuma ideia registrada)

---

## ✔️ Concluído

> Histórico de entregas em ordem cronológica de desenvolvimento.

- [x] Exportação de dados (relatórios PDF, planilhas Excel) — botão "Exportar" em 4 listagens, dropdown Excel/PDF, respeita filtros, geração client-side (xlsx + jspdf-autotable), Server Actions filtradas, PDF azul-marinho + paginação, limite 5000 ✓ validado por auditoria (2026-03-16)
- [x] Ajustes de billing + seed de dados de teste — página /planos com números reais de uso (corretores, imóveis, conversas IA) + seed.sql com 20 imóveis, 15 clientes, 10 negócios, 15 atividades ✓ validado por auditoria (2026-03-16)
- [x] Integrar logos Lynedesk + paleta #023373 + tipografia Geist Sans — branding completo em todo o projeto ✓ validado por auditoria (2026-03-16)
- [x] Polimento visual pós-rebranding — auditoria completa por 3 agentes UI/UX em todas as telas, design system consistente, dark mode OK ✓ validado por auditoria (2026-03-16)
- [x] Criar 3 contas de teste (admin, gerente, corretor) — contas criadas no Supabase na mesma org "Imobiliária Teste", fix do bug EstadoFormulario no Turbopack (import corrigido em 3 páginas auth) ✓ validado por auditoria (2026-03-16)
- [x] Fix loop infinito de renderização no dashboard — causa raiz: recursão infinita no RLS do PostgreSQL. Migration 019 aplicada com função SECURITY DEFINER `organizacao_id_do_usuario()`, policies reescritas em 16+ tabelas, layout e page restaurados ✓ validado por auditoria (2026-03-16)
- [x] Garantir fontes sans-serif em todo o sistema — fallback chain no globals.css (Geist → Inter → Segoe UI → Helvetica Neue → Arial → sans-serif), font-sans no body ✓ validado por auditoria (2026-03-16)
- [x] Configurar Stripe Sandbox + auditoria de integração — 2 produtos criados, 5 env vars, webhook handler com 7 correções (dedup, metadata fallback, toast useEffect, verificação de erro, limpeza trial) ✓ validado por auditoria (2026-03-16)
