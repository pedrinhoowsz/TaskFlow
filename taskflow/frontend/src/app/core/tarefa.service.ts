import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from './api.config';
import { FiltroTarefas, StatusTarefa, Tarefa, TarefaRequest } from './models';

@Injectable({ providedIn: 'root' })
export class TarefaService {
  private http = inject(HttpClient);
  private url = `${API_URL}/tarefas`;

  listar(filtro: FiltroTarefas = {}): Observable<Tarefa[]> {
    // Só envia os filtros preenchidos
    let params = new HttpParams();
    Object.entries(filtro).forEach(([chave, valor]) => {
      if (valor !== '' && valor !== null && valor !== undefined) {
        params = params.set(chave, String(valor));
      }
    });
    return this.http.get<Tarefa[]>(this.url, { params });
  }

  criar(dados: TarefaRequest): Observable<Tarefa> {
    return this.http.post<Tarefa>(this.url, dados);
  }

  atualizar(id: number, dados: TarefaRequest): Observable<Tarefa> {
    return this.http.put<Tarefa>(`${this.url}/${id}`, dados);
  }

  alterarStatus(id: number, status: StatusTarefa): Observable<Tarefa> {
    return this.http.patch<Tarefa>(`${this.url}/${id}/status`, { status });
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
