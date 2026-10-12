import { Router } from 'express';
import { autenticar } from '../middleware/autenticacao.js';
import {
  adicionarItem,
  alterarQuantidade,
  lerCarrinho,
  limparCarrinho,
  removerItem,
  MAXIMO_POR_ITEM,
} from '../services/carrinhoService.js';
import { ColetorDeErros, exigirObjeto, inteiroPositivo, textoObrigatorio } from '../lib/validacao.js';
import {
  ativarCarrinho,
  criarCarrinho,
  listarCarrinhos,
  removerCarrinho,
  renomearCarrinho,
  resolverCarrinho,
} from '../services/carrinhosService.js';

function criarRotasItensCarrinho({ porId = false } = {}) {
  const rotas = Router({ mergeParams: true });

  /** Carrinho e por usuario e fica no banco: fechar o navegador nao perde nada. */
  rotas.get('/', async (req, res) => {
    res.json({ dados: await lerCarrinho(req.usuario.id, undefined, req.carrinhoId) });
  });

  rotas.post('/itens', async (req, res) => {
    const corpo = exigirObjeto(req.body);
    const erros = new ColetorDeErros();

    const codigo = textoObrigatorio(corpo.codigo_produto, 'codigo_produto', erros, { min: 1, max: 40 });
    const quantidade = inteiroPositivo(corpo.quantidade ?? 1, 'quantidade', erros, { max: MAXIMO_POR_ITEM });

    erros.lancarSeInvalido('Nao foi possivel adicionar ao carrinho.');

    res.status(201).json({ dados: await adicionarItem(req.usuario.id, codigo, quantidade, undefined, req.carrinhoId) });
  });

  rotas.patch('/itens/:codigo', async (req, res) => {
    const corpo = exigirObjeto(req.body);
    const erros = new ColetorDeErros();

    const quantidade = inteiroPositivo(corpo.quantidade, 'quantidade', erros, { max: MAXIMO_POR_ITEM });

    erros.lancarSeInvalido('Quantidade invalida.');

    res.json({ dados: await alterarQuantidade(req.usuario.id, req.params.codigo, quantidade, undefined, req.carrinhoId) });
  });

  rotas.delete('/itens/:codigo', async (req, res) => {
    res.json({ dados: await removerItem(req.usuario.id, req.params.codigo, undefined, req.carrinhoId) });
  });

  rotas.delete(porId ? '/itens' : '/', async (req, res) => {
    const carrinho = resolverCarrinho(req.usuario.id, req.carrinhoId);
    limparCarrinho(req.usuario.id, undefined, carrinho.id);
    res.json({ dados: await lerCarrinho(req.usuario.id, undefined, carrinho.id) });
  });

  return rotas;
}

export const rotasCarrinho = Router();
rotasCarrinho.use(autenticar);
rotasCarrinho.use(criarRotasItensCarrinho());

export const rotasCarrinhos = Router();
rotasCarrinhos.use(autenticar);

rotasCarrinhos.param('id', (req, _res, next, valor) => {
  const erros = new ColetorDeErros();
  req.carrinhoId = inteiroPositivo(valor, 'carrinho_id', erros, { max: 1e9 });
  erros.lancarSeInvalido('Carrinho invalido.');
  next();
});

function lerNome(corpo) {
  const erros = new ColetorDeErros();
  const nome = textoObrigatorio(exigirObjeto(corpo).nome, 'nome', erros, { max: 80 });
  erros.lancarSeInvalido('Informe um nome para o carrinho.');
  return nome;
}

rotasCarrinhos.get('/', (req, res) => {
  const { carrinhos, carrinho_ativo_id } = listarCarrinhos(req.usuario.id);
  res.json({ dados: carrinhos, carrinho_ativo_id });
});

rotasCarrinhos.post('/', async (req, res) => {
  const carrinho = criarCarrinho(req.usuario.id, lerNome(req.body));
  res.status(201).location(`/api/carrinhos/${carrinho.id}`).json({
    dados: await lerCarrinho(req.usuario.id, undefined, carrinho.id),
  });
});

rotasCarrinhos.patch('/:id', async (req, res) => {
  renomearCarrinho(req.usuario.id, req.carrinhoId, lerNome(req.body));
  res.json({ dados: await lerCarrinho(req.usuario.id) });
});

rotasCarrinhos.put('/:id/ativo', async (req, res) => {
  const carrinho = ativarCarrinho(req.usuario.id, req.carrinhoId);
  res.json({ dados: await lerCarrinho(req.usuario.id, undefined, carrinho.id) });
});

rotasCarrinhos.delete('/:id', async (req, res) => {
  const carrinho = removerCarrinho(req.usuario.id, req.carrinhoId);
  res.json({ dados: await lerCarrinho(req.usuario.id, undefined, carrinho.id) });
});

rotasCarrinhos.use('/:id', criarRotasItensCarrinho({ porId: true }));
