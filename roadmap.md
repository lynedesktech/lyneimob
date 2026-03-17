# Roadmap — LyneImob

> Registro completo de todas as atividades do projeto.
> O Claude atualiza automaticamente a cada início e fim de tarefa.
> Nenhuma demanda se perde — tudo fica documentado aqui.

---

## 📋 A Fazer

> Tarefas prontas para execução, em ordem de prioridade.

- [ ] Validar fluxo Stripe end-to-end
      Contexto: checkout, webhook, portal, upgrade, cancelamento — cartão de teste 4242 4242 4242 4242
      Depende de: Stripe configurado
- [ ] Validar permissões por perfil
      Contexto: admin vê tudo, gerente vê registros mas não config, corretor vê só os dele
- [ ] Deploy na Vercel
      Contexto: conectar GitHub, env vars, build de produção, webhook Stripe para URL final
- [ ] Implementar Dashboard com Charts (Recharts)
      Contexto: gráficos de performance no /painel — imóveis ativos, negócios no funil, receita projetada
- [ ] Adicionar favicon e meta tags da marca Lynedesk
      Contexto: criar favicon.ico e apple-touch-icon com o ícone "L" da Lynedesk. Atualizar app/layout.tsx com metadata da marca.
      Bloqueio: aguardando ícone "L" em SVG do usuário

---

## ✅ Pronto

> Implementação concluída. Aguardando validação do usuário.

- [ ] Wizard de conexão WhatsApp — onboarding passo a passo
      O que foi feito: criado `src/components/configuracoes/wizard-whatsapp.tsx` com 4 passos: (1) credenciais Uazapi com teste de conexão, (2) QR code com polling automático de status (avança sozinho ao conectar), (3) configurar agente IA com seletor visual de horário e corretor por nome, (4) tela de sucesso. `conteudo-whatsapp-config.tsx` atualizado para exibir wizard quando não configurado e UI normal quando já configurado.
      O que testar: (1) ir em /configuracoes/whatsapp sem ter Uazapi configurada — deve aparecer o wizard, (2) passo 1: preencher URL e token inválidos — deve mostrar erro; válidos — avança, (3) passo 2: QR code aparece, ao escanear avança automaticamente, (4) passo 3: seletor de dias funciona, corretor aparece por nome, "Pular" avança, (5) passo 4: tela de sucesso com botões de navegação, (6) voltar em /configuracoes/whatsapp após conectado — mostra UI normal (sem wizard)

---

## 🔄 Fazendo

> Tarefa em andamento agora.

- [ ] Negócios: visualização Kanban + Lista com seleção e ações em massa
      O que foi feito: (1) hook `use-lista-negocios.ts` para lista plana com filtros e paginação, (2) `toggle-visualizacao.tsx` para alternar kanban/lista via URL `?visao=`, (3) `filtros-lista-negocios.tsx` com busca, status, etapa, corretor, tipo e valor, (4) `lista-negocios.tsx` com tabela, checkboxes, select all e seleção múltipla, (5) `barra-acoes-massa.tsx` fixa no rodapé com dialogs para excluir, mover etapa, ganhar e perder, (6) 4 novas server actions de massa em `negocios.ts`, (7) `page.tsx` atualizado com toggle no header.
      O que testar: (1) /negocios abre em Kanban (padrão), (2) ícone de lista troca para tabela, (3) filtros da lista funcionam, (4) clicar linha seleciona e aparece barra no rodapé, (5) "selecionar todos" marca a página inteira, (6) Excluir em massa abre dialog de confirmação, (7) Mover etapa carrega etapas do pipeline, (8) Ganhar e Perder em massa funcionam.

- [ ] Corrigir visual das páginas de auth — texto branco + espaçamento CardFooter
      Contexto: (1) "em um só lugar" aparecia em azul no painel esquerdo do layout de auth — corrigido com text-white explícito no span. (2) Espaçamento entre último campo e botão estava apertado — corrigido no CardFooter (pt-2 → pt-4) propagando para todo o sistema.

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

- [x] **Etapa 3 — Ajustar sidebar e header** ✓
      sidebar-accent fortalecido (0.97 → 0.94) para hover/active visível no light mode.
      Labels de grupo mais legíveis (opacity /50 → /60).
      Item ativo com texto azul (sidebar-primary) + font-semibold para destaque claro.
      Header sem mudança (já estava correto).
      Build 100% limpo (51 rotas, 0 erros).

- [x] **Etapa 4 — Preservar landing page e auth** ✓
      Verificação completa: 7 componentes da landing page usam variáveis CSS corretas (grad-start/mid/end, accent-blue).
      Variáveis preservadas no :root e @theme inline. Auth não depende de gradientes.
      Nenhuma alteração necessária — tudo sobreviveu ao preset.
      Build 100% limpo (51 rotas, 0 erros).

- [x] **Etapa 5 — Configurar Skills e MCP Server do shadcn/ui** ✓
      MCP Server adicionado no .mcp.json (cmd /c npx shadcn@latest mcp). Formato Windows OK.
      Skill shadcn instalada em .claude/skills/shadcn/ e .agents/skills/shadcn/ (42 agents).
      Servidores existentes (context7, gamma) preservados.
      Skill inclui regras de forms, composition, styling, icons, base-vs-radix e CLI.

- [x] **Etapa 6 — Verificação completa (build + visual)** ✓
      Build 100% limpo (51 rotas, 0 erros, 0 warnings relevantes).
      Landing page: gradiente azul vibrante preservado, responsiva, hamburguer mobile funcionando.
      Login: layout split desktop correto, dark mode impecável, mobile centralizado.
      Auth redirect: /painel → /login sem erros (middleware funcionando).
      Dark mode: landing e login verificados — cores corretas em ambos os temas.
      Mobile (390px): login e landing responsivos, header adapta para hamburguer.
      Páginas do dashboard (painel, imoveis, clientes, etc.) requerem login — verificar manualmente após logar.

- [ ] **Etapa 7 — Auditoria final minuciosa**
      Auditoria completa pós-implementação com agentes especializados:
      (1) Contraste e legibilidade — todos os textos legíveis em light e dark mode
      (2) Consistência visual — nenhum componente fora do padrão shadcn
      (3) Landing page — gradientes, animações, responsividade intactos
      (4) Auth — visual preservado
      (5) Sidebar — todos os estados (expandido, colapsado, mobile, hover, ativo)
      (6) Componentes novos — chart, breadcrumb, checkbox, etc. compilando
      (7) Performance — build size não degradou significativamente

---

## ✅ Pronto

> Implementação concluída. Aguardando validação do usuário.
> ⚠️ **8 itens aguardando validação** — testar cada um conforme as instruções antes de mover para Concluído.

- [ ] Wizard de conexão WhatsApp — fluxo de onboarding melhorado
      O que foi feito: (1) novo wizard 4 etapas em `wizard-conexao-whatsapp.tsx` (credenciais → QR code → agente IA → sucesso), (2) `conexao-whatsapp.tsx` agora abre o wizard quando não há credenciais configuradas (em vez do card circular "Ir para Configurações"), (3) `config-whatsapp.tsx` simplificado — removidos campos técnicos URL/token, adicionado seletor visual de horário por dia, corretor por nome em vez de UUID, (4) nova server action `configurarCredenciaisUazapi` com validação real das credenciais, (5) `testarConexaoUazapi` no uazapi.ts para validar antes de salvar.
      O que testar: (1) /configuracoes/whatsapp sem credenciais → deve aparecer wizard passo a passo, (2) inserir URL+token inválidos → erro inline, (3) inserir válidos → avança para QR code, (4) escanear QR → avança automaticamente para step 3, (5) /configuracoes/whatsapp já conectado → formulário sem campos URL/token, com seletor visual de horário e dropdown de corretor

- [ ] Resumo Semanal via Cron (toda segunda-feira às 9h)
      O que foi feito: (1) lógica de geração extraída para `src/lib/resumo-semanal/gerar-resumo.ts`, (2) `src/lib/verificar-limites.ts` refatorado para aceitar cliente Supabase opcional, (3) rota `src/app/api/cron/resumo-semanal/route.ts` criada — protegida por CRON_SECRET, processa orgs em lotes de 10, (4) `vercel.json` criado com schedule `0 12 * * 1` (segunda 9h Brasília), (5) server action simplificada + `regenerarResumoSemanal` usa admin client, (6) componente do dashboard atualizado com mensagens amigáveis.
      O que testar: (1) abrir /painel — deve carregar sem chamar OpenAI, (2) se não há resumo: mensagem "gerado toda segunda-feira às 9h", (3) botão ↺ gera e exibe resumo, (4) testar cron com `curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/resumo-semanal`, (5) CRON_SECRET está no .env.local

- [ ] Corrigir login: preservar email ao errar + mensagens consistentes + resetar senhas
      O que foi feito: (1) formulário preserva o email digitado quando dá erro (só a senha limpa), (2) mensagem de senha incorreta diz "Esqueci minha senha" — consistente com o link do formulário, (3) senhas dos 4 usuários padrão resetadas.
      O que testar: (1) tipo EstadoFormulario tem campo email, (2) auth.ts retorna email em todos os cenários de erro, (3) login page usa defaultValue no input email, (4) texto do link inline diz "Esqueci minha senha", (5) build compila sem erros

- [ ] Reorganizar sidebar + página de configurações como hub central
      O que foi feito: /configuracoes transformada em hub com 6 cards (Empresa, WhatsApp, Equipe, Distribuição, Portais, Meu Site). Sidebar simplificada de 4→3 grupos. Rotas antigas viram redirects.
      O que testar: (1) sidebar com 3 grupos (Principal, Gestão, Administração), (2) /configuracoes mostra 6 cards, (3) cada card abre sub-página com botão Voltar, (4) rotas antigas redirecionam, (5) build compila sem erros

- [ ] Melhorar mensagens de erro no login — diferenciar email inexistente de senha incorreta
      O que foi feito: 3 mensagens específicas: "Nenhuma conta encontrada com este email" / "Senha incorreta" / "Email não confirmado". Página de login mostra link "Recuperar senha" quando o erro é de senha.
      O que testar: (1) 3 cenários de erro cobertos, (2) link "Recuperar senha" aparece só no erro de senha, (3) build compila sem erros

- [ ] Corrigir formulários: perda de dados ao dar erro de validação + campo obrigatório sem borda vermelha
      O que foi feito: 4 formulários (atividade, negócio, cliente, imóvel) migrados para React Hook Form + Zod. Campos controlados, validação client-side, borda vermelha em campos com erro.
      O que testar: (1) 4 formulários usam React Hook Form + Zod, (2) campos não perdem dados ao re-renderizar, (3) borda vermelha em campos com erro, (4) build compila sem erros

- [ ] Implementar cargo Super Admin (dono do SaaS)
      O que foi feito: migration 020 (super_admin boolean), 3 páginas /admin/*, sidebar condicional, server actions protegidas. Conta superadmin@lyneimob.com criada (senha: Lyneimob@2026).
      O que testar: (1) migration 020 existe e está correta, (2) páginas /admin/* protegidas, (3) sidebar condicional funciona, (4) actions WhatsApp exigem ehSuperAdmin(), (5) build compila sem erros

- [ ] Remover separadores da sidebar + criar página Meu Perfil + corrigir erro menu usuário
      O que testar: (1) sidebar sem separadores entre grupos, (2) página /meu-perfil existe com formulário, (3) menu do usuário abre corretamente, (4) build compila sem erros

- [ ] Corrigir erros de produção — fix crash /negocios/[id], login com imagem de imóvel, onboarding auto-detecção, middleware
      O que testar: (1) /negocios/[id] não crasha, (2) página de login tem imagem, (3) middleware configurado corretamente, (4) build compila sem erros

---

## ✔️ Concluído

> Histórico completo de entregas auditadas e aprovadas.

- [x] Polimento visual pós-rebranding — auditoria completa por 3 agentes UI/UX em todas as telas, design system consistente, dark mode OK (2026-03-16)
- [x] Criar 3 contas de teste (admin, gerente, corretor) — contas criadas no Supabase na mesma org "Imobiliária Teste", fix do bug EstadoFormulario no Turbopack (2026-03-16)
- [x] Fix loop infinito de renderização no dashboard — causa raiz: recursão infinita no RLS do PostgreSQL. Migration 019, policies reescritas em 16+ tabelas (2026-03-16)
- [x] Garantir fontes sans-serif em todo o sistema — fallback chain no globals.css, font-sans no body (2026-03-16)
- [x] Configurar Stripe Sandbox + auditoria de integração — 2 produtos criados, 5 env vars, webhook handler com 7 correções (2026-03-16)
- [x] Limpar banco de dados para produção — TRUNCATE organizacoes CASCADE + DELETE auth.users, sistema pronto para uso real (2026-03-17)
- [x] Criar 3 contas de produção (admin, gerente, corretor) — org "Imobiliária Lynedesk", emails padrão @lyneimob.com (2026-03-17)
- [x] Trocar paleta de cores para gradiente azul vibrante — variáveis CSS grad-start/mid/end/accent-blue, 11 arquivos atualizados (2026-03-17)
- [x] Rebranding "CRM" → "Gestão Imobiliária" + novos nomes de planos — 17 arquivos, landing page, sidebar, auth, planos, onboarding (2026-03-17)

---

## 💬 Sugestões de Refatoração Técnica

> Melhorias identificadas pelo Claude durante o trabalho. Não são urgentes — executar quando houver espaço no roadmap.

- [ ] Migrar formulários para Field + Input Group do shadcn (escopo grande: 15+ formulários)
- [ ] Migrar Busca Global para Command (cmdk) oficial
- [ ] Migrar botao-exportar para DropdownMenu oficial
- [ ] Migrar landing page para Card + Chart oficiais do shadcn
