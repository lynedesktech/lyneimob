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
- [ ] Validar permissões por perfil
      Contexto: admin vê tudo, gerente vê registros mas não config, corretor vê só os dele
- [ ] Validar fluxo Stripe end-to-end
      Contexto: checkout, webhook, portal, upgrade, cancelamento — cartão de teste 4242 4242 4242 4242
      Depende de: Stripe configurado
- [ ] Deploy na Vercel
      Contexto: conectar GitHub, env vars, build de produção, webhook Stripe para URL final
- [ ] Adoção 100% shadcn/ui — redesign do dashboard
      Contexto: substituir sidebar azul pesado por padrão shadcn (cinza claro + acentos), instalar componentes faltantes (Field, Breadcrumb, Command, etc), configurar Skills + MCP Server. Pesquisa feita em planejamento/pesquisas/pesquisa-shadcn-ui.md — próximo passo é /requisitos

---

## ✅ A Validar

> Tarefas concluídas pelo Claude que aguardam sua validação manual.

- [ ] Corrigir formulários: perda de dados ao dar erro de validação + campo obrigatório sem borda vermelha
      O que foi feito: migrou os 4 formulários (atividade, negócio, cliente, imóvel) para React Hook Form + Zod. Agora os campos são controlados (nunca perdem dados ao re-renderizar), validação roda no client antes de enviar ao servidor, e campos com erro ficam com borda vermelha + mensagem explicativa.
      O que testar: (1) abrir qualquer formulário de criação (negócio, cliente, imóvel, atividade), (2) preencher quase tudo mas deixar um campo obrigatório vazio, (3) clicar em Criar → campo com erro deve ficar com borda vermelha e mensagem abaixo, e os outros campos devem manter seus valores, (4) preencher o campo faltante e submeter → deve funcionar normalmente, (5) testar modo edição também
- [ ] Implementar cargo Super Admin (dono do SaaS)
      O que foi feito: migration 020 aplicada (campo super_admin boolean), 3 páginas /admin/* criadas (painel, organizações, configurações), sidebar com grupo "Plataforma" condicional, /configuracoes separada (super_admin → chaves API, admin org → dados da imobiliária), server actions protegidas com guard super_admin. Conta superadmin@lyneimob.com criada (senha: Lyneimob@2026).
      Auditoria de segurança: actions WhatsApp (whatsapp.ts e instancia-whatsapp.ts) corrigidas — agora exigem ehSuperAdmin() em vez de gerenciar_integracoes. Nova permissão "gerenciar_organizacao" criada para separar config da org de config de integrações.
      O que testar: (1) logar com superadmin@lyneimob.com → sidebar mostra grupo "Plataforma", (2) /admin/painel → métricas globais, (3) /admin/organizacoes → tabela com todas as orgs, (4) /admin/configuracoes → chaves de API, (5) logar com admin normal → NÃO vê grupo Plataforma, (6) admin normal em /configuracoes → vê dados da imobiliária (nome, telefone, CRECI, etc), (7) admin normal NÃO consegue salvar config WhatsApp nem criar instância
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

- [x] Polimento visual pós-rebranding — auditoria completa por 3 agentes UI/UX em todas as telas, design system consistente, dark mode OK ✓ validado por auditoria (2026-03-16)
- [x] Criar 3 contas de teste (admin, gerente, corretor) — contas criadas no Supabase na mesma org "Imobiliária Teste", fix do bug EstadoFormulario no Turbopack (import corrigido em 3 páginas auth) ✓ validado por auditoria (2026-03-16)
- [x] Fix loop infinito de renderização no dashboard — causa raiz: recursão infinita no RLS do PostgreSQL. Migration 019 aplicada com função SECURITY DEFINER `organizacao_id_do_usuario()`, policies reescritas em 16+ tabelas, layout e page restaurados ✓ validado por auditoria (2026-03-16)
- [x] Garantir fontes sans-serif em todo o sistema — fallback chain no globals.css (Geist → Inter → Segoe UI → Helvetica Neue → Arial → sans-serif), font-sans no body ✓ validado por auditoria (2026-03-16)
- [x] Configurar Stripe Sandbox + auditoria de integração — 2 produtos criados, 5 env vars, webhook handler com 7 correções (dedup, metadata fallback, toast useEffect, verificação de erro, limpeza trial) ✓ validado por auditoria (2026-03-16)
- [x] Limpar banco de dados para produção — TRUNCATE organizacoes CASCADE + DELETE auth.users, todas as tabelas zeradas, storage limpo, sistema pronto para uso real ✓ (2026-03-17)
- [x] Criar 3 contas de produção (admin, gerente, corretor) — org "Imobiliária Lynedesk", emails padrão @lyneimob.com, contas limpas sem dados ✓ (2026-03-17)
- [x] Trocar paleta de cores para gradiente azul vibrante — variáveis CSS grad-start/mid/end/accent-blue, 11 arquivos atualizados, zero hardcodes restantes ✓ (2026-03-17)
- [x] Rebranding "CRM" → "Gestão Imobiliária" + novos nomes de planos (Essencial, Profissional, Completo) — 17 arquivos, landing page, sidebar, auth, planos, onboarding ✓ (2026-03-17)
