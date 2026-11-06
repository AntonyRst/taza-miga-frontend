import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useIdioma } from '../../context/IdiomaContext.jsx';
import {
  ShieldAlert,
  RotateCw,
  AlertCircle
} from 'lucide-react';

export default function AdminAuditoria() {
  const { fetchConToken } = useAuth();
  const { t } = useIdioma();

  const [logs, setLogs] = useState([]);
  const [personal, setPersonal] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Filtros (HU-24: usuario, acción y fecha)
  const [usuarioId, setUsuarioId] = useState('');
  const [accion, setAccion] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  // Cargar lista de usuarios del negocio para el filtro
  useEffect(() => {
    async function cargarPersonal() {
      try {
        const res = await fetchConToken('/api/admin/personal');
        if (res.ok) {
          const data = await res.json();
          setPersonal(data);
        }
      } catch (err) {
        console.error('Error al cargar lista de personal:', err);
      }
    }
    cargarPersonal();
  }, [fetchConToken]);

  // Cargar bitácora de auditoría
  const cargarLogs = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (usuarioId) params.append('usuarioId', usuarioId);
      if (accion) params.append('accion', accion);
      if (fechaInicio) params.append('fechaInicio', fechaInicio);
      if (fechaFin) params.append('fechaFin', fechaFin);

      const res = await fetchConToken(`/api/admin/auditoria?${params.toString()}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.mensaje || errData.error || t.admin.sinAuditoria);
      }
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, [fetchConToken, usuarioId, accion, fechaInicio, fechaFin, t.admin.sinAuditoria]);

  useEffect(() => {
    cargarLogs();
  }, [cargarLogs]);

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[var(--color-borde)]">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[var(--color-primario)]" />
            <h2 className="font-serif font-bold text-xl text-[var(--color-primario)]">
              {t.admin.registroAuditoriaTitulo}
            </h2>
          </div>
          <p className="text-xs text-[var(--color-texto-suave)] mt-1">
            {t.admin.registroAuditoriaSubtitulo}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-[var(--color-fondo)] p-3 rounded-[var(--radio-chico)] border border-[var(--color-borde)] text-xs">
        {/* Filtro por usuario */}
        <select
          value={usuarioId}
          onChange={(e) => setUsuarioId(e.target.value)}
          aria-label={t.admin.todosLosUsuarios}
          className="bg-[var(--color-superficie)] border border-[var(--color-borde)] rounded-[var(--radio-chico)] px-2.5 py-1.5 focus:outline-hidden"
        >
          <option value="">{t.admin.todosLosUsuarios}</option>
          {personal.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre} {p.correo ? `(${p.correo})` : ''}
            </option>
          ))}
        </select>

        {/* Filtro por acción */}
        <select
          value={accion}
          onChange={(e) => setAccion(e.target.value)}
          aria-label={t.admin.todasLasAcciones}
          className="bg-[var(--color-superficie)] border border-[var(--color-borde)] rounded-[var(--radio-chico)] px-2.5 py-1.5 focus:outline-hidden"
        >
          <option value="">{t.admin.todasLasAcciones}</option>
          <option value="CAMBIO_PRECIO">{t.admin.accionCambioPrecio}</option>
          <option value="CANCELAR_PEDIDO">{t.admin.accionCancelarPedido}</option>
          <option value="RESET_PASSWORD">{t.admin.accionResetPassword}</option>
          <option value="TRASLADO_PERSONAL">{t.admin.accionTrasladoPersonal}</option>
          <option value="DESACTIVAR_SUCURSAL">{t.admin.accionDesactivarSucursal}</option>
          <option value="DESACTIVAR_USUARIO">{t.admin.accionDesactivarUsuario}</option>
          <option value="DESACTIVAR_PRODUCTO">{t.admin.accionDesactivarProducto}</option>
        </select>

        {/* Fecha inicio */}
        <div className="flex items-center gap-2">
          <span className="text-[var(--color-texto-suave)] whitespace-nowrap">{t.admin.desdeLabel}:</span>
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="w-full px-2 py-1 bg-[var(--color-superficie)] border border-[var(--color-borde)] rounded-[var(--radio-chico)]"
          />
        </div>

        {/* Fecha fin */}
        <div className="flex items-center gap-2">
          <span className="text-[var(--color-texto-suave)] whitespace-nowrap">{t.admin.hastaLabel}:</span>
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="w-full px-2 py-1 bg-[var(--color-superficie)] border border-[var(--color-borde)] rounded-[var(--radio-chico)]"
          />
        </div>
      </div>

      {/* Manejo de estados: Error, Carga, Vacío y Lista */}
      {error ? (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-[var(--radio-chico)] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
          <button
            onClick={cargarLogs}
            className="px-2.5 py-1 bg-red-100 hover:bg-red-200 rounded-[var(--radio-chico)] text-red-900 font-medium inline-flex items-center gap-1 cursor-pointer"
          >
            <RotateCw className="w-3 h-3" />
            {t.comun.reintentar}
          </button>
        </div>
      ) : cargando ? (
        <div className="py-12 flex justify-center text-[var(--color-texto-suave)]">
          <RotateCw className="w-6 h-6 animate-spin text-[var(--color-accion)]" />
        </div>
      ) : logs.length === 0 ? (
        <div className="py-12 text-center text-xs text-[var(--color-texto-suave)] border border-dashed border-[var(--color-borde)] rounded-[var(--radio-chico)]">
          {t.admin.sinAuditoria}
        </div>
      ) : (
        <div className="overflow-x-auto border border-[var(--color-borde)] rounded-[var(--radio-chico)]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--color-fondo)] text-[var(--color-texto-suave)] font-mono text-[11px] border-b border-[var(--color-borde)]">
              <tr>
                <th className="px-3 py-2.5">{t.admin.fechaHoraCol}</th>
                <th className="px-3 py-2.5">{t.admin.usuarioResponsableCol}</th>
                <th className="px-3 py-2.5">{t.admin.accionCol}</th>
                <th className="px-3 py-2.5">{t.admin.descripcionOperacionCol}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-borde)]">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-[var(--color-fondo)]/40 transition-colors">
                  <td className="px-3 py-3 font-mono text-[var(--color-texto-suave)] whitespace-nowrap">
                    {new Date(log.creadoEn).toLocaleDateString('es-SV', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <p className="font-bold text-[var(--color-primario)]">
                      {log.usuarioNombre || t.admin.sistemaLabel}
                    </p>
                    {log.usuarioCorreo && (
                      <p className="text-[11px] text-[var(--color-texto-suave)] font-mono">
                        {log.usuarioCorreo} {log.usuarioRol ? `(${log.usuarioRol})` : ''}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <span className="inline-block px-2 py-0.5 rounded-[var(--radio-chico)] bg-[var(--color-fondo)] text-[var(--color-primario)] border border-[var(--color-borde)] font-mono text-[11px] font-semibold">
                      {log.accion}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-[var(--color-texto)] font-mono text-[11px]">
                    {log.descripcion}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
