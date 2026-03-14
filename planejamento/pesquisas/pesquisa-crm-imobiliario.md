# Pesquisa: CRM Imobiliário — Funcionalidades e Integrações com Portais

**Data**: 2026-03-14
**Tema**: Mapeamento de funcionalidades dos principais CRMs imobiliários e como integrar com portais imobiliários brasileiros

---

## 1. Estado Atual da Codebase

O projeto LyneImob está em fase zero — nenhum código implementado. Existe apenas a estrutura de template com:
- Skills do método anti-vibe-coding configuradas
- Context7 (MCP) configurado para busca de documentação
- Pastas de planejamento criadas
- Roadmap vazio
- CLAUDE.md com seções a preencher

**Não há código, libs, banco de dados ou módulos para reaproveitar.** Tudo será construído do zero.

---

## 2. Principais CRMs Imobiliários do Mercado Brasileiro

### 2.1 Jetimob
- **Foco**: Imobiliárias de pequeno e médio porte
- **Destaques**: Site integrado, CRM completo, integração com portais, match automático cliente-imóvel
- **Pipeline**: Kanban com etapas personalizáveis
- **Integrações**: ZAP, OLX, VivaReal, Imovelweb, Chaves na Mão
- **Diferencial**: Geração de site próprio para a imobiliária + CRM unificado

### 2.2 Kenlo (antigo InGaia)
- **Foco**: Maior plataforma do mercado imobiliário brasileiro
- **Destaques**: Rede de imobiliárias conectadas, distribuição de imóveis em rede
- **Pipeline**: Funil de vendas com automações
- **Integrações**: Portais principais + rede própria de parceiros
- **Diferencial**: Rede colaborativa entre imobiliárias para compartilhar imóveis

### 2.3 Vista CRM (Grupo Loft)
- **Foco**: Imobiliárias de médio e grande porte
- **Destaques**: CRM robusto, API aberta, relatórios avançados
- **Pipeline**: Kanban com automações de movimentação
- **Integrações**: Todos os portais principais + API REST para integrações customizadas
- **Diferencial**: API aberta e bem documentada, permite integrações personalizadas

### 2.4 Universal Software / Imoview
- **Foco**: Grandes imobiliárias e incorporadoras
- **Destaques**: Sistema completo (ERP + CRM), gestão de locação e venda
- **Pipeline**: Funil de vendas e locação separados
- **Integrações**: Portais principais + gestão financeira integrada
- **Diferencial**: Sistema mais completo do mercado (mas também mais complexo)

### 2.5 CV CRM (Construtor de Vendas)
- **Foco**: Incorporadoras e construtoras
- **Destaques**: Gestão de lançamentos, espelho de vendas, reserva de unidades
- **Pipeline**: Funil específico para incorporação (reserva → proposta → contrato)
- **Integrações**: Portais + integração com sistemas de incorporadoras
- **Diferencial**: Espelho de vendas digital e gestão de empreendimentos

### 2.6 Tecimob
- **Foco**: Corretores autônomos e pequenas imobiliárias
- **Destaques**: Site + CRM integrado, match automático, simplicidade
- **Pipeline**: Kanban simples e intuitivo
- **Integrações**: ZAP, OLX, VivaReal
- **Diferencial**: Preço acessível e foco em facilidade de uso

### 2.7 Arbo Imóveis
- **Foco**: Marketplace + CRM
- **Destaques**: Plataforma que conecta imobiliárias a compradores
- **Pipeline**: Funil de vendas integrado ao marketplace
- **Integrações**: Portal próprio + portais tradicionais
- **Diferencial**: Gera demanda própria através do marketplace

### 2.8 Sigavi 360
- **Foco**: Imobiliárias de médio porte
- **Destaques**: CRM 360 com visão completa do cliente
- **Pipeline**: Funil com acompanhamento de atividades
- **Integrações**: Portais principais
- **Diferencial**: Visão 360 do cliente com histórico completo

### 2.9 Supremo CRM
- **Foco**: Imobiliárias e incorporadoras
- **Pipeline**: Kanban com automações
- **Integrações**: Portais + WhatsApp
- **Diferencial**: Integração forte com WhatsApp Business

---

## 3. Funcionalidades por Módulo — Padrão do Mercado

### 3.1 Módulo de Negócios (Pipeline/Funil de Vendas)

**Funcionalidades padrão encontradas em todos os CRMs:**

- **Kanban visual** com drag-and-drop para mover negócios entre etapas
- **Etapas típicas do funil**:
  1. **Captação/Lead** — lead chega (portal, site, indicação, WhatsApp)
  2. **Qualificação** — contato inicial, entender necessidades
  3. **Apresentação/Visita** — agendar e realizar visitas a imóveis
  4. **Proposta** — envio e negociação de proposta
  5. **Documentação** — análise de crédito, documentos
  6. **Fechamento** — assinatura de contrato
- **Múltiplos pipelines**: venda e locação separados
- **Valor do negócio** vinculado ao imóvel
- **Motivo de perda** quando um negócio é perdido (para análise)
- **Tempo em cada etapa** para identificar gargalos
- **Automações**: mover automaticamente baseado em ações (ex: visita realizada → mover para "Proposta")
- **Filtros**: por corretor responsável, tipo de negócio, valor, período

**O que os melhores fazem a mais:**
- Score de probabilidade de fechamento
- Previsão de receita baseada no pipeline
- Alertas de negócios parados há muito tempo
- Dashboard com métricas: taxa de conversão, tempo médio de fechamento, valor total no pipeline

---

### 3.2 Módulo de Clientes/Contatos

**Funcionalidades padrão:**

- **Tipos de contato**: comprador, vendedor, locatário, proprietário, corretor parceiro
- **Cadastro completo**: nome, telefone, email, CPF/CNPJ, endereço
- **Perfil de interesse do cliente**:
  - Tipo de imóvel desejado (apartamento, casa, terreno, comercial)
  - Região/bairro de interesse
  - Faixa de preço (mín/máx)
  - Quantidade de quartos, vagas, área
  - Finalidade (moradia, investimento)
- **Histórico de interações**: ligações, emails, WhatsApp, visitas
- **Tags e segmentação** para campanhas e filtros
- **Origem do lead**: qual portal/canal trouxe o cliente
- **Corretor responsável** vinculado ao cliente
- **Duplicidade**: detecção automática de contatos duplicados

**O que os melhores fazem a mais:**
- **Match automático**: cruzar perfil de interesse do cliente com imóveis disponíveis e sugerir automaticamente
- **Lead scoring**: pontuação automática do lead baseada em engajamento
- **Alertas**: notificar o corretor quando um imóvel novo bate com o perfil do cliente
- **Histórico de imóveis visitados/descartados** pelo cliente

---

### 3.3 Módulo de Atividades

**Funcionalidades padrão:**

- **Tipos de atividade**: visita, ligação, envio de proposta, follow-up, reunião, assinatura
- **Agendamento** com data, hora, local, participantes
- **Vinculação**: atividade ligada a um negócio, cliente E imóvel
- **Lembretes e notificações** (push, email, WhatsApp)
- **Status**: pendente, realizada, cancelada, reagendada
- **Histórico cronológico** por cliente e por imóvel
- **Follow-up automático**: se não houve interação em X dias, criar tarefa automaticamente
- **Calendário integrado** com visão diária/semanal/mensal

**O que os melhores fazem a mais:**
- **Check-in de visita**: corretor marca presença no local via GPS
- **Feedback da visita**: formulário pós-visita (cliente gostou? Quer fazer proposta?)
- **Templates de atividade**: modelos prontos para cada tipo de interação
- **Automações**: criar atividade automaticamente ao mover negócio no pipeline

---

### 3.4 Módulo de Imóveis

**Funcionalidades padrão:**

- **Tipos**: apartamento, casa, terreno, sala comercial, galpão, rural, etc.
- **Finalidade**: venda, locação, venda e locação
- **Status**: disponível, reservado, vendido/alugado, suspenso
- **Dados do imóvel**:
  - Endereço completo (com geolocalização)
  - Área total e útil
  - Quartos, suítes, banheiros, vagas de garagem
  - Valor de venda e/ou aluguel + condomínio + IPTU
  - Andar (para apartamentos)
  - Ano de construção
  - Descrição livre
- **Mídia**:
  - Fotos (com ordenação e foto de capa)
  - Vídeos
  - Tour virtual 360°
  - Planta baixa
- **Características/Comodidades**: piscina, churrasqueira, academia, portaria 24h, etc. (lista com checkboxes)
- **Proprietário vinculado** ao imóvel
- **Código interno** + código no portal
- **Documentação**: matrícula, IPTU, habite-se

**O que os melhores fazem a mais:**
- **Tabela de condições**: parcelamento, entrada, financiamento
- **Empreendimentos**: agrupar unidades de um mesmo prédio/condomínio
- **Espelho de vendas**: visualização de unidades disponíveis/vendidas em empreendimentos
- **Avaliação de mercado**: comparar preço com imóveis similares da região
- **Marca d'água automática** nas fotos
- **Geração de ficha do imóvel** em PDF para enviar ao cliente

---

## 4. Integrações com Portais Imobiliários — Como Funciona

### 4.1 Panorama dos Portais Brasileiros

| Portal | Grupo | Alcance |
|--------|-------|---------|
| **ZAP Imóveis** | Grupo OLX | Maior portal do Brasil |
| **VivaReal** | Grupo OLX | Segundo maior, fundiu com ZAP |
| **OLX** | Grupo OLX | Classificados gerais com seção imobiliária |
| **Imovelweb** | Grupo QuintoAndar | Forte no Sul e Sudeste |
| **Chaves na Mão** | Independente | Forte no Nordeste |
| **123i** | Independente | Portal mais novo, em crescimento |
| **Luggo** | MRV | Focado em locação |
| **QuintoAndar** | QuintoAndar | Locação e venda com modelo próprio |

**Domínio do Grupo OLX**: ZAP + VivaReal + OLX juntos concentram a maior parte do tráfego imobiliário online do Brasil. Integrar com o Grupo OLX é o passo mais importante.

---

### 4.2 Como Funciona o Envio de Imóveis para Portais

O fluxo padrão do mercado funciona assim:

```
CRM cadastra imóvel → Gera XML → Hospeda XML em URL pública → Portal lê o XML periodicamente
```

**Detalhamento:**

1. **O CRM gera um arquivo XML** com todos os imóveis marcados para publicação
2. **O XML fica hospedado em uma URL pública** (ex: `https://seucrm.com/feed/portal-zap.xml`)
3. **O portal acessa essa URL a cada 12-24 horas** e atualiza os anúncios
4. **Imóvel removido do XML** = removido automaticamente do portal na próxima sincronização
5. **Imóvel alterado no XML** = atualizado no portal na próxima sincronização

### 4.3 Formato XML — Padrão VRSync (Grupo OLX/ZAP/VivaReal)

O Grupo OLX (ZAP + VivaReal + OLX) utiliza o formato **VRSync** (também chamado de formato ZAP/VivaReal). Este é o padrão mais importante do mercado.

**Estrutura básica do XML VRSync:**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<ListingDataFeed xmlns="http://www.vivareal.com/schemas/1.0/VRSync"
  xsi:schemaLocation="http://www.vivareal.com/schemas/1.0/VRSync"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">

  <Header>
    <Provider>Nome do CRM/Sistema</Provider>
    <Email>contato@sistema.com</Email>
    <ContactName>Nome do Responsável</ContactName>
    <Telephone>(11) 99999-9999</Telephone>
    <Logo>https://seucrm.com/logo.png</Logo>
    <PublishDate>2026-03-14T10:00:00-03:00</PublishDate>
  </Header>

  <Listings>
    <Listing>
      <ListingID>codigo-interno-001</ListingID>
      <TransactionType>For Sale</TransactionType>  <!-- ou "For Rent" -->
      <Title>Apartamento 3 quartos em Copacabana</Title>
      <DetailViewUrl>https://seusite.com/imovel/001</DetailViewUrl>

      <Location>
        <Country abbreviation="BR">Brasil</Country>
        <State abbreviation="RJ">Rio de Janeiro</State>
        <City>Rio de Janeiro</City>
        <Neighborhood>Copacabana</Neighborhood>
        <Address>Rua Barata Ribeiro</Address>
        <StreetNumber>123</StreetNumber>
        <PostalCode>22011-001</PostalCode>
        <Latitude>-22.9649</Latitude>
        <Longitude>-43.1729</Longitude>
      </Location>

      <Details>
        <PropertyType>Residential / Apartment</PropertyType>
        <Description>Lindo apartamento com vista para o mar...</Description>
        <ListPrice currency="BRL">850000.00</ListPrice>
        <RentalPrice currency="BRL" period="Monthly">0</RentalPrice>
        <PropertyAdministrationFee currency="BRL">1200.00</PropertyAdministrationFee>
        <YearlyTax currency="BRL">3600.00</YearlyTax>
        <LivingArea unit="square metres">95</LivingArea>
        <LotArea unit="square metres">95</LotArea>
        <Bedrooms>3</Bedrooms>
        <Bathrooms>2</Bathrooms>
        <Suites>1</Suites>
        <Garage type="Parking Space">2</Garage>
        <Features>
          <Feature>Pool</Feature>
          <Feature>Gym</Feature>
          <Feature>Barbecue</Feature>
          <Feature>24-hour Concierge</Feature>
        </Features>
      </Details>

      <Media>
        <Item medium="image" caption="Sala de estar" primary="true">
          https://seucrm.com/fotos/001/sala.jpg
        </Item>
        <Item medium="image" caption="Quarto">
          https://seucrm.com/fotos/001/quarto.jpg
        </Item>
        <Item medium="video">
          https://youtube.com/watch?v=xxx
        </Item>
      </Media>

      <ContactInfo>
        <Name>Nome do Corretor</Name>
        <Email>corretor@imobiliaria.com</Email>
        <Telephone>(11) 99999-9999</Telephone>
      </ContactInfo>
    </Listing>
  </Listings>
</ListingDataFeed>
```

**Campos obrigatórios** no XML VRSync:
- `ListingID` — código único do imóvel
- `TransactionType` — "For Sale" ou "For Rent"
- `PropertyType` — tipo do imóvel (Residential/Apartment, Residential/Home, etc.)
- `Location` — estado, cidade e bairro no mínimo
- `ListPrice` ou `RentalPrice` — valor do imóvel
- `LivingArea` — área útil
- `Bedrooms` — número de quartos
- Pelo menos 1 foto

**Tipos de propriedade aceitos:**
- `Residential / Apartment`
- `Residential / Home` (casa)
- `Residential / Condo` (casa em condomínio)
- `Residential / Penthouse` (cobertura)
- `Residential / Flat`
- `Residential / Kitnet`
- `Residential / Land Lot` (terreno)
- `Commercial / Building` (prédio comercial)
- `Commercial / Office` (sala/escritório)
- `Commercial / Retail` (loja)
- `Commercial / Land Lot` (terreno comercial)

---

### 4.4 Como Funciona o Recebimento de Leads dos Portais

Quando alguém se interessa por um imóvel no portal e preenche o formulário de contato, o lead precisa chegar ao CRM. Existem 3 formas:

#### Forma 1: Webhook (POST HTTP) — Recomendada

```
Cliente preenche formulário no portal → Portal envia POST HTTP para URL do CRM → CRM cria lead automaticamente
```

- O CRM registra uma URL de webhook no painel do portal
- O portal envia um POST com JSON contendo dados do lead
- Processamento em tempo real (segundos)

**Exemplo de payload de lead (padrão Grupo OLX):**

```json
{
  "leadOrigin": "ZAP",
  "timestamp": "2026-03-14T15:30:00-03:00",
  "customer": {
    "name": "João Silva",
    "email": "joao@email.com",
    "phone": "(11) 99999-9999",
    "message": "Gostaria de agendar uma visita"
  },
  "listing": {
    "id": "codigo-interno-001",
    "title": "Apartamento 3 quartos em Copacabana",
    "url": "https://www.zapimoveis.com.br/imovel/...",
    "transactionType": "SALE",
    "price": 850000.00
  }
}
```

#### Forma 2: Email Parsing

```
Cliente preenche formulário no portal → Portal envia email para imobiliária → CRM lê o email e extrai os dados
```

- Mais simples de configurar, mas menos confiável
- O CRM monitora uma caixa de email específica
- Faz parsing do corpo do email para extrair nome, telefone, imóvel de interesse
- Delay de minutos, não segundos

#### Forma 3: API REST do Portal

```
CRM consulta API do portal periodicamente → Busca novos leads → Cria no sistema
```

- O CRM faz polling na API do portal (a cada 5-15 minutos)
- Mais controle sobre o processo
- Requer credenciais de API do portal
- O Grupo OLX oferece API REST com OAuth 2.0

---

### 4.5 Integrações com Outros Portais

**Imovelweb (Grupo QuintoAndar):**
- Também aceita XML, mas com formato próprio (similar ao VRSync com variações)
- Recebimento de leads por email ou API

**Chaves na Mão:**
- Aceita XML no formato próprio
- Leads por email

**Regra geral**: A maioria dos portais menores aceita o formato XML do ZAP/VivaReal como base, com pequenas adaptações. Começar pelo Grupo OLX cobre a maior parte do mercado.

---

## 5. Padrão de Funcionalidades para o MVP do LyneImob

Com base na pesquisa, as funcionalidades essenciais para um CRM imobiliário competitivo seriam:

### MVP (Essencial)
1. **Imóveis**: cadastro completo com fotos, características, status, proprietário vinculado
2. **Clientes**: cadastro com perfil de interesse, tipo (comprador/vendedor/locatário/proprietário), origem do lead
3. **Pipeline**: kanban de negócios com etapas personalizáveis (pelo menos: lead, qualificação, visita, proposta, fechamento)
4. **Atividades**: agendamento de visitas, follow-ups, tarefas com lembretes
5. **Match automático**: cruzar perfil do cliente com imóveis disponíveis
6. **Integração portais (envio)**: gerar XML VRSync para publicar imóveis no ZAP/VivaReal/OLX
7. **Integração portais (leads)**: receber leads via webhook e criar no CRM automaticamente

### Pós-MVP (Diferenciação)
- Dashboard com métricas e relatórios
- Integração com WhatsApp Business
- App mobile para corretores
- Geração de site da imobiliária
- Espelho de vendas para empreendimentos
- IA para sugestões e automações

---

## 6. Riscos e Pontos de Atenção

1. **XML VRSync**: o schema pode mudar — consultar documentação oficial do Grupo OLX antes de implementar
2. **Webhook de leads**: cada portal tem seu formato próprio — precisamos de um normalizador de leads
3. **Fotos de imóveis**: armazenamento pode crescer rápido — considerar CDN ou storage externo (ex: Supabase Storage, Cloudflare R2)
4. **Match automático**: pode ser simples (filtros) ou complexo (IA) — começar com filtros e evoluir
5. **LGPD**: dados de clientes precisam de consentimento e política de privacidade
6. **Volume de dados**: imobiliárias grandes podem ter 5.000+ imóveis — paginação e indexação são essenciais desde o início

---

## 7. Fontes e Documentação Consultada

- Jetimob (jetimob.com) — funcionalidades e integrações
- Kenlo/InGaia (kenlo.com.br) — plataforma e rede colaborativa
- Vista CRM/Loft (vista.com.br) — API e documentação
- CV CRM (cvcrm.com.br) — foco em incorporadoras
- Tecimob (tecimob.com.br) — CRM para corretores
- Grupo OLX — formato XML VRSync e integração de portais
- Imovelweb — formato de integração
- ZAP Imóveis — padrão de leads e XML
- VivaReal — schema VRSync e webhook de leads
