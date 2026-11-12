package br.com.taskflow.dto;

/** Resposta do login/cadastro: o token JWT e os dados do usuário. */
public record AuthResponse(String token, UsuarioResponse usuario) {}
