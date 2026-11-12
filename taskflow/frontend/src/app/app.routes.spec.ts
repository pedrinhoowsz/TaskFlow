import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';
import { routes } from './app.routes';
import { AuthService } from './core/auth.service';
import { TarefaService } from './core/tarefa.service';
import { ProjetoService } from './core/projeto.service';
import { DashboardService } from './core/dashboard.service';
import { USUARIO, umDashboard } from '../testing/fabricas';

/** Testa a navegação de verdade, com as rotas e os guards da aplicação. */
describe('rotas da aplicação', () => {
  const logado = signal(false);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        { provide: AuthService, useValue: { logado, usuario: signal(USUARIO), sair: () => {} } },
        { provide: TarefaService, useValue: { listar: () => of([]) } },
        { provide: ProjetoService, useValue: { listar: () => of([]) } },
        { provide: DashboardService, useValue: { carregar: () => of(umDashboard()) } },
      ],
    });
  });

  // O Angular só permite um harness por teste, então reaproveitamos o mesmo
  let harness: RouterTestingHarness | null;
  beforeEach(() => (harness = null));

  async function abrir(url: string): Promise<string> {
    harness ??= await RouterTestingHarness.create();
    await harness.navigateByUrl(url);
    return TestBed.inject(Router).url;
  }

  describe('deslogado', () => {
    beforeEach(() => logado.set(false));

    for (const url of ['/', '/quadro', '/dashboard', '/projetos']) {
      it(`${url} manda para o login`, async () => {
        expect(await abrir(url)).toBe('/login');
      });
    }

    it('pode abrir login e cadastro', async () => {
      expect(await abrir('/login')).toBe('/login');
      expect(await abrir('/registro')).toBe('/registro');
    });

    it('rota inexistente manda para o login', async () => {
      expect(await abrir('/nao-existe')).toBe('/login');
    });
  });

  describe('logado', () => {
    beforeEach(() => logado.set(true));

    it('/ abre o quadro', async () => {
      expect(await abrir('/')).toBe('/quadro');
    });

    it('abre dashboard e projetos', async () => {
      expect(await abrir('/dashboard')).toBe('/dashboard');
      expect(await abrir('/projetos')).toBe('/projetos');
    });

    it('login e cadastro mandam de volta para o quadro', async () => {
      expect(await abrir('/login')).toBe('/quadro');
      expect(await abrir('/registro')).toBe('/quadro');
    });

    it('rota inexistente volta para o quadro', async () => {
      expect(await abrir('/nao-existe')).toBe('/quadro');
    });
  });
});
