import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_URL } from './api.config';
import { TarefaService } from './tarefa.service';
import { ProjetoService } from './projeto.service';
import { DashboardService } from './dashboard.service';
import { TarefaRequest } from './models';

describe('services da API', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  describe('TarefaService', () => {
    let service: TarefaService;
    const corpo: TarefaRequest = {
      titulo: 'x', descricao: null, status: 'PENDENTE', prioridade: 'ALTA', prazo: '2026-12-01', projetoId: 3,
    };

    beforeEach(() => (service = TestBed.inject(TarefaService)));

    it('listar sem filtros não manda parâmetros', () => {
      service.listar().subscribe();
      const req = http.expectOne((r) => r.url === `${API_URL}/tarefas`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.keys()).toEqual([]);
      req.flush([]);
    });

    it('listar só manda os filtros preenchidos', () => {
      service.listar({ busca: 'relatório', status: '', prioridade: 'ALTA', projetoId: null, prazo: 'semana', ordenar: '' }).subscribe();
      const req = http.expectOne((r) => r.url === `${API_URL}/tarefas`);
      expect(req.request.params.keys().sort()).toEqual(['busca', 'prazo', 'prioridade']);
      expect(req.request.params.get('busca')).toBe('relatório');
      expect(req.request.params.get('prioridade')).toBe('ALTA');
      expect(req.request.params.get('prazo')).toBe('semana');
      req.flush([]);
    });

    it('listar manda projetoId=0 ("sem projeto"), que não é um filtro vazio', () => {
      service.listar({ projetoId: 0 }).subscribe();
      const req = http.expectOne((r) => r.url === `${API_URL}/tarefas`);
      expect(req.request.params.get('projetoId')).toBe('0');
      req.flush([]);
    });

    it('criar, atualizar, alterar status e excluir usam o método e a URL certos', () => {
      service.criar(corpo).subscribe();
      let req = http.expectOne(`${API_URL}/tarefas`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(corpo);
      req.flush({});

      service.atualizar(5, corpo).subscribe();
      req = http.expectOne(`${API_URL}/tarefas/5`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(corpo);
      req.flush({});

      service.alterarStatus(5, 'CONCLUIDA').subscribe();
      req = http.expectOne(`${API_URL}/tarefas/5/status`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ status: 'CONCLUIDA' });
      req.flush({});

      service.excluir(5).subscribe();
      req = http.expectOne(`${API_URL}/tarefas/5`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('ProjetoService', () => {
    it('faz o CRUD em /projetos', () => {
      const service = TestBed.inject(ProjetoService);
      const dados = { nome: 'Casa', descricao: null, cor: '#ff0000' };

      service.listar().subscribe();
      expect(http.expectOne(`${API_URL}/projetos`).request.method).toBe('GET');

      service.criar(dados).subscribe();
      const post = http.expectOne((r) => r.method === 'POST' && r.url === `${API_URL}/projetos`);
      expect(post.request.body).toEqual(dados);

      service.atualizar(2, dados).subscribe();
      expect(http.expectOne(`${API_URL}/projetos/2`).request.method).toBe('PUT');

      service.excluir(2).subscribe();
      expect(http.expectOne((r) => r.method === 'DELETE' && r.url === `${API_URL}/projetos/2`)).toBeTruthy();
    });
  });

  describe('DashboardService', () => {
    it('busca as estatísticas em /dashboard', () => {
      TestBed.inject(DashboardService).carregar().subscribe();
      expect(http.expectOne(`${API_URL}/dashboard`).request.method).toBe('GET');
    });
  });
});
