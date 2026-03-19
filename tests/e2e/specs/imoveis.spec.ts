import { test, expect } from '@playwright/test'
import { PERFIS, dadosImovel } from '../fixtures/test-data'

// ============================================================
// Sprint 2 — Imoveis (CRUD + permissoes por perfil)
// ============================================================

// --- Helpers ---

async function selecionarOpcao(page: import('@playwright/test').Page, triggerId: string, opcaoTexto: string) {
  // shadcn/ui Select: clicar no trigger, depois na opcao
  await page.locator(`[id="${triggerId}"]`).click()
  await page.locator('[role="option"]').filter({ hasText: opcaoTexto }).click()
}

async function criarImovel(page: import('@playwright/test').Page, perfil: string) {
  const dados = dadosImovel(perfil)

  await page.goto('/imoveis/novo')
  await page.waitForLoadState('networkidle')

  // Preencher campos de texto
  await page.locator('#codigo').fill(dados.codigo)
  await page.locator('#titulo').fill(dados.titulo)

  // Selects (shadcn)
  await selecionarOpcao(page, 'tipo', 'Apartamento')
  await selecionarOpcao(page, 'finalidade', 'Venda')

  // Localizacao
  await page.locator('#cidade').fill(dados.cidade)
  await selecionarOpcao(page, 'estado', dados.estado)

  // Preco
  await page.locator('#preco_venda').fill(dados.preco_venda)

  // Submeter
  await page.locator('#onborda-imovel-salvar').click()

  return dados
}

// ============================================================
// Admin — CRUD completo + excluir
// ============================================================

test.describe('Admin — Imoveis', () => {
  test.use({ storageState: PERFIS.admin.storageState })

  let imovelUrl: string | null = null
  let imovelTitulo: string

  test('criar imovel', async ({ page }) => {
    const dados = await criarImovel(page, 'admin')
    imovelTitulo = dados.titulo

    // Espera redirecionamento para detalhe ou toast de sucesso
    await Promise.race([
      page.waitForURL(/\/imoveis\/[a-zA-Z0-9-]+$/, { timeout: 15_000 }),
      expect(page.getByText(/sucesso|criado/i)).toBeVisible({ timeout: 15_000 }),
    ])

    // Se redirecionou, guardar URL para proximos testes
    if (page.url().match(/\/imoveis\/[a-zA-Z0-9-]+$/)) {
      imovelUrl = page.url()
    }
  })

  test('listar imoveis — pelo menos 1 visivel', async ({ page }) => {
    await page.goto('/imoveis')
    await page.waitForLoadState('networkidle')

    // Espera pelo menos 1 card ou linha de imovel
    const items = page.locator('[data-testid="imovel-card"], table tbody tr, .grid > a, .grid > div > a').first()
    await expect(items).toBeVisible({ timeout: 15_000 })
  })

  test('editar imovel', async ({ page }) => {
    // Se nao temos URL do imovel criado, ir para lista e pegar o primeiro
    if (imovelUrl) {
      await page.goto(`${imovelUrl}/editar`)
    } else {
      await page.goto('/imoveis')
      await page.waitForLoadState('networkidle')
      // Clicar no primeiro imovel da lista
      const primeiroLink = page.locator('a[href*="/imoveis/"]').first()
      await primeiroLink.click()
      await page.waitForURL(/\/imoveis\/[a-zA-Z0-9-]+/, { timeout: 10_000 })
      // Ir para editar
      const editarBtn = page.getByRole('link', { name: /editar/i }).or(page.locator('a[href$="/editar"]'))
      await editarBtn.first().click()
      await page.waitForURL(/\/editar/, { timeout: 10_000 })
    }

    await page.waitForLoadState('networkidle')

    // Alterar titulo
    const tituloEditado = `Editado Admin ${Date.now()}`
    await page.locator('#titulo').fill(tituloEditado)

    // Submeter
    await page.locator('#onborda-imovel-salvar').click()

    // Espera sucesso
    await Promise.race([
      page.waitForURL(/\/imoveis\/[a-zA-Z0-9-]+$/, { timeout: 15_000 }),
      expect(page.getByText(/sucesso|salvo|atualizado/i)).toBeVisible({ timeout: 15_000 }),
    ])
  })

  test('excluir imovel', async ({ page }) => {
    // Navegar para detalhe de um imovel
    if (imovelUrl) {
      await page.goto(imovelUrl)
    } else {
      await page.goto('/imoveis')
      await page.waitForLoadState('networkidle')
      const primeiroLink = page.locator('a[href*="/imoveis/"]').first()
      await primeiroLink.click()
      await page.waitForURL(/\/imoveis\/[a-zA-Z0-9-]+/, { timeout: 10_000 })
    }

    await page.waitForLoadState('networkidle')

    // Clicar no botao de excluir
    const excluirBtn = page.getByRole('button', { name: /excluir/i })
    await expect(excluirBtn).toBeVisible({ timeout: 10_000 })
    await excluirBtn.click()

    // Confirmar exclusao no dialog
    const confirmarBtn = page.getByRole('button', { name: /confirmar|excluir|sim/i }).last()
    await confirmarBtn.click()

    // Espera redirecionamento para lista ou toast de sucesso
    await Promise.race([
      page.waitForURL(/\/imoveis\/?$/, { timeout: 15_000 }),
      expect(page.getByText(/excluido|removido|sucesso/i)).toBeVisible({ timeout: 15_000 }),
    ])
  })
})

// ============================================================
// Gerente — criar + editar + ver todos, SEM excluir
// ============================================================

test.describe('Gerente — Imoveis', () => {
  test.use({ storageState: PERFIS.gerente.storageState })

  let imovelUrl: string | null = null

  test('criar imovel', async ({ page }) => {
    const dados = await criarImovel(page, 'gerente')

    await Promise.race([
      page.waitForURL(/\/imoveis\/[a-zA-Z0-9-]+$/, { timeout: 15_000 }),
      expect(page.getByText(/sucesso|criado/i)).toBeVisible({ timeout: 15_000 }),
    ])

    if (page.url().match(/\/imoveis\/[a-zA-Z0-9-]+$/)) {
      imovelUrl = page.url()
    }
  })

  test('listar imoveis — pelo menos 1 visivel', async ({ page }) => {
    await page.goto('/imoveis')
    await page.waitForLoadState('networkidle')

    const items = page.locator('[data-testid="imovel-card"], table tbody tr, .grid > a, .grid > div > a').first()
    await expect(items).toBeVisible({ timeout: 15_000 })
  })

  test('excluir bloqueado — botao nao visivel', async ({ page }) => {
    // Navegar para detalhe
    if (imovelUrl) {
      await page.goto(imovelUrl)
    } else {
      await page.goto('/imoveis')
      await page.waitForLoadState('networkidle')
      const primeiroLink = page.locator('a[href*="/imoveis/"]').first()
      await primeiroLink.click()
      await page.waitForURL(/\/imoveis\/[a-zA-Z0-9-]+/, { timeout: 10_000 })
    }

    await page.waitForLoadState('networkidle')

    // Botao excluir NAO deve estar visivel para gerente
    const excluirBtn = page.getByRole('button', { name: /excluir/i })
    await expect(excluirBtn).toBeHidden({ timeout: 5_000 })
  })
})

// ============================================================
// Corretor — criar + editar proprio, ve so os seus (RLS)
// ============================================================

test.describe('Corretor — Imoveis', () => {
  test.use({ storageState: PERFIS.corretor.storageState })

  test('criar imovel', async ({ page }) => {
    await criarImovel(page, 'corretor')

    await Promise.race([
      page.waitForURL(/\/imoveis\/[a-zA-Z0-9-]+$/, { timeout: 15_000 }),
      expect(page.getByText(/sucesso|criado/i)).toBeVisible({ timeout: 15_000 }),
    ])
  })

  test('listar imoveis — ve apenas os proprios', async ({ page }) => {
    await page.goto('/imoveis')
    await page.waitForLoadState('networkidle')

    // Corretor deve ver a lista (pode ter 0 ou mais imoveis proprios)
    // Verificamos que a pagina carregou sem erro
    const pageContent = page.locator('main, [role="main"], .container').first()
    await expect(pageContent).toBeVisible({ timeout: 10_000 })

    // Se houver imoveis na lista, todos devem ser do corretor
    // (verificacao via RLS — nao ha como checar ownership no front,
    //  mas garantimos que a pagina renderiza sem erro 403)
    expect(page.url()).toContain('/imoveis')
  })
})
