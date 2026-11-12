package br.com.taskflow.dto;

import br.com.taskflow.model.Prioridade;
import br.com.taskflow.model.StatusTarefa;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record TarefaRequest(
        @NotBlank(message = "Informe o título") @Size(max = 150) String titulo,
        @Size(max = 1000) String descricao,
        StatusTarefa status,
        Prioridade prioridade,
        LocalDate prazo,
        Long projetoId
) {}
