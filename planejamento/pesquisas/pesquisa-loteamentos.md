# Pesquisa — Módulo de Loteamentos

> Pesquisa realizada em 2026-03-18
> Objetivo: entender como um módulo dedicado de loteamentos se encaixa no LyneImob

---

## 1. O que já existe no sistema

O LyneImob tem um módulo completo de **imóveis** que serve como referência direta pra construir o módulo de loteamentos. Aqui está o que pode ser reutilizado:

### Padrão CRUD consolidado
Cada módulo do sistema (imóveis, clientes, negócios, atividades) segue o mesmo padrão:
- **Migration SQL** com `organizacao_id` + RLS (Row-Level Security) pra isolamento multi-tenant
- **Types** em `src/types/` com schemas Zod pra validação
- **Server Actions** em `src/actions/` que recebem FormData, validam com Zod e retornam `{ erro?, sucesso? }`
- **Páginas** em `src/app/(dashboard)/[modulo]/` com listagem, novo, detalhe e editar
- **Componentes** em `src/components/[modulo]/` com formulário, card, tabela, filtros

### Importador CSV reutilizável
O módulo de imóveis tem um importador CSV completo (`src/actions/importacao-imoveis.ts` + `src/components/imoveis/importador-imoveis.tsx` + `src/types/importacao.ts`) com:
- Upload drag-and-drop com preview
- Mapeamento automático de colunas (case-insensitive, com aliases em PT-BR)
- Validação com Zod antes de enviar
- Inserção em batches de 50
- Retorno com estatísticas (criados, erros por linha)

Esse padrão pode ser **replicado** pro importador de lotes, trocando os campos e o schema.

### Galeria de fotos
O módulo de imóveis tem `imovel_fotos` com upload, reordenação, definição de capa e storage no Supabase. O mesmo padrão serve pra `loteamento_fotos`.

### IA integrada
Imóveis tem geração de título e descrição via GPT-4o-mini (`src/actions/ia-imoveis.ts`). O mesmo pode ser feito pra loteamentos — gerar descrição comercial do empreendimento.

### Site público
O site público (`src/app/[slug]/`) já exibe imóveis com listagem, detalhe, filtros e paginação usando cliente admin (bypass RLS). O mesmo padrão se aplica a loteamentos.

### Sidebar
A sidebar (`src/components/layout/app-sidebar.tsx`) tem um array `gruposNavegacao` onde basta adicionar um novo item "Loteamentos" com ícone do Lucide.

---

## 2. Como loteamento difere de imóvel

Um **imóvel** é uma unidade individual (casa, apartamento, terreno avulso). Um **loteamento** é um empreendimento com muitas unidades (lotes) dentro.

| Aspecto | Imóvel | Loteamento |
|---------|--------|------------|
| Estrutura | Entidade única | Pai (loteamento) + filhos (lotes) |
| Identificação | Código único | Nome do loteamento + Quadra/Lote |
| Campos | Tipo, quartos, suítes, vagas, área construída | Quadra, número do lote, área do lote |
| Status | Por unidade (disponível, vendido, etc.) | Status geral + status individual por lote |
| Venda | Um imóvel = uma venda | Cada lote é uma venda individual |
| Site público | Card com foto + detalhes | Card do loteamento + tabela/grid de lotes |

### O que um loteamento tem que um imóvel não tem:
- **Quadra**: letra que agrupa lotes (A, B, C...)
- **Número do lote**: identificador numérico dentro da quadra (001, 002...)
- **Unidade**: identificador único combinando quadra + lote (ex: "A-001")
- **Métricas agregadas**: total de lotes, vendidos, disponíveis, valor total, receita
- **Comprador por lote**: cada lote pode ter um comprador diferente

### O que um loteamento NÃO precisa que um imóvel tem:
- Tipo (apartamento, casa, etc.) — é sempre lote/terreno
- Finalidade (venda, aluguel) — lote é sempre venda
- Quartos, suítes, banheiros, vagas, andares — não se aplica
- IPTU, condomínio — não se aplica no lançamento
- Publicar em portais — loteamentos não vão pra portais tipo ZAP/OLX

---

## 3. Modelo de dados proposto

### Tabela `loteamentos` (o empreendimento)
```
id                  UUID PK
organizacao_id      UUID FK → organizacoes (multi-tenancy)
nome                TEXT NOT NULL (ex: "Reserva Mar")
descricao           TEXT (descrição comercial)
descricao_ia        TEXT (descrição gerada pela IA)
status              TEXT (lancamento, em_vendas, esgotado)
cep                 TEXT
logradouro          TEXT
numero              TEXT
complemento         TEXT
bairro              TEXT
cidade              TEXT NOT NULL
estado              CHAR(2) NOT NULL
total_lotes         INTEGER DEFAULT 0
lotes_disponiveis   INTEGER DEFAULT 0
lotes_vendidos      INTEGER DEFAULT 0
lotes_reservados    INTEGER DEFAULT 0
valor_total         NUMERIC DEFAULT 0 (soma dos valores de todos os lotes)
publicar_site       BOOLEAN DEFAULT TRUE
observacoes_internas TEXT
created_at          TIMESTAMPTZ
updated_at          TIMESTAMPTZ
```

### Tabela `lotes` (cada unidade do loteamento)
```
id                  UUID PK
loteamento_id       UUID FK → loteamentos (CASCADE)
organizacao_id      UUID FK → organizacoes (multi-tenancy)
quadra              TEXT NOT NULL (ex: "A", "B", "C")
numero_lote         TEXT NOT NULL (ex: "001", "002")
unidade             TEXT NOT NULL UNIQUE por loteamento (ex: "Quadra A Lote 001")
status              TEXT DEFAULT 'disponivel' (disponivel, reservado, vendido)
comprador           TEXT (nome do comprador, se vendido)
valor               NUMERIC NOT NULL (valor de venda)
data_venda          DATE (quando foi vendido)
area                NUMERIC (área em m²)
observacoes         TEXT
created_at          TIMESTAMPTZ
updated_at          TIMESTAMPTZ
```

### Tabela `loteamento_fotos`
```
id                  UUID PK
loteamento_id       UUID FK → loteamentos (CASCADE)
url                 TEXT NOT NULL
descricao           TEXT
ordem               INTEGER DEFAULT 0
eh_capa             BOOLEAN DEFAULT FALSE
created_at          TIMESTAMPTZ
```

### Constraints e índices
- UNIQUE(loteamento_id, unidade) — não pode ter dois lotes com a mesma unidade no mesmo loteamento
- UNIQUE(loteamento_id, quadra, numero_lote) — redundância de segurança
- INDEX em organizacao_id, loteamento_id, status, quadra pra filtros rápidos

### RLS (Row-Level Security)
Mesmo padrão de imóveis:
- SELECT: usuario vê loteamentos/lotes da própria organização
- INSERT: qualquer cargo da organização pode criar
- UPDATE: corretor edita os que criou, admin/gerente edita qualquer um
- DELETE: apenas admin

---

## 4. Mapeamento do CSV

O CSV fornecido (vendas-reserva-mar.csv) tem estas colunas:

| Coluna CSV | Campo no banco | Observação |
|------------|----------------|------------|
| Data Venda | `lotes.data_venda` | Formato DD/MM/YYYY → converter pra DATE |
| Quadra | `lotes.quadra` | Letra (A até P) |
| Lote | `lotes.numero_lote` | Número com 3 dígitos (001, 002...) |
| Unidade | `lotes.unidade` | "Quadra X Lote YYY" — já vem formatado |
| Comprador | `lotes.comprador` | Nome ou "0" quando não vendido |
| Valor | `lotes.valor` | Numérico, sem formatação |
| Pag Nov/25 a Pag Abr/26 | **ignorar** | Decisão: sem controle de parcelas |
| Total Pago | **ignorar** | Decisão: sem controle de parcelas |

**Tratamentos necessários na importação:**
- Comprador "0" → tratar como vazio (lote disponível se não tem data de venda)
- Se tem Data Venda e Comprador ≠ "0" → status = "vendido"
- Se tem Data Venda e Comprador = "0" → status = "vendido" (comprador não informado)
- Se não tem Data Venda → status = "disponivel"
- Encoding: o CSV tem caracteres UTF-8 com BOM (ï»¿) e acentos corrompidos (ex: "MANUTENÇÃO" vira "MANUTENÃÃO") — tratar encoding na leitura

---

## 5. Integração com outros módulos

### Negócios (pipeline)
Hoje um negócio referencia `imovel_id` (opcional). Pro módulo de loteamentos, o ideal é:
- Adicionar campo `lote_id` na tabela `negocios` (opcional, FK pra `lotes`)
- Quando um negócio envolve um lote, o corretor seleciona o loteamento + lote
- No Kanban, o card do negócio mostra "Reserva Mar - Quadra A Lote 001"

**Impacto:** 1 campo novo na tabela negocios + ajuste no formulário de negócio + ajuste no card do Kanban.

### Clientes
Hoje `cliente_interesses` tem campos como `tipo_imovel`, `finalidade`, `bairros`, `preco_min/max`. Para loteamentos:
- Adicionar campo `interesse_loteamento` boolean no interesse do cliente
- Ou criar um novo tipo de interesse específico pra lotes (quadra preferida, área mínima, valor máximo)

**Impacto:** pequeno — pode ser feito depois. Por agora, o vínculo entre cliente e lote acontece via negócio.

### Site público
Adicionar novas rotas no site público:
- `/[slug]/loteamentos/` — listagem de loteamentos publicados
- `/[slug]/loteamentos/[id]` — detalhe com lotes disponíveis

Mesmo padrão de `/[slug]/imoveis/` — usa cliente admin (bypass RLS), filtra por `publicar_site=true`.

**Impacto:** 2 novas páginas + link no header/menu do site público.

---

## 6. Impacto na sidebar e permissões

### Sidebar
Adicionar item "Loteamentos" no array `gruposNavegacao` de `src/components/layout/app-sidebar.tsx`:
```
{ titulo: "Loteamentos", href: "/loteamentos", icone: MapPin }
```

Posição sugerida: depois de "Imóveis", antes de "Atividades".

### Permissões
Usar as mesmas permissões de imóveis (`criar_registros`, `ver_todos_registros`, `excluir_registros`). Não precisa criar permissões novas — o sistema de cargo (admin/gerente/corretor) já cobre.

### Limites de plano
Adicionar `max_loteamentos` no objeto `limites` de `organizacoes`:
- Trial: 1 loteamento
- CRM IA: 5 loteamentos
- CRM IA + SDR: 20 loteamentos

Lotes dentro de cada loteamento: sem limite (o limite é por loteamento, não por lote).

---

## 7. O que o site público precisa exibir

Seguindo o padrão de imóveis:

### Listagem (`/[slug]/loteamentos/`)
- Cards com foto de capa, nome, cidade, total de lotes, lotes disponíveis, faixa de preço
- Filtros: cidade, status (em vendas)
- Paginação: 12 por página

### Detalhe (`/[slug]/loteamentos/[id]`)
- Galeria de fotos
- Descrição (ou descrição IA)
- Endereço
- Métricas: total de lotes, disponíveis, vendidos, faixa de preço
- Tabela de lotes disponíveis (quadra, lote, área, valor) — só os disponíveis no site público
- Formulário de contato/interesse (nome, telefone, email, mensagem) — gera lead no CRM

---

## 8. Conclusão

O módulo de loteamentos é essencialmente uma **réplica adaptada** do módulo de imóveis, com a diferença principal sendo a hierarquia pai-filho (loteamento → lotes). O sistema já tem todos os padrões necessários — CRUD, importação CSV, galeria de fotos, IA, site público, RLS multi-tenant.

O trabalho principal é:
1. Criar a migration com as 3 tabelas + RLS
2. Criar tipos e schemas Zod
3. Criar Server Actions (CRUD + importação)
4. Criar páginas e componentes seguindo o padrão de imóveis
5. Estender o site público com 2 novas rotas
6. Adicionar item na sidebar
7. Integrar com negócios (campo `lote_id`)

Estimativa de complexidade: **média** — não há conceito novo, é aplicação de padrões existentes com adaptações pra o domínio de loteamentos.
