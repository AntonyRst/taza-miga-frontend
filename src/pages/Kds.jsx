import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useIdioma } from '../context/IdiomaContext.jsx';
import { Coffee, LogOut, Volume2, KeyRound } from 'lucide-react';
import ModalCambiarPassword from '../components/ModalCambiarPassword.jsx';

export default function Kds() {
  const { usuario, cerrarSesion } = useAuth();
  const { t } = useIdioma();
  const [mostrarModalPassword, setMostrarModalPassword] = useState(false);

  return (
    <div className="min-h-screen bg-[#181214] text-[#F5EDE8] flex flex-col font-sans">
      {/* Encabezado KDS oscuro */}
      <header className="bg-[#231B1D] border-b border-[#3D2E32] px-4 py-3 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Coffee className="w-6 h-6 text-[var(--color-accion)]" />
          <h1 className="font-serif font-bold text-lg text-white">
            {t.kds.titulo}
          </h1>
          <span className="text-xs px-2 py-0.5 bg-[#3D2E32] rounded-[var(--radio-chico)] text-[#A8989C] font-mono">
            {usuario?.rol || 'BARISTA'}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setMostrarModalPassword(true)}
            className="flex items-center gap-1.5 text-xs text-[#A8989C] hover:text-white transition-colors cursor-pointer"
          >
            <KeyRound className="w-4 h-4" />
            <span>{t.password.titulo}</span>
          </button>
          <button
            className="p-1.5 text-[#A8989C] hover:text-white transition-colors cursor-pointer"
            title="Activar / Desactivar sonido"
          >
            <Volume2 className="w-5 h-5" />
          </button>
          <button
            onClick={cerrarSesion}
            className="flex items-center gap-1.5 text-xs text-[#A8989C] hover:text-white transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>{t.navegacion.cerrarSesion}</span>
          </button>
        </div>
      </header>

      {mostrarModalPassword && (
        <ModalCambiarPassword onCerrar={() => setMostrarModalPassword(false)} />
      )}

      {/* Área de comandas */}
      <main className="flex-1 p-4 sm:p-6">
        <div className="h-64 flex flex-col items-center justify-center border border-dashed border-[#3D2E32] rounded-[var(--radio-medio)] text-[#A8989C] text-center p-6 bg-[#231B1D]">
          <Coffee className="w-10 h-10 mb-2 opacity-40 text-[var(--color-accion)]" />
          <p className="text-sm max-w-sm">
            {t.kds.sinPedidos}
          </p>
        </div>
      </main>
    </div>
  );
}
