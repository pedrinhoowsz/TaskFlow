package br.com.taskflow.controller;

import br.com.taskflow.dto.ProjetoRequest;
import br.com.taskflow.dto.ProjetoResponse;
import br.com.taskflow.security.UsuarioAutenticado;
import br.com.taskflow.service.ProjetoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projetos")
public class ProjetoController {

    private final ProjetoService projetoService;

    public ProjetoController(ProjetoService projetoService) {
        this.projetoService = projetoService;
    }

    @GetMapping
    public List<ProjetoResponse> listar(@AuthenticationPrincipal UsuarioAutenticado usuario) {
        return projetoService.listar(usuario.id());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProjetoResponse criar(@AuthenticationPrincipal UsuarioAutenticado usuario,
                                 @RequestBody @Valid ProjetoRequest dados) {
        return projetoService.criar(usuario.id(), dados);
    }

    @PutMapping("/{id}")
    public ProjetoResponse atualizar(@AuthenticationPrincipal UsuarioAutenticado usuario,
                                     @PathVariable Long id, @RequestBody @Valid ProjetoRequest dados) {
        return projetoService.atualizar(usuario.id(), id, dados);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@AuthenticationPrincipal UsuarioAutenticado usuario, @PathVariable Long id) {
        projetoService.excluir(usuario.id(), id);
    }
}
