---
title: "Reunião de Onboarding — Equipe Lynedesk"
date: 2026-04-14
tags: [reuniao, onboarding, equipe, d0]
---

# Reunião de Onboarding — Equipe Lynedesk

**Data:** 14/04/2026, 10h
**Duração:** ~60 minutos
**Local:** Google Meet
**Transcrição:** Tactiq AI

## Participantes

| Membro | Papel | Presente |
|--------|-------|----------|
| João Lucas | CTO / PO | Sim |
| Vitória Belmiro | Desenvolvedora | Sim |
| Gabriel Vieira | Desenvolvedor IA | Sim |
| Mateus Santana | Comercial / Ops | Sim (atrasado — dentista) |
| Eduardo Santana | CEO / Sócio | Ausente (médico) |

## Pauta

1. Apresentação do produto (LyneImob)
2. Definição de papéis
3. Protocolo de trabalho (ferramentas, fluxo, regras)
4. Demonstração do Claude Code + MCP Linear
5. Base de conhecimento (Obsidian Vault)
6. Demandas de cada membro
7. Feedback obrigatório dos documentos
8. Próximos passos

## Decisões tomadas

### 1. Papéis definidos
- **João:** CTO/PO — cria tasks, define prioridades, aprova entregas, decide arquitetura
- **Eduardo:** CEO — visão de mercado, posicionamento, validação estratégica (não técnico, contribui via WhatsApp)
- **Vitória:** Dev — infra, frontend, backend, banco de dados (tudo do sistema)
- **Gabriel:** Dev IA — agente WhatsApp, automações, inteligência artificial
- **Mateus:** Comercial/Ops — clientes, demos, vendas, acompanhamento

Frase-chave: "Vitória cuida do sistema. Gabriel cuida da IA. Mateus cuida do cliente. João cuida da gestão. Eduardo cuida da visão."

### 2. Demandas do agente IA são do Gabriel
João decidiu que todas as demandas relacionadas ao agente IA (incluindo bugs como LYNEDES-71) são responsabilidade do Gabriel, não da Vitória. LYNEDES-71 foi reatribuída.

### 3. Ferramentas e cadência
- **Git/GitHub:** código (toda alteração vive aqui)
- **Linear:** gestão (tasks, specs, progresso) — centro de comando
- **WhatsApp:** comunicação rápida (avisos curtos com referência ao Linear)
- **Obsidian:** memória (decisões, aprendizados, atas, processos)

Cadência obrigatória: `Código → Git → Linear → WhatsApp`

### 4. Regras inegociáveis confirmadas
- Uma task por vez, na sequência do Linear
- Só João cria e fecha tasks
- Build tem que passar antes de commit
- Qualidade > Velocidade
- Mensagem no WhatsApp sem commit = nada para validar

### 5. Protocolo unificado no repo
João quer o protocolo de trabalho no repositório Git para que cada Claude Code leia automaticamente. Issue criada: LYNEDES-93.

### 6. WhatsApp
- Grupo atual é exclusivo para tecnologia — avisos curtos no formato `[LYNEDES-XX] Resumo`
- Possível segundo grupo para comunicação geral (LYNEDES-96)
- Slack no futuro, WhatsApp por agora

### 7. Feedback obrigatório
Todos devem ler 4 documentos e enviar feedback individual até 21/04:
- LyneImob — Produto Atual
- LyneImob — Visão de Futuro
- Protocolo de Trabalho
- Relatório Operacional D0

## Setup técnico

| Membro | MCP Linear | Claude Code | Status |
|--------|-----------|-------------|--------|
| Vitória | Configurado | Funcionando | OK (PC lento) |
| Gabriel | Em configuração | Instalado | Precisa finalizar |
| Mateus | Pendente | Pendente | Fará em casa |

### Observações técnicas
- Vitória e Gabriel esgotaram créditos Claude Code durante a reunião (~5h de uso)
- PC da Vitória muito lento — João ofereceu notebook da Lynedesk
- João explicou que specs detalhadas no Linear reduzem consumo de créditos

## Pontos levantados

### Rafael Doni — potencial beta tester
Gabriel mencionou ter contato do Rafael Doni como potencial beta tester. Precisa enviar para Mateus. Issue criada: LYNEDES-95.

### Angelo — timeline
Mateus precisa dar retorno ao Angelo sobre data de implementação. Tudo está no Linear — Mateus deve consultar.

### Créditos Claude Code
A equipe precisa de gestão dos créditos. João quer pensar em solução para que resync/reboot não impacte a equipe.

### Pedro da MR
Mateus mencionou que Pedro da MR é "muito chato" e manda mensagens todo dia. João sinalizou que este assunto foge do escopo do grupo de tecnologia.

## Próximos passos

| Quem | O quê | Quando |
|------|-------|--------|
| Vitória | Começar LYNEDES-75 (remover onboarding) | 14/04 12:30-13h |
| Gabriel | Começar LYNEDES-83 (mapear stack IA) | 14/04 após escola |
| Mateus | Começar LYNEDES-91 (dados Angelo) | 14/04 hoje |
| João | Setup ambiente (LYNEDES-63) | 14/04 |
| João | Reunião com Eduardo | 15/04 15h |
| Todos | Feedback dos 4 documentos | Até 21/04 |

## Issues criadas pós-reunião

| ID | Título | Responsável |
|----|--------|-------------|
| LYNEDES-93 | Protocolo unificado no repositório Git | João |
| LYNEDES-94 | Planejamento de marketing (redes sociais) | João |
| LYNEDES-95 | Rafael Doni — avaliar como beta tester | Mateus (via João) |
| LYNEDES-96 | Grupo WhatsApp Lynedesk Geral | Mateus (via João) |

## Mudanças no Linear pós-reunião

- 14 issues atribuídas à Vitória
- 6 issues atribuídas ao Gabriel (incluindo LYNEDES-71 reatribuída)
- LYNEDES-36 movida para Concluído com comentário
- LYNEDES-71 comentada sobre mudança de assignee

---

*Ata gerada automaticamente pelo Claude Code a partir da transcrição Tactiq.*
*[[protocolo-lynedesk|Protocolo de Trabalho]] | [[lyneimob-decisoes-sprint-2026-04-11|Decisões Sprint]]*
