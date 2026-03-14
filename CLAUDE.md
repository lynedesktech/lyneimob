# CLAUDE.md

Este arquivo guia o Claude Code ao trabalhar neste projeto.

---

## Comunicacao

- **Idioma obrigatorio**: toda comunicacao, pastas, arquivos, commits e branches DEVEM ser em **portugues brasileiro**. Nunca responder em ingles.
- **Linguagem didatica**: o usuario nao e desenvolvedor — explicar tudo de forma simples, passo a passo, evitando jargoes. Quando precisar usar um termo tecnico, explicar o que ele significa.
- **Transparencia**: sempre explicar o que foi feito, por que foi feito, e qual o impacto da mudanca no projeto.

---

## Estilo de Apresentacao de Planos

Todo plano deve ser escrito como conversa, nao como documentacao tecnica. Usar linguagem natural, analogias quando necessario, e explicar como se estivesse falando com alguem.

**Estrutura**: cobrir 3 pontos em prosa — (1) o problema ou contexto, (2) o caminho que sera seguido, (3) as mudancas que vao acontecer e onde.

**Tom**: direto, sem rodeios, sem jargao desnecessario. Usar 3 a 6 paragrafos curtos. Evitar tabelas, listas frias com 10+ itens e frases como "Procederei a implementar".

---

## Projeto

<!-- PREENCHER -->
**Nome**: [nome do projeto]
**Descricao**: [descricao curta do que o projeto faz e para quem]
**Objetivo principal**: [qual problema resolve ou qual valor entrega]
<!-- /PREENCHER -->

## Tecnologias

<!-- PREENCHER -->
- **Frontend**: [ex: React 18 + TypeScript + Vite + Tailwind CSS]
- **Backend**: [ex: Supabase, Node.js, etc.]
- **Banco de dados**: [ex: PostgreSQL via Supabase]
- **Outras libs**: [listar libs relevantes]
- **Alias de caminho**: [ex: `@/` aponta para `./src/`]
<!-- /PREENCHER -->

## Comandos

<!-- PREENCHER -->
```bash
# Desenvolvimento
npm run dev          # [descrever]

# Build
npm run build        # [descrever]

# Testes
npm run test         # [descrever]
```
<!-- /PREENCHER -->

## Estrutura de Pastas

<!-- PREENCHER -->
```
projeto/
├── src/
│   ├── components/    # [descrever]
│   ├── pages/         # [descrever]
│   ├── hooks/         # [descrever]
│   ├── lib/           # [descrever]
│   └── types/         # [descrever]
├── .tmp/              # Arquivos temporarios (ignorado pelo git)
├── planejamento/      # Arquivos de planejamento (pesquisas e requisitos)
│   ├── pesquisas/     # Arquivos gerados pela skill pesquisa (pesquisa-[tema].md)
│   └── requisitos/    # Planos de execucao gerados pela skill requisitos (requisito-[tema].md)
└── ...
```
<!-- /PREENCHER -->

## Arquitetura

<!-- PREENCHER -->
[Descrever a arquitetura do projeto: camadas, fluxo de dados, autenticacao, rotas, etc.]
<!-- /PREENCHER -->

## Padroes de Codigo

<!-- PREENCHER -->
[Descrever padroes adotados: tratamento de erro, loading states, formularios, hooks, etc.]
<!-- /PREENCHER -->

## Variaveis de Ambiente

<!-- PREENCHER -->
Obrigatorias no `.env`:
```
CHAVE_1=descricao
CHAVE_2=descricao
```
<!-- /PREENCHER -->

## Arquivos Sensiveis / Nao Modificar

<!-- PREENCHER -->
- `.env` — contem segredos
- [outros arquivos auto-gerados ou sensiveis]
<!-- /PREENCHER -->

## Divida Tecnica Conhecida

<!-- PREENCHER -->
[Listar problemas conhecidos, decisoes temporarias, codigo legado a limpar]
<!-- /PREENCHER -->

---

## Boas Praticas de Desenvolvimento

Regras que valem sempre, em qualquer tarefa:

- **Nunca duplicar codigo** — antes de criar algo novo, buscar se ja existe no projeto (funcoes, hooks, componentes). Se existe: usar, adaptar ou estender.
- **Simplicidade primeiro** — a solucao mais simples que funciona e a correta. Se envolve criar abstracoes novas, questionar se sao necessarias.
- **Pesquisar antes de codar** — para features grandes ou mudancas com 3+ arquivos, usar `/pesquisa` e `/requisitos` antes de implementar. Para ajustes pontuais, ir direto.
- **Documentacao atualizada** — nao confiar so no conhecimento interno. Verificar APIs e libs via Context7 antes de usar sintaxes que podem ter mudado.
- **Um arquivo, uma responsabilidade** — logica de negocio separada de UI. Chamada de API nao fica misturada com componente visual.
- **So entregar o que foi pedido** — sem melhorias extras, sem refatoracoes nao solicitadas. Se identificar algo que poderia melhorar, mencionar ao usuario — nao implementar sozinho.
- **Na duvida, parar e pesquisar** — se nao tiver certeza sobre como algo funciona ou se ja existe, pesquisar antes de seguir. Nunca chutar.
- **Atualizar CLAUDE.md** — apos toda implementacao que crie, remova ou renomeie algo relevante (funcoes, rotas, componentes, dependencias, estrutura de pastas). Este documento e o coracao do projeto.

## MCPs Configurados

MCPs são integrações externas instaladas por projeto via `.mcp.json`.

### Fixos neste template
- **Context7** — busca documentação atualizada de bibliotecas e frameworks

### Específicos do projeto
<!-- PREENCHER com os MCPs do projeto:
- **Supabase** — banco, autenticação e functions
- **GitHub** — repositório e controle de versão
- **Railway** — deploy e infraestrutura
- **Stripe** — pagamentos e assinaturas
-->

## Ferramentas Disponiveis (Skills)

- **pesquisa** — etapa 1 do metodo: pesquisa qualquer tema e gera `planejamento/pesquisas/pesquisa-[tema].md`. Nao executa nada, nao altera o projeto — produto final e apenas o arquivo .md
- **requisitos** — etapa 2 do metodo: le uma pesquisa (ou trabalha com escopo conhecido) e gera `planejamento/requisitos/requisito-[tema].md` com o plano de execucao completo. Nao executa nada, nao implementa, nao altera o codigo — produto final e apenas o arquivo .md
- **frontend-design** — OBRIGATORIO para qualquer alteracao visual (layout, componentes, CSS, paginas)
- **busca-no-yt** — buscar videos no YouTube

---

## Arquivos de planejamento

Pesquisas e requisitos gerados pelas skills ficam em `planejamento/`:
- `planejamento/pesquisas/` — arquivos gerados pela skill `pesquisa`
- `planejamento/requisitos/` — arquivos gerados pela skill `requisitos`

Nunca salvar pesquisas ou requisitos fora dessa pasta.
Ao criar um novo arquivo de planejamento, seguir a convencao:
- Pesquisa: `planejamento/pesquisas/pesquisa-[tema].md`
- Requisito: `planejamento/requisitos/requisito-[tema].md`

---

## Ciclo de vida dos arquivos de planejamento

Pesquisas e requisitos são arquivos temporários — existem para apoiar um ciclo de desenvolvimento e devem ser removidos quando esse ciclo fecha.

### Regra de limpeza

Quando o Claude mover uma tarefa para a seção **Concluído** no `roadmap.md`, deve verificar se existe algum arquivo de planejamento associado a ela e, se existir, **apagar**.

**Arquivos a apagar:**
- `planejamento/pesquisas/pesquisa-[tema].md` relacionada à tarefa
- `planejamento/requisitos/requisito-[tema].md` relacionado à tarefa

### Como identificar o arquivo associado

O tema do arquivo de planejamento geralmente bate com o tema da tarefa no roadmap. Exemplos:

- Tarefa concluída: "Implementar autenticação"
  → Apagar: `pesquisa-autenticacao.md` e/ou `requisito-autenticacao.md`

- Tarefa concluída: "Listagem de contatos"
  → Apagar: `pesquisa-listagem-contatos.md` e/ou `requisito-listagem-contatos.md`

Se não houver arquivo de planejamento associado, não fazer nada.

### Regra de confirmação

Antes de apagar, informar em uma linha o que será removido:
> "Vou apagar `planejamento/requisitos/requisito-autenticacao.md` pois a tarefa foi concluída."

Se o usuário não quiser apagar, basta dizer e o arquivo é mantido.

### O que nunca apagar

- Arquivos em `planejamento/pesquisas/` ou `planejamento/requisitos/` que **não tenham** uma tarefa correspondente marcada como concluída
- Os arquivos `CLAUDE.md` dentro dessas pastas — esses são permanentes

---

## Gestão de Tarefas — roadmap.md

O `roadmap.md` é o centro de controle do projeto. O Claude atua como gestor de projeto — registra, move e atualiza as tarefas automaticamente, sem precisar ser lembrado. Nenhuma demanda é perdida.

### As 5 seções

- **🔄 Fazendo** — tarefa em execução agora (máximo 1)
- **📋 A Fazer** — fila priorizada aguardando execução
- **✅ A Validar** — entregue pelo Claude, aguarda teste do usuário
- **💡 Futuras** — ideias e implementações sem prazo definido
- **✔️ Concluído** — validado pelo usuário (manter as 10 mais recentes)

---

### Comportamento automático obrigatório

O Claude atualiza o `roadmap.md` **por conta própria**, sem precisar ser solicitado, em todas as situações abaixo.

---

#### 1. Quando o usuário pede algo novo

Qualquer pedido — seja uma feature, uma correção, uma pesquisa ou uma melhoria — vira uma tarefa no roadmap **antes** de qualquer execução.

- Se for para fazer agora → entra direto em **Fazendo**
- Se for para depois → entra em **A Fazer**
- Se for uma ideia sem prazo → entra em **Futuras**

> O Claude nunca começa a trabalhar em algo que não está registrado no roadmap.

---

#### 2. Ao iniciar qualquer tarefa

1. Ler o `roadmap.md`
2. Mover a tarefa de **A Fazer** → **Fazendo**
3. Se já houver algo em **Fazendo**: perguntar ao usuário se pausa ou continua
4. Só então começar a execução

---

#### 3. Durante a execução — tarefas descobertas

Se durante o trabalho o Claude identificar algo que precisa ser feito mas não estava previsto:
- Registrar imediatamente em **A Fazer** (se for necessário para a tarefa atual)
- Ou em **Futuras** (se for melhoria ou dívida técnica)
- Informar o usuário em uma linha: *"Anotei no roadmap: [nome da tarefa]"*

---

#### 4. Ao concluir uma tarefa

1. Mover de **Fazendo** → **A Validar**
2. Adicionar nota do que foi feito e o que o usuário deve testar
3. Verificar se existe arquivo de planejamento associado (pesquisa ou requisito) — se sim, informar que será apagado ao validar
4. Nunca mover para Concluído sozinho — apenas o usuário valida

---

#### 5. Se a tarefa for interrompida

- Deixar em **Fazendo** com nota do ponto exato de parada
- Exemplo: `- [ ] Implementar worker ← parou na integração com 2Captcha`
- Na próxima sessão, ao ler o roadmap, retomar desse ponto

---

#### 6. Ao receber validação do usuário

Quando o usuário disser "ok", "validado", "aprovado", "feito", "pode mover" ou similar:
1. Mover de **A Validar** → **Concluído** com a data
2. Apagar arquivos de planejamento associados (`pesquisa-[tema].md`, `requisito-[tema].md`) — informar antes
3. Manter apenas as 10 tarefas mais recentes em **Concluído**
4. Verificar se há próxima tarefa em **A Fazer** e perguntar: *"Próximo da fila é [tarefa]. Começo agora?"*

---

#### 7. Se a validação falhar

Quando o usuário reportar um problema na tarefa em **A Validar**:
1. Mover de **A Validar** → **Fazendo** com nota do problema
2. Exemplo: `- [ ] Listagem de contatos ← voltou: filtro de busca não funciona no mobile`
3. Corrigir e devolver para **A Validar**

---

#### 8. Ao receber pedido de status

Quando o usuário disser "o que está pendente?", "próximo passo?", "me atualize", "leia o roadmap" ou similar:

Ler o `roadmap.md` e responder em formato curto:

```
Fazendo: [tarefa ou "nada em andamento"]
A Validar: [lista ou "nada aguardando validação"]
Próximo da fila: [primeira tarefa de A Fazer ou "fila vazia"]
Futuras: [quantidade de itens]
```

---

### Formato de uma tarefa no roadmap

```markdown
- [ ] Título claro e objetivo da tarefa
      Contexto: por que isso precisa ser feito (opcional, só quando não for óbvio)
      ← nota de parada ou problema (só quando interrompida ou devolvida)
```

Exemplos:

```markdown
- [ ] Implementar listagem de contatos
      Contexto: feature necessária antes do lançamento do módulo de CRM

- [ ] Corrigir filtro de busca na listagem
      ← voltou: não funciona no mobile (Safari iOS)
```

---

### Princípio central

> O roadmap é a fonte de verdade do projeto.
> Se não está no roadmap, não existe.
> O Claude nunca perde uma demanda e nunca trabalha no escuro.
