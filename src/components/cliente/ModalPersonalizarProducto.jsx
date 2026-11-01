import { useState, useMemo, useEffect } from 'react';
import { useIdioma } from '../../context/IdiomaContext.jsx';
import { X, Plus, Minus, Check, Image as ImageIcon, AlertCircle } from 'lucide-react';

export default function ModalPersonalizarProducto({ producto, onCerrar, onAgregar }) {
  const { t, idioma } = useIdioma();

  // Inicializar selecciones predeterminadas de los grupos de opciones (HU-07)
  const seleccionesIniciales = useMemo(() => {
    if (!producto || !producto.grupos) return {};
    const inicial = {};

    producto.grupos.forEach((grupo) => {
      if (grupo.tipoSeleccion === 'UNICA') {
        const pred = grupo.opciones.find((op) => op.esPredeterminada);
        inicial[grupo.id] = pred ? pred.id : null;
      } else {
        // MULTIPLE
        const preds = grupo.opciones.filter((op) => op.esPredeterminada).map((op) => op.id);
        inicial[grupo.id] = preds;
      }
    });

    return inicial;
  }, [producto]);

  const [selecciones, setSelecciones] = useState(seleccionesIniciales);
  const [instrucciones, setInstrucciones] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [errorValidacion, setErrorValidacion] = useState(null);

  // Reiniciar estado si cambia el producto
  useEffect(() => {
    setSelecciones(seleccionesIniciales);
    setInstrucciones('');
    setCantidad(1);
    setErrorValidacion(null);
  }, [seleccionesIniciales]);

  if (!producto) return null;

  const nombreProducto = idioma === 'en' ? producto.nombreEn : producto.nombreEs;
  const descripcionProducto = idioma === 'en' ? producto.descripcionEn : producto.descripcionEs;

  // Manejar selección de una opción en grupo UNICA
  const handleSeleccionarUnica = (grupoId, opcionId) => {
    setSelecciones((prev) => ({
      ...prev,
      [grupoId]: opcionId
    }));
    setErrorValidacion(null);
  };

  // Manejar selección/deselección de una opción en grupo MULTIPLE
  const handleToggleMultiple = (grupoId, opcionId) => {
    setSelecciones((prev) => {
      const actuales = prev[grupoId] || [];
      const existe = actuales.includes(opcionId);
      const actualizados = existe
        ? actuales.filter((id) => id !== opcionId)
        : [...actuales, opcionId];
      return {
        ...prev,
        [grupoId]: actualizados
      };
    });
    setErrorValidacion(null);
  };

  // Validar si todos los grupos obligatorios tienen al menos una opción elegida (RN-13)
  const gruposFaltantes = useMemo(() => {
    if (!producto.grupos) return [];
    return producto.grupos.filter((grupo) => {
      if (!grupo.obligatorio) return false;
      const seleccion = selecciones[grupo.id];
      if (grupo.tipoSeleccion === 'UNICA') {
        return !seleccion;
      } else {
        return !seleccion || seleccion.length === 0;
      }
    });
  }, [producto.grupos, selecciones]);

  const esValido = gruposFaltantes.length === 0;

  // Lista plana de objetos de opciones seleccionadas
  const opcionesElegidas = useMemo(() => {
    if (!producto.grupos) return [];
    const lista = [];

    producto.grupos.forEach((grupo) => {
      const seleccion = selecciones[grupo.id];
      if (!seleccion) return;

      if (grupo.tipoSeleccion === 'UNICA') {
        const op = grupo.opciones.find((o) => o.id === seleccion);
        if (op) {
          lista.push({
            id: op.id,
            grupoId: grupo.id,
            nombreEs: op.nombreEs,
            nombreEn: op.nombreEn,
            precioExtra: op.precioExtra,
            grupoNombreEs: grupo.nombreEs,
            grupoNombreEn: grupo.nombreEn
          });
        }
      } else if (Array.isArray(seleccion)) {
        seleccion.forEach((opId) => {
          const op = grupo.opciones.find((o) => o.id === opId);
          if (op) {
            lista.push({
              id: op.id,
              grupoId: grupo.id,
              nombreEs: op.nombreEs,
              nombreEn: op.nombreEn,
              precioExtra: op.precioExtra,
              grupoNombreEs: grupo.nombreEs,
              grupoNombreEn: grupo.nombreEn
            });
          }
        });
      }
    });

    return lista;
  }, [producto.grupos, selecciones]);

  // Cálculo en centavos enteros: (precioBase + suma(extras)) * cantidad (RN-28)
  const calculosPrecio = useMemo(() => {
    const baseCentavos = Math.round(Number(producto.precio) * 100);
    const extrasCentavos = opcionesElegidas.reduce(
      (acc, op) => acc + Math.round(Number(op.precioExtra || 0) * 100),
      0
    );
    const unitarioCentavos = baseCentavos + extrasCentavos;
    const totalCentavos = unitarioCentavos * cantidad;

    return {
      precioUnitario: unitarioCentavos / 100,
      total: totalCentavos / 100
    };
  }, [producto.precio, opcionesElegidas, cantidad]);

  const handleConfirmar = () => {
    if (!esValido) {
      setErrorValidacion(t.catalogo.seleccionarOpcionObligatoria);
      return;
    }

    onAgregar({
      producto,
      opciones: opcionesElegidas,
      instrucciones: instrucciones.trim().slice(0, 255),
      cantidad
    });

    onCerrar();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div
        className="relative w-full max-w-lg bg-[var(--color-superficie)] border border-[var(--color-borde)] rounded-[var(--radio-medio)] shadow-lg flex flex-col max-h-[90vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-personalizar"
      >
        {/* Encabezado del modal */}
        <div className="relative p-4 sm:p-5 border-b border-[var(--color-borde)] flex items-start justify-between gap-4">
          <div className="pr-6">
            <h2
              id="titulo-personalizar"
              className="text-lg font-serif font-bold text-[var(--color-primario)]"
            >
              {nombreProducto}
            </h2>
            <p className="text-xs font-mono font-semibold text-[var(--color-texto-suave)] mt-0.5">
              {t.catalogo.precioBase}: ${Number(producto.precio).toFixed(2)}
            </p>
          </div>
          <button
            onClick={onCerrar}
            className="p-1.5 text-[var(--color-texto-suave)] hover:text-[var(--color-primario)] hover:bg-[var(--color-fondo)] rounded-[var(--radio-chico)] transition-colors cursor-pointer"
            aria-label={t.comun.cerrar}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido con scroll */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-[var(--color-texto)]">
          {/* Imagen y descripción */}
          {producto.imagenUrl ? (
            <img
              src={producto.imagenUrl}
              alt={nombreProducto}
              className="w-full h-44 object-cover rounded-[var(--radio-chico)] border border-[var(--color-borde)]"
            />
          ) : (
            <div className="w-full h-28 bg-[var(--color-fondo)] rounded-[var(--radio-chico)] border border-[var(--color-borde)] flex items-center justify-center text-[var(--color-texto-suave)]">
              <ImageIcon className="w-8 h-8 opacity-40" />
            </div>
          )}

          {descripcionProducto && (
            <p className="text-xs text-[var(--color-texto-suave)] leading-relaxed">
              {descripcionProducto}
            </p>
          )}

          {/* Error de validación de campos obligatorios */}
          {errorValidacion && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-[var(--radio-chico)] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorValidacion}</span>
            </div>
          )}

          {/* Grupos de personalización (HU-07) */}
          {producto.grupos && producto.grupos.length > 0 && (
            <div className="space-y-5">
              {producto.grupos.map((grupo) => {
                const nombreGrupo = idioma === 'en' ? grupo.nombreEn : grupo.nombreEs;
                const esUnica = grupo.tipoSeleccion === 'UNICA';
                const seleccionActual = selecciones[grupo.id];

                return (
                  <div
                    key={grupo.id}
                    className="p-3.5 bg-[var(--color-fondo)] border border-[var(--color-borde)] rounded-[var(--radio-chico)]"
                  >
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-serif font-bold text-[var(--color-primario)]">
                          {nombreGrupo}
                        </span>
                        {grupo.obligatorio ? (
                          <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded">
                            {t.catalogo.obligatorio}
                          </span>
                        ) : (
                          <span className="text-[10px] text-[var(--color-texto-suave)]">
                            {t.catalogo.opcional}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-[var(--color-texto-suave)]">
                        {esUnica ? t.catalogo.seleccionaUna : t.catalogo.seleccionaVarias}
                      </span>
                    </div>

                    {/* Opciones del grupo */}
                    <div className="space-y-1.5">
                      {grupo.opciones.map((opcion) => {
                        const nombreOpcion = idioma === 'en' ? opcion.nombreEn : opcion.nombreEs;
                        const seleccionada = esUnica
                          ? seleccionActual === opcion.id
                          : Array.isArray(seleccionActual) && seleccionActual.includes(opcion.id);
                        const tienePrecioExtra = Number(opcion.precioExtra) > 0;

                        return (
                          <button
                            key={opcion.id}
                            type="button"
                            onClick={() =>
                              esUnica
                                ? handleSeleccionarUnica(grupo.id, opcion.id)
                                : handleToggleMultiple(grupo.id, opcion.id)
                            }
                            className={`w-full flex items-center justify-between p-2.5 rounded-[var(--radio-chico)] border text-xs text-left transition-colors cursor-pointer ${
                              seleccionada
                                ? 'bg-[var(--color-superficie)] border-[var(--color-accion)] text-[var(--color-primario)] font-semibold shadow-2xs'
                                : 'bg-[var(--color-superficie)] border-[var(--color-borde)] text-[var(--color-texto)] hover:border-[var(--color-texto-suave)]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              {/* Casilla o radio visual */}
                              <div
                                className={`w-4 h-4 flex items-center justify-center border transition-colors ${
                                  esUnica ? 'rounded-full' : 'rounded-[3px]'
                                } ${
                                  seleccionada
                                    ? 'bg-[var(--color-accion)] border-[var(--color-accion)] text-white'
                                    : 'border-[var(--color-borde)] bg-white'
                                }`}
                              >
                                {seleccionada && (
                                  <Check className="w-3 h-3 stroke-[3]" />
                                )}
                              </div>
                              <span>{nombreOpcion}</span>
                            </div>

                            {tienePrecioExtra && (
                              <span className="font-mono text-xs text-[var(--color-texto-suave)]">
                                +${Number(opcion.precioExtra).toFixed(2)}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Instrucciones especiales (máx 255 caracteres, HU-07) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="instrucciones-especiales"
                className="text-xs font-serif font-bold text-[var(--color-primario)]"
              >
                {t.catalogo.instruccionesEspeciales}
              </label>
              <span className="text-[10px] font-mono text-[var(--color-texto-suave)]">
                {instrucciones.length}/255
              </span>
            </div>
            <textarea
              id="instrucciones-especiales"
              value={instrucciones}
              onChange={(e) => setInstrucciones(e.target.value.slice(0, 255))}
              placeholder={t.catalogo.instruccionesPlaceholder}
              rows={2}
              className="w-full p-2.5 bg-[var(--color-fondo)] border border-[var(--color-borde)] rounded-[var(--radio-chico)] text-xs focus:outline-none focus:border-[var(--color-accion)] resize-none"
            />
          </div>
        </div>

        {/* Barra inferior fija con cantidad y botón reactivo (docs/diseno.md, RN-28) */}
        <div className="p-4 sm:p-5 border-t border-[var(--color-borde)] bg-[var(--color-superficie)] flex items-center justify-between gap-3 shrink-0">
          {/* Selector de cantidad de 1 a 20 (RN-18) */}
          <div className="flex items-center border border-[var(--color-borde)] rounded-[var(--radio-chico)] bg-[var(--color-fondo)]">
            <button
              type="button"
              onClick={() => setCantidad((prev) => Math.max(1, prev - 1))}
              disabled={cantidad <= 1}
              className="p-2 text-[var(--color-texto-suave)] hover:text-[var(--color-primario)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
              aria-label="Disminuir cantidad"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-8 text-center text-xs font-mono font-bold text-[var(--color-primario)] tabular-nums">
              {cantidad}
            </span>
            <button
              type="button"
              onClick={() => setCantidad((prev) => Math.min(20, prev + 1))}
              disabled={cantidad >= 20}
              className="p-2 text-[var(--color-texto-suave)] hover:text-[var(--color-primario)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
              aria-label="Aumentar cantidad"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Botón principal Agregar al pedido (RN-28) */}
          <button
            type="button"
            onClick={handleConfirmar}
            disabled={!esValido}
            className="flex-1 py-2.5 px-4 bg-[var(--color-accion)] text-white text-xs font-semibold rounded-[var(--radio-chico)] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-opacity flex items-center justify-center gap-2 shadow-xs"
          >
            <span>{t.catalogo.agregarAlPedido}</span>
            <span className="font-mono font-bold tracking-tight">
              — ${calculosPrecio.total.toFixed(2)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
