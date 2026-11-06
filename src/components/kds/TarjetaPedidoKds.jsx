import { useState, useEffect } from 'react';
import { Clock, CheckCircle2, DollarSign, XCircle, Printer, Coffee } from 'lucide-react';
import { useIdioma } from '../../context/IdiomaContext.jsx';

export default function TarjetaPedidoKds({
  orden,
  onAvanzarEstado,
  onRegistrarPago,
  onAbrirCancelar,
  onVerTicket,
  procesandoId
}) {
  const { t } = useIdioma();
  const [ahora, setAhora] = useState(Date.now());

  // Actualizar el cronómetro cada segundo para números vivos
  useEffect(() => {
    const timer = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const estaProcesando = procesandoId === orden.id;

  // Cálculo del tiempo transcurrido desde la creación del pedido (UTC)
  const msTranscurridos = Math.max(0, ahora - new Date(orden.creadoEn).getTime());
  const segundosTotales = Math.floor(msTranscurridos / 1000);
  const minutosTotales = Math.floor(segundosTotales / 60);

  // Semáforo de color de urgencia según HU-13 y docs/diseno.md:
  // verde hasta 5 min, amarillo hasta 10, rojo y resplandor después de 10 min.
  const esUrgente = minutosTotales > 10;
  let colorTiempo = 'text-emerald-300 border-emerald-500/50 bg-emerald-950/40';
  let colorBorde = 'border-l-emerald-500';

  if (esUrgente) {
    colorTiempo = 'text-rose-200 border-rose-500 bg-rose-950/70 font-black';
    colorBorde = 'border-l-rose-500';
  } else if (minutosTotales > 5) {
    colorTiempo = 'text-amber-200 border-amber-500/60 bg-amber-950/50';
    colorBorde = 'border-l-amber-500';
  }

  // Formato: "Xm Ys", o pasada la hora "Xh Ymin" (HU-13, docs/diseno.md)
  let etiquetaTiempo = '';
  if (minutosTotales >= 60) {
    const horas = Math.floor(minutosTotales / 60);
    const min = minutosTotales % 60;
    etiquetaTiempo = `${horas}h ${min}min`;
  } else {
    const seg = segundosTotales % 60;
    etiquetaTiempo = `${minutosTotales}m ${seg.toString().padStart(2, '0')}s`;
  }

  // Traducción y texto de estado
  const nombreEstado = {
    RECIBIDO: t.seguimiento.estadoRecibido,
    PREPARACION: t.seguimiento.estadoPreparacion,
    LISTO: t.seguimiento.estadoListo,
    ENTREGADO: t.seguimiento.estadoEntregado
  }[orden.estado] || orden.estado;

  // Color de píldora de estado (azul para recibido según docs/diseno.md)
  let estiloPildoraEstado = 'bg-stone-800 text-stone-200 border-stone-600';
  if (orden.estado === 'RECIBIDO') {
    estiloPildoraEstado = 'bg-blue-950/60 text-blue-300 border border-blue-500/50';
  } else if (orden.estado === 'PREPARACION') {
    estiloPildoraEstado = 'bg-amber-950/60 text-amber-300 border border-amber-500/50';
  } else if (orden.estado === 'LISTO') {
    estiloPildoraEstado = 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/50';
  }

  // Configuración de la acción principal según estado (HU-14)
  let siguienteEstado = null;
  let etiquetaBotonPrincipal = '';
  let puedeAvanzar = true;
  let advertenciaPago = false;

  if (orden.estado === 'RECIBIDO') {
    siguienteEstado = 'PREPARACION';
    etiquetaBotonPrincipal = t.kds.iniciarPreparacion;
  } else if (orden.estado === 'PREPARACION') {
    siguienteEstado = 'LISTO';
    etiquetaBotonPrincipal = t.kds.marcarListo;
  } else if (orden.estado === 'LISTO') {
    siguienteEstado = 'ENTREGADO';
    etiquetaBotonPrincipal = t.kds.entregar;
    // RN-23: No se puede entregar si está SIN_PAGAR
    if (orden.estadoPago !== 'PAGADO') {
      puedeAvanzar = false;
      advertenciaPago = true;
    }
  }

  return (
    <div
      style={esUrgente ? { boxShadow: 'var(--brillo-urgencia)' } : undefined}
      className={`bg-[var(--color-barista-superficie)] rounded-[var(--radio-grande)] border ${
        esUrgente ? 'border-[var(--color-error)]' : 'border-[#3D2E32]'
      } border-l-4 ${colorBorde} text-[var(--color-texto-sobre-oscuro)] flex flex-col justify-between overflow-hidden transition-all shadow-md`}
    >
      {/* Cabecera de la tarjeta: Número de orden grande, estado y cronómetro */}
      <div className="p-4 border-b border-[#3D2E32] flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            {/* Número grande legible de pie a 1 metro de distancia (docs/diseno.md) */}
            <span className="text-2xl font-bold font-mono text-white tracking-tight">
              #{orden.numeroOrden}
            </span>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-[var(--radio-pildora)] font-medium ${estiloPildoraEstado}`}
            >
              {nombreEstado}
            </span>
          </div>

          {/* Modalidad y Nombre del cliente con alto contraste */}
          <p className="text-sm font-semibold text-white mt-1">
            {orden.nombreCliente}
          </p>
          <p className="text-xs text-[#D5C9CC]">
            {orden.tipoEntrega === 'MESA' ? (
              <span>
                {t.kds.mesa}{' '}
                <strong className="text-white font-mono text-xs">
                  {orden.numeroMesa}
                </strong>
              </span>
            ) : (
              <span>
                {t.kds.paraLlevar}
                {orden.horaRecogida &&
                  ` (${t.kds.horaRecogida} ${orden.horaRecogida.slice(11, 16)})`}
              </span>
            )}
          </p>
        </div>

        {/* Cronómetro con cifras fijas tabular-nums en píldora y semáforo (HU-13, docs/diseno.md) */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radio-pildora)] border text-xs font-mono font-bold tabular-nums shrink-0 ${colorTiempo}`}
          title={t.kds.tiempoTranscurrido}
        >
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>{etiquetaTiempo}</span>
        </div>
      </div>

      {/* Detalle de productos y notas */}
      <div className="p-4 flex-1 flex flex-col gap-3">
        <div className="space-y-2.5 divide-y divide-[#3D2E32]/50">
          {orden.detalles?.map((det, index) => (
            <div key={det.id || index} className={index > 0 ? 'pt-2' : ''}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-bold text-white">
                  <span className="text-[var(--color-accion)] font-mono mr-1.5 font-bold">
                    {det.cantidad}×
                  </span>
                  {det.nombreProducto}
                </span>
                <span className="text-xs font-mono text-[#D5C9CC]">
                  ${(det.precioUnitario * det.cantidad).toFixed(2)}
                </span>
              </div>

              {/* Opciones elegidas */}
              {det.opciones && det.opciones.length > 0 && (
                <ul className="mt-1 space-y-0.5 text-xs text-[#E0D5D8] pl-4 list-disc">
                  {det.opciones.map((op, opIdx) => (
                    <li key={op.id || opIdx}>
                      <span className="text-[#B8A8AC]">{op.nombreGrupo}:</span>{' '}
                      <span className="font-medium text-white">{op.nombreOpcion}</span>
                    </li>
                  ))}
                </ul>
              )}

              {/* Instrucciones especiales en recuadro ámbar (docs/diseno.md) */}
              {det.notasPersonalizacion && (
                <p className="mt-1.5 text-xs text-amber-200 bg-amber-950/40 px-2.5 py-1.5 rounded-[var(--radio-chico)] border border-amber-800/60 font-medium">
                  <span className="font-bold text-amber-300">{t.kds.instrucciones}</span>{' '}
                  {det.notasPersonalizacion}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Pie de tarjeta: Pago, total y acciones */}
      <div className="p-4 bg-[var(--color-barista-fondo)] border-t border-[#3D2E32] flex flex-col gap-3">
        {/* Total e insignia Pagado / Sin pagar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {orden.estadoPago === 'PAGADO' ? (
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 bg-emerald-950/50 text-emerald-300 border border-emerald-700/60 rounded-[var(--radio-pildora)] font-medium">
                <CheckCircle2 className="w-3 h-3" />
                {t.kds.pagado} ({orden.metodoPago === 'TARJETA_DEMO' ? 'Tarjeta' : 'Barra'})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 bg-amber-950/50 text-amber-300 border border-amber-700/60 rounded-[var(--radio-pildora)] font-medium">
                <DollarSign className="w-3 h-3" />
                {t.kds.sinPagar}
              </span>
            )}
          </div>

          <span className="text-base font-bold font-mono text-[var(--color-acento)]">
            ${orden.total.toFixed(2)}
          </span>
        </div>

        {/* Advertencia si no se puede entregar por estar sin pagar (RN-23) */}
        {advertenciaPago && (
          <p className="text-[11px] text-amber-300 bg-amber-950/40 p-2 rounded-[var(--radio-chico)] border border-amber-800/50">
            {t.kds.requierePagoAntesEntregar}
          </p>
        )}

        {/* Botones secundarios (Cobrar en barra, Cancelar, Imprimir) */}
        <div className="flex items-center gap-2">
          {orden.estadoPago === 'SIN_PAGAR' && (
            <button
              onClick={() => onRegistrarPago(orden.id)}
              disabled={estaProcesando}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-[var(--radio-chico)] transition-colors cursor-pointer disabled:opacity-50"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>{t.kds.registrarPago}</span>
            </button>
          )}

          {(orden.estado === 'RECIBIDO' || orden.estado === 'PREPARACION') && (
            <button
              onClick={() => onAbrirCancelar(orden)}
              disabled={estaProcesando}
              className="flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-medium text-rose-300 hover:text-white hover:bg-rose-950/50 border border-rose-900/60 rounded-[var(--radio-chico)] transition-colors cursor-pointer disabled:opacity-50"
              title={t.kds.cancelarPedido}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>{t.kds.cancelarPedido}</span>
            </button>
          )}

          {orden.estado === 'ENTREGADO' && (
            <button
              onClick={() => onVerTicket(orden.id)}
              disabled={estaProcesando}
              className="flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium text-[var(--color-accion)] hover:bg-[#3D2E32] border border-[#3D2E32] rounded-[var(--radio-chico)] transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{t.kds.imprimirTicket}</span>
            </button>
          )}
        </div>

        {/* Botón de acción principal grande y a todo el ancho en ámbar (docs/diseno.md) */}
        {siguienteEstado && (
          <button
            onClick={() => onAvanzarEstado(orden.id, siguienteEstado)}
            disabled={estaProcesando || !puedeAvanzar}
            className="w-full py-2.5 px-4 rounded-[var(--radio-chico)] text-xs font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-[var(--color-accion)] hover:opacity-90 text-white shadow-xs"
          >
            {estaProcesando ? t.confirmacion.procesando : etiquetaBotonPrincipal}
          </button>
        )}
      </div>
    </div>
  );
}
