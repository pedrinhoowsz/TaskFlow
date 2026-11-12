package br.com.taskflow.controller;

import br.com.taskflow.dto.AuthResponse;
import br.com.taskflow.dto.LoginRequest;
import br.com.taskflow.dto.RegistroRequest;
import br.com.taskflow.dto.UsuarioResponse;
import br.com.taskflow.security.UsuarioAutenticado;
import br.com.taskflow.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/registrar")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse registrar(@RequestBody @Valid RegistroRequest dados) {
        return authService.registrar(dados);
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody @Valid LoginRequest dados) {
        return authService.login(dados);
    }

    @GetMapping("/me")
    public UsuarioResponse me(@AuthenticationPrincipal UsuarioAutenticado usuario) {
        return authService.buscarUsuario(usuario.id());
    }
}
