---
name: pesquisa
description: "Pesquisa da codebase antes de implementar. Entender o que ja existe antes de propor solucoes. Ativar quando o usuario diz: pesquisa, pesquisar antes de implementar, quero pesquisar a codebase."
---

# Pesquisa da Codebase

**Objetivo**: Entender o que ja existe no projeto antes de propor qualquer solucao. Gera um documento de pesquisa — nao implementa nada.

---

## Antes de comecar

Perguntar ao usuario (se ele ja nao tiver informado):
- **Qual o tema da pesquisa?** (sera usado para nomear o arquivo)
- **O que voce quer fazer?** (descricao do que precisa ser pesquisado)

---

## O que pesquisar

1. Explorar a codebase: estrutura de pastas, padroes usados, libs instaladas, componentes reutilizaveis
2. Buscar codigo existente que pode ser reaproveitado (hooks, funcoes, componentes)
3. Identificar duplicatas potenciais — nunca criar algo que ja existe
4. Buscar documentacao atualizada das tecnologias envolvidas (usar Context7 para libs)
5. Mapear dependencias e impactos da mudanca

---

## Output

Criar o arquivo `planejamento/pesquisas/pesquisa-[tema].md` com:
- Resumo do que foi encontrado na codebase
- Codigo/componentes existentes que podem ser reaproveitados
- Tecnologias/libs envolvidas e suas versoes
- Riscos ou pontos de atencao identificados
- Links de documentacao consultada

---

## Ao finalizar

1. Apresentar um resumo da pesquisa ao usuario em linguagem simples
2. Informar onde o arquivo foi salvo
3. Esta ferramenta so gera o documento de pesquisa — nao avanca para implementacao
