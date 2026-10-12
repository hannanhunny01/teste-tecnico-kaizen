DELETE  from carrinho_itens ;
DELETE  from usuarios ;
DELETE  from pedidos_usuario ;
DELETE  from enderecos ;

INSERT INTO usuarios (
  nome, email, senha_hash, documento, telefone,
  criado_em, atualizado_em
)
VALUES (
  'Usuario Teste',
  'c@c.com',
  'scrypt$16384$8$1$sRmMVyq04NMzatzgkyFAQA==$X+hge1QR+gnWrRsOqwIbm6bT20BOdJXfssEffDASVoGA19KedhvfAyAOyW1zSBRgNOYJSWaw//K6SxTP8zakgA==',
  '00000000000',
  NULL,
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
)
ON CONFLICT (email) DO UPDATE SET
  senha_hash = excluded.senha_hash,
  atualizado_em = excluded.atualizado_em;

INSERT INTO enderecos (
  usuario_id, apelido, cep, logradouro, numero,
  complemento, bairro, cidade, uf, principal,
  criado_em, atualizado_em
)
VALUES (
  2,
  'Oficina',
  '01001-000',
  'Rua de Teste',
  '100',
  NULL,
  'Centro',
  'São Paulo',
  'SP',
  CASE WHEN EXISTS (
    SELECT 1 FROM enderecos
    WHERE usuario_id = 2 AND principal = 1
  ) THEN 0 ELSE 1 END,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);