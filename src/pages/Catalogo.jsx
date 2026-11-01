import { useState } from 'react';
import { useIdioma } from '../context/IdiomaContext.jsx';
import { Coffee, ShoppingBag, Globe, Search } from 'lucide-react';

export default function Catalogo() {
  const { t, idioma, cambiarIdioma } = useIdioma();
  const [busqueda, setBusqueda] = useState('');

  return (
    <div className="min-h-screen bg-[var(--color-fondo)] text-[var(--color-texto)] flex flex-col">
      {/* Encabezado */}
      <header className="sticky top-0 z-30 bg-[var(--color-superficie)] border-b border-[var(--color-borde)] px-4 py-3 sm:px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coffee className="w-6 h-6 text-[var(--color-accion)]" />
            <h1 className="text-xl font-serif font-bold text-[var(--color-primario)] tracking-tight">
              {t.comun.nombreApp}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Selector de idioma ES / EN */}
            <button
              onClick={() => cambiarIdioma(idioma === 'es' ? 'en' : 'es')}
              className="flex items-center gap-1.5 px-2.5 py-1 text-sm border border-[var(--color-borde)] rounded-[var(--radio-chico)] hover:bg-[var(--color-fondo)] transition-colors cursor-pointer"
              title="Cambiar idioma / Change language"
            >
              <Globe className="w-4 h-4 text-[var(--color-texto-suave)]" />
              <span className="font-semibold text-xs uppercase">{idioma}</span>
            </button>

            {/* Botón Carrito */}
            <button className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-primario)] text-white text-sm font-medium rounded-[var(--radio-chico)] hover:opacity-90 transition-opacity cursor-pointer">
              <ShoppingBag className="w-4 h-4" />
              <span>0</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero directo y sobrio */}
      <section className="bg-[var(--color-fondo)] border-b border-[var(--color-borde)] px-4 py-6 sm:px-6 text-center">
        <div className="max-w-xl mx-auto">
          <p className="text-base sm:text-lg text-[var(--color-texto-suave)] font-medium">
            {t.catalogo.subtitulo}
          </p>
        </div>
      </section>

      {/* Búsqueda y Filtros */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-6">
        <div className="relative max-w-md mx-auto">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-texto-suave)]" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder={t.catalogo.buscarPlaceholder}
            className="w-full pl-10 pr-4 py-2 border border-[var(--color-borde)] rounded-[var(--radio-chico)] bg-[var(--color-superficie)] text-sm focus:outline-none focus:border-[var(--color-primario)]"
          />
        </div>

        {/* Estado inicial / vacío */}
        <div className="text-center py-12 px-4 border border-dashed border-[var(--color-borde)] rounded-[var(--radio-medio)] bg-[var(--color-superficie)]">
          <Coffee className="w-12 h-12 mx-auto text-[var(--color-texto-suave)] mb-3 opacity-60" />
          <h3 className="text-base font-serif font-bold text-[var(--color-primario)]">
            {t.catalogo.todasLasCategorias}
          </h3>
          <p className="text-sm text-[var(--color-texto-suave)] mt-1">
            {t.catalogo.sinProductos}
          </p>
        </div>
      </main>
    </div>
  );
}
