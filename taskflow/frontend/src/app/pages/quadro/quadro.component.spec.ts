import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Subject, of, throwError } from 'rxjs';
import { QuadroComponent } from './quadro.component';
import { TarefaService } from '../../core/tarefa.service';
import { ProjetoService } from '../../core/projeto.service';
import { dataLocalHoje } from '../../core/datas';
import { StatusTarefa, Tarefa } from '../../core/models';
import { botao, existe, texto, todos } from '../../../testing/dom';
import { umProjeto, umaTarefa } from '../../../testing/fabricas';

describe('QuadroComponent', () => {
  let fixture: ComponentFixture<QuadroComponent>;
  let comp: QuadroComponent;
  let tarefas: jasmine.SpyObj<TarefaService>;
  let projetos: jasmine.SpyObj<ProjetoService>;

  const lista: Tarefa[] = [
    umaTarefa({ id: 1, titulo: 'A', status: 'PENDENTE' }),
    umaTarefa({ id: 2, titulo: 'B', status: 'PENDENTE', prioridade: 'URGENTE' }),
    umaTarefa({ id: 3, titulo: 'C', status: 'EM_ANDAMENTO', projetoNome: 'Faculdade', projetoCor: '#ff0000' }),
    umaTarefa({ id: 4, titulo: 'D', status: 'CONCLUIDA' }),
  ];

  beforeEach(async () => {
    tarefas = jasmine.createSpyObj<TarefaService>('TarefaService', ['listar', 'alterarStatus']);
    projetos = jasmine.createSpyObj<ProjetoService>('ProjetoService', ['listar']);
    tarefas.listar.and.returnValue(of(lista));
    projetos.listar.and.returnValue(of([umProjeto()]));

    await TestBed.configureTestingModule({
      imports: [QuadroComponent],
      providers: [
        { provide: TarefaService, useValue: tarefas },
        { provide: ProjetoService, useValue: projetos },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(QuadroComponent);
    comp = fixture.componentInstance;
    fixture.detectChanges();
  });

  function contadores(): string[] {
    return todos(fixture, '.coluna .contador').map((c) => c.textContent!.trim());
  }

  function soltar(tarefa: Tarefa, destino: StatusTarefa) {
    comp.soltar({ item: { data: tarefa }, container: { data: destino } } as unknown as CdkDragDrop<StatusTarefa>);
    fixture.detectChanges();
  }

  it('carrega tarefas e projetos e distribui os cartões nas colunas', () => {
    expect(tarefas.listar).toHaveBeenCalledTimes(1);
    expect(projetos.listar).toHaveBeenCalledTimes(1);
    expect(contadores()).toEqual(['2', '1', '1']);
    expect(todos(fixture, '[data-status="PENDENTE"] .cartao h3').map((h) => h.textContent)).toEqual(['A', 'B']);
    expect(texto(fixture, '[data-status="EM_ANDAMENTO"] .projeto')).toBe('Faculdade');
  });

  it('mostra "Nenhuma tarefa aqui" em colunas vazias', () => {
    tarefas.listar.and.returnValue(of([]));
    comp.carregar();
    fixture.detectChanges();
    expect(todos(fixture, '.coluna-vazia').length).toBe(3);
  });

  it('mostra o erro quando a API falha', () => {
    tarefas.listar.and.returnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
    comp.carregar();
    fixture.detectChanges();
    expect(texto(fixture, '.alerta-erro')).toContain('Não foi possível conectar ao servidor');
  });

  describe('filtros', () => {
    it('o filtro de status esconde colunas na tela, sem mandar para a API', () => {
      comp.filtro.status = 'CONCLUIDA';
      comp.filtro.prioridade = 'ALTA';
      comp.carregar();
      fixture.detectChanges();

      const enviado = tarefas.listar.calls.mostRecent().args[0]!;
      expect(enviado.status).toBeUndefined();
      expect(enviado.prioridade).toBe('ALTA');
      expect(todos(fixture, '.coluna').map((c) => c.getAttribute('data-status'))).toEqual(['CONCLUIDA']);
    });

    it('espera parar de digitar (300 ms) antes de buscar', fakeAsync(() => {
      tarefas.listar.calls.reset();
      comp.digitouBusca();
      tick(100);
      comp.digitouBusca();
      tick(100);
      comp.digitouBusca();
      tick(299);
      expect(tarefas.listar).not.toHaveBeenCalled();
      tick(1);
      expect(tarefas.listar).toHaveBeenCalledTimes(1);
    }));

    it('mostra "Limpar" só com filtro ativo, e limpar recarrega tudo', () => {
      expect(comp.temFiltro()).toBeFalse();
      expect(() => botao(fixture, 'Limpar')).toThrow();

      comp.filtro.prazo = 'atrasadas';
      fixture.detectChanges();
      expect(comp.temFiltro()).toBeTrue();

      tarefas.listar.calls.reset();
      botao(fixture, 'Limpar').click();
      expect(comp.temFiltro()).toBeFalse();
      expect(tarefas.listar).toHaveBeenCalledTimes(1);
    });

    it('uma resposta antiga que chega atrasada não sobrescreve o filtro mais novo', () => {
      // Ex.: digitou na busca e logo depois trocou a prioridade; a 1ª busca é mais lenta
      const primeira = new Subject<Tarefa[]>();
      const segunda = new Subject<Tarefa[]>();
      tarefas.listar.and.returnValues(primeira, segunda);

      comp.filtro.busca = 'relatório';
      comp.carregar();
      comp.filtro.prioridade = 'URGENTE';
      comp.carregar();

      segunda.next([umaTarefa({ id: 2, titulo: 'B', prioridade: 'URGENTE' })]);
      primeira.next(lista); // chega depois, com o filtro antigo
      fixture.detectChanges();

      expect(comp.tarefas().map((t) => t.id)).toEqual([2]);
    });

    it('"Sem projeto" (projetoId = 0) conta como filtro ativo', () => {
      comp.filtro.projetoId = 0;
      expect(comp.temFiltro()).toBeTrue();
    });
  });

  describe('arrastar e soltar', () => {
    it('soltar na mesma coluna não chama a API', () => {
      soltar(lista[0], 'PENDENTE');
      expect(tarefas.alterarStatus).not.toHaveBeenCalled();
    });

    it('move o cartão na hora e depois usa a resposta da API', () => {
      const resposta = new Subject<Tarefa>();
      tarefas.alterarStatus.and.returnValue(resposta);

      soltar(lista[0], 'CONCLUIDA');
      expect(tarefas.alterarStatus).toHaveBeenCalledWith(1, 'CONCLUIDA');
      expect(contadores()).toEqual(['1', '1', '2']); // otimista: já mudou antes da API responder

      resposta.next(umaTarefa({ id: 1, titulo: 'A', status: 'CONCLUIDA', concluidaEm: '2026-11-12T10:00:00' }));
      fixture.detectChanges();
      expect(comp.tarefas().find((t) => t.id === 1)!.concluidaEm).toBe('2026-11-12T10:00:00');
    });

    it('desfaz a mudança e mostra o erro se a API falhar', () => {
      tarefas.alterarStatus.and.returnValue(throwError(() =>
        new HttpErrorResponse({ status: 404, error: { mensagem: 'Tarefa não encontrada' } })));

      soltar(lista[0], 'EM_ANDAMENTO');

      expect(contadores()).toEqual(['2', '1', '1']);
      expect(comp.tarefas().find((t) => t.id === 1)!.status).toBe('PENDENTE');
      expect(texto(fixture, '.alerta-erro')).toBe('Tarefa não encontrada');
    });
  });

  describe('prazos', () => {
    it('destaca as tarefas que vencem hoje (só se não estiverem concluídas)', () => {
      const hoje = dataLocalHoje();
      expect(comp.venceHoje(umaTarefa({ prazo: hoje }))).toBeTrue();
      expect(comp.venceHoje(umaTarefa({ prazo: hoje, status: 'CONCLUIDA' }))).toBeFalse();
      expect(comp.venceHoje(umaTarefa({ prazo: '2000-01-01' }))).toBeFalse();
      expect(comp.venceHoje(umaTarefa({ prazo: null }))).toBeFalse();
    });

    it('mostra a etiqueta "Atrasada" quando a API marca a tarefa como atrasada', () => {
      tarefas.listar.and.returnValue(of([umaTarefa({ prazo: '2020-03-15', atrasada: true })]));
      comp.carregar();
      fixture.detectChanges();
      expect(texto(fixture, '.tag-atrasada')).toContain('Atrasada · 15/03');
    });
  });

  describe('janela de tarefa', () => {
    it('"+ Nova tarefa" abre a janela vazia', () => {
      botao(fixture, '+ Nova tarefa').click();
      fixture.detectChanges();
      expect(existe(fixture, 'app-tarefa-form')).toBeTrue();
      expect(comp.tarefaEditando()).toBeNull();
      expect(comp.statusNovo()).toBe('PENDENTE');
    });

    it('"+ Adicionar tarefa" de uma coluna já escolhe o status dela', () => {
      const botoes = todos(fixture, '.coluna .add');
      botoes[1].click(); // coluna Em andamento
      fixture.detectChanges();
      expect(comp.statusNovo()).toBe('EM_ANDAMENTO');
    });

    it('clicar num cartão abre a janela para editar', () => {
      todos(fixture, '.cartao')[2].click();
      fixture.detectChanges();
      expect(comp.tarefaEditando()?.id).toBe(3);
      expect(existe(fixture, 'app-tarefa-form')).toBeTrue();
    });

    it('depois de salvar, fecha e recarrega tarefas e projetos', () => {
      comp.novaTarefa();
      tarefas.listar.calls.reset();
      projetos.listar.calls.reset();

      comp.aoSalvar();
      fixture.detectChanges();

      expect(existe(fixture, 'app-tarefa-form')).toBeFalse();
      expect(tarefas.listar).toHaveBeenCalledTimes(1);
      expect(projetos.listar).toHaveBeenCalledTimes(1);
    });
  });
});
