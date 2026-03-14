---
name: busca-no-yt
description: "Buscar videos relevantes no YouTube sobre um tema especifico. Ativar quando o usuario diz: pesquisa videos, busca no YouTube, encontra aulas, tem algum video sobre."
---

# Busca no YouTube

## Objetivo
Buscar videos relevantes no YouTube sobre um tema especifico.

## Quando usar
Sempre que o usuario pedir para buscar videos, aulas ou tutoriais no YouTube.

## Como executar

1. Entender o tema que o usuario quer pesquisar
2. Usar a ferramenta de busca do YouTube disponivel no ambiente
3. Retornar os resultados mais relevantes com:
   - Titulo do video
   - Canal
   - Link
   - Breve descricao do que o video aborda

## Criterios de relevancia
- Priorizar videos recentes (menos de 2 anos)
- Priorizar canais com credibilidade no tema
- Trazer variedade: tutoriais, explicacoes conceituais e casos praticos quando possivel

## Output
Lista de 3 a 5 videos relevantes com titulo, canal, link e descricao curta.
