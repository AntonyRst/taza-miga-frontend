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

      // Normalizar URL: evitar duplicar el prefijo /api si apiUrl termina en /api
      let urlCompleta;
      if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
        urlCompleta = endpoint;
      } else {
        const cleanApiUrl = apiUrl.replace(/\/+$/, '');
        const endpointNormalizado = endpoint.replace(/^\/?api(\/|$)/, '/');
        const rutaFinal = endpointNormalizado.startsWith('/') ? endpointNormalizado : `/${endpointNormalizado}`;
        urlCompleta = `${cleanApiUrl}${rutaFinal}`;
      }

      let respuesta;
      try {
        respuesta = await fetch(urlCompleta, { ...opciones, headers });
      } catch (errRed) {
        // En caso de caída de red o servidor no disponible, retornar objeto compatible seguro
        return {
          ok: false,
          status: 503,
          statusText: 'Service Unavailable',
          json: async () => ({
            error: 'No se pudo conectar con el servidor',
            mensaje: 'No se pudo conectar con el servidor'
          }),
          text: async () => 'No se pudo conectar con el servidor'
        };
      }

      if (respuesta.status === 401) {
        cerrarSesion();
      }

      // Proteger respuesta.text() y respuesta.json() contra errores de HTML o respuestas vacías
      let cuerpoCache = null;
      const originalText = respuesta.text.bind(respuesta);
      respuesta.text = async () => {
        if (cuerpoCache === null) {
          cuerpoCache = await originalText();
        }
        return cuerpoCache;
      };

      let jsonCache = null;
      respuesta.json = async () => {
        if (jsonCache !== null) {
          return jsonCache;
        }
        try {
          const texto = await respuesta.text();
          if (!texto || texto.trim().length === 0) {
            jsonCache = {};
          } else {
            jsonCache = JSON.parse(texto);
          }
        } catch {
          // Si el servidor devolvió HTML (por ejemplo, errores 502/504 de proxies o rutas 404 no capturadas),
          // se retorna un objeto JSON seguro para prevenir un SyntaxError en JSON.parse
          const fallbackMensaje = `Respuesta no válida del servidor (${respuesta.status})`;
          jsonCache = {
            error: fallbackMensaje,
            mensaje: fallbackMensaje
          };
        }
        return jsonCache;
      };

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
