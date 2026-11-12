package br.com.taskflow.repository;

import br.com.taskflow.model.Tarefa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TarefaRepository extends JpaRepository<Tarefa, Long> {

    // "left join fetch" já traz o projeto junto, evitando várias consultas
    @Query("select t from Tarefa t left join fetch t.projeto " +
           "where t.usuario.id = :usuarioId order by t.criadaEm desc")
    List<Tarefa> listarDoUsuario(@Param("usuarioId") Long usuarioId);

    Optional<Tarefa> findByIdAndUsuarioId(Long id, Long usuarioId);

    // Ao excluir um projeto, as tarefas dele ficam "sem projeto"
    @Modifying
    @Query("update Tarefa t set t.projeto = null where t.projeto.id = :projetoId")
    void desvincularProjeto(@Param("projetoId") Long projetoId);

    long countByProjetoId(Long projetoId);
}
