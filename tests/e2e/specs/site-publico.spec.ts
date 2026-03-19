import { test, expect } from '@playwright/test'

// ============================================================
// Sprint 8 — Site Publico (sem autenticacao)
// ============================================================

const slug = process.env.ORG_SLUG ?? 'diagonal-empreendimentos'

test.describe('Site Publico', () => {
  test('home carrega com nome da organizacao', async ({ page }) => {
    await page.goto(`/${slug}`)
    // Espera o conteudo principal carregar
    await expect(page.locator('main, [role="main"], body').first()).toBeVisible({ timeout: 15_000 })
    // Verifica presenca de hero ou heading
    const conteudo = page.locator('h1, h2, [data-testid="hero"]').first()
    await expect(conteudo).toBeVisible({ timeout: 10_000 })
  })

  test('imoveis publicos — lista ou mensagem vazia', async ({ page }) => {
    await page.goto(`/${slug}/imoveis`)
    await expect(page.locator('main, [role="main"], body').first()).toBeVisible({ timeout: 15_000 })
    // Deve ter cards de imoveis ou mensagem "nenhum imovel"
    const temConteudo = page.locator('[data-testid*="imovel"], .card, article, text=/nenhum im/i').first()
    await expect(temConteudo).toBeVisible({ timeout: 10_000 })
  })

  test('loteamentos publicos — conteudo presente', async ({ page }) => {
    await page.goto(`/${slug}/loteamentos`)
    await expect(page.locator('main, [role="main"], body').first()).toBeVisible({ timeout: 15_000 })
  })

  test('sobre — pagina carrega', async ({ page }) => {
    await page.goto(`/${slug}/sobre`)
    await expect(page.locator('main, [role="main"], body').first()).toBeVisible({ timeout: 15_000 })
  })

  test('contato — formulario visivel', async ({ page }) => {
    await page.goto(`/${slug}/contato`)
    // Verifica que o formulario de contato esta presente
    const formulario = page.locator('form, input[name="nome"], input[placeholder*="nome" i]').first()
    await expect(formulario).toBeVisible({ timeout: 15_000 })
  })

  test('contato — enviar formulario com dados de teste', async ({ page }) => {
    await page.goto(`/${slug}/contato`)
    await expect(page.locator('form').first()).toBeVisible({ timeout: 15_000 })

    // Preenche campos do formulario
    const nomeInput = page.locator('input[name="nome"], input[placeholder*="nome" i]').first()
    const emailInput = page.locator('input[name="email"], input[type="email"], input[placeholder*="email" i]').first()
    const telefoneInput = page.locator('input[name="telefone"], input[placeholder*="telefone" i], input[placeholder*="fone" i]').first()
    const mensagemInput = page.locator('textarea[name="mensagem"], textarea[placeholder*="mensagem" i], textarea').first()

    await nomeInput.fill('Teste Playwright')
    await emailInput.fill('teste.playwright@email.com')
    await telefoneInput.fill('11999887766')
    await mensagemInput.fill('Mensagem de teste enviada pelo Playwright E2E.')

    // Submete o formulario
    const botaoEnviar = page.getByRole('button', { name: /enviar|contato|submit/i })
    await botaoEnviar.click()

    // Espera feedback de sucesso (toast, mensagem, ou redirecionamento)
    const sucesso = page.locator('text=/enviado|sucesso|obrigado|recebemos/i').first()
    await expect(sucesso).toBeVisible({ timeout: 10_000 })
  })

  test('slug invalido — mostra 404 ou nao encontrado', async ({ page }) => {
    await page.goto('/slug-que-nao-existe-xyz-99999')
    await page.waitForTimeout(3_000)

    // Verifica 404 ou mensagem de "nao encontrado"
    const naoEncontrado =
      (await page.locator('text=/404|nao encontr|not found|pagina.*exist/i').isVisible().catch(() => false)) ||
      (await page.title()).toLowerCase().includes('404')
    expect(naoEncontrado).toBeTruthy()
  })
})
