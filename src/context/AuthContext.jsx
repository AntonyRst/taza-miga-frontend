import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext();

/**
 * Decodifica el payload de un token JWT sin librerías externas.
 */
function decodificarToken(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token_personal') || null);
  const [usuario, setUsuario] = useState(() => {
    const guardado = localStorage.getItem('token_personal');
    return guardado ? decodificarToken(guardado) : null;
  });

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  const iniciarSesion = (nuevoToken) => {
    localStorage.setItem('token_personal', nuevoToken);
    setToken(nuevoToken);
    setUsuario(decodificarToken(nuevoToken));
  };

  const cerrarSesion = useCallback(() => {
    localStorage.removeItem('token_personal');
    setToken(null);
    setUsuario(null);
  }, []);

  // Verificar si el token expiró
  useEffect(() => {
    if (usuario?.exp) {
      const ahora = Math.floor(Date.now() / 1000);
      if (usuario.exp < ahora) {
        cerrarSesion();
      }
    }
  }, [usuario, cerrarSesion]);

  /**
   * Petición autenticada con JWT
   */
  const fetchConToken = useCallback(
    async (endpoint, opciones = {}) => {
      const headers = {
        'Content-Type': 'application/json',
        ...(opciones.headers || {})
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const urlCompleta = endpoint.startsWith('http') ? endpoint : `${apiUrl}${endpoint}`;
      const respuesta = await fetch(urlCompleta, { ...opciones, headers });

      if (respuesta.status === 401) {
        cerrarSesion();
      }

      return respuesta;
    },
    [token, apiUrl, cerrarSesion]
  );

  return (
    <AuthContext.Provider
      value={{
        usuario,
        token,
        apiUrl,
        iniciarSesion,
        cerrarSesion,
        fetchConToken
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}
