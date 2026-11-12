package br.com.taskflow.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ProjetoRequest(
        @NotBlank(message = "Informe o nome do projeto") @Size(max = 100) String nome,
        @Size(max = 500) String descricao,
        @Pattern(regexp = "^(#[0-9a-fA-F]{6})?$", message = "Cor deve estar no formato #RRGGBB") String cor
) {}
