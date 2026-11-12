export type StatusTarefa = 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDA';
export type Prioridade = 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';

export interface Usuario {
  id: number;
  nome: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  usuario: Usuario;
}

export interface Projeto {
  id: number;
  nome: string;
  descricao: string | null;
  cor: string;
  totalTarefas: number;
}

export interface ProjetoRequest {
  nome: string;
  descricao: string | null;
  cor: string;
}

export interface Tarefa {
  id: number;
  titulo: string;
  descricao: string | null;
  status: StatusTarefa;
  prioridade: Prioridade;
  prazo: string | null; // "yyyy-MM-dd"
  atrasada: boolean;
  projetoId: number | null;
  projetoNome: string | null;
  projetoCor: string | null;
  criadaEm: string;
  atualizadaEm: string;
  concluidaEm: string | null;
}

export interface TarefaRequest {
  titulo: string;
  descricao: string | null;
  status: StatusTarefa;
  prioridade: Prioridade;
  prazo: string | null;
  projetoId: number | null;
}

export interface FiltroTarefas {
  busca?: string;
  status?: StatusTarefa | '';
  prioridade?: Prioridade | '';
  projetoId?: number | '' | null;
  prazo?: '' | 'atrasadas' | 'hoje' | 'semana' | 'sem-prazo';
  ordenar?: '' | 'prazo' | 'prioridade' | 'recentes';
}

export interface Dashboard {
  total: number;
  pendentes: number;
  emAndamento: number;
  concluidas: number;
  atrasadas: number;
  venceHoje: number;
  proximos7Dias: number;
  percentualConcluido: number;
  porPrioridade: Record<Prioridade, number>;
  porProjeto: { id: number; nome: string; cor: string; total: number; concluidas: number }[];
  proximosPrazos: Tarefa[];
  concluidasUltimos7Dias: { data: string; quantidade: number }[];
}

/** Textos exibidos na tela para cada valor dos enums. */
export const STATUS_LABEL: Record<StatusTarefa, string> = {
  PENDENTE: 'Pendente',
  EM_ANDAMENTO: 'Em andamento',
  CONCLUIDA: 'Concluída',
};

export const PRIORIDADE_LABEL: Record<Prioridade, string> = {
  BAIXA: 'Baixa',
  MEDIA: 'Média',
  ALTA: 'Alta',
  URGENTE: 'Urgente',
};

export const STATUS_LISTA: StatusTarefa[] = ['PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA'];
export const PRIORIDADE_LISTA: Prioridade[] = ['URGENTE', 'ALTA', 'MEDIA', 'BAIXA'];
