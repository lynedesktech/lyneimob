# Relatório executivo — 04/05/2026

Para: **Eduardo**
De: **Gabriel**
Sobre: **LyneImob (agora produto Duna)**

---

## O que aconteceu hoje

A **decisão estratégica de transformar o LyneImob num produto único da Duna** foi colocada em prática. Em vez de continuar como um software para várias imobiliárias (modelo SaaS), o sistema passa a ser totalmente customizado para o Angelo.

Tudo o que era complexidade desnecessária para a operação dele foi **escondido** — sem apagar, então a qualquer momento dá pra voltar atrás se mudar de ideia.

---

## O que o Angelo vai ver de diferente

### Antes
- Telas de "outras imobiliárias", "planos", "billing", "cobrança"
- Botão de cadastro público no site (qualquer um podia abrir conta)
- Painel mostrava dados de todas as 9 imobiliárias da plataforma
- Áreas escuras do app com botões e ícones quase invisíveis

### Agora
- Só as telas que ele usa: Painel, Negócios, Clientes, Atividades, Imóveis, Loteamentos, Configurações, Ajuda
- Painel mostra apenas os números da Duna
- Cadastro público bloqueado (só o Angelo decide quem entra na equipe dele)
- Modo escuro arrumado em mais de 10 telas

### Bugs que ele tinha reportado, resolvidos
1. **Cadastro de imóvel:** ele precisava percorrer todas as 6 etapas pra editar um campo do final. **Agora dá pra clicar direto na etapa.**
2. **Preço do imóvel sumia:** ele preenchia preço/condomínio/IPTU e não salvava. **Corrigido na raiz.**
3. **Menu lateral no modo escuro:** o item selecionado ficava preto sobre preto, ilegível. **Resolvido.**

---

## O que melhorou na operação do agente WhatsApp

Foram entregues 8 melhorias acumuladas (planejadas há semanas):

- **Follow-up automático** todo dia em horário comercial pra quem não respondeu (1 mensagem por conversa por dia)
- **Fechamento automático** de conversas paradas há mais de 24h
- **Memória de retorno** — quando o lead volta a falar dias depois, o agente reconhece e cumprimenta diferente
- **Botão liga/desliga global** da IA + bloqueio automático quando o corretor responde no lugar
- **Anti-bloqueio do WhatsApp** com pausa entre mensagens (evita o WhatsApp marcar como bot)
- **Privacidade da linha** ajustada (esconde "visto por último", aparece sempre online)
- **Monitoramento de erros** estruturado nos logs

E um **bug crítico foi descoberto na hora do teste** — o sistema rejeitaria mensagens com foto/áudio em produção. Corrigido antes de virar problema.

---

## O que está fechado e em produção agora

- Endereço: **lyneimob.vercel.app**
- 11 entregas mergeadas hoje
- 4 atualizações de produção
- App pronto para o Angelo usar amanhã

---

## Próximos passos (amanhã)

1. **Limpeza final do SaaS antigo** — tirar a parte de billing/Stripe que ainda existe escondida no código (não aparece pro usuário, mas pesa)
2. **Caça aos bugs visuais residuais** — abrir o app com o olhar do Angelo e listar tudo que ainda parecer "feio" ou "sumido"
3. **Revisar a equipe que o Angelo cadastrar** — testar o fluxo de adicionar um corretor da Duna

---

## Riscos / pendências

- O sistema ainda tem **código herdado** da fase SaaS que precisa ser limpo gradualmente. Não atrapalha o uso, mas é dívida técnica.
- A **decisão de voltar atrás** (reativar SaaS) ainda é viável — todas as mudanças foram feitas por um interruptor único, sem deletar nada.

---

*Documento gerado automaticamente a partir do log de trabalho. Versão técnica detalhada em `docs/relatorios/progresso.md`.*
