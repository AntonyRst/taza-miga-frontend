import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useIdioma } from '../../context/IdiomaContext.jsx';
import {
  Users,
  Plus,
  Edit2,
  KeyRound,
  ArrowRightLeft,
  Search,
  Check,
  X,
  Phone,
  AlertCircle,
  RotateCw
} from 'lucide-react';

export default function AdminPersonal() {
  const { usuario, fetchConToken } = useAuth();
  const { t } = useIdioma();

  const [personal, setPersonal] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Filtros
  const [filtroSucursal, setFiltroSucursal] = useState('');
  const [filtroCargo, setFiltroCargo] = useState('');
  const [busqueda, setBusqueda] = useState('');

  // Modales
  const [mostrarModalForm, setMostrarModalForm] = useState(false);
  const [empleadoEditando, setEmpleadoEditando] = useState(null);
  const [empleadoParaReset, setEmpleadoParaReset] = useState(null);
  const [empleadoParaTrasladar, setEmpleadoParaTrasladar] = useState(null);

  const esDueno = usuario?.rol === 'DUENO';

  // Cargar sucursales para selectores
  useEffect(() => {
    fetchConToken('/api/admin/sucursales')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setSucursales(data))
      .catch(() => {});
  }, [fetchConToken]);

  // Cargar lista de empleados (HU-18)
  const cargarPersonal = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filtroSucursal) params.append('sucursalId', filtroSucursal);
      if (filtroCargo) params.append('cargo', filtroCargo);
      if (busqueda) params.append('q', busqueda);

      const res = await fetchConToken(`/api/admin/personal?${params.toString()}`);
      if (!res.ok) throw new Error('Error al cargar la lista de personal');
      const data = await res.json();
      setPersonal(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, [fetchConToken, filtroSucursal, filtroCargo, busqueda]);

  useEffect(() => {
    cargarPersonal();
  }, [cargarPersonal]);

  // Activar o desactivar personal (RN-08, RN-10)
  const handleToggleActivo = async (emp) => {
    try {
      const res = await fetchConToken(`/api/admin/personal/${emp.id}/activo`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !emp.activo })
      });
      const datos = await res.json();
      if (!res.ok) throw new Error(datos.mensaje || 'Error al actualizar estado');
      cargarPersonal();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabecera y botón nuevo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[var(--color-borde)]">
        <div>
          <h2 className="font-serif font-bold text-xl text-[var(--color-primario)]">
            {t.admin.pestanaPersonal}
          </h2>
          <p className="text-xs text-[var(--color-texto-suave)] mt-0.5">
            Administra altas, permisos de acceso al sistema y asignación de sucursales (HU-18).
          </p>
        </div>

        <button
          onClick={() => {
            setEmpleadoEditando(null);
            setMostrarModalForm(true);
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[var(--color-accion)] hover:bg-[#B88746] text-[#2C1A1D] text-xs font-bold rounded-[var(--radio-chico)] transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t.admin.nuevoEmpleado}</span>
        </button>
      </div>

      {/* Barra de filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[var(--color-fondo)] p-3 rounded-[var(--radio-chico)] border border-[var(--color-borde)]">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-[var(--color-texto-suave)]" />
          <input
            type="text"
            placeholder={t.admin.buscarProducto || 'Buscar por nombre o correo...'}
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[var(--color-superficie)] border border-[var(--color-borde)] rounded-[var(--radio-chico)] focus:outline-hidden focus:border-[var(--color-accion)]"
          />
        </div>

        {esDueno && (
          <select
            value={filtroSucursal}
            onChange={(e) => setFiltroSucursal(e.target.value)}
            className="text-xs bg-[var(--color-superficie)] border border-[var(--color-borde)] rounded-[var(--radio-chico)] px-2.5 py-1.5 focus:outline-hidden"
          >
            <option value="">{t.kds.seleccionarSucursal || 'Todas las sucursales'}</option>
            {sucursales.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
        )}

        <input
          type="text"
          placeholder="Filtrar por cargo (ej. Barista, Mesero)..."
          value={filtroCargo}
          onChange={(e) => setFiltroCargo(e.target.value)}
          className="text-xs bg-[var(--color-superficie)] border border-[var(--color-borde)] rounded-[var(--radio-chico)] px-2.5 py-1.5 focus:outline-hidden"
        />
      </div>

      {/* Alerta de error */}
      {error && (
        <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-[var(--radio-chico)] text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabla de personal */}
      {cargando ? (
        <div className="py-12 flex justify-center text-[var(--color-texto-suave)]">
          <RotateCw className="w-6 h-6 animate-spin text-[var(--color-accion)]" />
        </div>
      ) : personal.length === 0 ? (
        <div className="py-12 text-center text-xs text-[var(--color-texto-suave)] border border-dashed border-[var(--color-borde)] rounded-[var(--radio-chico)]">
          {t.admin.sinPersonal}
        </div>
      ) : (
        <div className="overflow-x-auto border border-[var(--color-borde)] rounded-[var(--radio-chico)]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--color-fondo)] text-[var(--color-texto-suave)] uppercase font-mono text-[11px] border-b border-[var(--color-borde)]">
              <tr>
                <th className="px-3 py-2.5">Nombre / Correo</th>
                <th className="px-3 py-2.5">Cargo</th>
                <th className="px-3 py-2.5">Rol / Acceso</th>
                <th className="px-3 py-2.5">Sucursal</th>
                <th className="px-3 py-2.5">Teléfono</th>
                <th className="px-3 py-2.5">Estado</th>
                <th className="px-3 py-2.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-borde)]">
              {personal.map((emp) => (
                <tr key={emp.id} className="hover:bg-[var(--color-fondo)]/40">
                  <td className="px-3 py-3">
                    <p className="font-bold text-[var(--color-primario)]">{emp.nombre}</p>
                    <p className="text-[11px] text-[var(--color-texto-suave)] font-mono">
                      {emp.correo || '(Sin acceso al sistema)'}
                    </p>
                  </td>
                  <td className="px-3 py-3 font-medium">{emp.cargo}</td>
                  <td className="px-3 py-3">
                    {emp.accesoSistema ? (
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-[var(--radio-chico)] bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono font-medium">
                        {emp.rol}
                      </span>
                    ) : (
                      <span className="text-[11px] text-[var(--color-texto-suave)] font-mono">
                        Sin cuenta
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-[var(--color-texto-suave)]">
                    {emp.sucursalNombre || 'Todas (Dueño)'}
                  </td>
                  <td className="px-3 py-3 font-mono text-[var(--color-texto-suave)]">
                    {emp.telefono}
                  </td>
                  <td className="px-3 py-3">
                    <button
                      onClick={() => handleToggleActivo(emp)}
                      className={`text-[11px] px-2 py-0.5 rounded-[var(--radio-chico)] font-medium cursor-pointer transition-colors ${
                        emp.activo
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                      }`}
                    >
                      {emp.activo ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => {
                          setEmpleadoEditando(emp);
                          setMostrarModalForm(true);
                        }}
                        className="p-1.5 text-[var(--color-texto-suave)] hover:text-[var(--color-primario)] rounded-[var(--radio-chico)] hover:bg-[var(--color-fondo)] cursor-pointer"
                        title={t.admin.editarEmpleado}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {emp.accesoSistema && emp.rol !== 'DUENO' && (esDueno || (usuario?.rol === 'GERENTE' && emp.rol === 'BARISTA' && emp.sucursalId === usuario.sucursal_id)) && (
                        <button
                          onClick={() => setEmpleadoParaReset(emp)}
                          className="p-1.5 text-amber-700 hover:text-amber-900 rounded-[var(--radio-chico)] hover:bg-amber-50 cursor-pointer"
                          title={t.admin.resetearClave}
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {esDueno && (
                        <button
                          onClick={() => setEmpleadoParaTrasladar(emp)}
                          className="p-1.5 text-indigo-700 hover:text-indigo-900 rounded-[var(--radio-chico)] hover:bg-indigo-50 cursor-pointer"
                          title={t.admin.trasladarPersonal}
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Crear / Editar Personal (HU-18) */}
      {mostrarModalForm && (
        <ModalFormPersonal
          empleado={empleadoEditando}
          sucursales={sucursales}
          esDueno={esDueno}
          onCerrar={() => {
            setMostrarModalForm(false);
            setEmpleadoEditando(null);
          }}
          onGuardado={() => {
            setMostrarModalForm(false);
            setEmpleadoEditando(null);
            cargarPersonal();
          }}
        />
      )}

      {/* Modal Restablecer Contraseña Temporal (HU-19, RN-09) */}
      {empleadoParaReset && (
        <ModalResetPassword
          empleado={empleadoParaReset}
          onCerrar={() => setEmpleadoParaReset(null)}
          onExito={() => {
            setEmpleadoParaReset(null);
            cargarPersonal();
          }}
        />
      )}

      {/* Modal Trasladar Personal (HU-21, RN-26) */}
      {empleadoParaTrasladar && (
        <ModalTrasladarPersonal
          empleado={empleadoParaTrasladar}
          sucursales={sucursales}
          onCerrar={() => setEmpleadoParaTrasladar(null)}
          onExito={() => {
            setEmpleadoParaTrasladar(null);
            cargarPersonal();
          }}
        />
      )}
    </div>
  );
}

// Subcomponente Modal Formulario Personal
function ModalFormPersonal({ empleado, sucursales, esDueno, onCerrar, onGuardado }) {
  const { usuario, fetchConToken } = useAuth();
  const { t } = useIdioma();

  const [nombre, setNombre] = useState(empleado?.nombre || '');
  const [cargo, setCargo] = useState(empleado?.cargo || '');
  const [telefono, setTelefono] = useState(empleado?.telefono || '');
  const [sucursalId, setSucursalId] = useState(empleado?.sucursalId || (esDueno ? sucursales[0]?.id || '' : usuario?.sucursal_id));
  const [accesoSistema, setAccesoSistema] = useState(empleado?.accesoSistema || false);
  const [correo, setCorreo] = useState(empleado?.correo || '');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState(empleado?.rol || 'BARISTA');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setGuardando(true);

    try {
      const cuerpo = {
        nombre,
        cargo,
        telefono,
        sucursalId: sucursalId ? Number(sucursalId) : null,
        accesoSistema,
        correo: accesoSistema ? correo.trim() : null,
        rol: accesoSistema ? rol : 'SIN_ACCESO'
      };

      if (!empleado && accesoSistema) {
        cuerpo.password = password;
      }

      const url = empleado ? `/api/admin/personal/${empleado.id}` : '/api/admin/personal';
      const metodo = empleado ? 'PUT' : 'POST';

      const res = await fetchConToken(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cuerpo)
      });

      const datos = await res.json();
      if (!res.ok) throw new Error(datos.mensaje || 'Error al guardar');

      onGuardado();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-md bg-[var(--color-superficie)] border border-[var(--color-borde)] rounded-[var(--radio-medio)] shadow-xl p-5 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--color-borde)]">
          <h3 className="font-serif font-bold text-lg text-[var(--color-primario)]">
            {empleado ? t.admin.editarEmpleado : t.admin.nuevoEmpleado}
          </h3>
          <button onClick={onCerrar} className="p-1 text-[var(--color-texto-suave)] hover:text-black cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-2.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-[var(--radio-chico)] text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold mb-1">{t.admin.nombreEmpleado}</label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-[var(--color-borde)] rounded-[var(--radio-chico)] bg-[var(--color-fondo)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold mb-1">{t.admin.cargoEmpleado}</label>
              <input
                type="text"
                required
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                placeholder="Ej. Barista"
                className="w-full px-2.5 py-1.5 border border-[var(--color-borde)] rounded-[var(--radio-chico)] bg-[var(--color-fondo)]"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">{t.admin.telefonoEmpleado}</label>
              <input
                type="text"
                required
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="7000-0000"
                className="w-full px-2.5 py-1.5 border border-[var(--color-borde)] rounded-[var(--radio-chico)] bg-[var(--color-fondo)] font-mono"
              />
            </div>
          </div>

          {esDueno && (
            <div>
              <label className="block font-semibold mb-1">{t.kds.sucursalLabel}</label>
              <select
                value={sucursalId || ''}
                onChange={(e) => setSucursalId(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-[var(--color-borde)] rounded-[var(--radio-chico)] bg-[var(--color-fondo)]"
              >
                {sucursales.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Switch de acceso al sistema (HU-18) */}
          <div className="pt-2 border-t border-[var(--color-borde)]">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={accesoSistema}
                onChange={(e) => setAccesoSistema(e.target.checked)}
                className="rounded accent-[var(--color-accion)] w-4 h-4 cursor-pointer"
              />
              <span className="font-bold text-[var(--color-primario)]">{t.admin.accesoSistema}</span>
            </label>
            <p className="text-[11px] text-[var(--color-texto-suave)] mt-0.5">
              {accesoSistema ? t.admin.conAccesoDesc : t.admin.sinAccesoDesc}
            </p>
          </div>

          {accesoSistema && (
            <div className="space-y-3 pt-2 bg-[var(--color-fondo)] p-3 rounded-[var(--radio-chico)] border border-[var(--color-borde)]">
              <div>
                <label className="block font-semibold mb-1">{t.admin.correoEmpleado}</label>
                <input
                  type="email"
                  required
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  placeholder="ejemplo@tazamiga.com"
                  className="w-full px-2.5 py-1.5 border border-[var(--color-borde)] rounded-[var(--radio-chico)] bg-[var(--color-superficie)] font-mono"
                />
              </div>

              {!empleado && (
                <div>
                  <label className="block font-semibold mb-1">{t.admin.passwordTemporal}</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={8}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full px-2.5 py-1.5 border border-[var(--color-borde)] rounded-[var(--radio-chico)] bg-[var(--color-superficie)] font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold mb-1">{t.admin.rolEmpleado}</label>
                <select
                  value={rol}
                  onChange={(e) => setRol(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-[var(--color-borde)] rounded-[var(--radio-chico)] bg-[var(--color-superficie)] font-mono"
                >
                  <option value="BARISTA">BARISTA</option>
                  {esDueno && <option value="GERENTE">GERENTE</option>}
                  {esDueno && <option value="DUENO">DUENO</option>}
                </select>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-[var(--color-borde)]">
            <button
              type="button"
              onClick={onCerrar}
              className="px-3 py-1.5 border border-[var(--color-borde)] rounded-[var(--radio-chico)] text-[var(--color-texto-suave)] hover:bg-[var(--color-fondo)] cursor-pointer"
            >
              {t.kds.cerrar}
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="px-4 py-1.5 bg-[var(--color-accion)] hover:bg-[#B88746] text-[#2C1A1D] font-bold rounded-[var(--radio-chico)] cursor-pointer disabled:opacity-50"
            >
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Subcomponente Modal Restablecer Contraseña (HU-19, RN-09)
function ModalResetPassword({ empleado, onCerrar, onExito }) {
  const { fetchConToken } = useAuth();
  const { t } = useIdioma();
  const [passwordTemporal, setPasswordTemporal] = useState('');
  const [error, setError] = useState('');
  const [procesando, setProcesando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!passwordTemporal || passwordTemporal.length < 8) {
      setError('La contraseña temporal debe tener al menos 8 caracteres (RN-07)');
      return;
    }
    setError('');
    setProcesando(true);

    try {
      const res = await fetchConToken(`/api/admin/personal/${empleado.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passwordTemporal })
      });
      const datos = await res.json();
      if (!res.ok) throw new Error(datos.mensaje || 'Error al restablecer');
      alert(`Contraseña temporal asignada con éxito para ${empleado.nombre}.`);
      onExito();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-md bg-[var(--color-superficie)] border border-[var(--color-borde)] rounded-[var(--radio-medio)] shadow-xl p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--color-borde)]">
          <div className="flex items-center gap-2 text-amber-700">
            <KeyRound className="w-5 h-5 shrink-0" />
            <h3 className="font-serif font-bold text-base text-[var(--color-primario)]">
              {t.admin.resetearClave}
            </h3>
          </div>
          <button onClick={onCerrar} className="p-1 text-[var(--color-texto-suave)] hover:text-black cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Verificación de identidad por teléfono (HU-19) */}
        <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-[var(--radio-chico)] text-xs flex items-start gap-2.5">
          <Phone className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
          <div>
            <p className="font-semibold">{t.admin.telefonoVerificacionDesc}</p>
            <p className="font-mono font-bold text-sm text-[var(--color-primario)] mt-1">
              {empleado.telefono}
            </p>
          </div>
        </div>

        {error && (
          <div className="p-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-[var(--radio-chico)] text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold mb-1">
              Nueva contraseña temporal para {empleado.nombre}
            </label>
            <input
              type="text"
              required
              minLength={8}
              value={passwordTemporal}
              onChange={(e) => setPasswordTemporal(e.target.value)}
              placeholder="Ej. ClaveTemporal2026"
              className="w-full px-2.5 py-1.5 border border-[var(--color-borde)] rounded-[var(--radio-chico)] font-mono"
            />
            <p className="text-[11px] text-[var(--color-texto-suave)] mt-1">
              El usuario será forzado a cambiarla inmediatamente al iniciar sesión (RN-09).
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[var(--color-borde)]">
            <button
              type="button"
              onClick={onCerrar}
              className="px-3 py-1.5 border border-[var(--color-borde)] rounded-[var(--radio-chico)]"
            >
              {t.kds.cerrar}
            </button>
            <button
              type="submit"
              disabled={procesando}
              className="px-4 py-1.5 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-[var(--radio-chico)] cursor-pointer disabled:opacity-50"
            >
              {procesando ? 'Guardando...' : 'Asignar contraseña temporal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Subcomponente Modal Trasladar Personal (HU-21, RN-05, RN-26)
function ModalTrasladarPersonal({ empleado, sucursales, onCerrar, onExito }) {
  const { fetchConToken } = useAuth();
  const { t } = useIdioma();
  const [nuevaSucursalId, setNuevaSucursalId] = useState('');
  const [pedidosEnCurso, setPedidosEnCurso] = useState(0);
  const [error, setError] = useState('');
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    if (empleado?.id) {
      fetchConToken(`/api/admin/personal/${empleado.id}/pedidos-en-curso`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && typeof data.pedidosEnCurso === 'number') {
            setPedidosEnCurso(data.pedidosEnCurso);
          }
        })
        .catch(() => {});
    }
  }, [empleado, fetchConToken]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nuevaSucursalId) {
      setError('Selecciona la sucursal de destino');
      return;
    }
    setError('');
    setProcesando(true);

    try {
      const res = await fetchConToken(`/api/admin/personal/${empleado.id}/trasladar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nuevaSucursalId: Number(nuevaSucursalId) })
      });
      const datos = await res.json();
      if (!res.ok) throw new Error(datos.mensaje || 'Error al trasladar');
      alert(`Empleado ${empleado.nombre} trasladado a ${datos.nuevaSucursalNombre}.`);
      onExito();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-md bg-[var(--color-superficie)] border border-[var(--color-borde)] rounded-[var(--radio-medio)] shadow-xl p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--color-borde)]">
          <div className="flex items-center gap-2 text-indigo-700">
            <ArrowRightLeft className="w-5 h-5 shrink-0" />
            <h3 className="font-serif font-bold text-base text-[var(--color-primario)]">
              {t.admin.trasladarPersonal}
            </h3>
          </div>
          <button onClick={onCerrar} className="p-1 text-[var(--color-texto-suave)] hover:text-black cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-[var(--color-texto-suave)]">
          Mover a <strong>{empleado.nombre}</strong> ({empleado.cargo}) desde{' '}
          <em>{empleado.sucursalNombre || 'Sin asignar'}</em> hacia una nueva sucursal (HU-21).
        </p>

        {/* Alerta de pedidos en curso en la sucursal actual (HU-21) */}
        {pedidosEnCurso > 0 && (
          <div className="p-3 bg-amber-50 text-amber-900 border border-amber-200 rounded-[var(--radio-chico)] text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
            <div>
              <p className="font-semibold">Atención: Pedidos en curso</p>
              <p className="text-[11px] text-amber-800 mt-0.5">
                La sucursal actual tiene <strong>{pedidosEnCurso}</strong> pedido(s) activo(s) en preparación o recibidos. Si trasladas al empleado ahora, asegúrate de que el personal restante cubra los despachos.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="p-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-[var(--radio-chico)] text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold mb-1">
              {t.admin.seleccionarNuevaSucursal}
            </label>
            <select
              required
              value={nuevaSucursalId}
              onChange={(e) => setNuevaSucursalId(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-[var(--color-borde)] rounded-[var(--radio-chico)] bg-[var(--color-fondo)]"
            >
              <option value="">Selecciona sucursal de destino...</option>
              {sucursales
                .filter((s) => s.id !== empleado.sucursalId && s.activa)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[var(--color-borde)]">
            <button
              type="button"
              onClick={onCerrar}
              className="px-3 py-1.5 border border-[var(--color-borde)] rounded-[var(--radio-chico)]"
            >
              {t.kds.cerrar}
            </button>
            <button
              type="submit"
              disabled={procesando}
              className="px-4 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-[var(--radio-chico)] cursor-pointer disabled:opacity-50"
            >
              {procesando ? 'Procesando...' : 'Confirmar traslado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
