import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useIdioma } from '../context/IdiomaContext.jsx';
import { useCarrito } from '../context/CarritoContext.jsx';
import {
  Coffee,
  ShoppingBag,
  Globe,
  Search,
  X,
  AlertCircle,
  Image as ImageIcon,
  RotateCcw,
  Clock,
  ArrowRight
} from 'lucide-react';
import ModalPersonalizarProducto from '../components/cliente/ModalPersonalizarProducto.jsx';
import DrawerCarrito from '../components/cliente/DrawerCarrito.jsx';
import ModalConfirmarPedido from '../components/cliente/ModalConfirmarPedido.jsx';

export default function Catalogo() {
  const { t, idioma, cambiarIdioma } = useIdioma();
  const {
    totalArticulos,
    total,
    agregarAlCarrito,
    sincronizarDisponibilidad
  } = useCarrito();

  const [menu, setMenu] = useState({ categorias: [], productos: [] });
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Estados de modales interactivos (HU-07, HU-08, HU-11)
  const [productoParaPersonalizar, setProductoParaPersonalizar] = useState(null);
  const [mostrarCarrito, setMostrarCarrito] = useState(false);
  const [mostrarConfirmarPedido, setMostrarConfirmarPedido] = useState(false);

  // Estado del pedido activo guardado en localStorage (HU-12)
  const [pedidoActivo, setPedidoActivo] = useState(null);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  const cargarMenu = useCallback(async () => {
    try {
      setCargando(true);
      setError(null);
      const res = await fetch(`${apiUrl}/publico/taza-miga/menu`);
      if (!res.ok) throw new Error(t.comun.errorConexion);
      const data = await res.json();
      setMenu(data);
      // Sincronizar disponibilidad con el carrito activo (RN-14)
      sincronizarDisponibilidad(data.productos);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, [apiUrl, t.comun.errorConexion, sincronizarDisponibilidad]);

  // Verificar si hay pedido activo en curso (HU-12)
  const verificarPedidoActivo = useCallback(async () => {
    const codigoGuardado = localStorage.getItem('taza_miga_pedido_activo');
    if (!codigoGuardado) {
      setPedidoActivo(null);
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/publico/ordenes/seguimiento/${codigoGuardado}`);
      if (!res.ok) {
        localStorage.removeItem('taza_miga_pedido_activo');
        setPedidoActivo(null);
        return;
      }

      const data = await res.json();

      // Si está en preparación, recibido o listo, mantener activo
      if (['RECIBIDO', 'PREPARACION', 'LISTO'].includes(data.estado)) {
        setPedidoActivo(data);
      } else {
        // ENTREGADO o CANCELADO deja de mostrarse como activo (HU-12)
        localStorage.removeItem('taza_miga_pedido_activo');
        setPedidoActivo(null);
      }
    } catch {
      setPedidoActivo(null);
    }
  }, [apiUrl]);

  useEffect(() => {
    cargarMenu();
    verificarPedidoActivo();

    // Comprobar estado del pedido activo cada 5 segundos si existe
    const intervalo = setInterval(() => {
      verificarPedidoActivo();
    }, 5000);

    return () => clearInterval(intervalo);
  }, [cargarMenu, verificarPedidoActivo]);

  // Filtrado de productos por categoría y búsqueda en tiempo real (HU-06)
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

  const limpiarFiltrosYBusqueda = () => {
    setBusqueda('');
    setCategoriaSeleccionada(null);
  };

  const handleAbrirPersonalizar = (prod) => {
    if (!prod.disponible) return; // RN-14
    setProductoParaPersonalizar(prod);
  };

  const handleAgregarAlCarrito = (datosPersonalizados) => {
    agregarAlCarrito(datosPersonalizados);
  };

  const obtenerEtiquetaEstado = (estado) => {
    switch (estado) {
      case 'RECIBIDO':
        return t.seguimiento.estadoRecibido;
      case 'PREPARACION':
        return t.seguimiento.estadoPreparacion;
      case 'LISTO':
        return t.seguimiento.estadoListo;
      default:
        return estado;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-fondo)] text-[var(--color-texto)] flex flex-col font-sans">
      {/* Encabezado según docs/diseno.md */}
      <header className="sticky top-0 z-30 bg-[var(--color-superficie)] border-b border-[var(--color-borde)] px-4 py-3 sm:px-6 shadow-xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coffee className="w-6 h-6 text-[var(--color-accion)]" />
            <h1 className="text-xl font-serif font-bold text-[var(--color-primario)] tracking-tight">
              {menu.negocio?.nombre || t.comun.nombreApp}
            </h1>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Selector de idioma ES / EN */}
            <button
              onClick={() => cambiarIdioma(idioma === 'es' ? 'en' : 'es')}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs border border-[var(--color-borde)] rounded-[var(--radio-chico)] hover:bg-[var(--color-fondo)] transition-colors cursor-pointer"
              title="Cambiar idioma / Change language"
            >
              <Globe className="w-3.5 h-3.5 text-[var(--color-texto-suave)]" />
              <span className="font-semibold uppercase font-mono">{idioma}</span>
            </button>

            {/* Botón Carrito con indicador y total acumulado (docs/diseno.md, HU-08) */}
            <button
              onClick={() => setMostrarCarrito(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-primario)] text-white text-xs font-semibold rounded-[var(--radio-chico)] hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
              aria-label={t.carrito.titulo}
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="font-mono tabular-nums font-bold">
                {totalArticulos}
              </span>
              {totalArticulos > 0 && (
                <span className="font-mono text-white/90 pl-1 border-l border-white/20">
                  ${total.toFixed(2)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Franja Hero sobria (docs/diseno.md) */}
      <section className="bg-[var(--color-fondo)] border-b border-[var(--color-borde)] px-4 py-4 sm:py-5 sm:px-6 text-center">
        <div className="max-w-xl mx-auto">
          <p className="text-xs sm:text-sm text-[var(--color-texto-suave)] font-medium">
            {t.catalogo.subtitulo}
          </p>
        </div>
      </section>

      {/* Contenido principal */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Tarjeta de Pedido Activo (HU-12: solo visible si hay pedido en curso) */}
        {pedidoActivo && (
          <div className="bg-[var(--color-superficie)] border border-[var(--color-borde)] rounded-[var(--radio-medio)] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
                <Clock className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-serif font-bold text-sm text-[var(--color-primario)]">
                    {t.seguimiento.pedidoActivoTitulo} (#{pedidoActivo.numeroOrden})
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded font-semibold bg-stone-100 text-[var(--color-primario)] border border-[var(--color-borde)]">
                    {obtenerEtiquetaEstado(pedidoActivo.estado)}
                  </span>
                </div>
                <p className="text-xs text-[var(--color-texto-suave)] mt-0.5">
                  {pedidoActivo.nombreCliente} • {t.seguimiento.actualizandoEnVivo}
                </p>
              </div>
            </div>

            <Link
              to={`/order/${pedidoActivo.codigoSeguimiento}`}
              className="px-4 py-2 bg-[var(--color-accion)] text-white text-xs font-semibold rounded-[var(--radio-chico)] hover:opacity-90 transition-opacity text-center cursor-pointer inline-flex items-center justify-center gap-1.5 shadow-xs"
            >
              <span>{t.seguimiento.verMiPedido}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Búsqueda (HU-06) */}
        <div className="relative max-w-md mx-auto">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-texto-suave)]" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder={t.catalogo.buscarPlaceholder}
            className="w-full pl-9 pr-9 py-2 border border-[var(--color-borde)] rounded-[var(--radio-chico)] bg-[var(--color-superficie)] text-xs focus:outline-none focus:border-[var(--color-accion)]"
          />
          {busqueda && (
            <button
              type="button"
              onClick={() => setBusqueda('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-texto-suave)] hover:text-[var(--color-primario)] p-0.5 rounded cursor-pointer"
              aria-label="Limpiar búsqueda"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Píldoras de Categorías (HU-06) */}
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

        {/* Estados de Carga, Error o Vacío (HU-05, HU-06) */}
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
          <div className="text-center py-12 px-4 border border-dashed border-[var(--color-borde)] rounded-[var(--radio-medio)] bg-[var(--color-superficie)] space-y-3">
            <Coffee className="w-10 h-10 mx-auto text-[var(--color-texto-suave)] opacity-60" />
            <div>
              <h3 className="text-sm font-serif font-bold text-[var(--color-primario)]">
                {t.comun.sinResultados}
              </h3>
              <p className="text-xs text-[var(--color-texto-suave)] mt-1">
                {busqueda || categoriaSeleccionada !== null
                  ? t.catalogo.sinResultadosDesc
                  : t.catalogo.sinProductos}
              </p>
            </div>
            {(busqueda || categoriaSeleccionada !== null) && (
              <button
                type="button"
                onClick={limpiarFiltrosYBusqueda}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-superficie)] border border-[var(--color-borde)] rounded-[var(--radio-chico)] text-xs font-semibold text-[var(--color-primario)] hover:bg-[var(--color-fondo)] transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t.catalogo.limpiarFiltros}</span>
              </button>
            )}
          </div>
        ) : (
          /* Grid de Productos (HU-05) */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {productosFiltrados.map((prod) => {
              const nombre = idioma === 'en' ? prod.nombreEn : prod.nombreEs;
              const descripcion = idioma === 'en' ? prod.descripcionEn : prod.descripcionEs;
              const disponible = prod.disponible;

              return (
                <div
                  key={prod.id}
                  onClick={() => handleAbrirPersonalizar(prod)}
                  className={`bg-[var(--color-superficie)] border border-[var(--color-borde)] rounded-[var(--radio-medio)] p-4 flex flex-col justify-between transition-all select-none ${
                    !disponible
                      ? 'opacity-65 cursor-not-allowed'
                      : 'hover:border-[var(--color-accion)] hover:shadow-2xs cursor-pointer'
                  }`}
                >
                  <div>
                    {prod.imagenUrl ? (
                      <div className="w-full aspect-4/3 overflow-hidden rounded-[var(--radio-chico)] mb-3 border border-[var(--color-borde)] bg-stone-100">
                        <img
                          src={prod.imagenUrl}
                          alt={nombre}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="w-full aspect-4/3 bg-[var(--color-fondo)] rounded-[var(--radio-chico)] mb-3 border border-[var(--color-borde)] flex items-center justify-center text-[var(--color-texto-suave)]">
                        <ImageIcon className="w-8 h-8 opacity-40" />
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
                      type="button"
                      disabled={!disponible}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAbrirPersonalizar(prod);
                      }}
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

      {/* Modal de Personalización de Producto (HU-07) */}
      {productoParaPersonalizar && (
        <ModalPersonalizarProducto
          producto={productoParaPersonalizar}
          onCerrar={() => setProductoParaPersonalizar(null)}
          onAgregar={handleAgregarAlCarrito}
        />
      )}

      {/* Drawer del Carrito de Compras (HU-08) */}
      <DrawerCarrito
        abierto={mostrarCarrito}
        onCerrar={() => setMostrarCarrito(false)}
        onConfirmarPedido={() => {
          setMostrarCarrito(false);
          setMostrarConfirmarPedido(true);
        }}
      />

      {/* Modal de Confirmación de Pedido (HU-11) */}
      <ModalConfirmarPedido
        abierto={mostrarConfirmarPedido}
        onCerrar={() => setMostrarConfirmarPedido(false)}
      />
    </div>
  );
}
