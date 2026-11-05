import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useIdioma } from '../context/IdiomaContext.jsx';
import {
  Coffee,
  LogOut,
  Volume2,
  VolumeX,
  KeyRound,
  RotateCw,
  AlertCircle
} from 'lucide-react';
import ModalCambiarPassword from '../components/ModalCambiarPassword.jsx';
import TarjetaPedidoKds from '../components/kds/TarjetaPedidoKds.jsx';
import ModalCancelarPedido from '../components/kds/ModalCancelarPedido.jsx';
import ModalTicketImpresion from '../components/kds/ModalTicketImpresion.jsx';

/**
 * Reproduce un pitido suave sintetizado mediante la Web Audio API nativa
 * para notificar el ingreso de un nuevo pedido en la barra (HU-13).
 */
function emitirSonidoNuevoPedido() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Acorde suave de atención (Re 5 -> La 5)
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // Si el navegador bloquea la reproducción automática hasta interacción previa
  }
}

export default function Kds() {
  const { usuario, cerrarSesion, fetchConToken } = useAuth();
  const { t, idioma, cambiarIdioma } = useIdioma();

  const [pedidos, setPedidos] = useState([]);
  const [sucursalNombre, setSucursalNombre] = useState('');
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState(usuario?.sucursal_id || null);
  const [sucursalesDisponibles, setSucursalesDisponibles] = useState([]);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [procesandoId, setProcesandoId] = useState(null);

  // Alerta sonora (persistida en localStorage)
  const [sonidoHabilitado, setSonidoHabilitado] = useState(() => {
    return localStorage.getItem('taza_miga_kds_sonido') !== 'false';
  });

  // Modales
  const [mostrarModalPassword, setMostrarModalPassword] = useState(false);
  const [ordenParaCancelar, setOrdenParaCancelar] = useState(null);
  const [ticketParaImprimir, setTicketParaImprimir] = useState(null);
  const [procesandoAccion, setProcesandoAccion] = useState(false);

  // Referencia para registrar pedidos previos y detectar nuevos ingresos
  const pedidosIdsRef = useRef(new Set());
  const primeraCargaRef = useRef(true);

  const alternarSonido = () => {
    setSonidoHabilitado((prev) => {
      const nuevo = !prev;
      localStorage.setItem('taza_miga_kds_sonido', String(nuevo));
      return nuevo;
    });
  };

  // Cargar sucursales si es Dueño para permitir conmutar
  useEffect(() => {
    if (usuario?.rol === 'DUENO') {
      fetchConToken('/api/admin/sucursales')
        .then((res) => {
          if (res.ok) return res.json();
          return [];
        })
        .then((data) => {
          setSucursalesDisponibles(data);
          if (data.length > 0 && !sucursalSeleccionada) {
            setSucursalSeleccionada(data[0].id);
          }
        })
        .catch(() => {});
    }
  }, [usuario, fetchConToken]);

  // Función principal para consultar pedidos activos de la sucursal (HU-13)
  const cargarPedidos = useCallback(
    async (mostrarLoader = false) => {
      if (mostrarLoader) setCargando(true);
      setError(null);

      try {
        let url = '/api/kds/pedidos';
        if (usuario?.rol === 'DUENO' && sucursalSeleccionada) {
          url += `?sucursalId=${sucursalSeleccionada}`;
        }

        const respuesta = await fetchConToken(url);
        if (!respuesta.ok) {
          throw new Error(t.kds.errorCargar);
        }

        const datos = await respuesta.json();
        const listaPedidos = datos.ordenes || [];
        setPedidos(listaPedidos);
        if (datos.sucursalNombre) {
          setSucursalNombre(datos.sucursalNombre);
        }

        // Detección de nuevos pedidos para emitir sonido (HU-13)
        if (!primeraCargaRef.current) {
          const nuevos = listaPedidos.some((p) => !pedidosIdsRef.current.has(p.id));
          if (nuevos && sonidoHabilitado) {
            emitirSonidoNuevoPedido();
          }
        } else {
          primeraCargaRef.current = false;
        }

        pedidosIdsRef.current = new Set(listaPedidos.map((p) => p.id));
      } catch (err) {
        setError(err.message || t.kds.errorCargar);
      } finally {
        if (mostrarLoader) setCargando(false);
      }
    },
    [fetchConToken, usuario, sucursalSeleccionada, sonidoHabilitado, t]
  );

  // Sondeo periódico cada 4 segundos (HU-13, RN-TiempoReal)
  useEffect(() => {
    cargarPedidos(true);
    const intervalo = setInterval(() => {
      cargarPedidos(false);
    }, 4000);

    return () => clearInterval(intervalo);
  }, [cargarPedidos]);

  // Avanzar estado del pedido (HU-14, RN-21, RN-24)
  const handleAvanzarEstado = async (ordenId, nuevoEstado) => {
    setProcesandoId(ordenId);
    setError(null);

    try {
      const res = await fetchConToken(`/api/kds/pedidos/${ordenId}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado })
      });

      const datos = await res.json();

      if (!res.ok) {
        throw new Error(datos.mensaje || 'Error al actualizar estado');
      }

      // Si pasa a ENTREGADO, abre automáticamente el modal con el ticket recién generado (HU-17, RN-24)
      if (nuevoEstado === 'ENTREGADO' && datos.ticket) {
        setTicketParaImprimir(datos.ticket);
      }

      await cargarPedidos(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setProcesandoId(null);
    }
  };

  // Registrar cobro en barra (HU-15, RN-23)
  const handleRegistrarPago = async (ordenId) => {
    setProcesandoId(ordenId);
    setError(null);

    try {
      const res = await fetchConToken(`/api/kds/pedidos/${ordenId}/pago`, {
        method: 'PATCH'
      });

      const datos = await res.json();
      if (!res.ok) {
        throw new Error(datos.mensaje || 'Error al registrar el pago');
      }

      await cargarPedidos(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setProcesandoId(null);
    }
  };

  // Confirmar cancelación con motivo (HU-16, RN-22)
  const handleConfirmarCancelacion = async (motivo) => {
    if (!ordenParaCancelar) return;
    setProcesandoAccion(true);
    setError(null);

    try {
      const res = await fetchConToken(`/api/kds/pedidos/${ordenParaCancelar.id}/cancelar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo })
      });

      const datos = await res.json();
      if (!res.ok) {
        throw new Error(datos.mensaje || 'Error al cancelar el pedido');
      }

      setOrdenParaCancelar(null);
      await cargarPedidos(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setProcesandoAccion(false);
    }
  };

  // Consultar e imprimir ticket (HU-17, RN-24)
  const handleVerTicket = async (ordenId) => {
    setProcesandoId(ordenId);
    try {
      const res = await fetchConToken(`/api/kds/pedidos/${ordenId}/ticket`);
      const datos = await res.json();
      if (!res.ok) throw new Error(datos.mensaje || 'Error al consultar ticket');
      setTicketParaImprimir(datos);
    } catch (err) {
      setError(err.message);
    } finally {
      setProcesandoId(null);
    }
  };

  // Reimprimir ticket sumando 1 al contador en servidor (RN-24)
  const handleReimprimirTicket = async () => {
    if (!ticketParaImprimir?.ordenId) return;
    try {
      const res = await fetchConToken(
        `/api/kds/pedidos/${ticketParaImprimir.ordenId}/ticket/reimprimir`,
        { method: 'POST' }
      );
      const datos = await res.json();
      if (res.ok) {
        setTicketParaImprimir((prev) => ({
          ...prev,
          reimpresiones: datos.reimpresiones
        }));
      }
    } catch {
      // Si la llamada falla, la impresión nativa prosigue
    }
  };

  return (
    <div className="min-h-screen bg-[#181214] text-[#F5EDE8] flex flex-col font-sans select-none">
      {/* Encabezado KDS oscuro según docs/diseno.md */}
      <header className="bg-[#231B1D] border-b border-[#3D2E32] px-4 py-3 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Coffee className="w-6 h-6 text-[var(--color-accion)] shrink-0" />
          <div>
            <h1 className="font-serif font-bold text-lg text-white leading-tight">
              {t.kds.titulo}
            </h1>
            <div className="flex items-center gap-2 text-xs text-[#A8989C]">
              <span className="font-mono text-[#D4A373]">
                {sucursalNombre || 'Sucursal'}
              </span>
              <span>•</span>
              <span className="font-mono">{pedidos.length} pedidos activos</span>
            </div>
          </div>
        </div>

        {/* Acciones del encabezado */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Selector de sucursal para Dueño */}
          {usuario?.rol === 'DUENO' && sucursalesDisponibles.length > 1 && (
            <select
              value={sucursalSeleccionada || ''}
              onChange={(e) => setSucursalSeleccionada(Number(e.target.value))}
              className="text-xs bg-[#181214] border border-[#3D2E32] text-[#F5EDE8] rounded-[var(--radio-chico)] px-2 py-1 focus:outline-hidden"
            >
              {sucursalesDisponibles.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          )}

          {/* Selector de idioma */}
          <button
            onClick={() => cambiarIdioma(idioma === 'es' ? 'en' : 'es')}
            className="text-xs px-2 py-1 rounded-[var(--radio-chico)] bg-[#3D2E32] text-[#F5EDE8] hover:text-white transition-colors cursor-pointer font-medium"
            title="Cambiar idioma / Switch language"
          >
            {idioma === 'es' ? 'EN' : 'ES'}
          </button>

          {/* Botón de alerta sonora (HU-13) */}
          <button
            onClick={alternarSonido}
            className={`p-1.5 rounded-[var(--radio-chico)] border transition-colors cursor-pointer ${
              sonidoHabilitado
                ? 'bg-[#3D2E32] border-[#4E383C] text-[var(--color-accion)]'
                : 'bg-transparent border-transparent text-[#A8989C] hover:text-white'
            }`}
            title={sonidoHabilitado ? t.kds.sonidoActivado : t.kds.sonidoSilenciado}
          >
            {sonidoHabilitado ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

          {/* Cambiar contraseña */}
          <button
            onClick={() => setMostrarModalPassword(true)}
            className="hidden sm:flex items-center gap-1.5 text-xs text-[#A8989C] hover:text-white transition-colors cursor-pointer"
          >
            <KeyRound className="w-4 h-4" />
            <span>{t.password.titulo}</span>
          </button>

          {/* Refrescar manual */}
          <button
            onClick={() => cargarPedidos(true)}
            className="p-1.5 text-[#A8989C] hover:text-white transition-colors cursor-pointer"
            title="Actualizar lista de pedidos"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Cerrar sesión */}
          <button
            onClick={cerrarSesion}
            className="flex items-center gap-1.5 text-xs text-[#A8989C] hover:text-white transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">{t.navegacion.cerrarSesion}</span>
          </button>
        </div>
      </header>

      {/* Alerta de error en la barra */}
      {error && (
        <div className="bg-rose-950/60 border-b border-rose-900/60 text-rose-200 px-4 py-2 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="underline text-xs cursor-pointer hover:text-white ml-4"
          >
            {t.kds.cerrar}
          </button>
        </div>
      )}

      {/* Contenedor principal de comandas */}
      <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
        {cargando ? (
          <div className="h-64 flex flex-col items-center justify-center text-[#A8989C] gap-3">
            <RotateCw className="w-8 h-8 animate-spin text-[var(--color-accion)]" />
            <p className="text-sm">{t.kds.cargando}</p>
          </div>
        ) : pedidos.length === 0 ? (
          <div className="h-96 flex flex-col items-center justify-center border border-dashed border-[#3D2E32] rounded-[var(--radio-medio)] text-[#A8989C] text-center p-6 bg-[#231B1D]">
            <Coffee className="w-12 h-12 mb-3 opacity-30 text-[var(--color-accion)]" />
            <p className="text-sm max-w-md leading-relaxed">
              {t.kds.sinPedidos}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {pedidos.map((orden) => (
              <TarjetaPedidoKds
                key={orden.id}
                orden={orden}
                onAvanzarEstado={handleAvanzarEstado}
                onRegistrarPago={handleRegistrarPago}
                onAbrirCancelar={(o) => setOrdenParaCancelar(o)}
                onVerTicket={handleVerTicket}
                procesandoId={procesandoId}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modal para cambiar contraseña */}
      {mostrarModalPassword && (
        <ModalCambiarPassword onCerrar={() => setMostrarModalPassword(false)} />
      )}

      {/* Modal para cancelar pedido con motivo obligatorio (HU-16, RN-22) */}
      {ordenParaCancelar && (
        <ModalCancelarPedido
          orden={ordenParaCancelar}
          onCerrar={() => setOrdenParaCancelar(null)}
          onConfirmar={handleConfirmarCancelacion}
          procesando={procesandoAccion}
        />
      )}

      {/* Modal para visualización e impresión de ticket despachado (HU-17, RN-24) */}
      {ticketParaImprimir && (
        <ModalTicketImpresion
          ticket={ticketParaImprimir}
          onCerrar={() => setTicketParaImprimir(null)}
          onReimprimir={handleReimprimirTicket}
          procesando={procesandoAccion}
        />
      )}
    </div>
  );
}
