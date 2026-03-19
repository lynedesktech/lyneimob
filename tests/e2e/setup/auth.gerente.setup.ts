import { test as setup } from '@playwright/test'
import { PERFIS } from '../fixtures/test-data'

setup('autenticar como gerente', async ({ page }) => {
  const { email, senha, storageState } = PERFIS.gerente

  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Senha').fill(senha)
  await page.getByRole('button', { name: /entrar/i }).click()
  await page.waitForURL(/painel/, { timeout: 15_000 })

  await page.context().storageState({ path: storageState })
})
