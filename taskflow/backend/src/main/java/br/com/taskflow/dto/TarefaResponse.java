package br.com.taskflow.dto;

import br.com.taskflow.model.Prioridade;
import br.com.taskflow.model.StatusTarefa;
import br.com.taskflow.model.Tarefa;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record TarefaResponse(
        Long id,
        String titulo,
        String descricao,
        StatusTarefa status,
        Prioridade prioridade,
        LocalDate prazo,
        boolean atrasada,
        Long projetoId,
        String projetoNome,
        String projetoCor,
        LocalDateTime criadaEm,
        LocalDateTime atualizadaEm,
        LocalDateTime concluidaEm
) {
    public static TarefaResponse de(Tarefa t) {
        var p = t.getProjeto();
        return new TarefaResponse(
                t.getId(), t.getTitulo(), t.getDescricao(), t.getStatus(), t.getPrioridade(),
                t.getPrazo(), t.isAtrasada(),
                p != null ? p.getId() : null,
                p != null ? p.getNome() : null,
                p != null ? p.getCor() : null,
                t.getCriadaEm(), t.getAtualizadaEm(), t.getConcluidaEm());
    }
}
