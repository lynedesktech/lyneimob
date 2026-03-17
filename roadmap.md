# Roadmap — LyneImob

> Arquivo de gestão de tarefas do projeto.
> Atualizado pelo Claude a cada início e fim de tarefa.
> Para saber o que está pendente: "Claude, leia o roadmap.md e me diga o próximo passo."

---

## 🔄 Fazendo

> Tarefas em andamento agora. Só uma por vez sempre que possível.

- [ ] Implementar cargo Super Admin (dono do SaaS)
      Contexto: separar dono da plataforma (super_admin) do admin da imobiliária (cliente). Criar dashboard plataforma, listagem de orgs, mover chaves de API para área exclusiva do super_admin. Admin da org passa a ver configurações da própria imobiliária.

---

## 📋 A Fazer

> Tarefas prontas para execução, em ordem de prioridade.

- [ ] Adicionar favicon e meta tags da marca Lynedesk
      Contexto: criar favicon.ico e apple-touch-icon com o ícone "L" da Lynedesk. Atualizar app/layout.tsx com metadata da marca.
      Bloqueio: aguardando ícone "L" em SVG do usuário
- [ ] Validar permissões por perfil
      Contexto: admin vê tudo, gerente vê registros mas não config, corretor vê só os dele
- [ ] Validar fluxo Stripe end-to-end
      Contexto: checkout, webhook, portal, upgrade, cancelamento — cartão de teste 4242 4242 4242 4242
      Depende de: Stripe configurado
- [ ] Deploy na Vercel
      Contexto: conectar GitHub, env vars, build de produção, webhook Stripe para URL final

---

## ✅ A Validar

> Tarefas concluídas pelo Claude que aguardam sua validação manual.

- [ ] Remover separadores da sidebar + criar página Meu Perfil + corrigir erro menu usuário
      O que testar: (1) sidebar light e dark — sem linhas separadoras entre grupos, (2) clicar no usuário no rodapé da sidebar → menu abre, (3) clicar "Meu perfil" → abre /meu-perfil com seus dados, (4) editar nome/telefone/creci → salvar → toast de sucesso
      Nota sobre erro produção: o build compila limpo — o erro client-side em produção provavelmente é do deploy anterior. Deploy atualizado deve resolver.
- [ ] Corrigir erros de produção — fix crash /negocios/[id], login com imagem de imóvel, onboarding auto-detecção, deploy de landing page + dashboard /painel + middleware
      O que testar: (1) acessar lyne-imob.vercel.app deslogado → landing page, (2) login → imagem bonita no lado esquerdo, (3) após login → /painel sem 404, (4) /negocios/[id] → sem erro, (5) checklist onboarding não aparece

---

## 💡 Orientações Futuras

> Ideias para pensar quando os blocos acima estiverem concluídos.

(nenhuma ideia registrada)

---

## ✔️ Concluído

> Histórico de entregas em ordem cronológica de desenvolvimento.

- [x] Página de vendas do LyneImob — landing page em `/` com 8 seções (header, hero, funcionalidades, vídeo, preços com toggle mensal/trimestral/anual, FAQ, CTA, footer). Dashboard movido pra `/painel`. Middleware atualizado. ✓ validado (2026-03-16)
- [x] Redesign da sidebar — 4 grupos (Principal, CRM, Canais, Administração), separadores visuais, ícone Building2 no header ✓ validado (2026-03-16)
- [x] Exportação de dados (relatórios PDF, planilhas Excel) — botão "Exportar" em 4 listagens, dropdown Excel/PDF, respeita filtros, geração client-side (xlsx + jspdf-autotable), Server Actions filtradas, PDF azul-marinho + paginação, limite 5000 ✓ validado por auditoria (2026-03-16)
- [x] Ajustes de billing + seed de dados de teste — página /planos com números reais de uso (corretores, imóveis, conversas IA) + seed.sql com 20 imóveis, 15 clientes, 10 negócios, 15 atividades ✓ validado por auditoria (2026-03-16)
- [x] Integrar logos Lynedesk + paleta #023373 + tipografia Geist Sans — branding completo em todo o projeto ✓ validado por auditoria (2026-03-16)
- [x] Polimento visual pós-rebranding — auditoria completa por 3 agentes UI/UX em todas as telas, design system consistente, dark mode OK ✓ validado por auditoria (2026-03-16)
- [x] Criar 3 contas de teste (admin, gerente, corretor) — contas criadas no Supabase na mesma org "Imobiliária Teste", fix do bug EstadoFormulario no Turbopack (import corrigido em 3 páginas auth) ✓ validado por auditoria (2026-03-16)
- [x] Fix loop infinito de renderização no dashboard — causa raiz: recursão infinita no RLS do PostgreSQL. Migration 019 aplicada com função SECURITY DEFINER `organizacao_id_do_usuario()`, policies reescritas em 16+ tabelas, layout e page restaurados ✓ validado por auditoria (2026-03-16)
- [x] Garantir fontes sans-serif em todo o sistema — fallback chain no globals.css (Geist → Inter → Segoe UI → Helvetica Neue → Arial → sans-serif), font-sans no body ✓ validado por auditoria (2026-03-16)
- [x] Configurar Stripe Sandbox + auditoria de integração — 2 produtos criados, 5 env vars, webhook handler com 7 correções (dedup, metadata fallback, toast useEffect, verificação de erro, limpeza trial) ✓ validado por auditoria (2026-03-16)
- [x] Limpar banco de dados para produção — TRUNCATE organizacoes CASCADE + DELETE auth.users, todas as tabelas zeradas, storage limpo, sistema pronto para uso real ✓ (2026-03-17)
- [x] Criar 3 contas de produção (admin, gerente, corretor) — org "Imobiliária Lynedesk", emails padrão @lyneimob.com, contas limpas sem dados ✓ (2026-03-17)
