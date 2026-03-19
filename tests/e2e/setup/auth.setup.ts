import { test as setup } from '@playwright/test'
import { PERFIS } from '../fixtures/test-data'

for (const [nome, perfil] of Object.entries(PERFIS)) {
  setup(`autenticar como ${nome}`, async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill(perfil.email)
    await page.getByLabel('Senha').fill(perfil.senha)
    await page.getByRole('button', { name: /entrar/i }).click()
    await page.waitForURL(/painel/, { timeout: 15_000 })
    await page.context().storageState({ path: perfil.storageState })
  })
}
