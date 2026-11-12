import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/** Só deixa entrar quem está logado. */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.logado() ? true : inject(Router).createUrlTree(['/login']);
};

/** Login/cadastro: quem já está logado vai direto para o quadro. */
export const visitanteGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.logado() ? inject(Router).createUrlTree(['/quadro']) : true;
};
