import { APIRequestContext, Locator, Page, expect } from '@playwright/test';

/** Funções de apoio dos testes E2E. */

export const API = 'http://localhost:8081/api';

export interface Conta {
  nome: string;
  email: string;
  senha: string;
  token?: string;
}

let contador = 0;

/** Dados de um usuário que ainda não existe (cada teste usa o seu). */
export function novaConta(nome = 'Pedro Santos'): Conta {
  contador++;
  const id = `${Date.now().toString(36)}${process.pid}${contador}${Math.random().toString(36).slice(2, 6)}`;
  return { nome, email: `e2e.${id}@teste.com`, senha: 'senha123' };
}

/** Data relativa a hoje no formato yyyy-MM-dd (fuso local). */
export function dia(deslocamento = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + deslocamento);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Cria a conta direto na API (mais rápido que pela tela). */
export async function registrarNaApi(request: APIRequestContext, conta = novaConta()): Promise<Conta> {
  const r = await request.post(`${API}/auth/registrar`, { data: conta });
  expect(r.status(), await r.text()).toBe(201);
  const corpo = await r.json();
  return { ...conta, token: corpo.token };
}

/** Cria uma conta e já abre o site logado com ela. */
export async function entrarLogado(page: Page, request: APIRequestContext, conta = novaConta()): Promise<Conta> {
  const c = await registrarNaApi(request, conta);
  const r = await request.get(`${API}/auth/me`, { headers: auth(c) });
  const usuario = await r.json();
  await page.goto('/login');
  await page.evaluate(([token, u]) => {
    localStorage.setItem('taskflow.token', token);
    localStorage.setItem('taskflow.usuario', u);
  }, [c.token!, JSON.stringify(usuario)]);
  await page.goto('/quadro');
  await expect(page.getByRole('heading', { name: 'Quadro' })).toBeVisible();
  return c;
}

export function auth(c: Conta) {
  return { Authorization: `Bearer ${c.token}` };
}

export async function criarProjetoNaApi(request: APIRequestContext, c: Conta, dados: Record<string, unknown>) {
  const r = await request.post(`${API}/projetos`, { headers: auth(c), data: dados });
  expect(r.status(), await r.text()).toBe(201);
  return r.json();
}

export async function criarTarefaNaApi(request: APIRequestContext, c: Conta, dados: Record<string, unknown>) {
  const r = await request.post(`${API}/tarefas`, { headers: auth(c), data: dados });
  expect(r.status(), await r.text()).toBe(201);
  return r.json();
}

export async function tarefasNaApi(request: APIRequestContext, c: Conta) {
  const r = await request.get(`${API}/tarefas`, { headers: auth(c) });
  return (await r.json()) as { id: number; titulo: string; status: string; projetoId: number | null }[];
}

/** Coluna do quadro (PENDENTE, EM_ANDAMENTO ou CONCLUIDA). */
export function coluna(page: Page, status: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDA'): Locator {
  return page.locator(`section.coluna[data-status="${status}"]`);
}

export function cartao(page: Page, titulo: string): Locator {
  return page.locator('article.cartao', { has: page.getByRole('heading', { name: titulo, exact: true }) });
}

/**
 * Arrasta com o mouse, em passos, como uma pessoa faria.
 * (O CDK do Angular só começa a arrastar depois que o mouse se move alguns pixels.)
 */
export async function arrastar(page: Page, origem: Locator, destino: Locator): Promise<void> {
  const de = (await origem.boundingBox())!;
  const para = (await destino.boundingBox())!;
  await page.mouse.move(de.x + de.width / 2, de.y + de.height / 2);
  await page.mouse.down();
  await page.mouse.move(de.x + de.width / 2 + 10, de.y + de.height / 2 + 10, { steps: 5 });
  await page.mouse.move(para.x + para.width / 2, para.y + 60, { steps: 20 });
  await page.mouse.up();
}
