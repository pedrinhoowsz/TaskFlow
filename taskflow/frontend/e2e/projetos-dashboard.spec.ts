import { expect, test } from '@playwright/test';
import { cartao, criarProjetoNaApi, criarTarefaNaApi, dia, entrarLogado, novaConta, tarefasNaApi } from './apoio';

test.describe('projetos', () => {
  test('cria, edita e exclui um projeto; as tarefas ficam sem projeto', async ({ page, request }) => {
    const conta = await entrarLogado(page, request);
    await page.getByRole('link', { name: 'Projetos' }).click();
    await expect(page).toHaveURL(/\/projetos$/);

    // Criar
    await page.getByLabel('Nome').fill('Casa');
    await page.getByLabel('Descrição').fill('Coisas de casa');
    await page.getByRole('button', { name: 'Cor #138a52' }).click();
    await page.getByRole('button', { name: 'Criar projeto' }).click();

    const projeto = page.locator('article.projeto', { has: page.getByRole('heading', { name: 'Casa' }) });
    await expect(projeto).toContainText('Coisas de casa');
    await expect(projeto).toContainText('0 tarefas');
    await expect(page.getByLabel('Nome')).toHaveValue(''); // formulário volta a ficar vazio

    // Editar
    await projeto.getByRole('button', { name: 'Editar' }).click();
    await expect(page.getByRole('heading', { name: 'Editar projeto' })).toBeVisible();
    await page.getByLabel('Nome').fill('Casa nova');
    await page.getByRole('button', { name: 'Salvar alterações' }).click();
    const editado = page.locator('article.projeto', { has: page.getByRole('heading', { name: 'Casa nova' }) });
    await expect(editado).toBeVisible();

    // Tarefa no projeto aparece com o nome dele no quadro e na contagem
    const id = (await (await request.get('http://localhost:8081/api/projetos', {
      headers: { Authorization: `Bearer ${conta.token}` },
    })).json())[0].id;
    await criarTarefaNaApi(request, conta, { titulo: 'Arrumar a sala', projetoId: id });
    await page.reload();
    await expect(editado).toContainText('1 tarefa');

    // Excluir pede confirmação e mantém a tarefa
    await editado.getByRole('button', { name: 'Excluir' }).click();
    await expect(editado).toContainText('As tarefas ficarão sem projeto. Excluir?');
    await editado.getByRole('button', { name: 'Sim' }).click();
    await expect(editado).toHaveCount(0);

    const [tarefa] = await tarefasNaApi(request, conta);
    expect(tarefa.titulo).toBe('Arrumar a sala');
    expect(tarefa.projetoId).toBeNull();

    await page.getByRole('link', { name: 'Quadro' }).click();
    await expect(cartao(page, 'Arrumar a sala')).toBeVisible();
    await expect(cartao(page, 'Arrumar a sala').locator('.projeto')).toHaveCount(0);
  });
});

test.describe('dashboard', () => {
  test('mostra os números das tarefas do usuário', async ({ page, request }) => {
    const conta = await entrarLogado(page, request, novaConta('Ana Paula Souza'));
    const projeto = await criarProjetoNaApi(request, conta, { nome: 'Trabalho', cor: '#d6344a' });
    await criarTarefaNaApi(request, conta, { titulo: 'Atrasada', prazo: dia(-1), prioridade: 'URGENTE' });
    await criarTarefaNaApi(request, conta, { titulo: 'Para hoje', prazo: dia(0), projetoId: projeto.id });
    await criarTarefaNaApi(request, conta, { titulo: 'Fazendo', status: 'EM_ANDAMENTO', projetoId: projeto.id });
    await criarTarefaNaApi(request, conta, { titulo: 'Feita', status: 'CONCLUIDA', projetoId: projeto.id });

    await page.getByRole('link', { name: 'Dashboard' }).click();
    await expect(page.getByRole('heading', { name: 'Olá, Ana' })).toBeVisible();

    const kpi = (nome: string) => page.locator('.kpi', { hasText: nome }).locator('strong');
    await expect(kpi('Total')).toHaveText('4');
    await expect(kpi('Pendentes')).toHaveText('2');
    await expect(kpi('Em andamento')).toHaveText('1');
    await expect(kpi('Concluídas')).toHaveText('1');
    await expect(kpi('Atrasadas')).toHaveText('1');
    await expect(kpi('Vencem hoje')).toHaveText('1');
    await expect(page.locator('.rosca-centro strong')).toHaveText('25%');

    // Próximos prazos em ordem (atrasada primeiro) e andamento por projeto
    await expect(page.locator('.prazo-item strong')).toHaveText(['Atrasada', 'Para hoje']);
    await expect(page.locator('.projeto-linha', { hasText: 'Trabalho' }).locator('.num')).toHaveText('1/3');
  });

  test('sem tarefas mostra tudo zerado', async ({ page, request }) => {
    await entrarLogado(page, request);
    await page.goto('/dashboard');
    await expect(page.locator('.kpi', { hasText: 'Total' }).locator('strong')).toHaveText('0');
    await expect(page.getByText('Nenhuma tarefa aberta com prazo.')).toBeVisible();
    await expect(page.getByText('Nenhum projeto com tarefas ainda.')).toBeVisible();
  });
});
