import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useIdioma } from '../context/IdiomaContext.jsx';
import { Lock, AlertCircle, CheckCircle2, X } from 'lucide-react';

export default function ModalCambiarPassword({ obligatorio = false, onCerrar }) {
  const { fetchConToken, iniciarSesion } = useAuth();
  const { t } = useIdioma();

  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');
  const [passwordConfirmar, setPasswordConfirmar] = useState('');
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // RN-07: Mínimo 8 caracteres
    if (passwordNueva.length < 8) {
      setError(t.password.errorLongitud);
      return;
    }

    if (passwordNueva !== passwordConfirmar) {
      setError(t.password.errorNoCoinciden);
      return;
    }

    setCargando(true);

    try {
      const res = await fetchConToken('/auth/cambiar-password', {
        method: 'PUT',
        body: JSON.stringify({ passwordActual, passwordNueva })
      });

      const datos = await res.json();

      if (!res.ok) {
        setError(datos.error || t.comun.errorConexion);
        return;
      }

      // Actualizar token con la nueva sesión (debe_cambiar_password = false)
      if (datos.token) {
        iniciarSesion(datos.token);
      }

      setExito(true);

      setTimeout(() => {
        if (onCerrar) onCerrar();
      }, 1500);
    } catch {
      setError(t.comun.errorConexion);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[var(--color-superficie)] border border-[var(--color-borde)] rounded-[var(--radio-medio)] p-6 space-y-5 relative">
        {!obligatorio && onCerrar && (
          <button
            onClick={onCerrar}
            className="absolute top-4 right-4 text-[var(--color-texto-suave)] hover:text-[var(--color-texto)] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="text-center space-y-1">
          <div className="w-10 h-10 rounded-full bg-[var(--color-fondo)] border border-[var(--color-borde)] flex items-center justify-center mx-auto text-[var(--color-accion)] mb-2">
            <Lock className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-serif font-bold text-[var(--color-primario)]">
            {t.password.titulo}
          </h2>
          <p className="text-xs text-[var(--color-texto-suave)]">
            {obligatorio ? t.password.subtituloTemporal : t.password.subtituloNormal}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-[var(--color-error)] text-[var(--color-error)] rounded-[var(--radio-chico)] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {exito ? (
          <div className="p-4 bg-green-50 border border-[var(--color-exito)] text-[var(--color-exito)] rounded-[var(--radio-chico)] text-sm flex items-center justify-center gap-2 font-medium">
            <CheckCircle2 className="w-5 h-5" />
            <span>{t.password.exito}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-texto-suave)] mb-1">
                {t.password.passwordActual}
              </label>
              <input
                type="password"
                required
                value={passwordActual}
                onChange={(e) => setPasswordActual(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--color-borde)] rounded-[var(--radio-chico)] text-sm bg-[var(--color-fondo)] focus:outline-none focus:border-[var(--color-primario)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-texto-suave)] mb-1">
                {t.password.passwordNueva}
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={passwordNueva}
                onChange={(e) => setPasswordNueva(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--color-borde)] rounded-[var(--radio-chico)] text-sm bg-[var(--color-fondo)] focus:outline-none focus:border-[var(--color-primario)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-texto-suave)] mb-1">
                {t.password.passwordConfirmar}
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={passwordConfirmar}
                onChange={(e) => setPasswordConfirmar(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--color-borde)] rounded-[var(--radio-chico)] text-sm bg-[var(--color-fondo)] focus:outline-none focus:border-[var(--color-primario)]"
              />
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="w-full py-2.5 bg-[var(--color-primario)] text-white text-sm font-semibold rounded-[var(--radio-chico)] hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer mt-2"
            >
              {cargando ? t.comun.cargando : t.password.cambiarBtn}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
