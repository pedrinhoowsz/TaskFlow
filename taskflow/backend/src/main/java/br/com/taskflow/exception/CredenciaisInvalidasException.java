package br.com.taskflow.exception;

/** E-mail ou senha incorretos. Vira HTTP 401. */
public class CredenciaisInvalidasException extends RuntimeException {
    public CredenciaisInvalidasException() {
        super("E-mail ou senha inválidos");
    }
}
