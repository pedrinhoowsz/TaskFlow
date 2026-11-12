package br.com.taskflow.service;

import br.com.taskflow.dto.DashboardResponse;
import br.com.taskflow.dto.DashboardResponse.ConclusaoDia;
import br.com.taskflow.dto.DashboardResponse.ProjetoResumo;
import br.com.taskflow.dto.TarefaResponse;
import br.com.taskflow.model.Prioridade;
import br.com.taskflow.model.Projeto;
import br.com.taskflow.model.StatusTarefa;
import br.com.taskflow.model.Tarefa;
import br.com.taskflow.repository.TarefaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private final TarefaRepository tarefaRepository;

    public DashboardService(TarefaRepository tarefaRepository) {
        this.tarefaRepository = tarefaRepository;
    }

    @Transactional(readOnly = true)
    public DashboardResponse gerar(Long usuarioId) {
        List<Tarefa> tarefas = tarefaRepository.listarDoUsuario(usuarioId);
        LocalDate hoje = LocalDate.now();

        long total = tarefas.size();
        long pendentes = contar(tarefas, StatusTarefa.PENDENTE);
        long emAndamento = contar(tarefas, StatusTarefa.EM_ANDAMENTO);
        long concluidas = contar(tarefas, StatusTarefa.CONCLUIDA);
        long atrasadas = tarefas.stream().filter(Tarefa::isAtrasada).count();

        List<Tarefa> abertas = tarefas.stream().filter(t -> t.getStatus() != StatusTarefa.CONCLUIDA).toList();
        long venceHoje = abertas.stream().filter(t -> hoje.equals(t.getPrazo())).count();
        // Mesma regra do filtro "Próximos 7 dias" do quadro (inclui hoje)
        long proximos7Dias = abertas.stream().filter(Tarefa::venceNosProximos7Dias).count();

        int percentual = total == 0 ? 0 : (int) Math.round(concluidas * 100.0 / total);

        // Quantidade de tarefas por prioridade (mantém a ordem BAIXA -> URGENTE)
        Map<String, Long> porPrioridade = new LinkedHashMap<>();
        for (Prioridade p : Prioridade.values()) {
            porPrioridade.put(p.name(), tarefas.stream().filter(t -> t.getPrioridade() == p).count());
        }

        // Resumo por projeto
        Map<Projeto, List<Tarefa>> agrupado = tarefas.stream()
                .filter(t -> t.getProjeto() != null)
                .collect(Collectors.groupingBy(Tarefa::getProjeto, LinkedHashMap::new, Collectors.toList()));
        List<ProjetoResumo> porProjeto = agrupado.entrySet().stream()
                .map(e -> new ProjetoResumo(e.getKey().getId(), e.getKey().getNome(), e.getKey().getCor(),
                        e.getValue().size(), contar(e.getValue(), StatusTarefa.CONCLUIDA)))
                .sorted(Comparator.comparingLong(ProjetoResumo::total).reversed())
                .toList();

        // Próximas 5 tarefas abertas com prazo (inclui atrasadas)
        List<TarefaResponse> proximosPrazos = abertas.stream()
                .filter(t -> t.getPrazo() != null)
                .sorted(Comparator.comparing(Tarefa::getPrazo))
                .limit(5)
                .map(TarefaResponse::de)
                .toList();

        // Tarefas concluídas em cada um dos últimos 7 dias
        List<ConclusaoDia> ultimos7 = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate dia = hoje.minusDays(i);
            long qtd = tarefas.stream()
                    .filter(t -> t.getConcluidaEm() != null && t.getConcluidaEm().toLocalDate().equals(dia))
                    .count();
            ultimos7.add(new ConclusaoDia(dia.toString(), qtd));
        }

        return new DashboardResponse(total, pendentes, emAndamento, concluidas, atrasadas,
                venceHoje, proximos7Dias, percentual, porPrioridade, porProjeto, proximosPrazos, ultimos7);
    }

    private static long contar(List<Tarefa> tarefas, StatusTarefa status) {
        return tarefas.stream().filter(t -> t.getStatus() == status).count();
    }
}
