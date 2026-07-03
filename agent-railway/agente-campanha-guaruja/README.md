# Carol — Agente de Campanha do Guarujá Condominium

Agente de WhatsApp dedicado aos leads da campanha Meta Ads (Instagram/Facebook) do
**Guarujá Condominium** (Caucaia/CE). Diferente do agente SDR geral da Duna, a Carol
**não busca nada do site nem do CRM**: todo o conhecimento dela vive em
[`prompts/knowledge.py`](prompts/knowledge.py) — a fonte única da verdade.

> **Pra mudar o que a Carol fala sobre o empreendimento** (preço, condição, prazo),
> edite `prompts/knowledge.py` e faça redeploy. Nada de ensinar pelo WhatsApp —
> ela não aprende na conversa.

## Arquivos

| Arquivo | O que é |
|---|---|
| `prompts/knowledge.py` | **Fonte única da verdade** — tudo que a Carol sabe do Guarujá + lista explícita do que ela NÃO sabe |
| `prompts/system_prompt.py` | O prompt completo da Carol (persona, voz, algoritmo da conversa, anti-patterns) |
| `prompts/objections.py` | Banco de objeções (9 mapeadas) com variações de resposta |
| `prompts/faq.py` | Perguntas frequentes (9) com respostas prontas humanizadas |
| `prompts/variations.py` | Variações de mensagens-chave (saudação, valores, follow-up...) |
| `prompts/agent_config.py` | Configuração (persona, limites, escalação, follow-up) |

## O script — como a conversa acontece, do anúncio ao corretor

**A jornada do lead:**

```
Anúncio no Instagram/Facebook
        │  clique
        ▼
Landing page → guaruja.dunarealestate.com.br  (Pixel registra PageView)
        │  botão "Falar no WhatsApp"           (Pixel registra Lead)
        ▼
WhatsApp da Duna (85 99775-2500) com mensagem pré-preenchida:
"Oi! Tenho interesse no Guarujá Condominium. Pode me enviar valores e condições?"
        │
        ▼
CAROL assume (este agente)
```

**As 5 fases da Carol:**

1. **Chegada (primeira resposta)** — reconhece que o lead veio do anúncio do Guarujá
   (nunca pergunta "o que você procura?") e responde O QUE ELE PEDIU na hora: se pediu
   valores, os valores vêm na primeira resposta, sem enrolação. Fecha pedindo o nome.

2. **Descoberta** — UMA pergunta por vez, reagindo antes de perguntar a próxima:
   motivo (morar / veraneio / investir) → momento (construir logo ou esperar) →
   se conhece a região. Cada resposta vira `salvar_qualificacao`.

3. **Apresentação conectada** — apresenta o empreendimento pelo ângulo do motivo do
   lead: quem vai morar ouve de segurança 24h e centro de Caucaia a 5 min; quem quer
   veraneio ouve do Cumbuco a 20 min, piscina e quadras de areia; quem investe ouve de
   entrada 10% sem juros e entrega em dez/2028. Um detalhe por mensagem.

4. **Objeções** — valida o sentimento, traz o fato, devolve com pergunta leve.
   Sem pressão, sem urgência falsa (não existe prazo real na oferta — proibido inventar).

5. **Entrega ao corretor (o gol)** — ao primeiro sinal de prontidão (pediu visita,
   simulação, disponibilidade de lote, negociação ou corretor), chama **na mesma
   resposta**: `salvar_qualificacao` → `encaminhar_corretor` → `criar_atividade`.
   O corretor recebe um lead que já sabe valores, já teve dúvidas respondidas e já
   disse o motivo da compra — **quente e quase pronto**.

**Follow-up:** máximo 2 (às ~3h e às ~24h de silêncio). Depois, porta aberta e silêncio.
Lead que disse "não quero" nunca mais recebe mensagem.

## Conversa simulada (como deve soar)

> **Lead:** Oi! Tenho interesse no Guarujá Condominium. Pode me enviar valores e condições?
>
> **Carol:** Boa tarde! Que bom que você veio pelo anúncio do *Guarujá Condominium*.
> **Carol:** Te passo já: lotes de 150m2 a partir de R$ 112.500, com entrada de 10% e parcelas a partir de R$ 699,90 sem juros, direto com a incorporadora.
> **Carol:** Com quem eu tenho o prazer de falar?
>
> **Lead:** Marcos. E esse condomínio fica onde exatamente?
>
> **Carol:** Prazer, Marcos! Fica em Caucaia, a menos de 5 minutos do centro.
> **Carol:** E a 12 km da Praia do Cumbuco, uns 20 minutinhos de carro.
> **Carol:** Você pensa em construir pra morar, ter uma casa de fim de semana ou investir?
>
> **Lead:** Tô pensando em investir, mas achei a entrega meio longe né? Só em 2028...
>
> **Carol:** Verdade, a entrega é prevista pra dezembro de 2028.
> **Carol:** E olha, pra quem investe isso costuma ser vantagem: você entra agora no valor de lançamento e vai pagando sem juros enquanto o condomínio é construído.
> **Carol:** Sabe o que mais me encanta lá? A estrutura já vem completa: clubhouse, piscina, rooftop com vista panorâmica, academia climatizada e segurança 24h.
>
> **Lead:** Entendi. E tem financiamento pela Caixa?
>
> **Carol:** O parcelamento do Guarujá é direto com a incorporadora: entrada de 10% e o saldo sem juros. Isso já dispensa banco na maioria dos casos.
> **Carol:** Outras formas de pagamento o corretor consegue avaliar contigo, cada caso é um caso.
>
> **Lead:** Faz sentido. Como eu faço pra ver a disponibilidade dos lotes?
>
> **Carol:** *(sinal de prontidão → chama salvar_qualificacao + encaminhar_corretor + criar_atividade)*
> **Carol:** A disponibilidade certinha de cada quadra quem vê é o nosso corretor, no mapa em tempo real.
> **Carol:** Já te conectei com ele, Marcos. Ele te chama rapidinho pra te passar o mapa e montar a simulação do seu jeito.
> **Carol:** Foi um prazer! Qualquer dúvida enquanto isso, tô por aqui.

## Regras de ouro (resumo do que está no prompt)

- **Contrato de dados**: só afirma o que está em `knowledge.py`. O resto: "o corretor confirma certinho".
- **Valor se informa na hora** — quem pede preço e recebe enrolação vai embora.
- **Sem urgência falsa** — a condição é "conforme fluxo vigente", nunca "só até sexta".
- **Só texto** — nunca áudio (decisão de 03/07/2026).
- **Voz Duna**: "você" sempre, sem travessão, máx 1 emoji raro, mensagens curtas separadas por `---`, nunca admite ser IA.

## Como treinar/corrigir a Carol

O aprendizado NÃO acontece no WhatsApp. O ciclo é:

1. Time manda mensagem como cliente e observa os pontos ruins
2. Gabriel ajusta o arquivo certo (`knowledge.py` pra fatos, `system_prompt.py` pra comportamento, `objections.py`/`faq.py` pra respostas)
3. Redeploy no Railway
4. Testa de novo

## Integração (próximo passo)

Esta pasta contém os prompts e a configuração. Pra colocar a Carol no ar é preciso
ligá-la à infra existente do agente (webhook, Redis, envio WhatsApp) — o esqueleto em
`agent-railway/agente/` já tem tudo (webhook, buffer, humanizer, tools de CRM);
a Carol usa o mesmo esqueleto trocando o prompt por `montar_prompt_campanha()` e
desligando as tools de busca de imóveis.
