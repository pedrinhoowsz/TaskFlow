import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDrag, CdkDragDrop, CdkDragPlaceholder, CdkDropList, CdkDropListGroup } from '@angular/cdk/drag-drop';
import { Subject, Subscription, debounceTime } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { TarefaService } from '../../core/tarefa.service';
import { ProjetoService } from '../../core/projeto.service';
import { mensagemDeErro } from '../../core/erro';
import { dataLocalHoje } from '../../core/datas';
import { TarefaFormComponent } from '../../components/tarefa-form/tarefa-form.component';
import {
  FiltroTarefas, PRIORIDADE_LABEL, PRIORIDADE_LISTA, Projeto, STATUS_LABEL, STATUS_LISTA,
  StatusTarefa, Tarefa,
} from '../../core/models';

@Component({
  selector: 'app-quadro',
  imports: [FormsModule, DatePipe, CdkDropListGroup, CdkDropList, CdkDrag, CdkDragPlaceholder, TarefaFormComponent],
  templateUrl: './quadro.component.html',
  styleUrl: './quadro.component.css',
})
export class QuadroComponent implements OnInit {
  private tarefaService = inject(TarefaService);
  private projetoService = inject(ProjetoService);

  readonly colunas = STATUS_LISTA;
  readonly statusLabel = STATUS_LABEL;
  readonly prioridadeLista = PRIORIDADE_LISTA;
  readonly prioridadeLabel = PRIORIDADE_LABEL;
  readonly hoje = dataLocalHoje();

  tarefas = signal<Tarefa[]>([]);
  projetos = signal<Projeto[]>([]);
  carregando = signal(true);
  erro = signal('');

  filtro: FiltroTarefas = { busca: '', status: '', prioridade: '', projetoId: '', prazo: '', ordenar: '' };

  // Modal
  modalAberto = signal(false);
  tarefaEditando = signal<Tarefa | null>(null);
  statusNovo = signal<StatusTarefa>('PENDENTE');

  // Separa as tarefas por coluna (recalcula sozinho quando "tarefas" muda)
  porColuna = computed(() => {
    const mapa: Record<StatusTarefa, Tarefa[]> = { PENDENTE: [], EM_ANDAMENTO: [], CONCLUIDA: [] };
    for (const t of this.tarefas()) mapa[t.status].push(t);
    return mapa;
  });

  // Espera o usuário parar de digitar antes de buscar
  private busca$ = new Subject<void>();

  constructor() {
    this.busca$.pipe(debounceTime(300), takeUntilDestroyed()).subscribe(() => this.carregar());
  }

  ngOnInit(): void {
    this.projetoService.listar().subscribe((p) => this.projetos.set(p));
    this.carregar();
  }

  // Busca em andamento: é cancelada se outra começar, para uma resposta
  // antiga (filtro anterior) não sobrescrever a mais nova
  private carregamento?: Subscription;

  carregar(): void {
    this.erro.set('');
    // O status é filtrado aqui na tela (escondendo colunas), não na API
    const { status: _status, ...resto } = this.filtro;
    this.carregamento?.unsubscribe();
    this.carregamento = this.tarefaService.listar(resto).subscribe({
      next: (t) => {
        this.tarefas.set(t);
        this.carregando.set(false);
      },
      error: (e) => {
        this.erro.set(mensagemDeErro(e));
        this.carregando.set(false);
      },
    });
  }

  temFiltro(): boolean {
    return Object.values(this.filtro).some((v) => v !== '' && v !== null && v !== undefined);
  }

  digitouBusca(): void {
    this.busca$.next();
  }

  limparFiltros(): void {
    this.filtro = { busca: '', status: '', prioridade: '', projetoId: '', prazo: '', ordenar: '' };
    this.carregar();
  }

  colunaVisivel(s: StatusTarefa): boolean {
    return !this.filtro.status || this.filtro.status === s;
  }

  /** Arrastou um cartão para outra coluna: muda o status na API. */
  soltar(evento: CdkDragDrop<StatusTarefa>): void {
    const tarefa: Tarefa = evento.item.data;
    const novoStatus = evento.container.data;
    if (tarefa.status === novoStatus) return;

    // Atualiza a tela na hora (otimista) e desfaz se a API der erro
    const anterior = tarefa.status;
    this.trocarStatusLocal(tarefa.id, novoStatus);
    this.tarefaService.alterarStatus(tarefa.id, novoStatus).subscribe({
      next: (atualizada) => this.tarefas.update((lista) => lista.map((t) => (t.id === atualizada.id ? atualizada : t))),
      error: (e) => {
        this.trocarStatusLocal(tarefa.id, anterior);
        this.erro.set(mensagemDeErro(e));
      },
    });
  }

  private trocarStatusLocal(id: number, status: StatusTarefa): void {
    this.tarefas.update((lista) => lista.map((t) => (t.id === id ? { ...t, status } : t)));
  }

  novaTarefa(status: StatusTarefa = 'PENDENTE'): void {
    this.tarefaEditando.set(null);
    this.statusNovo.set(status);
    this.modalAberto.set(true);
  }

  editar(t: Tarefa): void {
    this.tarefaEditando.set(t);
    this.modalAberto.set(true);
  }

  aoSalvar(): void {
    this.modalAberto.set(false);
    this.carregar();
    this.projetoService.listar().subscribe((p) => this.projetos.set(p));
  }

  venceHoje(t: Tarefa): boolean {
    return t.prazo === this.hoje && t.status !== 'CONCLUIDA';
  }
}
