import { useEffect, useId, useRef } from 'react';

export function Modal({ titulo, descricao, ocupado, aoFechar, children, rodape }) {
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
      aria-describedby={descricao ? descricaoId : undefined}
      onCancel={(evento) => {
        evento.preventDefault();
        if (!ocupado) aoFechar();
      }}
      className="m-auto max-h-[80vh] w-[calc(100%_-_2rem)] max-w-lg overflow-y-auto
        rounded-xl border border-tinta-200 bg-white p-6 text-tinta-800 shadow-xl
        backdrop:bg-tinta-900/60"
    >
      <h2 id={tituloId} className="text-xl font-bold text-tinta-900">{titulo}</h2>
      {descricao && <p id={descricaoId} className="mt-2 text-sm text-tinta-600">{descricao}</p>}
      {children}
      {rodape && (
        <div className="mt-4 flex justify-end gap-2 border-t border-tinta-200 pt-4">{rodape}</div>
      )}
    </dialog>
  );
}
