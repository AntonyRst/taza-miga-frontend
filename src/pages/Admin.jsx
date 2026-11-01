import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useIdioma } from '../context/IdiomaContext.jsx';
import { Coffee, LogOut, BarChart3, UtensilsCrossed, Users, Store, ShieldAlert, KeyRound } from 'lucide-react';
import ModalCambiarPassword from '../components/ModalCambiarPassword.jsx';

export default function Admin() {
  const { usuario, cerrarSesion } = useAuth();
  const { t } = useIdioma();
  const [seccionActiva, setSeccionActiva] = useState('resumen');
  const [mostrarModalPassword, setMostrarModalPassword] = useState(false);

  const esDueno = usuario?.rol === 'DUENO';

  const secciones = [
    { id: 'resumen', etiqueta: t.admin.pestanaResumen, icono: BarChart3 },
    { id: 'menu', etiqueta: t.admin.pestanaProductos, icono: UtensilsCrossed },
    { id: 'personal', etiqueta: t.admin.pestanaPersonal, icono: Users },
    { id: 'sucursales', etiqueta: t.admin.pestanaSucursales, icono: Store, soloDueno: true },
    { id: 'auditoria', etiqueta: t.admin.pestanaAuditoria, icono: ShieldAlert, soloDueno: true }
  ];

  return (
    <div className="min-h-screen bg-[var(--color-fondo)] text-[var(--color-texto)] flex flex-col font-sans">
      {/* Encabezado */}
      <header className="bg-[var(--color-superficie)] border-b border-[var(--color-borde)] px-4 py-3 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Coffee className="w-6 h-6 text-[var(--color-accion)]" />
          <h1 className="font-serif font-bold text-lg text-[var(--color-primario)]">
            {t.admin.titulo}
          </h1>
          <span className="text-xs px-2 py-0.5 bg-[var(--color-fondo)] border border-[var(--color-borde)] rounded-[var(--radio-chico)] text-[var(--color-texto-suave)] font-mono font-medium">
            {usuario?.rol || 'GERENTE'}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setMostrarModalPassword(true)}
            className="flex items-center gap-1.5 text-xs text-[var(--color-texto-suave)] hover:text-[var(--color-primario)] transition-colors cursor-pointer"
          >
            <KeyRound className="w-4 h-4" />
            <span>{t.password.titulo}</span>
          </button>
          <button
            onClick={cerrarSesion}
            className="flex items-center gap-1.5 text-xs text-[var(--color-texto-suave)] hover:text-[var(--color-primario)] transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>{t.navegacion.cerrarSesion}</span>
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
        <main className="flex-1 bg-[var(--color-superficie)] border border-[var(--color-borde)] rounded-[var(--radio-medio)] p-6">
          <h2 className="text-lg font-serif font-bold text-[var(--color-primario)] mb-4">
            {secciones.find((s) => s.id === seccionActiva)?.etiqueta}
          </h2>
          <div className="p-8 text-center border border-dashed border-[var(--color-borde)] rounded-[var(--radio-chico)] text-[var(--color-texto-suave)] text-sm">
            {t.comun.cargando}
          </div>
        </main>
      </div>
    </div>
  );
}
