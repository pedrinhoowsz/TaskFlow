package br.com.taskflow.dto;

import java.util.List;
import java.util.Map;

public record DashboardResponse(
        long total,
        long pendentes,
        long emAndamento,
        long concluidas,
        long atrasadas,
        long venceHoje,
        long proximos7Dias,
        int percentualConcluido,
        Map<String, Long> porPrioridade,
        List<ProjetoResumo> porProjeto,
        List<TarefaResponse> proximosPrazos,
        List<ConclusaoDia> concluidasUltimos7Dias
) {
    public record ProjetoResumo(Long id, String nome, String cor, long total, long concluidas) {}

    public record ConclusaoDia(String data, long quantidade) {}
}
