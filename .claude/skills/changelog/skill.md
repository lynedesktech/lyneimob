---
name: changelog
description: "Gerar um resumo organizado de tudo que mudou no projeto — commits e releases. Ativar quando o usuario diz: changelog, o que mudou, historico, resumo de commits, me mostra o que foi feito, o que foi publicado, o que aconteceu no projeto."
---

# Changelog — Historico de Mudancas

**Objetivo**: Gerar um resumo bonito e organizado de tudo que mudou no projeto em um periodo escolhido pelo usuario. Mostra commits e releases publicadas. Tudo em linguagem simples, direto no chat — nao cria arquivo, nao altera nada.

---

## Antes de comecar

Perguntar ao usuario o periodo desejado (se ele nao informou):
- "Desde a ultima release" (se existir tag)
- "Ultimos X dias" ou "ultimas X semanas"
- "Ultimos N commits"
- "Tudo desde o inicio"
- "Entre duas releases" (ex: de v1.0 a v1.1)

Se o usuario nao souber, sugerir: "Posso mostrar o que mudou desde a ultima release, ou nos ultimos 7 dias. O que prefere?"

---

## Passo 1 — Coletar informacoes

### Releases publicadas
```bash
gh release list --limit 10
```
Mostrar quais releases existem com data e link.

### Commits do periodo
```bash
git log --oneline --format="%h %s (%as)" [filtro-de-periodo]
```
- Se "desde a ultima release": `git log v1.0..HEAD --oneline`
- Se "ultimos X dias": `git log --since="X days ago" --oneline`
- Se "tudo": `git log --oneline`

---

## Passo 2 — Organizar e traduzir

### Agrupar por categoria

- **Novidades** (feat) — o que ha de novo no sistema
- **Correcoes** (fix) — bugs que foram resolvidos
- **Melhorias internas** (refactor, chore) — coisas que melhoraram por dentro
- **Testes** (test) — qualidade e estabilidade
- **Documentacao** (docs) — atualizacoes de docs

### Traduzir para linguagem humana

Cada item deve ser uma frase simples que qualquer pessoa entende:
- Tecnico: `feat: modulo de loteamentos — etapas 1 a 3 (banco, tipos, actions)`
- Humano: "Criado o modulo de loteamentos com toda a estrutura de dados e funcionalidades basicas"

### Agrupar commits relacionados

Commits que sao parte do mesmo trabalho viram um unico item:
- `fix: debounce WhatsApp — corrigir race condition` + `fix: debounce WhatsApp — mover processamento` → "Corrigido problema que causava mensagens duplicadas no WhatsApp"

---

## Passo 3 — Apresentar

Mostrar o changelog formatado no chat:

```
# Changelog — [periodo]

## Releases publicadas
- **v1.0** (14/03/2026) — CRM completo com IA [link]

## Mudancas desde a ultima release

### Novidades
- Item 1
- Item 2

### Correcoes
- Item 1

### Melhorias internas
- Item 1

---
**Periodo**: DD/MM/AAAA a DD/MM/AAAA
**Total de commits**: N
```

Se o usuario quiser, oferecer: "Quer que eu salve isso em um arquivo?"

---

## O que esta skill NAO faz

- Nao publica no GitHub — usar `/publicar` para isso
- Nao altera codigo ou commits
- Nao cria arquivo por padrao (so se o usuario pedir)
- Nao reverte mudancas — usar `/retornar` para isso
