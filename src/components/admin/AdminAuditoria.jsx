import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useIdioma } from '../../context/IdiomaContext.jsx';
import {
  ShieldAlert,
  Search,
  RotateCw,
  AlertCircle,
  Calendar,
  UserCheck
} from 'lucide-react';

export default function AdminAuditoria() {
  const { fetchConToken } = useAuth();
  const { t } = useIdioma();

  const [logs, setLogs] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Filtros
  const [accion, setAccion] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  const cargarLogs = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (accion) params.append('accion', accion);
      if (fechaInicio) params.append('fechaInicio', fechaInicio);
      if (fechaFin) params.append('fechaFin', fechaFin);

      const res = await fetchConToken(`/api/admin/auditoria?${params.toString()}`);
      if (!res.ok) throw new Error('Error al cargar la bitácora de auditoría');
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, [fetchConToken, accion, fechaInicio, fechaFin]);

  useEffect(() => {
    cargarLogs();
  }, [cargarLogs]);

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[var(--color-borde)]">
        <div>
          <h2 className="font-serif font-bold text-xl text-[var(--color-primario)]">
            {t.admin.registroAuditoriaTitulo}
          </h2>
          <p className="text-xs text-[var(--color-texto-suave)] mt-0.5">
            Registro inmutable de acciones críticas (cambios de precio, cancelaciones, contraseñas, traslados, desactivaciones, RN-27).
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[var(--color-fondo)] p-3 rounded-[var(--radio-chico)] border border-[var(--color-borde)] text-xs">
        <select
          value={accion}
          onChange={(e) => setAccion(e.target.value)}
          className="bg-[var(--color-superficie)] border border-[var(--color-borde)] rounded-[var(--radio-chico)] px-2.5 py-1.5 focus:outline-hidden"
        >
          <option value="">{t.admin.todasLasAcciones}</option>
          <option value="CAMBIO_PRECIO">Cambio de precio (RN-27)</option>
          <option value="CANCELAR_PEDIDO">Cancelación de pedido (RN-22)</option>
          <option value="RESET_PASSWORD">Restablecimiento de contraseña (RN-09)</option>
          <option value="TRASLADO_PERSONAL">Traslado de personal (RN-26)</option>
          <option value="DESACTIVAR_SUCURSAL">Desactivación de sucursal (RN-25)</option>
          <option value="DESACTIVAR_USUARIO">Desactivación de usuario (RN-08)</option>
          <option value="DESACTIVAR_PRODUCTO">Desactivación de producto (RN-10)</option>
        </select>

        <div className="flex items-center gap-2">
          <span className="text-[var(--color-texto-suave)]">Desde:</span>
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="w-full px-2 py-1 bg-[var(--color-superficie)] border border-[var(--color-borde)] rounded-[var(--radio-chico)]"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[var(--color-texto-suave)]">Hasta:</span>
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="w-full px-2 py-1 bg-[var(--color-superficie)] border border-[var(--color-borde)] rounded-[var(--radio-chico)]"
          />
        </div>
      </div>

      {cargando ? (
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
            <thead className="bg-[var(--color-fondo)] text-[var(--color-texto-suave)] uppercase font-mono text-[11px] border-b border-[var(--color-borde)]">
              <tr>
                <th className="px-3 py-2.5">Fecha y hora</th>
                <th className="px-3 py-2.5">Usuario responsable</th>
                <th className="px-3 py-2.5">Acción</th>
                <th className="px-3 py-2.5">Descripción de la operación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-borde)]">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-[var(--color-fondo)]/40">
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
                      {log.usuarioNombre || 'Sistema'}
                    </p>
                    <p className="text-[11px] text-[var(--color-texto-suave)] font-mono">
                      {log.usuarioCorreo} ({log.usuarioRol})
                    </p>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <span className="inline-block px-2 py-0.5 rounded-[var(--radio-chico)] bg-slate-100 text-slate-800 border border-slate-300 font-mono text-[11px] font-semibold">
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
