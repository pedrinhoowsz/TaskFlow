package br.com.taskflow.model;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "tarefas")
public class Tarefa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String titulo;

    @Column(length = 1000)
    private String descricao;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatusTarefa status = StatusTarefa.PENDENTE;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Prioridade prioridade = Prioridade.MEDIA;

    // Data limite (pode ficar vazia)
    private LocalDate prazo;

    // Projeto é opcional: a tarefa pode ficar "sem projeto"
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "projeto_id")
    private Projeto projeto;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(name = "criada_em", nullable = false)
    private LocalDateTime criadaEm;

    @Column(name = "atualizada_em")
    private LocalDateTime atualizadaEm;

    @Column(name = "concluida_em")
    private LocalDateTime concluidaEm;

    @PrePersist
    void aoCriar() {
        criadaEm = LocalDateTime.now();
        atualizadaEm = criadaEm;
    }

    @PreUpdate
    void aoAtualizar() {
        atualizadaEm = LocalDateTime.now();
    }

    /** Muda o status e registra a data de conclusão automaticamente. */
    public void alterarStatus(StatusTarefa novoStatus) {
        if (novoStatus == StatusTarefa.CONCLUIDA && this.status != StatusTarefa.CONCLUIDA) {
            this.concluidaEm = LocalDateTime.now();
        } else if (novoStatus != StatusTarefa.CONCLUIDA) {
            this.concluidaEm = null;
        }
        this.status = novoStatus;
    }

    /** Atrasada = tem prazo, já passou e ainda não foi concluída. */
    public boolean isAtrasada() {
        return prazo != null
                && prazo.isBefore(LocalDate.now())
                && status != StatusTarefa.CONCLUIDA;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitulo() { return titulo; }
    public void setTitulo(String titulo) { this.titulo = titulo; }

    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }

    public StatusTarefa getStatus() { return status; }

    public Prioridade getPrioridade() { return prioridade; }
    public void setPrioridade(Prioridade prioridade) { this.prioridade = prioridade; }

    public LocalDate getPrazo() { return prazo; }
    public void setPrazo(LocalDate prazo) { this.prazo = prazo; }

    public Projeto getProjeto() { return projeto; }
    public void setProjeto(Projeto projeto) { this.projeto = projeto; }

    public Usuario getUsuario() { return usuario; }
    public void setUsuario(Usuario usuario) { this.usuario = usuario; }

    public LocalDateTime getCriadaEm() { return criadaEm; }
    public LocalDateTime getAtualizadaEm() { return atualizadaEm; }
    public LocalDateTime getConcluidaEm() { return concluidaEm; }
}
