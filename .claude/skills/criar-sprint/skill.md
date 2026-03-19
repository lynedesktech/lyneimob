---
name: criar-sprint
description: "Criar uma nova sprint no roadmap. Mapeia a tarefa, define escopo, checklist, prioridade, prazo e responsavel. Ativar quando o usuario diz: criar sprint, nova sprint, mapear tarefa, registrar sprint, sprint nova, quero criar uma sprint."
---

# Criar Sprint

**Objetivo**: Transformar uma demanda ou ideia em uma sprint bem definida no roadmap (tabela `tarefas_roadmap`). Toda sprint sai com titulo, descricao, checklist de passos, prioridade, prazo e responsavel — pronta pra ser executada.

---

## Antes de comecar

1. Entender o que o usuario quer fazer. Se ele ja explicou no contexto da conversa, usar essa informacao. Se nao, perguntar:
   - **O que precisa ser feito?** (descricao do objetivo)
   - **Tem urgencia?** (ajuda a definir prioridade)
   - **Tem prazo?** (data de vencimento)

2. Pesquisar rapidamente a codebase pra entender o estado atual do que sera tocado — quais arquivos existem, o que ja esta implementado, o que falta.

3. Consultar tarefas existentes via `listarTarefasRoadmap()` pra evitar duplicatas.

---

## Como criar a sprint

### Passo 1 — Definir o escopo

Com base no que o usuario pediu e na pesquisa da codebase, montar:

- **Titulo**: curto e direto (ex: "Fluxo completo de esqueci minha senha")
- **Descricao**: 2-3 frases explicando o objetivo e o resultado esperado
- **Prioridade**: `baixa`, `media`, `alta` ou `critica` — baseado na urgencia e impacto
- **Prazo**: data de vencimento se o usuario informou, senao deixar sem

### Passo 2 — Montar o checklist

Quebrar a sprint em passos concretos e ordenados. Cada item do checklist deve ser:
- Acionavel (comeca com verbo: "Criar...", "Atualizar...", "Testar...")
- Especifico (mencionar arquivos ou componentes quando possivel)
- Verificavel (da pra saber se esta feito ou nao)

Exemplo:
```
- Criar schema Zod para validacao
- Criar server action em actions/auth.ts
- Criar pagina /redefinir-senha
- Atualizar middleware para nova rota
- Testar fluxo completo ponta a ponta
```

### Passo 3 — Apresentar ao usuario

Antes de salvar, mostrar um resumo da sprint pro usuario validar:

```
Sprint: [titulo]
Descricao: [descricao]
Prioridade: [prioridade]
Prazo: [data ou "sem prazo"]
Checklist:
  [ ] Passo 1
  [ ] Passo 2
  [ ] Passo 3
```

Perguntar se quer ajustar algo.

### Passo 4 — Salvar no banco

Apos aprovacao do usuario, inserir via `criarTarefaRoadmap()`:

```typescript
await criarTarefaRoadmap({
  titulo: "...",
  descricao: "...",
  status: "a_fazer",
  prioridade: "...",
  checklist: [
    { texto: "Passo 1", concluido: false },
    { texto: "Passo 2", concluido: false },
  ],
  data_vencimento: "2026-03-25" // ou null
})
```

### Passo 5 — Confirmar

Informar o usuario que a sprint foi criada com sucesso e esta visivel em `/admin/roadmap`.

---

## Regras

- **Status inicial sempre `a_fazer`** — sprints nascem na fila. So mudam pra `fazendo` quando o trabalho comeca de fato.
- **Checklist obrigatorio** — toda sprint precisa de pelo menos 3 itens no checklist. Se a tarefa e simples demais pra ter 3 passos, talvez nao precise ser uma sprint.
- **Sem duplicatas** — verificar se ja existe sprint similar antes de criar.
- **Linguagem clara** — titulo e descricao devem ser compreensiveis por alguem que nao e desenvolvedor.

---

## O que esta skill NAO faz

- Nao implementa codigo — so cria a sprint no banco
- Nao muda status de sprints existentes
- Nao exclui sprints
- Nao altera arquivos do projeto
