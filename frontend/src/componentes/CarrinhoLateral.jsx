import { useEffect, useId, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { dinheiro } from '../api/cliente.js';
import { useCarrinho } from '../contextos/CarrinhoContext.jsx';
import { Alerta, Botao, Campo, Carregando, ErroGeral } from './ui.jsx';

function ItemCarrinhoLateral({ item, ocupado, aoAlterar, aoRemover }) {
  const quantidadeId = useId();

  return (
    <li className="flex gap-3 py-4">
      <img src={item.imagem_url} alt="" width="56" height="56"
        className="size-14 shrink-0 rounded-lg bg-tinta-100 object-contain p-1" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase text-marca-700">{item.marca}</p>
        <h3 className="line-clamp-2 text-sm font-semibold text-tinta-900">
          <Link to={`/produto/${item.codigo_produto}`} className="hover:underline">{item.descricao}</Link>
        </h3>
        <p className="mt-0.5 text-xs text-tinta-500">
          {item.codigo_produto} · {dinheiro.format(item.preco_unitario)} cada
        </p>
        {item.problema && <p className="mt-1.5 text-xs text-amber-700">{item.problema}</p>}
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <label className="sr-only" htmlFor={quantidadeId}>Quantidade de {item.descricao}</label>
          <input
            id={quantidadeId}
            type="number"
            min="1"
            max={Math.min(item.estoque ?? 99, 99)}
            value={item.quantidade}
            disabled={ocupado || !(item.estoque > 0)}
            onChange={(evento) => {
              const quantidade = Number(evento.target.value);
              if (Number.isInteger(quantidade) && quantidade >= 1 && quantidade <= 99) {
                aoAlterar(item.codigo_produto, quantidade);
              }
            }}
            className="w-20 rounded-lg border border-tinta-300 px-2 py-1.5 text-sm
              focus:border-marca-500 focus:outline-none focus:ring-2 focus:ring-marca-100 disabled:bg-tinta-100"
          />
          <button type="button" disabled={ocupado} onClick={() => aoRemover(item.codigo_produto)}
            aria-label={`Remover ${item.descricao}`}
            className="text-sm text-tinta-500 underline hover:text-red-600 disabled:opacity-50">
            Remover
          </button>
        </div>
      </div>
      <p className="shrink-0 text-right text-sm font-bold text-tinta-900">{dinheiro.format(item.valor_total)}</p>
    </li>
  );
}

export function CarrinhoLateral({ aoFechar }) {
  const { carrinho, carregando, erro, recarregar, ativar, alterar, remover } = useCarrinho();
  const navegar = useNavigate();
  const dialogoRef = useRef(null);
  const tituloId = useId();

  useEffect(() => {
    const dialogo = dialogoRef.current;
    const overflowAnterior = document.body.style.overflow;
    dialogo.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialogo.close();
      document.body.style.overflow = overflowAnterior;
    };
  }, []);

  async function executar(acao) {
    try {
      await acao();
    } catch {
      // O contexto guarda o erro, exibido abaixo sem fechar o carrinho.
    }
  }

  return (
    <dialog
      id="carrinho-lateral"
      ref={dialogoRef}
      aria-labelledby={tituloId}
      aria-modal="true"
      className="fixed inset-y-0 right-0 m-0 ml-auto h-dvh max-h-none w-full max-w-[360px]
        flex-col overflow-hidden border-l border-tinta-200 bg-white p-0 text-tinta-800
        shadow-xl open:flex backdrop:bg-tinta-900/60"
      onCancel={(evento) => { evento.preventDefault(); aoFechar(); }}
      onClick={(evento) => {
        if (evento.target !== evento.currentTarget) return;
        const area = evento.currentTarget.getBoundingClientRect();
        if (evento.clientX < area.left || evento.clientX > area.right ||
            evento.clientY < area.top || evento.clientY > area.bottom) aoFechar();
      }}
    >
      <div className="flex items-center justify-between gap-3 border-b border-tinta-200 px-4 py-3">
        <h2 id={tituloId} className="text-lg font-bold text-tinta-900">Seu carrinho</h2>
        <button
          type="button"
          autoFocus
          onClick={aoFechar}
          aria-label="Fechar carrinho lateral"
          className="rounded-lg p-2 text-tinta-500 hover:bg-tinta-100 hover:text-tinta-900"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" className="size-5">
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4">
        <Campo rotulo="Carrinho ativo" id="carrinho-lateral-ativo">
          <select
            id="carrinho-lateral-ativo"
            value={carrinho.id ?? ''}
            disabled={carregando || carrinho.carrinhos.length === 0}
            onChange={(evento) => executar(() => ativar(Number(evento.target.value)))}
            className="w-full rounded-lg border border-tinta-300 bg-white px-3 py-2.5 text-sm
              focus:border-marca-500 focus:outline-none focus:ring-2 focus:ring-marca-100 disabled:bg-tinta-100"
          >
            {!carrinho.id && <option value="" disabled>Selecione um carrinho</option>}
            {carrinho.carrinhos.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nome} · {item.quantidade_pecas} {item.quantidade_pecas === 1 ? 'peça' : 'peças'}
              </option>
            ))}
          </select>
        </Campo>

        {erro && (
          <div className="space-y-2">
            <ErroGeral erro={erro} />
            <Botao type="button" variante="contorno" tamanho="pequeno" disabled={carregando} onClick={recarregar}>
              Tentar novamente
            </Botao>
          </div>
        )}

        {carregando && !carrinho.id ? (
          <Carregando texto="Carregando carrinho..." />
        ) : carrinho.itens.length === 0 ? (
          <div className="rounded-lg border border-dashed border-tinta-300 p-5 text-center">
            <p className="font-semibold text-tinta-800">Este carrinho está vazio</p>
            <p className="mt-2 text-sm text-tinta-500">Adicione as peças pelos botões do catálogo.</p>
          </div>
        ) : (
          <>
            {!carrinho.pronto_para_checkout && (
              <Alerta tipo="aviso">Ajuste ou remova os itens com pendência para fechar o pedido.</Alerta>
            )}
            <ul className="divide-y divide-tinta-200" aria-busy={carregando}>
              {carrinho.itens.map((item) => (
                <ItemCarrinhoLateral
                  key={`${carrinho.id}-${item.codigo_produto}`}
                  item={item}
                  ocupado={carregando}
                  aoAlterar={(codigo, quantidade) => executar(() => alterar(codigo, quantidade))}
                  aoRemover={(codigo) => executar(() => remover(codigo))}
                />
              ))}
            </ul>
          </>
        )}
      </div>

      <div className="space-y-3 border-t border-tinta-200 bg-tinta-50 p-4">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-tinta-600">{carrinho.quantidade_pecas} {carrinho.quantidade_pecas === 1 ? 'peça' : 'peças'}</span>
          <span className="text-lg font-bold text-tinta-900" aria-live="polite">{dinheiro.format(carrinho.valor_total)}</span>
        </div>
        <Botao
          type="button"
          className="w-full"
          disabled={carregando || !carrinho.pronto_para_checkout}
          onClick={() => { aoFechar(); navegar('/checkout'); }}
        >
          Fechar pedido
        </Botao>
        <button type="button" onClick={aoFechar}
          className="block w-full text-center text-sm text-marca-700 underline hover:text-marca-800">
          Continuar escolhendo peças
        </button>
      </div>
    </dialog>
  );
}
