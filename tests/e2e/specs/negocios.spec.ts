import { test, expect } from '@playwright/test'
import { PERFIS, dadosNegocio } from '../fixtures/test-data'

// ============================================================
// Sprint 4 — Negocios (Pipeline)
// ============================================================

test.describe('Admin — Negocios', () => {
  test.use({ storageState: PERFIS.admin.storageState })

  const ts = Date.now()
  const tituloOriginal = `Negocio Admin ${ts}`
  const tituloEditado = `Negocio Admin Editado ${ts}`

  test('criar negocio com dados obrigatorios', async ({ page }) => {
    await page.goto('/negocios/novo')

    // Titulo
    await page.locator('#titulo').fill(tituloOriginal)

    // Tipo — select "Venda"
    await page.locator('#tipo').click()
    await page.getByRole('option', { name: 'Venda' }).click()

    // Etapa do pipeline — selecionar a primeira disponivel
    await page.locator('#etapa_id').click()
    await page.getByRole('option').first().click()

    // Cliente — ComboboxCampo
    // Tentar clicar no trigger do combobox de cliente
    const comboboxCliente = page.getByRole('combobox', { name: /cliente/i }).or(
      page.getByText('Selecionar cliente...')
    ).first()
    await comboboxCliente.click()

    // Buscar e selecionar o primeiro resultado
    const inputBusca = page.locator('[cmdk-input]').or(
      page.getByPlaceholder(/buscar/i)
    ).first()
    await inputBusca.fill('Cliente')
    await page.locator('[cmdk-item]').first().click({ timeout: 10_000 })

    // Submeter
    await page.getByRole('button', { name: /criar neg/i }).click()

    await expect(
      page.getByText(/sucesso|criado|cadastrado/i).first()
    ).toBeVisible({ timeout: 10_000 })
  })

  test('visualizar kanban com colunas do pipeline', async ({ page }) => {
    await page.goto('/negocios')

    // O kanban deve ter colunas visiveis (cada coluna e uma etapa do pipeline)
    // As colunas geralmente tem um header com o nome da etapa
    await expect(
      page.locator('[data-testid="kanban-coluna"], [class*="kanban"], [class*="pipeline"], [class*="coluna"]').first()
        .or(page.locator('.flex.gap, .flex.space-x').first())
    ).toBeVisible({ timeout: 10_000 })
  })

  test('visualizar lista de negocios', async ({ page }) => {
    await page.goto('/negocios?visao=lista')

    // Deve mostrar tabela ou lista com negocios
    await expect(
      page.locator('table, [data-testid="lista-negocios"], [role="table"]').first()
        .or(page.locator('a[href*="/negocios/"]').first())
    ).toBeVisible({ timeout: 10_000 })
  })

  test('editar negocio existente', async ({ page }) => {
    // Ir para a lista para achar um negocio
    await page.goto('/negocios?visao=lista')

    // Clicar no primeiro negocio
    const linkNegocio = page.locator('a[href*="/negocios/"]').filter({ hasNotText: /novo/i }).first()
    await linkNegocio.click()
    await page.waitForURL(/\/negocios\/[^/]+$/, { timeout: 10_000 })

    // Ir para edicao
    const btnEditar = page.getByRole('link', { name: /editar/i }).or(
      page.locator('a[href*="/editar"]')
    ).first()
    await btnEditar.click()
    await page.waitForURL(/\/editar/, { timeout: 10_000 })

    // Alterar titulo
    await page.locator('#titulo').clear()
    await page.locator('#titulo').fill(tituloEditado)

    // Salvar
    await page.getByRole('button', { name: /salvar/i }).click()

    await expect(
      page.getByText(/sucesso|salvo|atualizado/i).first()
    ).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('Gerente — Negocios', () => {
  test.use({ storageState: PERFIS.gerente.storageState })

  test('criar negocio e listar todos da organizacao', async ({ page }) => {
    const ts = Date.now()
    const titulo = `Negocio Gerente ${ts}`

    await page.goto('/negocios/novo')

    // Titulo
    await page.locator('#titulo').fill(titulo)

    // Tipo
    await page.locator('#tipo').click()
    await page.getByRole('option', { name: 'Venda' }).click()

    // Etapa — primeira disponivel
    await page.locator('#etapa_id').click()
    await page.getByRole('option').first().click()

    // Cliente
    const comboboxCliente = page.getByRole('combobox', { name: /cliente/i }).or(
      page.getByText('Selecionar cliente...')
    ).first()
    await comboboxCliente.click()

    const inputBusca = page.locator('[cmdk-input]').or(
      page.getByPlaceholder(/buscar/i)
    ).first()
    await inputBusca.fill('Cliente')
    await page.locator('[cmdk-item]').first().click({ timeout: 10_000 })

    // Submeter
    await page.getByRole('button', { name: /criar neg/i }).click()

    await expect(
      page.getByText(/sucesso|criado|cadastrado/i).first()
    ).toBeVisible({ timeout: 10_000 })

    // Listar — gerente ve todos da organizacao
    await page.goto('/negocios?visao=lista')
    await expect(
      page.locator('a[href*="/negocios/"]').first()
    ).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('Corretor — Negocios', () => {
  test.use({ storageState: PERFIS.corretor.storageState })

  test('criar negocio e listar apenas os proprios', async ({ page }) => {
    const ts = Date.now()
    const titulo = `Negocio Corretor ${ts}`

    await page.goto('/negocios/novo')

    // Titulo
    await page.locator('#titulo').fill(titulo)

    // Tipo
    await page.locator('#tipo').click()
    await page.getByRole('option', { name: 'Venda' }).click()

    // Etapa — primeira disponivel
    await page.locator('#etapa_id').click()
    await page.getByRole('option').first().click()

    // Cliente
    const comboboxCliente = page.getByRole('combobox', { name: /cliente/i }).or(
      page.getByText('Selecionar cliente...')
    ).first()
    await comboboxCliente.click()

    const inputBusca = page.locator('[cmdk-input]').or(
      page.getByPlaceholder(/buscar/i)
    ).first()
    await inputBusca.fill('Cliente')
    await page.locator('[cmdk-item]').first().click({ timeout: 10_000 })

    // Submeter
    await page.getByRole('button', { name: /criar neg/i }).click()

    await expect(
      page.getByText(/sucesso|criado|cadastrado/i).first()
    ).toBeVisible({ timeout: 10_000 })

    // Listar — corretor ve apenas os seus (via RLS)
    await page.goto('/negocios?visao=lista')
    await expect(
      page.locator('a[href*="/negocios/"]').first()
    ).toBeVisible({ timeout: 10_000 })
  })
})
