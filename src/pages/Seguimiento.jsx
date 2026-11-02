import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useIdioma } from '../context/IdiomaContext.jsx';
import {
  Coffee,
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  MapPin,
  UtensilsCrossed,
  ShoppingBag,
  CreditCard,
  Banknote,
  Search,
  RotateCw
} from 'lucide-react';
import ModalBuscarPedido from '../components/cliente/ModalBuscarPedido.jsx';

export default function Seguimiento() {
  const { codigo } = useParams();
  const { t, idioma } = useIdioma();

  const [orden, setOrden] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [mostrarModalBuscar, setMostrarModalBuscar] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  const intervaloRef = useRef(null);

  useEffect(() => {
    let cancelado = false;

    async function consultarPedido(esSilencioso = false) {
      if (!codigo) {
        setError(t.seguimiento.noEncontrado);
        setCargando(false);
        return;
      }

      if (!esSilencioso) {
        setCargando(true);
      }

      try {
        const res = await fetch(`${apiUrl}/publico/ordenes/seguimiento/${codigo}`);
        if (!res.ok) {
          throw new Error(t.seguimiento.noEncontrado);
        }
        const data = await res.json();
        if (!cancelado) {
          setOrden(data);
          setError(null);

          // Si el pedido está ENTREGADO o CANCELADO, retira de pedido activo en localStorage (HU-12)
          if (data.estado === 'ENTREGADO' || data.estado === 'CANCELADO') {
            const guardado = localStorage.getItem('taza_miga_pedido_activo');
            if (guardado === codigo) {
              localStorage.removeItem('taza_miga_pedido_activo');
            }
          }
        }
      } catch (err) {
        if (!cancelado) {
          setError(err.message);
        }
      } finally {
        if (!cancelado && !esSilencioso) {
          setCargando(false);
        }
      }
    }

    // Consulta inicial
    consultarPedido(false);

    // Actualización periódica (polling) cada 3.5 segundos (HU-12, AGENTS.md)
    intervaloRef.current = setInterval(() => {
      consultarPedido(true);
    }, 3500);

    return () => {
      cancelado = true;
      if (intervaloRef.current) {
        clearInterval(intervaloRef.current);
      }
    };
  }, [codigo, apiUrl, t.seguimiento.noEncontrado]);

  // Pasos de la línea de tiempo
  const estadosOrden = ['RECIBIDO', 'PREPARACION', 'LISTO', 'ENTREGADO'];

  const obtenerIndiceEstado = (estadoActual) => {
    switch (estadoActual) {
      case 'RECIBIDO':
        return 0;
      case 'PREPARACION':
        return 1;
      case 'LISTO':
        return 2;
      case 'ENTREGADO':
        return 3;
      default:
        return -1;
    }
  };

  const indiceActual = orden ? obtenerIndiceEstado(orden.estado) : -1;
  const esCancelado = orden?.estado === 'CANCELADO';

  return (
    <div className="min-h-screen bg-[var(--color-fondo)] text-[var(--color-texto)] flex flex-col font-sans">
      {/* Encabezado */}
      <header className="bg-[var(--color-superficie)] border-b border-[var(--color-borde)] px-4 py-3 sm:px-6 shadow-xs">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-texto-suave)] hover:text-[var(--color-primario)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.seguimiento.volverAlMenu}</span>
          </Link>

          <div className="flex items-center gap-2">
            <Coffee className="w-5 h-5 text-[var(--color-accion)]" />
            <span className="font-serif font-bold text-sm text-[var(--color-primario)]">
              {orden?.negocioNombre || t.comun.nombreApp}
            </span>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="flex-1 max-w-xl w-full mx-auto p-4 sm:p-6 space-y-5">
        {cargando ? (
          <div className="p-12 text-center text-xs text-[var(--color-texto-suave)] font-mono">
            {t.comun.cargando}
          </div>
        ) : error || !orden ? (
          <div className="bg-[var(--color-superficie)] border border-[var(--color-borde)] rounded-[var(--radio-medio)] p-8 text-center space-y-4">
            <AlertTriangle className="w-10 h-10 text-amber-600 mx-auto opacity-70" />
            <div>
              <h2 className="text-base font-serif font-bold text-[var(--color-primario)]">
                {t.seguimiento.noEncontrado}
              </h2>
              <p className="text-xs text-[var(--color-texto-suave)] mt-1">
                {t.seguimiento.sinPedidoActivo}
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setMostrarModalBuscar(true)}
                className="px-4 py-2 bg-[var(--color-primario)] text-white text-xs font-semibold rounded-[var(--radio-chico)] hover:opacity-90 transition-opacity cursor-pointer inline-flex items-center gap-1.5"
              >
                <Search className="w-3.5 h-3.5" />
                <span>{t.seguimiento.buscarPedidoBtn}</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Tarjeta de Estado del Pedido */}
            <div className="bg-[var(--color-superficie)] border border-[var(--color-borde)] rounded-[var(--radio-medio)] p-5 sm:p-6 space-y-6 shadow-xs">
              <div className="flex items-start justify-between border-b border-[var(--color-borde)] pb-4">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--color-texto-suave)]">
                    {t.seguimiento.titulo}
                  </span>
                  <h2 className="text-2xl font-serif font-bold text-[var(--color-primario)] mt-0.5 font-mono">
                    {t.seguimiento.pedidoNumero}{orden.numeroOrden}
                  </h2>
                  <p className="text-xs text-[var(--color-texto-suave)] mt-0.5">
                    {t.seguimiento.cliente}: <span className="font-semibold text-[var(--color-texto)]">{orden.nombreCliente}</span>
                  </p>
                </div>

                <div className="text-right">
                  {orden.estadoPago === 'PAGADO' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 bg-emerald-50 text-emerald-800 font-semibold rounded border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>{t.seguimiento.pagado}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 bg-amber-50 text-amber-800 font-semibold rounded border border-amber-200">
                      <Banknote className="w-3 h-3 text-amber-600" />
                      <span>{t.seguimiento.sinPagar}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Si fue cancelado */}
              {esCancelado ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-[var(--radio-chico)] text-red-800 text-xs space-y-1">
                  <div className="flex items-center gap-2 font-bold text-sm text-red-900">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span>{t.seguimiento.estadoCancelado}</span>
                  </div>
                  {orden.motivoCancelacion && (
                    <p className="text-xs text-red-700">
                      {t.seguimiento.motivoCancelacion} {orden.motivoCancelacion}
                    </p>
                  )}
                </div>
              ) : (
                /* Línea de tiempo de avance */
                <div className="space-y-3 pt-1">
                  {[
                    { clave: 'estadoRecibido', idx: 0 },
                    { clave: 'estadoPreparacion', idx: 1 },
                    { clave: 'estadoListo', idx: 2 },
                    { clave: 'estadoEntregado', idx: 3 }
                  ].map((paso) => {
                    const completado = indiceActual >= paso.idx;
                    const esActual = indiceActual === paso.idx;

                    return (
                      <div key={paso.clave} className="flex items-center gap-3">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                            completado
                              ? 'bg-[var(--color-exito)] text-white'
                              : 'border border-[var(--color-borde)] text-[var(--color-texto-suave)] bg-[var(--color-fondo)]'
                          }`}
                        >
                          {completado ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <span>{paso.idx + 1}</span>
                          )}
                        </div>

                        <div className="flex-1 flex items-center justify-between">
                          <span
                            className={`text-xs sm:text-sm ${
                              esActual
                                ? 'font-bold text-[var(--color-primario)]'
                                : completado
                                ? 'font-semibold text-[var(--color-texto)]'
                                : 'text-[var(--color-texto-suave)]'
                            }`}
                          >
                            {t.seguimiento[paso.clave]}
                          </span>

                          {esActual && (
                            <span className="text-[10px] font-mono px-2 py-0.5 bg-[var(--color-fondo)] text-[var(--color-accion)] font-bold rounded border border-[var(--color-borde)] animate-pulse">
                              {t.seguimiento.actualizandoEnVivo}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Datos de Sucursal y Modalidad */}
              <div className="pt-4 border-t border-[var(--color-borde)] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <span className="text-[11px] text-[var(--color-texto-suave)] font-semibold block">
                    {t.seguimiento.sucursal}
                  </span>
                  <p className="font-semibold text-[var(--color-texto)] flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[var(--color-texto-suave)]" />
                    <span>{orden.sucursalNombre}</span>
                  </p>
                  <p className="text-[11px] text-[var(--color-texto-suave)] pl-4.5">
                    {orden.sucursalDireccion}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] text-[var(--color-texto-suave)] font-semibold block">
                    {t.seguimiento.modalidad}
                  </span>
                  {orden.tipoEntrega === 'MESA' ? (
                    <p className="font-semibold text-[var(--color-texto)] flex items-center gap-1.5">
                      <UtensilsCrossed className="w-3.5 h-3.5 text-[var(--color-accion)]" />
                      <span>{t.seguimiento.mesa} #{orden.numeroMesa}</span>
                    </p>
                  ) : (
                    <div>
                      <p className="font-semibold text-[var(--color-texto)] flex items-center gap-1.5">
                        <ShoppingBag className="w-3.5 h-3.5 text-[var(--color-accion)]" />
                        <span>{t.seguimiento.paraLlevar}</span>
                      </p>
                      {orden.horaRecogida && (
                        <p className="text-[11px] text-[var(--color-texto-suave)] mt-0.5">
                          {t.seguimiento.horaEstimadaRecogida}:{' '}
                          <span className="font-mono font-semibold">
                            {new Date(orden.horaRecogida).toLocaleTimeString(
                              idioma === 'en' ? 'en-US' : 'es-ES',
                              { hour: '2-digit', minute: '2-digit' }
                            )}
                          </span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Detalle de productos de la orden */}
              <div className="pt-4 border-t border-[var(--color-borde)] space-y-3">
                <h3 className="text-xs font-serif font-bold text-[var(--color-primario)]">
                  {t.seguimiento.productos}
                </h3>

                <div className="space-y-2.5 divide-y divide-[var(--color-borde)]">
                  {orden.detalles?.map((det) => (
                    <div key={det.id} className="pt-2 first:pt-0 space-y-1">
                      <div className="flex items-start justify-between text-xs">
                        <div className="font-semibold text-[var(--color-texto)]">
                          <span className="font-mono font-bold text-[var(--color-accion)] mr-1.5">
                            {det.cantidad}x
                          </span>
                          <span>{det.nombreProducto}</span>
                        </div>
                        <span className="font-mono font-bold text-[var(--color-primario)]">
                          ${Number(det.totalLinea || det.precioUnitario * det.cantidad).toFixed(2)}
                        </span>
                      </div>

                      {det.opciones?.length > 0 && (
                        <div className="text-[11px] text-[var(--color-texto-suave)] pl-5 space-y-0.5">
                          {det.opciones.map((op) => (
                            <div key={op.id} className="flex justify-between">
                              <span>• {op.nombreOpcion}</span>
                              {Number(op.precioExtra) > 0 && (
                                <span className="font-mono">
                                  +${Number(op.precioExtra).toFixed(2)}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {det.notasPersonalizacion && (
                        <p className="text-[10px] italic text-[var(--color-texto-suave)] pl-5">
                          &quot;{det.notasPersonalizacion}&quot;
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-[var(--color-borde)] flex items-center justify-between text-sm">
                  <span className="font-serif font-bold text-[var(--color-primario)]">
                    {t.seguimiento.total}
                  </span>
                  <span className="font-mono font-bold text-base text-[var(--color-primario)]">
                    ${Number(orden.total).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Búsqueda manual de pedido si se perdió el código */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setMostrarModalBuscar(true)}
                className="text-xs text-[var(--color-texto-suave)] hover:text-[var(--color-primario)] underline cursor-pointer"
              >
                {t.seguimiento.perdisteTuPedido}
              </button>
            </div>
          </>
        )}
      </main>

      {/* Modal de Búsqueda de Pedido (HU-12, RN-20) */}
      <ModalBuscarPedido
        abierto={mostrarModalBuscar}
        onCerrar={() => setMostrarModalBuscar(false)}
      />
    </div>
  );
}
