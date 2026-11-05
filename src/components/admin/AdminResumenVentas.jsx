import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useIdioma } from '../../context/IdiomaContext.jsx';
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Clock,
  AlertTriangle,
  RotateCw,
  Calendar,
  Filter
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Colores sobrios tomados de docs/diseno.md (espresso, ámbar, salvia)
const COLORES = ['#C47335', '#4E6E58', '#2C1A1D', '#8C6753', '#D4A373', '#A8989C'];

export default function AdminResumenVentas() {
  const { usuario, fetchConToken } = useAuth();
  const { t } = useIdioma();

  const [periodo, setPeriodo] = useState('hoy');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [sucursalId, setSucursalId] = useState('');
  const [sucursales, setSucursales] = useState([]);

  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const esDueno = usuario?.rol === 'DUENO';

  // Cargar sucursales para el filtro de dueño
  useEffect(() => {
    if (esDueno) {
      fetchConToken('/api/admin/sucursales')
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => setSucursales(data))
        .catch(() => {});
    }
  }, [esDueno, fetchConToken]);

  // Cargar métricas del dashboard (HU-22, RN-30 a RN-35)
  const cargarMetricas = useCallback(async () => {
    setCargando(true);
    setError(null);

    try {
      const params = new URLSearchParams({ periodo });
      if (periodo === 'personalizado') {
        if (fechaInicio) params.append('fechaInicio', fechaInicio);
        if (fechaFin) params.append('fechaFin', fechaFin);
      }
      if (sucursalId) params.append('sucursalId', sucursalId);

      const res = await fetchConToken(`/api/admin/metricas?${params.toString()}`);
      if (!res.ok) throw new Error('Error al cargar las métricas de ventas');
      const data = await res.json();
      setDatos(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, [fetchConToken, periodo, fechaInicio, fechaFin, sucursalId]);

  useEffect(() => {
    cargarMetricas();
  }, [cargarMetricas]);

  const cifras = datos?.cifras || {
    totalVentas: 0,
    totalPedidosEntregados: 0,
    ticketPromedio: 0,
    tiempoPromedioPreparacionMin: 0,
    tiempoPromedioEsperaMin: 0,
    tasaCancelacion: 0,
    motivosCancelacion: []
  };

  const desgloses = datos?.desgloses || {};
  const topProductos = datos?.productosMasVendidos || [];

  return (
    <div className="space-y-6">
      {/* Barra de Filtros de Periodo y Sucursal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[var(--color-borde)]">
        <div>
          <h2 className="font-serif font-bold text-xl text-[var(--color-primario)]">
            {t.admin.pestanaResumen}
          </h2>
          <p className="text-xs text-[var(--color-texto-suave)] mt-0.5">
            Cifras reales calculadas en base de datos. Solo cuentan pedidos entregados (RN-30 a RN-35).
          </p>
        </div>

        {/* Botones de periodo */}
        <div className="flex flex-wrap items-center gap-2">
          {['hoy', '7dias', 'mes', 'personalizado'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-[var(--radio-chico)] transition-colors cursor-pointer ${
                periodo === p
                  ? 'bg-[var(--color-primario)] text-white'
                  : 'bg-[var(--color-fondo)] text-[var(--color-texto-suave)] hover:bg-[var(--color-borde)]'
              }`}
            >
              {p === 'hoy'
                ? t.admin.hoy
                : p === '7dias'
                ? t.admin.ultimos7Dias
                : p === 'mes'
                ? t.admin.esteMes
                : t.admin.rangoPersonalizado}
            </button>
          ))}

          {/* Selector de sucursal para Dueño */}
          {esDueno && (
            <select
              value={sucursalId}
              onChange={(e) => setSucursalId(e.target.value)}
              className="text-xs bg-[var(--color-fondo)] border border-[var(--color-borde)] rounded-[var(--radio-chico)] px-2.5 py-1.5 focus:outline-hidden"
            >
              <option value="">{t.kds.seleccionarSucursal || 'Todas las sucursales'}</option>
              {sucursales.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Rango de fechas personalizado */}
      {periodo === 'personalizado' && (
        <div className="flex items-center gap-3 bg-[var(--color-fondo)] p-3 rounded-[var(--radio-chico)] border border-[var(--color-borde)] text-xs">
          <Calendar className="w-4 h-4 text-[var(--color-accion)]" />
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="px-2 py-1 bg-[var(--color-superficie)] border border-[var(--color-borde)] rounded-[var(--radio-chico)]"
          />
          <span>al</span>
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="px-2 py-1 bg-[var(--color-superficie)] border border-[var(--color-borde)] rounded-[var(--radio-chico)]"
          />
          <button
            onClick={cargarMetricas}
            className="px-3 py-1 bg-[var(--color-accion)] text-[#2C1A1D] font-bold rounded-[var(--radio-chico)] cursor-pointer"
          >
            Aplicar
          </button>
        </div>
      )}

      {cargando ? (
        <div className="py-16 flex justify-center text-[var(--color-texto-suave)]">
          <RotateCw className="w-8 h-8 animate-spin text-[var(--color-accion)]" />
        </div>
      ) : (
        <>
          {/* Cifras principales (KPIs) sobrias sin sombras de color (docs/diseno.md) */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            {/* Ventas totales (RN-30) */}
            <div className="bg-[var(--color-superficie)] border border-[var(--color-borde)] rounded-[var(--radio-chico)] p-3.5">
              <span className="text-[11px] font-mono uppercase text-[var(--color-texto-suave)] block mb-1">
                {t.admin.ventasTotales}
              </span>
              <p className="text-xl font-bold font-mono text-[var(--color-primario)]">
                ${cifras.totalVentas.toFixed(2)}
              </p>
            </div>

            {/* Pedidos entregados */}
            <div className="bg-[var(--color-superficie)] border border-[var(--color-borde)] rounded-[var(--radio-chico)] p-3.5">
              <span className="text-[11px] font-mono uppercase text-[var(--color-texto-suave)] block mb-1">
                {t.admin.pedidosEntregados}
              </span>
              <p className="text-xl font-bold font-mono text-[var(--color-primario)]">
                {cifras.totalPedidosEntregados}
              </p>
            </div>

            {/* Ticket promedio (RN-31) */}
            <div className="bg-[var(--color-superficie)] border border-[var(--color-borde)] rounded-[var(--radio-chico)] p-3.5">
              <span className="text-[11px] font-mono uppercase text-[var(--color-texto-suave)] block mb-1">
                {t.admin.ticketPromedio}
              </span>
              <p className="text-xl font-bold font-mono text-[var(--color-primario)]">
                ${cifras.ticketPromedio.toFixed(2)}
              </p>
            </div>

            {/* Tiempo promedio de preparación (RN-33) */}
            <div className="bg-[var(--color-superficie)] border border-[var(--color-borde)] rounded-[var(--radio-chico)] p-3.5">
              <span className="text-[11px] font-mono uppercase text-[var(--color-texto-suave)] block mb-1">
                {t.admin.tiempoPrepPromedio}
              </span>
              <p className="text-xl font-bold font-mono text-[var(--color-primario)]">
                {cifras.tiempoPromedioPreparacionMin} min
              </p>
            </div>

            {/* Tiempo promedio de espera total (RN-33) */}
            <div className="bg-[var(--color-superficie)] border border-[var(--color-borde)] rounded-[var(--radio-chico)] p-3.5">
              <span className="text-[11px] font-mono uppercase text-[var(--color-texto-suave)] block mb-1">
                {t.admin.tiempoEsperaPromedio}
              </span>
              <p className="text-xl font-bold font-mono text-[var(--color-primario)]">
                {cifras.tiempoPromedioEsperaMin} min
              </p>
            </div>

            {/* Tasa de cancelación (RN-34) */}
            <div className="bg-[var(--color-superficie)] border border-[var(--color-borde)] rounded-[var(--radio-chico)] p-3.5">
              <span className="text-[11px] font-mono uppercase text-[var(--color-texto-suave)] block mb-1">
                {t.admin.tasaCancelacion}
              </span>
              <p className="text-xl font-bold font-mono text-rose-700">
                {cifras.tasaCancelacion}%
              </p>
            </div>
          </div>

          {/* Motivos de cancelación agrupados si existen (RN-34) */}
          {cifras.motivosCancelacion && cifras.motivosCancelacion.length > 0 && (
            <div className="p-3 bg-rose-50/50 border border-rose-200/60 rounded-[var(--radio-chico)] text-xs text-rose-900">
              <span className="font-bold block mb-1">
                {t.admin.motivosCancelacion} ({cifras.pedidosCancelados} cancelados):
              </span>
              <div className="flex flex-wrap gap-2">
                {cifras.motivosCancelacion.map((m, idx) => (
                  <span
                    key={idx}
                    className="bg-white border border-rose-200 px-2 py-0.5 rounded-[var(--radio-chico)] text-[11px]"
                  >
                    "{m.motivo}": <strong>{m.cantidad}</strong>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Gráficos y Desgloses (RN-32, RN-35) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
            {/* Gráfico 1: Ventas por día o por hora */}
            <div className="bg-[var(--color-superficie)] border border-[var(--color-borde)] rounded-[var(--radio-medio)] p-4 shadow-xs">
              <h3 className="font-serif font-bold text-sm text-[var(--color-primario)] mb-3">
                {periodo === 'hoy' ? t.admin.graficoVentasHora : t.admin.graficoVentasDia}
              </h3>
              <div className="h-60 w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  {periodo === 'hoy' ? (
                    <BarChart data={desgloses.ventasPorHora || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E7DFD8" />
                      <XAxis dataKey="hora" stroke="#6B5E62" />
                      <YAxis stroke="#6B5E62" />
                      <Tooltip />
                      <Bar dataKey="totalVentas" fill="#C47335" name="Ventas ($)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  ) : (
                    <LineChart data={desgloses.ventasPorDia || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E7DFD8" />
                      <XAxis dataKey="fecha" stroke="#6B5E62" />
                      <YAxis stroke="#6B5E62" />
                      <Tooltip />
                      <Line type="monotone" dataKey="totalVentas" stroke="#C47335" strokeWidth={2} name="Ventas ($)" />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráfico 2: Ventas por Categoría */}
            <div className="bg-[var(--color-superficie)] border border-[var(--color-borde)] rounded-[var(--radio-medio)] p-4 shadow-xs">
              <h3 className="font-serif font-bold text-sm text-[var(--color-primario)] mb-3">
                {t.admin.graficoCategorias}
              </h3>
              <div className="h-60 w-full text-xs flex items-center justify-center">
                {desgloses.ventasPorCategoria && desgloses.ventasPorCategoria.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={desgloses.ventasPorCategoria} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#E7DFD8" />
                      <XAxis type="number" stroke="#6B5E62" />
                      <YAxis dataKey="nombreEs" type="category" stroke="#6B5E62" width={90} />
                      <Tooltip />
                      <Bar dataKey="totalVentas" fill="#4E6E58" name="Ventas ($)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-xs text-[var(--color-texto-suave)]">Sin ventas en este periodo</p>
                )}
              </div>
            </div>

            {/* Lista: Productos más vendidos (RN-32) */}
            <div className="bg-[var(--color-superficie)] border border-[var(--color-borde)] rounded-[var(--radio-medio)] p-4 shadow-xs">
              <h3 className="font-serif font-bold text-sm text-[var(--color-primario)] mb-3">
                {t.admin.topProductos} (RN-32)
              </h3>
              {topProductos.length === 0 ? (
                <p className="text-xs text-[var(--color-texto-suave)] py-8 text-center">
                  Sin productos vendidos en este periodo
                </p>
              ) : (
                <div className="space-y-2.5">
                  {topProductos.map((prod, idx) => (
                    <div
                      key={prod.productoId || idx}
                      className="flex items-center justify-between text-xs p-2 bg-[var(--color-fondo)] rounded-[var(--radio-chico)] border border-[var(--color-borde)]"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[var(--color-accion)] w-4 text-center">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-[var(--color-primario)]">
                          {prod.nombreProducto}
                        </span>
                      </div>
                      <div className="text-right font-mono">
                        <span className="font-bold text-[var(--color-primario)] mr-2">
                          {prod.unidadesVendidas} {t.admin.unidades}
                        </span>
                        <span className="text-[var(--color-texto-suave)]">
                          (${prod.ingresosTotales.toFixed(2)})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modalidad y Método de Pago (RN-35) */}
            <div className="bg-[var(--color-superficie)] border border-[var(--color-borde)] rounded-[var(--radio-medio)] p-4 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="font-serif font-bold text-sm text-[var(--color-primario)] mb-3">
                  {t.admin.graficoModalidad} & {t.admin.graficoMetodosPago}
                </h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {/* Modalidad */}
                  <div className="bg-[var(--color-fondo)] p-3 rounded-[var(--radio-chico)] border border-[var(--color-borde)] space-y-1.5">
                    <span className="font-bold text-[11px] uppercase text-[var(--color-texto-suave)] block mb-1">
                      {t.admin.graficoModalidad}
                    </span>
                    {desgloses.ventasPorModalidad?.map((m) => (
                      <div key={m.tipoEntrega} className="flex justify-between items-center text-xs">
                        <span>{m.tipoEntrega === 'MESA' ? 'En mesa' : 'Para llevar'}:</span>
                        <strong className="font-mono">${m.totalVentas.toFixed(2)}</strong>
                      </div>
                    ))}
                  </div>

                  {/* Método de pago */}
                  <div className="bg-[var(--color-fondo)] p-3 rounded-[var(--radio-chico)] border border-[var(--color-borde)] space-y-1.5">
                    <span className="font-bold text-[11px] uppercase text-[var(--color-texto-suave)] block mb-1">
                      {t.admin.graficoMetodosPago}
                    </span>
                    {desgloses.ventasPorMetodoPago?.map((p) => (
                      <div key={p.metodoPago} className="flex justify-between items-center text-xs">
                        <span>{p.metodoPago === 'BARRA' ? 'En barra' : 'Tarjeta'}:</span>
                        <strong className="font-mono">${p.totalVentas.toFixed(2)}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Baristas que más despacharon (RN-35) */}
              <div className="mt-4 pt-3 border-t border-[var(--color-borde)]">
                <span className="font-bold text-[11px] uppercase text-[var(--color-texto-suave)] block mb-2">
                  {t.admin.graficoBaristas}
                </span>
                <div className="flex flex-wrap gap-2 text-xs">
                  {desgloses.ventasPorBarista?.map((b, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-[var(--color-fondo)] border border-[var(--color-borde)] rounded-[var(--radio-chico)] flex items-center gap-1.5"
                    >
                      <span className="font-medium">{b.baristaNombre}:</span>
                      <strong className="font-mono text-[var(--color-primario)]">
                        {b.pedidosDespachados} despachos
                      </strong>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
