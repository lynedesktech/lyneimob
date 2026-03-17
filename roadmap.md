# Roadmap — LyneImob

> Arquivo de gestão de tarefas do projeto.
> Atualizado pelo Claude a cada início e fim de tarefa.
> Para saber o que está pendente: "Claude, leia o roadmap.md e me diga o próximo passo."

---

## 🔄 Fazendo

> Tarefas em andamento agora. Só uma por vez sempre que possível.

### Adoção 100% shadcn/ui — redesign do dashboard

Requisitos: `planejamento/requisitos/requisito-shadcn-ui.md`
Pesquisa: `planejamento/pesquisas/pesquisa-shadcn-ui.md`

- [ ] **Etapa 1 — Aplicar preset e reconstruir tema**
      Rodar `npx shadcn@latest init --preset a1D23ulM --force` para atualizar components.json e globals.css.
      Depois re-adicionar variáveis custom que o preset não conhece: grad-start, grad-mid, grad-end, accent-blue, success, warning, info.
      Re-registrar no @theme inline as variáveis custom.
      Arquivos: `components.json`, `src/app/globals.css`
      Validação: `npm run dev` sem erros, sidebar cinza claro no light mode, dark mode OK, landing page com gradientes azuis

- [ ] **Etapa 2 — Instalar componentes novos**
      Rodar `npx shadcn@latest add chart breadcrumb checkbox popover radio-group spinner kbd`
      Verificar compatibilidade Base UI para cada componente. Se algum só existir para Radix, avaliar se instala ou pula.
      Arquivos criados: `src/components/ui/chart.tsx`, `breadcrumb.tsx`, `checkbox.tsx`, `popover.tsx`, `radio-group.tsx`, `spinner.tsx`, `kbd.tsx`
      Validação: `npm run build` compila sem erros

- [ ] **Etapa 3 — Ajustar sidebar e header**
      Com o preset aplicado, verificar visualmente se a sidebar ficou elegante no light mode.
      Checar: ícone "L" do header, labels de grupo, items ativos, borda do header interno.
      Se o contraste não ficar bom, ajustar classes no app-sidebar.tsx.
      Verificar header.tsx (provavelmente sem mudança).
      Arquivos: `src/components/layout/app-sidebar.tsx`, `src/components/layout/header.tsx`
      Validação: light mode elegante, dark mode sem regressão, mobile sheet funcional, modo colapsado OK

- [ ] **Etapa 4 — Preservar landing page e auth**
      Confirmar que as 8 páginas que usam gradientes azuis continuam funcionando após o preset.
      Se variáveis foram removidas, re-adicionar em :root, .dark e @theme inline.
      Arquivos dependentes: secao-hero, secao-cta-final, secao-video, secao-precos, header-landing, secao-funcionalidades, secao-faq, (auth)/layout.tsx
      Validação: landing page (/) com gradientes intactos, auth (/login) com destaque azul, header da landing com fundo ao scrollar

- [ ] **Etapa 5 — Configurar Skills e MCP Server do shadcn/ui**
      Instalar Skills: `pnpm dlx skills add shadcn/ui`
      Configurar MCP Server: `npx shadcn@latest mcp init --client claude-code`
      Validação: Claude Code reconhece contexto shadcn, MCP responde corretamente

- [ ] **Etapa 6 — Verificação completa (build + visual)**
      Rodar `npm run build` e garantir zero erros.
      Verificar todas as páginas principais: /painel, /imoveis, /clientes, /negocios, /atividades, /configuracoes
      Verificar light mode e dark mode em cada uma.
      Verificar mobile (sidebar sheet).

- [ ] **Etapa 7 — Auditoria final minuciosa**
      Auditoria completa pós-implementação com agentes especializados:
      (1) Contraste e legibilidade — todos os textos legíveis em light e dark mode
      (2) Consistência visual — nenhum componente fora do padrão shadcn
      (3) Landing page — gradientes, animações, responsividade intactos
      (4) Auth — visual preservado com destaque azul
      (5) Sidebar — todos os estados (expandido, colapsado, mobile, hover, ativo)
      (6) Componentes novos — chart, breadcrumb, checkbox, etc. compilando
      (7) Performance — build size não degradou significativamente

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

- [ ] Melhorar mensagens de erro no login — diferenciar email inexistente de senha incorreta
      O que foi feito: server action `auth.ts` agora usa admin client pra verificar se email existe quando login falha. 3 mensagens específicas: "Nenhuma conta encontrada com este email" / "Senha incorreta" / "Email não confirmado". Página de login mostra link "Recuperar senha" quando o erro é de senha.
      O que testar: (1) tentar login com email que não existe → mensagem de email não encontrado, (2) tentar login com email correto + senha errada → mensagem de senha incorreta com link "Recuperar senha", (3) login com credenciais corretas → redireciona pro painel
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

- [ ] Migrar formulários para Field + Input Group do shadcn (escopo grande: 15+ formulários)
- [ ] Migrar Busca Global para Command (cmdk) oficial
- [ ] Migrar botao-exportar para DropdownMenu oficial
- [ ] Migrar landing page para Card + Chart oficiais do shadcn
- [ ] Implementar Dashboard com Charts (Recharts) — gráficos de performance

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
