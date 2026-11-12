package br.com.taskflow.dto;

import br.com.taskflow.model.StatusTarefa;
import jakarta.validation.constraints.NotNull;

/** Usado para mover a tarefa de coluna no quadro (arrastar e soltar). */
public record StatusRequest(@NotNull(message = "Informe o status") StatusTarefa status) {}
