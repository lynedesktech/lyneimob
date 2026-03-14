---
name: requisitos
description: "Especificacao e requisitos. Estudo aprofundado de como uma implementacao vai afetar o sistema. Ativar quando o usuario diz: requisitos, especificacao, criar requisitos, definir requisitos."
---

# Requisitos / Especificacao

**Objetivo**: Gerar um estudo aprofundado de como uma nova implementacao vai afetar o sistema — quais arquivos mexer, o que muda, o que prestar atencao. Gera um documento de requisitos — nao implementa nada.

---

## Antes de comecar

Perguntar ao usuario o tema (se ele ja nao tiver informado).

Verificar se existe `planejamento/pesquisas/pesquisa-[tema].md`:
- Se existir: reler o conteudo antes de prosseguir
- Se nao existir: tudo bem — trabalhar com as informacoes que o usuario fornecer

Se houver mais de uma pesquisa em `planejamento/pesquisas/`, perguntar ao usuario qual usar.

---

## O que levantar

1. Definir exatamente o que sera implementado (nada mais, nada menos)
2. Listar todos os arquivos a criar/modificar com caminho completo
3. Definir a responsabilidade de cada arquivo
4. Definir a ordem de implementacao (dependencias primeiro)
5. Identificar riscos e pontos de atencao

---

## Output

Criar o arquivo `planejamento/requisitos/requisito-[tema].md` com:
- Escopo claro (o que faz e o que NAO faz)
- Lista de arquivos a criar/modificar, com:
  - Caminho completo
  - Responsabilidade do arquivo
  - Estrutura esperada (esqueleto, nao codigo completo)
- Ordem de implementacao numerada
- Testes necessarios (se aplicavel)
- Checklist de validacao

---

## Ao finalizar

1. Apresentar um resumo dos requisitos ao usuario em linguagem simples
2. Informar onde o arquivo foi salvo
3. Esta ferramenta so gera o documento de requisitos — nao avanca para implementacao
