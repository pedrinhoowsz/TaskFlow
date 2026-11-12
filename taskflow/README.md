# TaskFlow — Gerenciador de tarefas

Sistema estilo Trello para organizar tarefas e projetos.

**Tecnologias:** Angular 20 · Spring Boot 3.5 (Java 17+) · MySQL 8 · JWT

## Funcionalidades

- Cadastro e login de usuários (senha criptografada com BCrypt, autenticação por token JWT)
- Quadro Kanban com 3 colunas — **Pendente**, **Em andamento**, **Concluída** — com arrastar e soltar
- Criar, editar e excluir tarefas (título, descrição, status, prioridade, prazo, projeto)
- Prioridades: Baixa, Média, Alta, Urgente
- Prazos com destaque para tarefas **atrasadas** e que **vencem hoje**
- Filtros: busca por texto, status, prioridade, projeto, prazo (atrasadas / hoje / 7 dias / sem prazo) e ordenação
- Projetos com cor (as tarefas podem ou não pertencer a um projeto)
- Dashboard: totais, % concluído, gráfico por status, por prioridade, concluídas nos últimos 7 dias, próximos prazos e andamento por projeto
- Cada usuário só enxerga as próprias tarefas e projetos

## Estrutura

```
taskflow/
├── backend/                 → API Spring Boot
│   └── src/main/java/br/com/taskflow/
│       ├── model/           → entidades JPA (Usuario, Projeto, Tarefa) e enums
│       ├── repository/      → acesso ao banco (Spring Data JPA)
│       ├── service/         → regras de negócio
│       ├── controller/      → endpoints REST
│       ├── dto/             → objetos de entrada/saída da API
│       ├── security/        → geração e validação do token JWT
│       ├── config/          → Spring Security + CORS
│       └── exception/       → tratamento de erros padronizado
├── frontend/                → Angular
│   └── src/app/
│       ├── core/            → models, services, interceptor, guards
│       ├── pages/           → login, registro, layout, quadro, dashboard, projetos
│       └── components/      → tarefa-form (modal de criar/editar)
└── database/taskflow.sql    → script do banco (documentação)
```

## Como rodar

### Pré-requisitos
- Java 17 ou mais novo (JDK) e Maven (ou use a IDE: IntelliJ / Eclipse / VS Code)
- Node.js 20.19+ ou 22+
- MySQL 8 rodando na porta 3306

### 1. Banco de dados
O banco `taskflow` é criado automaticamente na primeira execução.

Para informar o usuário e a senha do **seu** MySQL sem expor a senha no GitHub:

1. Na pasta `backend`, copie `local.properties.example` para `local.properties`.
2. Edite `local.properties` com seus dados:
   ```properties
   spring.datasource.username=root
   spring.datasource.password=SUA_SENHA
   taskflow.jwt.secret=UMA_CHAVE_ALEATORIA_COM_32_OU_MAIS_CARACTERES
   ```
   A chave do JWT é obrigatória: sem ela a API não sobe. O `local.properties.example` mostra como gerar uma.
   Em produção, você também pode usar a variável de ambiente `TASKFLOW_JWT_SECRET`.

O `local.properties` está no `.gitignore`, então não vai para o repositório.

(Se preferir, rode `database/taskflow.sql` no MySQL Workbench antes.)

### 2. Backend
```bash
cd backend
mvn spring-boot:run
```
A API sobe em `http://localhost:8080`. Na IDE, basta executar a classe `TaskflowApplication`.

Testes automáticos (usam banco H2 em memória, não precisam do MySQL):
```bash
mvn test
```

### 3. Frontend
```bash
cd frontend
npm install
npm start
```
Abra `http://localhost:4200`, crie uma conta e pronto.

Testes automáticos (Karma + Jasmine, precisam do Google Chrome instalado):
```bash
npm test          # abre o Chrome e roda de novo a cada alteração
npm run test:ci   # roda uma vez, sem abrir janela
```

Testes E2E (Playwright, usam o Google Chrome instalado e precisam do Java/Maven):
```bash
npm run e2e       # sobe backend e frontend sozinhos e testa no navegador
npm run e2e:ui    # mesma coisa, com a interface visual do Playwright
```
Os testes E2E sobem a API na porta **8081** com banco H2 em memória (não mexem no seu MySQL)
e o frontend na porta **4300**, então podem rodar junto com o ambiente de desenvolvimento.
O relatório fica em `frontend/playwright-report/` (abra com `npx playwright show-report`).

## Endpoints da API

Todas as rotas, exceto cadastro e login, exigem o cabeçalho `Authorization: Bearer <token>`.

| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/auth/registrar` | Cadastra usuário → `{ token, usuario }` |
| POST | `/api/auth/login` | Login → `{ token, usuario }` |
| GET | `/api/auth/me` | Dados do usuário logado |
| GET | `/api/tarefas` | Lista tarefas (com filtros, ver abaixo) |
| GET | `/api/tarefas/{id}` | Busca uma tarefa |
| POST | `/api/tarefas` | Cria tarefa |
| PUT | `/api/tarefas/{id}` | Edita tarefa |
| PATCH | `/api/tarefas/{id}/status` | Muda só o status (arrastar no quadro) |
| DELETE | `/api/tarefas/{id}` | Exclui tarefa |
| GET / POST | `/api/projetos` | Lista / cria projeto |
| PUT / DELETE | `/api/projetos/{id}` | Edita / exclui projeto (tarefas ficam sem projeto) |
| GET | `/api/dashboard` | Estatísticas |

**Filtros de `GET /api/tarefas`** (todos opcionais):
`status` (PENDENTE, EM_ANDAMENTO, CONCLUIDA) · `prioridade` (BAIXA, MEDIA, ALTA, URGENTE) ·
`projetoId` (0 = sem projeto) · `busca` · `prazo` (atrasadas, hoje, semana, sem-prazo) ·
`ordenar` (prazo, prioridade, recentes)

Exemplo de corpo para criar tarefa:
```json
{
  "titulo": "Entregar relatório",
  "descricao": "Capítulo 3",
  "status": "PENDENTE",
  "prioridade": "ALTA",
  "prazo": "2026-10-30",
  "projetoId": 1
}
```

Erros voltam sempre no formato:
```json
{ "status": 400, "mensagem": "Informe o título", "campos": { "titulo": "Informe o título" } }
```

## Modelo de dados

- **usuarios** (id, nome, email único, senha, criado_em)
- **projetos** (id, nome, descricao, cor, usuario_id → usuarios)
- **tarefas** (id, titulo, descricao, status, prioridade, prazo, projeto_id → projetos, usuario_id → usuarios, criada_em, atualizada_em, concluida_em)

Um usuário tem vários projetos e várias tarefas; um projeto tem várias tarefas.
