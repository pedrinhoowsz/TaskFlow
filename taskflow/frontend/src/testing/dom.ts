import { ComponentFixture } from '@angular/core/testing';

/** Helpers para interagir com a tela nos testes de componentes. */

export function el<T extends HTMLElement = HTMLElement>(f: ComponentFixture<unknown>, seletor: string): T {
  const achado = (f.nativeElement as HTMLElement).querySelector<T>(seletor);
  if (!achado) throw new Error(`Elemento não encontrado: ${seletor}`);
  return achado;
}

export function todos(f: ComponentFixture<unknown>, seletor: string): HTMLElement[] {
  return Array.from((f.nativeElement as HTMLElement).querySelectorAll<HTMLElement>(seletor));
}

export function texto(f: ComponentFixture<unknown>, seletor: string): string {
  return el(f, seletor).textContent?.replace(/\s+/g, ' ').trim() ?? '';
}

export function existe(f: ComponentFixture<unknown>, seletor: string): boolean {
  return !!(f.nativeElement as HTMLElement).querySelector(seletor);
}

/** Digita num input/textarea e espera o ngModel atualizar. */
export async function digitar(f: ComponentFixture<unknown>, seletor: string, valor: string): Promise<void> {
  const campo = el<HTMLInputElement>(f, seletor);
  campo.value = valor;
  campo.dispatchEvent(new Event('input'));
  f.detectChanges();
  await f.whenStable();
  f.detectChanges();
}

/** Botão cujo texto contém o termo informado. */
export function botao(f: ComponentFixture<unknown>, termo: string): HTMLButtonElement {
  const b = todos(f, 'button').find((x) => x.textContent?.includes(termo));
  if (!b) throw new Error(`Botão não encontrado: ${termo}`);
  return b as HTMLButtonElement;
}
