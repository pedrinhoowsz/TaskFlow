import { defineConfig } from '@playwright/test';

/**
 * Testes E2E: sobem o backend de verdade (banco H2 em memória, não mexe no MySQL)
 * e o frontend, em portas próprias (8081 e 4300) para não conflitar com o
 * ambiente de desenvolvimento (8080 e 4200).
 *
 * Rode com: npm run e2e
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 7_000 },
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:4300',
    // Usa o Google Chrome instalado no computador (não precisa baixar navegador)
    channel: 'chrome',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      // "test-run" usa o classpath de testes: H2 + src/test/resources/application.properties
      command: 'mvn -q -f ../backend/pom.xml spring-boot:test-run',
      env: { SERVER_PORT: '8081', TASKFLOW_CORS_ORIGEM: 'http://localhost:4300' },
      url: 'http://localhost:8081/api/tarefas', // responde 401 quando a API está no ar
      timeout: 180_000,
      reuseExistingServer: !process.env['CI'],
    },
    {
      command: 'npx ng serve --configuration e2e --port 4300',
      url: 'http://localhost:4300',
      timeout: 180_000,
      reuseExistingServer: !process.env['CI'],
    },
  ],
});
