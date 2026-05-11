# Item 14 — Privacidade WhatsApp na conexao (online=all, last=none, readreceipts=all)

## Contexto

Por padrao a Uazapi cria a instancia com configuracoes de privacidade que tornam o numero "obviamente bot" (visto por ultimo visivel pra todos, online some quando termina o session). A Sprint 3 adicionou um POST automatico em `/instance/privacy` apos conectar, deixando:

- **`online: "all"`** — sempre aparece online (parece humano usando)
- **`last: "none"`** — esconde "visto por ultimo"
- **`readreceipts: "all"`** — manda confirmacao de leitura (parece atento)

## Onde mudou

### Wrapper da API Uazapi

[`src/lib/whatsapp/uazapi.ts:105-131`](https://github.com/lynedesktech/lyneimob/blob/feature/LYNEDES-103-sprint-2-3/src/lib/whatsapp/uazapi.ts#L105-L131)

```typescript
/**
 * LYNEDES-103 Sprint 3: configura privacidade da instância anti-bot
 * - online: "all" (sempre aparece online)
 * - last: "none" (esconde "visto por ultimo")
 * - readreceipts: "all" (manda confirmacao de leitura)
 *
 * Sem isso, o "visto por ultimo" do numero fica visivel e parece bot.
 */
export async function configurarPrivacidadeUazapi(
  url: string,
  token: string
): Promise<void> {
  const resposta = await fetch(montarUrlBase(url, "/instance/privacy"), {
    method: "POST",
    headers: { "Content-Type": "application/json", token },
    body: JSON.stringify({
      online: "all",
      last: "none",
      readreceipts: "all",
    }),
  })
  if (!resposta.ok) {
    const erro = await resposta.text().catch(() => "Erro desconhecido")
    throw new Error(`Erro ao configurar privacidade: ${erro}`)
  }
}
```

### Onde e chamado

[`src/actions/instancia-whatsapp.ts`](https://github.com/lynedesktech/lyneimob/blob/feature/LYNEDES-103-sprint-2-3/src/actions/instancia-whatsapp.ts) — ao criar/conectar instancia. Roda 1x por instancia.

## ✅ Validacao end-to-end (04/05/2026)

Aplicado contra a instancia Uazapi real da Imobiliaria Sonho (`lyneimob-1f03e678`, owner `5511958042849`, conectada). Resposta da Uazapi:

```json
POST /instance/privacy → HTTP 200
{
  "calladd": "all",
  "groupadd": "all",
  "last": "none",          ← OCULTO conforme esperado
  "online": "all",         ← SEMPRE ONLINE conforme esperado
  "profile": "all",
  "readreceipts": "all",   ← CONFIRMA LEITURA conforme esperado
  "status": "all"
}

GET /instance/privacy → HTTP 200 (mesma config — confirma persistencia)
```

Output completo em [`_outputs/item-14-output.txt`](./_outputs/item-14-output.txt).

### O que ficou comprovado

- A Uazapi aceita a config `{ online: "all", last: "none", readreceipts: "all" }`
- A configuracao persiste apos aplicar (GET retorna o mesmo)
- Os demais campos (calladd, groupadd, profile, status) ficam com default "all" e nao sao tocados pela funcao do projeto
- Em prod, `configurarPrivacidadeUazapi()` roda 1x apos cada conexao (chamada em `actions/instancia-whatsapp.ts`)

### Validacao visual extra (manual no celular)

Ao tentar ver "visto por ultimo" do numero do agente (`5511958042849`) num outro WhatsApp, deve estar **oculto**. A bolinha "online" deve aparecer constantemente.
