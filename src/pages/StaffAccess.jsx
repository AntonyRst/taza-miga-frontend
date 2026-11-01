import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useIdioma } from '../context/IdiomaContext.jsx';
import { Coffee, Lock, Mail, AlertCircle } from 'lucide-react';

export default function StaffAccess() {
  const { iniciarSesion, apiUrl } = useAuth();
  const { t } = useIdioma();
  const navigate = useNavigate();

  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, password })
      });

      const datos = await res.json();

      if (!res.ok) {
        // Mensaje genérico de error de credenciales (RN-07)
        setError(datos.error || t.login.errorCredenciales);
        return;
      }

      iniciarSesion(datos.token);

      // Redirigir según el rol (HU-01)
      if (datos.usuario.rol === 'BARISTA') {
        navigate('/kds');
      } else {
        navigate('/admin');
      }
    } catch {
      setError(t.comun.errorConexion);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-fondo)] flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-[var(--color-superficie)] border border-[var(--color-borde)] rounded-[var(--radio-medio)] p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-[var(--color-fondo)] border border-[var(--color-borde)] flex items-center justify-center mx-auto text-[var(--color-accion)]">
            <Coffee className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-[var(--color-primario)]">
            {t.login.titulo}
          </h1>
          <p className="text-sm text-[var(--color-texto-suave)]">
            {t.login.subtitulo}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-[var(--color-error)] text-[var(--color-error)] rounded-[var(--radio-chico)] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--color-texto-suave)] mb-1">
              {t.login.correoLabel}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-texto-suave)]" />
              <input
                type="email"
                required
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-[var(--color-borde)] rounded-[var(--radio-chico)] text-sm bg-[var(--color-fondo)] focus:outline-none focus:border-[var(--color-primario)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-texto-suave)] mb-1">
              {t.login.passwordLabel}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-texto-suave)]" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-[var(--color-borde)] rounded-[var(--radio-chico)] text-sm bg-[var(--color-fondo)] focus:outline-none focus:border-[var(--color-primario)]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full py-2.5 bg-[var(--color-primario)] text-white text-sm font-semibold rounded-[var(--radio-chico)] hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
          >
            {cargando ? t.comun.cargando : t.login.ingresarBtn}
          </button>
        </form>

        {/* Texto obligatorio HU-01 */}
        <p className="text-center text-xs text-[var(--color-texto-suave)] pt-2 border-t border-[var(--color-borde)]">
          {t.login.olvidoPassword}
        </p>
      </div>
    </div>
  );
}
