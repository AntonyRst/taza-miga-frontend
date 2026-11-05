import { X, Printer } from 'lucide-react';
import { useIdioma } from '../../context/IdiomaContext.jsx';

export default function ModalTicketImpresion({ ticket, onCerrar, onReimprimir, procesando }) {
  const { t } = useIdioma();

  const handleImprimir = () => {
    // Si ya existe función de registrar reimpresión en servidor, la invoca (RN-24)
    if (onReimprimir) {
      onReimprimir();
    }
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      {/* Estilos específicos para impresión en papel térmico de ticket */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #ticket-termico-area, #ticket-termico-area * {
            visibility: visible !important;
          }
          #ticket-termico-area {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      <div className="w-full max-w-lg bg-[#231B1D] text-[#F5EDE8] rounded-[var(--radio-medio)] border border-[#3D2E32] shadow-2xl p-5 flex flex-col gap-4 max-h-[90vh]">
        {/* Cabecera */}
        <div className="flex items-center justify-between pb-3 border-b border-[#3D2E32]">
          <div className="flex items-center gap-2 text-[var(--color-accion)]">
            <Printer className="w-5 h-5 shrink-0" />
            <h2 className="font-serif font-bold text-lg text-white">
              {t.kds.modalTicketTitulo}
            </h2>
          </div>
          <button
            onClick={onCerrar}
            className="p-1 rounded-[var(--radio-chico)] text-[#A8989C] hover:text-white hover:bg-[#3D2E32] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metadatos de reimpresión */}
        <div className="flex items-center justify-between text-xs text-[#A8989C] px-1">
          <span>{t.kds.reimpresiones} <strong className="text-white font-mono">{ticket?.reimpresiones ?? 0}</strong></span>
          <span className="font-mono text-[11px] text-[#A8989C]/80">ID #{ticket?.id || ticket?.ordenId}</span>
        </div>

        {/* Vista previa del ticket en texto monoespaciado */}
        <div
          id="ticket-termico-area"
          className="flex-1 overflow-auto bg-[#181214] p-4 rounded-[var(--radio-chico)] border border-[#3D2E32] font-mono text-xs leading-relaxed text-[#F5EDE8] whitespace-pre select-text"
        >
          {ticket?.contenido || 'Cargando contenido del ticket...'}
        </div>

        {/* Botones de acción */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#3D2E32]">
          <button
            type="button"
            onClick={onCerrar}
            className="px-3 py-2 text-xs font-medium text-[#A8989C] hover:text-white hover:bg-[#3D2E32] rounded-[var(--radio-chico)] transition-colors cursor-pointer"
          >
            {t.kds.cerrar}
          </button>
          <button
            type="button"
            onClick={handleImprimir}
            disabled={procesando}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-[var(--color-accion)] hover:bg-[#B88746] text-[#2C1A1D] rounded-[var(--radio-chico)] transition-colors cursor-pointer disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            <span>{t.kds.imprimir}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
