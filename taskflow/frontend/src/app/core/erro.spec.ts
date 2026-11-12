import { HttpErrorResponse } from '@angular/common/http';
import { mensagemDeErro } from './erro';

describe('mensagemDeErro', () => {
  it('avisa quando o backend não responde (status 0)', () => {
    const erro = new HttpErrorResponse({ status: 0 });
    expect(mensagemDeErro(erro)).toBe('Não foi possível conectar ao servidor. O backend está rodando?');
  });

  it('usa a mensagem enviada pela API', () => {
    const erro = new HttpErrorResponse({ status: 400, error: { status: 400, mensagem: 'Informe o título' } });
    expect(mensagemDeErro(erro)).toBe('Informe o título');
  });

  it('usa mensagem genérica quando a API não manda corpo', () => {
    expect(mensagemDeErro(new HttpErrorResponse({ status: 500 }))).toBe('Ocorreu um erro inesperado.');
    expect(mensagemDeErro(new HttpErrorResponse({ status: 500, error: 'texto qualquer' }))).toBe('Ocorreu um erro inesperado.');
  });

  it('usa mensagem genérica para erros que não são HTTP', () => {
    expect(mensagemDeErro(new Error('boom'))).toBe('Ocorreu um erro inesperado.');
    expect(mensagemDeErro(undefined)).toBe('Ocorreu um erro inesperado.');
  });
});
