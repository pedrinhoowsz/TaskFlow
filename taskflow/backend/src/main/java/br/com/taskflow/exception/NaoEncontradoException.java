package br.com.taskflow.exception;

/** Registro não encontrado (ou de outro usuário). Vira HTTP 404. */
public class NaoEncontradoException extends RuntimeException {
    public NaoEncontradoException(String mensagem) {
        super(mensagem);
    }
}
