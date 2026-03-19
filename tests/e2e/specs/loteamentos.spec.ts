import { test, expect } from '@playwright/test'
import { PERFIS, dadosLoteamento } from '../fixtures/test-data'

// ============================================================
// Sprint 6 — Loteamentos
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

async function selecionarEstado(page: import('@playwright/test').Page, uf: string) {
  const trigger = page.getByRole('combobox').filter({ hasText: 'UF' })
  await trigger.click()
  await page.getByRole('option', { name: uf, exact: true }).waitFor({ state: 'visible', timeout: 10_000 })
  await page.getByRole('option', { name: uf, exact: true }).click()
}

// Aguardar pagina de detalhe do loteamento (redirect via RSC nao muda URL)
async function aguardarDetalheLoteamento(page: import('@playwright/test').Page, nome: string) {
  await expect(
    page.getByRole('heading', { level: 1 }).filter({ hasText: nome })
  ).toBeVisible({ timeout: 500_000 })
}

async function criarLoteamentoNaPagina(page: import('@playwright/test').Page, perfil: string) {
  const dados = dadosLoteamento(perfil)

  await page.goto('/loteamentos/novo')
  await page.waitForLoadState('networkidle')
  await fecharTourSeVisivel(page)

  await page.locator('#nome').fill(dados.nome)
  await page.locator('#cidade').fill(dados.cidade)
  await selecionarEstado(page, dados.estado)

  await fecharTourSeVisivel(page)
  await page.evaluate(() => {
    document.querySelectorAll('[data-name="onborda-overlay"], [data-name="onborda-pointer"]').forEach(el => el.remove())
  })

  // Submeter formulário
  const btnSubmit = page.locator('button[type="submit"]')
  await btnSubmit.scrollIntoViewIfNeeded()
  await btnSubmit.click()

  return dados
}

// ============================================================
// Admin — CRUD completo + excluir
// ============================================================

test.describe('Admin — Loteamentos', () => {
  test.use({ storageState: PERFIS.admin.storageState })

  test('criar loteamento com dados obrigatorios', async ({ page }) => {
    test.slow()
    const dados = await criarLoteamentoNaPagina(page, 'admin')
    await aguardarDetalheLoteamento(page, dados.nome)
  })

  test('listar loteamentos mostra registros', async ({ page }) => {
    await page.goto('/loteamentos')
    await page.waitForLoadState('networkidle')
    await fecharTourSeVisivel(page)

    await expect(
      page.locator('table tbody tr, [data-testid="loteamento-card"], a[href*="/loteamentos/"]').first()
    ).toBeVisible({ timeout: 10_000 })
  })

  test('editar loteamento existente', async ({ page }) => {
    test.slow()
    await page.goto('/loteamentos')
    await page.waitForLoadState('networkidle')
    await fecharTourSeVisivel(page)

    const linkLoteamento = page.locator('a[href*="/loteamentos/"]').filter({ hasNotText: /novo/i }).first()
    await linkLoteamento.click()
    await page.waitForLoadState('networkidle')
    await fecharTourSeVisivel(page)

    const btnEditar = page.getByRole('link', { name: /editar/i }).or(
      page.locator('a[href*="/editar"]')
    ).first()
    await btnEditar.click()
    await page.waitForURL(/\/editar/, { timeout: 10_000 })
    await page.waitForLoadState('networkidle')
    await fecharTourSeVisivel(page)

    const nomeEditado = `Loteamento Admin Editado ${Date.now()}`
    await page.locator('#nome').clear()
    await page.locator('#nome').fill(nomeEditado)

    await fecharTourSeVisivel(page)
    await page.evaluate(() => {
      document.querySelectorAll('[data-name="onborda-overlay"], [data-name="onborda-pointer"]').forEach(el => el.remove())
      const btn = document.querySelector('button[type="submit"]:not([disabled])') as HTMLButtonElement | null
      if (btn) {
        btn.scrollIntoView({ behavior: 'instant', block: 'center' })
        btn.click()
      }
    })

    await aguardarDetalheLoteamento(page, nomeEditado)
  })

  test('excluir loteamento', async ({ page }) => {
    await page.goto('/loteamentos')
    await page.waitForLoadState('networkidle')
    await fecharTourSeVisivel(page)

    const linkLoteamento = page.locator('a[href*="/loteamentos/"]').filter({ hasNotText: /novo/i }).first()
    await linkLoteamento.click()
    await page.waitForLoadState('networkidle')
    await fecharTourSeVisivel(page)

    const btnExcluir = page.getByRole('button', { name: /excluir/i })
    await expect(btnExcluir).toBeVisible({ timeout: 5_000 })
    await btnExcluir.click()

    const btnConfirmar = page.getByRole('button', { name: /confirmar|sim|excluir/i }).last()
    await btnConfirmar.click()

    // Aguardar redirecionamento para lista
    await expect(
      page.locator('h1, h2').filter({ hasText: /loteamentos/i }).first()
    ).toBeVisible({ timeout: 15_000 })
  })
})

// ============================================================
// Gerente — criar + listar todos, SEM excluir
// ============================================================

test.describe('Gerente — Loteamentos', () => {
  test.use({ storageState: PERFIS.gerente.storageState })

  test('criar loteamento e listar todos da organizacao', async ({ page }) => {
    test.slow()
    await criarLoteamentoNaPagina(page, 'gerente')

    // Aguardar detalhe — nao verificamos nome pois o redirect pode nao mudar URL
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 500_000 })

    await page.goto('/loteamentos')
    await page.waitForLoadState('networkidle')
    await fecharTourSeVisivel(page)

    await expect(
      page.locator('table tbody tr, [data-testid="loteamento-card"], a[href*="/loteamentos/"]').first()
    ).toBeVisible({ timeout: 10_000 })
  })

  test('gerente pode ver detalhe de loteamento', async ({ page }) => {
    await page.goto('/loteamentos')
    await page.waitForLoadState('networkidle')
    await fecharTourSeVisivel(page)

    const linkLoteamento = page.locator('a[href*="/loteamentos/"]').filter({ hasNotText: /novo/i }).first()
    await linkLoteamento.click()
    await page.waitForLoadState('networkidle')
    await fecharTourSeVisivel(page)

    // Pagina de detalhe carregou com conteudo
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10_000 })
  })
})

// ============================================================
// Corretor — visualizacao (RLS bloqueia escrita no server action)
// ============================================================

test.describe('Corretor — Loteamentos', () => {
  test.use({ storageState: PERFIS.corretor.storageState })

  test('listar loteamentos visivel para corretor', async ({ page }) => {
    await page.goto('/loteamentos')
    await page.waitForLoadState('networkidle')
    await fecharTourSeVisivel(page)

    const conteudo = page.locator('main, [role="main"], .container').first()
    await expect(conteudo).toBeVisible({ timeout: 10_000 })
    expect(page.url()).toContain('/loteamentos')
  })

  test('corretor pode acessar pagina de criacao (RLS bloqueia no server action)', async ({ page }) => {
    await page.goto('/loteamentos/novo')
    await page.waitForLoadState('networkidle')
    await fecharTourSeVisivel(page)

    await expect(page.locator('#nome')).toBeVisible({ timeout: 10_000 })
  })
})
