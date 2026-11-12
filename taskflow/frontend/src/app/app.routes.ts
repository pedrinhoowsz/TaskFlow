import { Routes } from '@angular/router';
import { authGuard, visitanteGuard } from './core/auth.guard';
import { LoginComponent } from './pages/login/login.component';
import { RegistroComponent } from './pages/registro/registro.component';
import { LayoutComponent } from './pages/layout/layout.component';
import { QuadroComponent } from './pages/quadro/quadro.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ProjetosComponent } from './pages/projetos/projetos.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [visitanteGuard], title: 'Entrar · TaskFlow' },
  { path: 'registro', component: RegistroComponent, canActivate: [visitanteGuard], title: 'Criar conta · TaskFlow' },
  {
    // Páginas que exigem login ficam dentro do layout (menu lateral)
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'quadro', component: QuadroComponent, title: 'Quadro · TaskFlow' },
      { path: 'dashboard', component: DashboardComponent, title: 'Dashboard · TaskFlow' },
      { path: 'projetos', component: ProjetosComponent, title: 'Projetos · TaskFlow' },
      { path: '', redirectTo: 'quadro', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '' },
];
