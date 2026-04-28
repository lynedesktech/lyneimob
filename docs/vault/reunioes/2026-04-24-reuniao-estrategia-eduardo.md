---
title: "Reuniao de Estrategia — Joao e Eduardo"
date: 2026-04-24
tags: [reuniao, estrategia, eduardo, lynedesk, pivot, d0]
---

# Reuniao de Estrategia — Joao e Eduardo

**Data:** 24/04/2026, 15h28
**Duracao:** 30 minutos
**Local:** Google Meet
**Transcricao:** https://app.tactiq.io/api/2/u/m/r/xurmr43Y59dxCAODhzm6?o=txt

## Participantes

| Membro | Papel | Presente |
|--------|-------|----------|
| Joao Lucas | CTO / PO | Sim |
| Eduardo Santana | CEO / Socio | Sim |

## Pauta

1. Fechamento das 3 entregas do Eduardo ([[LYNEDES-87]], [[LYNEDES-88]], [[LYNEDES-89]])
2. Revisao do Parecer Estrategico e Feedback do Produto (documentos entregues antes da reuniao)
3. Posicionamento do produto — direcao estrategica
4. Frentes comerciais (Angelo, Rafael Odoni, Fernando Versalhes, evento de agosto)
5. Estado da equipe (Vitoria, Gabriel, Mateus)
6. Filha de EVA / SaaS de Comunidade (projeto a parte, fora da Lynedesk)

## Documentos entregues pelo Eduardo (pre-reuniao)

Eduardo entregou os 3 documentos que estavam pendentes ha 3–6 dias. Conteudo completo transcrito em:

- [[parecer-estrategico-eduardo-2026-04]] — avaliacao executiva da visao de futuro
- [[feedback-produto-eduardo-2026-04]] — respostas do questionario de 89 perguntas (3 blocos)

Com isso, [[LYNEDES-87]], [[LYNEDES-88]] e [[LYNEDES-89]] foram concluidas.

## Pontos discutidos

### 1. Pivot de posicionamento — "O fim do CRM"

Eduardo abriu a reuniao expressando inseguranca sobre colocar o produto no mercado no estagio atual. Ele mesmo diz: "a ideia e muito boa, o aplicativo e muito bom, mas quando a gente vai pro 'vamos por isso no mercado' eu ainda fico com uma inseguranca muito grande".

Joao concordou: o produto e tecnicamente excelente, mas falta amarracao operacional. Convergiu-se pra um pivot de posicionamento.

**Decisao:** o Lyneimob nao e CRM. E o **sistema centralizador da operacao imobiliaria**, trabalhando em conjunto com corretores e gestores atraves de equipes de agentes IA em processos hibridos. A mensagem de marketing vai ser "**o fim do CRM**" / "voce nao precisa mais de CRM".

Detalhes e consequencias em [[pivot-posicionamento-motor-centralizador]].

### 2. Foco operacional e comercial (marketing sai do imediato)

Eduardo reforcou: "a gente tem que ter mais do que sempre mais pessoas do que a gente precisa, porque as pessoas tem a vida delas. A gente precisa e de dar pra pessoa utilizar".

Marketing, SEO/AEO e blog com IA viram **fase 3** do parecer (Gerar Demanda) — nao e o foco agora. A fase 1 e consolidar o core: IA WhatsApp estavel, pipeline robusto, onboarding simplificado, entrega clara de valor ao cliente.

Joao manteve a visao dos 7 canais de aquisicao no futuro, mas concordou que hoje nao e prioridade.

### 3. Janela comercial — evento de agosto

Evento em agosto reune 500+ corretores e 200 imobiliarias diretas. Eduardo e palestrante. Lynedesk patrocina.

**Meta:** fechar 10% das 200 imobiliarias no periodo do evento = 20 clientes. Com um indicador de 10% de indicacao dessas 20 = 2 a mais. Potencial inicial: 20 × R$2.000 = R$40.000 MRR, subindo pra R$60.000 com indicacoes.

Janela de preparacao: maio, junho, julho. Precisa de produto estavel, cases reais (Angelo, Rafa Invictus, Jader) e material comercial pronto.

### 4. Proposta Fernando (Versalhes) — canal white-label

Fernando pediu um sistema proprio pra imobiliaria dele com recursos que o Lyneimob nao entrega (agente IA por filial, integracao com Instagram central Versalhes etc). Desenvolver isso consumiria a Vitoria por meses. Inviavel.

**Decisao:** ao inves de desenvolver do zero, oferecer **duplicata do Lyneimob com marca Versalhes** — same tech, marca dele, ele vende pra rede Versalhes. Split **70% Lynedesk / 30% Fernando**, escalonavel conforme volume.

Joao marca reuniao com Fernando pra propor; se ele aceitar, Eduardo entra na negociacao dos percentuais. Eduardo: "eu nao concordo com nada que seja 50. Cobre o custo operacional, 70/30, e a gente escalona conforme ele trouxer frentes".

Detalhes em [[proposta-white-label-fernando-versalhes]].

### 5. Arquitetura dual — SDR + Analista IA

Joao apresentou o conceito que ja usa no OpenClaw: o atendente (SDR) so atende, e uma **Analista IA separada** processa as conversas e preenche o CRM. Conversas salvas em markdown (obsidian criptografado) — permite milhares de conversas com peso minimo e a IA ganha "experiencia de vida" em vez de informacao injetada.

Eduardo validou. Esta e a base do epico [[LYNEDES-111]] (IA Analista de Conversa — Gabriel), atualmente em Backlog com 7 subtasks.

Gabriel parou 2 dias nessa linha por falta de resposta do grupo sobre o protocolo. Joao ja cobrou no dia da reuniao.

### 6. Estado da equipe (informal)

**Vitoria:** esta estressada com demandas extras que nao sao do Lyneimob (Fernando pediu coisas extras, filha de EVA, Sulamita). Vitoria disse que "o contrato diz" que a gente desenvolveria sistema novo pro Fernando — Joao esclareceu que nao diz isso, o contrato original e Lyneimob (SaaS) mais agente, nao sistema novo. **Acao:** Joao tem 1:1 com Vitoria pra separar escopo.

**Mateus:** esta inseguro financeiramente, pensando em voltar pra Minas. Eduardo: "Mateus foi o primeiro a falar pra aprender a falar isso". Zero entregas no Linear na semana, 6 issues urgentes atrasadas. Precisa de 1:1. Joao ja discutiu no grupo mais cedo.

**Gabriel:** moscou 2 dias no SaaS por espera de resposta no grupo. Ja cobrado. Arquitetura dual ja estava especificada mas nao iniciada.

### 7. Trinca comercial — Angelo, Rafael, Odoni

Eduardo pediu pra Joao "aproximar do Angelo agora que ja inseriu — 'como ta, to me colocando a disposicao'". Mesma coisa com Rafa (Invictus) e o Odoni. Sao os 3 clientes mais proximos de virar case.

Raissa vai alinhar aula / apresentacao com a turma da clinica que ja usa (mais 3 pessoas: Rafael, Odoni e "um rapaz novo"). Joao ainda tem que conferir com Raissa a data.

### 8. Filha de EVA / SaaS de Comunidade

**Decisao:** produto separado do Lyneimob. Nao envolve equipe Lynedesk (Vitoria, Gabriel, Mateus nao entram). **Joao sozinho** desenvolve.

Escopo: SaaS de comunidade (rede social + gamificacao + e-commerce integrado). Sulamita (Filha de EVA) nao palpita no produto — ela aprova o visual e vende na rede dela.

**Plano:**
- Segunda 27/04 — Joao manda PCD (Product Concept Document) pro Eduardo
- Terca 29/04 — Eduardo leva pra Sulamita em SP (almoco)
- Em 7 dias — aprovacao ou reprovacao
- Se aprovado — MVP em 15 dias

Projeto criado no workspace Linear JLAU (fora da Lynedesk) — ver projeto `SaaS de Comunidade`.

## Decisoes

### D1. Pivot de posicionamento — "o fim do CRM"
Lyneimob nao e CRM, e motor centralizador. Copy muda em site, playbook, video. Ver [[pivot-posicionamento-motor-centralizador]].

### D2. Marketing vai pra fase 3
Marketing/SEO/blog/automacao de conteudo ficam pra depois do core estabilizado. Issues relacionadas vao pro Backlog ou baixa prioridade.

### D3. Fernando Versalhes — white-label
Duplicata do Lyneimob com marca Versalhes, split 70/30 escalonavel. Ver [[proposta-white-label-fernando-versalhes]].

### D4. SaaS de Comunidade e projeto pessoal do Joao
Fora da Lynedesk. Workspace JLAU. Equipe Lynedesk nao envolvida.

### D5. Joao vai assumir cobranca mais ativa da equipe
Eduardo pediu explicitamente: "voce precisa pegar e fazer assim, cara. Eu preciso de fazer o Mateus chegar em 10 pessoas usando o sistema. Eu preciso de fazer que a Vitoria finalize isso. Eu preciso de fazer que o Gabriel finalize aquilo". Joao concordou.

### D6. Meta do evento de agosto formalizada
200 imobiliarias × 10% = 20 clientes. Meta vai virar issue de preparacao.

## Acoes pos-reuniao (Joao)

### Imediato (hoje)

- [X] Fechar [[LYNEDES-87]] (Parecer + Bloco 1 do Feedback)
- [X] Fechar [[LYNEDES-88]] (Bloco 2 — publico-alvo)
- [X] Fechar [[LYNEDES-89]] (Bloco 3 — posicionamento)
- [X] Salvar PDFs em `referencias/`
- [X] Registrar esta ata no vault
- [X] Registrar decisoes [[pivot-posicionamento-motor-centralizador]] e [[proposta-white-label-fernando-versalhes]]

### Ate sexta (25/04)

- [ ] 1:1 com Mateus — apoiar permanencia, destravar execucao (cria issue Urgent)
- [ ] 1:1 com Vitoria — separar escopo (nao e responsavel por dev novo pro Fernando) (cria issue Urgent)
- [ ] Confirmar com Raissa data da apresentacao pra trinca (Rafael / Odoni / novo)

### Proxima semana

- [ ] Criar issue de proposta white-label pro Fernando Versalhes (cria issue)
- [ ] Atualizar copy do site / playbook / video com novo posicionamento (cria issues)
- [ ] Definir pricing escalonado (Starter / Professional / Enterprise) (cria issue)
- [ ] Refinar relatorio operacional conforme feedback Eduardo (cria issue)
- [ ] Simplificar protocolo de trabalho conforme feedback Eduardo (cria issue p/ Vitoria)
- [ ] Criar issue-mae do evento de agosto (cria issue)
- [ ] Criar epico do pilar faltante "Gestao de equipe e performance comercial"

### SaaS de Comunidade (projeto novo)

- [ ] Criar projeto "SaaS de Comunidade" no workspace Linear JLAU
- [ ] Criar issue inicial: PCD entregue ate segunda 27/04
- [ ] Criar vault `docs/vault/` em `SaaS de Comunidade/`
- [ ] Escrever PCD (`referencias/pcd-produto.md`)

## Proximos passos

1. Executar acoes imediatas e ate sexta
2. 1:1 com Mateus e Vitoria na sexta
3. Escrever PCD do SaaS de Comunidade no final de semana
4. Segunda 27/04: mandar PCD pro Eduardo
5. Preparar reuniao com Fernando Versalhes (segunda/terca)
6. Destravar LYNEDES-71 e LYNEDES-103 com Gabriel (estabilidade do agente + dual SDR/Analista)
