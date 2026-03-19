---
name: retornar
description: "Voltar o projeto a uma versao ou commit anterior de forma segura. Ativar quando o usuario diz: retornar, voltar, reverter, desfazer, volta pra versao, fiz merda, quero voltar, desfazer mudanca, voltar atras."
---

# Retornar — Voltar a uma Versao Anterior

**Objetivo**: Permitir ao usuario voltar o projeto a um ponto anterior de forma segura. Mostra as opcoes disponiveis, explica o que vai mudar, e cria um commit de reversao. Nunca apaga historico — sempre e possivel "des-retornar".

---

## REGRAS DE SEGURANCA (inviolaveis)

1. **NUNCA usar `git reset --hard`** — isso apaga historico e nao tem volta
2. **NUNCA usar `git push --force`** — isso sobrescreve o que esta no GitHub
3. **NUNCA usar `git checkout .` ou `git restore .`** sem confirmacao explicita
4. **SEMPRE criar um commit novo** que desfaz as mudancas (git revert)
5. **SEMPRE mostrar o que vai mudar** antes de fazer qualquer coisa
6. **SEMPRE pedir confirmacao** antes de executar

---

## Passo 1 — Entender o que o usuario quer

Perguntar (se ele nao informou):
> "Voce quer voltar pra qual ponto? Posso te mostrar as opcoes."

### Opcao A — Voltar pra uma release
Mostrar as releases publicadas:
```bash
gh release list --limit 10
```
Apresentar de forma simples:
> "Estas sao as versoes publicadas do projeto:"
> 1. **v1.0** (19/03/2026) — CRM completo com IA
>
> "Quer voltar pra qual versao?"

### Opcao B — Voltar um ou mais commits
Mostrar os ultimos commits:
```bash
git log --oneline -15
```
Apresentar de forma simples:
> "Estes sao os ultimos commits (do mais recente pro mais antigo):"
> 1. `d3c9e51` — redefinicao de senha e skills GitHub (19/03)
> 2. `95f9a62` — correcao do loop de redirecionamento (19/03)
> ...
>
> "Quer desfazer qual commit? Ou quer voltar ate qual ponto?"

### Opcao C — Desfazer so o ultimo commit
Se o usuario disse algo como "desfaz o ultimo" ou "volta um commit":
```bash
git log --oneline -1
```
> "O ultimo commit foi: `d3c9e51` — redefinicao de senha e skills GitHub"
> "Quer desfazer esse commit?"

---

## Passo 2 — Analisar o impacto

Antes de fazer qualquer coisa, mostrar ao usuario EXATAMENTE o que vai mudar.

### Se for desfazer um commit especifico:
```bash
git show [hash] --stat
```
> "Desfazer esse commit vai reverter mudancas em X arquivos:"
> - [lista de arquivos]
> "Ou seja: [explicacao simples do que vai acontecer, ex: 'a pagina de redefinir senha vai ser removida']"

### Se for voltar pra uma release (vários commits):
```bash
git log [tag]..HEAD --oneline
```
> "Voltar pra v1.0 vai desfazer X commits. As mudancas que serao revertidas:"
> - [lista resumida do que se perde]
> "Tem certeza que quer voltar tudo isso?"

---

## Passo 3 — Confirmar com o usuario

Sempre perguntar antes de executar:
> "Vou criar um commit que desfaz essas mudancas. O historico fica intacto — se voce mudar de ideia depois, da pra des-reverter. Confirma?"

---

## Passo 4 — Executar a reversao

### Desfazer um unico commit:
```bash
git revert [hash] --no-edit
```

### Desfazer varios commits (voltar pra uma release):
```bash
git revert [hash-mais-antigo]^..[hash-mais-recente] --no-edit
```

Se der conflito durante o revert:
1. Informar o usuario em linguagem simples
2. Explicar as opcoes: resolver o conflito ou cancelar (`git revert --abort`)
3. Oferecer ajuda pra resolver

### Apos o revert:
```bash
git push origin master
```

---

## Passo 5 — Confirmar sucesso

> "Pronto! As mudancas foram desfeitas com seguranca."
> - Commits revertidos: X
> - Arquivos afetados: Y
> - Status: sincronizado com o GitHub
>
> "Se voce mudar de ideia, e so me pedir pra desfazer a reversao — o historico esta todo preservado."

---

## Cenarios especiais

### O usuario quer desfazer mudancas que ainda NAO foram commitadas
```bash
git status
```
Se tem mudancas nao commitadas:
> "Vi que voce tem mudancas que ainda nao foram salvas (commitadas). Quer descartar essas mudancas? Isso nao tem volta — os arquivos voltam pro estado do ultimo commit."

Se confirmar:
```bash
git checkout -- [arquivos especificos]
```
**Nunca** `git checkout .` sem listar os arquivos e ter confirmacao.

### O usuario quer desfazer so um arquivo especifico
```bash
git log --oneline -- [caminho-do-arquivo]
```
Mostrar o historico daquele arquivo e deixar o usuario escolher pra qual versao voltar.

---

## O que esta skill NAO faz

- Nao apaga historico (nunca usa reset --hard ou force push)
- Nao altera codigo manualmente — so reverte commits inteiros
- Nao cria branches
- Nao faz merge
- Nao resolve conflitos automaticamente — pede ajuda ao usuario
