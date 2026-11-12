package br.com.taskflow.security;

/** Dados do usuário logado, extraídos do token JWT em cada requisição. */
public record UsuarioAutenticado(Long id, String email) {}
