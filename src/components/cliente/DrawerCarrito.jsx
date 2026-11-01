import { useIdioma } from '../../context/IdiomaContext.jsx';
import { useCarrito } from '../../context/CarritoContext.jsx';
import { X, Trash2, Plus, Minus, ShoppingBag, AlertTriangle } from 'lucide-react';

export default function DrawerCarrito({ abierto, onCerrar, onConfirmarPedido }) {
  const { t, idioma } = useIdioma();
  const {
    lineas,
    totalArticulos,
    total,
    hayNoDisponibles,
    actualizarCantidad,
    eliminarLinea,
    vaciarCarrito
  } = useCarrito();

  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Fondo oscuro traslúcido */}
      <div
        onClick={onCerrar}
        className="absolute inset-0 bg-black/60 backdrop-blur-2xs transition-opacity"
        aria-hidden="true"
      />

      {/* Contenedor del panel lateral (Drawer) */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div
          className="w-screen max-w-md bg-[var(--color-superficie)] border-l border-[var(--color-borde)] flex flex-col shadow-2xl animate-in slide-in-from-right duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-carrito"
        >
          {/* Encabezado del carrito */}
          <div className="p-4 sm:p-5 border-b border-[var(--color-borde)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[var(--color-accion)]" />
              <h2
                id="titulo-carrito"
                className="text-base font-serif font-bold text-[var(--color-primario)]"
              >
                {t.carrito.titulo}
              </h2>
              {totalArticulos > 0 && (
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 bg-[var(--color-fondo)] border border-[var(--color-borde)] rounded-full text-[var(--color-texto-suave)]">
                  {totalArticulos} {totalArticulos === 1 ? t.carrito.articulo : t.carrito.articulos}
                </span>
              )}
            </div>

            <button
              onClick={onCerrar}
              className="p-1.5 text-[var(--color-texto-suave)] hover:text-[var(--color-primario)] hover:bg-[var(--color-fondo)] rounded-[var(--radio-chico)] transition-colors cursor-pointer"
              aria-label={t.comun.cerrar}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Alerta si hay productos agotados / no disponibles (RN-14) */}
          {hayNoDisponibles && (
            <div className="mx-4 mt-4 p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-[var(--radio-chico)] flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{t.carrito.alertaDisponibilidad}</p>
              </div>
            </div>
          )}

          {/* Lista de líneas del carrito o estado vacío */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
            {lineas.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-14 h-14 rounded-full bg-[var(--color-fondo)] border border-[var(--color-borde)] flex items-center justify-center text-[var(--color-texto-suave)]">
                  <ShoppingBag className="w-7 h-7 opacity-50" />
                </div>
                <h3 className="font-serif font-bold text-sm text-[var(--color-primario)]">
                  {t.carrito.vacio}
                </h3>
                <p className="text-xs text-[var(--color-texto-suave)] max-w-xs">
                  {t.carrito.vacioDesc}
                </p>
                <button
                  type="button"
                  onClick={onCerrar}
                  className="mt-2 px-4 py-2 bg-[var(--color-primario)] text-white text-xs font-semibold rounded-[var(--radio-chico)] hover:opacity-90 transition-opacity cursor-pointer"
                >
                  {t.carrito.irAlMenu}
                </button>
              </div>
            ) : (
              lineas.map((linea) => {
                const nombreProducto =
                  idioma === 'en' ? linea.producto.nombreEn : linea.producto.nombreEs;
                const disponible = linea.producto.disponible !== false;

                return (
                  <div
                    key={linea.id}
                    className={`p-3.5 bg-[var(--color-fondo)] border rounded-[var(--radio-chico)] flex flex-col gap-2.5 transition-colors ${
                      !disponible
                        ? 'border-red-300 bg-red-50/40'
                        : 'border-[var(--color-borde)]'
                    }`}
                  >
                    {/* Encabezado de la línea: Nombre y botón eliminar */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-serif font-bold text-xs text-[var(--color-primario)]">
                            {nombreProducto}
                          </h4>
                          {!disponible && (
                            <span className="text-[10px] px-1.5 py-0.2 bg-red-100 text-red-700 font-semibold rounded">
                              {t.carrito.productoNoDisponible}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-mono text-[var(--color-texto-suave)]">
                          ${linea.precioUnitario.toFixed(2)} c/u
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => eliminarLinea(linea.id)}
                        className="text-[var(--color-texto-suave)] hover:text-red-600 p-1 rounded transition-colors cursor-pointer"
                        title={t.carrito.eliminarLinea}
                        aria-label={t.carrito.eliminarLinea}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Opciones seleccionadas */}
                    {linea.opciones.length > 0 && (
                      <div className="text-[11px] text-[var(--color-texto-suave)] space-y-0.5 border-l-2 border-[var(--color-borde)] pl-2">
                        {linea.opciones.map((op) => {
                          const nombreOp = idioma === 'en' ? op.nombreEn : op.nombreEs;
                          const tieneExtra = Number(op.precioExtra) > 0;
                          return (
                            <div key={op.id} className="flex items-center justify-between">
                              <span>• {nombreOp}</span>
                              {tieneExtra && (
                                <span className="font-mono text-[10px]">
                                  +${Number(op.precioExtra).toFixed(2)}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Instrucciones especiales si existen */}
                    {linea.instrucciones && (
                      <p className="text-[10px] italic text-[var(--color-texto-suave)] bg-[var(--color-superficie)] p-1.5 rounded border border-[var(--color-borde)]">
                        &quot;{linea.instrucciones}&quot;
                      </p>
                    )}

                    {/* Fila de controles de cantidad y subtotal (RN-18, RN-28) */}
                    <div className="pt-2 border-t border-[var(--color-borde)] flex items-center justify-between">
                      <div className="flex items-center border border-[var(--color-borde)] rounded-[var(--radio-chico)] bg-[var(--color-superficie)]">
                        <button
                          type="button"
                          onClick={() => actualizarCantidad(linea.id, linea.cantidad - 1)}
                          className="p-1.5 text-[var(--color-texto-suave)] hover:text-[var(--color-primario)] cursor-pointer transition-colors"
                          aria-label="Disminuir unidades"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-mono font-bold text-[var(--color-primario)] tabular-nums">
                          {linea.cantidad}
                        </span>
                        <button
                          type="button"
                          onClick={() => actualizarCantidad(linea.id, linea.cantidad + 1)}
                          disabled={linea.cantidad >= 20}
                          className="p-1.5 text-[var(--color-texto-suave)] hover:text-[var(--color-primario)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                          aria-label="Aumentar unidades"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="font-mono font-bold text-xs text-[var(--color-primario)]">
                        ${linea.subtotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pie del carrito con total y acciones (RN-29) */}
          {lineas.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-[var(--color-borde)] bg-[var(--color-superficie)] space-y-3 shrink-0">
              <div className="flex items-center justify-between text-xs text-[var(--color-texto-suave)]">
                <span>{t.carrito.subtotal}</span>
                <span className="font-mono font-semibold">${total.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between text-sm font-serif font-bold text-[var(--color-primario)] pt-1 border-t border-[var(--color-borde)]">
                <span>{t.carrito.total}</span>
                <span className="font-mono text-base font-bold text-[var(--color-primario)]">
                  ${total.toFixed(2)}
                </span>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={vaciarCarrito}
                  className="px-3 py-2.5 border border-[var(--color-borde)] text-[var(--color-texto-suave)] hover:text-red-600 hover:border-red-300 rounded-[var(--radio-chico)] text-xs font-semibold transition-colors cursor-pointer"
                  title={t.carrito.vaciar}
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={onConfirmarPedido}
                  disabled={hayNoDisponibles || lineas.length === 0}
                  className="flex-1 py-2.5 px-4 bg-[var(--color-accion)] text-white text-xs font-semibold rounded-[var(--radio-chico)] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-opacity text-center shadow-xs"
                >
                  {t.carrito.continuarPedido}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
