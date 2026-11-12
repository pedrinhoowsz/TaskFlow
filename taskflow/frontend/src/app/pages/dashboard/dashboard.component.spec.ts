import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { LOCALE_ID, signal } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { DashboardComponent } from './dashboard.component';
import { DashboardService } from '../../core/dashboard.service';
import { AuthService } from '../../core/auth.service';
import { Dashboard } from '../../core/models';
import { texto, todos } from '../../../testing/dom';
import { USUARIO, umDashboard } from '../../../testing/fabricas';

registerLocaleData(localePt);

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let comp: DashboardComponent;
  let service: jasmine.SpyObj<DashboardService>;

  async function montar(resposta: Dashboard | 'erro') {
    service = jasmine.createSpyObj<DashboardService>('DashboardService', ['carregar']);
    service.carregar.and.returnValue(resposta === 'erro'
      ? throwError(() => new HttpErrorResponse({ status: 0 }))
      : of(resposta));
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        { provide: LOCALE_ID, useValue: 'pt-BR' },
        { provide: DashboardService, useValue: service },
        { provide: AuthService, useValue: { usuario: signal(USUARIO) } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(DashboardComponent);
    comp = fixture.componentInstance;
    fixture.detectChanges();
  }

  const cheio = umDashboard({
    total: 10, pendentes: 5, emAndamento: 3, concluidas: 2, atrasadas: 1, venceHoje: 2, percentualConcluido: 20,
    porPrioridade: { BAIXA: 1, MEDIA: 4, ALTA: 3, URGENTE: 2 },
    concluidasUltimos7Dias: [{ data: '2026-11-12', quantidade: 2 }, { data: '2026-11-11', quantidade: 0 }],
  });

  it('cumprimenta pelo primeiro nome', async () => {
    await montar(cheio);
    expect(texto(fixture, 'h1')).toBe('Olá, Pedro');
  });

  it('mostra os números principais', async () => {
    await montar(cheio);
    const kpis = todos(fixture, '.kpi strong').map((k) => k.textContent!.trim());
    expect(kpis).toEqual(['10', '5', '3', '2', '1', '2']);
    expect(texto(fixture, '.rosca-centro strong')).toBe('20%');
  });

  it('destaca o cartão de atrasadas só quando há atrasadas', async () => {
    await montar(cheio);
    expect(todos(fixture, '.alerta-kpi').length).toBe(1);
  });

  it('monta o gráfico de rosca proporcional aos status', async () => {
    await montar(cheio);
    // pendentes 50%, em andamento até 80%, concluídas até 100%
    expect(comp.rosca()).toBe('conic-gradient(var(--ink-3) 0 50%, var(--accent) 50% 80%, var(--ok) 80% 100%)');
  });

  it('com zero tarefas não divide por zero', async () => {
    await montar(umDashboard());
    expect(comp.rosca()).toBe('conic-gradient(var(--line) 0 100%)');
    expect(comp.maxPrioridade()).toBe(1);
    expect(comp.maxDia()).toBe(1);
    expect(comp.percentual(0, 0)).toBe(0);
  });

  it('calcula os máximos usados nas barras', async () => {
    await montar(cheio);
    expect(comp.maxPrioridade()).toBe(4);
    expect(comp.maxDia()).toBe(2);
    expect(comp.percentual(1, 3)).toBe(33);
  });

  it('mostra o erro quando a API falha', async () => {
    await montar('erro');
    expect(texto(fixture, '.alerta-erro')).toContain('Não foi possível conectar ao servidor');
    expect(todos(fixture, '.kpi').length).toBe(0);
  });
});
