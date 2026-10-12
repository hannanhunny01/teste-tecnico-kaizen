import { obterBanco, agoraISO } from '../db/index.js';
import { ApiError } from '../lib/ApiError.js';

export function buscarCarrinho(usuarioId, carrinhoId, db = obterBanco()) {
  const carrinho = db.prepare('SELECT * FROM carrinhos WHERE id = ? AND usuario_id = ?')
    .get(carrinhoId, usuarioId);
  if (!carrinho) throw ApiError.naoEncontrado('Carrinho nao encontrado.');
  return carrinho;
}

function gravarAtivo(usuarioId, carrinhoId, db) {
  db.prepare(`
    INSERT INTO carrinhos_ativos (usuario_id, carrinho_id) VALUES (?, ?)
    ON CONFLICT (usuario_id) DO UPDATE SET carrinho_id = excluded.carrinho_id
  `).run(usuarioId, carrinhoId);
}

export function obterCarrinhoAtivo(usuarioId, db = obterBanco()) {
  return db.transaction(() => {
    const ativo = db.prepare(`
      SELECT carrinho.* FROM carrinhos carrinho
      JOIN carrinhos_ativos ativo ON ativo.carrinho_id = carrinho.id
      WHERE ativo.usuario_id = ? AND carrinho.usuario_id = ?
    `).get(usuarioId, usuarioId);
    if (ativo) return ativo;

    let primeiro = db.prepare('SELECT * FROM carrinhos WHERE usuario_id = ? ORDER BY id LIMIT 1')
      .get(usuarioId);
    if (!primeiro) {
      const agora = agoraISO();
      const resultado = db.prepare(`
        INSERT INTO carrinhos (usuario_id, nome, criado_em, atualizado_em) VALUES (?, ?, ?, ?)
      `).run(usuarioId, 'Meu carrinho', agora, agora);
      primeiro = buscarCarrinho(usuarioId, resultado.lastInsertRowid, db);
    }
    gravarAtivo(usuarioId, primeiro.id, db);
    return primeiro;
  })();
}

export function resolverCarrinho(usuarioId, carrinhoId, db = obterBanco()) {
  return carrinhoId == null
    ? obterCarrinhoAtivo(usuarioId, db)
    : buscarCarrinho(usuarioId, carrinhoId, db);
}

export function listarCarrinhos(usuarioId, db = obterBanco()) {
  const ativo = obterCarrinhoAtivo(usuarioId, db);
  const carrinhos = db.prepare(`
    SELECT carrinho.id, carrinho.nome, carrinho.criado_em, carrinho.atualizado_em,
           COUNT(item.id) AS quantidade_produtos,
           COALESCE(SUM(item.quantidade), 0) AS quantidade_pecas
      FROM carrinhos carrinho
      LEFT JOIN carrinho_itens item ON item.carrinho_id = carrinho.id
     WHERE carrinho.usuario_id = ?
     GROUP BY carrinho.id ORDER BY carrinho.id
  `).all(usuarioId);
  return { carrinhos, carrinho_ativo_id: ativo.id };
}

function exigirNomeLivre(usuarioId, nome, db, carrinhoId = null) {
  const existente = db.prepare('SELECT id FROM carrinhos WHERE usuario_id = ? AND nome = ?')
    .get(usuarioId, nome);
  if (existente && existente.id !== carrinhoId) {
    throw ApiError.conflito('NOME_CARRINHO_EM_USO', 'Voce ja tem um carrinho com esse nome.', [
      { campo: 'nome', mensagem: 'Escolha outro nome.' },
    ]);
  }
}

export function criarCarrinho(usuarioId, nome, db = obterBanco()) {
  return db.transaction(() => {
    exigirNomeLivre(usuarioId, nome, db);
    const agora = agoraISO();
    const resultado = db.prepare(`
      INSERT INTO carrinhos (usuario_id, nome, criado_em, atualizado_em) VALUES (?, ?, ?, ?)
    `).run(usuarioId, nome, agora, agora);
    gravarAtivo(usuarioId, resultado.lastInsertRowid, db);
    return buscarCarrinho(usuarioId, resultado.lastInsertRowid, db);
  })();
}

export function renomearCarrinho(usuarioId, carrinhoId, nome, db = obterBanco()) {
  return db.transaction(() => {
    buscarCarrinho(usuarioId, carrinhoId, db);
    exigirNomeLivre(usuarioId, nome, db, carrinhoId);
    db.prepare('UPDATE carrinhos SET nome = ?, atualizado_em = ? WHERE id = ? AND usuario_id = ?')
      .run(nome, agoraISO(), carrinhoId, usuarioId);
    return buscarCarrinho(usuarioId, carrinhoId, db);
  })();
}

export function ativarCarrinho(usuarioId, carrinhoId, db = obterBanco()) {
  const carrinho = buscarCarrinho(usuarioId, carrinhoId, db);
  gravarAtivo(usuarioId, carrinho.id, db);
  return carrinho;
}

export function removerCarrinho(usuarioId, carrinhoId, db = obterBanco()) {
  return db.transaction(() => {
    buscarCarrinho(usuarioId, carrinhoId, db);
    db.prepare('DELETE FROM carrinhos WHERE id = ? AND usuario_id = ?').run(carrinhoId, usuarioId);
    // Sempre deixa um carrinho disponivel para receber pecas do catalogo.
    return obterCarrinhoAtivo(usuarioId, db);
  })();
}
