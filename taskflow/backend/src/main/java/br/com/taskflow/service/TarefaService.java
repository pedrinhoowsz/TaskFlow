package br.com.taskflow.service;

import br.com.taskflow.dto.TarefaRequest;
import br.com.taskflow.dto.TarefaResponse;
import br.com.taskflow.exception.NaoEncontradoException;
import br.com.taskflow.model.Prioridade;
import br.com.taskflow.model.StatusTarefa;
import br.com.taskflow.model.Tarefa;
import br.com.taskflow.repository.TarefaRepository;
import br.com.taskflow.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Stream;

@Service
public class TarefaService {

    private final TarefaRepository tarefaRepository;
    private final UsuarioRepository usuarioRepository;
    private final ProjetoService projetoService;

    public TarefaService(TarefaRepository tarefaRepository, UsuarioRepository usuarioRepository,
                         ProjetoService projetoService) {
        this.tarefaRepository = tarefaRepository;
        this.usuarioRepository = usuarioRepository;
        this.projetoService = projetoService;
    }

    /**
     * Lista as tarefas do usuário aplicando os filtros (todos opcionais).
     *
     * @param projetoId id do projeto; use 0 para "tarefas sem projeto"
     * @param prazo     "atrasadas", "hoje", "semana" ou "sem-prazo"
     * @param ordenar   "prazo", "prioridade" ou "recentes" (padrão)
     */
    @Transactional(readOnly = true)
    public List<TarefaResponse> listar(Long usuarioId, StatusTarefa status, Prioridade prioridade,
                                       Long projetoId, String busca, String prazo, String ordenar) {
        Stream<Tarefa> tarefas = tarefaRepository.listarDoUsuario(usuarioId).stream();

        if (status != null) {
            tarefas = tarefas.filter(t -> t.getStatus() == status);
        }
        if (prioridade != null) {
            tarefas = tarefas.filter(t -> t.getPrioridade() == prioridade);
        }
        if (projetoId != null) {
            if (projetoId == 0) {
                tarefas = tarefas.filter(t -> t.getProjeto() == null);
            } else {
                tarefas = tarefas.filter(t -> t.getProjeto() != null && t.getProjeto().getId().equals(projetoId));
            }
        }
        if (busca != null && !busca.isBlank()) {
            String termo = busca.trim().toLowerCase();
            tarefas = tarefas.filter(t -> contem(t.getTitulo(), termo) || contem(t.getDescricao(), termo));
        }
        if (prazo != null && !prazo.isBlank()) {
            tarefas = tarefas.filter(t -> filtrarPorPrazo(t, prazo));
        }

        return tarefas.sorted(comparador(ordenar)).map(TarefaResponse::de).toList();
    }

    @Transactional(readOnly = true)
    public TarefaResponse buscar(Long usuarioId, Long id) {
        return TarefaResponse.de(buscarDoUsuario(usuarioId, id));
    }

    @Transactional
    public TarefaResponse criar(Long usuarioId, TarefaRequest dados) {
        Tarefa tarefa = new Tarefa();
        tarefa.setUsuario(usuarioRepository.getReferenceById(usuarioId));
        preencher(usuarioId, tarefa, dados);
        tarefaRepository.save(tarefa);
        return TarefaResponse.de(tarefa);
    }

    @Transactional
    public TarefaResponse atualizar(Long usuarioId, Long id, TarefaRequest dados) {
        Tarefa tarefa = buscarDoUsuario(usuarioId, id);
        preencher(usuarioId, tarefa, dados);
        tarefaRepository.saveAndFlush(tarefa);
        return TarefaResponse.de(tarefa);
    }

    @Transactional
    public TarefaResponse alterarStatus(Long usuarioId, Long id, StatusTarefa status) {
        Tarefa tarefa = buscarDoUsuario(usuarioId, id);
        tarefa.alterarStatus(status);
        tarefaRepository.saveAndFlush(tarefa);
        return TarefaResponse.de(tarefa);
    }

    @Transactional
    public void excluir(Long usuarioId, Long id) {
        tarefaRepository.delete(buscarDoUsuario(usuarioId, id));
    }

    private Tarefa buscarDoUsuario(Long usuarioId, Long id) {
        return tarefaRepository.findByIdAndUsuarioId(id, usuarioId)
                .orElseThrow(() -> new NaoEncontradoException("Tarefa não encontrada"));
    }

    private void preencher(Long usuarioId, Tarefa tarefa, TarefaRequest dados) {
        tarefa.setTitulo(dados.titulo().trim());
        tarefa.setDescricao(dados.descricao());
        tarefa.setPrioridade(dados.prioridade() != null ? dados.prioridade() : Prioridade.MEDIA);
        tarefa.setPrazo(dados.prazo());
        tarefa.alterarStatus(dados.status() != null ? dados.status() : StatusTarefa.PENDENTE);
        tarefa.setProjeto(dados.projetoId() != null
                ? projetoService.buscarDoUsuario(usuarioId, dados.projetoId())
                : null);
    }

    private static boolean contem(String texto, String termo) {
        return texto != null && texto.toLowerCase().contains(termo);
    }

    private static boolean filtrarPorPrazo(Tarefa t, String filtro) {
        LocalDate hoje = LocalDate.now();
        LocalDate p = t.getPrazo();
        return switch (filtro) {
            case "atrasadas" -> t.isAtrasada();
            case "hoje" -> hoje.equals(p);
            case "semana" -> p != null && !p.isBefore(hoje) && !p.isAfter(hoje.plusDays(7));
            case "sem-prazo" -> p == null;
            default -> true;
        };
    }

    private static Comparator<Tarefa> comparador(String ordenar) {
        if ("prazo".equals(ordenar)) {
            // Tarefas sem prazo vão para o final
            return Comparator.comparing(Tarefa::getPrazo, Comparator.nullsLast(Comparator.naturalOrder()));
        }
        if ("prioridade".equals(ordenar)) {
            // URGENTE primeiro (ordem do enum invertida)
            return Comparator.comparing(Tarefa::getPrioridade, Comparator.reverseOrder());
        }
        return Comparator.comparing(Tarefa::getCriadaEm, Comparator.reverseOrder());
    }
}
