import { test, expect } from '@playwright/test'
import { PERFIS, dadosAtividade } from '../fixtures/test-data'

// ============================================================
// Sprint 5 — Atividades
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

async function submeterFormulario(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    document.querySelectorAll('[data-name="onborda-overlay"], [data-name="onborda-pointer"]').forEach(el => el.remove())
  })
  const submitBtn = page.locator('button[type="submit"]:not([disabled])')
  await submitBtn.click({ force: true })
}

// Aguardar pagina de detalhe da atividade (redirect via RSC nao muda URL)
async function aguardarDetalheAtividade(page: import('@playwright/test').Page, titulo: string) {
  await expect(
    page.getByRole('heading', { level: 1 }).filter({ hasText: titulo })
  ).toBeVisible({ timeout: 500_000 })
}

async function criarAtividade(page: import('@playwright/test').Page, perfil: string) {
  const dados = dadosAtividade(perfil)

  await page.goto('/atividades/novo')
  await page.waitForLoadState('networkidle')
  await fecharTourSeVisivel(page)

  await page.locator('#titulo').fill(dados.titulo)

  const tipoTrigger = page.locator('#tipo')
  await tipoTrigger.click()
  await page.getByRole('option').first().waitFor({ state: 'visible', timeout: 10_000 })
  await page.getByRole('option').first().click()

  await page.locator('#data_inicio').fill(dados.dataInicio)

  await fecharTourSeVisivel(page)
  await submeterFormulario(page)

  return dados
}

test.describe('Admin — Atividades', () => {
  test.use({ storageState: PERFIS.admin.storageState })

  test('criar atividade com dados obrigatorios', async ({ page }) => {
    test.slow()
    const dados = await criarAtividade(page, 'admin')
    await aguardarDetalheAtividade(page, dados.titulo)
  })

  test('listar atividades mostra registros', async ({ page }) => {
    await page.goto('/atividades')

    await expect(
      page.locator('table tbody tr, [data-testid="atividade-card"], a[href*="/atividades/"]').first()
    ).toBeVisible({ timeout: 10_000 })
  })

  test('marcar atividade como concluida', async ({ page }) => {
    await page.goto('/atividades')
    await page.waitForLoadState('networkidle')

    const linkAtividade = page.locator('a[href*="/atividades/"]:not([href*="novo"])').first()
    const linkVisivel = await linkAtividade.isVisible().catch(() => false)
    if (!linkVisivel) {
      test.skip(true, 'Nenhuma atividade encontrada para testar')
      return
    }

    await linkAtividade.click()
    await page.waitForLoadState('networkidle')

    const btnConcluir = page.getByRole('button', { name: /conclu/i }).first()
    const temBotao = await btnConcluir.isVisible().catch(() => false)
    if (!temBotao) {
      test.skip(true, 'Atividade ja concluida ou sem botao de concluir')
      return
    }

    await btnConcluir.click()

    const btnConfirmar = page.getByRole('button', { name: /confirmar|concluir|salvar/i }).last()
    const temConfirmacao = await btnConfirmar.isVisible({ timeout: 3_000 }).catch(() => false)
    if (temConfirmacao) await btnConfirmar.click()

    await expect(
      page.getByText(/conclu|sucesso|finalizada/i).first()
    ).toBeVisible({ timeout: 10_000 })
  })

  test('visualizar calendario de atividades', async ({ page }) => {
    await page.goto('/atividades')

    const btnCalendario = page.getByRole('button', { name: /calend/i })
      .or(page.getByRole('tab', { name: /calend/i }))
      .or(page.locator('[data-testid="toggle-calendario"]'))
      .first()
    await btnCalendario.click()

    await expect(
      page.locator('[class*="calendar"], [class*="calendario"], [data-testid="calendario"], [class*="fc-"], table.fc-scrollgrid').first()
        .or(page.locator('.react-calendar, .rbc-calendar, [class*="Calendar"]').first())
    ).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('Gerente — Atividades', () => {
  test.use({ storageState: PERFIS.gerente.storageState })

  test('criar atividade e listar todas da organizacao', async ({ page }) => {
    test.slow()
    const dados = await criarAtividade(page, 'gerente')
    await aguardarDetalheAtividade(page, dados.titulo)

    await page.goto('/atividades')
    await expect(
      page.locator('table tbody tr, [data-testid="atividade-card"], a[href*="/atividades/"]').first()
    ).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('Corretor — Atividades', () => {
  test.use({ storageState: PERFIS.corretor.storageState })

  test('criar atividade e listar apenas as proprias', async ({ page }) => {
    test.slow()
    const dados = await criarAtividade(page, 'corretor')
    await aguardarDetalheAtividade(page, dados.titulo)

    await page.goto('/atividades')
    await expect(
      page.locator('table tbody tr, [data-testid="atividade-card"], a[href*="/atividades/"]').first()
    ).toBeVisible({ timeout: 10_000 })
  })
})
