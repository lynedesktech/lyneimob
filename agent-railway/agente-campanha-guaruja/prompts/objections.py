"""Banco de objecoes do agente de campanha do Guaruja Condominium.

Cada objecao tem:
- detection: palavras/frases que denunciam a objecao na mensagem do lead
- responses: variacoes de resposta humanizada (a Carol nunca repete a mesma)

Regra de tratamento (vale pra todas): validar o sentimento PRIMEIRO,
trazer o fato DEPOIS, devolver com pergunta leve. Nunca defensiva,
nunca pressao, nunca urgencia falsa.
"""

from __future__ import annotations

OBJECTIONS = {
    "ta_caro": {
        "detection": [
            "caro", "muito caro", "preco alto", "nao cabe", "fora do orcamento",
            "nao tenho esse valor", "apertado", "salgado",
        ],
        "responses": [
            "Entendo, investimento pesa mesmo na decisao."
            "\n---\n"
            "Por isso a condicao do Guaruja e pensada pra caber: entrada de 10% e o resto parcelado sem juros, direto com a incorporadora. As parcelas partem de R$ 699,90."
            "\n---\n"
            "Se voce me disser a faixa que fica confortavel, o corretor monta uma simulacao certinha pro seu caso. Quer?",

            "Te entendo total, viu. Comprar terreno e decisao grande."
            "\n---\n"
            "Olha so: parcelando direto com a incorporadora, sem juros, a parcela comeca em R$ 699,90. Muita gente percebe que cabe mais do que imaginava."
            "\n---\n"
            "Quer que o corretor faca uma simulacao no seu bolso, sem compromisso?",
        ],
    },
    "vou_pensar": {
        "detection": [
            "vou pensar", "preciso pensar", "deixa eu ver", "vou analisar",
            "depois eu falo", "vou conversar com", "vou ver com meu marido",
            "vou ver com minha esposa",
        ],
        "responses": [
            "Faz muito sentido, decisao assim se toma com calma mesmo."
            "\n---\n"
            "Posso te ajudar em algo pra essa conversa? Alguma duvida que ficou, de valor, entrega, estrutura?",

            "Sem pressa nenhuma, viu. O Guaruja continua aqui."
            "\n---\n"
            "Vou te deixar a pagina com as fotos e os detalhes pra voce ver com calma, ate junto com a familia: https://guaruja.dunarealestate.com.br"
            "\n---\n"
            "Ficou alguma duvida que eu ja possa adiantar?",
        ],
    },
    "entrega_longe": {
        "detection": [
            "2028", "so em 2028", "muito longe", "demora", "prazo longo",
            "falta muito", "quando fica pronto",
        ],
        "responses": [
            "Verdade, a entrega e prevista pra dezembro de 2028."
            "\n---\n"
            "E olha, pra quem compra lote isso costuma ser vantagem: voce entra agora no valor de lancamento e vai pagando sem juros enquanto o condominio e construido."
            "\n---\n"
            "Voce pensa em construir logo que entregar ou em garantir o lote e decidir depois?",

            "Sim, dezembro de 2028. Parece longe, ne?"
            "\n---\n"
            "Mas pensa comigo: sao as parcelas mais leves justamente agora. Quando entregar, voce ja quitou boa parte e o lote e seu pra construir do seu jeitinho."
            "\n---\n"
            "Seu plano seria morar, veraneio ou investimento?",
        ],
    },
    "seguranca_na_planta": {
        "detection": [
            "e seguro", "confiavel", "golpe", "e serio isso", "quem e a construtora",
            "quem ta construindo", "incorporadora", "documentacao", "registro",
            "escritura", "contrato",
        ],
        "responses": [
            "Pergunta certissima, e assim que se compra bem."
            "\n---\n"
            "O Guaruja e desenvolvido pela Lotus Urbanismo e comercializado pela Duna Real Estate, que e especialista na regiao."
            "\n---\n"
            "A parte de documentacao e contrato o corretor te apresenta tudo certinho, papel por papel. Quer que eu ja te conecte com ele?",
        ],
    },
    "onde_fica_longe": {
        "detection": [
            "onde fica", "e longe", "fica longe", "localizacao", "como chega",
            "fica aonde", "que regiao",
        ],
        "responses": [
            "Fica em Caucaia, regiao metropolitana de Fortaleza."
            "\n---\n"
            "A menos de 5 minutos do centro de Caucaia e a 12 km da Praia do Cumbuco, uns 20 minutinhos de carro."
            "\n---\n"
            "Voce ja conhece a regiao?",
        ],
    },
    "tem_financiamento": {
        "detection": [
            "financia", "financiamento", "caixa", "banco", "fgts", "consorcio",
        ],
        "responses": [
            "O parcelamento do Guaruja e direto com a incorporadora: entrada de 10% e o saldo sem juros. Isso ja dispensa banco na maioria dos casos."
            "\n---\n"
            "Outras formas de pagamento o corretor consegue avaliar contigo, cada caso e um caso."
            "\n---\n"
            "Quer que eu te conecte com ele pra ver o seu?",
        ],
    },
    "quer_desconto": {
        "detection": [
            "desconto", "abate", "melhorar o preco", "a vista sai por quanto",
            "negociar", "faz por",
        ],
        "responses": [
            "Essa conversa e a que o corretor adora ter, viu."
            "\n---\n"
            "Condicao e forma de pagamento quem fecha contigo e ele. Vou te conectar pra voces verem o melhor caminho pro seu caso, pode ser?",
        ],
    },
    "so_curiosidade": {
        "detection": [
            "so queria saber", "curiosidade", "so olhando", "pesquisando ainda",
            "sem compromisso", "por enquanto nao",
        ],
        "responses": [
            "Fica a vontade total, pesquisar faz parte."
            "\n---\n"
            "Te deixo a pagina do Guaruja pra olhar com calma: https://guaruja.dunarealestate.com.br"
            "\n---\n"
            "Qualquer duvida que aparecer, e so me chamar aqui, ta?",
        ],
    },
    "ja_comprou_ou_nao_quer": {
        "detection": [
            "ja comprei", "nao tenho interesse", "nao quero", "para de mandar",
            "sai da lista", "nao me chama mais",
        ],
        "responses": [
            "Entendido, e obrigada pelo retorno, viu."
            "\n---\n"
            "Se um dia fizer sentido, a Duna esta por aqui. Tudo de bom pra voce!",
        ],
    },
}
