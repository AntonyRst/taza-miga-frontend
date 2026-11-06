import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useIdioma } from '../../context/IdiomaContext.jsx';
import {
  Search,
  Printer,
  Calendar,
  RotateCw,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  UserCheck
} from 'lucide-react';
import ModalTicketImpresion from '../kds/ModalTicketImpresion.jsx';

export default function AdminHistorialPedidos() {
  const { usuario, fetchConToken } = useAuth();
  const { t } = useIdioma();

  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Filtros
  const [estado, setEstado] = useState('TODOS');
  const [metodoPago, setMetodoPago] = useState('TODOS');
  const [baristaId, setBaristaId] = useState('');
  const [sucursalId, setSucursalId] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [ticketParaVer, setTicketParaVer] = useState(null);

  // Listas auxiliares para selectores
  const [baristas, setBaristas] = useState([]);
  const [sucursales, setSucursales] = useState([]);

  const esDueno = usuario?.rol === 'DUENO';

  // Cargar lista de baristas y sucursales (para Dueño)
  useEffect(() => {
    fetchConToken('/api/admin/personal?cargo=BARISTA')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setBaristas(Array.isArray(data) ? data : []))
      .catch(() => {});

    if (esDueno) {
      fetchConToken('/api/admin/sucursales')
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => setSucursales(Array.isArray(data) ? data : []))
        .catch(() => {});
    }
  }, [esDueno, fetchConToken]);

  const cargarHistorial = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (estado !== 'TODOS') params.append('estado', estado);
      if (metodoPago !== 'TODOS') params.append('metodoPago', metodoPago);
      if (baristaId) params.append('baristaId', baristaId);
      if (sucursalId) params.append('sucursalId', sucursalId);
      if (fechaInicio) params.append('fechaInicio', fechaInicio);
      if (fechaFin) params.append('fechaFin', fechaFin);
      if (busqueda) params.append('q', busqueda);

      const res = await fetchConToken(`/api/admin/pedidos-historial?${params.toString()}`);
      if (!res.ok) throw new Error('Error al cargar el historial de pedidos');
      const data = await res.json();
      setPedidos(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, [fetchConToken, estado, metodoPago, baristaId, sucursalId, fechaInicio, fechaFin, busqueda]);

  useEffect(() => {
    cargarHistorial();
  }, [cargarHistorial]);

  const handleVerTicket = async (ordenId) => {
    try {
      const res = await fetchConToken(`/api/kds/pedidos/${ordenId}/ticket`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje || 'Ticket no encontrado');
      setTicketParaVer(data);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleReimprimir = async () => {
    if (!ticketParaVer?.ordenId) return;
    try {
      const res = await fetchConToken(
        `/api/kds/pedidos/${ticketParaVer.ordenId}/ticket/reimprimir`,
        { method: 'POST' }
      );
      const data = await res.json();
      if (res.ok) {
        setTicketParaVer((prev) => ({
          ...prev,
          reimpresiones: data.reimpresiones
        }));
        cargarHistorial();
      }
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[var(--color-borde)]">
        <div>
          <h2 className="font-serif font-bold text-xl text-[var(--color-primario)]">
            {t.admin.historialPedidosTitulo}
          </h2>
          <p className="text-xs text-[var(--color-texto-suave)] mt-0.5">
            Búsqueda de pedidos pasados, verificación de cobros y reimpresión de tickets (HU-23).
          </p>
        </div>
      </div>

      {/* Barra de filtros (HU-23: fecha, estado, método de pago y barista) */}
      <div className="space-y-3 bg-[var(--color-fondo)] p-3 rounded-[var(--radio-chico)] border border-[var(--color-borde)] text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Buscador */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-[var(--color-texto-suave)]" />
            <input
              type="text"
              placeholder={t.admin.buscarClienteONumero}
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[var(--color-superficie)] border border-[var(--color-borde)] rounded-[var(--radio-chico)] focus:outline-hidden"
            />
          </div>

          {/* Estado */}
          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            className="bg-[var(--color-superficie)] border border-[var(--color-borde)] rounded-[var(--radio-chico)] px-2.5 py-1.5 focus:outline-hidden"
          >
            <option value="TODOS">{t.admin.todosLosEstados}</option>
            <option value="RECIBIDO">Recibido</option>
            <option value="PREPARACION">En preparación</option>
            <option value="LISTO">Listo</option>
            <option value="ENTREGADO">Entregado</option>
            <option value="CANCELADO">Cancelado</option>
          </select>

          {/* Método de pago */}
          <select
            value={metodoPago}
            onChange={(e) => setMetodoPago(e.target.value)}
            className="bg-[var(--color-superficie)] border border-[var(--color-borde)] rounded-[var(--radio-chico)] px-2.5 py-1.5 focus:outline-hidden"
          >
            <option value="TODOS">{t.admin.todosLosMetodos}</option>
            <option value="BARRA">Pago en barra</option>
            <option value="TARJETA_DEMO">Tarjeta simulada</option>
          </select>

          {/* Barista que despachó */}
          <select
            value={baristaId}
            onChange={(e) => setBaristaId(e.target.value)}
            className="bg-[var(--color-superficie)] border border-[var(--color-borde)] rounded-[var(--radio-chico)] px-2.5 py-1.5 focus:outline-hidden"
          >
            <option value="">{t.admin.todosLosBaristas}</option>
            {baristas.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Fila secundaria: Fechas y Sucursal (Dueño) */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[var(--color-borde)]">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[var(--color-accion)]" />
            <span className="text-[11px] text-[var(--color-texto-suave)]">Desde:</span>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="px-2 py-1 bg-[var(--color-superficie)] border border-[var(--color-borde)] rounded-[var(--radio-chico)]"
            />
            <span className="text-[11px] text-[var(--color-texto-suave)]">Hasta:</span>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="px-2 py-1 bg-[var(--color-superficie)] border border-[var(--color-borde)] rounded-[var(--radio-chico)]"
            />
          </div>

          {esDueno && (
            <select
              value={sucursalId}
              onChange={(e) => setSucursalId(e.target.value)}
              className="bg-[var(--color-superficie)] border border-[var(--color-borde)] rounded-[var(--radio-chico)] px-2.5 py-1 focus:outline-hidden"
            >
              <option value="">Todas las sucursales</option>
              {sucursales.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          )}

          {(fechaInicio || fechaFin || baristaId || sucursalId || busqueda || estado !== 'TODOS' || metodoPago !== 'TODOS') && (
            <button
              onClick={() => {
                setEstado('TODOS');
                setMetodoPago('TODOS');
                setBaristaId('');
                setSucursalId('');
                setFechaInicio('');
                setFechaFin('');
                setBusqueda('');
              }}
              className="text-xs text-[var(--color-accion)] underline cursor-pointer ml-auto"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {cargando ? (
        <div className="py-12 flex justify-center text-[var(--color-texto-suave)]">
          <RotateCw className="w-6 h-6 animate-spin text-[var(--color-accion)]" />
        </div>
      ) : pedidos.length === 0 ? (
        <div className="py-12 text-center text-xs text-[var(--color-texto-suave)] border border-dashed border-[var(--color-borde)] rounded-[var(--radio-chico)]">
          No se encontraron pedidos con los filtros seleccionados
        </div>
      ) : (
        <div className="overflow-x-auto border border-[var(--color-borde)] rounded-[var(--radio-chico)]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--color-fondo)] text-[var(--color-texto-suave)] uppercase font-mono text-[11px] border-b border-[var(--color-borde)]">
              <tr>
                <th className="px-3 py-2.5">Pedido #</th>
                <th className="px-3 py-2.5">Fecha</th>
                <th className="px-3 py-2.5">Cliente</th>
                <th className="px-3 py-2.5">Sucursal / Modalidad</th>
                <th className="px-3 py-2.5">{t.admin.metodoPagoCol}</th>
                <th className="px-3 py-2.5">Total</th>
                <th className="px-3 py-2.5">Estado</th>
                <th className="px-3 py-2.5 text-right">Ticket</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-borde)]">
              {pedidos.map((o) => (
                <tr key={o.id} className="hover:bg-[var(--color-fondo)]/40">
                  <td className="px-3 py-3 font-mono font-bold text-[var(--color-primario)]">
                    #{o.numeroOrden}
                  </td>
                  <td className="px-3 py-3 font-mono text-[var(--color-texto-suave)]">
                    {new Date(o.creadoEn).toLocaleDateString('es-SV', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="px-3 py-3 font-semibold text-[var(--color-primario)]">
                    {o.nombreCliente}
                  </td>
                  <td className="px-3 py-3 text-[var(--color-texto-suave)]">
                    <span>{o.sucursalNombre}</span>
                    <span className="block text-[11px] font-mono">
                      {o.tipoEntrega === 'MESA' ? `Mesa ${o.numeroMesa}` : 'Para llevar'}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="font-medium text-[var(--color-primario)] block">
                      {o.metodoPago === 'BARRA' ? 'En barra' : 'Tarjeta simulada'}
                    </span>
                    <span className="text-[10px] font-mono text-[var(--color-texto-suave)] uppercase">
                      {o.estadoPago}
                    </span>
                  </td>
                  <td className="px-3 py-3 font-mono font-bold text-[var(--color-primario)]">
                    ${o.total.toFixed(2)}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-[var(--radio-chico)] font-medium font-mono ${
                        o.estado === 'ENTREGADO'
                          ? 'bg-emerald-100 text-emerald-800'
                          : o.estado === 'CANCELADO'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {o.estado}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    {o.tieneTicket ? (
                      <div className="inline-flex flex-col items-end">
                        <button
                          onClick={() => handleVerTicket(o.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[var(--color-accion)] hover:bg-[var(--color-fondo)] rounded-[var(--radio-chico)] border border-[var(--color-borde)] cursor-pointer"
                          title="Ver ticket de venta"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Ticket ({o.ticketReimpresiones})</span>
                        </button>
                        {o.baristaNombre && (
                          <span className="text-[10px] text-[var(--color-texto-suave)] mt-0.5 font-mono">
                            {t.admin.despachadoPor}: {o.baristaNombre}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[11px] text-[var(--color-texto-suave)] font-mono">
                        —
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Ticket con impresión */}
      {ticketParaVer && (
        <ModalTicketImpresion
          ticket={ticketParaVer}
          onCerrar={() => setTicketParaVer(null)}
          onReimprimir={handleReimprimir}
        />
      )}
    </div>
  );
}
