import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { IdiomaProvider } from './context/IdiomaContext.jsx';
import { CarritoProvider } from './context/CarritoContext.jsx';

import Catalogo from './pages/Catalogo.jsx';
import Seguimiento from './pages/Seguimiento.jsx';
import StaffAccess from './pages/StaffAccess.jsx';
import Kds from './pages/Kds.jsx';
import Admin from './pages/Admin.jsx';
import ModalCambiarPassword from './components/ModalCambiarPassword.jsx';

/**
 * Componente para proteger rutas según autenticación y rol (RN-03, HU-02).
 */
function RutaProtegida({ children, rolesPermitidos = [] }) {
  const { usuario } = useAuth();

  // Sin sesión, redirige al login del personal (HU-02)
  if (!usuario) {
    return <Navigate to="/staff-access" replace />;
  }

  // Si el rol no está permitido, redirige al panel correspondiente (HU-02)
  if (rolesPermitidos.length > 0 && !rolesPermitidos.includes(usuario.rol)) {
    if (usuario.rol === 'BARISTA') {
      return <Navigate to="/kds" replace />;
    }
    return <Navigate to="/admin" replace />;
  }

  // RN-09: Si tiene contraseña temporal activa, forzar modal de cambio de contraseña
  if (usuario.debe_cambiar_password) {
    return (
      <div className="relative">
        <ModalCambiarPassword obligatorio={true} />
        <div className="pointer-events-none opacity-20 filter blur-xs">
          {children}
        </div>
      </div>
    );
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <IdiomaProvider>
        <AuthProvider>
          <CarritoProvider>
            <Routes>
              {/* Rutas Públicas */}
              <Route path="/" element={<Catalogo />} />
              <Route path="/order/:codigo" element={<Seguimiento />} />
              <Route path="/staff-access" element={<StaffAccess />} />

              {/* Rutas Protegidas del Personal */}
              <Route
                path="/kds"
                element={
                  <RutaProtegida rolesPermitidos={['BARISTA', 'GERENTE', 'DUENO']}>
                    <Kds />
                  </RutaProtegida>
                }
              />
              <Route
                path="/admin"
                element={
                  <RutaProtegida rolesPermitidos={['GERENTE', 'DUENO']}>
                    <Admin />
                  </RutaProtegida>
                }
              />

              {/* Redirección por defecto */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </CarritoProvider>
        </AuthProvider>
      </IdiomaProvider>
    </BrowserRouter>
  );
}
