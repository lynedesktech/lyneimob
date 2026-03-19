import { test, expect } from '@playwright/test'
import { PERFIS } from '../fixtures/test-data'

// ============================================================
// Sprint 9 — Super Admin
// ============================================================

test.describe('Super Admin — Area Admin', () => {
  test.use({ storageState: PERFIS.superAdmin.storageState })

  test('organizacoes acessivel com lista de organizacoes', async ({ page }) => {
    await page.goto('/admin/organizacoes')
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15_000 })
    // Deve exibir tabela ou cards com organizacoes
    const conteudo = page.locator('table, [data-testid*="org"], .card, [class*="card"]')
    await expect(conteudo.first()).toBeVisible({ timeout: 10_000 })
  })

  test('roadmap acessivel com kanban ou lista de tarefas', async ({ page }) => {
    await page.goto('/admin/roadmap')
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15_000 })
    // Deve exibir kanban board ou lista de tarefas
    const conteudo = page.locator(
      '[data-testid*="kanban"], [data-testid*="roadmap"], .card, [class*="column"], table, [role="list"]'
    )
    await expect(conteudo.first()).toBeVisible({ timeout: 10_000 })
  })

  test('configuracoes acessivel com cards ou links de config', async ({ page }) => {
    await page.goto('/admin/configuracoes')
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15_000 })
    // Deve exibir cards/links para sub-paginas (stripe, openai, etc.)
    const links = page.locator(
      'a[href*="/admin/configuracoes/"], [data-testid*="config"], .card, [class*="card"]'
    )
    await expect(links.first()).toBeVisible({ timeout: 10_000 })
  })

  test('configuracoes/stripe acessivel', async ({ page }) => {
    await page.goto('/admin/configuracoes/stripe')
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('input, textarea, form').first()).toBeVisible({ timeout: 10_000 })
  })

  test('configuracoes/openai acessivel', async ({ page }) => {
    await page.goto('/admin/configuracoes/openai')
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('input, textarea, form').first()).toBeVisible({ timeout: 10_000 })
  })

  test('configuracoes/uazapi acessivel', async ({ page }) => {
    await page.goto('/admin/configuracoes/uazapi')
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('input, textarea, form').first()).toBeVisible({ timeout: 10_000 })
  })

  test('configuracoes/redis acessivel', async ({ page }) => {
    await page.goto('/admin/configuracoes/redis')
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('input, textarea, form').first()).toBeVisible({ timeout: 10_000 })
  })

  test('configuracoes/memoria acessivel', async ({ page }) => {
    await page.goto('/admin/configuracoes/memoria')
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('main, [role="main"]').first()).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('Admin normal — Bloqueio area admin', () => {
  test.use({ storageState: PERFIS.admin.storageState })

  test('/admin/organizacoes bloqueado — redireciona para /painel', async ({ page }) => {
    await page.goto('/admin/organizacoes')
    await page.waitForURL(/\/painel/, { timeout: 15_000 })
    expect(page.url()).toContain('/painel')
  })

  test('/admin/roadmap bloqueado — redireciona para /painel', async ({ page }) => {
    await page.goto('/admin/roadmap')
    await page.waitForURL(/\/painel/, { timeout: 15_000 })
    expect(page.url()).toContain('/painel')
  })

  test('/admin/configuracoes bloqueado — redireciona para /painel', async ({ page }) => {
    await page.goto('/admin/configuracoes')
    await page.waitForURL(/\/painel/, { timeout: 15_000 })
    expect(page.url()).toContain('/painel')
  })
})

test.describe('Gerente — Bloqueio area admin', () => {
  test.use({ storageState: PERFIS.gerente.storageState })

  test('/admin/organizacoes bloqueado — redireciona para /painel', async ({ page }) => {
    await page.goto('/admin/organizacoes')
    await page.waitForURL(/\/painel/, { timeout: 15_000 })
    expect(page.url()).toContain('/painel')
  })

  test('/admin/roadmap bloqueado — redireciona para /painel', async ({ page }) => {
    await page.goto('/admin/roadmap')
    await page.waitForURL(/\/painel/, { timeout: 15_000 })
    expect(page.url()).toContain('/painel')
  })
})

test.describe('Corretor — Bloqueio area admin', () => {
  test.use({ storageState: PERFIS.corretor.storageState })

  test('/admin/organizacoes bloqueado — redireciona para /painel', async ({ page }) => {
    await page.goto('/admin/organizacoes')
    await page.waitForURL(/\/painel/, { timeout: 15_000 })
    expect(page.url()).toContain('/painel')
  })

  test('/admin/roadmap bloqueado — redireciona para /painel', async ({ page }) => {
    await page.goto('/admin/roadmap')
    await page.waitForURL(/\/painel/, { timeout: 15_000 })
    expect(page.url()).toContain('/painel')
  })
})
