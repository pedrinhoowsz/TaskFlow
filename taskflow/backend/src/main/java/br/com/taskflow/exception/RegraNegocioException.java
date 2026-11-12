package br.com.taskflow.exception;

/** Erro de regra de negócio (ex.: e-mail já cadastrado). Vira HTTP 400. */
public class RegraNegocioException extends RuntimeException {
    public RegraNegocioException(String mensagem) {
        super(mensagem);
    }
}
