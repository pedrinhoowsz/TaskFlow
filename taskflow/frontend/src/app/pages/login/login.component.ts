import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { mensagemDeErro } from '../../core/erro';
import { AuthHeroComponent } from './auth-hero.component';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink, AuthHeroComponent],
  template: `
    <div class="auth-page">
      <app-auth-hero />
      <div class="auth-form-wrap">
        <form class="auth-form" (ngSubmit)="entrar()" #form="ngForm">
          <h2>Bem-vindo de volta</h2>
          <p class="sub">Entre para ver seus quadros e tarefas.</p>

          @if (erro()) {
            <div class="alerta alerta-erro">{{ erro() }}</div>
          }

          <div class="campo">
            <label for="email">E-mail</label>
            <input id="email" class="input" type="email" name="email" [(ngModel)]="email"
                   required autocomplete="email" placeholder="voce@email.com">
          </div>
          <div class="campo">
            <label for="senha">Senha</label>
            <input id="senha" class="input" type="password" name="senha" [(ngModel)]="senha"
                   required autocomplete="current-password" placeholder="••••••">
          </div>

          <button class="btn" type="submit" [disabled]="carregando() || form.invalid">
            {{ carregando() ? 'Entrando...' : 'Entrar' }}
          </button>
          <p class="troca">Ainda não tem conta? <a routerLink="/registro">Criar conta</a></p>
        </form>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = '';
  senha = '';
  carregando = signal(false);
  erro = signal('');

  entrar(): void {
    this.carregando.set(true);
    this.erro.set('');
    this.auth.login(this.email, this.senha).subscribe({
      next: () => this.router.navigate(['/quadro']),
      error: (e) => {
        this.erro.set(mensagemDeErro(e));
        this.carregando.set(false);
      },
    });
  }
}
