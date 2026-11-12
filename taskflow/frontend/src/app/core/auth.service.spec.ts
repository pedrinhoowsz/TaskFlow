import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { API_URL } from './api.config';
import { USUARIO } from '../../testing/fabricas';

describe('AuthService', () => {
  let http: HttpTestingController;
  let router: jasmine.SpyObj<Router>;

  function criar(): AuthService {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: router },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    return TestBed.inject(AuthService);
  }

  beforeEach(() => {
    localStorage.clear();
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('começa deslogado quando não há nada salvo', () => {
    const auth = criar();
    expect(auth.logado()).toBeFalse();
    expect(auth.token()).toBeNull();
    expect(auth.usuario()).toBeNull();
  });

  it('recupera a sessão salva no navegador', () => {
    localStorage.setItem('taskflow.token', 'abc');
    localStorage.setItem('taskflow.usuario', JSON.stringify(USUARIO));
    const auth = criar();
    expect(auth.logado()).toBeTrue();
    expect(auth.usuario()).toEqual(USUARIO);
  });

  it('ignora usuário salvo corrompido sem quebrar', () => {
    localStorage.setItem('taskflow.token', 'abc');
    localStorage.setItem('taskflow.usuario', '{isso não é json');
    const auth = criar();
    expect(auth.usuario()).toBeNull();
    expect(auth.logado()).toBeTrue();
  });

  it('login envia e-mail e senha e salva a sessão', () => {
    const auth = criar();
    let resposta: unknown;
    auth.login('pedro@teste.com', '123456').subscribe((r) => (resposta = r));

    const req = http.expectOne(`${API_URL}/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'pedro@teste.com', senha: '123456' });
    req.flush({ token: 'tok-1', usuario: USUARIO });

    expect(resposta).toEqual({ token: 'tok-1', usuario: USUARIO });
    expect(auth.logado()).toBeTrue();
    expect(auth.usuario()).toEqual(USUARIO);
    expect(localStorage.getItem('taskflow.token')).toBe('tok-1');
    expect(JSON.parse(localStorage.getItem('taskflow.usuario')!)).toEqual(USUARIO);
  });

  it('login com erro não salva nada', () => {
    const auth = criar();
    auth.login('x@x.com', 'errada').subscribe({ error: () => {} });
    http.expectOne(`${API_URL}/auth/login`).flush({ mensagem: 'E-mail ou senha inválidos' }, { status: 401, statusText: 'Unauthorized' });
    expect(auth.logado()).toBeFalse();
    expect(localStorage.getItem('taskflow.token')).toBeNull();
  });

  it('registrar envia nome, e-mail e senha e já deixa logado', () => {
    const auth = criar();
    auth.registrar('Pedro', 'pedro@teste.com', '123456').subscribe();
    const req = http.expectOne(`${API_URL}/auth/registrar`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ nome: 'Pedro', email: 'pedro@teste.com', senha: '123456' });
    req.flush({ token: 'tok-2', usuario: USUARIO });
    expect(auth.token()).toBe('tok-2');
  });

  it('sair limpa a sessão e volta para o login', () => {
    localStorage.setItem('taskflow.token', 'abc');
    localStorage.setItem('taskflow.usuario', JSON.stringify(USUARIO));
    const auth = criar();

    auth.sair();

    expect(auth.logado()).toBeFalse();
    expect(auth.usuario()).toBeNull();
    expect(localStorage.getItem('taskflow.token')).toBeNull();
    expect(localStorage.getItem('taskflow.usuario')).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});
