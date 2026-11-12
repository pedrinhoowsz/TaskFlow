package br.com.taskflow.security;

import br.com.taskflow.repository.UsuarioRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Roda em toda requisição: lê o cabeçalho "Authorization: Bearer <token>",
 * valida o token e, se estiver ok, marca o usuário como autenticado.
 */
@Component
public class JwtFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UsuarioRepository usuarioRepository;

    public JwtFilter(JwtService jwtService, UsuarioRepository usuarioRepository) {
        this.jwtService = jwtService;
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String cabecalho = request.getHeader("Authorization");

        if (cabecalho != null && cabecalho.startsWith("Bearer ")) {
            String token = cabecalho.substring(7);
            // Também confere se o usuário ainda existe (ex.: banco recriado com token antigo
            // no navegador). Se não existir, a requisição segue sem login e recebe 401.
            jwtService.validar(token)
                    .filter(usuario -> usuarioRepository.existsById(usuario.id()))
                    .ifPresent(usuario -> {
                var autenticacao = new UsernamePasswordAuthenticationToken(usuario, null, List.of());
                SecurityContextHolder.getContext().setAuthentication(autenticacao);
            });
        }

        chain.doFilter(request, response);
    }
}
