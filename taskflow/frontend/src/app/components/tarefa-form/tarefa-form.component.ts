import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TarefaService } from '../../core/tarefa.service';
import { mensagemDeErro } from '../../core/erro';
import {
  PRIORIDADE_LABEL, PRIORIDADE_LISTA, Projeto, STATUS_LABEL, STATUS_LISTA,
  StatusTarefa, Tarefa, TarefaRequest,
} from '../../core/models';

/** Janela (modal) para criar ou editar uma tarefa. */
@Component({
  selector: 'app-tarefa-form',
  imports: [FormsModule],
  templateUrl: './tarefa-form.component.html',
  styleUrl: './tarefa-form.component.css',
})
export class TarefaFormComponent implements OnInit {
  private tarefaService = inject(TarefaService);

  // Entradas: tarefa a editar (null = nova) e lista de projetos
  tarefa = input<Tarefa | null>(null);
  projetos = input<Projeto[]>([]);
  statusInicial = input<StatusTarefa>('PENDENTE');

  // Saídas: avisa o quadro quando salvar/excluir/fechar
  salvo = output<void>();
  fechar = output<void>();

  readonly statusLista = STATUS_LISTA;
  readonly statusLabel = STATUS_LABEL;
  readonly prioridadeLista = PRIORIDADE_LISTA;
  readonly prioridadeLabel = PRIORIDADE_LABEL;

  dados: TarefaRequest = {
    titulo: '', descricao: '', status: 'PENDENTE', prioridade: 'MEDIA', prazo: null, projetoId: null,
  };
  salvando = signal(false);
  confirmandoExclusao = signal(false);
  erro = signal('');

  ngOnInit(): void {
    const t = this.tarefa();
    if (t) {
      this.dados = {
        titulo: t.titulo,
        descricao: t.descricao ?? '',
        status: t.status,
        prioridade: t.prioridade,
        prazo: t.prazo,
        projetoId: t.projetoId,
      };
    } else {
      this.dados.status = this.statusInicial();
    }
  }

  salvar(): void {
    this.salvando.set(true);
    this.erro.set('');
    const corpo: TarefaRequest = { ...this.dados, prazo: this.dados.prazo || null };
    const t = this.tarefa();
    const req = t ? this.tarefaService.atualizar(t.id, corpo) : this.tarefaService.criar(corpo);
    req.subscribe({
      next: () => this.salvo.emit(),
      error: (e) => {
        this.erro.set(mensagemDeErro(e));
        this.salvando.set(false);
      },
    });
  }

  excluir(): void {
    const t = this.tarefa();
    if (!t) return;
    this.salvando.set(true);
    this.tarefaService.excluir(t.id).subscribe({
      next: () => this.salvo.emit(),
      error: (e) => {
        this.erro.set(mensagemDeErro(e));
        this.salvando.set(false);
      },
    });
  }
}
