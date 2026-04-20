# Onboarding de cliente novo — LyneImob

> Checklist pra levar um cliente beta do "fechou a venda" até o "usando o sistema" em **menos de 1 dia útil**.
>
> Criado em LYNEDES-61. Atualizado a cada ciclo de onboarding.

---

## 1. Antes do primeiro contato (Mateus)

Coletar antes da demo ou na 1ª reunião:

- [ ] Nome legal da imobiliária
- [ ] CNPJ
- [ ] CRECI (se aplicável)
- [ ] Email principal de contato (admin)
- [ ] WhatsApp que vai receber os leads
- [ ] **Slug desejado** (`imobiliaria-copacabana`, `jardins-imoveis`…) — lowercase, sem espaços ou acentos, sem números no começo
- [ ] **Logo** (PNG ou SVG com fundo transparente, quadrado de preferência)
- [ ] **Paleta da marca** (2 cores HEX: primária e destaque)

## 2. Setup inicial no sistema (Vitoria — automático)

Quando o cliente faz signup em `/cadastro` o sistema cria sozinho:

- Organização + slug
- Usuário admin (com a senha que o cliente definiu)
- Pipeline padrão (Novo Lead → Contato → Qualificado → Visita → Proposta → Fechado/Perdido)
- Tipos de atividade padrão (Ligação, Visita, Follow-up, Reunião)
- Plano **Essencial (trial 14 dias)** ativo

**Se o cliente não quer fazer signup sozinho:** rodar `scripts/criar-organizacao.mjs` (TBD — ainda não existe, por enquanto criar manual via dashboard `/admin/organizacoes`).

## 3. Configuração visual (cliente ou Mateus pelo cliente)

No painel logado, em **Configurações → Meu Site**:

1. Upload do logo → vai pra `logo_url`
2. Paleta → `configuracoes_site.cores.primaria` e `.destaque`
3. Endereço, telefone, CRECI da imobiliária (Dados da Empresa)

**O que isso habilita automaticamente:**

- Logo aparece na sidebar do dashboard (LYNEDES-90)
- Cores pintam o dashboard inteiro — botões primários, sidebar, badges, wizards (LYNEDES-128)
- Site público no slug configurado (`lyneimob.com/{slug}`) já tem as cores

## 4. Integrações (Vitoria apoia se necessário)

Por ordem de prioridade do cliente:

- [ ] **WhatsApp** (Configurações → WhatsApp): configurar URL + token da Uazapi e escanear QR code
- [ ] **Portais** (Configurações → Portais): gerar token do webhook e copiar URL do feed XML pra cada portal (ZAP, OLX, VivaReal)
- [ ] **Stripe** (automático após upgrade de plano): cliente escolhe plano em `/configuracoes/plano` e paga via checkout

## 5. Mensagem de boas-vindas (Mateus — manual por ora)

Template curto (enviar via WhatsApp após o signup):

```
Oi {{nome}}! 🎉

Seu LyneImob tá pronto em https://lyneimob.com/painel

Próximos passos (5min cada):
1. Entrar em Configurações → Meu Site e fazer upload do logo + cores
2. Conectar o WhatsApp em Configurações → WhatsApp
3. Cadastrar 3 imóveis pra testar o fluxo completo

Qualquer dúvida manda aqui. Dou retorno em até 24h úteis.

— Mateus
```

## 6. SLA — equipe Lynedesk

| Situação | Prazo de resposta |
|----------|-------------------|
| Cliente trava em onboarding (primeiros 3 dias) | **4 horas úteis** |
| Bug crítico (sistema fora do ar, não consegue logar) | **2 horas úteis** |
| Dúvida geral | **24 horas úteis** |
| Feature request / sugestão | 5 dias úteis (resposta; implementação depende de prioridade) |

## 7. Checklist "pronto pra usar"

Cliente está onboarded quando:

- [ ] Signup feito, plano ativo (trial ou pago)
- [ ] Logo + cores configuradas
- [ ] Pelo menos 1 imóvel cadastrado
- [ ] WhatsApp conectado (se for usar o agente SDR)
- [ ] Sabe onde ver os leads (menu **Negócios**)

Mateus marca como "onboarded" no Linear/CRM interno.
