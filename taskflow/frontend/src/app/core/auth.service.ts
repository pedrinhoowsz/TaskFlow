import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { API_URL } from './api.config';
import { AuthResponse, Usuario } from './models';

const CHAVE_TOKEN = 'taskflow.token';
const CHAVE_USUARIO = 'taskflow.usuario';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  // Estado do login guardado em "signals" (atualiza a tela automaticamente)
  readonly token = signal<string | null>(localStorage.getItem(CHAVE_TOKEN));
  readonly usuario = signal<Usuario | null>(this.lerUsuarioSalvo());
  readonly logado = computed(() => !!this.token());

  login(email: string, senha: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${API_URL}/auth/login`, { email, senha })
      .pipe(tap((r) => this.salvarSessao(r)));
  }

  registrar(nome: string, email: string, senha: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${API_URL}/auth/registrar`, { nome, email, senha })
      .pipe(tap((r) => this.salvarSessao(r)));
  }

  sair(): void {
    localStorage.removeItem(CHAVE_TOKEN);
    localStorage.removeItem(CHAVE_USUARIO);
    this.token.set(null);
    this.usuario.set(null);
    this.router.navigate(['/login']);
  }

  private salvarSessao(r: AuthResponse): void {
    localStorage.setItem(CHAVE_TOKEN, r.token);
    localStorage.setItem(CHAVE_USUARIO, JSON.stringify(r.usuario));
    this.token.set(r.token);
    this.usuario.set(r.usuario);
  }

  private lerUsuarioSalvo(): Usuario | null {
    try {
      const salvo = localStorage.getItem(CHAVE_USUARIO);
      return salvo ? (JSON.parse(salvo) as Usuario) : null;
    } catch {
      return null;
    }
  }
}
