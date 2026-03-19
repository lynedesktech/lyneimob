---
name: publicar
description: "Publicar uma nova versao no GitHub. Analisa commits, organiza por topicos, gera release notes completas e cria a release. Ativar quando o usuario diz: publicar, release, criar release, publicar versao, nova versao, lancar versao."
---

# Publicar — Release no GitHub

**Objetivo**: Analisar os commits recentes, organizar por categoria, gerar release notes bonitas em linguagem simples, e publicar uma release oficial no GitHub. O usuario so confirma.

---

## Antes de comecar

1. Verificar se o `gh` CLI esta autenticado: `gh auth status`
2. Verificar se existem tags anteriores: `git tag -l --sort=-version:refname`
3. Verificar se existem mudancas nao commitadas: `git status`
   - Se houver mudancas pendentes, avisar o usuario e sugerir rodar `/commit-inteligente` primeiro
4. Verificar se existem commits nao enviados: `git log origin/master..HEAD --oneline`
   - Se houver, fazer push antes de criar a release

---

## Passo 1 — Definir o periodo

- Se existir tag anterior: usar como base (commits desde a ultima tag)
- Se NAO existir tag (primeira release): perguntar ao usuario:
  > "Este projeto ainda nao tem nenhuma release publicada. Posso incluir todos os commits desde o inicio, ou voce prefere escolher um periodo especifico (ex: ultimos 30 commits, ultimas 2 semanas)?"

---

## Passo 2 — Coletar e organizar commits

Executar `git log` no periodo definido e classificar cada commit pela convencao de prefixo:

### Categorias para as release notes

| Prefixo | Secao nas release notes |
|---------|------------------------|
| `feat:` | Novidades |
| `fix:` | Correcoes de bugs |
| `refactor:` | Melhorias internas |
| `chore:` | Manutencao |
| `test:` | Testes |
| `docs:` | Documentacao |
| sem prefixo | Outros |

### Regras de organizacao

- **Agrupar commits relacionados**: 3 commits de fix no WhatsApp viram 1 item: "Corrigido problema que duplicava mensagens no WhatsApp"
- **Reescrever em linguagem simples**: nada de jargao tecnico. Ex: "fix: race condition na criacao de conversas" vira "Corrigido problema que duplicava conversas no WhatsApp"
- **Novidades (feat) sempre no topo** — e o que o usuario mais quer ver
- **Omitir commits de diagnostico** (diag:) e commits de merge

---

## Passo 3 — Sugerir versao

Analisar o conteudo dos commits para sugerir a versao:
- Tem `feat:` significativo (modulo novo, feature grande) → incrementar minor (ex: v1.0 → v1.1)
- So `fix:` e `chore:` → incrementar patch (ex: v1.0.0 → v1.0.1)
- Primeira release → sugerir v1.0

Apresentar sugestao e deixar o usuario escolher:
> "Sugiro publicar como **v1.1** porque tem X novidades e Y correcoes. Quer usar essa versao ou prefere outra?"

---

## Passo 4 — Preview e confirmacao

Mostrar as release notes completas formatadas em Markdown para o usuario revisar.

### Formato das release notes

```markdown
## O que mudou nesta versao

### Novidades
- Descricao da feature 1
- Descricao da feature 2

### Correcoes
- Descricao do fix 1
- Descricao do fix 2

### Melhorias internas
- Descricao do refactor/chore 1

---
**Versao completa**: X novidades, Y correcoes, Z melhorias
**Periodo**: DD/MM/AAAA a DD/MM/AAAA
**Commits incluidos**: N
```

Perguntar: "As release notes estao boas? Posso publicar?"

---

## Passo 5 — Publicar

Apos confirmacao do usuario:

1. **Push** (se necessario): `git push origin master`
2. **Criar tag**: `git tag vX.Y`
3. **Push da tag**: `git push origin vX.Y`
4. **Criar release no GitHub**:
```bash
gh release create vX.Y --title "vX.Y — [titulo curto descrevendo o principal]" --notes "$(cat <<'EOF'
[release notes completas aqui]
EOF
)"
```

---

## Ao finalizar

1. Informar o usuario com o link da release
2. Resumir o que foi publicado em linguagem simples:
   > "Pronto! Release **vX.Y** publicada no GitHub com X novidades e Y correcoes."
   > Link: https://github.com/joaolucasucceli/LyneImob/releases/tag/vX.Y

---

## Se o `gh` nao estiver autenticado

Guiar o usuario passo a passo:
1. "O GitHub CLI nao esta conectado. Vou te ajudar a conectar."
2. Instruir a rodar `gh auth login` e seguir os passos
3. Depois de autenticado, continuar com a publicacao

---

## O que esta skill NAO faz

- Nao commita mudancas pendentes — usar `/commit-inteligente` antes
- Nao cria branch — publica direto da branch atual
- Nao altera codigo — so organiza e publica o que ja esta commitado
- Nao faz force push
