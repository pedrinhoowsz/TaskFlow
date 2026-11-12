import { Dashboard, Projeto, Tarefa } from '../app/core/models';

/** Dados de exemplo usados nos testes. */

export function umaTarefa(dados: Partial<Tarefa> = {}): Tarefa {
  return {
    id: 1,
    titulo: 'Estudar Angular',
    descricao: null,
    status: 'PENDENTE',
    prioridade: 'MEDIA',
    prazo: null,
    atrasada: false,
    projetoId: null,
    projetoNome: null,
    projetoCor: null,
    criadaEm: '2026-01-01T10:00:00',
    atualizadaEm: '2026-01-01T10:00:00',
    concluidaEm: null,
    ...dados,
  };
}

export function umProjeto(dados: Partial<Projeto> = {}): Projeto {
  return { id: 1, nome: 'Faculdade', descricao: null, cor: '#2d5bff', totalTarefas: 0, ...dados };
}

export function umDashboard(dados: Partial<Dashboard> = {}): Dashboard {
  return {
    total: 0,
    pendentes: 0,
    emAndamento: 0,
    concluidas: 0,
    atrasadas: 0,
    venceHoje: 0,
    proximos7Dias: 0,
    percentualConcluido: 0,
    porPrioridade: { BAIXA: 0, MEDIA: 0, ALTA: 0, URGENTE: 0 },
    porProjeto: [],
    proximosPrazos: [],
    concluidasUltimos7Dias: [],
    ...dados,
  };
}

export const USUARIO = { id: 7, nome: 'Pedro Santos', email: 'pedro@teste.com' };
