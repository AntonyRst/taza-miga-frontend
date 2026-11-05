import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { useIdioma } from '../../context/IdiomaContext.jsx';

export default function ModalCancelarPedido({ orden, onCerrar, onConfirmar, procesando }) {
  const { t } = useIdioma();
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const motivoLimpio = motivo.trim();
    if (!motivoLimpio || motivoLimpio.length < 2) {
      setError(t.kds.motivoRequerido);
      return;
    }
    setError('');
    onConfirmar(motivoLimpio);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-md bg-[#231B1D] text-[#F5EDE8] rounded-[var(--radio-medio)] border border-[#3D2E32] shadow-xl p-5 flex flex-col gap-4">
        {/* Cabecera */}
        <div className="flex items-center justify-between pb-3 border-b border-[#3D2E32]">
          <div className="flex items-center gap-2 text-rose-400">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <h2 className="font-serif font-bold text-lg text-white">
              {t.kds.modalCancelarTitulo} #{orden.numeroOrden}
            </h2>
          </div>
          <button
            onClick={onCerrar}
            disabled={procesando}
            className="p-1 rounded-[var(--radio-chico)] text-[#A8989C] hover:text-white hover:bg-[#3D2E32] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Descripción */}
        <p className="text-xs text-[#A8989C]">
          {t.kds.modalCancelarSubtitulo} ({orden.nombreCliente})
        </p>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <textarea
              rows={3}
              value={motivo}
              onChange={(e) => {
                setMotivo(e.target.value);
                if (error) setError('');
              }}
              placeholder={t.kds.motivoPlaceholder}
              className="w-full px-3 py-2 text-sm bg-[#181214] border border-[#3D2E32] rounded-[var(--radio-chico)] text-[#F5EDE8] placeholder-[#A8989C]/50 focus:outline-hidden focus:border-[var(--color-accion)] resize-none"
              maxLength={255}
              autoFocus
            />
            {error && (
              <p className="text-xs text-rose-400 mt-1">{error}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCerrar}
              disabled={procesando}
              className="px-3 py-2 text-xs font-medium text-[#A8989C] hover:text-white hover:bg-[#3D2E32] rounded-[var(--radio-chico)] transition-colors cursor-pointer"
            >
              {t.kds.cancelarVolver}
            </button>
            <button
              type="submit"
              disabled={procesando}
              className="px-4 py-2 text-xs font-semibold bg-rose-700 hover:bg-rose-800 text-white rounded-[var(--radio-chico)] transition-colors cursor-pointer disabled:opacity-50"
            >
              {procesando ? t.confirmacion.procesando : t.kds.confirmarCancelar}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
