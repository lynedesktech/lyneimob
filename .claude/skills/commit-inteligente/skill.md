---
name: commit-inteligente
description: "Commit inteligente — analisa mudancas, cria mensagem estruturada, commita e faz push automaticamente. Ativar quando o usuario diz: commitar, commit, salvar, push, backup, salvar mudancas, enviar pro github, salvar tudo, quero commitar."
---

# Commit Inteligente

**Objetivo**: Analisar todas as mudancas pendentes, entender o que foi feito, criar um commit com mensagem bem estruturada, e enviar pro GitHub. Tudo de uma vez — o usuario so confirma.

---

## Antes de comecar

1. Rodar `git status` para ver arquivos modificados, adicionados e removidos
2. Rodar `git diff` (staged e unstaged) para entender O QUE mudou
3. Se nao houver nenhuma mudanca: informar o usuario e encerrar

---

## Passo 1 — Analisar as mudancas

Para cada arquivo modificado, entender:
- **Qual modulo** foi afetado (imoveis, clientes, negocios, auth, etc.)
- **Que tipo de mudanca**: feature nova, correcao de bug, refatoracao, manutencao, teste, documentacao
- **Qual o impacto**: mudanca grande (modulo novo) ou pequena (ajuste pontual)

### Regras de classificacao

| Situacao | Prefixo |
|----------|---------|
| Funcionalidade nova ou modulo novo | `feat:` |
| Correcao de bug ou erro | `fix:` |
| Reorganizacao sem mudar comportamento | `refactor:` |
| Config, gitignore, dependencias | `chore:` |
| Testes novos ou ajuste de testes | `test:` |
| Documentacao, README, CLAUDE.md | `docs:` |

---

## Passo 2 — Criar a mensagem

### Formato

```
prefixo: descricao curta e clara em portugues
```

### Regras

- **Descricao em portugues brasileiro** — nunca em ingles
- **Maximo 72 caracteres** na primeira linha
- **Sem ponto final** na primeira linha
- **Letra minuscula** apos o prefixo
- Se muitas coisas mudaram, usar traco para separar contextos: `feat: modulo X — parte Y`

### Quando sugerir dividir em multiplos commits

Se as mudancas envolvem 3+ modulos diferentes com propositos distintos, sugerir ao usuario:
> "Vi que voce mexeu em imoveis, clientes e no auth. Faz mais sentido separar em commits menores, um por modulo. Quer que eu faca isso?"

Se o usuario preferir um commit so, respeitar e criar uma mensagem que cubra tudo.

---

## Passo 3 — Apresentar e confirmar

Mostrar ao usuario:
1. **Resumo das mudancas** em linguagem simples (ex: "Voce criou a pagina de loteamentos e corrigiu um bug no login")
2. **A mensagem de commit** sugerida
3. **Lista dos arquivos** que serao incluidos

Perguntar: "A mensagem esta boa? Quer ajustar alguma coisa?"

---

## Passo 4 — Executar tudo

Apos confirmacao, fazer TUDO de uma vez:

### 4.1 — Adicionar arquivos ao staging
- **Nunca usar `git add .` ou `git add -A`** — sempre adicionar arquivos especificos
- **Nunca incluir**: `.env`, `.env.local`, `.env.test`, arquivos com credenciais, `node_modules/`
- Se encontrar arquivo sensivel nas mudancas, avisar o usuario e excluir do commit

### 4.2 — Criar o commit
```bash
git commit -m "$(cat <<'EOF'
prefixo: mensagem do commit

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

### 4.3 — Fazer push
```bash
git push origin master
```

### 4.4 — Confirmar sucesso
Informar o usuario:
> "Pronto! Commit feito e enviado pro GitHub. Suas mudancas estao salvas."
> - Commit: `[hash curto]` — [mensagem]
> - Arquivos: X modificados, Y adicionados, Z removidos
> - Status: sincronizado com o GitHub

---

## Se o push falhar

1. Informar o usuario em linguagem simples (ex: "O GitHub nao aceitou o envio porque tem mudancas la que voce nao tem aqui")
2. Sugerir a solucao (ex: "Posso puxar as mudancas do GitHub e tentar de novo?")
3. Nunca fazer `git push --force` sem autorizacao explicita do usuario

---

## O que esta skill NAO faz

- Nao faz commit de arquivos sensiveis (.env, credenciais)
- Nao faz amend em commits anteriores (sempre cria commit novo)
- Nao cria branches — commita na branch atual
- Nao altera codigo — so registra o que ja esta pronto
- Nao faz force push
