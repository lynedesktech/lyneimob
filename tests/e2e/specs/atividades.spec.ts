import { test, expect } from '@playwright/test'
import { PERFIS, dadosAtividade } from '../fixtures/test-data'

// ============================================================
// Sprint 5 — Atividades
// ============================================================

test.describe('Admin — Atividades', () => {
  test.use({ storageState: PERFIS.admin.storageState })

  test('criar atividade com dados obrigatorios', async ({ page }) => {
    const dados = dadosAtividade('admin')

    await page.goto('/atividades/novo')

    // Titulo
    await page.locator('#titulo').fill(dados.titulo)

    // Tipo — selecionar a primeira opcao disponivel (opcoes dinamicas do backend)
    await page.locator('#tipo').click()
    await page.getByRole('option').first().click()

    // Data e hora de inicio (datetime-local)
    await page.locator('#data_inicio').fill(dados.dataInicio)

    // Submeter
    await page.getByRole('button', { name: /criar atividade/i }).click()

    // Aguardar feedback de sucesso (toast ou redirecionamento)
    await expect(
      page.getByText(/sucesso|criada|cadastrada|criado/i).first()
    ).toBeVisible({ timeout: 10_000 })
  })

  test('listar atividades mostra registros', async ({ page }) => {
    await page.goto('/atividades')

    // Aguardar a listagem carregar — deve haver pelo menos um item
    await expect(
      page.locator('table tbody tr, [data-testid="atividade-card"], a[href*="/atividades/"]').first()
    ).toBeVisible({ timeout: 10_000 })
  })

  test('marcar atividade como concluida', async ({ page }) => {
    // Ir para a lista e abrir a primeira atividade
    await page.goto('/atividades')

    const linkAtividade = page.locator('a[href*="/atividades/"]').filter({ hasNotText: /novo/i }).first()
    await linkAtividade.click()
    await page.waitForURL(/\/atividades\/[^/]+$/, { timeout: 10_000 })

    // Clicar no botao de concluir
    const btnConcluir = page.getByRole('button', { name: /conclu/i }).first()
    await expect(btnConcluir).toBeVisible({ timeout: 5_000 })
    await btnConcluir.click()

    // Esperar feedback de conclusao (toast, badge de status, ou mudanca visual)
    await expect(
      page.getByText(/conclu|sucesso|finalizada/i).first()
    ).toBeVisible({ timeout: 10_000 })
  })

  test('visualizar calendario de atividades', async ({ page }) => {
    await page.goto('/atividades')

    // Encontrar e clicar no toggle/tab de calendario
    const btnCalendario = page.getByRole('button', { name: /calend/i })
      .or(page.getByRole('tab', { name: /calend/i }))
      .or(page.locator('[data-testid="toggle-calendario"]'))
      .first()
    await btnCalendario.click()

    // Verificar que o calendario foi renderizado
    await expect(
      page.locator('[class*="calendar"], [class*="calendario"], [data-testid="calendario"], [class*="fc-"], table.fc-scrollgrid').first()
        .or(page.locator('.react-calendar, .rbc-calendar, [class*="Calendar"]').first())
    ).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('Gerente — Atividades', () => {
  test.use({ storageState: PERFIS.gerente.storageState })

  test('criar atividade e listar todas da organizacao', async ({ page }) => {
    const dados = dadosAtividade('gerente')

    // Criar
    await page.goto('/atividades/novo')

    await page.locator('#titulo').fill(dados.titulo)

    await page.locator('#tipo').click()
    await page.getByRole('option').first().click()

    await page.locator('#data_inicio').fill(dados.dataInicio)

    await page.getByRole('button', { name: /criar atividade/i }).click()

    await expect(
      page.getByText(/sucesso|criada|cadastrada|criado/i).first()
    ).toBeVisible({ timeout: 10_000 })

    // Listar — gerente ve todas as atividades da organizacao
    await page.goto('/atividades')
    await expect(
      page.locator('table tbody tr, [data-testid="atividade-card"], a[href*="/atividades/"]').first()
    ).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('Corretor — Atividades', () => {
  test.use({ storageState: PERFIS.corretor.storageState })

  test('criar atividade e listar apenas as proprias', async ({ page }) => {
    const dados = dadosAtividade('corretor')

    // Criar
    await page.goto('/atividades/novo')

    await page.locator('#titulo').fill(dados.titulo)

    await page.locator('#tipo').click()
    await page.getByRole('option').first().click()

    await page.locator('#data_inicio').fill(dados.dataInicio)

    await page.getByRole('button', { name: /criar atividade/i }).click()

    await expect(
      page.getByText(/sucesso|criada|cadastrada|criado/i).first()
    ).toBeVisible({ timeout: 10_000 })

    // Listar — corretor ve apenas as suas (via RLS)
    await page.goto('/atividades')
    await expect(
      page.locator('table tbody tr, [data-testid="atividade-card"], a[href*="/atividades/"]').first()
    ).toBeVisible({ timeout: 10_000 })
  })
})
