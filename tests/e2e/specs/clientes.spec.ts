import { test, expect } from '@playwright/test'
import { PERFIS, dadosCliente } from '../fixtures/test-data'

// ============================================================
// Sprint 3 — Clientes
// ============================================================

test.describe('Admin — Clientes', () => {
  test.use({ storageState: PERFIS.admin.storageState })

  const ts = Date.now()
  const nomeOriginal = `Cliente Admin ${ts}`
  const nomeEditado = `Cliente Admin Editado ${ts}`

  test('criar cliente com dados minimos', async ({ page }) => {
    await page.goto('/clientes/novo')

    await page.locator('#nome').fill(nomeOriginal)

    // Selecionar tipo "Comprador"
    await page.locator('#tipo').click()
    await page.getByRole('option', { name: 'Comprador' }).click()

    await page.locator('#onborda-cliente-salvar').click()

    // Aguardar feedback de sucesso (toast ou redirecionamento)
    await expect(
      page.getByText(/sucesso|cadastrado|criado/i).first()
    ).toBeVisible({ timeout: 10_000 })
  })

  test('listar clientes mostra registros', async ({ page }) => {
    await page.goto('/clientes')

    // Aguardar a listagem carregar — deve haver pelo menos um item
    await expect(
      page.locator('table tbody tr, [data-testid="cliente-card"], a[href*="/clientes/"]').first()
    ).toBeVisible({ timeout: 10_000 })
  })

  test('editar cliente existente', async ({ page }) => {
    // Navegar para a lista e abrir o primeiro cliente
    await page.goto('/clientes')

    // Clicar no primeiro cliente da lista para ir ao detalhe
    const linkCliente = page.locator('a[href*="/clientes/"]').filter({ hasNotText: /novo/i }).first()
    await linkCliente.click()
    await page.waitForURL(/\/clientes\/[^/]+$/, { timeout: 10_000 })

    // Ir para a pagina de edicao
    const btnEditar = page.getByRole('link', { name: /editar/i }).or(
      page.locator('a[href*="/editar"]')
    ).first()
    await btnEditar.click()
    await page.waitForURL(/\/editar/, { timeout: 10_000 })

    // Alterar o nome
    await page.locator('#nome').clear()
    await page.locator('#nome').fill(nomeEditado)

    // Salvar
    await page.locator('#onborda-cliente-salvar').click()

    await expect(
      page.getByText(/sucesso|salvo|atualizado/i).first()
    ).toBeVisible({ timeout: 10_000 })
  })

  test('excluir cliente', async ({ page }) => {
    // Navegar para a lista e abrir o primeiro cliente
    await page.goto('/clientes')

    const linkCliente = page.locator('a[href*="/clientes/"]').filter({ hasNotText: /novo/i }).first()
    await linkCliente.click()
    await page.waitForURL(/\/clientes\/[^/]+$/, { timeout: 10_000 })

    // Clicar no botao de excluir
    const btnExcluir = page.getByRole('button', { name: /excluir/i })
    await expect(btnExcluir).toBeVisible({ timeout: 5_000 })
    await btnExcluir.click()

    // Confirmar exclusao no dialog
    const btnConfirmar = page.getByRole('button', { name: /confirmar|sim|excluir/i }).last()
    await btnConfirmar.click()

    // Deve redirecionar para a lista
    await page.waitForURL(/\/clientes$/, { timeout: 10_000 })
  })
})

test.describe('Gerente — Clientes', () => {
  test.use({ storageState: PERFIS.gerente.storageState })

  test('criar cliente e listar todos da organizacao', async ({ page }) => {
    const ts = Date.now()
    const nome = `Cliente Gerente ${ts}`

    // Criar
    await page.goto('/clientes/novo')
    await page.locator('#nome').fill(nome)
    await page.locator('#tipo').click()
    await page.getByRole('option', { name: 'Comprador' }).click()
    await page.locator('#onborda-cliente-salvar').click()

    await expect(
      page.getByText(/sucesso|cadastrado|criado/i).first()
    ).toBeVisible({ timeout: 10_000 })

    // Listar — gerente ve todos os clientes da organizacao
    await page.goto('/clientes')
    await expect(
      page.locator('table tbody tr, [data-testid="cliente-card"], a[href*="/clientes/"]').first()
    ).toBeVisible({ timeout: 10_000 })
  })

  test('botao excluir nao visivel para gerente', async ({ page }) => {
    await page.goto('/clientes')

    // Abrir o primeiro cliente
    const linkCliente = page.locator('a[href*="/clientes/"]').filter({ hasNotText: /novo/i }).first()
    await linkCliente.click()
    await page.waitForURL(/\/clientes\/[^/]+$/, { timeout: 10_000 })

    // O botao de excluir NAO deve estar visivel
    const btnExcluir = page.getByRole('button', { name: /excluir/i })
    await expect(btnExcluir).not.toBeVisible({ timeout: 5_000 })
  })
})

test.describe('Corretor — Clientes', () => {
  test.use({ storageState: PERFIS.corretor.storageState })

  test('criar cliente e listar apenas os proprios', async ({ page }) => {
    const ts = Date.now()
    const nome = `Cliente Corretor ${ts}`

    // Criar
    await page.goto('/clientes/novo')
    await page.locator('#nome').fill(nome)
    await page.locator('#tipo').click()
    await page.getByRole('option', { name: 'Comprador' }).click()
    await page.locator('#onborda-cliente-salvar').click()

    await expect(
      page.getByText(/sucesso|cadastrado|criado/i).first()
    ).toBeVisible({ timeout: 10_000 })

    // Listar — corretor ve apenas os seus (via RLS)
    await page.goto('/clientes')
    await expect(
      page.locator('table tbody tr, [data-testid="cliente-card"], a[href*="/clientes/"]').first()
    ).toBeVisible({ timeout: 10_000 })
  })
})
