package br.com.taskflow.service;

import br.com.taskflow.dto.ProjetoRequest;
import br.com.taskflow.dto.ProjetoResponse;
import br.com.taskflow.exception.NaoEncontradoException;
import br.com.taskflow.model.Projeto;
import br.com.taskflow.repository.ProjetoRepository;
import br.com.taskflow.repository.TarefaRepository;
import br.com.taskflow.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProjetoService {

    private static final String COR_PADRAO = "#4f46e5";

    private final ProjetoRepository projetoRepository;
    private final TarefaRepository tarefaRepository;
    private final UsuarioRepository usuarioRepository;

    public ProjetoService(ProjetoRepository projetoRepository, TarefaRepository tarefaRepository,
                          UsuarioRepository usuarioRepository) {
        this.projetoRepository = projetoRepository;
        this.tarefaRepository = tarefaRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @Transactional(readOnly = true)
    public List<ProjetoResponse> listar(Long usuarioId) {
        return projetoRepository.findByUsuarioIdOrderByNomeAsc(usuarioId).stream()
                .map(p -> ProjetoResponse.de(p, tarefaRepository.countByProjetoId(p.getId())))
                .toList();
    }

    @Transactional
    public ProjetoResponse criar(Long usuarioId, ProjetoRequest dados) {
        Projeto projeto = new Projeto();
        projeto.setUsuario(usuarioRepository.getReferenceById(usuarioId));
        preencher(projeto, dados);
        projetoRepository.save(projeto);
        return ProjetoResponse.de(projeto, 0);
    }

    @Transactional
    public ProjetoResponse atualizar(Long usuarioId, Long id, ProjetoRequest dados) {
        Projeto projeto = buscarDoUsuario(usuarioId, id);
        preencher(projeto, dados);
        return ProjetoResponse.de(projeto, tarefaRepository.countByProjetoId(id));
    }

    @Transactional
    public void excluir(Long usuarioId, Long id) {
        Projeto projeto = buscarDoUsuario(usuarioId, id);
        // As tarefas não são apagadas: só deixam de ter projeto
        tarefaRepository.desvincularProjeto(projeto.getId());
        projetoRepository.delete(projeto);
    }

    /** Usado também pelo TarefaService para validar o projeto escolhido. */
    public Projeto buscarDoUsuario(Long usuarioId, Long id) {
        return projetoRepository.findByIdAndUsuarioId(id, usuarioId)
                .orElseThrow(() -> new NaoEncontradoException("Projeto não encontrado"));
    }

    private void preencher(Projeto projeto, ProjetoRequest dados) {
        projeto.setNome(dados.nome().trim());
        projeto.setDescricao(dados.descricao());
        projeto.setCor(dados.cor() != null && !dados.cor().isBlank() ? dados.cor() : COR_PADRAO);
    }
}
