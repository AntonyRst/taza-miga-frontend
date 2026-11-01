import { useParams, Link } from 'react-router-dom';
import { useIdioma } from '../context/IdiomaContext.jsx';
import { Coffee, ArrowLeft, Clock, CheckCircle2 } from 'lucide-react';

export default function Seguimiento() {
  const { codigo } = useParams();
  const { t } = useIdioma();

  return (
    <div className="min-h-screen bg-[var(--color-fondo)] text-[var(--color-texto)] flex flex-col">
      {/* Encabezado */}
      <header className="bg-[var(--color-superficie)] border-b border-[var(--color-borde)] px-4 py-3 sm:px-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-texto-suave)] hover:text-[var(--color-primario)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.comun.volver}</span>
          </Link>
          <div className="flex items-center gap-2">
            <Coffee className="w-5 h-5 text-[var(--color-accion)]" />
            <span className="font-serif font-bold text-sm text-[var(--color-primario)]">
              {t.comun.nombreApp}
            </span>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="flex-1 max-w-xl w-full mx-auto p-4 sm:p-6 space-y-6">
        <div className="bg-[var(--color-superficie)] border border-[var(--color-borde)] rounded-[var(--radio-medio)] p-6 space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-serif font-bold text-[var(--color-primario)]">
              {t.seguimiento.titulo}
            </h2>
            <p className="text-sm font-mono text-[var(--color-texto-suave)]">
              {codigo ? `${t.seguimiento.pedidoNumero} (${codigo.slice(0, 8)})` : t.comun.sinResultados}
            </p>
          </div>

          {/* Línea de tiempo de estados */}
          <div className="space-y-4 pt-2">
            {[
              { clave: 'estadoRecibido', hecho: true },
              { clave: 'estadoPreparacion', hecho: false },
              { clave: 'estadoListo', hecho: false },
              { clave: 'estadoEntregado', hecho: false }
            ].map((paso, idx) => (
              <div key={paso.clave} className="flex items-center gap-3">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    paso.hecho
                      ? 'bg-[var(--color-exito)] text-white'
                      : 'border border-[var(--color-borde)] text-[var(--color-texto-suave)] bg-[var(--color-fondo)]'
                  }`}
                >
                  {paso.hecho ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                </div>
                <span
                  className={`text-sm ${
                    paso.hecho
                      ? 'font-semibold text-[var(--color-texto)]'
                      : 'text-[var(--color-texto-suave)]'
                  }`}
                >
                  {t.seguimiento[paso.clave]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Búsqueda de pedido perdido */}
        <div className="text-center">
          <button className="text-xs text-[var(--color-texto-suave)] hover:text-[var(--color-primario)] underline cursor-pointer">
            {t.seguimiento.perdisteTuPedido}
          </button>
        </div>
      </main>
    </div>
  );
}
