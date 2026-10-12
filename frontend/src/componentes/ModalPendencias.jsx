import { useEffect, useId, useRef } from 'react';
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
  const dialogoRef = useRef(null);
  const tituloId = useId();
  const descricaoId = useId();

  useEffect(() => {
    const dialogo = dialogoRef.current;
    const overflowAnterior = document.body.style.overflow;
    dialogo.showModal();
    document.body.style.overflow = 'hidden';

    return () => {
      dialogo.close();
      document.body.style.overflow = overflowAnterior;
    };
  }, []);

  return (
    <dialog
      ref={dialogoRef}
      aria-labelledby={tituloId}
      aria-describedby={descricaoId}
      onCancel={(evento) => {
        evento.preventDefault();
        if (!ocupado) aoFechar();
      }}
      className="m-auto max-h-[80vh] w-[calc(100%_-_2rem)] max-w-lg overflow-y-auto
        rounded-xl border border-tinta-200 bg-white p-6 text-tinta-800 shadow-xl
        backdrop:bg-tinta-900/60"
    >
      <h2 id={tituloId} className="text-xl font-bold text-tinta-900">
        {titulo}
      </h2>
      <p id={descricaoId} className="mt-2 text-sm text-tinta-600">
        {descricao}
      </p>

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

      <div className="mt-4 flex justify-end border-t border-tinta-200 pt-4">
        <Botao type="button" variante="contorno" disabled={ocupado} onClick={aoFechar}>
          {textoFechar}
        </Botao>
      </div>
    </dialog>
  );
}
