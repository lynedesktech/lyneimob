# Requisitos — Regras desta pasta

Esta pasta armazena arquivos de requisitos gerados pela skill `/requisitos`.

---

## O que e um requisito

- Arquivo de mapeamento tecnico completo antes de implementar qualquer feature
- Nao implementa nada, nao altera o projeto

---

## Convencao de nome

```
requisito-[tema].md
```

Exemplos: `requisito-autenticacao.md`, `requisito-upload-arquivos.md`, `requisito-pagamentos.md`

---

## Estrutura obrigatoria de todo arquivo de requisito

```markdown
# Requisito: [Tema]

**Data:** [data de geracao]
**Pesquisa base:** [pesquisa-[tema].md ou "escopo direto" se nao houver pesquisa]

## Objetivo
[O que sera implementado e por que — em 1 ou 2 frases]

## Escopo
**Dentro:** [o que esta incluido nesta implementacao]
**Fora:** [o que NAO sera feito agora — importante para nao expandir escopo]

## Mapeamento Tecnico

### Backend
[Endpoints, logica de negocio, servicos, validacoes]

### Frontend
[Componentes, paginas, estados, navegacao]

### Banco de Dados
[Tabelas, campos, indices, migrations necessarias]

### API
[Contratos de entrada/saida, formatos, erros esperados e seus codigos]

### Testes
[Cenarios a cobrir: caminho feliz, erros, edge cases]

### UI/UX
[Comportamentos visuais: estados de loading, erro, vazio, sucesso]

## Arquivos Afetados
| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `caminho/arquivo.ts` | criar/alterar/remover | o que muda |

## Impacto
[O que pode quebrar, dependencias afetadas, riscos identificados]

## Ordem de Execucao
1. [Primeiro passo — geralmente banco ou tipos]
2. [Segundo passo]
3. [...]
```

---

## Regras

- **Nao implementa nada** — este arquivo e apenas o plano
- **Nao altera o codigo** — nenhum arquivo do projeto e tocado
- **Cobrir todas as dimensoes** — um requisito incompleto gera implementacao incompleta
- **Escopo explicito** — o que esta fora e tao importante quanto o que esta dentro
- **Ordem de Execucao e sequencia real** — nao lista de tarefas paralelas; cada passo depende do anterior
