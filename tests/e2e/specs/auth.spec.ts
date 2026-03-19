import { test, expect } from '@playwright/test'
import { PERFIS } from '../fixtures/test-data'

// ============================================================
// Sprint 1 — Autenticacao
// ============================================================

// Helper: aguarda o dashboard carregar (login redireciona para / e middleware para /painel)
async function aguardarDashboard(page: import('@playwright/test').Page) {
  await page.waitForURL(url => url.pathname === '/painel' || url.pathname === '/', { timeout: 30_000 })
  await page.waitForSelector('[data-sidebar="sidebar"]', { timeout: 15_000 })
}

test.describe('Login valido', () => {
  test('admin faz login e acessa o dashboard', async ({ page }) => {
    const { email, senha } = PERFIS.admin

    await page.goto('/login')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Senha').fill(senha)
    await page.getByRole('button', { name: /entrar/i }).click()

    await aguardarDashboard(page)
  })

  test('gerente faz login e acessa o dashboard', async ({ page }) => {
    const { email, senha } = PERFIS.gerente

    await page.goto('/login')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Senha').fill(senha)
    await page.getByRole('button', { name: /entrar/i }).click()

    await aguardarDashboard(page)
  })

  test('corretor faz login e acessa o dashboard', async ({ page }) => {
    const { email, senha } = PERFIS.corretor

    await page.goto('/login')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Senha').fill(senha)
    await page.getByRole('button', { name: /entrar/i }).click()

    await aguardarDashboard(page)
  })

  test('super admin faz login e acessa o dashboard', async ({ page }) => {
    const { email, senha } = PERFIS.superAdmin

    await page.goto('/login')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Senha').fill(senha)
    await page.getByRole('button', { name: /entrar/i }).click()

    await aguardarDashboard(page)
  })
})

test.describe('Login invalido', () => {
  test('senha errada mostra mensagem de erro', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill(PERFIS.admin.email)
    await page.getByLabel('Senha').fill('SenhaErrada123!')
    await page.getByRole('button', { name: /entrar/i }).click()

    const erro = page.locator('div').filter({ hasText: /incorreta|invalido|invalid/i }).first()
    await expect(erro).toBeVisible({ timeout: 10_000 })
  })

  test('email inexistente mostra mensagem de erro', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill('nao-existe-9999@teste.com')
    await page.getByLabel('Senha').fill('QualquerSenha123!')
    await page.getByRole('button', { name: /entrar/i }).click()

    const erro = page.locator('div').filter({ hasText: /incorreta|invalido|invalid|nenhuma conta|nao encontr/i }).first()
    await expect(erro).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('Protecao de rotas — sem autenticacao', () => {
  test('rota protegida sem auth redireciona para /login', async ({ page }) => {
    await page.goto('/imoveis')
    await page.waitForURL(/\/login/, { timeout: 15_000 })
    expect(page.url()).toContain('/login')
  })
})

test.describe('Redirecionamentos com sessao ativa', () => {
  test.use({ storageState: PERFIS.admin.storageState })

  test('rota /login com sessao redireciona para /painel', async ({ page }) => {
    await page.goto('/login')
    await aguardarDashboard(page)
  })

  test('rota / com sessao redireciona para /painel', async ({ page }) => {
    await page.goto('/')
    await aguardarDashboard(page)
  })
})

test.describe('Logout', () => {
  test.use({ storageState: PERFIS.admin.storageState })

  test('logout redireciona para /login', async ({ page }) => {
    await page.goto('/painel')
    await aguardarDashboard(page)

    // Abrir menu do usuario no sidebar (botao com nome + email)
    await page.getByRole('button', { name: /admin/i }).click()

    // Clicar em "Sair" no dropdown
    await page.getByRole('menuitem', { name: /sair/i }).click()

    await page.waitForURL(/\/login/, { timeout: 15_000 })
    expect(page.url()).toContain('/login')
  })
})
