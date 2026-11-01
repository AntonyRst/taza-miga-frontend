import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

const CarritoContext = createContext();

const CLAVE_LOCAL_STORAGE = 'taza_miga_carrito';

/**
 * Genera un identificador único y determinista para una combinación de producto,
 * opciones seleccionadas e instrucciones (HU-08: cada combinación distinta es una línea).
 */
function generarLineaId(productoId, opciones = [], instrucciones = '') {
  const idsOpciones = opciones
    .map((op) => op.id)
    .sort((a, b) => a - b)
    .join('-');
  const instLimpia = (instrucciones || '').trim().toLowerCase();
  return `${productoId}__${idsOpciones}__${instLimpia}`;
}

export function CarritoProvider({ children }) {
  const [lineas, setLineas] = useState(() => {
    try {
      const guardado = localStorage.getItem(CLAVE_LOCAL_STORAGE);
      if (guardado) {
        const parseado = JSON.parse(guardado);
        if (Array.isArray(parseado)) {
          return parseado;
        }
      }
    } catch (e) {
      console.error('Error al leer el carrito de localStorage:', e);
    }
    return [];
  });

  // Persistir en localStorage cada vez que cambien las líneas (HU-08)
  useEffect(() => {
    try {
      localStorage.setItem(CLAVE_LOCAL_STORAGE, JSON.stringify(lineas));
    } catch (e) {
      console.error('Error al persistir el carrito en localStorage:', e);
    }
  }, [lineas]);

  /**
   * Agrega un producto con sus opciones seleccionadas al carrito (HU-07, HU-08).
   * Si la misma combinación ya existe, incrementa la cantidad sin exceder 20 (RN-18).
   */
  const agregarAlCarrito = useCallback(({ producto, opciones = [], instrucciones = '', cantidad = 1 }) => {
    const cantValida = Math.min(20, Math.max(1, Number(cantidad) || 1)); // RN-18
    const lineaId = generarLineaId(producto.id, opciones, instrucciones);
    const textoInstrucciones = (instrucciones || '').trim().slice(0, 255); // RN-18 / HU-07

    setLineas((prevLineas) => {
      const indiceExistente = prevLineas.findIndex((l) => l.id === lineaId);

      if (indiceExistente >= 0) {
        // La misma combinación existe: sumamos cantidad hasta 20
        const copia = [...prevLineas];
        const cantActual = copia[indiceExistente].cantidad;
        copia[indiceExistente] = {
          ...copia[indiceExistente],
          cantidad: Math.min(20, cantActual + cantValida)
        };
        return copia;
      }

      // Nueva combinación: agregar como nueva línea
      const nuevaLinea = {
        id: lineaId,
        productoId: producto.id,
        producto: {
          id: producto.id,
          nombreEs: producto.nombreEs,
          nombreEn: producto.nombreEn,
          precio: Number(producto.precio),
          imagenUrl: producto.imagenUrl,
          disponible: producto.disponible !== false
        },
        opciones: opciones.map((op) => ({
          id: op.id,
          grupoId: op.grupoId,
          nombreEs: op.nombreEs,
          nombreEn: op.nombreEn,
          precioExtra: Number(op.precioExtra || 0)
        })),
        instrucciones: textoInstrucciones,
        cantidad: cantValida
      };

      return [...prevLineas, nuevaLinea];
    });
  }, []);

  /**
   * Actualiza la cantidad de una línea específica (1 a 20).
   * Si la cantidad es menor a 1, se remueve la línea (HU-08).
   */
  const actualizarCantidad = useCallback((lineaId, nuevaCantidad) => {
    const cant = Number(nuevaCantidad);
    if (cant <= 0) {
      eliminarLinea(lineaId);
      return;
    }

    const cantClampeada = Math.min(20, Math.max(1, cant)); // RN-18
    setLineas((prev) =>
      prev.map((l) => (l.id === lineaId ? { ...l, cantidad: cantClampeada } : l))
    );
  }, []);

  /**
   * Elimina una línea individual del carrito (HU-08).
   */
  const eliminarLinea = useCallback((lineaId) => {
    setLineas((prev) => prev.filter((l) => l.id !== lineaId));
  }, []);

  /**
   * Vacía por completo el carrito (HU-08).
   */
  const vaciarCarrito = useCallback(() => {
    setLineas([]);
    try {
      localStorage.removeItem(CLAVE_LOCAL_STORAGE);
    } catch (e) {
      console.error('Error al limpiar localStorage del carrito:', e);
    }
  }, []);

  /**
   * Sincroniza la disponibilidad de los productos del carrito con el catálogo activo
   * para alertar al cliente si un producto pasó a no disponible (RN-14).
   */
  const sincronizarDisponibilidad = useCallback((productosCatalogo = []) => {
    if (!productosCatalogo || productosCatalogo.length === 0) return;

    setLineas((prev) =>
      prev.map((linea) => {
        const prodEnCatalogo = productosCatalogo.find((p) => p.id === linea.productoId);
        if (prodEnCatalogo) {
          const disponibleActual = Boolean(prodEnCatalogo.disponible);
          if (linea.producto.disponible !== disponibleActual) {
            return {
              ...linea,
              producto: { ...linea.producto, disponible: disponibleActual }
            };
          }
        }
        return linea;
      })
    );
  }, []);

  // Cálculos reactivos de montos y totales (RN-28, RN-29)
  // Calculado en centavos enteros para evitar errores de redondeo de punto flotante
  const totales = useMemo(() => {
    let centavosTotales = 0;
    let totalArticulos = 0;
    let hayNoDisponibles = false;

    const lineasConCalculos = lineas.map((linea) => {
      if (linea.producto.disponible === false) {
        hayNoDisponibles = true;
      }

      const precioBaseCentavos = Math.round(Number(linea.producto.precio) * 100);
      const extrasCentavos = linea.opciones.reduce(
        (acc, op) => acc + Math.round(Number(op.precioExtra || 0) * 100),
        0
      );
      const precioUnitarioCentavos = precioBaseCentavos + extrasCentavos;
      const subtotalCentavos = precioUnitarioCentavos * linea.cantidad;

      centavosTotales += subtotalCentavos;
      totalArticulos += linea.cantidad;

      return {
        ...linea,
        precioUnitario: precioUnitarioCentavos / 100,
        subtotal: subtotalCentavos / 100
      };
    });

    return {
      lineas: lineasConCalculos,
      totalArticulos,
      total: centavosTotales / 100,
      hayNoDisponibles
    };
  }, [lineas]);

  const valor = {
    lineas: totales.lineas,
    totalArticulos: totales.totalArticulos,
    total: totales.total,
    hayNoDisponibles: totales.hayNoDisponibles,
    agregarAlCarrito,
    actualizarCantidad,
    eliminarLinea,
    vaciarCarrito,
    sincronizarDisponibilidad
  };

  return <CarritoContext.Provider value={valor}>{children}</CarritoContext.Provider>;
}

export function useCarrito() {
  const context = useContext(CarritoContext);
  if (!context) {
    throw new Error('useCarrito debe ser usado dentro de un CarritoProvider');
  }
  return context;
}
