import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.test' })

export default defineConfig({
  testDir: '.',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }]],

  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },

  projects: [
    // --- Setup: autenticacao dos 4 perfis ---
    {
      name: 'setup:auth',
      testMatch: /setup\/auth\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },

    // --- Sprints de teste ---
    {
      name: 'sprint1-auth',
      testMatch: /specs\/auth\.spec\.ts/,
      dependencies: ['setup:auth'],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'sprint2-imoveis',
      testMatch: /specs\/imoveis\.spec\.ts/,
      dependencies: ['setup:auth'],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'sprint3-clientes',
      testMatch: /specs\/clientes\.spec\.ts/,
      dependencies: ['setup:auth'],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'sprint4-negocios',
      testMatch: /specs\/negocios\.spec\.ts/,
      dependencies: ['setup:auth'],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'sprint5-atividades',
      testMatch: /specs\/atividades\.spec\.ts/,
      dependencies: ['setup:auth'],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'sprint6-loteamentos',
      testMatch: /specs\/loteamentos\.spec\.ts/,
      dependencies: ['setup:auth'],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'sprint7-configuracoes',
      testMatch: /specs\/configuracoes\.spec\.ts/,
      dependencies: ['setup:auth'],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'sprint8-site-publico',
      testMatch: /specs\/site-publico\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'sprint9-admin',
      testMatch: /specs\/admin\.spec\.ts/,
      dependencies: ['setup:auth'],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'sprint10-whatsapp',
      testMatch: /specs\/agente-whatsapp\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },

    // --- Mobile ---
    {
      name: 'mobile',
      testMatch: /specs\/auth\.spec\.ts/,
      dependencies: ['setup:auth'],
      use: { ...devices['Pixel 7'] },
    },
  ],
})
