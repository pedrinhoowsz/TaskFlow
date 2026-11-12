package br.com.taskflow.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Transforma as exceções em respostas JSON padronizadas:
 * { "status": 400, "mensagem": "...", "campos": {...}, "momento": "..." }
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> validacao(MethodArgumentNotValidException ex) {
        Map<String, String> campos = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(e -> campos.putIfAbsent(e.getField(), e.getDefaultMessage()));
        String primeira = campos.values().stream().findFirst().orElse("Dados inválidos");
        return resposta(HttpStatus.BAD_REQUEST, primeira, campos);
    }

    @ExceptionHandler(RegraNegocioException.class)
    public ResponseEntity<Map<String, Object>> regra(RegraNegocioException ex) {
        return resposta(HttpStatus.BAD_REQUEST, ex.getMessage(), null);
    }

    @ExceptionHandler(NaoEncontradoException.class)
    public ResponseEntity<Map<String, Object>> naoEncontrado(NaoEncontradoException ex) {
        return resposta(HttpStatus.NOT_FOUND, ex.getMessage(), null);
    }

    @ExceptionHandler(CredenciaisInvalidasException.class)
    public ResponseEntity<Map<String, Object>> credenciais(CredenciaisInvalidasException ex) {
        return resposta(HttpStatus.UNAUTHORIZED, ex.getMessage(), null);
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class})
    public ResponseEntity<Map<String, Object>> formato(Exception ex) {
        return resposta(HttpStatus.BAD_REQUEST, "Formato de dados inválido", null);
    }

    private ResponseEntity<Map<String, Object>> resposta(HttpStatus status, String mensagem, Map<String, String> campos) {
        Map<String, Object> corpo = new LinkedHashMap<>();
        corpo.put("status", status.value());
        corpo.put("mensagem", mensagem);
        if (campos != null && !campos.isEmpty()) {
            corpo.put("campos", campos);
        }
        corpo.put("momento", LocalDateTime.now().toString());
        return ResponseEntity.status(status).body(corpo);
    }
}
