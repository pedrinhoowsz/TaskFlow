import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, of, throwError } from 'rxjs';
import { TarefaFormComponent } from './tarefa-form.component';
import { TarefaService } from '../../core/tarefa.service';
import { Tarefa } from '../../core/models';
import { botao, digitar, el, existe, texto } from '../../../testing/dom';
import { umProjeto, umaTarefa } from '../../../testing/fabricas';

describe('TarefaFormComponent', () => {
  let fixture: ComponentFixture<TarefaFormComponent>;
  let service: jasmine.SpyObj<TarefaService>;
  let salvo: jasmine.Spy;
  let fechar: jasmine.Spy;

  beforeEach(() => {
    service = jasmine.createSpyObj<TarefaService>('TarefaService', ['criar', 'atualizar', 'excluir']);
  });

  async function montar(entradas: { tarefa?: Tarefa | null; statusInicial?: Tarefa['status'] } = {}) {
    await TestBed.configureTestingModule({
      imports: [TarefaFormComponent],
      providers: [{ provide: TarefaService, useValue: service }],
    }).compileComponents();
    fixture = TestBed.createComponent(TarefaFormComponent);
    fixture.componentRef.setInput('projetos', [umProjeto({ id: 3, nome: 'Faculdade' })]);
    if (entradas.tarefa !== undefined) fixture.componentRef.setInput('tarefa', entradas.tarefa);
    if (entradas.statusInicial) fixture.componentRef.setInput('statusInicial', entradas.statusInicial);
    salvo = jasmine.createSpy('salvo');
    fechar = jasmine.createSpy('fechar');
    fixture.componentInstance.salvo.subscribe(salvo);
    fixture.componentInstance.fechar.subscribe(fechar);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function salvar() {
    botao(fixture, 'Salvar').click();
    fixture.detectChanges();
  }

  describe('nova tarefa', () => {
    it('começa no status da coluna onde clicou e sem botão de excluir', async () => {
      await montar({ statusInicial: 'EM_ANDAMENTO' });
      expect(fixture.componentInstance.dados.status).toBe('EM_ANDAMENTO');
      expect(fixture.componentInstance.dados.prioridade).toBe('MEDIA');
      expect(() => botao(fixture, 'Excluir')).toThrow();
    });

    it('não deixa salvar sem título', async () => {
      await montar();
      expect(botao(fixture, 'Salvar').disabled).toBeTrue();
    });

    it('cria a tarefa e envia prazo vazio como null', async () => {
      service.criar.and.returnValue(of(umaTarefa()));
      await montar();
      await digitar(fixture, '#titulo', 'Entregar relatório');
      fixture.componentInstance.dados.prazo = '';
      salvar();

      expect(service.criar).toHaveBeenCalledWith(jasmine.objectContaining({
        titulo: 'Entregar relatório', status: 'PENDENTE', prioridade: 'MEDIA', prazo: null, projetoId: null,
      }));
      expect(service.atualizar).not.toHaveBeenCalled();
      expect(salvo).toHaveBeenCalled();
    });

    it('mostra o erro da API e não fecha', async () => {
      service.criar.and.returnValue(throwError(() =>
        new HttpErrorResponse({ status: 400, error: { mensagem: 'Informe o título' } })));
      await montar();
      await digitar(fixture, '#titulo', 'x');
      salvar();

      expect(texto(fixture, '.alerta-erro')).toBe('Informe o título');
      expect(salvo).not.toHaveBeenCalled();
      expect(botao(fixture, 'Salvar').disabled).toBeFalse();
    });

    it('mostra "Salvando..." enquanto espera a API', async () => {
      service.criar.and.returnValue(new Subject<Tarefa>());
      await montar();
      await digitar(fixture, '#titulo', 'x');
      salvar();
      expect(botao(fixture, 'Salvando...').disabled).toBeTrue();
    });
  });

  describe('editar tarefa', () => {
    const existente = umaTarefa({
      id: 42, titulo: 'Antiga', descricao: null, status: 'CONCLUIDA', prioridade: 'URGENTE',
      prazo: '2026-12-01', projetoId: 3,
    });

    it('preenche o formulário com os dados da tarefa', async () => {
      await montar({ tarefa: existente });
      expect(fixture.componentInstance.dados).toEqual({
        titulo: 'Antiga', descricao: '', status: 'CONCLUIDA', prioridade: 'URGENTE', prazo: '2026-12-01', projetoId: 3,
      });
      expect(el<HTMLInputElement>(fixture, '#titulo').value).toBe('Antiga');
    });

    it('salva com PUT na tarefa certa', async () => {
      service.atualizar.and.returnValue(of(existente));
      await montar({ tarefa: existente });
      await digitar(fixture, '#titulo', 'Nova');
      salvar();
      expect(service.atualizar).toHaveBeenCalledWith(42, jasmine.objectContaining({ titulo: 'Nova', status: 'CONCLUIDA' }));
      expect(service.criar).not.toHaveBeenCalled();
      expect(salvo).toHaveBeenCalled();
    });

    it('pede confirmação antes de excluir', async () => {
      service.excluir.and.returnValue(of(undefined));
      await montar({ tarefa: existente });

      botao(fixture, 'Excluir').click();
      fixture.detectChanges();
      expect(service.excluir).not.toHaveBeenCalled();
      expect(texto(fixture, '.confirma')).toContain('Excluir mesmo?');

      botao(fixture, 'Sim, excluir').click();
      expect(service.excluir).toHaveBeenCalledWith(42);
      expect(salvo).toHaveBeenCalled();
    });

    it('pode desistir de excluir', async () => {
      await montar({ tarefa: existente });
      botao(fixture, 'Excluir').click();
      fixture.detectChanges();
      botao(fixture, 'Não').click();
      fixture.detectChanges();
      expect(existe(fixture, '.confirma')).toBeFalse();
      expect(service.excluir).not.toHaveBeenCalled();
    });
  });

  describe('fechar', () => {
    beforeEach(async () => await montar());

    it('fecha pelo X, pelo Cancelar e clicando fora', () => {
      el(fixture, 'button[aria-label="Fechar"]').click();
      botao(fixture, 'Cancelar').click();
      el(fixture, '.overlay').click();
      expect(fechar).toHaveBeenCalledTimes(3);
    });

    it('clicar dentro da janela não fecha', () => {
      el(fixture, '.modal').click();
      el(fixture, '#titulo').click();
      expect(fechar).not.toHaveBeenCalled();
    });
  });
});
