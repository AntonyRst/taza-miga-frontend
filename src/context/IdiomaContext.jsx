import { createContext, useContext, useState, useEffect } from 'react';
import { es } from '../i18n/es.js';
import { en } from '../i18n/en.js';

const diccionarios = { es, en };

const IdiomaContext = createContext();

export function IdiomaProvider({ children }) {
  const [idioma, setIdioma] = useState(() => {
    return localStorage.getItem('idioma') || 'es';
  });

  useEffect(() => {
    localStorage.setItem('idioma', idioma);
    document.documentElement.lang = idioma;
  }, [idioma]);

  const cambiarIdioma = (nuevoIdioma) => {
    if (diccionarios[nuevoIdioma]) {
      setIdioma(nuevoIdioma);
    }
  };

  const t = diccionarios[idioma] || es;

  return (
    <IdiomaContext.Provider value={{ idioma, cambiarIdioma, t }}>
      {children}
    </IdiomaContext.Provider>
  );
}

export function useIdioma() {
  const context = useContext(IdiomaContext);
  if (!context) {
    throw new Error('useIdioma debe usarse dentro de un IdiomaProvider');
  }
  return context;
}
