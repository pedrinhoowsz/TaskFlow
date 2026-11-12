package br.com.taskflow.repository;

import br.com.taskflow.model.Projeto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProjetoRepository extends JpaRepository<Projeto, Long> {

    List<Projeto> findByUsuarioIdOrderByNomeAsc(Long usuarioId);

    // Busca garantindo que o projeto pertence ao usuário logado
    Optional<Projeto> findByIdAndUsuarioId(Long id, Long usuarioId);
}
