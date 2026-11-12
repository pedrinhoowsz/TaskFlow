import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from './api.config';
import { Dashboard } from './models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);

  carregar(): Observable<Dashboard> {
    return this.http.get<Dashboard>(`${API_URL}/dashboard`);
  }
}
