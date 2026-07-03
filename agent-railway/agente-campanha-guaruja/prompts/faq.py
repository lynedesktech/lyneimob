"""FAQ do Guaruja Condominium — respostas prontas e humanizadas.

Fonte: landing page oficial (guaruja.dunarealestate.com.br) + condicoes
publicadas no anuncio. Se a resposta nao esta aqui nem em knowledge.py,
a Carol NAO responde por conta propria: encaminha pro corretor.
"""

from __future__ import annotations

FAQ = {
    "onde_fica": {
        "detection": ["onde fica", "localizacao", "endereco", "que cidade", "fica aonde"],
        "answer": (
            "Fica em Caucaia, no Ceara, regiao metropolitana de Fortaleza."
            "\n---\n"
            "A menos de 5 minutos do centro de Caucaia e a 12 km da Praia do Cumbuco, uns 20 minutinhos de carro."
        ),
    },
    "tamanho_lote": {
        "detection": ["tamanho", "metragem", "quantos metros", "m2", "dimensao", "medida do lote"],
        "answer": (
            "Os lotes tem 150m2, na metragem padrao de 6 metros de frente por 25 de fundo."
            "\n---\n"
            "Espaco bom pra construir a casa do seu jeitinho."
        ),
    },
    "valores_condicoes": {
        "detection": ["valor", "preco", "quanto custa", "quanto ta", "condicoes", "parcela", "entrada"],
        "answer": (
            "Os lotes partem de R$ 112.500."
            "\n---\n"
            "A condicao e entrada de 10% e o saldo parcelado sem juros, direto com a incorporadora. Parcelas a partir de R$ 699,90, conforme o fluxo vigente."
            "\n---\n"
            "A simulacao exata pro seu caso o corretor monta rapidinho."
        ),
    },
    "prazo_entrega": {
        "detection": ["entrega", "quando fica pronto", "prazo", "quando entrega", "data de entrega"],
        "answer": "A entrega do condominio esta prevista pra dezembro de 2028.",
    },
    "lazer_estrutura": {
        "detection": [
            "lazer", "estrutura", "o que tem", "area comum", "piscina", "academia",
            "clube", "clubhouse", "rooftop", "quadra", "playground", "pet",
        ],
        "answer": (
            "A estrutura e completa, viu: portaria com seguranca 24h, clubhouse, piscina adulto e infantil, rooftop com vista panoramica e academia climatizada."
            "\n---\n"
            "Tem tambem quadras de areia pra beach tennis e volei, pet place e playground."
            "\n---\n"
            "E a infraestrutura ja vem pronta: agua e esgoto com estacao de tratamento propria, iluminacao em LED e ruas com piso intertravado."
        ),
    },
    "quem_desenvolve": {
        "detection": ["construtora", "incorporadora", "quem desenvolve", "quem constroi", "lotus"],
        "answer": (
            "O empreendimento e desenvolvido pela Lotus Urbanismo e comercializado pela Duna Real Estate, especialista na regiao."
        ),
    },
    "como_visitar": {
        "detection": ["visitar", "conhecer", "ver o terreno", "ir ai", "agendar visita", "plantao"],
        "answer": (
            "Que otimo, conhecer pessoalmente muda tudo!"
            "\n---\n"
            "Vou te conectar com nosso corretor pra ele agendar a visita no melhor dia pra voce."
        ),
        # ATENCAO: esta resposta e um SINAL DE PRONTIDAO — junto dela a Carol
        # chama salvar_qualificacao + encaminhar_corretor + criar_atividade.
    },
    "fotos_material": {
        "detection": ["fotos", "imagens", "video", "material", "book", "plantas", "mapa"],
        "answer": (
            "Te mando a pagina oficial, la tem as fotos e todos os detalhes: https://guaruja.dunarealestate.com.br"
            "\n---\n"
            "O mapa de lotes e disponibilidade o corretor te apresenta certinho."
        ),
    },
    "disponibilidade": {
        "detection": ["tem lote", "ainda tem", "disponivel", "quantos restam", "esgotou", "sobrou"],
        "answer": (
            "Os lotes estao em comercializacao sim!"
            "\n---\n"
            "A disponibilidade exata de cada quadra quem confirma e o corretor, que ve o mapa em tempo real. Quer que eu ja te conecte com ele?"
        ),
        # Tambem costuma ser sinal de prontidao se o lead insistir.
    },
}
