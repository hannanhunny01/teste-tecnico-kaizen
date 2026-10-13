import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api/cliente.js';
import { useAuth } from './AuthContext.jsx';

const CarrinhoContext = createContext(null);

const VAZIO = {
  id: null,
  nome: '',
  carrinhos: [],
  itens: [],
  quantidade_itens: 0,
  quantidade_produtos: 0,
  quantidade_pecas: 0,
  valor_total: 0,
  pronto_para_checkout: false,
};

/**
 * O carrinho mora no servidor, nao no localStorage: trocar de navegador ou de
 * celular mantem o que a pessoa escolheu, e o estoque e sempre conferido
 * contra o ERP na hora de ler.
 */
export function ProvedorCarrinho({ children }) {
  const { usuario, carregando } = useAuth();
  // Trocar de conta descarta imediatamente o estado e as respostas da anterior.
  return (
    <CarrinhoDaSessao key={usuario?.id ?? 'visitante'} usuarioId={usuario?.id} verificandoSessao={carregando}>
      {children}
    </CarrinhoDaSessao>
  );
}

function CarrinhoDaSessao({ children, usuarioId, verificandoSessao }) {
  const { encerrarSessao } = useAuth();
  const [carrinho, setCarrinho] = useState(VAZIO);
  const [carregando, setCarregando] = useState(Boolean(usuarioId));
  const [erro, setErro] = useState(null);
  const versao = useRef(0);

  const executar = useCallback(async (acao) => {
    const atual = ++versao.current;
    setCarregando(true);
    setErro(null);
    try {
      const resposta = await acao();
      let dados = resposta.dados;
      // Outra aba pode ter trocado o ativo durante uma alteracao de itens.
      if (dados.id !== dados.carrinho_ativo_id) dados = (await api.carrinho.ler()).dados;
      if (atual === versao.current) setCarrinho(dados);
      return dados;
    } catch (falha) {
      if (atual === versao.current) {
        if (falha.ehSessaoExpirada) encerrarSessao();
        else setErro(falha);
      }
      throw falha;
    } finally {
      if (atual === versao.current) setCarregando(false);
    }
  }, [encerrarSessao]);

  const recarregar = useCallback(async () => {
    if (!usuarioId) return;
    // A tela pode oferecer nova tentativa; falha de rede nao apaga os itens.
    try {
      await executar(() => api.carrinho.ler());
    } catch {
      // O erro fica no contexto para a tela oferecer uma nova tentativa.
    }
  }, [usuarioId, executar]);

  useEffect(() => {
    if (verificandoSessao) return;
    if (usuarioId) recarregar();
    else setCarregando(false);
    return () => { versao.current += 1; };
  }, [usuarioId, verificandoSessao, recarregar]);

  const executarNoCarrinho = useCallback((acao) => {
    if (!carrinho.id) return Promise.reject(new Error('Carregue o carrinho antes de adicionar ou alterar itens.'));
    const id = carrinho.id;
    return executar(() => acao(id));
  }, [carrinho.id, executar]);

  const adicionar = useCallback((codigo, quantidade = 1) =>
    executarNoCarrinho((id) => api.carrinho.adicionar(codigo, quantidade, id)), [executarNoCarrinho]);
  const alterar = useCallback((codigo, quantidade) =>
    executarNoCarrinho((id) => api.carrinho.alterar(codigo, quantidade, id)), [executarNoCarrinho]);
  const remover = useCallback((codigo) =>
    executarNoCarrinho((id) => api.carrinho.remover(codigo, id)), [executarNoCarrinho]);
  const limpar = useCallback(() =>
    executarNoCarrinho((id) => api.carrinho.limpar(id)), [executarNoCarrinho]);

  const criar = useCallback((nome) => executar(() => api.carrinhos.criar(nome)), [executar]);
  const renomear = useCallback((id, nome) => executar(() => api.carrinhos.renomear(id, nome)), [executar]);
  const ativar = useCallback((id) => executar(() => api.carrinhos.ativar(id)), [executar]);
  const excluir = useCallback((id) => executar(() => api.carrinhos.remover(id)), [executar]);

  const valor = useMemo(
    () => ({
      carrinho, carregando: carregando || verificandoSessao, erro,
      recarregar, adicionar, alterar, remover, limpar, criar, renomear, ativar, excluir,
    }),
    [carrinho, carregando, verificandoSessao, erro, recarregar, adicionar, alterar, remover, limpar, criar, renomear, ativar, excluir],
  );

  return <CarrinhoContext.Provider value={valor}>{children}</CarrinhoContext.Provider>;
}

export function useCarrinho() {
  const contexto = useContext(CarrinhoContext);
  if (!contexto) throw new Error('useCarrinho precisa estar dentro de <ProvedorCarrinho>.');
  return contexto;
}
