import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext.jsx';
import { useIdioma } from '../../context/IdiomaContext.jsx';
import { Plus, Edit2, AlertCircle, CheckCircle, Sliders, ChevronDown, ChevronRight, X, Check } from 'lucide-react';

const esquemaGrupo = z.object({
  nombre_es: z.string().trim().min(2, 'Mínimo 2 caracteres').max(80),
  nombre_en: z.string().trim().min(2, 'Mínimo 2 caracteres').max(80),
  tipo_seleccion: z.enum(['UNICA', 'MULTIPLE']),
  obligatorio: z.boolean().default(false)
});

const esquemaOpcion = z.object({
  nombre_es: z.string().trim().min(1, 'El nombre no puede estar vacío').max(80),
  nombre_en: z.string().trim().min(1, 'El nombre no puede estar vacío').max(80),
  precio_extra: z.coerce.number().min(0, 'El precio no puede ser negativo').default(0),
  es_predeterminada: z.boolean().default(false)
});

export default function AdminGruposOpciones() {
  const { fetchConToken } = useAuth();
  const { t } = useIdioma();
  const [grupos, setGrupos] = useState([]);
  const [gruposExpandidos, setGruposExpandidos] = useState({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [mensajeExito, setMensajeExito] = useState(null);

  // Modales
  const [modalGrupoAbierto, setModalGrupoAbierto] = useState(false);
  const [grupoEditando, setGrupoEditando] = useState(null);

  const [modalOpcionAbierto, setModalOpcionAbierto] = useState(false);
  const [opcionEditando, setOpcionEditando] = useState(null);
  const [grupoParaOpcion, setGrupoParaOpcion] = useState(null);

  const formGrupo = useForm({
    resolver: zodResolver(esquemaGrupo),
    defaultValues: { nombre_es: '', nombre_en: '', tipo_seleccion: 'UNICA', obligatorio: false }
  });

  const formOpcion = useForm({
    resolver: zodResolver(esquemaOpcion),
    defaultValues: { nombre_es: '', nombre_en: '', precio_extra: 0, es_predeterminada: false }
  });

  const cargarGrupos = useCallback(async () => {
    try {
      setCargando(true);
      setError(null);
      const res = await fetchConToken('/grupos-opciones');
      if (!res.ok) throw new Error('Error al cargar grupos de opciones');
      const data = await res.json();
      setGrupos(data);
      // Auto-expand all groups on first load
      const expandidos = {};
      data.forEach((g) => {
        expandidos[g.id] = true;
      });
      setGruposExpandidos((prev) => ({ ...expandidos, ...prev }));
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, [fetchConToken]);

  useEffect(() => {
    cargarGrupos();
  }, [cargarGrupos]);

  const toggleExpandir = (id) => {
    setGruposExpandidos((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Handlers para Grupos
  const abrirModalCrearGrupo = () => {
    setGrupoEditando(null);
    formGrupo.reset({ nombre_es: '', nombre_en: '', tipo_seleccion: 'UNICA', obligatorio: false });
    setModalGrupoAbierto(true);
  };

  const abrirModalEditarGrupo = (g) => {
    setGrupoEditando(g);
    formGrupo.reset({
      nombre_es: g.nombreEs,
      nombre_en: g.nombreEn,
      tipo_seleccion: g.tipoSeleccion,
      obligatorio: Boolean(g.obligatorio)
    });
    setModalGrupoAbierto(true);
  };

  const onSubmitGrupo = async (valores) => {
    try {
      setError(null);
      const url = grupoEditando
        ? `/grupos-opciones/${grupoEditando.id}`
        : '/grupos-opciones';
      const metodo = grupoEditando ? 'PUT' : 'POST';

      const res = await fetchConToken(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(valores)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar grupo');

      setModalGrupoAbierto(false);
      setMensajeExito(grupoEditando ? 'Grupo actualizado' : 'Grupo creado con éxito');
      setTimeout(() => setMensajeExito(null), 3500);
      cargarGrupos();
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleActivoGrupo = async (g) => {
    try {
      setError(null);
      const res = await fetchConToken(`/grupos-opciones/${g.id}/activo`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !g.activo })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al cambiar estado');
      cargarGrupos();
    } catch (err) {
      setError(err.message);
    }
  };

  // Handlers para Opciones
  const abrirModalCrearOpcion = (g) => {
    setGrupoParaOpcion(g);
    setOpcionEditando(null);
    formOpcion.reset({ nombre_es: '', nombre_en: '', precio_extra: 0, es_predeterminada: false });
    setModalOpcionAbierto(true);
  };

  const abrirModalEditarOpcion = (g, op) => {
    setGrupoParaOpcion(g);
    setOpcionEditando(op);
    formOpcion.reset({
      nombre_es: op.nombreEs,
      nombre_en: op.nombreEn,
      precio_extra: Number(op.precioExtra),
      es_predeterminada: Boolean(op.esPredeterminada)
    });
    setModalOpcionAbierto(true);
  };

  const onSubmitOpcion = async (valores) => {
    try {
      setError(null);
      const url = opcionEditando
        ? `/opciones/${opcionEditando.id}`
        : `/grupos-opciones/${grupoParaOpcion.id}/opciones`;
      const metodo = opcionEditando ? 'PUT' : 'POST';

      const res = await fetchConToken(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(valores)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar opción');

      setModalOpcionAbierto(false);
      setMensajeExito(opcionEditando ? 'Opción actualizada' : 'Opción agregada');
      setTimeout(() => setMensajeExito(null), 3500);
      cargarGrupos();
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleActivoOpcion = async (op) => {
    try {
      setError(null);
      const res = await fetchConToken(`/opciones/${op.id}/activo`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activa: !op.activa })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al cambiar estado');
      cargarGrupos();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-[var(--color-primario)]">
            {t.admin.pestanaGrupos}
          </h2>
          <p className="text-xs text-[var(--color-texto-suave)] mt-0.5">
            Configura opciones reutilizables como leches, dulzor y extras artesanales.
          </p>
        </div>
        <button
          onClick={abrirModalCrearGrupo}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[var(--color-accion)] text-white text-xs font-semibold rounded-[var(--radio-chico)] hover:opacity-90 transition-opacity cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t.admin.nuevoGrupo}</span>
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-[var(--radio-chico)] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {mensajeExito && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-[var(--radio-chico)] flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{mensajeExito}</span>
        </div>
      )}

      {cargando ? (
        <div className="p-8 text-center text-xs text-[var(--color-texto-suave)] font-mono">
          {t.comun.cargando}
        </div>
      ) : grupos.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-[var(--color-borde)] rounded-[var(--radio-medio)] text-xs text-[var(--color-texto-suave)]">
          {t.admin.sinGrupos}
        </div>
      ) : (
        <div className="space-y-4">
          {grupos.map((g) => {
            const expandido = Boolean(gruposExpandidos[g.id]);
            return (
              <div
                key={g.id}
                className="border border-[var(--color-borde)] rounded-[var(--radio-medio)] bg-white overflow-hidden"
              >
                {/* Cabecera del Grupo */}
                <div className="p-4 bg-[var(--color-fondo)]/30 flex items-center justify-between gap-3 border-b border-[var(--color-borde)]">
                  <div
                    onClick={() => toggleExpandir(g.id)}
                    className="flex items-center gap-2.5 cursor-pointer select-none flex-1"
                  >
                    {expandido ? (
                      <ChevronDown className="w-4 h-4 text-[var(--color-texto-suave)]" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-[var(--color-texto-suave)]" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-bold text-sm text-[var(--color-primario)]">
                          {g.nombreEs}
                        </span>
                        <span className="text-xs text-[var(--color-texto-suave)] italic">
                          ({g.nombreEn})
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] px-2 py-0.5 bg-stone-100 text-stone-700 font-mono rounded">
                          {g.tipoSeleccion === 'UNICA' ? t.admin.tipoUnica : t.admin.tipoMultiple}
                        </span>
                        {g.obligatorio ? (
                          <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-800 font-medium rounded">
                            {t.admin.obligatorioLabel}
                          </span>
                        ) : null}
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                            g.activo ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'
                          }`}
                        >
                          {g.activo ? t.admin.activoLabel : t.admin.inactivoLabel}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => abrirModalCrearOpcion(g)}
                      className="flex items-center gap-1 px-2.5 py-1 bg-white border border-[var(--color-borde)] text-[var(--color-primario)] text-xs font-medium rounded-[var(--radio-chico)] hover:bg-[var(--color-fondo)] cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-[var(--color-accion)]" />
                      <span>{t.admin.agregarOpcion}</span>
                    </button>
                    <button
                      onClick={() => abrirModalEditarGrupo(g)}
                      className="p-1 hover:text-[var(--color-accion)] text-[var(--color-texto-suave)] transition-colors cursor-pointer"
                      title={t.comun.editar}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => toggleActivoGrupo(g)}
                      className={`px-2 py-1 text-[10px] font-semibold rounded-[var(--radio-chico)] transition-colors cursor-pointer ${
                        g.activo
                          ? 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                          : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                      }`}
                    >
                      {g.activo ? t.comun.desactivar : t.comun.activar}
                    </button>
                  </div>
                </div>

                {/* Lista de Opciones Hijas */}
                {expandido && (
                  <div className="p-4 bg-white">
                    {g.opciones?.length === 0 ? (
                      <p className="text-xs text-[var(--color-texto-suave)] italic text-center py-2">
                        Aún no hay opciones en este grupo. Agrega una con el botón "+ Agregar opción".
                      </p>
                    ) : (
                      <div className="divide-y divide-[var(--color-borde)] text-xs">
                        {g.opciones.map((op) => (
                          <div
                            key={op.id}
                            className="py-2.5 flex items-center justify-between gap-4 hover:bg-[var(--color-fondo)]/30 px-2 rounded transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-medium text-[var(--color-primario)]">
                                {op.nombreEs}
                              </span>
                              <span className="text-[var(--color-texto-suave)] italic">
                                ({op.nombreEn})
                              </span>
                              {op.esPredeterminada ? (
                                <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-700 font-semibold rounded">
                                  <Check className="w-3 h-3" />
                                  {t.admin.predeterminadaLabel}
                                </span>
                              ) : null}
                              <span
                                className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                                  op.activa ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-500'
                                }`}
                              >
                                {op.activa ? t.admin.activoLabel : t.admin.inactivoLabel}
                              </span>
                            </div>

                            <div className="flex items-center gap-4">
                              <span className="font-mono text-xs font-semibold text-[var(--color-primario)]">
                                {Number(op.precioExtra) === 0 ? '$0.00' : `+$${Number(op.precioExtra).toFixed(2)}`}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => abrirModalEditarOpcion(g, op)}
                                  className="p-1 hover:text-[var(--color-accion)] text-[var(--color-texto-suave)] transition-colors cursor-pointer"
                                  title={t.comun.editar}
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => toggleActivoOpcion(op)}
                                  className={`px-1.5 py-0.5 text-[9px] font-semibold rounded cursor-pointer ${
                                    op.activa
                                      ? 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                                      : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                  }`}
                                >
                                  {op.activa ? t.comun.desactivar : t.comun.activar}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Grupo */}
      {modalGrupoAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white border border-[var(--color-borde)] rounded-[var(--radio-medio)] max-w-md w-full p-6 relative animate-in fade-in zoom-in duration-150">
            <button
              onClick={() => setModalGrupoAbierto(false)}
              className="absolute top-4 right-4 text-[var(--color-texto-suave)] hover:text-[var(--color-primario)] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <Sliders className="w-5 h-5 text-[var(--color-accion)]" />
              <h3 className="font-serif font-bold text-base text-[var(--color-primario)]">
                {grupoEditando ? t.comun.editar : t.admin.nuevoGrupo}
              </h3>
            </div>

            <form onSubmit={formGrupo.handleSubmit(onSubmitGrupo)} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-[var(--color-primario)]">
                  {t.admin.nombreEsLabel} *
                </label>
                <input
                  type="text"
                  {...formGrupo.register('nombre_es')}
                  className="w-full px-3 py-2 border border-[var(--color-borde)] rounded-[var(--radio-chico)] focus:outline-none focus:border-[var(--color-accion)]"
                  placeholder="Ej. Tipo de leche"
                />
                {formGrupo.formState.errors.nombre_es && (
                  <p className="text-red-600 text-[11px] mt-1">{formGrupo.formState.errors.nombre_es.message}</p>
                )}
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[var(--color-primario)]">
                  {t.admin.nombreEnLabel} *
                </label>
                <input
                  type="text"
                  {...formGrupo.register('nombre_en')}
                  className="w-full px-3 py-2 border border-[var(--color-borde)] rounded-[var(--radio-chico)] focus:outline-none focus:border-[var(--color-accion)]"
                  placeholder="Ej. Milk type"
                />
                {formGrupo.formState.errors.nombre_en && (
                  <p className="text-red-600 text-[11px] mt-1">{formGrupo.formState.errors.nombre_en.message}</p>
                )}
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[var(--color-primario)]">
                  {t.admin.tipoSeleccionLabel} *
                </label>
                <select
                  {...formGrupo.register('tipo_seleccion')}
                  className="w-full px-3 py-2 border border-[var(--color-borde)] rounded-[var(--radio-chico)] focus:outline-none focus:border-[var(--color-accion)] bg-white"
                >
                  <option value="UNICA">{t.admin.tipoUnica}</option>
                  <option value="MULTIPLE">{t.admin.tipoMultiple}</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="obligatorio"
                  {...formGrupo.register('obligatorio')}
                  className="rounded border-[var(--color-borde)] text-[var(--color-accion)] focus:ring-0"
                />
                <label htmlFor="obligatorio" className="font-medium text-[var(--color-primario)] cursor-pointer">
                  {t.admin.obligatorioLabel}
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--color-borde)]">
                <button
                  type="button"
                  onClick={() => setModalGrupoAbierto(false)}
                  className="px-3.5 py-1.5 border border-[var(--color-borde)] rounded-[var(--radio-chico)] hover:bg-[var(--color-fondo)] text-[var(--color-texto-suave)] cursor-pointer"
                >
                  {t.comun.cancelar}
                </button>
                <button
                  type="submit"
                  disabled={formGrupo.formState.isSubmitting}
                  className="px-4 py-1.5 bg-[var(--color-primario)] text-white font-semibold rounded-[var(--radio-chico)] hover:opacity-90 disabled:opacity-50 cursor-pointer"
                >
                  {formGrupo.formState.isSubmitting ? t.comun.cargando : t.comun.guardar}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Opción */}
      {modalOpcionAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white border border-[var(--color-borde)] rounded-[var(--radio-medio)] max-w-md w-full p-6 relative animate-in fade-in zoom-in duration-150">
            <button
              onClick={() => setModalOpcionAbierto(false)}
              className="absolute top-4 right-4 text-[var(--color-texto-suave)] hover:text-[var(--color-primario)] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-4">
              <h3 className="font-serif font-bold text-base text-[var(--color-primario)]">
                {opcionEditando ? t.comun.editar : t.admin.nuevaOpcion}
              </h3>
              <p className="text-xs text-[var(--color-texto-suave)]">
                Para el grupo: <strong>{grupoParaOpcion?.nombreEs}</strong>
              </p>
            </div>

            <form onSubmit={formOpcion.handleSubmit(onSubmitOpcion)} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-[var(--color-primario)]">
                  {t.admin.nombreEsLabel} *
                </label>
                <input
                  type="text"
                  {...formOpcion.register('nombre_es')}
                  className="w-full px-3 py-2 border border-[var(--color-borde)] rounded-[var(--radio-chico)] focus:outline-none focus:border-[var(--color-accion)]"
                  placeholder="Ej. Leche de avena"
                />
                {formOpcion.formState.errors.nombre_es && (
                  <p className="text-red-600 text-[11px] mt-1">{formOpcion.formState.errors.nombre_es.message}</p>
                )}
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[var(--color-primario)]">
                  {t.admin.nombreEnLabel} *
                </label>
                <input
                  type="text"
                  {...formOpcion.register('nombre_en')}
                  className="w-full px-3 py-2 border border-[var(--color-borde)] rounded-[var(--radio-chico)] focus:outline-none focus:border-[var(--color-accion)]"
                  placeholder="Ej. Oat milk"
                />
                {formOpcion.formState.errors.nombre_en && (
                  <p className="text-red-600 text-[11px] mt-1">{formOpcion.formState.errors.nombre_en.message}</p>
                )}
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[var(--color-primario)]">
                  {t.admin.precioExtraLabel}
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  {...formOpcion.register('precio_extra')}
                  className="w-full px-3 py-2 border border-[var(--color-borde)] rounded-[var(--radio-chico)] focus:outline-none focus:border-[var(--color-accion)]"
                />
                {formOpcion.formState.errors.precio_extra && (
                  <p className="text-red-600 text-[11px] mt-1">{formOpcion.formState.errors.precio_extra.message}</p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="es_predeterminada"
                  {...formOpcion.register('es_predeterminada')}
                  className="rounded border-[var(--color-borde)] text-[var(--color-accion)] focus:ring-0"
                />
                <label htmlFor="es_predeterminada" className="font-medium text-[var(--color-primario)] cursor-pointer">
                  {t.admin.predeterminadaLabel}
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--color-borde)]">
                <button
                  type="button"
                  onClick={() => setModalOpcionAbierto(false)}
                  className="px-3.5 py-1.5 border border-[var(--color-borde)] rounded-[var(--radio-chico)] hover:bg-[var(--color-fondo)] text-[var(--color-texto-suave)] cursor-pointer"
                >
                  {t.comun.cancelar}
                </button>
                <button
                  type="submit"
                  disabled={formOpcion.formState.isSubmitting}
                  className="px-4 py-1.5 bg-[var(--color-primario)] text-white font-semibold rounded-[var(--radio-chico)] hover:opacity-90 disabled:opacity-50 cursor-pointer"
                >
                  {formOpcion.formState.isSubmitting ? t.comun.cargando : t.comun.guardar}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
