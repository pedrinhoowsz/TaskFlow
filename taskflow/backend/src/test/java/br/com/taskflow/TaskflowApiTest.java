package br.com.taskflow;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Testa o fluxo principal da API usando banco H2 em memória. Rode com: mvn test */
@SpringBootTest
@AutoConfigureMockMvc
class TaskflowApiTest {

    @Autowired
    MockMvc mvc;

    @Autowired
    ObjectMapper json;

    @Test
    void fluxoCompleto() throws Exception {
        // 1. Cadastro
        String resposta = mvc.perform(post("/api/auth/registrar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"Pedro\",\"email\":\"pedro@teste.com\",\"senha\":\"123456\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        String token = "Bearer " + json.readTree(resposta).get("token").asText();

        // 2. Sem token -> 401
        mvc.perform(get("/api/tarefas")).andExpect(status().isUnauthorized());

        // 3. Login com senha errada -> 401
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"pedro@teste.com\",\"senha\":\"errada\"}"))
                .andExpect(status().isUnauthorized());

        // 4. Cria projeto e tarefa
        String projeto = mvc.perform(post("/api/projetos").header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"Faculdade\",\"cor\":\"#16a34a\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long projetoId = json.readTree(projeto).get("id").asLong();

        String tarefa = mvc.perform(post("/api/tarefas").header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"titulo\":\"Estudar Java\",\"prioridade\":\"ALTA\",\"prazo\":\"2020-01-01\",\"projetoId\":" + projetoId + "}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PENDENTE"))
                .andExpect(jsonPath("$.atrasada").value(true))
                .andExpect(jsonPath("$.projetoNome").value("Faculdade"))
                .andReturn().getResponse().getContentAsString();
        JsonNode t = json.readTree(tarefa);
        long tarefaId = t.get("id").asLong();

        // 5. Validação: título vazio -> 400
        mvc.perform(post("/api/tarefas").header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"titulo\":\"\"}"))
                .andExpect(status().isBadRequest());

        // 6. Filtro
        mvc.perform(get("/api/tarefas?prioridade=ALTA&prazo=atrasadas").header("Authorization", token))
                .andExpect(jsonPath("$.length()").value(1));
        mvc.perform(get("/api/tarefas?status=CONCLUIDA").header("Authorization", token))
                .andExpect(jsonPath("$.length()").value(0));

        // 7. Move para concluída
        mvc.perform(patch("/api/tarefas/" + tarefaId + "/status").header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"CONCLUIDA\"}"))
                .andExpect(jsonPath("$.status").value("CONCLUIDA"))
                .andExpect(jsonPath("$.atrasada").value(false));

        // 8. Dashboard
        mvc.perform(get("/api/dashboard").header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.concluidas").value(1))
                .andExpect(jsonPath("$.percentualConcluido").value(100));

        // 9. Outro usuário não enxerga a tarefa
        String outro = mvc.perform(post("/api/auth/registrar").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"Ana\",\"email\":\"ana@teste.com\",\"senha\":\"123456\"}"))
                .andReturn().getResponse().getContentAsString();
        String tokenOutro = "Bearer " + json.readTree(outro).get("token").asText();
        mvc.perform(get("/api/tarefas/" + tarefaId).header("Authorization", tokenOutro))
                .andExpect(status().isNotFound());

        // 10. Exclui projeto (tarefa continua, sem projeto) e exclui tarefa
        mvc.perform(delete("/api/projetos/" + projetoId).header("Authorization", token))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/tarefas/" + tarefaId).header("Authorization", token))
                .andExpect(jsonPath("$.projetoId").doesNotExist());
        mvc.perform(delete("/api/tarefas/" + tarefaId).header("Authorization", token))
                .andExpect(status().isNoContent());
    }
}
