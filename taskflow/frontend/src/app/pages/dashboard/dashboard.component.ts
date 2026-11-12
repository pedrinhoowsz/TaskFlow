import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../../core/dashboard.service';
import { AuthService } from '../../core/auth.service';
import { mensagemDeErro } from '../../core/erro';
import { Dashboard, PRIORIDADE_LABEL, PRIORIDADE_LISTA, STATUS_LABEL } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  imports: [DatePipe, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  auth = inject(AuthService);

  readonly prioridadeLista = PRIORIDADE_LISTA;
  readonly prioridadeLabel = PRIORIDADE_LABEL;
  readonly statusLabel = STATUS_LABEL;

  dados = signal<Dashboard | null>(null);
  erro = signal('');

  primeiroNome = computed(() => (this.auth.usuario()?.nome ?? '').split(' ')[0]);

  /** Gráfico de rosca feito só com CSS (conic-gradient). */
  rosca = computed(() => {
    const d = this.dados();
    if (!d || d.total === 0) return 'conic-gradient(var(--line) 0 100%)';
    const p1 = (d.pendentes / d.total) * 100;
    const p2 = p1 + (d.emAndamento / d.total) * 100;
    return `conic-gradient(var(--ink-3) 0 ${p1}%, var(--accent) ${p1}% ${p2}%, var(--ok) ${p2}% 100%)`;
  });

  maxPrioridade = computed(() => Math.max(1, ...Object.values(this.dados()?.porPrioridade ?? {})));
  maxDia = computed(() => Math.max(1, ...(this.dados()?.concluidasUltimos7Dias ?? []).map((d) => d.quantidade)));

  ngOnInit(): void {
    this.dashboardService.carregar().subscribe({
      next: (d) => this.dados.set(d),
      error: (e) => this.erro.set(mensagemDeErro(e)),
    });
  }

  percentual(parte: number, total: number): number {
    return total === 0 ? 0 : Math.round((parte / total) * 100);
  }
}
