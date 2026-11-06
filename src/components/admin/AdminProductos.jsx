import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext.jsx';
import { useIdioma } from '../../context/IdiomaContext.jsx';
import { Plus, Edit2, AlertCircle, CheckCircle, Search, UtensilsCrossed, Image as ImageIcon, X } from 'lucide-react';

const esquemaProducto = z.object({
  categoria_id: z.coerce.number().int().positive('Selecciona una categoría válida'),
  nombre_es: z.string().trim().min(2, 'Mínimo 2 caracteres').max(100),
  nombre_en: z.string().trim().min(2, 'Mínimo 2 caracteres').max(100),
  descripcion_es: z.string().trim().max(255).optional().nullable(),
  descripcion_en: z.string().trim().max(255).optional().nullable(),
  precio: z.coerce.number().gt(0, 'El precio debe ser mayor que 0'),
  imagen_url: z.string().trim().max(255).optional().nullable(),
  disponible: z.boolean().default(true),
  activo: z.boolean().default(true),
  grupos_ids: z.array(z.coerce.number()).default([])
});

export default function AdminProductos() {
  const { fetchConToken } = useAuth();
  const { t, idioma } = useIdioma();
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [gruposDisponibles, setGruposDisponibles] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [mensajeExito, setMensajeExito] = useState(null);

  // Filtros
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [busqueda, setBusqueda] = useState('');

  // Modal
  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoEditando, setProductoEditando] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(esquemaProducto),
    defaultValues: {
      categoria_id: '',
      nombre_es: '',
      nombre_en: '',
      descripcion_es: '',
      descripcion_en: '',
      precio: '',
      imagen_url: '',
      disponible: true,
      activo: true,
      grupos_ids: []
    }
  });

  const gruposSeleccionados = watch('grupos_ids') || [];

  const cargarDatos = useCallback(async () => {
    try {
      setCargando(true);
      setError(null);

      // Cargar productos con filtros
      let url = '/productos?';
      if (categoriaFiltro) url += `categoria_id=${categoriaFiltro}&`;
      if (busqueda) url += `q=${encodeURIComponent(busqueda)}&`;

      const [resProd, resCat, resGrup] = await Promise.all([
        fetchConToken(url),
        fetchConToken('/categorias'),
        fetchConToken('/grupos-opciones?soloActivos=true')
      ]);

      if (!resProd.ok || !resCat.ok || !resGrup.ok) {
        throw new Error('Error al sincronizar datos del menú');
      }

      const [dataProd, dataCat, dataGrup] = await Promise.all([
        resProd.json(),
        resCat.json(),
        resGrup.json()
      ]);

      setProductos(dataProd);
      setCategorias(dataCat);
      setGruposDisponibles(dataGrup);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, [fetchConToken, categoriaFiltro, busqueda]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const abrirModalCrear = () => {
    setProductoEditando(null);
    reset({
      categoria_id: categorias[0]?.id || '',
      nombre_es: '',
      nombre_en: '',
      descripcion_es: '',
      descripcion_en: '',
      precio: '',
      imagen_url: '',
      disponible: true,
      activo: true,
      grupos_ids: []
    });
    setModalAbierto(true);
  };

  const abrirModalEditar = (prod) => {
    setProductoEditando(prod);
    const gruposIds = prod.grupos ? prod.grupos.map((g) => g.id) : [];
    reset({
      categoria_id: prod.categoriaId,
      nombre_es: prod.nombreEs,
      nombre_en: prod.nombreEn,
      descripcion_es: prod.descripcionEs || '',
      descripcion_en: prod.descripcionEn || '',
      precio: Number(prod.precio),
      imagen_url: prod.imagenUrl || '',
      disponible: Boolean(prod.disponible),
      activo: Boolean(prod.activo),
      grupos_ids: gruposIds
    });
    setModalAbierto(true);
  };

  const toggleGrupoCheckbox = (id) => {
    const actuales = [...gruposSeleccionados];
    const index = actuales.indexOf(id);
    if (index > -1) {
      actuales.splice(index, 1);
    } else {
      actuales.push(id);
    }
    setValue('grupos_ids', actuales);
  };

  const onSubmit = async (valores) => {
    try {
      setError(null);
      const url = productoEditando
        ? `/productos/${productoEditando.id}`
        : '/productos';
      const metodo = productoEditando ? 'PUT' : 'POST';

      const res = await fetchConToken(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(valores)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar producto');

      setModalAbierto(false);
      setMensajeExito(productoEditando ? 'Producto actualizado' : 'Producto creado con éxito');
      setTimeout(() => setMensajeExito(null), 3500);
      cargarDatos();
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleDisponible = async (prod) => {
    try {
      setError(null);
      const res = await fetchConToken(`/productos/${prod.id}/disponible`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disponible: !prod.disponible })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al cambiar disponibilidad');
      cargarDatos();
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleActivo = async (prod) => {
    try {
      setError(null);
      const res = await fetchConToken(`/productos/${prod.id}/activo`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !prod.activo })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al cambiar estado');
      cargarDatos();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado y Acción */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-[var(--color-primario)]">
            {t.admin.pestanaProductos}
          </h2>
          <p className="text-xs text-[var(--color-texto-suave)] mt-0.5">
            Administra precios, descripciones y disponibilidad de tus bebidas y alimentos.
          </p>
        </div>
        <button
          onClick={abrirModalCrear}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[var(--color-accion)] text-white text-xs font-semibold rounded-[var(--radio-chico)] hover:opacity-90 transition-opacity cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t.admin.nuevoProducto}</span>
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

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[var(--color-texto-suave)]" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder={t.admin.buscarProducto}
            className="w-full pl-9 pr-3 py-2 bg-[var(--color-fondo)] border border-[var(--color-borde)] rounded-[var(--radio-chico)] text-xs focus:outline-none focus:border-[var(--color-accion)]"
          />
        </div>
        <select
          value={categoriaFiltro}
          onChange={(e) => setCategoriaFiltro(e.target.value)}
          className="px-3 py-2 bg-[var(--color-fondo)] border border-[var(--color-borde)] rounded-[var(--radio-chico)] text-xs focus:outline-none focus:border-[var(--color-accion)] cursor-pointer"
        >
          <option value="">{t.admin.filtroTodasCategorias}</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {idioma === 'en' ? c.nombreEn : c.nombreEs}
            </option>
          ))}
        </select>
      </div>

      {/* Contenido / Listado */}
      {cargando ? (
        <div className="p-8 text-center text-xs text-[var(--color-texto-suave)] font-mono">
          {t.comun.cargando}
        </div>
      ) : productos.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-[var(--color-borde)] rounded-[var(--radio-grande)] text-xs text-[var(--color-texto-suave)]">
          {t.admin.sinProductos}
        </div>
      ) : (
        <div className="overflow-x-auto border border-[var(--color-borde)] rounded-[var(--radio-grande)] bg-[var(--color-superficie)] shadow-[var(--sombra-tarjeta)]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--color-fondo)] text-[var(--color-texto-suave)] border-b border-[var(--color-borde)] font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Foto</th>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3">Precio</th>
                <th className="px-4 py-3">Grupos</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-borde)]">
              {productos.map((prod) => (
                <tr key={prod.id} className="hover:bg-[var(--color-fondo)]/40 transition-colors">
                  <td className="px-4 py-3 w-12">
                    {prod.imagenUrl ? (
                      <img
                        src={prod.imagenUrl}
                        alt={prod.nombreEs}
                        className="w-10 h-10 object-cover rounded-[var(--radio-chico)] border border-[var(--color-borde)]"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-[var(--radio-chico)] bg-stone-100 border border-[var(--color-borde)] flex items-center justify-center text-stone-400">
                        <ImageIcon className="w-4 h-4" />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-[var(--color-primario)]">{prod.nombreEs}</div>
                    <div className="text-[11px] text-[var(--color-texto-suave)] italic">{prod.nombreEn}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-[var(--color-fondo)] text-[var(--color-primario)] font-medium rounded text-[11px] border border-[var(--color-borde)]">
                      {idioma === 'en' ? prod.categoriaNombreEn : prod.categoriaNombreEs}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-[var(--color-primario)]">
                    ${Number(prod.precio).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    {prod.grupos?.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {prod.grupos.map((g) => (
                          <span
                            key={g.id}
                            className="text-[10px] px-1.5 py-0.5 bg-stone-100 text-stone-600 rounded font-medium"
                          >
                            {g.nombreEs}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[10px] text-stone-400 italic">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 space-y-1">
                    <div>
                      <span
                        className={`inline-block px-1.5 py-0.5 text-[10px] font-semibold rounded ${
                          prod.disponible
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {prod.disponible ? t.admin.disponibleLabel : t.catalogo.agotado}
                      </span>
                    </div>
                    <div>
                      <span
                        className={`inline-block px-1.5 py-0.5 text-[10px] font-semibold rounded ${
                          prod.activo
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-stone-200 text-stone-600'
                        }`}
                      >
                        {prod.activo ? t.admin.activoLabel : t.admin.inactivoLabel}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                    <button
                      onClick={() => abrirModalEditar(prod)}
                      className="p-1 hover:text-[var(--color-accion)] text-[var(--color-texto-suave)] transition-colors cursor-pointer"
                      title={t.comun.editar}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => toggleDisponible(prod)}
                      className={`px-2 py-0.5 text-[10px] font-semibold rounded cursor-pointer transition-colors ${
                        prod.disponible
                          ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                          : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      }`}
                    >
                      {prod.disponible ? t.admin.marcarAgotado : t.admin.marcarDisponible}
                    </button>
                    <button
                      onClick={() => toggleActivo(prod)}
                      className={`px-2 py-0.5 text-[10px] font-semibold rounded cursor-pointer transition-colors ${
                        prod.activo
                          ? 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                          : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      }`}
                    >
                      {prod.activo ? t.comun.desactivar : t.comun.activar}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Producto */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-[var(--color-superficie)] border border-[var(--color-borde)] rounded-[var(--radio-grande)] max-w-lg w-full p-6 relative my-8 shadow-xl animate-in fade-in zoom-in duration-150">
            <button
              onClick={() => setModalAbierto(false)}
              className="absolute top-4 right-4 text-[var(--color-texto-suave)] hover:text-[var(--color-primario)] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <UtensilsCrossed className="w-5 h-5 text-[var(--color-accion)]" />
              <h3 className="font-serif font-bold text-base text-[var(--color-primario)]">
                {productoEditando ? t.comun.editar : t.admin.nuevoProducto}
              </h3>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-[var(--color-primario)]">
                    {t.admin.categoriaLabel} *
                  </label>
                  <select
                    {...register('categoria_id')}
                    className="w-full px-3 py-2 border border-[var(--color-borde)] rounded-[var(--radio-chico)] bg-[var(--color-fondo)] focus:outline-none focus:border-[var(--color-accion)]"
                  >
                    {categorias.map((c) => (
                      <option key={c.id} value={c.id}>
                        {idioma === 'en' ? c.nombreEn : c.nombreEs}
                      </option>
                    ))}
                  </select>
                  {errors.categoria_id && (
                    <p className="text-red-600 text-[11px] mt-1">{errors.categoria_id.message}</p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-[var(--color-primario)]">
                    {t.admin.precioLabel} *
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.05"
                    {...register('precio')}
                    className="w-full px-3 py-2 border border-[var(--color-borde)] rounded-[var(--radio-chico)] focus:outline-none focus:border-[var(--color-accion)]"
                    placeholder="4.50"
                  />
                  {errors.precio && (
                    <p className="text-red-600 text-[11px] mt-1">{errors.precio.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-[var(--color-primario)]">
                    {t.admin.nombreEsLabel} *
                  </label>
                  <input
                    type="text"
                    {...register('nombre_es')}
                    className="w-full px-3 py-2 border border-[var(--color-borde)] rounded-[var(--radio-chico)] focus:outline-none focus:border-[var(--color-accion)]"
                    placeholder="Latte de Vainilla"
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
                    placeholder="Vanilla Latte"
                  />
                  {errors.nombre_en && (
                    <p className="text-red-600 text-[11px] mt-1">{errors.nombre_en.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[var(--color-primario)]">
                  {t.admin.descripcionEsLabel}
                </label>
                <textarea
                  rows="2"
                  {...register('descripcion_es')}
                  className="w-full px-3 py-2 border border-[var(--color-borde)] rounded-[var(--radio-chico)] focus:outline-none focus:border-[var(--color-accion)] resize-none"
                  placeholder="Descripción detallada en español..."
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[var(--color-primario)]">
                  {t.admin.descripcionEnLabel}
                </label>
                <textarea
                  rows="2"
                  {...register('descripcion_en')}
                  className="w-full px-3 py-2 border border-[var(--color-borde)] rounded-[var(--radio-chico)] focus:outline-none focus:border-[var(--color-accion)] resize-none"
                  placeholder="Detailed description in English..."
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[var(--color-primario)]">
                  {t.admin.imagenUrlLabel}
                </label>
                <input
                  type="url"
                  {...register('imagen_url')}
                  className="w-full px-3 py-2 border border-[var(--color-borde)] rounded-[var(--radio-chico)] focus:outline-none focus:border-[var(--color-accion)]"
                  placeholder="https://images.unsplash.com/photo-..."
                />
              </div>

              {/* Grupos de opciones asignados */}
              <div>
                <label className="block font-semibold mb-1.5 text-[var(--color-primario)]">
                  {t.admin.gruposAsignadosLabel}
                </label>
                {gruposDisponibles.length === 0 ? (
                  <p className="text-xs text-[var(--color-texto-suave)] italic">
                    No hay grupos de opciones activos configurados.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border border-[var(--color-borde)] rounded-[var(--radio-chico)] p-3 max-h-36 overflow-y-auto bg-[var(--color-fondo)]/20">
                    {gruposDisponibles.map((g) => {
                      const seleccionado = gruposSeleccionados.includes(g.id);
                      return (
                        <label
                          key={g.id}
                          className="flex items-center gap-2 text-xs font-medium text-[var(--color-primario)] cursor-pointer select-none"
                        >
                          <input
                            type="checkbox"
                            checked={seleccionado}
                            onChange={() => toggleGrupoCheckbox(g.id)}
                            className="rounded border-[var(--color-borde)] text-[var(--color-accion)] focus:ring-0"
                          />
                          <span>{g.nombreEs}</span>
                        </label>
                      );
                    })}
                  </div>
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
