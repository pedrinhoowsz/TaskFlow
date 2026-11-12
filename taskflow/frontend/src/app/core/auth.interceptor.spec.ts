import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';
import { API_URL } from './api.config';

describe('authInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let auth: { token: ReturnType<typeof signal<string | null>>; sair: jasmine.Spy };

  beforeEach(() => {
    auth = { token: signal<string | null>(null), sair: jasmine.createSpy('sair') };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: auth },
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('envia o token no cabeçalho Authorization quando está logado', () => {
    auth.token.set('meu-token');
    http.get(`${API_URL}/tarefas`).subscribe();
    const req = backend.expectOne(`${API_URL}/tarefas`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer meu-token');
    req.flush([]);
  });

  it('não envia cabeçalho quando não há token', () => {
    http.get(`${API_URL}/tarefas`).subscribe();
    const req = backend.expectOne(`${API_URL}/tarefas`);
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush([]);
  });

  it('faz logout quando a API responde 401', () => {
    auth.token.set('vencido');
    let erroRecebido = 0;
    http.get(`${API_URL}/tarefas`).subscribe({ error: (e) => (erroRecebido = e.status) });
    backend.expectOne(`${API_URL}/tarefas`).flush(null, { status: 401, statusText: 'Unauthorized' });
    expect(auth.sair).toHaveBeenCalled();
    expect(erroRecebido).toBe(401); // o erro continua chegando para quem chamou
  });

  it('não faz logout no 401 do login (senha errada) nem do cadastro', () => {
    for (const rota of ['auth/login', 'auth/registrar']) {
      http.post(`${API_URL}/${rota}`, {}).subscribe({ error: () => {} });
      backend.expectOne(`${API_URL}/${rota}`).flush(null, { status: 401, statusText: 'Unauthorized' });
    }
    expect(auth.sair).not.toHaveBeenCalled();
  });

  it('não faz logout em outros erros', () => {
    auth.token.set('ok');
    for (const status of [400, 403, 404, 500, 0]) {
      http.get(`${API_URL}/tarefas`).subscribe({ error: () => {} });
      backend.expectOne(`${API_URL}/tarefas`).flush(null, { status, statusText: 'Erro' });
    }
    expect(auth.sair).not.toHaveBeenCalled();
  });
});
