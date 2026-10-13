import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api/cliente.js';

const AuthContext = createContext(null);
const EVENTO_SESSAO = 'kaizen-sessao';

function avisarOutrasAbas(acao) {
  try {
    // So um aviso: cookie, token e dados pessoais nao vao para o localStorage.
    localStorage.setItem(EVENTO_SESSAO, `${acao}:${Date.now()}:${Math.random()}`);
  } catch {
    // O login continua funcionando se o navegador bloquear o armazenamento.
  }
}

/**
 * Nao existe token no JavaScript: a sessao vive num cookie httpOnly.
 * O front pergunta ao servidor no boot e quando outra aba muda a sessao.
 */
export function ProvedorAuth({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const versao = useRef(0);
  const saidaPendente = useRef(null);

  const encerrarSessao = useCallback(() => {
    versao.current += 1;
    setUsuario(null);
    setCarregando(false);
  }, []);

  const conferirSessao = useCallback(async () => {
    const atual = ++versao.current;
    setCarregando(true);
    try {
      const resposta = await api.auth.eu();
      if (atual === versao.current) setUsuario(resposta.dados);
    } catch {
      // 401 aqui e o caso normal de visitante sem sessao.
      if (atual === versao.current) setUsuario(null);
    } finally {
      if (atual === versao.current) setCarregando(false);
    }
  }, []);

  useEffect(() => {
    conferirSessao();
    function sincronizar(evento) {
      if (evento.key !== EVENTO_SESSAO || !evento.newValue) return;
      encerrarSessao();
      if (evento.newValue.startsWith('entrar:')) conferirSessao();
    }
    window.addEventListener('storage', sincronizar);
    return () => {
      versao.current += 1;
      window.removeEventListener('storage', sincronizar);
    };
  }, [conferirSessao, encerrarSessao]);

  const autenticar = useCallback(async (acao, dados) => {
    const atual = ++versao.current;
    setCarregando(true);
    try {
      // O logout anterior precisa terminar de limpar o cookie antes do login.
      await saidaPendente.current?.catch(() => {});
      if (atual !== versao.current) throw new Error('A sessao mudou. Tente entrar novamente.');
      const resposta = await acao(dados);
      if (atual === versao.current) {
        setUsuario(resposta.dados);
        avisarOutrasAbas('entrar');
      }
      return resposta.dados;
    } finally {
      if (atual === versao.current) setCarregando(false);
    }
  }, []);

  const entrar = useCallback((dados) => autenticar(api.auth.entrar, dados), [autenticar]);
  const cadastrar = useCallback((dados) => autenticar(api.auth.cadastrar, dados), [autenticar]);

  const sair = useCallback(async () => {
    encerrarSessao();
    const atual = versao.current;
    const requisicao = api.auth.sair();
    saidaPendente.current = requisicao;
    try {
      await requisicao;
    } finally {
      if (saidaPendente.current === requisicao) saidaPendente.current = null;
      if (atual === versao.current) avisarOutrasAbas('sair');
    }
  }, [encerrarSessao]);

  const atualizarUsuario = useCallback((dados) => {
    // Uma resposta atrasada do perfil nao pode restaurar outra conta.
    setUsuario((atual) => atual && atual.id === dados.id ? dados : atual);
  }, []);

  const valor = useMemo(
    () => ({ usuario, carregando, autenticado: usuario !== null, entrar, cadastrar, sair,
      setUsuario: atualizarUsuario, encerrarSessao }),
    [usuario, carregando, entrar, cadastrar, sair, atualizarUsuario, encerrarSessao],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error('useAuth precisa estar dentro de <ProvedorAuth>.');
  return contexto;
}
