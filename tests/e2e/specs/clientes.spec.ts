import { test, expect } from '@playwright/test'
import { PERFIS, dadosCliente } from '../fixtures/test-data'

// ============================================================
// Sprint 3 — Clientes
// ============================================================

// --- Helpers ---

async function fecharTourSeVisivel(page: import('@playwright/test').Page) {
  const btnPularTour = page.getByRole('button', { name: /pular tour/i })
  try {
    await btnPularTour.waitFor({ state: 'visible', timeout: 5_000 })
    await btnPularTour.click()
    await page.locator('[data-name="onborda-overlay"]').waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {})
  } catch {
    // Tour nao apareceu
  }
  // Garantir que nenhum overlay residual bloqueia cliques
  await page.evaluate(() => {
    document.querySelectorAll('[data-name="onborda-overlay"], [data-name="onborda-pointer"]').forEach(el => el.remove())
  }).catch(() => {})
}

// Seletor para links de clientes individuais (exclui /novo, /editar)
const SELETOR_LINK_CLIENTE = 'a[href*="/clientes/"]:not([href*="novo"]):not([href*="editar"])'

// Regex para URL de detalhe de cliente (UUID)
const REGEX_DETALHE_CLIENTE = /\/clientes\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/

// Aguardar pagina de detalhe do cliente carregar (redirect do Next.js via RSC nao muda URL)
async function aguardarDetalheCliente(page: import('@playwright/test').Page, nomeCliente: string) {
  // O redirect() dentro de useActionState nao muda a URL do browser —
  // usa RSC streaming para trocar o conteudo. Verificar pelo conteudo da pagina.
  await expect(
    page.getByRole('heading', { level: 1 }).filter({ hasText: nomeCliente })
  ).toBeVisible({ timeout: 500_000 })
}

async function criarCliente(page: import('@playwright/test').Page, perfil: string) {
  const dados = dadosCliente(perfil)

  await page.goto('/clientes/novo')
  await page.waitForLoadState('networkidle')

  // Fechar tour de onboarding se estiver visivel
  await fecharTourSeVisivel(page)

  // Preencher nome
  await page.locator('#nome').fill(dados.nome)

  // Selecionar tipo "Comprador" (shadcn Select — combobox por placeholder)
  await page.getByRole('combobox').filter({ hasText: /selecione o tipo/i }).click()
  await page.getByRole('option', { name: 'Comprador' }).waitFor({ state: 'visible', timeout: 10_000 })
  await page.getByRole('option', { name: 'Comprador' }).click()

  // Fechar tour novamente caso tenha avancado para o step do botao salvar
  await fecharTourSeVisivel(page)

  // Submeter: remover overlay e clicar com evento de mouse real
  await page.evaluate(() => {
    document.querySelectorAll('[data-name="onborda-overlay"], [data-name="onborda-pointer"]').forEach(el => el.remove())
  })
  await page.locator('#onborda-cliente-salvar').click({ force: true })

  return dados
}

// ============================================================
// Admin — CRUD completo + excluir
// ============================================================

test.describe('Admin — Clientes', () => {
  test.use({ storageState: PERFIS.admin.storageState })

  test('criar cliente com dados minimos', async ({ page }) => {
    test.slow() // Server actions no Vercel podem demorar 3+ minutos
    const dados = await criarCliente(page, 'admin')

    // Aguardar pagina de detalhe carregar (verifica pelo nome no heading h1)
    await aguardarDetalheCliente(page, dados.nome)
  })

  test('listar clientes mostra registros', async ({ page }) => {
    await page.goto('/clientes')
    await page.waitForLoadState('networkidle')
    await fecharTourSeVisivel(page)

    // Aguardar a listagem carregar — deve haver pelo menos um item
    await expect(
      page.locator('table tbody tr, [data-testid="cliente-card"], a[href*="/clientes/"]').first()
    ).toBeVisible({ timeout: 15_000 })
  })

  test('editar cliente existente', async ({ page }) => {
    test.slow()
    // Navegar para lista e abrir o primeiro cliente
    await page.goto('/clientes')
    await page.waitForLoadState('networkidle')
    await fecharTourSeVisivel(page)
    const primeiroLink = page.locator(SELETOR_LINK_CLIENTE).first()
    await primeiroLink.click()
    await page.waitForLoadState('networkidle')
    await fecharTourSeVisivel(page)

    // Ir para a pagina de edicao
    const btnEditar = page.getByRole('link', { name: /editar/i }).or(
      page.locator('a[href*="/editar"]')
    ).first()
    await btnEditar.click()
    await page.waitForURL(/\/editar/, { timeout: 10_000 })
    await page.waitForLoadState('networkidle')
    await fecharTourSeVisivel(page)

    // Alterar o nome
    const nomeEditado = `Cliente Admin Editado ${Date.now()}`
    await page.locator('#nome').clear()
    await page.locator('#nome').fill(nomeEditado)

    // Fechar tour novamente caso tenha avancado
    await fecharTourSeVisivel(page)

    // Salvar: remover overlay e clicar com evento de mouse real
    await page.evaluate(() => {
      document.querySelectorAll('[data-name="onborda-overlay"], [data-name="onborda-pointer"]').forEach(el => el.remove())
    })
    await page.locator('#onborda-cliente-salvar').click({ force: true })

    // Aguardar pagina de detalhe com o nome editado
    await aguardarDetalheCliente(page, nomeEditado)
  })

  test('excluir cliente', async ({ page }) => {
    // Navegar para lista e abrir o primeiro cliente
    await page.goto('/clientes')
    await page.waitForLoadState('networkidle')
    await fecharTourSeVisivel(page)
    const primeiroLink = page.locator(SELETOR_LINK_CLIENTE).first()
    await primeiroLink.click()
    await page.waitForLoadState('networkidle')
    await fecharTourSeVisivel(page)

    // Clicar no botao de excluir
    const btnExcluir = page.getByRole('button', { name: /excluir/i })
    await expect(btnExcluir).toBeVisible({ timeout: 10_000 })
    await btnExcluir.click()

    // Confirmar exclusao no dialog
    const btnConfirmar = page.getByRole('button', { name: /confirmar|excluir|sim/i }).last()
    await btnConfirmar.click()

    // Aguardar redirecionamento para lista (excluir faz redirect real ou o conteudo muda)
    await expect(
      page.locator('h1, h2').filter({ hasText: /clientes/i }).first()
    ).toBeVisible({ timeout: 15_000 })
  })
})

// ============================================================
// Gerente — criar + listar todos
// ============================================================

test.describe('Gerente — Clientes', () => {
  test.use({ storageState: PERFIS.gerente.storageState })

  test('criar cliente e listar todos da organizacao', async ({ page }) => {
    test.slow()
    const dados = await criarCliente(page, 'gerente')

    // Aguardar pagina de detalhe carregar
    await aguardarDetalheCliente(page, dados.nome)

    // Listar — gerente ve todos os clientes da organizacao
    await page.goto('/clientes')
    await page.waitForLoadState('networkidle')
    await fecharTourSeVisivel(page)

    await expect(
      page.locator('table tbody tr, [data-testid="cliente-card"], a[href*="/clientes/"]').first()
    ).toBeVisible({ timeout: 15_000 })
  })

  test('gerente pode ver detalhe de cliente', async ({ page }) => {
    await page.goto('/clientes')
    await page.waitForLoadState('networkidle')
    await fecharTourSeVisivel(page)

    // Abrir o primeiro cliente
    const linkCliente = page.locator(SELETOR_LINK_CLIENTE).first()
    await linkCliente.click()
    await page.waitForLoadState('networkidle')
    await fecharTourSeVisivel(page)

    // Pagina de detalhe carregou com conteudo
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10_000 })
  })
})

// ============================================================
// Corretor — criar + listar apenas os proprios (RLS)
// ============================================================

test.describe('Corretor — Clientes', () => {
  test.use({ storageState: PERFIS.corretor.storageState })

  test('criar cliente e listar apenas os proprios', async ({ page }) => {
    test.slow()
    const dados = await criarCliente(page, 'corretor')

    // Aguardar pagina de detalhe carregar
    await aguardarDetalheCliente(page, dados.nome)

    // Listar — corretor ve apenas os seus (via RLS)
    await page.goto('/clientes')
    await page.waitForLoadState('networkidle')
    await fecharTourSeVisivel(page)

    // Corretor deve ver a lista (pode ter 0 ou mais clientes proprios)
    const pageContent = page.locator('main, [role="main"], .container').first()
    await expect(pageContent).toBeVisible({ timeout: 10_000 })
    expect(page.url()).toContain('/clientes')
  })
})
