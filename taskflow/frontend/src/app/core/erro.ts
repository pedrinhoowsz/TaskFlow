import { HttpErrorResponse } from '@angular/common/http';

/** Extrai uma mensagem amigável de um erro da API. */
export function mensagemDeErro(erro: unknown): string {
  if (erro instanceof HttpErrorResponse) {
    if (erro.status === 0) {
      return 'Não foi possível conectar ao servidor. O backend está rodando?';
    }
    return erro.error?.mensagem ?? 'Ocorreu um erro inesperado.';
  }
  return 'Ocorreu um erro inesperado.';
}
