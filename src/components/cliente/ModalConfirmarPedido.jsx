import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useIdioma } from '../../context/IdiomaContext.jsx';
import { useCarrito } from '../../context/CarritoContext.jsx';
import {
  X,
  CreditCard,
  Banknote,
  UtensilsCrossed,
  ShoppingBag,
  AlertCircle,
  Clock,
  MapPin,
  Check,
  Lock,
  QrCode,
  CheckCircle2
} from 'lucide-react';

export default function ModalConfirmarPedido({ abierto, onCerrar }) {
  const { t, idioma } = useIdioma();
  const { lineas, total, vaciarCarrito } = useCarrito();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Detección de parámetros de mesa por código QR (?sucursalId=1&mesa=4&token=...)
  const paramSucursal = searchParams.get('sucursal') || searchParams.get('sucursalId');
  const paramMesa = searchParams.get('mesa');
  const paramToken = searchParams.get('token') || searchParams.get('tokenMesa') || searchParams.get('hash');
  const tieneMesaVerificada = Boolean(paramMesa && paramToken && Number(paramMesa) > 0);

  const [sucursales, setSucursales] = useState([]);
  const [sucursalSeleccionadaId, setSucursalSeleccionadaId] = useState('');
  const [tipoEntrega, setTipoEntrega] = useState(tieneMesaVerificada ? 'MESA' : 'LLEVAR');
  const [numeroMesa, setNumeroMesa] = useState(paramMesa || '');
  const [tokenMesa, setTokenMesa] = useState(paramToken || '');
  const [horaRecogida, setHoraRecogida] = useState('');
  const [nombreCliente, setNombreCliente] = useState('');
  const [metodoPago, setMetodoPago] = useState(tieneMesaVerificada ? 'BARRA' : 'TARJETA_DEMO');

  // Si cambia el tipo de entrega y es LLEVAR, forzar TARJETA_DEMO (pago anticipado obligatorio)
  const cambiarTipoEntrega = (nuevoTipo) => {
    if (nuevoTipo === 'MESA' && !tieneMesaVerificada) return;
    setTipoEntrega(nuevoTipo);
    if (nuevoTipo === 'LLEVAR') {
      setMetodoPago('TARJETA_DEMO');
    }
  };

  // Campos simulados de tarjeta (HU-11)
  const [tarjetaNumero, setTarjetaNumero] = useState('4532 •••• •••• 8892');
  const [tarjetaTitular, setTarjetaTitular] = useState('');
  const [tarjetaVence, setTarjetaVence] = useState('12/28');
  const [tarjetaCvv, setTarjetaCvv] = useState('842');

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  // Cargar sucursales activas al abrir (HU-11)
  useEffect(() => {
    if (!abierto) return;

    async function cargarSucursales() {
      try {
        const res = await fetch(`${apiUrl}/publico/taza-miga/sucursales`);
        if (!res.ok) throw new Error(t.comun.errorConexion);
        const data = await res.json();
        setSucursales(data);

        // Pre-rellenar sucursal si viene en el QR o tomar la primera
        if (paramSucursal && data.some((s) => s.id === Number(paramSucursal))) {
          setSucursalSeleccionadaId(Number(paramSucursal));
        } else if (data.length > 0) {
          setSucursalSeleccionadaId(data[0].id);
        }

        if (tieneMesaVerificada) {
          setNumeroMesa(paramMesa);
          setTokenMesa(paramToken);
          setTipoEntrega('MESA');
        } else {
          setTipoEntrega('LLEVAR');
          setMetodoPago('TARJETA_DEMO');
        }
      } catch (err) {
        setError(err.message);
      }
    }

    cargarSucursales();
  }, [abierto, apiUrl, paramSucursal, paramMesa, paramToken, tieneMesaVerificada, t.comun.errorConexion]);

  if (!abierto) return null;

  const sucursalActual = sucursales.find((s) => s.id === Number(sucursalSeleccionadaId));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validaciones locales rápidas de interfaz
    const nombreLimpio = nombreCliente.trim();
    if (nombreLimpio.length < 2 || nombreLimpio.length > 80) {
      setError(idioma === 'en' ? 'Customer name must be between 2 and 80 characters' : 'El nombre debe tener entre 2 y 80 caracteres');
      return;
    }

    if (!sucursalActual) {
      setError(idioma === 'en' ? 'Please select a branch' : 'Por favor selecciona una sucursal');
      return;
    }

    if (tipoEntrega === 'MESA') {
      if (!tieneMesaVerificada || !tokenMesa) {
        setError(t.confirmacion.mesaBloqueadaDirecto);
        return;
      }
      const num = Number(numeroMesa);
      if (!num || num < 1 || num > sucursalActual.cantidadMesas) {
        setError(`${t.confirmacion.errorMesa} ${sucursalActual.cantidadMesas}`);
        return;
      }
    }

    if (tipoEntrega === 'LLEVAR' && metodoPago === 'BARRA') {
      setError(t.confirmacion.pagoAnticipadoObligatorio);
      return;
    }

    let horaRecogidaIso = null;
    if (tipoEntrega === 'LLEVAR' && horaRecogida) {
      // Construir datetime de hoy con la hora especificada
      const hoy = new Date();
      const [horas, minutos] = horaRecogida.split(':');
      const fechaProg = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), Number(horas), Number(minutos));
      if (fechaProg <= hoy) {
        setError(idioma === 'en' ? 'Pickup time must be in the future' : 'La hora de recogida debe ser posterior a la actual');
        return;
      }
      horaRecogidaIso = fechaProg.toISOString();
    }

    try {
      setCargando(true);

      const payload = {
        sucursalId: sucursalActual.id,
        nombreCliente: nombreLimpio,
        tipoEntrega,
        numeroMesa: tipoEntrega === 'MESA' ? Number(numeroMesa) : null,
        tokenMesa: tipoEntrega === 'MESA' ? tokenMesa : null,
        horaRecogida: horaRecogidaIso,
        metodoPago,
        lineas: lineas.map((linea) => ({
          productoId: linea.productoId,
          cantidad: linea.cantidad,
          notasPersonalizacion: linea.instrucciones || '',
          opcionesIds: linea.opciones.map((o) => o.id)
        }))
      };

      const res = await fetch(`${apiUrl}/publico/taza-miga/ordenes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t.comun.errorConexion);
      }

      // Guardar solo el código de seguimiento en localStorage (HU-12)
      localStorage.setItem('taza_miga_pedido_activo', data.codigoSeguimiento);

      // Vaciar carrito tras la confirmación exitosa (HU-11)
      vaciarCarrito();
      onCerrar();

      // Redirigir a la pantalla de seguimiento en vivo (HU-11, HU-12)
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
        aria-labelledby="titulo-confirmar"
        className="relative w-full max-w-lg bg-[var(--color-superficie)] border border-[var(--color-borde)] rounded-[var(--radio-medio)] shadow-2xl p-5 sm:p-6 my-8 z-10 space-y-5 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Encabezado */}
        <div className="flex items-start justify-between border-b border-[var(--color-borde)] pb-3">
          <div>
            <h2
              id="titulo-confirmar"
              className="text-lg font-serif font-bold text-[var(--color-primario)]"
            >
              {t.confirmacion.titulo}
            </h2>
            <p className="text-xs text-[var(--color-texto-suave)] mt-0.5">
              {t.confirmacion.subtitulo}
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
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-[var(--radio-chico)] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Modalidad de entrega: MESA o LLEVAR (RN-17) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[var(--color-texto)]">
              {t.confirmacion.modalidad}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={!tieneMesaVerificada}
                onClick={() => cambiarTipoEntrega('MESA')}
                title={!tieneMesaVerificada ? t.confirmacion.mesaSoloConQr : ''}
                className={`py-2 px-3 border rounded-[var(--radio-chico)] text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                  !tieneMesaVerificada
                    ? 'opacity-40 cursor-not-allowed bg-[var(--color-fondo)] text-[var(--color-texto-suave)] border-[var(--color-borde)]'
                    : tipoEntrega === 'MESA'
                    ? 'bg-[var(--color-primario)] text-white border-[var(--color-primario)] cursor-pointer'
                    : 'bg-[var(--color-fondo)] text-[var(--color-texto-suave)] border-[var(--color-borde)] hover:bg-[var(--color-superficie)] cursor-pointer'
                }`}
              >
                {!tieneMesaVerificada ? (
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <UtensilsCrossed className="w-4 h-4 shrink-0" />
                )}
                <span>{t.confirmacion.enMesa}</span>
              </button>

              <button
                type="button"
                onClick={() => cambiarTipoEntrega('LLEVAR')}
                className={`py-2 px-3 border rounded-[var(--radio-chico)] text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                  tipoEntrega === 'LLEVAR'
                    ? 'bg-[var(--color-primario)] text-white border-[var(--color-primario)]'
                    : 'bg-[var(--color-fondo)] text-[var(--color-texto-suave)] border-[var(--color-borde)] hover:bg-[var(--color-superficie)]'
                }`}
              >
                <ShoppingBag className="w-4 h-4 shrink-0" />
                <span>{t.confirmacion.paraLlevar}</span>
              </button>
            </div>

            {/* Aviso cuando se ingresa de forma directa sin QR de mesa */}
            {!tieneMesaVerificada && (
              <p className="text-[11px] text-[var(--color-texto-suave)] flex items-center gap-1.5 pt-0.5">
                <QrCode className="w-3.5 h-3.5 text-[var(--color-accion)] shrink-0" />
                <span>{t.confirmacion.mesaBloqueadaDirecto}</span>
              </p>
            )}
          </div>

          {/* Sucursal y Mesa asignada / Hora de Recogida */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-texto)] mb-1">
                {t.confirmacion.sucursalLabel}
              </label>
              <div className="relative">
                <select
                  value={sucursalSeleccionadaId}
                  onChange={(e) => setSucursalSeleccionadaId(e.target.value)}
                  disabled={tieneMesaVerificada}
                  className="w-full px-3 py-2 bg-[var(--color-fondo)] border border-[var(--color-borde)] rounded-[var(--radio-chico)] text-xs text-[var(--color-texto)] focus:outline-none focus:border-[var(--color-accion)] disabled:opacity-75"
                  required
                >
                  {sucursales.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre}
                    </option>
                  ))}
                </select>
              </div>
              {sucursalActual && (
                <p className="text-[11px] text-[var(--color-texto-suave)] mt-1 flex items-center gap-1 truncate">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="truncate">{sucursalActual.direccion}</span>
                </p>
              )}
            </div>

            {tipoEntrega === 'MESA' ? (
              <div>
                <label className="block text-xs font-semibold text-[var(--color-texto)] mb-1">
                  {t.confirmacion.numeroMesaLabel}
                </label>
                {/* Visualización fija de solo lectura con verificación por QR (sin campo abierto editable) */}
                <div className="w-full px-3 py-2 bg-[var(--color-fondo)] border border-[var(--color-borde)] rounded-[var(--radio-chico)] text-xs font-semibold text-[var(--color-primario)] flex items-center justify-between">
                  <span className="font-mono text-sm">
                    {t.confirmacion.numeroMesaLabel} #{numeroMesa}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full font-sans font-medium">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{t.confirmacion.mesaVerificada}</span>
                  </span>
                </div>
                <p className="text-[10px] text-[var(--color-texto-suave)] mt-1">
                  {t.confirmacion.mesaFija}
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-[var(--color-texto)] mb-1">
                  {t.confirmacion.horaRecogidaLabel}
                </label>
                <div className="relative">
                  <input
                    type="time"
                    value={horaRecogida}
                    onChange={(e) => setHoraRecogida(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--color-fondo)] border border-[var(--color-borde)] rounded-[var(--radio-chico)] text-xs text-[var(--color-texto)] focus:outline-none focus:border-[var(--color-accion)]"
                  />
                  <Clock className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-texto-suave)] pointer-events-none" />
                </div>
              </div>
            )}
          </div>

          {/* Nombre del cliente (RN-18) */}
          <div>
            <label className="block text-xs font-semibold text-[var(--color-texto)] mb-1">
              {t.confirmacion.nombreClienteLabel}
            </label>
            <input
              type="text"
              minLength={2}
              maxLength={80}
              value={nombreCliente}
              onChange={(e) => setNombreCliente(e.target.value)}
              placeholder={t.confirmacion.nombreClientePlaceholder}
              className="w-full px-3 py-2 bg-[var(--color-fondo)] border border-[var(--color-borde)] rounded-[var(--radio-chico)] text-xs text-[var(--color-texto)] focus:outline-none focus:border-[var(--color-accion)]"
              required
            />
          </div>

          {/* Método de pago: BARRA o TARJETA_DEMO (RN-23) */}
          <div className="space-y-2 pt-1 border-t border-[var(--color-borde)]">
            <label className="block text-xs font-semibold text-[var(--color-texto)]">
              {t.confirmacion.metodoPagoLabel}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                disabled={tipoEntrega !== 'MESA' || !tieneMesaVerificada}
                onClick={() => setMetodoPago('BARRA')}
                title={tipoEntrega !== 'MESA' || !tieneMesaVerificada ? t.confirmacion.pagoBarraSoloMesa : ''}
                className={`p-2.5 border rounded-[var(--radio-chico)] text-left transition-colors ${
                  tipoEntrega !== 'MESA' || !tieneMesaVerificada
                    ? 'opacity-40 cursor-not-allowed border-[var(--color-borde)] bg-[var(--color-fondo)]'
                    : metodoPago === 'BARRA'
                    ? 'border-[var(--color-primario)] bg-stone-50 cursor-pointer'
                    : 'border-[var(--color-borde)] bg-[var(--color-fondo)] hover:bg-[var(--color-superficie)] cursor-pointer'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs text-[var(--color-primario)]">
                  {tipoEntrega !== 'MESA' || !tieneMesaVerificada ? (
                    <Lock className="w-3.5 h-3.5 text-[var(--color-texto-suave)]" />
                  ) : (
                    <Banknote className="w-4 h-4 text-[var(--color-accion)]" />
                  )}
                  <span>{t.confirmacion.pagoBarra}</span>
                </div>
                <p className="text-[10px] text-[var(--color-texto-suave)] mt-1">
                  {tipoEntrega !== 'MESA' || !tieneMesaVerificada
                    ? t.confirmacion.pagoBarraSoloMesa
                    : t.confirmacion.pagoBarraDesc}
                </p>
              </button>

              <button
                type="button"
                onClick={() => setMetodoPago('TARJETA_DEMO')}
                className={`p-2.5 border rounded-[var(--radio-chico)] text-left cursor-pointer transition-colors ${
                  metodoPago === 'TARJETA_DEMO'
                    ? 'border-[var(--color-primario)] bg-stone-50'
                    : 'border-[var(--color-borde)] bg-[var(--color-fondo)] hover:bg-[var(--color-superficie)]'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs text-[var(--color-primario)]">
                  <CreditCard className="w-4 h-4 text-[var(--color-accion)]" />
                  <span>{t.confirmacion.pagoTarjetaDemo}</span>
                </div>
                <p className="text-[10px] text-[var(--color-texto-suave)] mt-1">
                  {t.confirmacion.pagoTarjetaDemoDesc}
                </p>
              </button>
            </div>

            {/* Aviso de pago anticipado obligatorio si es para llevar */}
            {(tipoEntrega === 'LLEVAR' || !tieneMesaVerificada) && (
              <p className="text-[11px] text-[var(--color-texto-suave)] flex items-center gap-1.5 pt-0.5">
                <CreditCard className="w-3.5 h-3.5 text-[var(--color-accion)] shrink-0" />
                <span>{t.confirmacion.pagoAnticipadoObligatorio}</span>
              </p>
            )}

            {/* Formulario simulado de tarjeta de demostración */}
            {metodoPago === 'TARJETA_DEMO' && (
              <div className="p-3 bg-[var(--color-fondo)] border border-[var(--color-borde)] rounded-[var(--radio-chico)] space-y-2 mt-2">
                <div className="flex items-center justify-between text-[11px] text-[var(--color-texto-suave)]">
                  <span className="font-semibold">{t.confirmacion.tarjetaNotaDemo}</span>
                </div>

                <div>
                  <input
                    type="text"
                    value={tarjetaNumero}
                    onChange={(e) => setTarjetaNumero(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-[var(--color-superficie)] border border-[var(--color-borde)] rounded-[var(--radio-chico)] text-xs font-mono"
                    readOnly
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder={t.confirmacion.titularTarjeta}
                    value={tarjetaTitular || nombreCliente || 'Cliente Demostración'}
                    onChange={(e) => setTarjetaTitular(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-[var(--color-superficie)] border border-[var(--color-borde)] rounded-[var(--radio-chico)] text-xs"
                  />
                  <div className="grid grid-cols-2 gap-1 font-mono">
                    <input
                      type="text"
                      value={tarjetaVence}
                      onChange={(e) => setTarjetaVence(e.target.value)}
                      className="w-full px-2 py-1.5 bg-[var(--color-superficie)] border border-[var(--color-borde)] rounded-[var(--radio-chico)] text-xs text-center"
                      readOnly
                    />
                    <input
                      type="text"
                      value={tarjetaCvv}
                      onChange={(e) => setTarjetaCvv(e.target.value)}
                      className="w-full px-2 py-1.5 bg-[var(--color-superficie)] border border-[var(--color-borde)] rounded-[var(--radio-chico)] text-xs text-center"
                      readOnly
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Resumen y botón final */}
          <div className="pt-3 border-t border-[var(--color-borde)] flex items-center justify-between">
            <div>
              <p className="text-[11px] text-[var(--color-texto-suave)]">
                {t.confirmacion.resumen}: {lineas.length} {lineas.length === 1 ? t.carrito.articulo : t.carrito.articulos}
              </p>
              <p className="text-base font-serif font-bold text-[var(--color-primario)] font-mono">
                ${total.toFixed(2)}
              </p>
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="py-2.5 px-5 bg-[var(--color-accion)] text-white text-xs font-semibold rounded-[var(--radio-chico)] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-opacity shadow-xs flex items-center gap-2"
            >
              {cargando ? (
                <span>{t.confirmacion.procesando}</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{t.confirmacion.confirmarYPedir}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
