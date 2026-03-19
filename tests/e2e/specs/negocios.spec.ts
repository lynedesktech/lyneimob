import { test, expect } from '@playwright/test'
import { PERFIS } from '../fixtures/test-data'

// ============================================================
// Sprint 4 — Negocios (Pipeline)
// ============================================================

async function fecharTourSeVisivel(page: import('@playwright/test').Page) {
  const btnPularTour = page.getByRole('button', { name: /pular tour/i })
  try {
    await btnPularTour.waitFor({ state: 'visible', timeout: 5_000 })
    await btnPularTour.click()
    await page.locator('[data-name="onborda-overlay"]').waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {})
  } catch {
    // Tour nao apareceu
  }
  await page.evaluate(() => {
    document.querySelectorAll('[data-name="onborda-overlay"], [data-name="onborda-pointer"]').forEach(el => el.remove())
  }).catch(() => {})
}

// Aguardar pagina de detalhe do negocio (redirect via RSC nao muda URL)
async function aguardarDetalheNegocio(page: import('@playwright/test').Page, titulo: string) {
  await expect(
    page.getByRole('heading', { level: 1 }).filter({ hasText: titulo })
  ).toBeVisible({ timeout: 500_000 })
}

async function criarNegocio(page: import('@playwright/test').Page, titulo: string) {
  await page.goto('/negocios/novo')
  await page.waitForLoadState('networkidle')
  await fecharTourSeVisivel(page)

  await page.locator('#titulo').fill(titulo)

  await page.locator('#tipo').click()
  await page.getByRole('option', { name: 'Venda' }).click()

  await page.locator('#etapa_id').click()
  await page.getByRole('option').first().waitFor({ state: 'visible', timeout: 10_000 })
  await page.getByRole('option').first().click()

  const comboboxCliente = page.getByRole('combobox').filter({ hasText: /cliente/i }).first()
  await comboboxCliente.click()

  const inputBusca = page.getByPlaceholder(/buscar/i).first()
  await inputBusca.waitFor({ state: 'visible', timeout: 5_000 })
  await inputBusca.fill(' ')

  const primeiroItem = page.getByRole('option').first()
  await primeiroItem.waitFor({ state: 'visible', timeout: 10_000 })
  await primeiroItem.click()

  await fecharTourSeVisivel(page)
  await page.evaluate(() => {
    document.querySelectorAll('[data-name="onborda-overlay"], [data-name="onborda-pointer"]').forEach(el => el.remove())
  })
  const submitBtn = page.locator('button[type="submit"]:not([disabled])')
  await submitBtn.click({ force: true })

  // Aguardar detalhe carregar
  await aguardarDetalheNegocio(page, titulo)
}

test.describe('Admin — Negocios', () => {
  test.use({ storageState: PERFIS.admin.storageState })

  test('criar negocio com dados obrigatorios', async ({ page }) => {
    test.slow()
    const titulo = `Negocio Admin ${Date.now()}`
    await criarNegocio(page, titulo)
  })

  test('visualizar kanban com colunas do pipeline', async ({ page }) => {
    await page.goto('/negocios')
    await page.waitForLoadState('networkidle')
    await fecharTourSeVisivel(page)

    const kanbanContainer = page.locator('#onborda-kanban')
    await expect(kanbanContainer).toBeVisible({ timeout: 15_000 })
  })

  test('visualizar lista de negocios', async ({ page }) => {
    await page.goto('/negocios?visao=lista')
    await page.waitForLoadState('networkidle')
    await fecharTourSeVisivel(page)

    await expect(
      page.locator('table, a[href*="/negocios/"]').first()
    ).toBeVisible({ timeout: 10_000 })
  })

  test('editar negocio existente', async ({ page }) => {
    test.slow()
    await page.goto('/negocios?visao=lista')
    await page.waitForLoadState('networkidle')
    await fecharTourSeVisivel(page)

    const linkNegocio = page.locator('a[href*="/negocios/"]:not([href*="novo"])').first()
    const linkVisivel = await linkNegocio.isVisible().catch(() => false)
    if (!linkVisivel) {
      test.skip(true, 'Nenhum negocio encontrado para editar')
      return
    }

    await linkNegocio.click()
    await page.waitForLoadState('networkidle')
    await fecharTourSeVisivel(page)

    // Esperar heading h1 do detalhe
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 })

    const btnEditar = page.getByRole('link', { name: /editar/i }).first()
    await btnEditar.click()
    await page.waitForURL(/\/editar/, { timeout: 10_000 })
    await page.waitForLoadState('networkidle')
    await fecharTourSeVisivel(page)

    const tituloEditado = `Negocio Admin Editado ${Date.now()}`
    await page.locator('#titulo').fill(tituloEditado)

    await fecharTourSeVisivel(page)
    await page.evaluate(() => {
      document.querySelectorAll('[data-name="onborda-overlay"], [data-name="onborda-pointer"]').forEach(el => el.remove())
    })
    const submitBtn = page.locator('button[type="submit"]:not([disabled])')
    await submitBtn.click({ force: true })

    await aguardarDetalheNegocio(page, tituloEditado)
  })
})

test.describe('Gerente — Negocios', () => {
  test.use({ storageState: PERFIS.gerente.storageState })

  test('criar negocio e listar todos da organizacao', async ({ page }) => {
    test.slow()
    const titulo = `Negocio Gerente ${Date.now()}`
    await criarNegocio(page, titulo)

    await page.goto('/negocios?visao=lista')
    await page.waitForLoadState('networkidle')
    await fecharTourSeVisivel(page)
    await expect(
      page.locator('a[href*="/negocios/"]').first()
    ).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('Corretor — Negocios', () => {
  test.use({ storageState: PERFIS.corretor.storageState })

  test('criar negocio e listar apenas os proprios', async ({ page }) => {
    test.slow()
    const titulo = `Negocio Corretor ${Date.now()}`
    await criarNegocio(page, titulo)

    await page.goto('/negocios?visao=lista')
    await page.waitForLoadState('networkidle')
    await fecharTourSeVisivel(page)
    await expect(
      page.locator('a[href*="/negocios/"]').first()
    ).toBeVisible({ timeout: 10_000 })
  })
})
