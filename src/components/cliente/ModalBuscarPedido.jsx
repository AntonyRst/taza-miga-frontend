import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIdioma } from '../../context/IdiomaContext.jsx';
import { X, Search, AlertCircle } from 'lucide-react';

export default function ModalBuscarPedido({ abierto, onCerrar }) {
  const { t } = useIdioma();
  const navigate = useNavigate();

  const [numeroOrden, setNumeroOrden] = useState('');
  const [nombreCliente, setNombreCliente] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  if (!abierto) return null;

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  const handleBuscar = async (e) => {
    e.preventDefault();
    setError(null);

    const num = Number(numeroOrden);
    const nom = nombreCliente.trim();

    if (!num || num < 1 || nom.length < 2) {
      setError(t.seguimiento.noEncontrado);
      return;
    }

    try {
      setCargando(true);

      const res = await fetch(`${apiUrl}/publico/taza-miga/ordenes/buscar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numeroOrden: num,
          nombreCliente: nom
        })
      });

      const data = await res.json();

      if (!res.ok) {
        // RN-20: Mensaje exacto sin pistas si no se encuentra
        throw new Error(data.error || t.seguimiento.noEncontrado);
      }

      // Guardar código en localStorage y redirigir
      localStorage.setItem('taza_miga_pedido_activo', data.codigoSeguimiento);
      onCerrar();
      navigate(`/order/${data.codigoSeguimiento}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Fondo oscuro traslúcido */}
      <div
        onClick={onCerrar}
        className="fixed inset-0 bg-black/60 backdrop-blur-2xs transition-opacity"
        aria-hidden="true"
      />

      {/* Ventana modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-buscar-pedido"
        className="relative w-full max-w-md bg-[var(--color-superficie)] border border-[var(--color-borde)] rounded-[var(--radio-medio)] shadow-2xl p-5 sm:p-6 my-8 z-10 space-y-4 animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-start justify-between border-b border-[var(--color-borde)] pb-3">
          <div>
            <h2
              id="titulo-buscar-pedido"
              className="text-base font-serif font-bold text-[var(--color-primario)]"
            >
              {t.seguimiento.buscarModalTitulo}
            </h2>
            <p className="text-xs text-[var(--color-texto-suave)] mt-0.5">
              {t.seguimiento.buscarModalDesc}
            </p>
          </div>
          <button
            onClick={onCerrar}
            className="p-1 text-[var(--color-texto-suave)] hover:text-[var(--color-primario)] hover:bg-[var(--color-fondo)] rounded-[var(--radio-chico)] transition-colors cursor-pointer"
            aria-label={t.comun.cerrar}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-[var(--radio-chico)] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleBuscar} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-[var(--color-texto)] mb-1">
              {t.seguimiento.numeroPedidoLabel}
            </label>
            <input
              type="number"
              min="1"
              value={numeroOrden}
              onChange={(e) => setNumeroOrden(e.target.value)}
              placeholder={t.seguimiento.numeroPedidoPlaceholder}
              className="w-full px-3 py-2 bg-[var(--color-fondo)] border border-[var(--color-borde)] rounded-[var(--radio-chico)] text-xs text-[var(--color-texto)] focus:outline-none focus:border-[var(--color-accion)] font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-texto)] mb-1">
              {t.seguimiento.nombreClienteLabel}
            </label>
            <input
              type="text"
              minLength={2}
              maxLength={80}
              value={nombreCliente}
              onChange={(e) => setNombreCliente(e.target.value)}
              placeholder={t.seguimiento.nombreClientePlaceholder}
              className="w-full px-3 py-2 bg-[var(--color-fondo)] border border-[var(--color-borde)] rounded-[var(--radio-chico)] text-xs text-[var(--color-texto)] focus:outline-none focus:border-[var(--color-accion)]"
              required
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onCerrar}
              className="px-3 py-2 border border-[var(--color-borde)] rounded-[var(--radio-chico)] text-xs font-semibold text-[var(--color-texto-suave)] hover:bg-[var(--color-fondo)] transition-colors cursor-pointer"
            >
              {t.comun.cancelar}
            </button>

            <button
              type="submit"
              disabled={cargando}
              className="px-4 py-2 bg-[var(--color-primario)] text-white text-xs font-semibold rounded-[var(--radio-chico)] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-opacity flex items-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{cargando ? t.seguimiento.buscarCargando : t.seguimiento.buscarSubmit}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
