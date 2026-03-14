# Pesquisas — Regras desta pasta

Esta pasta armazena arquivos de pesquisa gerados pela skill `/pesquisa`.

---

## O que e uma pesquisa

- Arquivo de levantamento de informacoes para embasar decisoes
- Nao implementa nada, nao altera o projeto

---

## Convencao de nome

```
pesquisa-[tema].md
```

Exemplos: `pesquisa-autenticacao.md`, `pesquisa-upload-arquivos.md`, `pesquisa-pagamentos.md`

---

## Estrutura obrigatoria de todo arquivo de pesquisa

```markdown
# Pesquisa: [Tema]

**Data:** [data de geracao]
**Solicitado por:** [contexto ou feature que originou a pesquisa]

## Objetivo
[O que esta pesquisa quer responder — em 1 ou 2 frases]

## Contexto
[Por que essa pesquisa e necessaria. Qual decisao ou implementacao ela vai informar]

## Levantamento
[Os dados encontrados, organizados por subtema. Use subsecoes (###) para cada area]

### [Subtema 1]
...

### [Subtema 2]
...

## Referencias
- [Fonte 1](link) — descricao
- [Fonte 2](link) — descricao

## Conclusoes
[Resposta objetiva ao objetivo. O que foi descoberto. O que e recomendado e por que]
```

---

## Regras

- **Nao implementa nada** — este arquivo e apenas documentacao
- **Nao altera o projeto** — nenhum codigo, nenhuma configuracao
- **Usar Context7** para buscar documentacao atualizada de libs e frameworks
- **Ser objetivo** — pesquisa nao e rascunho. Cada secao deve ter informacao util, nao especulacao
- **Nao misturar decisoes de implementacao** dentro do levantamento — conclusoes ficam na secao "Conclusoes"
