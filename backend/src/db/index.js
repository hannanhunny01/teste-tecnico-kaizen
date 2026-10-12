import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { config } from '../config.js';

let instancia = null;

export function obterBanco() {
  if (instancia) return instancia;

  fs.mkdirSync(path.dirname(config.caminhoBanco), { recursive: true });
  instancia = new Database(config.caminhoBanco);

  instancia.pragma('journal_mode = WAL');
  instancia.pragma('foreign_keys = ON');
  instancia.pragma('busy_timeout = 5000');

  return instancia;
}

export function aplicarSchema(db = obterBanco()) {
  const ddl = fs.readFileSync(new URL('./schema.sql', import.meta.url), 'utf8');
  db.transaction(() => {
    const colunas = db.pragma('table_info(carrinho_itens)');
    const legado = colunas.some((coluna) => coluna.name === 'usuario_id');

    if (legado) db.exec('ALTER TABLE carrinho_itens RENAME TO carrinho_itens_legado');
    db.exec(ddl);

    db.exec(`
      INSERT INTO carrinhos (usuario_id, nome, criado_em, atualizado_em)
      SELECT id, 'Meu carrinho', criado_em, atualizado_em FROM usuarios
       WHERE NOT EXISTS (SELECT 1 FROM carrinhos WHERE usuario_id = usuarios.id);

      INSERT INTO carrinhos_ativos (usuario_id, carrinho_id)
      SELECT id, (SELECT id FROM carrinhos WHERE usuario_id = usuarios.id ORDER BY id LIMIT 1)
        FROM usuarios
       WHERE NOT EXISTS (SELECT 1 FROM carrinhos_ativos WHERE usuario_id = usuarios.id);
    `);

    if (legado) {
      const { total } = db.prepare('SELECT COUNT(*) AS total FROM carrinho_itens_legado').get();
      const copiados = db.prepare(`
        INSERT INTO carrinho_itens (id, carrinho_id, codigo_produto, quantidade, adicionado_em)
        SELECT item.id, ativo.carrinho_id, item.codigo_produto, item.quantidade, item.adicionado_em
          FROM carrinho_itens_legado item
          JOIN carrinhos_ativos ativo ON ativo.usuario_id = item.usuario_id
      `).run();
      if (copiados.changes !== total) throw new Error('Nao foi possivel migrar todos os itens do carrinho.');
      db.exec('DROP TABLE carrinho_itens_legado');
    }
  })();
}

export function fecharBanco() {
  if (instancia) {
    instancia.close();
    instancia = null;
  }
}

export function agoraISO() {
  return new Date().toISOString();
}
