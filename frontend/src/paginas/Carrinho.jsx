import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { dinheiro } from '../api/cliente.js';
import { useCarrinho } from '../contextos/CarrinhoContext.jsx';
import { ModalPendencias } from '../componentes/ModalPendencias.jsx';
import { GerenciadorCarrinhos } from '../componentes/GerenciadorCarrinhos.jsx';
import { Alerta, Botao, Carregando, EstadoVazio } from '../componentes/ui.jsx';

function LinhaItem({ item, aoAlterar, aoRemover, ocupado }) {
  return (
    <li className="flex gap-4 py-4">
      <img
        src={item.imagem_url}
        alt=""
        width="80"
        height="80"
        className="size-20 shrink-0 rounded-lg bg-tinta-100 object-contain p-1"
      />

      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase text-marca-700">{item.marca}</p>

        <h3 className="truncate text-sm font-semibold text-tinta-900">
          <Link to={`/produto/${item.codigo_produto}`} className="hover:underline">
            {item.descricao}
          </Link>
        </h3>

        <p className="mt-0.5 text-xs text-tinta-500">
          {item.codigo_produto} · {dinheiro.format(item.preco_unitario)} cada
        </p>

        {item.problema && (
          <p className="mt-1.5 text-xs font-medium text-amber-700">{item.problema}</p>
        )}

        <div className="mt-2 flex items-center gap-3">
          <label className="sr-only" htmlFor={`qtd-${item.codigo_produto}`}>
            Quantidade de {item.descricao}
          </label>
          <input
            id={`qtd-${item.codigo_produto}`}
            type="number"
            min="1"
            max={item.estoque ?? 99}
            value={item.quantidade}
            disabled={ocupado || !item.disponivel}
            onChange={(evento) => {
              const valor = Number(evento.target.value);
              if (valor >= 1) aoAlterar(item.codigo_produto, valor);
            }}
            className="w-20 rounded-lg border border-tinta-300 px-2 py-1.5 text-sm
              focus:border-marca-500 focus:outline-none focus:ring-2 focus:ring-marca-100
              disabled:bg-tinta-100"
          />

          <button
            type="button"
            onClick={() => aoRemover(item.codigo_produto)}
            disabled={ocupado}
            className="text-sm text-tinta-500 underline hover:text-red-600 disabled:opacity-50"
          >
            Remover
          </button>
        </div>
      </div>

      <p className="shrink-0 text-right text-sm font-bold text-tinta-900">
        {dinheiro.format(item.valor_total)}
      </p>
    </li>
  );
}

export function Carrinho() {
  const { carrinho, carregando, erro: erroCarrinho, recarregar, alterar, remover, limpar } = useCarrinho();
  const navegar = useNavigate();
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState(null);
  const [mostrarPendencias, setMostrarPendencias] = useState(false);
  const pendenciasAnteriores = useRef('');
  const itensPendentes = carrinho.itens.filter((item) => !item.disponivel);
  const codigosPendentes = itensPendentes.map((item) => item.codigo_produto).join(',');

  useEffect(() => {
    if (carregando) return;
    const atuais = `${carrinho.id}:${codigosPendentes}`;
    if (atuais === pendenciasAnteriores.current) return;
    pendenciasAnteriores.current = atuais;
    setMostrarPendencias(
      !carrinho.pronto_para_checkout && codigosPendentes.length > 0,
    );
  }, [carregando, carrinho.id, carrinho.pronto_para_checkout, codigosPendentes]);

  async function executar(acao) {
    setOcupado(true);
    setErro(null);
    try {
      await acao();
    } catch (falha) {
      setErro(falha);
    } finally {
      setOcupado(false);
    }
  }

  if (carregando && !carrinho.id) {
    return <Carregando texto="Carregando carrinho..." />;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-tinta-900">Carrinhos</h1>
      <GerenciadorCarrinhos ocupado={ocupado} />

      {mostrarPendencias && itensPendentes.length > 0 && (
        <ModalPendencias
          titulo="Remova os itens com pendência"
          descricao="Os itens abaixo não estão disponíveis na quantidade solicitada. Remova-os para continuar ao checkout."
          textoRemover="Remover"
          textoFechar="Voltar ao carrinho"
          textoIndisponivel="Item indisponível no momento."
          itens={itensPendentes}
          ocupado={ocupado || carregando}
          erro={erro}
          aoRemover={(codigo) => executar(() => remover(codigo))}
          aoFechar={() => setMostrarPendencias(false)}
        />
      )}

      <div className="flex items-center justify-between">
        <h2 className="min-w-0 break-words text-lg font-semibold text-tinta-900">{carrinho.nome}</h2>
        {carrinho.itens.length > 0 && (
          <button
            type="button"
            onClick={() => executar(limpar)}
            disabled={ocupado || carregando}
            className="text-sm text-tinta-500 underline hover:text-red-600 disabled:opacity-50"
          >
            Esvaziar
          </button>
        )}
      </div>

      {erro && <Alerta tipo="erro">{erro.message}</Alerta>}
      {erroCarrinho && !erro && !carrinho.id && (
        <Alerta tipo="erro">
          {erroCarrinho.message}
          <button type="button" onClick={recarregar} className="ml-2 underline">Tentar novamente</button>
        </Alerta>
      )}

      {carrinho.itens.length === 0 ? (
        <EstadoVazio
          titulo="Este carrinho está vazio"
          descricao="Procure a peça pelo nome, pela marca ou pelo carro em que ela se aplica."
          acao={<Link to="/"><Botao>Ver catálogo</Botao></Link>}
        />
      ) : (
        <>
          {!carrinho.pronto_para_checkout && (
            <Alerta tipo="aviso" titulo="Alguns itens precisam de ajuste">
              Ajuste ou remova os itens marcados abaixo para fechar o pedido.
            </Alerta>
          )}

          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="rounded-xl border border-tinta-200 bg-white px-5">
              <ul className="divide-y divide-tinta-200">
                {carrinho.itens.map((item) => (
                  <LinhaItem
                    key={item.codigo_produto}
                    item={item}
                    ocupado={ocupado || carregando}
                    aoAlterar={(codigo, quantidade) => executar(() => alterar(codigo, quantidade))}
                    aoRemover={(codigo) => executar(() => remover(codigo))}
                  />
                ))}
              </ul>
            </div>

            <aside className="h-fit rounded-xl border border-tinta-200 bg-white p-5 lg:sticky lg:top-24">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-tinta-500">Resumo</h2>

              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-tinta-600">Itens</dt>
                  <dd className="font-medium">{carrinho.quantidade_pecas}</dd>
                </div>
                <div className="flex justify-between border-t border-tinta-200 pt-3 text-base">
                  <dt className="font-semibold text-tinta-900">Total</dt>
                  <dd className="font-bold text-tinta-900">{dinheiro.format(carrinho.valor_total)}</dd>
                </div>
              </dl>

              <Botao
                type="button"
                tamanho="grande"
                className="mt-5 w-full"
                disabled={ocupado || carregando}
                onClick={() => {
                  if (!carrinho.pronto_para_checkout) {
                    setMostrarPendencias(true);
                    return;
                  }
                  navegar('/checkout');
                }}
              >
                Fechar pedido
              </Botao>

              <Link
                to="/"
                className="mt-3 block text-center text-sm text-tinta-600 underline hover:text-marca-700"
              >
                Continuar comprando
              </Link>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
