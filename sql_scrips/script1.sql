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
  'teste123@example.com',
  'scrypt$16384$8$1$CX3FjeOhrNzWOGCP5OMsLw==$l5jpsL+90lWvZQWjYs4SFKSB2+n6nkfLSb5oPSP+SWt12e8KYK0Cp2EWG4e6xQHFgoRkKqrnhmO0utF3KwMLzQ==',
  '00000000000',
  NULL,
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
);

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