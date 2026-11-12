package br.com.taskflow.controller;

import br.com.taskflow.dto.StatusRequest;
import br.com.taskflow.dto.TarefaRequest;
import br.com.taskflow.dto.TarefaResponse;
import br.com.taskflow.model.Prioridade;
import br.com.taskflow.model.StatusTarefa;
import br.com.taskflow.security.UsuarioAutenticado;
import br.com.taskflow.service.TarefaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tarefas")
public class TarefaController {

    private final TarefaService tarefaService;

    public TarefaController(TarefaService tarefaService) {
        this.tarefaService = tarefaService;
    }

    /**
     * Exemplo: GET /api/tarefas?status=PENDENTE&prioridade=ALTA&busca=relatorio&prazo=semana&ordenar=prazo
     */
    @GetMapping
    public List<TarefaResponse> listar(@AuthenticationPrincipal UsuarioAutenticado usuario,
                                       @RequestParam(required = false) StatusTarefa status,
                                       @RequestParam(required = false) Prioridade prioridade,
                                       @RequestParam(required = false) Long projetoId,
                                       @RequestParam(required = false) String busca,
                                       @RequestParam(required = false) String prazo,
                                       @RequestParam(required = false) String ordenar) {
        return tarefaService.listar(usuario.id(), status, prioridade, projetoId, busca, prazo, ordenar);
    }

    @GetMapping("/{id}")
    public TarefaResponse buscar(@AuthenticationPrincipal UsuarioAutenticado usuario, @PathVariable Long id) {
        return tarefaService.buscar(usuario.id(), id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TarefaResponse criar(@AuthenticationPrincipal UsuarioAutenticado usuario,
                                @RequestBody @Valid TarefaRequest dados) {
        return tarefaService.criar(usuario.id(), dados);
    }

    @PutMapping("/{id}")
    public TarefaResponse atualizar(@AuthenticationPrincipal UsuarioAutenticado usuario,
                                    @PathVariable Long id, @RequestBody @Valid TarefaRequest dados) {
        return tarefaService.atualizar(usuario.id(), id, dados);
    }

    /** Usado ao arrastar o cartão para outra coluna do quadro. */
    @PatchMapping("/{id}/status")
    public TarefaResponse alterarStatus(@AuthenticationPrincipal UsuarioAutenticado usuario,
                                        @PathVariable Long id, @RequestBody @Valid StatusRequest dados) {
        return tarefaService.alterarStatus(usuario.id(), id, dados.status());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@AuthenticationPrincipal UsuarioAutenticado usuario, @PathVariable Long id) {
        tarefaService.excluir(usuario.id(), id);
    }
}
