import { useState } from 'react';
import { useCarrinho } from '../contextos/CarrinhoContext.jsx';
import { Modal } from './Modal.jsx';
import { Botao, Campo, ErroGeral } from './ui.jsx';

export function GerenciadorCarrinhos({ ocupado = false }) {
  const { carrinho, carregando, criar, renomear, ativar, excluir } = useCarrinho();
  const [formulario, setFormulario] = useState(null);
  const [nome, setNome] = useState('');
  const [paraExcluir, setParaExcluir] = useState(null);
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const bloqueado = ocupado || carregando || enviando;

  async function executar(acao) {
    setErro(null);
    setEnviando(true);
    try {
      await acao();
      setFormulario(null);
      setParaExcluir(null);
    } catch (falha) {
      setErro(falha);
    } finally {
      setEnviando(false);
    }
  }

  function abrirFormulario(tipo) {
    setErro(null);
    setNome(tipo === 'renomear' ? carrinho.nome : '');
    setFormulario({ tipo, id: carrinho.id });
  }

  function salvar(evento) {
    evento.preventDefault();
    executar(() => formulario.tipo === 'criar' ? criar(nome) : renomear(formulario.id, nome));
  }

  return (
    <section className="rounded-xl border border-tinta-200 bg-white p-5" aria-label="Meus carrinhos">
      <div className="flex flex-wrap items-end gap-3">
        <Campo rotulo="Carrinho ativo" id="carrinho-ativo" className="min-w-0 flex-1 basis-60">
          <select
            id="carrinho-ativo"
            value={carrinho.id ?? ''}
            disabled={bloqueado || Boolean(formulario)}
            onChange={(evento) => executar(() => ativar(Number(evento.target.value)))}
            className="w-full rounded-lg border border-tinta-300 bg-white px-3 py-2.5 text-sm
              focus:border-marca-500 focus:outline-none focus:ring-2 focus:ring-marca-100
              disabled:bg-tinta-100"
          >
            {carrinho.carrinhos.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nome} · {item.quantidade_pecas} {item.quantidade_pecas === 1 ? 'peça' : 'peças'}
              </option>
            ))}
          </select>
        </Campo>

        <Botao type="button" disabled={bloqueado} onClick={() => abrirFormulario('criar')}>
          Novo carrinho
        </Botao>
        <Botao type="button" variante="contorno" disabled={bloqueado || !carrinho.id}
          onClick={() => abrirFormulario('renomear')}>
          Renomear
        </Botao>
        <Botao type="button" variante="perigo" disabled={bloqueado || !carrinho.id || Boolean(formulario)}
          onClick={() => { setErro(null); setParaExcluir({ id: carrinho.id, nome: carrinho.nome }); }}>
          Excluir carrinho
        </Botao>
      </div>

      {formulario && (
        <form onSubmit={salvar} className="mt-4 space-y-3 border-t border-tinta-200 pt-4">
          <Campo
            rotulo={formulario.tipo === 'criar' ? 'Nome do novo carrinho' : 'Nome do carrinho'}
            name="nome-carrinho"
            value={nome}
            onChange={(evento) => setNome(evento.target.value)}
            placeholder="Ex.: Gol do João"
            required
            maxLength={80}
            autoFocus
            disabled={bloqueado}
            erro={erro?.porCampo?.nome}
          />
          <div className="flex gap-2">
            <Botao type="submit" carregando={enviando} disabled={ocupado || carregando || !nome.trim()}>
              {formulario.tipo === 'criar' ? 'Criar carrinho' : 'Salvar nome'}
            </Botao>
            <Botao type="button" variante="contorno" disabled={bloqueado}
              onClick={() => { setFormulario(null); setErro(null); }}>
              Cancelar
            </Botao>
          </div>
        </form>
      )}

      {!paraExcluir && erro && (
        <div className="mt-4"><ErroGeral erro={erro} camposConhecidos={formulario ? ['nome'] : []} /></div>
      )}

      {paraExcluir && (
        <Modal
          titulo="Excluir carrinho?"
          descricao={`O carrinho “${paraExcluir.nome}” e suas peças serão removidos. ${
            carrinho.carrinhos.length === 1 ? 'Um novo carrinho vazio será criado.' : 'Os outros carrinhos serão mantidos.'
          }`}
          ocupado={bloqueado}
          aoFechar={() => { setParaExcluir(null); setErro(null); }}
          rodape={
            <>
              <Botao type="button" variante="contorno" autoFocus disabled={bloqueado}
                onClick={() => { setParaExcluir(null); setErro(null); }}>
                Cancelar
              </Botao>
              <Botao type="button" variante="perigo" carregando={enviando} disabled={ocupado || carregando}
                onClick={() => executar(() => excluir(paraExcluir.id))}>
                Excluir carrinho
              </Botao>
            </>
          }
        >
          {erro && <div className="mt-4"><ErroGeral erro={erro} /></div>}
        </Modal>
      )}
    </section>
  );
}
