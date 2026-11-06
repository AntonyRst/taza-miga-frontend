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

  // Botón accesible de fuente ampliada A+/A- (docs/diseno.md)
  const [fuenteAmpliada, setFuenteAmpliada] = useState(() => {
    return localStorage.getItem('taza_miga_accesibilidad_fuente') === 'grande';
  });

  const alternarTamanoFuente = () => {
    setFuenteAmpliada((prev) => {
      const nuevo = !prev;
      localStorage.setItem('taza_miga_accesibilidad_fuente', nuevo ? 'grande' : 'normal');
      if (nuevo) {
        document.documentElement.classList.add('fuente-ampliada');
      } else {
        document.documentElement.classList.remove('fuente-ampliada');
      }
      return nuevo;
    });
  };

  useEffect(() => {
    if (fuenteAmpliada) {
      document.documentElement.classList.add('fuente-ampliada');
    } else {
      document.documentElement.classList.remove('fuente-ampliada');
    }
  }, [fuenteAmpliada]);

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
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[var(--color-fondo)] border border-[var(--color-borde)] flex items-center justify-center text-[var(--color-accion)] shrink-0">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-serif font-bold text-[var(--color-primario)] tracking-tight leading-tight">
                {menu.negocio?.nombre || t.comun.nombreApp}
              </h1>
              <p
                className="text-[10px] font-semibold uppercase text-[var(--color-texto-suave)]"
                style={{ letterSpacing: 'var(--espaciado-etiqueta)' }}
              >
                {t.catalogo.subtituloMarca}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Selector de idioma ES / EN */}
            <button
              onClick={() => cambiarIdioma(idioma === 'es' ? 'en' : 'es')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs border border-[var(--color-borde)] rounded-[var(--radio-chico)] bg-[var(--color-superficie)] hover:bg-[var(--color-fondo)] transition-colors cursor-pointer"
              title="Cambiar idioma / Change language"
            >
              <Globe className="w-3.5 h-3.5 text-[var(--color-texto-suave)]" />
              <span className="font-semibold uppercase font-mono">{idioma}</span>
            </button>

            {/* Botón Carrito con indicador y total acumulado (docs/diseno.md, HU-08) */}
            <button
              onClick={() => setMostrarCarrito(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-[var(--color-accion)] text-white text-xs font-semibold rounded-[var(--radio-chico)] hover:opacity-95 transition-opacity cursor-pointer shadow-xs"
              aria-label={t.carrito.titulo}
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="font-mono tabular-nums font-bold">
                {totalArticulos}
              </span>
              {totalArticulos > 0 && (
                <span className="font-mono text-white/95 pl-1.5 border-l border-white/30">
                  ${total.toFixed(2)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Hero oscuro con identidad (docs/diseno.md) */}
      <section className="bg-gradient-to-r from-[var(--color-primario)] to-[var(--color-primario-fin)] text-[var(--color-texto-sobre-oscuro)] px-4 py-8 sm:py-10 sm:px-6 relative overflow-hidden border-b border-[var(--color-borde)]">
        <div className="absolute inset-0 textura-puntos opacity-40 pointer-events-none" />
        <div className="max-w-5xl mx-auto relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl space-y-2.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[var(--radio-pildora)] border border-[var(--color-acento)]/60 bg-[var(--color-primario)]/50 text-[var(--color-acento)] text-[10px] sm:text-xs font-semibold tracking-wider uppercase">
              <span>{t.catalogo.etiquetaHero}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-white tracking-tight leading-tight">
              {t.catalogo.tituloHero}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--color-texto-sobre-oscuro)]/80 max-w-md leading-relaxed">
              {t.catalogo.subtituloHero}
            </p>
          </div>

          {/* Tarjeta de seguimiento translúcida en el hero si hay pedido activo (HU-12, docs/diseno.md) */}
          {pedidoActivo && (
            <div className="w-full md:w-80 bg-[var(--color-texto-sobre-oscuro)]/10 backdrop-blur-md border border-[var(--color-texto-sobre-oscuro)]/20 rounded-[var(--radio-grande)] p-4 text-[var(--color-texto-sobre-oscuro)] shadow-lg shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[var(--color-accion)]/20 border border-[var(--color-accion)]/40 flex items-center justify-center text-[var(--color-acento)] shrink-0">
                  <Clock className="w-4 h-4 animate-pulse" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-serif font-bold text-xs text-white truncate">
                      {t.seguimiento.pedidoActivoTitulo} (#{pedidoActivo.numeroOrden})
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-[var(--radio-pildora)] font-semibold bg-[var(--color-texto-sobre-oscuro)]/20 text-white shrink-0">
                      {obtenerEtiquetaEstado(pedidoActivo.estado)}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--color-texto-sobre-oscuro)]/80 mt-0.5 truncate">
                    {pedidoActivo.nombreCliente} • {t.seguimiento.actualizandoEnVivo}
                  </p>
                </div>
              </div>
              <Link
                to={`/order/${pedidoActivo.codigoSeguimiento}`}
                className="mt-3 w-full py-2 px-3 bg-[var(--color-accion)] text-white text-xs font-semibold rounded-[var(--radio-chico)] hover:opacity-90 transition-opacity text-center inline-flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span>{t.seguimiento.verMiPedido}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Contenido principal */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Fila de Filtros y Buscador juntos (docs/diseno.md) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Píldoras de Categorías (HU-06) */}
          {menu.categorias.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none flex-1">
              <button
                onClick={() => setCategoriaSeleccionada(null)}
                className={`px-3.5 py-1.5 rounded-[var(--radio-pildora)] text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
                  categoriaSeleccionada === null
                    ? 'bg-[var(--color-accion)] text-white border-[var(--color-accion)] shadow-xs'
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
                    className={`px-3.5 py-1.5 rounded-[var(--radio-pildora)] text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
                      activo
                        ? 'bg-[var(--color-accion)] text-white border-[var(--color-accion)] shadow-xs'
                        : 'bg-[var(--color-superficie)] text-[var(--color-texto-suave)] border-[var(--color-borde)] hover:bg-[var(--color-fondo)]'
                    }`}
                  >
                    {etiqueta}
                  </button>
                );
              })}
            </div>
          )}

          {/* Buscador a la derecha (HU-06, docs/diseno.md) */}
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-texto-suave)]" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder={t.catalogo.buscarPlaceholder}
              className="w-full pl-8 pr-8 py-1.5 border border-[var(--color-borde)] rounded-[var(--radio-pildora)] bg-[var(--color-superficie)] text-xs focus:outline-none focus:border-[var(--color-accion)] shadow-2xs"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-texto-suave)] hover:text-[var(--color-primario)] p-0.5 rounded cursor-pointer"
                aria-label="Limpiar búsqueda"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

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
          <div className="text-center py-12 px-4 border border-dashed border-[var(--color-borde)] rounded-[var(--radio-grande)] bg-[var(--color-superficie)] space-y-3">
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
          /* Grid de Productos con esquinas redondeadas y píldora de precio sobre foto (docs/diseno.md, HU-05) */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {productosFiltrados.map((prod) => {
              const nombre = idioma === 'en' ? prod.nombreEn : prod.nombreEs;
              const descripcion = idioma === 'en' ? prod.descripcionEn : prod.descripcionEs;
              const disponible = prod.disponible;

              return (
                <div
                  key={prod.id}
                  onClick={() => handleAbrirPersonalizar(prod)}
                  className={`group bg-[var(--color-superficie)] border border-[var(--color-borde)] rounded-[var(--radio-grande)] overflow-hidden flex flex-col justify-between transition-all select-none shadow-[var(--sombra-tarjeta)] ${
                    !disponible
                      ? 'opacity-65 cursor-not-allowed'
                      : 'hover:border-[var(--color-accion)] cursor-pointer'
                  }`}
                >
                  <div>
                    {/* Foto borde a borde con píldora de precio sobre la foto */}
                    <div className="relative w-full aspect-4/3 overflow-hidden bg-[var(--color-fondo)]">
                      {prod.imagenUrl ? (
                        <img
                          src={prod.imagenUrl}
                          alt={nombre}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[var(--color-texto-suave)]">
                          <ImageIcon className="w-10 h-10 opacity-30" />
                        </div>
                      )}

                      {/* Píldora oscura de precio sobre la foto (docs/diseno.md) */}
                      <div className="absolute top-2.5 right-2.5 bg-[var(--color-primario)]/90 backdrop-blur-xs text-[var(--color-acento)] px-2.5 py-1 rounded-[var(--radio-pildora)] font-mono font-bold text-xs shadow-sm border border-black/20">
                        ${prod.precio.toFixed(2)}
                      </div>

                      {!disponible && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="text-xs px-2.5 py-1 bg-amber-900/90 text-amber-200 font-semibold rounded-[var(--radio-pildora)] border border-amber-700">
                            {t.catalogo.agotado}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <h3 className="font-serif font-bold text-base text-[var(--color-primario)] leading-tight">
                        {nombre}
                      </h3>
                      {descripcion && (
                        <p className="text-xs text-[var(--color-texto-suave)] mt-1.5 line-clamp-2 leading-relaxed">
                          {descripcion}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="p-4 pt-0">
                    <button
                      type="button"
                      disabled={!disponible}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAbrirPersonalizar(prod);
                      }}
                      className="w-full py-2 bg-[var(--color-accion)] text-white text-xs font-semibold rounded-[var(--radio-chico)] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-opacity flex items-center justify-center gap-1 shadow-xs"
                    >
                      <span>{t.catalogo.agregarAlPedido}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Botón flotante accesible A+/A- (docs/diseno.md) */}
      <button
        type="button"
        onClick={alternarTamanoFuente}
        className="fixed bottom-4 left-4 z-30 flex items-center gap-1.5 px-3 py-2 bg-[var(--color-superficie)] text-[var(--color-primario)] border border-[var(--color-borde)] rounded-[var(--radio-pildora)] text-xs font-bold shadow-md hover:border-[var(--color-accion)] transition-all cursor-pointer"
        title={fuenteAmpliada ? t.catalogo.reducirFuente : t.catalogo.aumentarFuente}
        aria-label={t.catalogo.accesibilidadFuente}
      >
        <span className="font-serif text-sm">A</span>
        <span className="text-[10px] text-[var(--color-texto-suave)] font-mono">
          {fuenteAmpliada ? '−' : '+'}
        </span>
      </button>

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
