import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { RegistroComponent } from './registro.component';
import { AuthService } from '../../core/auth.service';
import { botao, digitar, texto } from '../../../testing/dom';
import { USUARIO } from '../../../testing/fabricas';

describe('RegistroComponent', () => {
  let fixture: ComponentFixture<RegistroComponent>;
  let auth: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['registrar']);
    await TestBed.configureTestingModule({
      imports: [RegistroComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
    }).compileComponents();
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture = TestBed.createComponent(RegistroComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  async function preencher(dados: { nome?: string; email?: string; senha?: string; confirma?: string } = {}) {
    await digitar(fixture, '#nome', dados.nome ?? 'Pedro');
    await digitar(fixture, '#email', dados.email ?? 'pedro@teste.com');
    await digitar(fixture, '#senha', dados.senha ?? '123456');
    await digitar(fixture, '#confirma', dados.confirma ?? dados.senha ?? '123456');
  }

  function enviar() {
    botao(fixture, 'Criar conta').click();
    fixture.detectChanges();
  }

  it('cria a conta e vai para o quadro', async () => {
    auth.registrar.and.returnValue(of({ token: 't', usuario: USUARIO }));
    await preencher();
    enviar();
    expect(auth.registrar).toHaveBeenCalledWith('Pedro', 'pedro@teste.com', '123456');
    expect(router.navigate).toHaveBeenCalledWith(['/quadro']);
  });

  it('não chama a API quando as senhas não conferem', async () => {
    await preencher({ senha: '123456', confirma: '654321' });
    enviar();
    expect(texto(fixture, '.alerta-erro')).toBe('As senhas não conferem.');
    expect(auth.registrar).not.toHaveBeenCalled();
  });

  it('bloqueia senha com menos de 6 caracteres', async () => {
    await preencher({ senha: '123' });
    expect(botao(fixture, 'Criar conta').disabled).toBeTrue();
  });

  it('bloqueia e-mail inválido', async () => {
    await preencher({ email: 'nao-e-email' });
    expect(botao(fixture, 'Criar conta').disabled).toBeTrue();
  });

  it('mostra o erro da API (ex.: e-mail já cadastrado)', async () => {
    auth.registrar.and.returnValue(throwError(() =>
      new HttpErrorResponse({ status: 400, error: { mensagem: 'Este e-mail já está cadastrado' } })));
    await preencher();
    enviar();
    expect(texto(fixture, '.alerta-erro')).toBe('Este e-mail já está cadastrado');
    expect(router.navigate).not.toHaveBeenCalled();
    expect(botao(fixture, 'Criar conta').disabled).toBeFalse();
  });
});
