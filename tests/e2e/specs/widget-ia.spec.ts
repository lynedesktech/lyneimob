import { test, expect } from '@playwright/test'
import { PERFIS } from '../fixtures/test-data'

// ============================================================
// Widget IA — Botao flutuante + painel lateral
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
}

// Seletores reutilizaveis
const SELETOR_BOTAO_WIDGET = '[data-testid="widget-ia-botao"]'
const SELETOR_PAINEL_WIDGET = '[data-testid="widget-ia-painel"]'
const SELETOR_BADGE_WIDGET = '[data-testid="widget-ia-badge"]'
const SELETOR_LINK_IMOVEL = 'a[href*="/imoveis/"]:not([href*="importar"]):not([href*="novo"]):not([href*="editar"])'
const SELETOR_LINK_CLIENTE = 'a[href*="/clientes/"]:not([href*="novo"]):not([href*="editar"])'
const REGEX_DETALHE_IMOVEL = /\/imoveis\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/
const REGEX_DETALHE_CLIENTE = /\/clientes\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/

// ============================================================
// Visibilidade e estado do widget
// ============================================================

test.describe('Widget IA — Visibilidade e estado', () => {
  test.use({ storageState: PERFIS.gerente.storageState })

  test('widget visivel no painel (dashboard)', async ({ page }) => {
    await page.goto('/painel')
    await page.waitForLoadState('networkidle')
    await fecharTourSeVisivel(page)

    const botaoWidget = page.locator(SELETOR_BOTAO_WIDGET)
    await expect(botaoWidget).toBeVisible({ timeout: 10_000 })
  })

  test('widget desabilitado em pagina de listagem (imoveis)', async ({ page }) => {
    await page.goto('/imoveis')
    await page.waitForLoadState('networkidle')
    await fecharTourSeVisivel(page)

    const botaoWidget = page.locator(SELETOR_BOTAO_WIDGET)
    await expect(botaoWidget).toBeVisible({ timeout: 10_000 })

    // Clicar no widget desabilitado deve mostrar toast informativo
    await botaoWidget.click()

    // O painel nao deve abrir em pagina de listagem
    const painel = page.locator(SELETOR_PAINEL_WIDGET)
    await expect(painel).toBeHidden({ timeout: 3_000 })
  })

  test('widget com acoes no detalhe do imovel', async ({ page }) => {
    await page.goto('/imoveis')
    await page.waitForLoadState('networkidle')
    await fecharTourSeVisivel(page)

    // Navegar para detalhe de um imovel
    const primeiroLink = page.locator(SELETOR_LINK_IMOVEL).first()
    const linkVisivel = await primeiroLink.isVisible().catch(() => false)
    if (!linkVisivel) {
      test.skip(true, 'Nenhum imovel encontrado para testar o widget')
      return
    }

    await primeiroLink.click()
    await page.waitForURL(REGEX_DETALHE_IMOVEL, { timeout: 10_000 })
    await page.waitForLoadState('networkidle')
    await fecharTourSeVisivel(page)

    // Widget deve estar visivel e ativo (com badge de acoes)
    const botaoWidget = page.locator(SELETOR_BOTAO_WIDGET)
    await expect(botaoWidget).toBeVisible({ timeout: 10_000 })

    // Badge de contagem deve estar visivel (3 acoes para imovel)
    const badge = page.locator(SELETOR_BADGE_WIDGET)
    await expect(badge).toBeVisible({ timeout: 5_000 })
    await expect(badge).toHaveText('3')
  })
})

// ============================================================
// Painel lateral — abrir, ver acoes, fechar
// ============================================================

test.describe('Widget IA — Painel lateral', () => {
  test.use({ storageState: PERFIS.gerente.storageState })

  test('abrir painel e ver acoes do imovel', async ({ page }) => {
    await page.goto('/imoveis')
    await page.waitForLoadState('networkidle')
    await fecharTourSeVisivel(page)

    const primeiroLink = page.locator(SELETOR_LINK_IMOVEL).first()
    const linkVisivel = await primeiroLink.isVisible().catch(() => false)
    if (!linkVisivel) {
      test.skip(true, 'Nenhum imovel encontrado')
      return
    }

    await primeiroLink.click()
    await page.waitForURL(REGEX_DETALHE_IMOVEL, { timeout: 10_000 })
    await page.waitForLoadState('networkidle')
    await fecharTourSeVisivel(page)

    // Clicar no botao flutuante
    const botaoWidget = page.locator(SELETOR_BOTAO_WIDGET)
    await botaoWidget.click()

    // Painel deve abrir
    const painel = page.locator(SELETOR_PAINEL_WIDGET)
    await expect(painel).toBeVisible({ timeout: 5_000 })

    // Deve mostrar as 3 acoes do imovel
    await expect(painel.getByText('Gerar descrição')).toBeVisible()
    await expect(painel.getByText('Melhorar texto')).toBeVisible()
    await expect(painel.getByText('Gerar título')).toBeVisible()

    // Subtitulo deve indicar "Imóvel"
    await expect(painel.getByText('— Imóvel')).toBeVisible()
  })

  test('abrir painel e ver acoes do cliente', async ({ page }) => {
    await page.goto('/clientes')
    await page.waitForLoadState('networkidle')
    await fecharTourSeVisivel(page)

    const primeiroLink = page.locator(SELETOR_LINK_CLIENTE).first()
    const linkVisivel = await primeiroLink.isVisible().catch(() => false)
    if (!linkVisivel) {
      test.skip(true, 'Nenhum cliente encontrado')
      return
    }

    await primeiroLink.click()
    await page.waitForURL(REGEX_DETALHE_CLIENTE, { timeout: 10_000 })
    await page.waitForLoadState('networkidle')
    await fecharTourSeVisivel(page)

    // Clicar no botao flutuante
    const botaoWidget = page.locator(SELETOR_BOTAO_WIDGET)
    await botaoWidget.click()

    // Painel deve abrir com acoes do cliente
    const painel = page.locator(SELETOR_PAINEL_WIDGET)
    await expect(painel).toBeVisible({ timeout: 5_000 })
    await expect(painel.getByText('Calcular score')).toBeVisible()
    await expect(painel.getByText('Gerar resumo')).toBeVisible()
    await expect(painel.getByText('Match inteligente')).toBeVisible()

    // Subtitulo deve indicar "Cliente"
    await expect(painel.getByText('— Cliente')).toBeVisible()
  })

  test('fechar painel com Escape', async ({ page }) => {
    await page.goto('/imoveis')
    await page.waitForLoadState('networkidle')
    await fecharTourSeVisivel(page)

    const primeiroLink = page.locator(SELETOR_LINK_IMOVEL).first()
    const linkVisivel = await primeiroLink.isVisible().catch(() => false)
    if (!linkVisivel) {
      test.skip(true, 'Nenhum imovel encontrado')
      return
    }

    await primeiroLink.click()
    await page.waitForURL(REGEX_DETALHE_IMOVEL, { timeout: 10_000 })
    await page.waitForLoadState('networkidle')
    await fecharTourSeVisivel(page)

    // Abrir painel
    await page.locator(SELETOR_BOTAO_WIDGET).click()
    const painel = page.locator(SELETOR_PAINEL_WIDGET)
    await expect(painel).toBeVisible({ timeout: 5_000 })

    // Fechar com Escape
    await page.keyboard.press('Escape')

    // Painel deve fechar
    await expect(painel).toBeHidden({ timeout: 5_000 })
  })
})

// ============================================================
// Paginas sem widget (auth — nao precisa de storageState)
// ============================================================

test.describe('Widget IA — Paginas sem widget', () => {
  test('widget nao aparece na pagina de login', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    const botaoWidget = page.locator(SELETOR_BOTAO_WIDGET)
    await expect(botaoWidget).toBeHidden({ timeout: 5_000 })
  })

  test('widget nao aparece na pagina de cadastro', async ({ page }) => {
    await page.goto('/cadastro')
    await page.waitForLoadState('networkidle')

    const botaoWidget = page.locator(SELETOR_BOTAO_WIDGET)
    await expect(botaoWidget).toBeHidden({ timeout: 5_000 })
  })
})
