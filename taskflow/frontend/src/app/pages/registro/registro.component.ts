import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { mensagemDeErro } from '../../core/erro';
import { AuthHeroComponent } from '../login/auth-hero.component';

@Component({
  selector: 'app-registro',
  imports: [FormsModule, RouterLink, AuthHeroComponent],
  template: `
    <div class="auth-page">
      <app-auth-hero />
      <div class="auth-form-wrap">
        <form class="auth-form" (ngSubmit)="cadastrar()" #form="ngForm">
          <h2>Criar conta</h2>
          <p class="sub">Leva menos de um minuto.</p>

          @if (erro()) {
            <div class="alerta alerta-erro">{{ erro() }}</div>
          }

          <div class="campo">
            <label for="nome">Nome</label>
            <input id="nome" class="input" name="nome" [(ngModel)]="nome" required maxlength="100"
                   autocomplete="name" placeholder="Seu nome">
          </div>
          <div class="campo">
            <label for="email">E-mail</label>
            <input id="email" class="input" type="email" name="email" [(ngModel)]="email" required email
                   autocomplete="email" placeholder="voce@email.com">
          </div>
          <div class="linha">
            <div class="campo">
              <label for="senha">Senha</label>
              <input id="senha" class="input" type="password" name="senha" [(ngModel)]="senha" required
                     minlength="6" autocomplete="new-password" placeholder="mín. 6 caracteres">
            </div>
            <div class="campo">
              <label for="confirma">Confirmar senha</label>
              <input id="confirma" class="input" type="password" name="confirma" [(ngModel)]="confirma"
                     required autocomplete="new-password">
            </div>
          </div>

          <button class="btn" type="submit" [disabled]="carregando() || form.invalid">
            {{ carregando() ? 'Criando...' : 'Criar conta' }}
          </button>
          <p class="troca">Já tem conta? <a routerLink="/login">Entrar</a></p>
        </form>
      </div>
    </div>
  `,
})
export class RegistroComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  nome = '';
  email = '';
  senha = '';
  confirma = '';
  carregando = signal(false);
  erro = signal('');

  cadastrar(): void {
    if (this.senha !== this.confirma) {
      this.erro.set('As senhas não conferem.');
      return;
    }
    this.carregando.set(true);
    this.erro.set('');
    this.auth.registrar(this.nome, this.email, this.senha).subscribe({
      next: () => this.router.navigate(['/quadro']),
      error: (e) => {
        this.erro.set(mensagemDeErro(e));
        this.carregando.set(false);
      },
    });
  }
}
