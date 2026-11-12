import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from './api.config';
import { Projeto, ProjetoRequest } from './models';

@Injectable({ providedIn: 'root' })
export class ProjetoService {
  private http = inject(HttpClient);
  private url = `${API_URL}/projetos`;

  listar(): Observable<Projeto[]> {
    return this.http.get<Projeto[]>(this.url);
  }

  criar(dados: ProjetoRequest): Observable<Projeto> {
    return this.http.post<Projeto>(this.url, dados);
  }

  atualizar(id: number, dados: ProjetoRequest): Observable<Projeto> {
    return this.http.put<Projeto>(`${this.url}/${id}`, dados);
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
