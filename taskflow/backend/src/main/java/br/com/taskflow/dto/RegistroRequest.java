package br.com.taskflow.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegistroRequest(
        @NotBlank(message = "Informe o nome") @Size(max = 100, message = "O nome deve ter no máximo 100 caracteres") String nome,
        @NotBlank(message = "Informe o e-mail") @Email(message = "E-mail inválido")
        @Size(max = 150, message = "O e-mail deve ter no máximo 150 caracteres") String email,
        // O BCrypt só aceita senhas de até 72 bytes
        @NotBlank(message = "Informe a senha")
        @Size(min = 6, max = 72, message = "A senha deve ter entre 6 e 72 caracteres") String senha
) {
    public RegistroRequest {
        // Remove espaços antes da validação, para " voce@email.com " ser aceito
        if (email != null) {
            email = email.trim();
        }
    }
}
