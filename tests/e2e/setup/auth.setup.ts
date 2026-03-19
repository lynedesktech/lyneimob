import { test as setup } from '@playwright/test'
import { PERFIS } from '../fixtures/test-data'

for (const [nome, perfil] of Object.entries(PERFIS)) {
  setup(`autenticar como ${nome}`, async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill(perfil.email)
    await page.getByRole('textbox', { name: 'Senha' }).fill(perfil.senha)
    await page.getByRole('button', { name: /entrar/i }).click()

    // Aguarda o dashboard carregar (URL pode ser /painel ou / com redirect pendente)
    await page.waitForURL(url => url.pathname === '/painel' || url.pathname === '/', { timeout: 30_000 })
    // Garante que o dashboard realmente carregou (sidebar visivel)
    await page.waitForSelector('[data-sidebar="sidebar"]', { timeout: 15_000 })

    await page.context().storageState({ path: perfil.storageState })
  })
}
