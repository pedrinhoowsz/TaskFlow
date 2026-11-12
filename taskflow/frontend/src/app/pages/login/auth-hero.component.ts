import { Component } from '@angular/core';

/** Lado esquerdo (escuro) das telas de login e cadastro. */
@Component({
  selector: 'app-auth-hero',
  host: { class: 'auth-hero' },
  template: `
    <div class="logo">
      <span class="logo-mark"><svg width="16" height="16" viewBox="0 0 16 16"><rect x="1" y="1" width="6" height="14" rx="2" fill="#fff"/><rect x="9" y="1" width="6" height="9" rx="2" fill="#fff" opacity=".7"/></svg></span>
      TaskFlow
    </div>
    <div>
      <h1>Suas tarefas, do “a fazer” ao “feito”.</h1>
      <p>Organize projetos em quadros, defina prioridades e prazos e acompanhe tudo pelo dashboard.</p>
      <div class="auth-mini-board" aria-hidden="true">
        <div class="auth-mini-col"><span>Pendente</span><div class="auth-mini-card"></div><div class="auth-mini-card"></div><div class="auth-mini-card"></div></div>
        <div class="auth-mini-col"><span>Em andamento</span><div class="auth-mini-card a"></div><div class="auth-mini-card"></div></div>
        <div class="auth-mini-col"><span>Concluída</span><div class="auth-mini-card"></div></div>
      </div>
    </div>
    <small style="color:#6f7594">Projeto acadêmico · Angular + Spring Boot + MySQL</small>
  `,
})
export class AuthHeroComponent {}
