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
    { id: 'resumen', etiqueta: t.admin.pestanaResumen, icono: BarChart3 },
    { id: 'pedidos', etiqueta: t.admin.historialPedidosTitulo || 'Historial de Pedidos', icono: Receipt },
    { id: 'productos', etiqueta: t.admin.pestanaProductos, icono: UtensilsCrossed },
    { id: 'categorias', etiqueta: t.admin.pestanaCategorias, icono: Tags },
    { id: 'grupos', etiqueta: t.admin.pestanaGrupos, icono: Sliders },
    { id: 'personal', etiqueta: t.admin.pestanaPersonal, icono: Users },
    { id: 'sucursales', etiqueta: t.admin.pestanaSucursales, icono: Store, soloDueno: true },
    { id: 'auditoria', etiqueta: t.admin.pestanaAuditoria, icono: ShieldAlert, soloDueno: true }
  ];

  return (
    <div className="min-h-screen bg-[var(--color-fondo)] text-[var(--color-texto)] flex flex-col font-sans">
      {/* Encabezado */}
      <header className="bg-[var(--color-superficie)] border-b border-[var(--color-borde)] px-4 py-3 sm:px-6 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Coffee className="w-6 h-6 text-[var(--color-accion)] shrink-0" />
          <h1 className="font-serif font-bold text-lg text-[var(--color-primario)]">
            {t.admin.titulo}
          </h1>
          <span className="text-xs px-2 py-0.5 bg-[var(--color-fondo)] border border-[var(--color-borde)] rounded-[var(--radio-chico)] text-[var(--color-texto-suave)] font-mono font-medium">
            {usuario?.rol || 'GERENTE'}
          </span>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          {/* Selector de idioma */}
          <button
            onClick={() => cambiarIdioma(idioma === 'es' ? 'en' : 'es')}
            className="text-xs px-2 py-1 rounded-[var(--radio-chico)] bg-[var(--color-fondo)] border border-[var(--color-borde)] text-[var(--color-texto)] hover:text-black transition-colors cursor-pointer font-medium"
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

      {mostrarModalPassword && (
        <ModalCambiarPassword onCerrar={() => setMostrarModalPassword(false)} />
      )}

      <div className="flex-1 flex flex-col sm:flex-row max-w-7xl w-full mx-auto p-4 sm:p-6 gap-6">
        {/* Barra lateral de navegación interna */}
        <aside className="w-full sm:w-56 shrink-0">
          <nav className="flex sm:flex-col gap-1 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0">
            {secciones.map((sec) => {
              if (sec.soloDueno && !esDueno) return null;
              const Icono = sec.icono;
              const activo = seccionActiva === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => setSeccionActiva(sec.id)}
                  className={`flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-[var(--radio-chico)] text-left transition-colors whitespace-nowrap cursor-pointer ${
                    activo
                      ? 'bg-[var(--color-primario)] text-white'
                      : 'text-[var(--color-texto-suave)] hover:bg-[var(--color-superficie)]'
                  }`}
                >
                  <Icono className="w-4 h-4" />
                  <span>{sec.etiqueta}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Panel de contenido de la sección activa */}
        <main className="flex-1 bg-[var(--color-superficie)] border border-[var(--color-borde)] rounded-[var(--radio-medio)] p-4 sm:p-6 shadow-xs overflow-x-hidden">
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
