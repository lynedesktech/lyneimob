---
title: "Base de Conhecimento — Obsidian Vault"
date: 2026-04-14
tags: [processo, obsidian, vault, documento-fundacional]
---

# Base de Conhecimento — Obsidian Vault do LyneImob

## O que e

O vault do Obsidian e o nosso cofre de conhecimento. Tudo que a equipe aprende, decide, documenta e registra fica aqui — dentro do proprio repositorio do projeto, na pasta `docs/vault/`.

**Regra:** O que nao esta no vault nao foi documentado. Se nao foi documentado, se perde.

## Onde fica

```
lyneimob/docs/vault/
├── .obsidian/       — configuracao do Obsidian
├── decisoes/        — decisoes tecnicas e de produto
├── aprendizados/    — licoes aprendidas e erros evitados
├── processos/       — protocolos e fluxos de trabalho
├── reunioes/        — atas e notas de reunioes
├── pessoas/         — contatos relevantes ao projeto
├── referencias/     — material de apoio externo
└── CLAUDE.md        — instrucoes do vault
```

## O que vai em cada pasta

- **decisoes/** — Toda decisao tecnica ou de produto com contexto e justificativa
- **aprendizados/** — Licoes aprendidas durante implementacoes, erros evitados
- **processos/** — Protocolos e fluxos de trabalho documentados
- **reunioes/** — Atas de todas as reunioes com clientes, equipe ou parceiros
- **pessoas/** — Contatos relevantes ao projeto
- **referencias/** — Material externo de apoio

## Regras

1. Nomes de arquivo em kebab-case, sem acentos
2. Datas absolutas, ISO 8601 (ex: `2026-04-14`)
3. Idioma: portugues brasileiro
4. Frontmatter obrigatorio: title, date, tags
5. Wikilinks: `[[nome-do-arquivo]]` para conectar notas
6. Git: vault e versionado — toda alteracao vai no commit

## Como usar com Claude Code

O Claude Code ja sabe que o vault existe. Comandos uteis:
- "Consulta o vault antes de comecar essa task"
- "Registra no vault a decisao de usar X pra Y"
- "Cria ata da reuniao de hoje no vault"
- "Salva no vault o aprendizado: [descricao]"

---

*Documento criado por Joao Lucas Ucceli — CTO Lynedesk*
*14 de abril de 2026*
