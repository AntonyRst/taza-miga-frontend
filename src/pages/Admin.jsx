import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useIdioma } from '../context/IdiomaContext.jsx';
import {
  Coffee,
  LogOut,
  BarChart3,
  Receipt,
  UtensilsCrossed,
  Tags,
  Sliders,
  Users,
  Store,
  ShieldAlert,
  KeyRound
} from 'lucide-react';
import ModalCambiarPassword from '../components/ModalCambiarPassword.jsx';
import AdminProductos from '../components/admin/AdminProductos.jsx';
import AdminCategorias from '../components/admin/AdminCategorias.jsx';
import AdminGruposOpciones from '../components/admin/AdminGruposOpciones.jsx';
import AdminPersonal from '../components/admin/AdminPersonal.jsx';
import AdminSucursales from '../components/admin/AdminSucursales.jsx';
import AdminResumenVentas from '../components/admin/AdminResumenVentas.jsx';
import AdminHistorialPedidos from '../components/admin/AdminHistorialPedidos.jsx';
import AdminAuditoria from '../components/admin/AdminAuditoria.jsx';

export default function Admin() {
  const { usuario, cerrarSesion } = useAuth();
  const { t, idioma, cambiarIdioma } = useIdioma();
  const [seccionActiva, setSeccionActiva] = useState('resumen');
  const [mostrarModalPassword, setMostrarModalPassword] = useState(false);

  const esDueno = usuario?.rol === 'DUENO';

  const secciones = [
    {
      id: 'resumen',
      etiqueta: t.admin.pestanaResumen,
      descripcion: t.admin.descResumen,
      icono: BarChart3
    },
    {
      id: 'pedidos',
      etiqueta: t.admin.historialPedidosTitulo || 'Historial de Pedidos',
      descripcion: t.admin.descPedidos,
      icono: Receipt
    },
    {
      id: 'productos',
      etiqueta: t.admin.pestanaProductos,
      descripcion: t.admin.descProductos,
      icono: UtensilsCrossed
    },
    {
      id: 'categorias',
      etiqueta: t.admin.pestanaCategorias,
      descripcion: t.admin.descCategorias,
      icono: Tags
    },
    {
      id: 'grupos',
      etiqueta: t.admin.pestanaGrupos,
      descripcion: t.admin.descGrupos,
      icono: Sliders
    },
    {
      id: 'personal',
      etiqueta: t.admin.pestanaPersonal,
      descripcion: t.admin.descPersonal,
      icono: Users
    },
    {
      id: 'sucursales',
      etiqueta: t.admin.pestanaSucursales,
      descripcion: t.admin.descSucursales,
      icono: Store,
      soloDueno: true
    },
    {
      id: 'auditoria',
      etiqueta: t.admin.pestanaAuditoria,
      descripcion: t.admin.descAuditoria,
      icono: ShieldAlert,
      soloDueno: true
    }
  ];

  const seccionActual = secciones.find((s) => s.id === seccionActiva) || secciones[0];

  return (
    <div className="min-h-screen bg-[var(--color-fondo)] text-[var(--color-texto)] flex flex-col font-sans">
      {/* Encabezado con logotipo, nombre en serif e insignia de rol con borde dorado (docs/diseno.md) */}
      <header className="bg-[var(--color-superficie)] border-b border-[var(--color-borde)] px-4 py-3 sm:px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[var(--color-fondo)] border border-[var(--color-borde)] flex items-center justify-center text-[var(--color-accion)] shrink-0">
            <Coffee className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-lg text-[var(--color-primario)] leading-tight">
              {t.admin.titulo}
            </h1>
          </div>
          <span className="text-[10px] sm:text-xs px-2.5 py-0.5 rounded-[var(--radio-pildora)] border border-[var(--color-acento)] bg-[var(--color-primario)] text-[var(--color-acento)] font-semibold uppercase tracking-wider shadow-2xs">
            {esDueno ? t.admin.rolDueno : t.admin.rolGerente}
          </span>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          {/* Selector de idioma */}
          <button
            onClick={() => cambiarIdioma(idioma === 'es' ? 'en' : 'es')}
            className="text-xs px-2.5 py-1 rounded-[var(--radio-chico)] bg-[var(--color-superficie)] border border-[var(--color-borde)] text-[var(--color-texto)] hover:bg-[var(--color-fondo)] transition-colors cursor-pointer font-medium"
            title="Cambiar idioma / Switch language"
          >
            {idioma === 'es' ? 'EN' : 'ES'}
          </button>

          <button
            onClick={() => setMostrarModalPassword(true)}
            className="flex items-center gap-1.5 text-xs text-[var(--color-texto-suave)] hover:text-[var(--color-primario)] transition-colors cursor-pointer"
          >
            <KeyRound className="w-4 h-4" />
            <span className="hidden sm:inline">{t.password.titulo}</span>
          </button>
          <button
            onClick={cerrarSesion}
            className="flex items-center gap-1.5 text-xs text-[var(--color-texto-suave)] hover:text-[var(--color-primario)] transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">{t.navegacion.cerrarSesion}</span>
          </button>
        </div>
      </header>

      {/* Franja oscura de título bajo el encabezado con degradado y textura de puntos (docs/diseno.md) */}
      <section className="bg-gradient-to-r from-[var(--color-primario)] to-[var(--color-primario-fin)] text-[var(--color-texto-sobre-oscuro)] px-4 py-5 sm:px-6 relative overflow-hidden border-b border-[var(--color-borde)]">
        <div className="absolute inset-0 textura-puntos opacity-35 pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-tight leading-tight">
              {seccionActual.etiqueta}
            </h2>
            <p className="text-xs text-[var(--color-texto-sobre-oscuro)]/80 mt-0.5">
              {seccionActual.descripcion}
            </p>
          </div>
        </div>
      </section>

      {mostrarModalPassword && (
        <ModalCambiarPassword onCerrar={() => setMostrarModalPassword(false)} />
      )}

      {/* Contenido: menú lateral y panel de administración */}
      <div className="flex-1 flex flex-col sm:flex-row max-w-7xl w-full mx-auto p-4 sm:p-6 gap-6">
        {/* Barra lateral de navegación sobre superficie con activo en espresso (docs/diseno.md) */}
        <aside className="w-full sm:w-60 shrink-0">
          <nav className="bg-[var(--color-superficie)] border border-[var(--color-borde)] rounded-[var(--radio-grande)] p-2 flex sm:flex-col gap-1 overflow-x-auto sm:overflow-visible pb-2 sm:pb-2 shadow-[var(--sombra-tarjeta)]">
            {secciones.map((sec) => {
              if (sec.soloDueno && !esDueno) return null;
              const Icono = sec.icono;
              const activo = seccionActiva === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => setSeccionActiva(sec.id)}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold rounded-[var(--radio-chico)] text-left transition-colors whitespace-nowrap cursor-pointer ${
                    activo
                      ? 'bg-[var(--color-primario)] text-[var(--color-texto-sobre-oscuro)] shadow-2xs font-bold'
                      : 'text-[var(--color-texto-suave)] hover:bg-[var(--color-fondo)] hover:text-[var(--color-primario)]'
                  }`}
                >
                  <Icono className="w-4 h-4 shrink-0" />
                  <span>{sec.etiqueta}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Panel de contenido de la sección activa */}
        <main className="flex-1 bg-[var(--color-superficie)] border border-[var(--color-borde)] rounded-[var(--radio-grande)] p-4 sm:p-6 overflow-x-hidden shadow-[var(--sombra-tarjeta)]">
          {seccionActiva === 'resumen' && <AdminResumenVentas />}
          {seccionActiva === 'pedidos' && <AdminHistorialPedidos />}
          {seccionActiva === 'productos' && <AdminProductos />}
          {seccionActiva === 'categorias' && <AdminCategorias />}
          {seccionActiva === 'grupos' && <AdminGruposOpciones />}
          {seccionActiva === 'personal' && <AdminPersonal />}
          {seccionActiva === 'sucursales' && <AdminSucursales />}
          {seccionActiva === 'auditoria' && <AdminAuditoria />}
        </main>
      </div>
    </div>
  );
}
