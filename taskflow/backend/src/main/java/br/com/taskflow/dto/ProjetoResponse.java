package br.com.taskflow.dto;

import br.com.taskflow.model.Projeto;

public record ProjetoResponse(Long id, String nome, String descricao, String cor, long totalTarefas) {

    public static ProjetoResponse de(Projeto p, long totalTarefas) {
        return new ProjetoResponse(p.getId(), p.getNome(), p.getDescricao(), p.getCor(), totalTarefas);
    }
}
