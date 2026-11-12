package br.com.taskflow;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Date;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Casos de borda, segurança e regras de negócio. Rode com: mvn test */
@SpringBootTest
@AutoConfigureMockMvc
class TaskflowCasosDeBordaTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;

    @Value("${taskflow.jwt.secret}")
    String segredo;

    // ---------- helpers ----------

    private static String emailUnico() {
        return "u" + UUID.randomUUID().toString().substring(0, 8) + "@teste.com";
    }

    private ResultActions registrar(String nome, String email, String senha) throws Exception {
        String corpo = json.writeValueAsString(new java.util.HashMap<String, String>() {{
            put("nome", nome); put("email", email); put("senha", senha);
        }});
        return mvc.perform(post("/api/auth/registrar").contentType(MediaType.APPLICATION_JSON).content(corpo));
    }

    private String novoToken() throws Exception {
        String r = registrar("Teste", emailUnico(), "123456")
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return "Bearer " + json.readTree(r).get("token").asText();
    }

    private JsonNode postJson(String url, String token, String corpo) throws Exception {
        String r = mvc.perform(post(url).header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON).content(corpo))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return json.readTree(r);
    }

    private long criarTarefa(String token, String corpo) throws Exception {
        return postJson("/api/tarefas", token, corpo).get("id").asLong();
    }

    private String tokenManual(long id, Date expiracao) {
        return "Bearer " + Jwts.builder()
                .subject("fantasma@teste.com")
                .claim("id", id)
                .issuedAt(new Date())
                .expiration(expiracao)
                .signWith(Keys.hmacShaKeyFor(segredo.getBytes(StandardCharsets.UTF_8)))
                .compact();
    }

    private void assertMesmoMomento(java.time.LocalDateTime esperado, String respostaJson) throws Exception {
        java.time.LocalDateTime atual = java.time.LocalDateTime.parse(json.readTree(respostaJson).get("concluidaEm").asText());
        long diferenca = Math.abs(java.time.Duration.between(esperado, atual).toNanos());
        org.junit.jupiter.api.Assertions.assertTrue(diferenca < 1_000_000,
                "concluidaEm mudou: " + esperado + " -> " + atual);
    }

    // ---------- Autenticação ----------

    @Test
    void emailDuplicadoIgnoraMaiusculasEEspacos() throws Exception {
        String base = emailUnico();
        registrar("A", base, "123456").andExpect(status().isCreated());
        registrar("B", "  " + base.toUpperCase() + " ", "123456")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensagem").value("Este e-mail já está cadastrado"));
    }

    @Test
    void loginComEmailEmMaiusculas() throws Exception {
        String email = emailUnico();
        registrar("A", email, "123456").andExpect(status().isCreated());
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\" " + email.toUpperCase() + "\",\"senha\":\"123456\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.usuario.email").value(email));
    }

    @Test
    void loginComEmailInexistenteDa401() throws Exception {
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"naoexiste@teste.com\",\"senha\":\"123456\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void registroValidaCampos() throws Exception {
        registrar("   ", emailUnico(), "123456").andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.nome").exists());
        registrar("A", "nao-e-email", "123456").andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.email").value("E-mail inválido"));
        registrar("A", emailUnico(), "123").andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.senha").exists());
        mvc.perform(post("/api/auth/registrar").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void registroComNomeMuitoLongoDa400() throws Exception {
        registrar("x".repeat(101), emailUnico(), "123456").andExpect(status().isBadRequest());
    }

    /** A coluna email tem 150 caracteres: e-mail maior deve dar 400, não 500. */
    @Test
    void registroComEmailMuitoLongoDa400() throws Exception {
        String email = "a".repeat(64) + "@" + "b".repeat(60) + "." + "c".repeat(60) + ".com";
        registrar("A", email, "123456").andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.email").exists());
    }

    @Test
    void registroComEmailComEspacosFunciona() throws Exception {
        String email = emailUnico();
        registrar("A", "  " + email + "  ", "123456").andExpect(status().isCreated())
                .andExpect(jsonPath("$.usuario.email").value(email));
    }

    /** O BCrypt só aceita até 72 bytes: senhas maiores devem dar 400/401, não 500. */
    @Test
    void senhaMuitoLongaNaoDerrubaAApi() throws Exception {
        registrar("A", emailUnico(), "s".repeat(100)).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.senha").exists());
        // 30 caracteres, mas 120 bytes (emoji = 4 bytes)
        registrar("A", emailUnico(), "😀".repeat(30)).andExpect(status().isBadRequest());
        // Exatamente 72 bytes é aceito
        registrar("A", emailUnico(), "s".repeat(72)).andExpect(status().isCreated());

        String email = emailUnico();
        registrar("A", email, "123456").andExpect(status().isCreated());
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"senha\":\"" + "s".repeat(100) + "\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void meRetornaUsuarioLogado() throws Exception {
        String email = emailUnico();
        String r = registrar("Maria", email, "123456").andReturn().getResponse().getContentAsString();
        String token = "Bearer " + json.readTree(r).get("token").asText();
        mvc.perform(get("/api/auth/me").header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Maria"))
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.senha").doesNotExist());
    }

    @Test
    void tokensInvalidosDao401() throws Exception {
        mvc.perform(get("/api/tarefas").header("Authorization", "Bearer lixo")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/tarefas").header("Authorization", "Bearer ")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/tarefas").header("Authorization", "Basic abc")).andExpect(status().isUnauthorized());

        // Assinado com outra chave
        String forjado = "Bearer " + Jwts.builder().subject("x").claim("id", 1)
                .signWith(Keys.hmacShaKeyFor("outra-chave-qualquer-com-mais-de-32-chars!!".getBytes()))
                .compact();
        mvc.perform(get("/api/tarefas").header("Authorization", forjado)).andExpect(status().isUnauthorized());

        // Expirado
        String expirado = tokenManual(1, Date.from(Instant.now().minusSeconds(60)));
        mvc.perform(get("/api/tarefas").header("Authorization", expirado)).andExpect(status().isUnauthorized());
    }

    /**
     * Token válido de um usuário que não existe mais no banco (ex.: banco recriado
     * enquanto o token continua salvo no navegador). Não deve virar erro 500.
     */
    @Test
    void tokenDeUsuarioInexistenteDa401() throws Exception {
        // 401 faz o front deslogar e mandar para o login
        String fantasma = tokenManual(999_999, Date.from(Instant.now().plusSeconds(3600)));
        mvc.perform(get("/api/auth/me").header("Authorization", fantasma)).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/tarefas").header("Authorization", fantasma)).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/tarefas").header("Authorization", fantasma)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"titulo\":\"x\"}"))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/projetos").header("Authorization", fantasma)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"nome\":\"x\"}"))
                .andExpect(status().isUnauthorized());
    }

    // ---------- Isolamento entre usuários ----------

    @Test
    void usuarioNaoMexeEmDadosDeOutro() throws Exception {
        String dono = novoToken();
        String intruso = novoToken();
        long projetoId = postJson("/api/projetos", dono, "{\"nome\":\"Privado\"}").get("id").asLong();
        long tarefaId = criarTarefa(dono, "{\"titulo\":\"Segredo\"}");

        mvc.perform(put("/api/tarefas/" + tarefaId).header("Authorization", intruso)
                .contentType(MediaType.APPLICATION_JSON).content("{\"titulo\":\"hack\"}")).andExpect(status().isNotFound());
        mvc.perform(patch("/api/tarefas/" + tarefaId + "/status").header("Authorization", intruso)
                .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"CONCLUIDA\"}")).andExpect(status().isNotFound());
        mvc.perform(delete("/api/tarefas/" + tarefaId).header("Authorization", intruso)).andExpect(status().isNotFound());
        mvc.perform(put("/api/projetos/" + projetoId).header("Authorization", intruso)
                .contentType(MediaType.APPLICATION_JSON).content("{\"nome\":\"hack\"}")).andExpect(status().isNotFound());
        mvc.perform(delete("/api/projetos/" + projetoId).header("Authorization", intruso)).andExpect(status().isNotFound());

        // Não pode criar tarefa no projeto de outro
        mvc.perform(post("/api/tarefas").header("Authorization", intruso).contentType(MediaType.APPLICATION_JSON)
                .content("{\"titulo\":\"x\",\"projetoId\":" + projetoId + "}")).andExpect(status().isNotFound());

        // Listagens não vazam
        mvc.perform(get("/api/tarefas").header("Authorization", intruso)).andExpect(jsonPath("$.length()").value(0));
        mvc.perform(get("/api/projetos").header("Authorization", intruso)).andExpect(jsonPath("$.length()").value(0));
        mvc.perform(get("/api/dashboard").header("Authorization", intruso)).andExpect(jsonPath("$.total").value(0));

        // E nada mudou para o dono
        mvc.perform(get("/api/tarefas/" + tarefaId).header("Authorization", dono))
                .andExpect(jsonPath("$.titulo").value("Segredo"))
                .andExpect(jsonPath("$.status").value("PENDENTE"));
    }

    // ---------- Validação / formato ----------

    @Test
    void entradasMalFormadasDao400() throws Exception {
        String token = novoToken();
        String[] corpos = {
                "{\"titulo\":\"x\",\"status\":\"INVALIDO\"}",
                "{\"titulo\":\"x\",\"prioridade\":\"altissima\"}",
                "{\"titulo\":\"x\",\"prazo\":\"2026-13-45\"}",
                "{\"titulo\":\"x\",\"prazo\":\"31/12/2026\"}",
                "{\"titulo\":\"" + "x".repeat(151) + "\"}",
                "{\"titulo\":\"x\",\"descricao\":\"" + "d".repeat(1001) + "\"}",
                "{titulo quebrado",
                "",
        };
        for (String c : corpos) {
            mvc.perform(post("/api/tarefas").header("Authorization", token)
                            .contentType(MediaType.APPLICATION_JSON).content(c))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.status").value(400));
        }
        mvc.perform(get("/api/tarefas?status=XYZ").header("Authorization", token)).andExpect(status().isBadRequest());
        mvc.perform(get("/api/tarefas?projetoId=abc").header("Authorization", token)).andExpect(status().isBadRequest());
        mvc.perform(get("/api/tarefas/abc").header("Authorization", token)).andExpect(status().isBadRequest());
        mvc.perform(get("/api/tarefas/999999").header("Authorization", token)).andExpect(status().isNotFound());
        mvc.perform(post("/api/tarefas").header("Authorization", token).contentType(MediaType.APPLICATION_JSON)
                .content("{\"titulo\":\"x\",\"projetoId\":999999}")).andExpect(status().isNotFound());

        long id = criarTarefa(token, "{\"titulo\":\"x\"}");
        mvc.perform(patch("/api/tarefas/" + id + "/status").header("Authorization", token)
                .contentType(MediaType.APPLICATION_JSON).content("{}")).andExpect(status().isBadRequest());
    }

    @Test
    void projetoCorPadraoEValidacao() throws Exception {
        String token = novoToken();
        org.junit.jupiter.api.Assertions.assertEquals("#4f46e5",
                postJson("/api/projetos", token, "{\"nome\":\"Sem cor\"}").get("cor").asText());
        mvc.perform(post("/api/projetos").header("Authorization", token).contentType(MediaType.APPLICATION_JSON)
                .content("{\"nome\":\"Cor vazia\",\"cor\":\"\"}")).andExpect(status().isCreated())
                .andExpect(jsonPath("$.cor").value("#4f46e5"));
        mvc.perform(post("/api/projetos").header("Authorization", token).contentType(MediaType.APPLICATION_JSON)
                .content("{\"nome\":\"x\",\"cor\":\"red\"}")).andExpect(status().isBadRequest());
        mvc.perform(post("/api/projetos").header("Authorization", token).contentType(MediaType.APPLICATION_JSON)
                .content("{\"nome\":\"x\",\"cor\":\"#12345\"}")).andExpect(status().isBadRequest());
        mvc.perform(post("/api/projetos").header("Authorization", token).contentType(MediaType.APPLICATION_JSON)
                .content("{\"nome\":\"   \"}")).andExpect(status().isBadRequest());
        mvc.perform(post("/api/projetos").header("Authorization", token).contentType(MediaType.APPLICATION_JSON)
                .content("{\"nome\":\"" + "n".repeat(101) + "\"}")).andExpect(status().isBadRequest());
    }

    @Test
    void textosSaoAparadosAoSalvar() throws Exception {
        String token = novoToken();
        JsonNode t = postJson("/api/tarefas", token, "{\"titulo\":\"   Estudar   \"}");
        org.junit.jupiter.api.Assertions.assertEquals("Estudar", t.get("titulo").asText());
        JsonNode p = postJson("/api/projetos", token, "{\"nome\":\"  Casa  \"}");
        org.junit.jupiter.api.Assertions.assertEquals("Casa", p.get("nome").asText());
    }

    // ---------- Regras de status / conclusão ----------

    @Test
    void dataDeConclusaoSegueOStatus() throws Exception {
        String token = novoToken();
        long id = criarTarefa(token, "{\"titulo\":\"x\"}");

        String r = mvc.perform(patch("/api/tarefas/" + id + "/status").header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"CONCLUIDA\"}"))
                .andExpect(jsonPath("$.concluidaEm").isNotEmpty())
                .andReturn().getResponse().getContentAsString();
        // O banco arredonda para microssegundos, então comparamos com tolerância de 1 ms
        java.time.LocalDateTime concluidaEm = java.time.LocalDateTime.parse(json.readTree(r).get("concluidaEm").asText());

        // Editar a tarefa mantendo CONCLUIDA não pode mudar a data de conclusão
        String r2 = mvc.perform(put("/api/tarefas/" + id).header("Authorization", token).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"titulo\":\"x editado\",\"status\":\"CONCLUIDA\"}"))
                .andReturn().getResponse().getContentAsString();
        assertMesmoMomento(concluidaEm, r2);

        // Mover de novo para CONCLUIDA também não muda
        String r3 = mvc.perform(patch("/api/tarefas/" + id + "/status").header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"CONCLUIDA\"}"))
                .andReturn().getResponse().getContentAsString();
        assertMesmoMomento(concluidaEm, r3);

        // Reabrir zera
        mvc.perform(patch("/api/tarefas/" + id + "/status").header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"EM_ANDAMENTO\"}"))
                .andExpect(jsonPath("$.status").value("EM_ANDAMENTO"))
                .andExpect(jsonPath("$.concluidaEm").doesNotExist());
    }

    @Test
    void criarJaConcluidaRegistraConclusao() throws Exception {
        String token = novoToken();
        JsonNode t = postJson("/api/tarefas", token, "{\"titulo\":\"x\",\"status\":\"CONCLUIDA\"}");
        org.junit.jupiter.api.Assertions.assertFalse(t.get("concluidaEm").isNull());
    }

    @Test
    void editarSemStatusEPrioridadeMantemOsValores() throws Exception {
        String token = novoToken();
        long id = criarTarefa(token, "{\"titulo\":\"x\",\"status\":\"CONCLUIDA\",\"prioridade\":\"URGENTE\"}");
        mvc.perform(put("/api/tarefas/" + id).header("Authorization", token).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"titulo\":\"y\"}"))
                .andExpect(jsonPath("$.titulo").value("y"))
                .andExpect(jsonPath("$.status").value("CONCLUIDA"))
                .andExpect(jsonPath("$.concluidaEm").isNotEmpty())
                .andExpect(jsonPath("$.prioridade").value("URGENTE"));
        // Tarefa nova sem status/prioridade usa o padrão
        mvc.perform(post("/api/tarefas").header("Authorization", token).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"titulo\":\"nova\"}"))
                .andExpect(jsonPath("$.status").value("PENDENTE"))
                .andExpect(jsonPath("$.prioridade").value("MEDIA"))
                .andExpect(jsonPath("$.concluidaEm").doesNotExist());
    }

    @Test
    void chaveJwtCurtaOuAusenteImpedeASubida() {
        for (String chave : new String[]{"", "curta-demais"}) {
            var erro = org.junit.jupiter.api.Assertions.assertThrows(IllegalStateException.class,
                    () -> new br.com.taskflow.security.JwtService(chave, 1));
            org.junit.jupiter.api.Assertions.assertTrue(erro.getMessage().contains("local.properties"));
        }
    }

    // ---------- Filtros e ordenação ----------

    @Test
    void filtrosEOrdenacao() throws Exception {
        String token = novoToken();
        LocalDate hoje = LocalDate.now();
        long proj = postJson("/api/projetos", token, "{\"nome\":\"P\"}").get("id").asLong();

        criarTarefa(token, "{\"titulo\":\"Atrasada\",\"prazo\":\"" + hoje.minusDays(3) + "\",\"prioridade\":\"BAIXA\"}");
        criarTarefa(token, "{\"titulo\":\"Hoje\",\"prazo\":\"" + hoje + "\",\"prioridade\":\"URGENTE\",\"projetoId\":" + proj + "}");
        criarTarefa(token, "{\"titulo\":\"Semana\",\"prazo\":\"" + hoje.plusDays(5) + "\",\"prioridade\":\"ALTA\"}");
        criarTarefa(token, "{\"titulo\":\"Longe\",\"prazo\":\"" + hoje.plusDays(30) + "\",\"descricao\":\"Relatório FINAL\"}");
        criarTarefa(token, "{\"titulo\":\"SemPrazo\"}");
        criarTarefa(token, "{\"titulo\":\"Velha concluída\",\"prazo\":\"" + hoje.minusDays(10) + "\",\"status\":\"CONCLUIDA\"}");

        String base = "/api/tarefas?";
        mvc.perform(get(base + "prazo=atrasadas").header("Authorization", token))
                .andExpect(jsonPath("$[*].titulo", contains("Atrasada")));
        mvc.perform(get(base + "prazo=hoje").header("Authorization", token))
                .andExpect(jsonPath("$[*].titulo", contains("Hoje")));
        mvc.perform(get(base + "prazo=semana").header("Authorization", token))
                .andExpect(jsonPath("$[*].titulo", containsInAnyOrder("Hoje", "Semana")));
        mvc.perform(get(base + "prazo=sem-prazo").header("Authorization", token))
                .andExpect(jsonPath("$[*].titulo", contains("SemPrazo")));
        mvc.perform(get(base + "busca=relatório final").header("Authorization", token))
                .andExpect(jsonPath("$[*].titulo", contains("Longe")));
        mvc.perform(get(base + "busca=SEMANA").header("Authorization", token))
                .andExpect(jsonPath("$[*].titulo", contains("Semana")));
        mvc.perform(get(base + "projetoId=" + proj).header("Authorization", token))
                .andExpect(jsonPath("$[*].titulo", contains("Hoje")));
        mvc.perform(get(base + "projetoId=0").header("Authorization", token))
                .andExpect(jsonPath("$.length()").value(5));
        mvc.perform(get(base + "prazo=qualquer-coisa").header("Authorization", token))
                .andExpect(jsonPath("$.length()").value(6));

        mvc.perform(get(base + "ordenar=prazo").header("Authorization", token))
                .andExpect(jsonPath("$[0].titulo").value("Velha concluída"))
                .andExpect(jsonPath("$[1].titulo").value("Atrasada"))
                .andExpect(jsonPath("$[5].titulo").value("SemPrazo"));
        mvc.perform(get(base + "ordenar=prioridade").header("Authorization", token))
                .andExpect(jsonPath("$[0].prioridade").value("URGENTE"))
                .andExpect(jsonPath("$[1].prioridade").value("ALTA"))
                .andExpect(jsonPath("$[5].prioridade").value("BAIXA"));
        mvc.perform(get(base + "ordenar=recentes").header("Authorization", token))
                .andExpect(jsonPath("$[0].titulo").value("Velha concluída"));
    }

    // ---------- Projetos ----------

    @Test
    void projetosListamEmOrdemComContagem() throws Exception {
        String token = novoToken();
        long b = postJson("/api/projetos", token, "{\"nome\":\"Beta\"}").get("id").asLong();
        postJson("/api/projetos", token, "{\"nome\":\"Alfa\"}");
        criarTarefa(token, "{\"titulo\":\"1\",\"projetoId\":" + b + "}");
        criarTarefa(token, "{\"titulo\":\"2\",\"projetoId\":" + b + "}");

        mvc.perform(get("/api/projetos").header("Authorization", token))
                .andExpect(jsonPath("$[0].nome").value("Alfa"))
                .andExpect(jsonPath("$[0].totalTarefas").value(0))
                .andExpect(jsonPath("$[1].nome").value("Beta"))
                .andExpect(jsonPath("$[1].totalTarefas").value(2));

        mvc.perform(put("/api/projetos/" + b).header("Authorization", token).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"Beta 2\",\"cor\":\"#ff0000\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Beta 2"))
                .andExpect(jsonPath("$.cor").value("#ff0000"))
                .andExpect(jsonPath("$.totalTarefas").value(2));
    }

    // ---------- Dashboard ----------

    @Test
    void dashboardCalculaTudo() throws Exception {
        String token = novoToken();
        LocalDate hoje = LocalDate.now();
        long proj = postJson("/api/projetos", token, "{\"nome\":\"P\",\"cor\":\"#123456\"}").get("id").asLong();

        criarTarefa(token, "{\"titulo\":\"a\",\"prazo\":\"" + hoje.minusDays(1) + "\",\"prioridade\":\"URGENTE\"}");
        criarTarefa(token, "{\"titulo\":\"b\",\"prazo\":\"" + hoje + "\",\"status\":\"EM_ANDAMENTO\",\"projetoId\":" + proj + "}");
        criarTarefa(token, "{\"titulo\":\"c\",\"prazo\":\"" + hoje.plusDays(7) + "\",\"projetoId\":" + proj + "}");
        criarTarefa(token, "{\"titulo\":\"d\",\"prazo\":\"" + hoje.plusDays(8) + "\"}");
        criarTarefa(token, "{\"titulo\":\"e\",\"status\":\"CONCLUIDA\",\"projetoId\":" + proj + "}");
        criarTarefa(token, "{\"titulo\":\"f\",\"prazo\":\"" + hoje.plusDays(2) + "\"}");
        criarTarefa(token, "{\"titulo\":\"g\",\"prazo\":\"" + hoje.plusDays(3) + "\"}");

        mvc.perform(get("/api/dashboard").header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(7))
                .andExpect(jsonPath("$.pendentes").value(5))
                .andExpect(jsonPath("$.emAndamento").value(1))
                .andExpect(jsonPath("$.concluidas").value(1))
                .andExpect(jsonPath("$.atrasadas").value(1))
                .andExpect(jsonPath("$.venceHoje").value(1))
                .andExpect(jsonPath("$.proximos7Dias").value(4)) // b, c, f, g (igual ao filtro "semana"; d está fora)
                .andExpect(jsonPath("$.percentualConcluido").value(14))
                .andExpect(jsonPath("$.porPrioridade.URGENTE").value(1))
                .andExpect(jsonPath("$.porPrioridade.MEDIA").value(6))
                .andExpect(jsonPath("$.porPrioridade.BAIXA").value(0))
                .andExpect(jsonPath("$.porProjeto[0].nome").value("P"))
                .andExpect(jsonPath("$.porProjeto[0].total").value(3))
                .andExpect(jsonPath("$.porProjeto[0].concluidas").value(1))
                .andExpect(jsonPath("$.proximosPrazos.length()").value(5))
                .andExpect(jsonPath("$.proximosPrazos[0].titulo").value("a"))
                .andExpect(jsonPath("$.proximosPrazos[1].titulo").value("b"))
                .andExpect(jsonPath("$.concluidasUltimos7Dias.length()").value(7))
                .andExpect(jsonPath("$.concluidasUltimos7Dias[6].data").value(hoje.toString()))
                .andExpect(jsonPath("$.concluidasUltimos7Dias[6].quantidade").value(1));
    }

    @Test
    void dashboardVazio() throws Exception {
        mvc.perform(get("/api/dashboard").header("Authorization", novoToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(0))
                .andExpect(jsonPath("$.percentualConcluido").value(0))
                .andExpect(jsonPath("$.porProjeto.length()").value(0))
                .andExpect(jsonPath("$.proximosPrazos.length()").value(0));
    }

    // ---------- CORS ----------

    @Test
    void corsLiberaSoOFrontend() throws Exception {
        mvc.perform(options("/api/tarefas")
                        .header("Origin", "http://localhost:4200")
                        .header("Access-Control-Request-Method", "PATCH")
                        .header("Access-Control-Request-Headers", "Authorization,Content-Type"))
                .andExpect(status().isOk());
        mvc.perform(options("/api/tarefas")
                        .header("Origin", "http://site-malicioso.com")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isForbidden());
    }
}
