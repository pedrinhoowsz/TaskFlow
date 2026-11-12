import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProjetoService } from '../../core/projeto.service';
import { mensagemDeErro } from '../../core/erro';
import { Projeto, ProjetoRequest } from '../../core/models';

@Component({
  selector: 'app-projetos',
  imports: [FormsModule],
  templateUrl: './projetos.component.html',
  styleUrl: './projetos.component.css',
})
export class ProjetosComponent implements OnInit {
  private projetoService = inject(ProjetoService);

  readonly cores = ['#2d5bff', '#7c3aed', '#db2777', '#d6344a', '#e07a12', '#ca8a04', '#138a52', '#0e7490', '#475569'];

  projetos = signal<Projeto[]>([]);
  erro = signal('');
  salvando = signal(false);
  editandoId = signal<number | null>(null);
  excluindoId = signal<number | null>(null);

  form: ProjetoRequest = this.formVazio();

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.projetoService.listar().subscribe({
      next: (p) => this.projetos.set(p),
      error: (e) => this.erro.set(mensagemDeErro(e)),
    });
  }

  salvar(): void {
    this.salvando.set(true);
    this.erro.set('');
    const id = this.editandoId();
    const req = id ? this.projetoService.atualizar(id, this.form) : this.projetoService.criar(this.form);
    req.subscribe({
      next: () => {
        this.cancelar();
        this.salvando.set(false);
        this.carregar();
      },
      error: (e) => {
        this.erro.set(mensagemDeErro(e));
        this.salvando.set(false);
      },
    });
  }

  editar(p: Projeto): void {
    this.editandoId.set(p.id);
    this.form = { nome: p.nome, descricao: p.descricao, cor: p.cor };
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelar(): void {
    this.editandoId.set(null);
    this.form = this.formVazio();
  }

  excluir(p: Projeto): void {
    this.projetoService.excluir(p.id).subscribe({
      next: () => {
        this.excluindoId.set(null);
        if (this.editandoId() === p.id) this.cancelar();
        this.carregar();
      },
      error: (e) => this.erro.set(mensagemDeErro(e)),
    });
  }

  private formVazio(): ProjetoRequest {
    return { nome: '', descricao: '', cor: '#2d5bff' };
  }
}
