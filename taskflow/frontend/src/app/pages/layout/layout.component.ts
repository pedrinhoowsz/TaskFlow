import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth.service';

/** Estrutura das páginas internas: menu lateral + conteúdo. */
@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css',
})
export class LayoutComponent {
  auth = inject(AuthService);
  menuAberto = signal(false);

  iniciais = computed(() => {
    const nome = this.auth.usuario()?.nome ?? '';
    return nome
      .split(' ')
      .filter((p) => p)
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join('');
  });
}
