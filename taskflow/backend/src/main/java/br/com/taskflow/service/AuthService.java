package br.com.taskflow.service;

import br.com.taskflow.dto.AuthResponse;
import br.com.taskflow.dto.LoginRequest;
import br.com.taskflow.dto.RegistroRequest;
import br.com.taskflow.dto.UsuarioResponse;
import br.com.taskflow.exception.CredenciaisInvalidasException;
import br.com.taskflow.exception.NaoEncontradoException;
import br.com.taskflow.exception.RegraNegocioException;
import br.com.taskflow.model.Usuario;
import br.com.taskflow.repository.UsuarioRepository;
import br.com.taskflow.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;

@Service
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse registrar(RegistroRequest dados) {
        String email = dados.email().trim().toLowerCase();
        // @Size conta caracteres; acentos e emojis ocupam mais de 1 byte
        if (excedeLimiteBcrypt(dados.senha())) {
            throw new RegraNegocioException("A senha é longa demais");
        }
        if (usuarioRepository.existsByEmail(email)) {
            throw new RegraNegocioException("Este e-mail já está cadastrado");
        }

        Usuario usuario = new Usuario();
        usuario.setNome(dados.nome().trim());
        usuario.setEmail(email);
        usuario.setSenha(passwordEncoder.encode(dados.senha()));
        usuarioRepository.save(usuario);

        return new AuthResponse(jwtService.gerarToken(usuario), UsuarioResponse.de(usuario));
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest dados) {
        Usuario usuario = usuarioRepository.findByEmail(dados.email().trim().toLowerCase())
                .orElseThrow(CredenciaisInvalidasException::new);

        if (excedeLimiteBcrypt(dados.senha()) || !passwordEncoder.matches(dados.senha(), usuario.getSenha())) {
            throw new CredenciaisInvalidasException();
        }

        return new AuthResponse(jwtService.gerarToken(usuario), UsuarioResponse.de(usuario));
    }

    /** O BCrypt não aceita senhas com mais de 72 bytes (lança exceção). */
    private static boolean excedeLimiteBcrypt(String senha) {
        return senha.getBytes(StandardCharsets.UTF_8).length > 72;
    }

    @Transactional(readOnly = true)
    public UsuarioResponse buscarUsuario(Long id) {
        return usuarioRepository.findById(id)
                .map(UsuarioResponse::de)
                .orElseThrow(() -> new NaoEncontradoException("Usuário não encontrado"));
    }
}
