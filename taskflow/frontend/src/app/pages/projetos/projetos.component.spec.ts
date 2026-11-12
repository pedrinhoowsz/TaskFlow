import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { ProjetosComponent } from './projetos.component';
import { ProjetoService } from '../../core/projeto.service';
import { botao, digitar, el, texto, todos } from '../../../testing/dom';
import { umProjeto } from '../../../testing/fabricas';

describe('ProjetosComponent', () => {
  let fixture: ComponentFixture<ProjetosComponent>;
  let comp: ProjetosComponent;
  let service: jasmine.SpyObj<ProjetoService>;
  const faculdade = umProjeto({ id: 1, nome: 'Faculdade', cor: '#7c3aed', descricao: 'TCC', totalTarefas: 3 });
  const casa = umProjeto({ id: 2, nome: 'Casa', cor: '#138a52' });

  beforeEach(async () => {
    service = jasmine.createSpyObj<ProjetoService>('ProjetoService', ['listar', 'criar', 'atualizar', 'excluir']);
    service.listar.and.returnValue(of([faculdade, casa]));
    await TestBed.configureTestingModule({
      imports: [ProjetosComponent],
      providers: [{ provide: ProjetoService, useValue: service }],
    }).compileComponents();
    spyOn(window, 'scrollTo');
    fixture = TestBed.createComponent(ProjetosComponent);
    comp = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('lista os projetos', () => {
    expect(service.listar).toHaveBeenCalledTimes(1);
    const textoTela = (fixture.nativeElement as HTMLElement).textContent!;
    expect(textoTela).toContain('Faculdade');
    expect(textoTela).toContain('Casa');
  });

  it('cria projeto com a cor escolhida, limpa o formulário e recarrega', async () => {
    service.criar.and.returnValue(of(umProjeto()));
    await digitar(fixture, '#nome', 'Trabalho');
    el(fixture, 'button[aria-label="Cor #db2777"]').click();
    service.listar.calls.reset();

    comp.salvar();
    fixture.detectChanges();

    expect(service.criar).toHaveBeenCalledWith({ nome: 'Trabalho', descricao: '', cor: '#db2777' });
    expect(service.atualizar).not.toHaveBeenCalled();
    expect(comp.form).toEqual({ nome: '', descricao: '', cor: '#2d5bff' });
    expect(service.listar).toHaveBeenCalledTimes(1);
    expect(comp.salvando()).toBeFalse();
  });

  it('editar preenche o formulário e salvar usa PUT no projeto certo', () => {
    service.atualizar.and.returnValue(of(faculdade));
    botao(fixture, 'Editar').click();
    fixture.detectChanges();

    expect(comp.editandoId()).toBe(1);
    expect(comp.form).toEqual({ nome: 'Faculdade', descricao: 'TCC', cor: '#7c3aed' });
    expect(window.scrollTo).toHaveBeenCalled();

    comp.form.nome = 'Faculdade 2';
    comp.salvar();
    expect(service.atualizar).toHaveBeenCalledWith(1, { nome: 'Faculdade 2', descricao: 'TCC', cor: '#7c3aed' });
    expect(service.criar).not.toHaveBeenCalled();
    expect(comp.editandoId()).toBeNull();
  });

  it('editar não altera o projeto da lista antes de salvar', () => {
    botao(fixture, 'Editar').click();
    comp.form.nome = 'Mudou';
    expect(faculdade.nome).toBe('Faculdade');
  });

  it('cancelar a edição volta para "novo projeto"', () => {
    botao(fixture, 'Editar').click();
    fixture.detectChanges();
    botao(fixture, 'Cancelar').click();
    fixture.detectChanges();
    expect(comp.editandoId()).toBeNull();
    expect(comp.form.nome).toBe('');
  });

  it('excluir pede confirmação', () => {
    service.excluir.and.returnValue(of(undefined));
    todos(fixture, 'button').filter((b) => b.textContent!.includes('Excluir'))[1].click(); // Casa
    fixture.detectChanges();
    expect(service.excluir).not.toHaveBeenCalled();

    botao(fixture, 'Sim').click();
    expect(service.excluir).toHaveBeenCalledWith(2);
  });

  it('excluir o projeto que está sendo editado limpa o formulário', () => {
    service.excluir.and.returnValue(of(undefined));
    comp.editar(faculdade);
    comp.excluir(faculdade);
    expect(comp.editandoId()).toBeNull();
    expect(comp.form.nome).toBe('');
  });

  it('mostra o erro da API ao salvar', () => {
    service.criar.and.returnValue(throwError(() =>
      new HttpErrorResponse({ status: 400, error: { mensagem: 'Informe o nome do projeto' } })));
    comp.salvar();
    fixture.detectChanges();
    expect(texto(fixture, '.alerta-erro')).toBe('Informe o nome do projeto');
    expect(comp.salvando()).toBeFalse();
  });
});
