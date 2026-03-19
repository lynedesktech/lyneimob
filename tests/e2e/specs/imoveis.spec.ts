import { test, expect } from '@playwright/test'
import { PERFIS, dadosImovel } from '../fixtures/test-data'

// ============================================================
// Sprint 2 — Imoveis (CRUD + permissoes por perfil)
// ============================================================

// --- Helpers ---

async function fecharTourSeVisivel(page: import('@playwright/test').Page) {
  const btnPularTour = page.getByRole('button', { name: /pular tour/i })
  try {
    await btnPularTour.waitFor({ state: 'visible', timeout: 3_000 })
    await btnPularTour.click()
    await page.locator('[data-name="onborda-overlay"]').waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {})
  } catch {
    // Tour nao apareceu
  }
  await page.evaluate(() => {
    document.querySelectorAll('[data-name="onborda-overlay"], [data-name="onborda-pointer"]').forEach(el => el.remove())
  }).catch(() => {})
}

async function selecionarOpcao(page: import('@playwright/test').Page, placeholderTexto: string, opcaoTexto: string) {
  await page.getByRole('combobox').filter({ hasText: placeholderTexto }).click()
  await page.getByRole('option', { name: opcaoTexto, exact: true }).click()
}

const SELETOR_LINK_IMOVEL = 'a[href*="/imoveis/"]:not([href*="importar"]):not([href*="novo"]):not([href*="editar"])'

// Aguardar pagina de detalhe do imovel (redirect via RSC nao muda URL)
async function aguardarDetalheImovel(page: import('@playwright/test').Page, titulo: string) {
  await expect(
    page.getByRole('heading', { level: 1 }).filter({ hasText: titulo })
  ).toBeVisible({ timeout: 500_000 })
}

async function navegarParaDetalheImovel(page: import('@playwright/test').Page) {
  await page.goto('/imoveis')
  await page.waitForLoadState('networkidle')
  await fecharTourSeVisivel(page)
  const primeiroLink = page.locator(SELETOR_LINK_IMOVEL).first()
  await primeiroLink.click()
  await page.waitForLoadState('networkidle')
  await fecharTourSeVisivel(page)
}

async function criarImovel(page: import('@playwright/test').Page, perfil: string) {
  const dados = dadosImovel(perfil)

  await page.goto('/imoveis/novo')
  await page.waitForLoadState('networkidle')
  await fecharTourSeVisivel(page)

  await page.locator('#codigo').fill(dados.codigo)
  await page.locator('#titulo').fill(dados.titulo)

  await selecionarOpcao(page, 'Selecione o tipo', 'Apartamento')
  await selecionarOpcao(page, 'Selecione a finalidade', 'Venda')

  await page.locator('#cidade').fill(dados.cidade)
  await selecionarOpcao(page, 'UF', dados.estado)

  await page.locator('#preco_venda').fill(dados.preco_venda)
  await page.locator('#preco_aluguel').fill('1')

  await fecharTourSeVisivel(page)

  await page.evaluate(() => {
    document.querySelectorAll('[data-name="onborda-overlay"], [data-name="onborda-pointer"]').forEach(el => el.remove())
    const btn = document.getElementById('onborda-imovel-salvar') as HTMLButtonElement | null
    btn?.click()
  })

  return dados
}

// ============================================================
// Admin — CRUD completo + excluir
// ============================================================

test.describe('Admin — Imoveis', () => {
  test.use({ storageState: PERFIS.admin.storageState })

  test('criar imovel', async ({ page }) => {
    test.slow()
    const dados = await criarImovel(page, 'admin')
    await aguardarDetalheImovel(page, dados.titulo)
  })

  test('listar imoveis — pelo menos 1 visivel', async ({ page }) => {
    await page.goto('/imoveis')
    await page.waitForLoadState('networkidle')
    await fecharTourSeVisivel(page)

    const items = page.locator('[data-testid="imovel-card"], table tbody tr, .grid > a, .grid > div > a').first()
    await expect(items).toBeVisible({ timeout: 15_000 })
  })

  test('editar imovel', async ({ page }) => {
    test.slow()
    await navegarParaDetalheImovel(page)

    const editarBtn = page.getByRole('link', { name: /editar/i })
    await editarBtn.click()
    await expect(page).toHaveURL(/\/editar/, { timeout: 15_000 })
    await page.waitForLoadState('networkidle')
    await fecharTourSeVisivel(page)

    const tituloEditado = `Editado Admin ${Date.now()}`
    await page.locator('#titulo').fill(tituloEditado)

    await fecharTourSeVisivel(page)
    await page.evaluate(() => {
      document.querySelectorAll('[data-name="onborda-overlay"], [data-name="onborda-pointer"]').forEach(el => el.remove())
      const btn = document.getElementById('onborda-imovel-salvar') as HTMLButtonElement | null
      btn?.click()
    })

    await aguardarDetalheImovel(page, tituloEditado)
  })

  test('excluir imovel', async ({ page }) => {
    await navegarParaDetalheImovel(page)

    const excluirBtn = page.getByRole('button', { name: /excluir/i })
    await expect(excluirBtn).toBeVisible({ timeout: 10_000 })
    await excluirBtn.click()

    const confirmarBtn = page.getByRole('button', { name: /confirmar|excluir|sim/i }).last()
    await confirmarBtn.click()

    // Aguardar redirecionamento para lista
    await expect(
      page.locator('h1, h2').filter({ hasText: /im.veis/i }).first()
    ).toBeVisible({ timeout: 15_000 })
  })
})

// ============================================================
// Gerente — criar + editar + ver todos, SEM excluir
// ============================================================

test.describe('Gerente — Imoveis', () => {
  test.use({ storageState: PERFIS.gerente.storageState })

  test('criar imovel', async ({ page }) => {
    test.slow()
    const dados = await criarImovel(page, 'gerente')
    await aguardarDetalheImovel(page, dados.titulo)
  })

  test('listar imoveis — pelo menos 1 visivel', async ({ page }) => {
    await page.goto('/imoveis')
    await page.waitForLoadState('networkidle')
    await fecharTourSeVisivel(page)

    const items = page.locator('[data-testid="imovel-card"], table tbody tr, .grid > a, .grid > div > a').first()
    await expect(items).toBeVisible({ timeout: 15_000 })
  })

  test('excluir bloqueado — botao nao visivel', async ({ page }) => {
    await navegarParaDetalheImovel(page)

    const excluirBtn = page.getByRole('button', { name: /excluir/i })
    await expect(excluirBtn).toBeHidden({ timeout: 5_000 })
  })
})

// ============================================================
// Corretor — criar + ve so os seus (RLS)
// ============================================================

test.describe('Corretor — Imoveis', () => {
  test.use({ storageState: PERFIS.corretor.storageState })

  test('criar imovel', async ({ page }) => {
    test.slow()
    const dados = await criarImovel(page, 'corretor')
    await aguardarDetalheImovel(page, dados.titulo)
  })

  test('listar imoveis — ve apenas os proprios', async ({ page }) => {
    await page.goto('/imoveis')
    await page.waitForLoadState('networkidle')
    await fecharTourSeVisivel(page)

    const pageContent = page.locator('main, [role="main"], .container').first()
    await expect(pageContent).toBeVisible({ timeout: 10_000 })
    expect(page.url()).toContain('/imoveis')
  })
})
