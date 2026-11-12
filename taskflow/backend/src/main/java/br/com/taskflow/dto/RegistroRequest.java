package br.com.taskflow.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegistroRequest(
        @NotBlank(message = "Informe o nome") @Size(max = 100) String nome,
        @NotBlank(message = "Informe o e-mail") @Email(message = "E-mail inválido") String email,
        @NotBlank(message = "Informe a senha") @Size(min = 6, message = "A senha deve ter pelo menos 6 caracteres") String senha
) {}
