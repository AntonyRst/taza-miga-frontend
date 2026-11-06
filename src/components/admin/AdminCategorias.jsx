import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext.jsx';
import { useIdioma } from '../../context/IdiomaContext.jsx';
import { Plus, Edit2, AlertCircle, CheckCircle, FolderPlus, X } from 'lucide-react';

const esquemaCategoria = z.object({
  nombre_es: z.string().trim().min(2, 'Mínimo 2 caracteres').max(80),
  nombre_en: z.string().trim().min(2, 'Mínimo 2 caracteres').max(80),
  orden: z.coerce.number().int().min(0, 'No puede ser negativo').default(0)
});

export default function AdminCategorias() {
  const { fetchConToken } = useAuth();
  const { t, idioma } = useIdioma();
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [mensajeExito, setMensajeExito] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [categoriaEditando, setCategoriaEditando] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(esquemaCategoria),
    defaultValues: { nombre_es: '', nombre_en: '', orden: 0 }
  });

  const cargarCategorias = useCallback(async () => {
    try {
      setCargando(true);
      setError(null);
      const res = await fetchConToken('/categorias');
      if (!res.ok) throw new Error('Error al cargar categorías');
      const data = await res.json();
      setCategorias(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, [fetchConToken]);

  useEffect(() => {
    cargarCategorias();
  }, [cargarCategorias]);

  const abrirModalCrear = () => {
    setCategoriaEditando(null);
    reset({ nombre_es: '', nombre_en: '', orden: categorias.length + 1 });
    setModalAbierto(true);
  };

  const abrirModalEditar = (cat) => {
    setCategoriaEditando(cat);
    reset({
      nombre_es: cat.nombreEs,
      nombre_en: cat.nombreEn,
      orden: cat.orden
    });
    setModalAbierto(true);
  };

  const onSubmit = async (valores) => {
    try {
      setError(null);
      const url = categoriaEditando
        ? `/categorias/${categoriaEditando.id}`
        : '/categorias';
      const metodo = categoriaEditando ? 'PUT' : 'POST';

      const res = await fetchConToken(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(valores)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al guardar categoría');
      }

      setModalAbierto(false);
      setMensajeExito(categoriaEditando ? 'Categoría actualizada' : 'Categoría creada');
      setTimeout(() => setMensajeExito(null), 3500);
      cargarCategorias();
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleActivo = async (cat) => {
    try {
      setError(null);
      const res = await fetchConToken(`/categorias/${cat.id}/activo`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activa: !cat.activa })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al cambiar estado');
      }
      cargarCategorias();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-[var(--color-primario)]">
            {t.admin.pestanaCategorias}
          </h2>
          <p className="text-xs text-[var(--color-texto-suave)] mt-0.5">
            Organiza las secciones del menú para tus clientes.
          </p>
        </div>
        <button
          onClick={abrirModalCrear}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[var(--color-accion)] text-white text-xs font-semibold rounded-[var(--radio-chico)] hover:opacity-90 transition-opacity cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t.admin.nuevaCategoria}</span>
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
      ) : categorias.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-[var(--color-borde)] rounded-[var(--radio-medio)] text-xs text-[var(--color-texto-suave)]">
          {t.admin.sinCategorias}
        </div>
      ) : (
        <div className="overflow-x-auto border border-[var(--color-borde)] rounded-[var(--radio-medio)] bg-white">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--color-fondo)] text-[var(--color-texto-suave)] border-b border-[var(--color-borde)] font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">{t.admin.nombreEsLabel}</th>
                <th className="px-4 py-3">{t.admin.nombreEnLabel}</th>
                <th className="px-4 py-3">{t.admin.ordenLabel}</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-borde)]">
              {categorias.map((cat, idx) => (
                <tr key={cat.id} className="hover:bg-[var(--color-fondo)]/40 transition-colors">
                  <td className="px-4 py-3 font-mono text-[var(--color-texto-suave)]">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-[var(--color-primario)]">{cat.nombreEs}</td>
                  <td className="px-4 py-3 text-[var(--color-texto-suave)] italic">{cat.nombreEn}</td>
                  <td className="px-4 py-3 font-mono">{cat.orden}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded-[var(--radio-chico)] ${
                        cat.activa
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {cat.activa ? t.admin.activoLabel : t.admin.inactivoLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => abrirModalEditar(cat)}
                      className="p-1 hover:text-[var(--color-accion)] transition-colors cursor-pointer"
                      title={t.comun.editar}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => toggleActivo(cat)}
                      className={`px-2 py-1 text-[10px] font-semibold rounded-[var(--radio-chico)] transition-colors cursor-pointer ${
                        cat.activa
                          ? 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                          : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                      }`}
                    >
                      {cat.activa ? t.comun.desactivar : t.comun.activar}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Crear / Editar */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white border border-[var(--color-borde)] rounded-[var(--radio-medio)] max-w-md w-full p-6 relative animate-in fade-in zoom-in duration-150">
            <button
              onClick={() => setModalAbierto(false)}
              className="absolute top-4 right-4 text-[var(--color-texto-suave)] hover:text-[var(--color-primario)] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <FolderPlus className="w-5 h-5 text-[var(--color-accion)]" />
              <h3 className="font-serif font-bold text-base text-[var(--color-primario)]">
                {categoriaEditando ? t.comun.editar : t.admin.nuevaCategoria}
              </h3>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-[var(--color-primario)]">
                  {t.admin.nombreEsLabel} *
                </label>
                <input
                  type="text"
                  {...register('nombre_es')}
                  className="w-full px-3 py-2 border border-[var(--color-borde)] rounded-[var(--radio-chico)] focus:outline-none focus:border-[var(--color-accion)]"
                  placeholder="Ej. Café de Especialidad"
                />
                {errors.nombre_es && (
                  <p className="text-red-600 text-[11px] mt-1">{errors.nombre_es.message}</p>
                )}
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[var(--color-primario)]">
                  {t.admin.nombreEnLabel} *
                </label>
                <input
                  type="text"
                  {...register('nombre_en')}
                  className="w-full px-3 py-2 border border-[var(--color-borde)] rounded-[var(--radio-chico)] focus:outline-none focus:border-[var(--color-accion)]"
                  placeholder="Ej. Specialty Coffee"
                />
                {errors.nombre_en && (
                  <p className="text-red-600 text-[11px] mt-1">{errors.nombre_en.message}</p>
                )}
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[var(--color-primario)]">
                  {t.admin.ordenLabel}
                </label>
                <input
                  type="number"
                  {...register('orden')}
                  className="w-full px-3 py-2 border border-[var(--color-borde)] rounded-[var(--radio-chico)] focus:outline-none focus:border-[var(--color-accion)]"
                  min="0"
                />
                {errors.orden && (
                  <p className="text-red-600 text-[11px] mt-1">{errors.orden.message}</p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--color-borde)]">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-3.5 py-1.5 border border-[var(--color-borde)] rounded-[var(--radio-chico)] hover:bg-[var(--color-fondo)] text-[var(--color-texto-suave)] cursor-pointer"
                >
                  {t.comun.cancelar}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-[var(--color-primario)] text-white font-semibold rounded-[var(--radio-chico)] hover:opacity-90 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? t.comun.cargando : t.comun.guardar}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
