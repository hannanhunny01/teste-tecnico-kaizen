# Relatório de entrega

> Preencha este arquivo e entregue junto com o código. Ele é lido antes do
> código e serve de base para a conversa de devolutiva.
>
> **Escreva direto.** Frase curta vale mais que parágrafo bonito. Se alguma
> seção não se aplica, escreva "não se aplica" e siga — deixar em branco deixa
> a dúvida se você pulou ou se esqueceu.
>
> Apague estas instruções em itálico conforme for preenchendo.

**Candidato:**
**Data de entrega:**
**Tempo aproximado dedicado:**

---

## 1. Subindo o projeto

*Como você colocou a aplicação no ar? O que foi mais difícil ou confuso?*



*Precisou criar algum arquivo que não estava no repositório? Qual?*



---

## 2. Chamados reportados

Um bloco por chamado. **Causa** é o que estava errado no código, não o sintoma
que o cliente descreveu.

### KZN-312 — Total do carrinho vem maior que a soma das peças

| | |
|---|---|
| **Causa** | O item sem estoque era marcado como indisponível, mas seu valor ainda entrava no total do carrinho. |
| **Como reproduzi** | Radiador `ARR-7002` já no carrinho, com preço de R$ 684,00 e estoque zero no ERP. Esse valor era somado mesmo com o aviso de indisponibilidade. |
| **Arquivos alterados** | `backend/src/services/carrinhoService.js` e `frontend/src/paginas/Carrinho.jsx`. Adicionei `frontend/src/componentes/ModalPendencias.jsx`. |
| **Como validei a correção** | Adicionei um script SQL que permitia para incluir produtos  no carrinho sem estoque, e backend estava calculando o preço de itens que não estavam mais disponíveis também implementei um modal para alertar o usuário sobre esses produtos indisponíveis ou sem estoque |

Agora, itens indisponíveis têm subtotal zero. O preço unitário e o aviso
continuam visíveis. Também adicionei um modal que mostra os itens com pendência
e permite removê-los antes de seguir para o checkout. O modal ficou em um
componente separado, com os textos recebidos por props.

Trecho revisado: `KZN-7F3A`.

### KZN-318 — Número no ícone do carrinho está errado

| | |
|---|---|
| **Causa** | `quantidade_pecas` usava `itens.length`, contando os produtos diferentes sem considerar quantas unidades havia de cada um. |
| **Como reproduzi** | Carrinho com dois produtos, um com 3 unidades e outro com 4. O contador mostrava 2, embora houvesse 7 peças. |
| **Arquivos alterados** | `backend/src/services/carrinhoService.js`. |
| **Como validei a correção** | Conferi o retorno do serviço com 3 + 4 unidades: retornou 7 peças. Também conferi o carrinho vazio, que retornou zero. |

Agora, `quantidade_pecas` soma as unidades de cada produto. Mantive
`quantidade_itens` e adicionei `quantidade_produtos` para informar quantos
produtos diferentes estão no carrinho. O ícone e o resumo já usam
`quantidade_pecas`.

### KZN-325 — Busca diz que não encontrou peça que existe

| | |
|---|---|
| **Causa** | A busca mantinha a página anterior na URL. Se os resultados da pesquisa tinham menos páginas, a consulta retornava vazia mesmo com produtos encontrados. O mesmo acontecia ao mudar os filtros. |
| **Como reproduzi** | Acessar `/?pagina=2` e pesquisar "agua" olhando para requisição enviado apra backend.  A busca continuava pedindo a página 2, em vez de começar na primeira página dos resultados. |
| **Arquivos alterados** | `frontend/src/componentes/Cabecalho.jsx` e `frontend/src/paginas/Catalogo.jsx`. |
| **Como validei a correção** | Conferi as URLs geradas ao pesquisar, limpar a busca e mudar categoria ou filtro de estoque.  |

Agora, pesquisar ou mudar um filtro remove `pagina` da URL e volta para a
página 1. Os outros filtros continuam aplicados.

Trecho revisado: `KZN-5D1E`.

### KZN-331 — Pedido saiu com o endereço errado

| | |
|---|---|
| **Causa** | Ao enviar o pedido, o checkout buscava o endereço principal e ignorava o endereço escolhido na tela. |
| **Como reproduzi** | Casa como endereço principal e Oficina como outro endereço. Mesmo selecionando Oficina, o checkout enviava o ID da Casa. |
| **Arquivos alterados** | `frontend/src/paginas/Checkout.jsx`. |
| **Como validei a correção** | Simulei a seleção de Casa, Oficina e um novo endereço e conferi o `endereco_id` enviado em cada caso. |

Agora, o pedido usa `enderecoId`, que guarda o endereço selecionado pelo
cliente. O principal fica apenas como seleção inicial do checkout.

---

## 3. Problemas que encontrei por conta própria

*Os chamados não cobrem tudo. Liste aqui o que você encontrou sozinho —
inclusive o que decidiu **não** corrigir. Repita o bloco quantas vezes precisar.*

*Achar e documentar um problema conta a favor mesmo sem a correção. Deixar de
relatar algo que você viu conta contra.*/

### Problema 1

| | |
|---|---|
| **O que está errado** | |
| **Como cheguei nele** | |
| **Impacto** | *quem é afetado e como* |
| **Corrigi?** | sim / não — e por quê |
| **Arquivos alterados** | |

### Problema 2

| | |
|---|---|
| **O que está errado** | |
| **Como cheguei nele** | |
| **Impacto** | |
| **Corrigi?** | |
| **Arquivos alterados** | |

### Problema 3

| | |
|---|---|
| **O que está errado** | |
| **Como cheguei nele** | |
| **Impacto** | |
| **Corrigi?** | |
| **Arquivos alterados** | |

---

## 4. Múltiplos carrinhos

### Como ficou

*Descreva a solução em algumas linhas: o que a pessoa consegue fazer agora.*



### Modelagem

*Como ficou no banco. Tabelas, colunas e relações que você criou ou alterou.*



*Mudanças no contrato da API — endpoints novos ou alterados:*

| Método | Rota | O que faz |
|---|---|---|
| | | |

### Decisões que o enunciado deixou abertas

*Responda o que você decidiu e **por quê**. Não existe resposta certa; existe
decisão pensada.*

| Pergunta | Sua decisão | Motivo |
|---|---|---|
| Quantos carrinhos por pessoa? Tem limite? | | |
| O que acontece ao apagar o carrinho ativo? | | |
| Como o carrinho aparece na vitrine? | | |
| E no celular? | | |
| Qual carrinho vem selecionado ao entrar? | | |
| O que acontece com os carrinhos após fechar um pedido? | | |

### Isolamento

*O que impede o carrinho de um cliente aparecer para outro?*



---

## 5. Como testei

*O que você fez para confirmar que funciona e que não quebrou nada. Teste
manual conta — descreva o caminho que percorreu.*



*Se escreveu testes automatizados, diga como rodar:*



---

## 6. Decisões e suposições

*Algo que o enunciado não respondia e você assumiu? Registre aqui.*



*Discordou de alguma coisa que já estava no projeto? O que faria diferente?*



---

## 7. O que faria com mais tempo

*O que ficou de fora, em ordem do que você atacaria primeiro.*

1.
2.
3.

---

## 8. Outras observações

*Espaço livre. Qualquer coisa que você queira registrar e que não coube acima.*


