import { expect, test } from '@playwright/test';
import {
  arrastar, cartao, coluna, criarProjetoNaApi, criarTarefaNaApi, dia, entrarLogado, registrarNaApi, tarefasNaApi,
} from './apoio';

test.describe('quadro de tarefas', () => {
  test('cria uma tarefa completa pelo formulário', async ({ page, request }) => {
    const conta = await entrarLogado(page, request);
    await criarProjetoNaApi(request, conta, { nome: 'Faculdade', cor: '#7c3aed' });
    await page.reload();

    await page.getByRole('button', { name: '+ Nova tarefa' }).click();
    const modal = page.locator('form.modal');
    await expect(modal.getByRole('heading', { name: 'Nova tarefa' })).toBeVisible();
    await modal.getByLabel('Título').fill('Entregar relatório');
    await modal.getByLabel('Descrição').fill('Capítulo 3');
    await modal.getByLabel('Prioridade').selectOption({ label: 'Urgente' });
    await modal.getByLabel('Prazo').fill(dia(0));
    await modal.getByLabel('Projeto').selectOption({ label: 'Faculdade' });
    await modal.getByRole('button', { name: 'Salvar' }).click();

    await expect(modal).toBeHidden();
    const c = cartao(page, 'Entregar relatório');
    await expect(coluna(page, 'PENDENTE').locator(c)).toBeVisible();
    await expect(c).toContainText('Urgente');
    await expect(c).toContainText('Faculdade');
    await expect(c).toContainText('Capítulo 3');
    await expect(c.locator('.tag-hoje')).toContainText('Hoje');
    await expect(coluna(page, 'PENDENTE').locator('.contador')).toHaveText('1');
  });

  test('"+ Adicionar tarefa" de uma coluna cria a tarefa nela', async ({ page, request }) => {
    await entrarLogado(page, request);
    await coluna(page, 'EM_ANDAMENTO').getByRole('button', { name: '+ Adicionar tarefa' }).click();
    await page.getByLabel('Título').fill('Revisar código');
    await page.getByRole('button', { name: 'Salvar' }).click();

    await expect(coluna(page, 'EM_ANDAMENTO').locator(cartao(page, 'Revisar código'))).toBeVisible();
  });

  test('edita e exclui uma tarefa, e as mudanças ficam salvas', async ({ page, request }) => {
    const conta = await entrarLogado(page, request);
    await criarTarefaNaApi(request, conta, { titulo: 'Título antigo' });
    await page.reload();

    await cartao(page, 'Título antigo').click();
    await expect(page.getByRole('heading', { name: 'Editar tarefa' })).toBeVisible();
    await page.getByLabel('Título').fill('Título novo');
    await page.getByRole('button', { name: 'Salvar' }).click();
    await expect(cartao(page, 'Título novo')).toBeVisible();

    await page.reload();
    await expect(cartao(page, 'Título novo')).toBeVisible();

    await cartao(page, 'Título novo').click();
    await page.getByRole('button', { name: 'Excluir' }).click();
    await expect(page.getByText('Excluir mesmo?')).toBeVisible();
    await page.getByRole('button', { name: 'Sim, excluir' }).click();
    await expect(cartao(page, 'Título novo')).toHaveCount(0);

    expect(await tarefasNaApi(request, conta)).toEqual([]);
  });

  test('não deixa salvar tarefa sem título e fecha sem salvar', async ({ page, request }) => {
    const conta = await entrarLogado(page, request);
    await page.getByRole('button', { name: '+ Nova tarefa' }).click();
    await expect(page.getByRole('button', { name: 'Salvar' })).toBeDisabled();

    await page.getByLabel('Título').fill('Rascunho');
    await page.getByRole('button', { name: 'Cancelar' }).click();
    await expect(page.locator('form.modal')).toBeHidden();
    expect(await tarefasNaApi(request, conta)).toEqual([]);
  });

  test('arrastar o cartão muda o status e fica salvo', async ({ page, request }) => {
    const conta = await entrarLogado(page, request);
    await criarTarefaNaApi(request, conta, { titulo: 'Arraste-me' });
    await page.reload();

    await arrastar(page, cartao(page, 'Arraste-me'), coluna(page, 'CONCLUIDA').locator('.lista'));

    await expect(coluna(page, 'CONCLUIDA').locator(cartao(page, 'Arraste-me'))).toBeVisible();
    await expect.poll(async () => (await tarefasNaApi(request, conta))[0].status).toBe('CONCLUIDA');

    await page.reload();
    await expect(coluna(page, 'CONCLUIDA').locator(cartao(page, 'Arraste-me'))).toBeVisible();
    await expect(coluna(page, 'PENDENTE').locator('.coluna-vazia')).toBeVisible();
  });

  test('filtros de busca, prioridade, status e prazo', async ({ page, request }) => {
    const conta = await entrarLogado(page, request);
    await criarTarefaNaApi(request, conta, { titulo: 'Comprar pão', prioridade: 'BAIXA' });
    await criarTarefaNaApi(request, conta, { titulo: 'Pagar boleto', prioridade: 'URGENTE', prazo: dia(-2) });
    await criarTarefaNaApi(request, conta, { titulo: 'Ler livro', descricao: 'Capítulo sobre PÃO caseiro', status: 'EM_ANDAMENTO' });
    await page.reload();
    await expect(page.locator('article.cartao')).toHaveCount(3);

    // Busca no título e na descrição, sem diferenciar maiúsculas
    await page.getByPlaceholder('Buscar por título ou descrição...').fill('pão');
    await expect(page.locator('article.cartao')).toHaveCount(2);
    await expect(cartao(page, 'Pagar boleto')).toHaveCount(0);
    await page.getByRole('button', { name: 'Limpar' }).click();
    await expect(page.locator('article.cartao')).toHaveCount(3);

    await page.getByLabel('Prioridade').selectOption({ label: 'Urgente' });
    await expect(page.locator('article.cartao')).toHaveCount(1);
    await expect(cartao(page, 'Pagar boleto').locator('.tag-atrasada')).toContainText('Atrasada');
    await page.getByRole('button', { name: 'Limpar' }).click();

    // Status esconde as outras colunas
    await page.getByLabel('Status').selectOption({ label: 'Em andamento' });
    await expect(page.locator('section.coluna')).toHaveCount(1);
    await expect(cartao(page, 'Ler livro')).toBeVisible();
    await page.getByRole('button', { name: 'Limpar' }).click();
    await expect(page.locator('section.coluna')).toHaveCount(3);

    await page.getByLabel('Prazo').selectOption({ label: 'Atrasadas' });
    await expect(page.locator('article.cartao')).toHaveCount(1);
    await page.getByLabel('Prazo').selectOption({ label: 'Sem prazo' });
    await expect(page.locator('article.cartao')).toHaveCount(2);
  });

  test('cada usuário só vê as próprias tarefas', async ({ page, request }) => {
    const outro = await registrarNaApi(request);
    await criarTarefaNaApi(request, outro, { titulo: 'Tarefa secreta do outro' });

    await entrarLogado(page, request);
    await expect(page.locator('.coluna-vazia')).toHaveCount(3);
    await expect(page.getByText('Tarefa secreta do outro')).toHaveCount(0);
  });
});
