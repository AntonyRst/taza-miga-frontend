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

  // Semáforo de color de urgencia según HU-13:
  // verde hasta 5 min, amarillo hasta 10, rojo después.
  let colorTiempo = 'text-emerald-400 border-emerald-500/40 bg-emerald-950/20';
  let colorBorde = 'border-l-emerald-500';

  if (minutosTotales > 10) {
    colorTiempo = 'text-rose-400 border-rose-500/40 bg-rose-950/20';
    colorBorde = 'border-l-rose-500';
  } else if (minutosTotales > 5) {
    colorTiempo = 'text-amber-400 border-amber-500/40 bg-amber-950/20';
    colorBorde = 'border-l-amber-500';
  }

  // Formato: "Xm Ys", o pasada la hora "Xh Ymin" (HU-13)
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
      className={`bg-[#231B1D] rounded-[var(--radio-medio)] border border-[#3D2E32] border-l-4 ${colorBorde} text-[#F5EDE8] flex flex-col justify-between overflow-hidden transition-all`}
    >
      {/* Cabecera de la tarjeta: Número de orden grande, estado y cronómetro */}
      <div className="p-4 border-b border-[#3D2E32] flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            {/* Número grande legible de pie a 1 metro de distancia (docs/diseno.md) */}
            <span className="text-2xl font-bold font-mono text-white">
              #{orden.numeroOrden}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-[var(--radio-chico)] bg-[#3D2E32] text-[#E0D5D8] font-medium">
              {nombreEstado}
            </span>
          </div>

          {/* Modalidad y Nombre del cliente */}
          <p className="text-sm font-semibold text-white mt-1">
            {orden.nombreCliente}
          </p>
          <p className="text-xs text-[#A8989C]">
            {orden.tipoEntrega === 'MESA' ? (
              <span>{t.kds.mesa} <strong className="text-white font-mono text-xs">{orden.numeroMesa}</strong></span>
            ) : (
              <span>
                {t.kds.paraLlevar}
                {orden.horaRecogida && ` (${t.kds.horaRecogida} ${orden.horaRecogida.slice(11, 16)})`}
              </span>
            )}
          </p>
        </div>

        {/* Cronómetro con cifras fijas tabular-nums y semáforo (HU-13) */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radio-chico)] border text-xs font-mono font-bold tabular-nums shrink-0 ${colorTiempo}`}
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
                <span className="text-xs font-mono text-[#A8989C]">
                  ${(det.precioUnitario * det.cantidad).toFixed(2)}
                </span>
              </div>

              {/* Opciones elegidas */}
              {det.opciones && det.opciones.length > 0 && (
                <ul className="mt-1 space-y-0.5 text-xs text-[#C7B9BC] pl-4 list-disc">
                  {det.opciones.map((op, opIdx) => (
                    <li key={op.id || opIdx}>
                      <span className="text-[#A8989C]">{op.nombreGrupo}:</span>{' '}
                      <span className="font-medium text-white">{op.nombreOpcion}</span>
                    </li>
                  ))}
                </ul>
              )}

              {/* Instrucciones especiales */}
              {det.notasPersonalizacion && (
                <p className="mt-1 text-xs text-amber-300/90 italic bg-amber-950/20 px-2 py-1 rounded-[var(--radio-chico)] border border-amber-900/30">
                  {t.kds.instrucciones} {det.notasPersonalizacion}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Pie de tarjeta: Pago, total y acciones */}
      <div className="p-4 bg-[#1C1517] border-t border-[#3D2E32] flex flex-col gap-3">
        {/* Total e insignia Pagado / Sin pagar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {orden.estadoPago === 'PAGADO' ? (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-emerald-950/40 text-emerald-300 border border-emerald-800/50 rounded-[var(--radio-chico)] font-medium">
                <CheckCircle2 className="w-3 h-3" />
                {t.kds.pagado} ({orden.metodoPago === 'TARJETA_DEMO' ? 'Tarjeta' : 'Barra'})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-amber-950/40 text-amber-300 border border-amber-800/50 rounded-[var(--radio-chico)] font-medium">
                <DollarSign className="w-3 h-3" />
                {t.kds.sinPagar}
              </span>
            )}
          </div>

          <span className="text-base font-bold font-mono text-white">
            ${orden.total.toFixed(2)}
          </span>
        </div>

        {/* Advertencia si no se puede entregar por estar sin pagar (RN-23) */}
        {advertenciaPago && (
          <p className="text-[11px] text-amber-400 bg-amber-950/30 p-1.5 rounded-[var(--radio-chico)] border border-amber-900/40">
            {t.kds.requierePagoAntesEntregar}
          </p>
        )}

        {/* Botones secundarios (Cobrar en barra y Cancelar) */}
        <div className="flex items-center gap-2">
          {orden.estadoPago === 'SIN_PAGAR' && (
            <button
              onClick={() => onRegistrarPago(orden.id)}
              disabled={estaProcesando}
              className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-[var(--radio-chico)] transition-colors cursor-pointer disabled:opacity-50"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>{t.kds.registrarPago}</span>
            </button>
          )}

          {(orden.estado === 'RECIBIDO' || orden.estado === 'PREPARACION') && (
            <button
              onClick={() => onAbrirCancelar(orden)}
              disabled={estaProcesando}
              className="flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-medium text-rose-300 hover:text-white hover:bg-rose-950/40 border border-rose-900/50 rounded-[var(--radio-chico)] transition-colors cursor-pointer disabled:opacity-50"
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
              className="flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[var(--color-accion)] hover:bg-[#3D2E32] border border-[#3D2E32] rounded-[var(--radio-chico)] transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{t.kds.imprimirTicket}</span>
            </button>
          )}
        </div>

        {/* Botón de acción principal grande y a todo el ancho (docs/diseno.md) */}
        {siguienteEstado && (
          <button
            onClick={() => onAvanzarEstado(orden.id, siguienteEstado)}
            disabled={estaProcesando || !puedeAvanzar}
            className={`w-full py-2.5 px-4 rounded-[var(--radio-chico)] text-xs font-bold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              orden.estado === 'LISTO'
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-[var(--color-accion)] hover:bg-[#B88746] text-[#2C1A1D]'
            }`}
          >
            {estaProcesando ? t.confirmacion.procesando : etiquetaBotonPrincipal}
          </button>
        )}
      </div>
    </div>
  );
}
