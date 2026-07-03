"""Base de conhecimento do Guaruja Condominium — FONTE UNICA DA VERDADE.

Este arquivo e a UNICA fonte de informacao do agente de campanha.
O agente NAO busca nada do site nem do CRM: tudo que ele pode afirmar
sobre o empreendimento esta aqui, extraido da landing page oficial
(https://guaruja.dunarealestate.com.br) em 03/07/2026.

REGRA: se a informacao nao esta neste arquivo, o agente NAO sabe.
Pra atualizar o que a Carol fala, edite AQUI e faca redeploy.
"""

from __future__ import annotations

# ============================================================
# Dados estruturados (pra logica de codigo, se precisar)
# ============================================================

EMPREENDIMENTO = {
    "nome": "Guaruja Condominium",
    "tipo": "Condominio fechado de lotes",
    "cidade": "Caucaia",
    "estado": "CE",
    "distancia_cumbuco_km": 12,
    "tempo_cumbuco_min": 20,
    "tempo_centro_caucaia_min": 5,
    "lote_padrao_m2": 150,
    "lote_metragem": "6x25",
    "preco_lote_a_partir": 112_500.00,
    "entrada_percentual": 10,
    "juros": "sem juros",
    "parcela_a_partir": 699.90,
    "entrega_prevista": "dezembro de 2028",
    "desenvolvedor": "Lotus Urbanismo",
    "landing_page": "https://guaruja.dunarealestate.com.br",
}

LAZER_E_INFRAESTRUTURA = [
    "Portaria principal com seguranca 24h",
    "Clubhouse completo (espaco de convivencia premium)",
    "Piscina adulto e infantil",
    "Rooftop com vista panoramica",
    "Academia climatizada com equipamentos modernos",
    "Quadras de areia (beach tennis e volei de praia)",
    "Pet Place",
    "Playground",
    "Rede de agua e esgoto com ETE propria (estacao de tratamento)",
    "Iluminacao em LED",
    "Piso intertravado nas vias",
]

# O que o agente NAO SABE e NUNCA pode inventar.
# Tudo daqui vai pro corretor confirmar.
FORA_DO_CONHECIMENTO = [
    "Quantidade total de lotes e quantos ainda estao disponiveis",
    "Disponibilidade de quadra/lote especifico ou posicao no mapa",
    "Tabela completa de precos (outras metragens, lotes de esquina)",
    "Financiamento bancario (Caixa, etc.) — a condicao conhecida e direta com a incorporadora",
    "Prazo de validade da condicao comercial (falar 'conforme fluxo vigente')",
    "Detalhes de documentacao, registro de incorporacao (RI), contrato",
    "Percentual de valorizacao projetada ou rentabilidade garantida",
    "Cronograma de obras alem da entrega prevista (dez/2028)",
    "Regras do condominio (taxa, prazo pra construir, padrao de muro)",
]

# ============================================================
# Bloco de texto pronto pra injetar no system prompt
# ============================================================

CONHECIMENTO_GUARUJA = """# GUARUJA CONDOMINIUM (tudo que voce sabe — e NADA alem disso)

**O que e**: condominio fechado de lotes em Caucaia/CE, desenvolvido pela Lotus Urbanismo, vendido com exclusividade pela Duna Real Estate.

**Localizacao** (decore, e o que mais perguntam):
- Fica em Caucaia, regiao metropolitana de Fortaleza
- A 12 km da Praia do Cumbuco (mais ou menos 20 minutos de carro)
- A menos de 5 minutos do Centro de Caucaia
- Acesso rapido as vias estruturantes da regiao

**O lote**:
- Metragem padrao de 150m2 (6 de frente por 25 de fundo)
- Pra construir a casa do jeito que o cliente quiser, com seguranca de condominio fechado

**Valores e condicoes (PODE informar, e publico — esta no anuncio e na pagina)**:
- Lotes a partir de R$ 112.500,00
- Entrada de 10%
- Parcelamento SEM JUROS direto com a incorporadora
- Parcelas a partir de R$ 699,90
- Condicoes conforme fluxo vigente (simulacao exata e com o corretor)

**Entrega prevista**: dezembro de 2028.

**Lazer e infraestrutura (SO cite o que esta nesta lista, NUNCA acrescente)**:
- Portaria principal com seguranca 24h
- Clubhouse completo
- Piscina adulto e infantil
- Rooftop com vista panoramica
- Academia climatizada
- Quadras de areia (beach tennis e volei de praia)
- Pet Place
- Playground
- Agua e esgoto com estacao de tratamento propria (ETE)
- Iluminacao em LED e piso intertravado

**Pagina oficial**: https://guaruja.dunarealestate.com.br (pode mandar pro cliente rever fotos)

# O QUE VOCE NAO SABE (verdade obrigatoria: "o corretor confirma certinho")

- Quantos lotes existem / quantos restam ("os lotes estao saindo, o corretor confirma a disponibilidade certinha")
- Lote/quadra especifica, posicao no mapa, lote de esquina
- Precos de outras metragens ou tabela completa
- Financiamento bancario (a condicao que voce conhece e direto com a incorporadora)
- Ate quando vale a condicao comercial (NUNCA invente prazo nem "so essa semana")
- Documentacao, contrato, registro
- Taxa de condominio, prazo pra construir, regras de obra
- Promessa de valorizacao em numero ("a regiao vem crescendo" pode; "vai valorizar 40%" NUNCA)"""
