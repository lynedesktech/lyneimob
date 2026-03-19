import { test, expect } from '@playwright/test'
import { PERFIS, dadosLoteamento } from '../fixtures/test-data'

// ============================================================
// Sprint 6 — Loteamentos
// ============================================================

test.describe('Admin — Loteamentos', () => {
  test.use({ storageState: PERFIS.admin.storageState })

  const ts = Date.now()
  const nomeOriginal = `Loteamento Admin ${ts}`
  const nomeEditado = `Loteamento Admin Editado ${ts}`

  test('criar loteamento com dados obrigatorios', async ({ page }) => {
    await page.goto('/loteamentos/novo')

    // Nome
    await page.locator('#nome').fill(nomeOriginal)

    // Cidade
    await page.locator('#cidade').fill('Sao Paulo')

    // Estado — select "SP"
    await page.locator('#estado').click()
    await page.getByRole('option', { name: 'SP' }).click()

    // Submeter
    await page.getByRole('button', { name: /cadastrar loteamento/i }).click()

    // Aguardar feedback de sucesso (toast ou redirecionamento)
    await expect(
      page.getByText(/sucesso|cadastrado|criado/i).first()
    ).toBeVisible({ timeout: 10_000 })
  })

  test('listar loteamentos mostra registros', async ({ page }) => {
    await page.goto('/loteamentos')

    // Aguardar a listagem carregar — deve haver pelo menos um item
    await expect(
      page.locator('table tbody tr, [data-testid="loteamento-card"], a[href*="/loteamentos/"]').first()
    ).toBeVisible({ timeout: 10_000 })
  })

  test('editar loteamento existente', async ({ page }) => {
    // Navegar para a lista e abrir o primeiro loteamento
    await page.goto('/loteamentos')

    const linkLoteamento = page.locator('a[href*="/loteamentos/"]').filter({ hasNotText: /novo/i }).first()
    await linkLoteamento.click()
    await page.waitForURL(/\/loteamentos\/[^/]+$/, { timeout: 10_000 })

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
    await page.getByRole('button', { name: /salvar alter/i }).click()

    await expect(
      page.getByText(/sucesso|salvo|atualizado/i).first()
    ).toBeVisible({ timeout: 10_000 })
  })

  test('excluir loteamento', async ({ page }) => {
    // Navegar para a lista e abrir o primeiro loteamento
    await page.goto('/loteamentos')

    const linkLoteamento = page.locator('a[href*="/loteamentos/"]').filter({ hasNotText: /novo/i }).first()
    await linkLoteamento.click()
    await page.waitForURL(/\/loteamentos\/[^/]+$/, { timeout: 10_000 })

    // Clicar no botao de excluir
    const btnExcluir = page.getByRole('button', { name: /excluir/i })
    await expect(btnExcluir).toBeVisible({ timeout: 5_000 })
    await btnExcluir.click()

    // Confirmar exclusao no dialog
    const btnConfirmar = page.getByRole('button', { name: /confirmar|sim|excluir/i }).last()
    await btnConfirmar.click()

    // Deve redirecionar para a lista
    await page.waitForURL(/\/loteamentos$/, { timeout: 10_000 })
  })
})

test.describe('Gerente — Loteamentos', () => {
  test.use({ storageState: PERFIS.gerente.storageState })

  test('criar loteamento e listar todos da organizacao', async ({ page }) => {
    const dados = dadosLoteamento('gerente')

    // Criar
    await page.goto('/loteamentos/novo')

    await page.locator('#nome').fill(dados.nome)
    await page.locator('#cidade').fill(dados.cidade)

    await page.locator('#estado').click()
    await page.getByRole('option', { name: 'SP' }).click()

    await page.getByRole('button', { name: /cadastrar loteamento/i }).click()

    await expect(
      page.getByText(/sucesso|cadastrado|criado/i).first()
    ).toBeVisible({ timeout: 10_000 })

    // Listar — gerente ve todos os loteamentos da organizacao
    await page.goto('/loteamentos')
    await expect(
      page.locator('table tbody tr, [data-testid="loteamento-card"], a[href*="/loteamentos/"]').first()
    ).toBeVisible({ timeout: 10_000 })
  })

  test('excluir bloqueado para gerente', async ({ page }) => {
    await page.goto('/loteamentos')

    // Abrir o primeiro loteamento
    const linkLoteamento = page.locator('a[href*="/loteamentos/"]').filter({ hasNotText: /novo/i }).first()
    await linkLoteamento.click()
    await page.waitForURL(/\/loteamentos\/[^/]+$/, { timeout: 10_000 })

    // O botao de excluir NAO deve estar visivel
    const btnExcluir = page.getByRole('button', { name: /excluir/i })
    await expect(btnExcluir).not.toBeVisible({ timeout: 5_000 })
  })
})

test.describe('Corretor — Loteamentos', () => {
  test.use({ storageState: PERFIS.corretor.storageState })

  test('listar loteamentos visivel para corretor', async ({ page }) => {
    await page.goto('/loteamentos')

    // Corretor pode ver a lista de loteamentos
    await expect(
      page.locator('table tbody tr, [data-testid="loteamento-card"], a[href*="/loteamentos/"]').first()
    ).toBeVisible({ timeout: 10_000 })
  })

  test('botao novo loteamento NAO visivel para corretor', async ({ page }) => {
    await page.goto('/loteamentos')

    // O botao "Novo" / "Novo loteamento" NAO deve estar visivel
    const btnNovo = page.getByRole('link', { name: /novo/i })
      .or(page.getByRole('button', { name: /novo/i }))
    await expect(btnNovo).not.toBeVisible({ timeout: 5_000 })
  })

  test('acesso direto a criacao bloqueado para corretor', async ({ page }) => {
    // Tentar acessar a rota de criacao diretamente
    await page.goto('/loteamentos/novo')

    // Deve redirecionar ou mostrar mensagem de sem permissao
    await expect(
      page.getByText(/sem permiss|acesso negado|nao autorizado|permiss/i).first()
        .or(page.locator('a[href*="/loteamentos"]').first())
    ).toBeVisible({ timeout: 10_000 })

    // Confirmar que NAO esta na pagina de criacao (redirecionou)
    // Aceita tanto redirect para /loteamentos quanto mensagem de erro na mesma pagina
    const url = page.url()
    const foiRedirecionado = !url.includes('/loteamentos/novo')
    const temMensagemErro = await page.getByText(/sem permiss|acesso negado|nao autorizado|permiss/i).first().isVisible().catch(() => false)

    expect(foiRedirecionado || temMensagemErro).toBeTruthy()
  })
})
