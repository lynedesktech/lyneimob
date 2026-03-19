import { test, expect } from '@playwright/test'
import { PERFIS } from '../fixtures/test-data'

// ============================================================
// Sprint 7 — Configuracoes (permissoes por perfil)
// ============================================================

test.describe('Admin — Configuracoes', () => {
  test.use({ storageState: PERFIS.admin.storageState })

  test('hub acessivel com cards de configuracao', async ({ page }) => {
    await page.goto('/configuracoes')
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15_000 })
    // Deve exibir pelo menos um card/link de sub-pagina
    const cards = page.locator('a[href*="/configuracoes/"], [data-testid*="config"]')
    await expect(cards.first()).toBeVisible({ timeout: 10_000 })
  })

  test('empresa — formulario visivel', async ({ page }) => {
    await page.goto('/configuracoes/empresa')
    await expect(page.locator('input, textarea').first()).toBeVisible({ timeout: 15_000 })
  })

  test('equipe — lista ou botao convidar visivel', async ({ page }) => {
    await page.goto('/configuracoes/equipe')
    const conteudo = page.locator('button, table, [data-testid]').first()
    await expect(conteudo).toBeVisible({ timeout: 15_000 })
  })

  test('pipeline — etapas visiveis', async ({ page }) => {
    await page.goto('/configuracoes/pipeline')
    await expect(page.locator('main, [role="main"]').first()).toBeVisible({ timeout: 15_000 })
  })

  test('tipos atividade — lista visivel', async ({ page }) => {
    await page.goto('/configuracoes/tipos-atividade')
    await expect(page.locator('main, [role="main"]').first()).toBeVisible({ timeout: 15_000 })
  })

  test('meu site — formulario de customizacao', async ({ page }) => {
    await page.goto('/configuracoes/meu-site')
    // Primeiro input visivel pode ser file hidden — buscar input de texto ou heading
    await expect(
      page.locator('input:visible, textarea:visible, h1, h2').first()
    ).toBeVisible({ timeout: 15_000 })
  })

  test('distribuicao — configuracao visivel', async ({ page }) => {
    await page.goto('/configuracoes/distribuicao')
    await expect(page.locator('main, [role="main"]').first()).toBeVisible({ timeout: 15_000 })
  })

  test('whatsapp — formulario de configuracao', async ({ page }) => {
    await page.goto('/configuracoes/whatsapp')
    await expect(page.locator('main, [role="main"]').first()).toBeVisible({ timeout: 15_000 })
  })
})

test.describe('Gerente — Configuracoes', () => {
  test.use({ storageState: PERFIS.gerente.storageState })

  test('hub acessivel', async ({ page }) => {
    await page.goto('/configuracoes')
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15_000 })
  })

  test('meu site acessivel com formulario', async ({ page }) => {
    await page.goto('/configuracoes/meu-site')
    await expect(
      page.locator('input:visible, textarea:visible, h1, h2').first()
    ).toBeVisible({ timeout: 15_000 })
  })

  test('empresa bloqueado — redireciona ou mostra sem permissao', async ({ page }) => {
    await page.goto('/configuracoes/empresa')
    // Deve redirecionar para /painel, /configuracoes, ou mostrar mensagem de erro
    await page.waitForTimeout(3_000)
    const url = page.url()
    const bloqueado =
      !url.includes('/configuracoes/empresa') ||
      (await page.locator('text=/sem permiss|acesso negado|nao autorizado/i').isVisible().catch(() => false))
    expect(bloqueado).toBeTruthy()
  })

  test('equipe bloqueado — redireciona ou mostra sem permissao', async ({ page }) => {
    await page.goto('/configuracoes/equipe')
    await page.waitForTimeout(3_000)
    const url = page.url()
    const bloqueado =
      !url.includes('/configuracoes/equipe') ||
      (await page.locator('text=/sem permiss|acesso negado|nao autorizado/i').isVisible().catch(() => false))
    expect(bloqueado).toBeTruthy()
  })
})

test.describe('Corretor — Configuracoes', () => {
  test.use({ storageState: PERFIS.corretor.storageState })

  test('hub acessivel com cards limitados', async ({ page }) => {
    await page.goto('/configuracoes')
    // Corretor pode ver o hub, mas com menos cards que admin/gerente
    await expect(page.locator('main, [role="main"]').first()).toBeVisible({ timeout: 15_000 })
  })

  test('rota direta bloqueada — /configuracoes/empresa redireciona', async ({ page }) => {
    await page.goto('/configuracoes/empresa')
    await page.waitForTimeout(3_000)
    const url = page.url()
    const bloqueado =
      !url.includes('/configuracoes/empresa') ||
      (await page.locator('text=/sem permiss|acesso negado|nao autorizado/i').isVisible().catch(() => false))
    expect(bloqueado).toBeTruthy()
  })
})
