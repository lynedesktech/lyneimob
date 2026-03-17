# Roadmap — LyneImob

> Arquivo de gestão de tarefas do projeto.
> Atualizado pelo Claude a cada início e fim de tarefa.
> Auditoria automática roda a cada 1 hora sobre tarefas em "Pronto".

---

## 🔄 Fazendo

> Tarefa em andamento agora. Só uma por vez.

### Adoção 100% shadcn/ui — redesign do dashboard

Requisitos: `planejamento/requisitos/requisito-shadcn-ui.md`
Pesquisa: `planejamento/pesquisas/pesquisa-shadcn-ui.md`

- [x] **Etapa 1 — Aplicar preset e reconstruir tema** ✓
      Preset a1D23ulM (Mira/Blue) aplicado via CLI. components.json atualizado (base-nova → base-mira).
      16 componentes UI atualizados, globals.css regenerado com sidebar cinza claro.
      Variáveis custom preservadas (grad-start/mid/end, accent-blue, success/warning/info).
      Variantes success/warning/info re-adicionadas no Badge e Button. Fonte fallback restaurada.
      Build 100% limpo (51 rotas, 0 erros).

- [x] **Etapa 2 — Instalar componentes novos** ✓
      7 componentes instalados via CLI: chart, breadcrumb, checkbox, popover, radio-group, spinner, kbd.
      Todos usam Base UI (não Radix) — checkbox, popover e radio-group importam de @base-ui/react.
      Recharts v2.15.4 instalado como dependência (para chart).
      Variáveis --chart-1 a --chart-5 já existiam no globals.css.
      Build 100% limpo (51 rotas, 0 erros).

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

## ✅ Pronto

> Implementação concluída, aguardando auditoria automática (roda a cada 1 hora).

- [ ] Corrigir login: preservar email ao errar + mensagens consistentes + resetar senhas
      O que foi feito: (1) formulário de login agora preserva o email digitado quando dá erro (só a senha limpa), (2) mensagem de senha incorreta agora diz "Esqueci minha senha" em vez de "recupere sua senha" — consistente com o link do formulário, (3) senhas dos 4 usuários padrão (admin, gerente, corretor, superadmin @lyneimob.com) resetadas para nova senha padrão.
      O que auditar: (1) tipo EstadoFormulario tem campo email, (2) auth.ts retorna email em todos os cenários de erro, (3) login page usa defaultValue no input email, (4) texto do link inline diz "Esqueci minha senha", (5) build compila sem erros

- [ ] Reorganizar sidebar + página de configurações como hub central
      O que foi feito: /configuracoes transformada em hub com 6 cards (Empresa, WhatsApp, Equipe, Distribuição, Portais, Meu Site). Sidebar simplificada de 4→3 grupos (removido grupo Canais, Conversas movida pra Gestão). Rotas antigas (/usuarios, /meu-site, /integracoes) viram redirects. Links internos e revalidatePaths atualizados. Fix: variant "success" no Button + variant "info" no Badge que bloqueavam o build.
      O que auditar: (1) sidebar com 3 grupos (Principal, Gestão, Administração), (2) /configuracoes mostra 6 cards, (3) cada card abre sub-página com botão Voltar, (4) rotas antigas redirecionam corretamente, (5) build compila sem erros
- [ ] Melhorar mensagens de erro no login — diferenciar email inexistente de senha incorreta
      O que foi feito: server action `auth.ts` agora usa admin client pra verificar se email existe quando login falha. 3 mensagens específicas: "Nenhuma conta encontrada com este email" / "Senha incorreta" / "Email não confirmado". Página de login mostra link "Recuperar senha" quando o erro é de senha.
      O que auditar: (1) server action auth.ts usa admin client corretamente, (2) 3 cenários de erro cobertos, (3) link "Recuperar senha" aparece só no erro de senha, (4) build compila sem erros
- [ ] Corrigir formulários: perda de dados ao dar erro de validação + campo obrigatório sem borda vermelha
      O que foi feito: migrou os 4 formulários (atividade, negócio, cliente, imóvel) para React Hook Form + Zod. Agora os campos são controlados (nunca perdem dados ao re-renderizar), validação roda no client antes de enviar ao servidor, e campos com erro ficam com borda vermelha + mensagem explicativa.
      O que auditar: (1) 4 formulários usam React Hook Form + Zod, (2) campos controlados (sem perda de dados), (3) borda vermelha em campos com erro, (4) build compila sem erros
- [ ] Implementar cargo Super Admin (dono do SaaS)
      O que foi feito: migration 020 aplicada (campo super_admin boolean), 3 páginas /admin/* criadas (painel, organizações, configurações), sidebar com grupo "Plataforma" condicional, /configuracoes separada (super_admin → chaves API, admin org → dados da imobiliária), server actions protegidas com guard super_admin. Conta superadmin@lyneimob.com criada (senha: Lyneimob@2026).
      Auditoria de segurança: actions WhatsApp (whatsapp.ts e instancia-whatsapp.ts) corrigidas — agora exigem ehSuperAdmin() em vez de gerenciar_integracoes. Nova permissão "gerenciar_organizacao" criada para separar config da org de config de integrações.
      O que auditar: (1) migration 020 existe e está correta, (2) páginas /admin/* protegidas com guard super_admin, (3) sidebar condicional funciona, (4) actions WhatsApp exigem ehSuperAdmin(), (5) build compila sem erros
- [ ] Remover separadores da sidebar + criar página Meu Perfil + corrigir erro menu usuário
      O que auditar: (1) sidebar sem separadores entre grupos, (2) página /meu-perfil existe com formulário, (3) menu do usuário abre corretamente, (4) build compila sem erros
- [ ] Corrigir erros de produção — fix crash /negocios/[id], login com imagem de imóvel, onboarding auto-detecção, deploy de landing page + dashboard /painel + middleware
      O que auditar: (1) /negocios/[id] não crasha, (2) página de login tem imagem, (3) middleware configurado corretamente, (4) build compila sem erros

---

## 🔧 A Corrigir

> Tarefas que a auditoria automática reprovou. Têm prioridade sobre "A Fazer".

(nenhuma tarefa no momento)

---

## ✔️ Concluído

> Histórico de entregas. Manter as 10 mais recentes.

- [x] Polimento visual pós-rebranding — auditoria completa por 3 agentes UI/UX em todas as telas, design system consistente, dark mode OK ✓ auditoria (2026-03-16)
- [x] Criar 3 contas de teste (admin, gerente, corretor) — contas criadas no Supabase na mesma org "Imobiliária Teste", fix do bug EstadoFormulario no Turbopack ✓ auditoria (2026-03-16)
- [x] Fix loop infinito de renderização no dashboard — causa raiz: recursão infinita no RLS do PostgreSQL. Migration 019, policies reescritas em 16+ tabelas ✓ auditoria (2026-03-16)
- [x] Garantir fontes sans-serif em todo o sistema — fallback chain no globals.css, font-sans no body ✓ auditoria (2026-03-16)
- [x] Configurar Stripe Sandbox + auditoria de integração — 2 produtos criados, 5 env vars, webhook handler com 7 correções ✓ auditoria (2026-03-16)
- [x] Limpar banco de dados para produção — TRUNCATE organizacoes CASCADE + DELETE auth.users, sistema pronto para uso real ✓ (2026-03-17)
- [x] Criar 3 contas de produção (admin, gerente, corretor) — org "Imobiliária Lynedesk", emails padrão @lyneimob.com ✓ (2026-03-17)
- [x] Trocar paleta de cores para gradiente azul vibrante — variáveis CSS grad-start/mid/end/accent-blue, 11 arquivos atualizados ✓ (2026-03-17)
- [x] Rebranding "CRM" → "Gestão Imobiliária" + novos nomes de planos — 17 arquivos, landing page, sidebar, auth, planos, onboarding ✓ (2026-03-17)

---

## 💬 Sugestões

> Melhorias e otimizações identificadas pela auditoria automática do sistema.
> O Claude analisa o código a cada hora e sugere o que pode ser melhorado (máximo 5 itens).

(nenhuma sugestão no momento)

---

## 💡 Orientações Futuras

> Ideias para pensar quando os blocos acima estiverem concluídos.

- [ ] Migrar formulários para Field + Input Group do shadcn (escopo grande: 15+ formulários)
- [ ] Migrar Busca Global para Command (cmdk) oficial
- [ ] Migrar botao-exportar para DropdownMenu oficial
- [ ] Migrar landing page para Card + Chart oficiais do shadcn
- [ ] Implementar Dashboard com Charts (Recharts) — gráficos de performance
