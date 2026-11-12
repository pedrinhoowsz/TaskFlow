import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { LayoutComponent } from './layout.component';
import { AuthService } from '../../core/auth.service';
import { Usuario } from '../../core/models';
import { el, texto } from '../../../testing/dom';
import { USUARIO } from '../../../testing/fabricas';

describe('LayoutComponent', () => {
  let fixture: ComponentFixture<LayoutComponent>;
  const usuario = signal<Usuario | null>(USUARIO);
  const sair = jasmine.createSpy('sair');

  beforeEach(async () => {
    usuario.set(USUARIO);
    sair.calls.reset();
    await TestBed.configureTestingModule({
      imports: [LayoutComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: { usuario, sair } }],
    }).compileComponents();
    fixture = TestBed.createComponent(LayoutComponent);
    fixture.detectChanges();
  });

  it('mostra nome, e-mail e iniciais do usuário', () => {
    expect(texto(fixture, '.perfil-txt strong')).toBe('Pedro Santos');
    expect(texto(fixture, '.perfil-txt small')).toBe('pedro@teste.com');
    expect(texto(fixture, '.avatar')).toBe('PS');
  });

  it('calcula as iniciais com no máximo 2 letras e ignora espaços extras', () => {
    usuario.set({ ...USUARIO, nome: '  ana   maria silva ' });
    expect(fixture.componentInstance.iniciais()).toBe('AM');
    usuario.set({ ...USUARIO, nome: 'joão' });
    expect(fixture.componentInstance.iniciais()).toBe('J');
    usuario.set(null);
    expect(fixture.componentInstance.iniciais()).toBe('');
  });

  it('tem links para quadro, dashboard e projetos', () => {
    const hrefs = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('nav a')).map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(['/quadro', '/dashboard', '/projetos']);
  });

  it('o botão Sair faz logout', () => {
    el(fixture, 'button[title="Sair"]').click();
    expect(sair).toHaveBeenCalled();
  });

  it('abre e fecha o menu no celular', () => {
    el(fixture, '.menu-btn').click();
    fixture.detectChanges();
    expect(el(fixture, '.shell').classList).toContain('menu-aberto');

    el(fixture, '.fundo').click();
    fixture.detectChanges();
    expect(el(fixture, '.shell').classList).not.toContain('menu-aberto');
  });
});
