import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useIdioma } from '../../context/IdiomaContext.jsx';
import {
  RotateCw,
  Calendar
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
  ResponsiveContainer
} from 'recharts';

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
    pedidosCancelados: 0,
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
            {t.admin.resumenSubtitulo}
          </p>
        </div>

        {/* Botones de periodo como chips redondeados con activo en ámbar (docs/diseno.md) */}
        <div className="flex flex-wrap items-center gap-2">
          {['hoy', '7dias', 'mes', 'personalizado'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-[var(--radio-pildora)] border transition-all cursor-pointer ${
                periodo === p
                  ? 'bg-[var(--color-accion)] text-white border-[var(--color-accion)] shadow-xs'
                  : 'bg-[var(--color-superficie)] text-[var(--color-texto-suave)] border-[var(--color-borde)] hover:bg-[var(--color-fondo)]'
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
              <option value="">{t.admin.todasLasSucursales || 'Todas las sucursales'}</option>
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
          <span>{t.admin.al}</span>
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="px-2 py-1 bg-[var(--color-superficie)] border border-[var(--color-borde)] rounded-[var(--radio-chico)]"
          />
          <button
            onClick={cargarMetricas}
            className="px-3 py-1 bg-[var(--color-accion)] text-[var(--color-primario)] font-bold rounded-[var(--radio-chico)] cursor-pointer"
          >
            {t.admin.aplicarBtn}
          </button>
        </div>
      )}

      {error ? (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-[var(--radio-chico)] text-xs">
          {error}
        </div>
      ) : cargando ? (
        <div className="py-16 flex justify-center text-[var(--color-texto-suave)]">
          <RotateCw className="w-8 h-8 animate-spin text-[var(--color-accion)]" />
        </div>
      ) : (
        <>
          {/* Cifras principales (KPIs) con esquinas redondeadas según tarjetas de catálogo (docs/diseno.md) */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
            {/* Ventas totales (RN-30) */}
            <div className="bg-[var(--color-superficie)] border border-[var(--color-borde)] rounded-[var(--radio-grande)] p-4 shadow-[var(--sombra-tarjeta)]">
              <span className="text-[11px] font-mono text-[var(--color-texto-suave)] block mb-1">
                {t.admin.ventasTotales}
              </span>
              <p className="text-2xl font-serif font-bold text-[var(--color-primario)] tabular-nums">
                ${cifras.totalVentas.toFixed(2)}
              </p>
            </div>

            {/* Pedidos entregados */}
            <div className="bg-[var(--color-superficie)] border border-[var(--color-borde)] rounded-[var(--radio-grande)] p-4 shadow-[var(--sombra-tarjeta)]">
              <span className="text-[11px] font-mono text-[var(--color-texto-suave)] block mb-1">
                {t.admin.pedidosEntregados}
              </span>
              <p className="text-2xl font-serif font-bold text-[var(--color-primario)] tabular-nums">
                {cifras.totalPedidosEntregados}
              </p>
            </div>

            {/* Ticket promedio (RN-31) */}
            <div className="bg-[var(--color-superficie)] border border-[var(--color-borde)] rounded-[var(--radio-grande)] p-4 shadow-[var(--sombra-tarjeta)]">
              <span className="text-[11px] font-mono text-[var(--color-texto-suave)] block mb-1">
                {t.admin.ticketPromedio}
              </span>
              <p className="text-2xl font-serif font-bold text-[var(--color-primario)] tabular-nums">
                ${cifras.ticketPromedio.toFixed(2)}
              </p>
            </div>

            {/* Tiempo promedio de preparación (RN-33) */}
            <div className="bg-[var(--color-superficie)] border border-[var(--color-borde)] rounded-[var(--radio-grande)] p-4 shadow-[var(--sombra-tarjeta)]">
              <span className="text-[11px] font-mono text-[var(--color-texto-suave)] block mb-1">
                {t.admin.tiempoPrepPromedio}
              </span>
              <p className="text-2xl font-serif font-bold text-[var(--color-primario)] tabular-nums">
                {cifras.tiempoPromedioPreparacionMin} <span className="text-xs font-sans font-normal text-[var(--color-texto-suave)]">min</span>
              </p>
            </div>

            {/* Tiempo promedio de espera total (RN-33) */}
            <div className="bg-[var(--color-superficie)] border border-[var(--color-borde)] rounded-[var(--radio-grande)] p-4 shadow-[var(--sombra-tarjeta)]">
              <span className="text-[11px] font-mono text-[var(--color-texto-suave)] block mb-1">
                {t.admin.tiempoEsperaPromedio}
              </span>
              <p className="text-2xl font-serif font-bold text-[var(--color-primario)] tabular-nums">
                {cifras.tiempoPromedioEsperaMin} <span className="text-xs font-sans font-normal text-[var(--color-texto-suave)]">min</span>
              </p>
            </div>

            {/* Tasa de cancelación (RN-34) con color semántico */}
            <div className="bg-[var(--color-superficie)] border border-[var(--color-borde)] rounded-[var(--radio-grande)] p-4 shadow-[var(--sombra-tarjeta)]">
              <span className="text-[11px] font-mono text-[var(--color-texto-suave)] block mb-1">
                {t.admin.tasaCancelacion}
              </span>
              <p className="text-2xl font-serif font-bold text-[var(--color-error)] tabular-nums">
                {cifras.tasaCancelacion}%
              </p>
            </div>
          </div>

          {/* Motivos de cancelación agrupados si existen (RN-34) */}
          {cifras.motivosCancelacion && cifras.motivosCancelacion.length > 0 && (
            <div className="p-3 bg-[var(--color-fondo)] border border-[var(--color-borde)] rounded-[var(--radio-chico)] text-xs text-[var(--color-texto)]">
              <span className="font-bold block mb-1 text-[var(--color-primario)]">
                {t.admin.motivosCancelacion} ({cifras.pedidosCancelados} {t.admin.cancelados}):
              </span>
              <div className="flex flex-wrap gap-2">
                {cifras.motivosCancelacion.map((m, idx) => (
                  <span
                    key={idx}
                    className="bg-[var(--color-superficie)] border border-[var(--color-borde)] px-2 py-0.5 rounded-[var(--radio-chico)] text-[11px]"
                  >
                    "{m.motivo}": <strong className="font-mono">{m.cantidad}</strong>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Gráficos y Desgloses (RN-32, RN-35, docs/diseno.md) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
            {/* Gráfico 1: Ventas por día o por hora */}
            <div className="bg-[var(--color-superficie)] border border-[var(--color-borde)] rounded-[var(--radio-grande)] p-5 shadow-[var(--sombra-tarjeta)]">
              <h3 className="font-serif font-bold text-sm text-[var(--color-primario)] mb-3">
                {periodo === 'hoy' ? t.admin.graficoVentasHora : t.admin.graficoVentasDia}
              </h3>
              <div className="h-60 w-full text-xs flex items-center justify-center">
                {((periodo === 'hoy' ? desgloses.ventasPorHora : desgloses.ventasPorDia) || []).some((d) => Number(d.totalVentas) > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    {periodo === 'hoy' ? (
                      <BarChart data={desgloses.ventasPorHora || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-borde)" />
                        <XAxis dataKey="hora" stroke="var(--color-texto-suave)" />
                        <YAxis stroke="var(--color-texto-suave)" />
                        <Tooltip />
                        <Bar dataKey="totalVentas" fill="var(--color-accion)" name="Ventas ($)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    ) : (
                      <LineChart data={desgloses.ventasPorDia || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-borde)" />
                        <XAxis dataKey="fecha" stroke="var(--color-texto-suave)" />
                        <YAxis stroke="var(--color-texto-suave)" />
                        <Tooltip />
                        <Line type="monotone" dataKey="totalVentas" stroke="var(--color-accion)" strokeWidth={2} name="Ventas ($)" />
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                ) : (
                  <p className="text-xs text-[var(--color-texto-suave)] text-center">{t.admin.sinVentasPeriodo}</p>
                )}
              </div>
            </div>

            {/* Gráfico 2: Ventas por Categoría */}
            <div className="bg-[var(--color-superficie)] border border-[var(--color-borde)] rounded-[var(--radio-grande)] p-5 shadow-[var(--sombra-tarjeta)]">
              <h3 className="font-serif font-bold text-sm text-[var(--color-primario)] mb-3">
                {t.admin.graficoCategorias}
              </h3>
              <div className="h-60 w-full text-xs flex items-center justify-center">
                {desgloses.ventasPorCategoria && desgloses.ventasPorCategoria.some((c) => Number(c.totalVentas) > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={desgloses.ventasPorCategoria} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-borde)" />
                      <XAxis type="number" stroke="var(--color-texto-suave)" />
                      <YAxis dataKey="nombreEs" type="category" stroke="var(--color-texto-suave)" width={100} />
                      <Tooltip />
                      <Bar dataKey="totalVentas" fill="var(--color-exito)" name="Ventas ($)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-xs text-[var(--color-texto-suave)] text-center">{t.admin.sinVentasPeriodo}</p>
                )}
              </div>
            </div>

            {/* Lista: Productos más vendidos (RN-32) */}
            <div className="bg-[var(--color-superficie)] border border-[var(--color-borde)] rounded-[var(--radio-grande)] p-5 shadow-[var(--sombra-tarjeta)]">
              <h3 className="font-serif font-bold text-sm text-[var(--color-primario)] mb-3">
                {t.admin.topProductos}
              </h3>
              {topProductos.length === 0 ? (
                <p className="text-xs text-[var(--color-texto-suave)] py-8 text-center">
                  {t.admin.sinProductosPeriodo}
                </p>
              ) : (
                <div className="space-y-2.5">
                  {topProductos.map((prod, idx) => (
                    <div
                      key={prod.productoId || idx}
                      className="flex items-center justify-between text-xs p-2.5 bg-[var(--color-fondo)] rounded-[var(--radio-chico)] border border-[var(--color-borde)]"
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
                        <span className="font-bold text-[var(--color-primario)] mr-2 tabular-nums">
                          {prod.unidadesVendidas} {t.admin.unidades}
                        </span>
                        <span className="text-[var(--color-texto-suave)] tabular-nums">
                          (${prod.ingresosTotales.toFixed(2)})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modalidad y Método de Pago (RN-35) */}
            <div className="bg-[var(--color-superficie)] border border-[var(--color-borde)] rounded-[var(--radio-grande)] p-5 shadow-[var(--sombra-tarjeta)] flex flex-col justify-between">
              <div>
                <h3 className="font-serif font-bold text-sm text-[var(--color-primario)] mb-3">
                  {t.admin.graficoModalidad} & {t.admin.graficoMetodosPago}
                </h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {/* Modalidad */}
                  <div className="bg-[var(--color-fondo)] p-3 rounded-[var(--radio-chico)] border border-[var(--color-borde)] space-y-1.5">
                    <span className="font-bold text-[11px] text-[var(--color-texto-suave)] block mb-1">
                      {t.admin.graficoModalidad}
                    </span>
                    {desgloses.ventasPorModalidad?.map((m) => (
                      <div key={m.tipoEntrega} className="flex justify-between items-center text-xs">
                        <span>{m.tipoEntrega === 'MESA' ? t.admin.enMesa : t.admin.paraLlevar}:</span>
                        <strong className="font-mono tabular-nums">${m.totalVentas.toFixed(2)}</strong>
                      </div>
                    ))}
                  </div>

                  {/* Método de pago */}
                  <div className="bg-[var(--color-fondo)] p-3 rounded-[var(--radio-chico)] border border-[var(--color-borde)] space-y-1.5">
                    <span className="font-bold text-[11px] text-[var(--color-texto-suave)] block mb-1">
                      {t.admin.graficoMetodosPago}
                    </span>
                    {desgloses.ventasPorMetodoPago?.map((p) => (
                      <div key={p.metodoPago} className="flex justify-between items-center text-xs">
                        <span>{p.metodoPago === 'BARRA' ? t.admin.enBarra : t.admin.tarjeta}:</span>
                        <strong className="font-mono tabular-nums">${p.totalVentas.toFixed(2)}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Baristas que más despacharon (RN-35) */}
              <div className="mt-4 pt-3 border-t border-[var(--color-borde)]">
                <span className="font-bold text-[11px] text-[var(--color-texto-suave)] block mb-2">
                  {t.admin.graficoBaristas}
                </span>
                <div className="flex flex-wrap gap-2 text-xs">
                  {desgloses.ventasPorBarista?.map((b, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-[var(--color-fondo)] border border-[var(--color-borde)] rounded-[var(--radio-chico)] flex items-center gap-1.5"
                    >
                      <span className="font-medium">{b.baristaNombre}:</span>
                      <strong className="font-mono text-[var(--color-primario)] tabular-nums">
                        {b.pedidosDespachados} {t.admin.despachos}
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
