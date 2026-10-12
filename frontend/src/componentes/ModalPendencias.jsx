import { Modal } from './Modal.jsx';
import { Alerta, Botao } from './ui.jsx';

export function ModalPendencias({
  itens,
  ocupado,
  erro,
  aoRemover,
  aoFechar,
  titulo,
  descricao,
  textoRemover,
  textoFechar,
  textoIndisponivel,
}) {
  return (
    <Modal
      titulo={titulo}
      descricao={descricao}
      ocupado={ocupado}
      aoFechar={aoFechar}
      rodape={
        <Botao type="button" variante="contorno" disabled={ocupado} onClick={aoFechar}>
          {textoFechar}
        </Botao>
      }
    >

      {erro && <Alerta tipo="erro" className="mt-4">{erro.message}</Alerta>}

      <ul className="mt-4 divide-y divide-tinta-200">
        {itens.map((item) => (
          <li key={item.codigo_produto} className="flex items-center justify-between gap-4 py-4">
            <div className="min-w-0">
              <p className="break-words font-semibold text-tinta-900">{item.descricao}</p>
              <p className="mt-1 text-xs text-tinta-500">{item.codigo_produto}</p>
              <p className="mt-1 text-sm text-amber-700">
                {item.problema || textoIndisponivel}
              </p>
            </div>
            <Botao
              type="button"
              variante="contorno"
              tamanho="pequeno"
              className="shrink-0"
              disabled={ocupado}
              aria-label={`${textoRemover} ${item.descricao}`}
              onClick={() => aoRemover(item.codigo_produto)}
            >
              {textoRemover}
            </Botao>
          </li>
        ))}
      </ul>

    </Modal>
  );
}
