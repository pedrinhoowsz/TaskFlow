import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { authGuard, visitanteGuard } from './auth.guard';
import { AuthService } from './auth.service';

describe('guards de autenticação', () => {
  const logado = signal(false);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: { logado } }],
    });
  });

  function rodar(guard: typeof authGuard): boolean | UrlTree {
    return TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    ) as boolean | UrlTree;
  }

  function url(r: boolean | UrlTree): string {
    return TestBed.inject(Router).serializeUrl(r as UrlTree);
  }

  it('authGuard deixa passar quem está logado', () => {
    logado.set(true);
    expect(rodar(authGuard)).toBeTrue();
  });

  it('authGuard manda para /login quem não está logado', () => {
    logado.set(false);
    expect(url(rodar(authGuard))).toBe('/login');
  });

  it('visitanteGuard manda quem já está logado para /quadro', () => {
    logado.set(true);
    expect(url(rodar(visitanteGuard))).toBe('/quadro');
  });

  it('visitanteGuard deixa visitante abrir login/cadastro', () => {
    logado.set(false);
    expect(rodar(visitanteGuard)).toBeTrue();
  });
});
