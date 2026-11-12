import { expect, test } from '@playwright/test';
import { entrarLogado, novaConta, registrarNaApi } from './apoio';

test.describe('autenticação', () => {
  test('cria conta, sai e entra de novo', async ({ page }) => {
    const conta = novaConta('Maria Oliveira');

    await page.goto('/registro');
    await page.getByLabel('Nome').fill(conta.nome);
    await page.getByLabel('E-mail').fill(conta.email);
    await page.getByLabel('Senha', { exact: true }).fill(conta.senha);
    await page.getByLabel('Confirmar senha').fill(conta.senha);
    await page.getByRole('button', { name: 'Criar conta' }).click();

    await expect(page).toHaveURL(/\/quadro$/);
    await expect(page.locator('.perfil-txt strong')).toHaveText('Maria Oliveira');
    await expect(page.locator('.avatar')).toHaveText('MO');

    await page.getByTitle('Sair').click();
    await expect(page).toHaveURL(/\/login$/);

    await page.getByLabel('E-mail').fill(conta.email.toUpperCase()); // e-mail não diferencia maiúsculas
    await page.getByLabel('Senha').fill(conta.senha);
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL(/\/quadro$/);
  });

  test('senha errada mostra erro e continua no login', async ({ page, request }) => {
    const conta = await registrarNaApi(request);
    await page.goto('/login');
    await page.getByLabel('E-mail').fill(conta.email);
    await page.getByLabel('Senha').fill('senha-errada');
    await page.getByRole('button', { name: 'Entrar' }).click();

    await expect(page.locator('.alerta-erro')).toHaveText('E-mail ou senha inválidos');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('não deixa cadastrar e-mail repetido', async ({ page, request }) => {
    const conta = await registrarNaApi(request);
    await page.goto('/registro');
    await page.getByLabel('Nome').fill('Outra pessoa');
    await page.getByLabel('E-mail').fill(conta.email);
    await page.getByLabel('Senha', { exact: true }).fill('123456');
    await page.getByLabel('Confirmar senha').fill('123456');
    await page.getByRole('button', { name: 'Criar conta' }).click();

    await expect(page.locator('.alerta-erro')).toHaveText('Este e-mail já está cadastrado');
  });

  test('avisa quando as senhas não conferem', async ({ page }) => {
    await page.goto('/registro');
    await page.getByLabel('Nome').fill('Teste');
    await page.getByLabel('E-mail').fill(novaConta().email);
    await page.getByLabel('Senha', { exact: true }).fill('123456');
    await page.getByLabel('Confirmar senha').fill('654321');
    await page.getByRole('button', { name: 'Criar conta' }).click();

    await expect(page.locator('.alerta-erro')).toHaveText('As senhas não conferem.');
    await expect(page).toHaveURL(/\/registro$/);
  });

  test('senha longa demais mostra a mensagem da API em vez de erro 500', async ({ page }) => {
    const senha = 's'.repeat(80);
    await page.goto('/registro');
    await page.getByLabel('Nome').fill('Teste');
    await page.getByLabel('E-mail').fill(novaConta().email);
    await page.getByLabel('Senha', { exact: true }).fill(senha);
    await page.getByLabel('Confirmar senha').fill(senha);
    await page.getByRole('button', { name: 'Criar conta' }).click();

    await expect(page.locator('.alerta-erro')).toHaveText('A senha deve ter entre 6 e 72 caracteres');
  });

  test('páginas internas exigem login', async ({ page }) => {
    for (const url of ['/quadro', '/dashboard', '/projetos', '/']) {
      await page.goto(url);
      await expect(page).toHaveURL(/\/login$/);
    }
  });

  test('continua logado depois de recarregar a página', async ({ page, request }) => {
    await entrarLogado(page, request);
    await page.reload();
    await expect(page).toHaveURL(/\/quadro$/);
    await page.goto('/login');
    await expect(page).toHaveURL(/\/quadro$/); // logado não vê a tela de login
  });

  test('token inválido salvo no navegador volta para o login', async ({ page }) => {
    // Ex.: banco recriado enquanto o navegador guardava um token antigo
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem('taskflow.token', 'token-de-outro-banco');
      localStorage.setItem('taskflow.usuario', JSON.stringify({ id: 999, nome: 'Fantasma', email: 'x@x.com' }));
    });
    await page.goto('/quadro');

    await expect(page).toHaveURL(/\/login$/);
    expect(await page.evaluate(() => localStorage.getItem('taskflow.token'))).toBeNull();
  });
});
