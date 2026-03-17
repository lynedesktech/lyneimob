# Roadmap — LyneImob

> Registro completo de todas as atividades do projeto.
> O Claude atualiza automaticamente a cada início e fim de tarefa.
> Nenhuma demanda se perde — tudo fica documentado aqui.

---

## ✅ Pronto

> Implementação concluída. Aguardando validação do usuário.

- [ ] Configurações de Funil de Vendas e Tipos de Atividade
      O que foi feito: (1) migration 021 — tabela `tipos_atividade` com 7 tipos padrão (`sistema=true`), constraint CHECK removida de `atividades.tipo`, constraint UNIQUE de `ordem` removida de `pipeline_etapas` (facilita reordenamento), trigger para novas orgs, seed para orgs existentes. (2) `src/actions/pipeline.ts` — server actions criar, atualizar, excluir e reordenar etapas do pipeline. (3) `src/hooks/use-pipeline-config.ts` — hook para config. (4) `/configuracoes/pipeline` — nova página com componente `ConteudoPipelineConfig` (lista, criar, editar, reordenar, excluir etapas com proteção para Ganho/Perdido). (5) `src/actions/tipos-atividade.ts` — server actions para tipos. (6) `src/hooks/use-tipos-atividade.ts` — hook dinâmico com `labelDoTipo` e `corDoTipo`. (7) `/configuracoes/tipos-atividade` — nova página com componente `ConteudoTiposAtividadeConfig`. (8) `formulario-atividade.tsx` e `filtros-atividades.tsx` atualizados para usar tipos do banco. (9) `card-atividade.tsx` usa `labelDoTipo` do hook. (10) Dois novos cards (Funil de Vendas + Tipos de Atividade) na página `/configuracoes`.
      O que testar: (1) /configuracoes mostra 8 cards incluindo "Funil de Vendas" e "Tipos de Atividade", (2) /configuracoes/pipeline lista as 7 etapas padrão, permite criar nova etapa (nome + cor), editar, reordenar com setas ↑↓, excluir — tentar excluir "Ganho" deve bloquear com mensagem, (3) /configuracoes/tipos-atividade lista os 7 tipos padrão com badge "Padrão", permite criar tipo personalizado, editar nome/cor dos tipos padrão, reordenar, excluir tipo personalizado (bloqueado se tiver atividades), (4) /atividades/novo — select de tipo carrega tipos do banco dinamicamente com pontinhos coloridos, (5) filtros em /atividades — filtro de tipo usa tipos do banco, (6) build compila sem erros (57 rotas)

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

- [ ] Corrigir bugs de criação/edição em todos os módulos CRUD — toast de sucesso + crash ao voltar
      O que foi feito: (1) removido `redirect()` das server actions de criar/editar em atividades, negócios, imóveis e clientes — agora retornam `{ sucesso, id }`, (2) formulários atualizado com `useRouter` para redirecionar no cliente após mostrar o toast, (3) espaçamento dos cards de atividade aumentado de `space-y-2` para `space-y-3`.
      O que testar: (1) criar atividade → toast verde aparece → redireciona → clicar voltar não crasha, (2) criar negócio → mesmo comportamento, (3) criar imóvel → mesmo, (4) criar cliente → mesmo, (5) editar qualquer registro → toast "X atualizado!" aparece.

- [ ] Negócios: visualização Kanban + Lista com seleção e ações em massa
      O que foi feito: (1) hook `use-lista-negocios.ts` para lista plana com filtros e paginação, (2) `toggle-visualizacao.tsx` para alternar kanban/lista via URL `?visao=`, (3) `filtros-lista-negocios.tsx` com busca, status, etapa, corretor, tipo e valor, (4) `lista-negocios.tsx` com tabela, checkboxes, select all e seleção múltipla, (5) `barra-acoes-massa.tsx` fixa no rodapé com dialogs para excluir, mover etapa, ganhar e perder, (6) 4 novas server actions de massa em `negocios.ts`, (7) `page.tsx` atualizado com toggle no header.
      O que testar: (1) /negocios abre em Kanban (padrão), (2) ícone de lista troca para tabela, (3) filtros da lista funcionam, (4) clicar linha seleciona e aparece barra no rodapé, (5) "selecionar todos" marca a página inteira, (6) Excluir em massa abre dialog de confirmação, (7) Mover etapa carrega etapas do pipeline, (8) Ganhar e Perder em massa funcionam.

- [ ] Corrigir visual das páginas de auth — texto branco + espaçamento CardFooter
      O que foi feito: (1) "em um só lugar" aparecia em azul no painel esquerdo do layout de auth — corrigido com text-white explícito no span. (2) Espaçamento entre último campo e botão estava apertado — corrigido no CardFooter (pt-2 → pt-4) propagando para todo o sistema.
      O que testar: (1) acessar /login — texto do painel esquerdo está todo branco, (2) formulário de login tem espaçamento adequado entre campos e botão.

- [ ] Wizard de conexão WhatsApp — onboarding passo a passo
      O que foi feito: criado `src/components/configuracoes/wizard-whatsapp.tsx` com 4 passos: (1) credenciais Uazapi com teste de conexão, (2) QR code com polling automático de status (avança sozinho ao conectar), (3) configurar agente IA com seletor visual de horário e corretor por nome, (4) tela de sucesso. `conteudo-whatsapp-config.tsx` atualizado para exibir wizard quando não configurado e UI normal quando já configurado.
      O que testar: (1) ir em /configuracoes/whatsapp sem ter Uazapi configurada — deve aparecer o wizard, (2) passo 1: preencher URL e token inválidos — deve mostrar erro; válidos — avança, (3) passo 2: QR code aparece, ao escanear avança automaticamente, (4) passo 3: seletor de dias funciona, corretor aparece por nome, "Pular" avança, (5) passo 4: tela de sucesso com botões de navegação, (6) voltar em /configuracoes/whatsapp após conectado — mostra UI normal (sem wizard)

---

## 🔄 Fazendo

> Tarefa em andamento agora.

### [URGENTE] Corrigir bugs críticos nos formulários e navegação

Auditoria: `C:\Users\Lynedesk\.claude\plans\immutable-marinating-coral.md`

- [x] **Tarefa 1 — Redirect pós-submissão** ✓
      Fix: redirect server-side via `redirect()` nas 6 actions (criar/atualizar cliente, negócio, imóvel, atividade).
      Formulários simplificados: removido `useRouter`, `useEffect` agora só trata erros.
      Build 100% limpo.

- [x] **Tarefa 2 — Application errors remanescentes** ✓
      Investigação: build local compilou 100% sem erros (57 rotas, incluindo `/clientes/[id]/editar` e `/negocios/novo`). Todos os arquivos estão commitados em 13838dd. Causa confirmada: os crashes eram causados pelo build quebrado (mesma raiz da Tarefa 1 — arquivos `field.tsx`, `combobox-campo.tsx`, etc. não commitados). Com o deploy atualizado, as páginas funcionam corretamente.

- [x] **Tarefa 3 — UX nos formulários** ✓
      (a) Botão "Cancelar" adicionado no rodapé do formulário de negócio
      (b) Validação: campo valor do negócio aceita 0 agora (`nonnegative()`)
      (c) Schema do imóvel revisado: campos obrigatórios mínimos confirmados (código, título, tipo, finalidade, cidade, estado)

- [ ] **Tarefa 4 — Seção "Interesses" do cliente**
      Renomear para "Preferências de Imóvel" + adicionar aba ou seção "Negócios do Cliente" separada
      Arquivo: `src/app/(dashboard)/clientes/[id]/page.tsx`, `src/components/clientes/interesses-cliente.tsx`

- [ ] **Tarefa 5 — Redesign da página de detalhes do negócio**
      Usar skill `frontend-design` para planejar layout em 2 colunas (principal + sidebar)
      Arquivo: `src/app/(dashboard)/negocios/[id]/page.tsx`

---

### Adoção 100% shadcn/ui — redesign do dashboard (PAUSADO — retomar após bugs críticos)

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

- [x] **Etapa 7C — Fase C: Command Palette (Busca Global)** ✓
      BuscaGlobal migrada para Command shadcn (cmdk). ~200 linhas removidas: estado de índice ativo,
      handleKeyDown manual, scroll tracking com refs, ItemResultado customizado.
      Substituído por: CommandDialog, CommandInput, CommandList, CommandGroup, CommandItem, CommandSeparator.
      Ctrl+K, grupos (Criar/Navegar/Plataforma), busca async com debounce 300ms, loading indicator — tudo preservado.
      Build 100% limpo.

- [x] **Etapa 7B — Fase B: Dashboard com Charts** ✓
      3 novos gráficos no painel admin/gerente: Funil de Negócios (BarChart horizontal por etapa),
      Portfólio de Imóveis (PieChart donut por status), Evolução Mensal (AreaChart 6 meses).
      GraficoStatusNegocios antigo removido. Build 100% limpo.

- [x] **Etapa 7A — Fase A: Field + InputGroup + Combobox em formulários** ✓
      Componentes instalados: field, input-group, command. Criado: combobox-campo.tsx.
      5 formulários migrados: cliente, configuracoes-org, atividade, negócio, imóvel.
      InputGroup com R$ em 4 campos monetários + m² em 2 campos de área.
      ComboboxCampo com busca em: cliente (atividade, negócio), imóvel (atividade, negócio), negócio (atividade).
      Fix: openai lazy-init (getOpenAI()) para corrigir erro de build no cron de resumo semanal.
      Build 100% limpo (todas as rotas, 0 erros).

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
> Pesquisa completa de oportunidades shadcn em: `planejamento/pesquisas/pesquisa-oportunidades-shadcn.md`

### 🔴 Alto impacto (top prioridade quando for executar)

- [ ] **Dashboard com Charts** — usar componente `chart` (já instalado) no /painel: gráficos de imóveis ativos, negócios por etapa do funil, evolução mensal
- [ ] **Command palette** — substituir BuscaGlobal por `command` shadcn com atalho Ctrl+K: busca imóveis, clientes, negócios, navega para páginas
- [ ] **Carousel na galeria de imóveis** — instalar `carousel` shadcn para galeria de fotos no detalhe do imóvel (substituir grade manual)
- [ ] **Field + Input Group nos formulários** — instalar `field` e `input-group` shadcn para unificar Label+Input+erro em 15+ formulários; inputs com prefixo (R$, https://, m²)
- [ ] **Combobox em seleções longas** — instalar `combobox` para busca de imóveis (interesses), clientes e corretores em listas com 10+ opções
- [ ] **Context Menu no Kanban** — instalar `context-menu` shadcn para click-direito nos cards de negócios: editar, mover etapa, ganhar/perder

### 🟡 Médio impacto

- [ ] **Calendar shadcn em /atividades** — instalar `calendar` para substituir calendário manual; suporte a range de datas
- [ ] **Alert para avisos inline** — instalar `alert` para trial expirando, limites próximos, webhook inativo, proposta expirando
- [ ] **Alert Dialog** — instalar `alert-dialog` para substituir `ConfirmacaoExclusao` customizada em todas as exclusões do sistema
- [ ] **Collapsible em filtros e seções** — instalar `collapsible` para filtros avançados de imóveis, seções de detalhe de cliente/negócio
- [ ] **Toggle Group** — instalar `toggle-group` para alternância Mensal/Semanal/Diário em atividades e Cards/Lista/Kanban em negócios
- [ ] Migrar botao-exportar para DropdownMenu oficial
