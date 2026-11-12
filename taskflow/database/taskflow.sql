-- =====================================================
-- TaskFlow - Script do banco de dados (MySQL 8+)
-- Obs.: o Spring Boot já cria as tabelas sozinho
-- (ddl-auto=update). Este script serve como documentação
-- ou para criar o banco manualmente.
-- =====================================================

CREATE DATABASE IF NOT EXISTS taskflow
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE taskflow;

CREATE TABLE IF NOT EXISTS usuarios (
    id        BIGINT AUTO_INCREMENT PRIMARY KEY,
    nome      VARCHAR(100) NOT NULL,
    email     VARCHAR(150) NOT NULL UNIQUE,
    senha     VARCHAR(255) NOT NULL,          -- hash BCrypt
    criado_em DATETIME(6)  NOT NULL
);

CREATE TABLE IF NOT EXISTS projetos (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    nome       VARCHAR(100) NOT NULL,
    descricao  VARCHAR(500),
    cor        VARCHAR(7),
    usuario_id BIGINT       NOT NULL,
    criado_em  DATETIME(6)  NOT NULL,
    CONSTRAINT fk_projeto_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS tarefas (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    titulo        VARCHAR(150)  NOT NULL,
    descricao     VARCHAR(1000),
    status        VARCHAR(20)   NOT NULL,     -- PENDENTE | EM_ANDAMENTO | CONCLUIDA
    prioridade    VARCHAR(20)   NOT NULL,     -- BAIXA | MEDIA | ALTA | URGENTE
    prazo         DATE,
    projeto_id    BIGINT,
    usuario_id    BIGINT        NOT NULL,
    criada_em     DATETIME(6)   NOT NULL,
    atualizada_em DATETIME(6),
    concluida_em  DATETIME(6),
    CONSTRAINT fk_tarefa_projeto FOREIGN KEY (projeto_id) REFERENCES projetos(id),
    CONSTRAINT fk_tarefa_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE INDEX idx_tarefa_usuario_status ON tarefas (usuario_id, status);
