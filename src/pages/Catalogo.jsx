import { useState, useEffect, useCallback } from 'react';
import { useIdioma } from '../context/IdiomaContext.jsx';
import { Coffee, ShoppingBag, Globe, Search, AlertCircle, Image as ImageIcon } from 'lucide-react';

export default function Catalogo() {
  const { t, idioma, cambiarIdioma } = useIdioma();
  const [menu, setMenu] = useState({ categorias: [], productos: [] });
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  const cargarMenu = useCallback(async () => {
    try {
      setCargando(true);
      setError(null);
      const res = await fetch(`${apiUrl}/publico/taza-miga/menu`);
      if (!res.ok) throw new Error(t.comun.errorConexion);
      const data = await res.json();
      setMenu(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, [apiUrl, t.comun.errorConexion]);

  useEffect(() => {
    cargarMenu();
  }, [cargarMenu]);

  // Filtrado de productos por categoría y búsqueda de texto
  const productosFiltrados = menu.productos.filter((prod) => {
    const coincideCategoria =
      categoriaSeleccionada === null || prod.categoriaId === categoriaSeleccionada;

    const textoBusqueda = busqueda.toLowerCase().trim();
    const nombre = (idioma === 'en' ? prod.nombreEn : prod.nombreEs).toLowerCase();
    const descripcion = (idioma === 'en' ? prod.descripcionEn : prod.descripcionEs || '').toLowerCase();
    const coincideBusqueda =
      !textoBusqueda || nombre.includes(textoBusqueda) || descripcion.includes(textoBusqueda);

    return coincideCategoria && coincideBusqueda;
  });

  return (
    <div className="min-h-screen bg-[var(--color-fondo)] text-[var(--color-texto)] flex flex-col font-sans">
      {/* Encabezado */}
      <header className="sticky top-0 z-30 bg-[var(--color-superficie)] border-b border-[var(--color-borde)] px-4 py-3 sm:px-6 shadow-xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coffee className="w-6 h-6 text-[var(--color-accion)]" />
            <h1 className="text-xl font-serif font-bold text-[var(--color-primario)] tracking-tight">
              {menu.negocio?.nombre || t.comun.nombreApp}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Selector de idioma ES / EN */}
            <button
              onClick={() => cambiarIdioma(idioma === 'es' ? 'en' : 'es')}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs border border-[var(--color-borde)] rounded-[var(--radio-chico)] hover:bg-[var(--color-fondo)] transition-colors cursor-pointer"
              title="Cambiar idioma / Change language"
            >
              <Globe className="w-3.5 h-3.5 text-[var(--color-texto-suave)]" />
              <span className="font-semibold uppercase font-mono">{idioma}</span>
            </button>

            {/* Botón Carrito */}
            <button className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-primario)] text-white text-xs font-semibold rounded-[var(--radio-chico)] hover:opacity-90 transition-opacity cursor-pointer shadow-xs">
              <ShoppingBag className="w-4 h-4" />
              <span>0</span>
            </button>
          </div>
        </div>
      </header>

      {/* Subtítulo Hero */}
      <section className="bg-[var(--color-fondo)] border-b border-[var(--color-borde)] px-4 py-5 sm:px-6 text-center">
        <div className="max-w-xl mx-auto">
          <p className="text-sm sm:text-base text-[var(--color-texto-suave)] font-medium">
            {t.catalogo.subtitulo}
          </p>
        </div>
      </section>

      {/* Búsqueda y Filtros de Categoría */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-6">
        <div className="relative max-w-md mx-auto">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-texto-suave)]" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder={t.catalogo.buscarPlaceholder}
            className="w-full pl-9 pr-4 py-2 border border-[var(--color-borde)] rounded-[var(--radio-chico)] bg-[var(--color-superficie)] text-xs focus:outline-none focus:border-[var(--color-accion)]"
          />
        </div>

        {/* Píldoras de Categorías */}
        {menu.categorias.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setCategoriaSeleccionada(null)}
              className={`px-3 py-1.5 rounded-[var(--radio-chico)] text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
                categoriaSeleccionada === null
                  ? 'bg-[var(--color-primario)] text-white border-[var(--color-primario)]'
                  : 'bg-[var(--color-superficie)] text-[var(--color-texto-suave)] border-[var(--color-borde)] hover:bg-[var(--color-fondo)]'
              }`}
            >
              {t.catalogo.todasLasCategorias}
            </button>
            {menu.categorias.map((c) => {
              const activo = categoriaSeleccionada === c.id;
              const etiqueta = idioma === 'en' ? c.nombreEn : c.nombreEs;
              return (
                <button
                  key={c.id}
                  onClick={() => setCategoriaSeleccionada(c.id)}
                  className={`px-3 py-1.5 rounded-[var(--radio-chico)] text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
                    activo
                      ? 'bg-[var(--color-primario)] text-white border-[var(--color-primario)]'
                      : 'bg-[var(--color-superficie)] text-[var(--color-texto-suave)] border-[var(--color-borde)] hover:bg-[var(--color-fondo)]'
                  }`}
                >
                  {etiqueta}
                </button>
              );
            })}
          </div>
        )}

        {/* Estados de Carga, Error o Vacío */}
        {cargando ? (
          <div className="p-12 text-center text-xs text-[var(--color-texto-suave)] font-mono">
            {t.comun.cargando}
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-[var(--radio-chico)] flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : productosFiltrados.length === 0 ? (
          <div className="text-center py-12 px-4 border border-dashed border-[var(--color-borde)] rounded-[var(--radio-medio)] bg-[var(--color-superficie)]">
            <Coffee className="w-10 h-10 mx-auto text-[var(--color-texto-suave)] mb-2 opacity-60" />
            <h3 className="text-sm font-serif font-bold text-[var(--color-primario)]">
              {t.comun.sinResultados}
            </h3>
            <p className="text-xs text-[var(--color-texto-suave)] mt-1">
              {t.catalogo.sinProductos}
            </p>
          </div>
        ) : (
          /* Grid de Productos */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {productosFiltrados.map((prod) => {
              const nombre = idioma === 'en' ? prod.nombreEn : prod.nombreEs;
              const descripcion = idioma === 'en' ? prod.descripcionEn : prod.descripcionEs;
              const disponible = prod.disponible;

              return (
                <div
                  key={prod.id}
                  className={`bg-[var(--color-superficie)] border border-[var(--color-borde)] rounded-[var(--radio-medio)] p-4 flex flex-col justify-between transition-shadow hover:shadow-sm ${
                    !disponible ? 'opacity-75' : ''
                  }`}
                >
                  <div>
                    {prod.imagenUrl ? (
                      <img
                        src={prod.imagenUrl}
                        alt={nombre}
                        className="w-full h-40 object-cover rounded-[var(--radio-chico)] mb-3 border border-[var(--color-borde)]"
                      />
                    ) : (
                      <div className="w-full h-32 bg-stone-100 rounded-[var(--radio-chico)] mb-3 border border-[var(--color-borde)] flex items-center justify-center text-stone-300">
                        <ImageIcon className="w-8 h-8" />
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-serif font-bold text-sm text-[var(--color-primario)]">
                        {nombre}
                      </h3>
                      {!disponible && (
                        <span className="shrink-0 text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-800 font-semibold rounded">
                          {t.catalogo.agotado}
                        </span>
                      )}
                    </div>

                    {descripcion && (
                      <p className="text-xs text-[var(--color-texto-suave)] mt-1 line-clamp-2">
                        {descripcion}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-[var(--color-borde)] flex items-center justify-between">
                    <span className="font-mono font-bold text-sm text-[var(--color-primario)]">
                      ${prod.precio.toFixed(2)}
                    </span>
                    <button
                      disabled={!disponible}
                      className="px-3 py-1.5 bg-[var(--color-accion)] text-white text-xs font-semibold rounded-[var(--radio-chico)] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-opacity"
                    >
                      {t.catalogo.agregarAlPedido}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
