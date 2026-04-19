# Geracao automatica de tipos do banco

Os tipos em `src/types/database.ts` foram criados manualmente e podem ficar
fora de sincronia com o schema real do Supabase.

## Como regenerar

```bash
# Loga no Supabase CLI (so precisa uma vez por maquina)
npx supabase login

# Gera os tipos atualizados do projeto
npm run gen:types
```

Isso grava o arquivo `src/types/database.generated.ts` com os tipos exatos
das tabelas do Supabase. Depois e so usar:

```ts
import type { Database } from '@/types/database.generated'
```

## Quando regenerar

- Apos aplicar uma migration nova no banco (`supabase/migrations/`)
- Quando notar divergencia entre o tipo e o dado real (campos faltando, etc.)

## Observacao

O `types/database.ts` manual ainda existe como "divida tecnica conhecida"
(veja CLAUDE.md). A migracao pra usar so o gerado deve ser feita em task
separada, comparando os tipos pra garantir que nada quebre.
