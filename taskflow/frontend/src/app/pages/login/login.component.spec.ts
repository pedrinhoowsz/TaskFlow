import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, provideRouter } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../core/auth.service';
import { AuthResponse } from '../../core/models';
import { botao, digitar, existe, texto } from '../../../testing/dom';
import { USUARIO } from '../../../testing/fabricas';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let auth: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['login']);
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
    }).compileComponents();
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  async function preencher(email = 'pedro@teste.com', senha = '123456') {
    await digitar(fixture, '#email', email);
    await digitar(fixture, '#senha', senha);
  }

  function enviar() {
    botao(fixture, 'Entrar').click();
    fixture.detectChanges();
  }

  it('deixa o botão desativado enquanto o formulário está vazio', () => {
    expect(botao(fixture, 'Entrar').disabled).toBeTrue();
  });

  it('entra e vai para o quadro', async () => {
    auth.login.and.returnValue(of({ token: 't', usuario: USUARIO }));
    await preencher();
    expect(botao(fixture, 'Entrar').disabled).toBeFalse();

    enviar();

    expect(auth.login).toHaveBeenCalledWith('pedro@teste.com', '123456');
    expect(router.navigate).toHaveBeenCalledWith(['/quadro']);
  });

  it('mostra "Entrando..." e bloqueia o botão enquanto espera a API', async () => {
    const resposta = new Subject<AuthResponse>();
    auth.login.and.returnValue(resposta);
    await preencher();
    enviar();
    expect(botao(fixture, 'Entrando...').disabled).toBeTrue();
  });

  it('mostra a mensagem da API quando a senha está errada', async () => {
    auth.login.and.returnValue(throwError(() =>
      new HttpErrorResponse({ status: 401, error: { mensagem: 'E-mail ou senha inválidos' } })));
    await preencher();
    enviar();

    expect(texto(fixture, '.alerta-erro')).toBe('E-mail ou senha inválidos');
    expect(router.navigate).not.toHaveBeenCalled();
    expect(botao(fixture, 'Entrar').disabled).toBeFalse(); // pode tentar de novo
  });

  it('limpa o erro anterior ao tentar de novo', async () => {
    auth.login.and.returnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
    await preencher();
    enviar();
    expect(existe(fixture, '.alerta-erro')).toBeTrue();

    auth.login.and.returnValue(new Subject<AuthResponse>());
    enviar();
    expect(existe(fixture, '.alerta-erro')).toBeFalse();
  });

  it('tem link para criar conta', () => {
    const link = (fixture.nativeElement as HTMLElement).querySelector('a[href="/registro"]');
    expect(link).not.toBeNull();
  });
});
