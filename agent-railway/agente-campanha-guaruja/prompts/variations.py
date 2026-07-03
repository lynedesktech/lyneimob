"""Variacoes de mensagens-chave da Carol (agente de campanha Guaruja).

A Carol NUNCA usa o mesmo texto pra dois leads. Estas variacoes servem
de repertorio: o modelo escolhe/adapta, e o codigo pode sortear com
get_variation() quando a mensagem e mecanica (follow-up, fora de horario).
"""

from __future__ import annotations

import random

VARIATIONS = {
    # Primeira resposta pro lead que chegou do anuncio (apos saudacao do horario)
    "boas_vindas_anuncio": [
        "Que bom que voce veio pelo anuncio do *Guaruja Condominium*!",
        "Vi que voce se interessou pelo *Guaruja Condominium*, que escolha boa, viu.",
        "Voce chegou pelo anuncio do *Guaruja*, ne? Fico feliz, e o lancamento que eu mais gosto de apresentar.",
        "Seja muito bem-vindo! O *Guaruja Condominium* e a nossa joia em Caucaia.",
        "Que bom te ver por aqui! O anuncio do *Guaruja* tem chamado muita atencao mesmo.",
    ],
    # Entrega de valores (informacao publica, direto ao ponto)
    "valores": [
        "Te passo ja: lotes de 150m2 a partir de R$ 112.500, entrada de 10% e parcelas a partir de R$ 699,90, sem juros, direto com a incorporadora.",
        "Olha os numeros: lote de 150m2 a partir de R$ 112.500. Entrada de 10% e o saldo sem juros, com parcelas a partir de R$ 699,90.",
        "Vou direto ao ponto: a partir de R$ 112.500 o lote de 150m2, com 10% de entrada e parcelamento sem juros a partir de R$ 699,90.",
    ],
    # Coleta de nome
    "pedir_nome": [
        "Com quem eu tenho o prazer de falar?",
        "Antes de tudo, me diz seu nome pra eu te chamar certinho?",
        "E o seu nome, qual e?",
    ],
    # Descoberta (motivo da compra)
    "descoberta_motivo": [
        "Me conta, voce pensa em construir pra morar, ter uma casa de fim de semana ou investir?",
        "E esse lote seria pra que, morar, veranear ou investimento?",
        "Qual e o plano: construir logo, casa de praia ou garantir o lote e ver ele valorizar?",
    ],
    # Descoberta (regiao)
    "descoberta_regiao": [
        "Voce ja conhece Caucaia e a regiao do Cumbuco?",
        "Ja andou por Caucaia? A regiao ta crescendo bonito.",
        "Conhece o Cumbuco? O Guaruja fica a uns 20 minutinhos de la.",
    ],
    # Transicao pra apresentar estrutura
    "transicao_estrutura": [
        "Deixa eu te contar o que mais me encanta la.",
        "Sabe o que faz o Guaruja ser diferente?",
        "Vou te falar do que o pessoal mais gosta no projeto.",
    ],
    # Confirmacoes curtas
    "confirmacao": [
        "Show!",
        "Que coisa boa.",
        "Perfeito entao.",
        "Otima escolha, viu.",
    ],
    # Encaminhamento pro corretor
    "escalacao": [
        "Vou te conectar com nosso corretor, ele te acompanha de pertinho a partir daqui.",
        "Deixa comigo: ja passei seus dados pro nosso corretor, ele te chama rapidinho.",
        "O proximo passo e com nosso corretor, que ja vai entrar em contato contigo. Voce vai adorar o atendimento.",
    ],
    # Follow-up 1 (cliente sumiu ha ~3h)
    "followup_1": [
        "Oi! Ficou alguma duvida sobre o Guaruja? To por aqui.",
        "E ai, conseguiu pensar no Guaruja? Qualquer duvida e so chamar.",
        "Oi de novo! Se quiser, te ajudo com mais algum detalhe do Guaruja.",
    ],
    # Follow-up 2 e ULTIMO (dia seguinte, com valor, porta aberta)
    "followup_2": [
        "Vou deixar aqui a pagina do Guaruja pra voce ver as fotos com calma: https://guaruja.dunarealestate.com.br . Qualquer coisa, e so me chamar, ta?",
        "Passando pra deixar o link com tudo do Guaruja: https://guaruja.dunarealestate.com.br . Fico por aqui pro que precisar.",
    ],
    # Despedidas
    "despedida": [
        "Foi um prazer falar contigo! Qualquer coisa, e so chamar.",
        "Obrigada pelo papo, viu. To sempre por aqui.",
        "Tudo de bom pra voce! Aparece quando quiser.",
    ],
    # Fora de horario (se o toggle de horario estiver ativo)
    "fora_horario": [
        "Oi! Recebi sua mensagem, viu. Ja te respondo assim que nosso atendimento abrir, prometo que nao demoro.",
        "Obrigada por chamar! Nosso atendimento ja abre e eu te respondo em primeiro lugar.",
    ],
}


def get_variation(category: str) -> str:
    """Retorna uma variacao aleatoria da categoria."""
    return random.choice(VARIATIONS[category])
