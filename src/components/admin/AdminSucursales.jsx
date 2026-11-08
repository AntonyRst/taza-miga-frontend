import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useIdioma } from '../../context/IdiomaContext.jsx';
import {
  Store,
  Plus,
  Edit2,
  MapPin,
  Users,
  Check,
  X,
  RotateCw,
  AlertCircle,
  QrCode,
  Printer
} from 'lucide-react';
import QrSvg from '../../utils/qrSvg.jsx';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Configuración de iconos de Leaflet para Vite/Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

/**
 * Componente controlador para invalidar el tamaño del mapa y prevenir áreas grises
 * en ventanas modales o contenedores con transiciones (HU-20).
 */
function InvalidadorTamanoMapa() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

/**
 * Controlador de eventos para capturar clics en el mapa y fijar coordenadas.
 */
function SelectorCoordenadas({ posicion, onSeleccionar }) {
  useMapEvents({
    click(e) {
      onSeleccionar(e.latlng.lat, e.latlng.lng);
    }
  });

  return posicion ? <Marker position={posicion} /> : null;
}

export default function AdminSucursales() {
  const { fetchConToken, usuario } = useAuth();
  const { t } = useIdioma();
  const esDueno = usuario?.rol === 'DUENO';

  const [sucursales, setSucursales] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const [mostrarModal, setMostrarModal] = useState(false);
  const [sucursalEditando, setSucursalEditando] = useState(null);
  const [sucursalParaQrs, setSucursalParaQrs] = useState(null);

  const cargarSucursales = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const res = await fetchConToken('/api/admin/sucursales');
      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje || data.error || 'Error al cargar las sucursales');
      setSucursales(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, [fetchConToken]);

  useEffect(() => {
    cargarSucursales();
  }, [cargarSucursales]);

  // Desactivar o activar sucursal (RN-25: no se desactiva con personal activo)
  const handleToggleActiva = async (sucursal) => {
    try {
      const res = await fetchConToken(`/api/admin/sucursales/${sucursal.id}/activa`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activa: !sucursal.activa })
      });
      const datos = await res.json();
      if (!res.ok) throw new Error(datos.mensaje || datos.error || 'Error al actualizar sucursal');
      cargarSucursales();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[var(--color-borde)]">
        <div>
          <h2 className="font-serif font-bold text-xl text-[var(--color-primario)]">
            {t.admin.pestanaSucursales}
          </h2>
          <p className="text-xs text-[var(--color-texto-suave)] mt-0.5">
            Administra sedes del negocio con mapa interactivo Leaflet y control de mesas (HU-20).
          </p>
        </div>

        {esDueno && (
          <button
            onClick={() => {
              setSucursalEditando(null);
              setMostrarModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[var(--color-accion)] hover:bg-[#B88746] text-[#2C1A1D] text-xs font-bold rounded-[var(--radio-chico)] transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>{t.admin.nuevaSucursal}</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-[var(--radio-chico)] text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Lista de sucursales */}
      {cargando ? (
        <div className="py-12 flex justify-center text-[var(--color-texto-suave)]">
          <RotateCw className="w-6 h-6 animate-spin text-[var(--color-accion)]" />
        </div>
      ) : sucursales.length === 0 ? (
        <div className="py-12 text-center text-xs text-[var(--color-texto-suave)] border border-dashed border-[var(--color-borde)] rounded-[var(--radio-chico)]">
          {t.admin.sinSucursales}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sucursales.map((suc) => (
            <div
              key={suc.id}
              className="bg-[var(--color-superficie)] border border-[var(--color-borde)] rounded-[var(--radio-medio)] p-4 flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-[var(--color-accion)]" />
                    <h3 className="font-bold text-sm text-[var(--color-primario)]">
                      {suc.nombre}
                    </h3>
                  </div>
                  {esDueno ? (
                    <button
                      onClick={() => handleToggleActiva(suc)}
                      className={`text-[11px] px-2 py-0.5 rounded-[var(--radio-chico)] font-medium cursor-pointer transition-colors ${
                        suc.activa
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                      }`}
                    >
                      {suc.activa ? 'Activa' : 'Inactiva'}
                    </button>
                  ) : (
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-[var(--radio-chico)] font-medium ${
                        suc.activa
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {suc.activa ? 'Activa' : 'Inactiva'}
                    </span>
                  )}
                </div>

                <p className="text-xs text-[var(--color-texto-suave)] mt-1.5 flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[var(--color-texto-suave)]" />
                  <span>{suc.direccion}</span>
                </p>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[var(--color-texto-suave)] bg-[var(--color-fondo)] p-2.5 rounded-[var(--radio-chico)] border border-[var(--color-borde)]">
                  <div>
                    <span className="block text-[11px] text-[var(--color-texto-suave)]/80">Mesas:</span>
                    <strong className="font-mono text-[var(--color-primario)] text-sm">
                      {suc.cantidadMesas}
                    </strong>
                  </div>
                  <div>
                    <span className="block text-[11px] text-[var(--color-texto-suave)]/80">Personal activo:</span>
                    <strong className="font-mono text-[var(--color-primario)] text-sm flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {suc.personalAsignado}
                    </strong>
                  </div>
                </div>

                {suc.latitud !== null && suc.longitud !== null ? (
                  <p className="text-[11px] text-[var(--color-texto-suave)] font-mono mt-2">
                    GPS: {suc.latitud.toFixed(5)}, {suc.longitud.toFixed(5)}
                  </p>
                ) : (
                  <p className="text-[11px] text-[var(--color-texto-suave)]/70 italic mt-2">
                    Sin coordenadas registradas (dirección manual, RN-25)
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[var(--color-borde)]">
                <button
                  onClick={() => setSucursalParaQrs(suc)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-primario)] hover:text-[var(--color-accion)] transition-colors cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5 text-[var(--color-accion)]" />
                  <span>{t.admin.generarQrsMesas}</span>
                </button>

                {esDueno && (
                  <button
                    onClick={() => {
                      setSucursalEditando(suc);
                      setMostrarModal(true);
                    }}
                    className="flex items-center gap-1 text-xs font-semibold text-[var(--color-accion)] hover:underline cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>{t.admin.editarSucursal}</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Generar QRs de Mesas e Imprimir */}
      {sucursalParaQrs && (
        <ModalQrsMesas
          sucursal={sucursalParaQrs}
          onCerrar={() => setSucursalParaQrs(null)}
        />
      )}

      {/* Modal Crear / Editar Sucursal con Leaflet (HU-20) */}
      {mostrarModal && (
        <ModalSucursalLeaflet
          sucursal={sucursalEditando}
          onCerrar={() => {
            setMostrarModal(false);
            setSucursalEditando(null);
          }}
          onGuardado={() => {
            setMostrarModal(false);
            setSucursalEditando(null);
            cargarSucursales();
          }}
        />
      )}
    </div>
  );
}

// Subcomponente Modal con Mapa Interactivo Leaflet
function ModalSucursalLeaflet({ sucursal, onCerrar, onGuardado }) {
  const { fetchConToken } = useAuth();
  const { t } = useIdioma();

  const [nombre, setNombre] = useState(sucursal?.nombre || '');
  const [direccion, setDireccion] = useState(sucursal?.direccion || '');
  const [telefono, setTelefono] = useState(sucursal?.telefono || '');
  const [cantidadMesas, setCantidadMesas] = useState(sucursal?.cantidadMesas || 10);
  const [latitud, setLatitud] = useState(sucursal?.latitud ?? null);
  const [longitud, setLongitud] = useState(sucursal?.longitud ?? null);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Centro inicial del mapa: San Salvador (13.6929, -89.2182) o coordenadas de la sucursal
  const centroInicial =
    latitud !== null && longitud !== null
      ? [latitud, longitud]
      : [13.6929, -89.2182];

  const handleSeleccionarCoordenadas = (lat, lng) => {
    setLatitud(Number(lat.toFixed(6)));
    setLongitud(Number(lng.toFixed(6)));
  };

  const handleLimpiarCoordenadas = () => {
    setLatitud(null);
    setLongitud(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setGuardando(true);

    try {
      const cuerpo = {
        nombre,
        direccion,
        telefono,
        cantidadMesas: Number(cantidadMesas),
        latitud: latitud !== null ? Number(latitud) : null,
        longitud: longitud !== null ? Number(longitud) : null
      };

      const url = sucursal ? `/api/admin/sucursales/${sucursal.id}` : '/api/admin/sucursales';
      const metodo = sucursal ? 'PUT' : 'POST';

      const res = await fetchConToken(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cuerpo)
      });

      const datos = await res.json();
      if (!res.ok) throw new Error(datos.mensaje || datos.error || 'Error al guardar la sucursal');

      onGuardado();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-[var(--color-superficie)] border border-[var(--color-borde)] rounded-[var(--radio-medio)] p-5 flex flex-col gap-4 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--color-borde)]">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-[var(--color-accion)]" />
            <h3 className="font-serif font-bold text-lg text-[var(--color-primario)]">
              {sucursal ? t.admin.editarSucursal : t.admin.nuevaSucursal}
            </h3>
          </div>
          <button onClick={onCerrar} className="p-1 text-[var(--color-texto-suave)] hover:text-black cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-2.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-[var(--radio-chico)] text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">{t.admin.nombreSucursal}</label>
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Sucursal Santa Elena"
                className="w-full px-2.5 py-1.5 border border-[var(--color-borde)] rounded-[var(--radio-chico)] bg-[var(--color-fondo)]"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">{t.admin.telefonoSucursal}</label>
              <input
                type="text"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="2222-0000"
                className="w-full px-2.5 py-1.5 border border-[var(--color-borde)] rounded-[var(--radio-chico)] bg-[var(--color-fondo)] font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-semibold mb-1">{t.admin.direccionSucursal}</label>
              <input
                type="text"
                required
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                placeholder="Calle o avenida principal, local..."
                className="w-full px-2.5 py-1.5 border border-[var(--color-borde)] rounded-[var(--radio-chico)] bg-[var(--color-fondo)]"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">{t.admin.mesasSucursal}</label>
              <input
                type="number"
                required
                min={1}
                value={cantidadMesas}
                onChange={(e) => setCantidadMesas(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-[var(--color-borde)] rounded-[var(--radio-chico)] bg-[var(--color-fondo)] font-mono"
              />
            </div>
          </div>

          {/* Sección de Mapa Interactivo con Leaflet (HU-20) */}
          <div className="space-y-2 pt-2 border-t border-[var(--color-borde)]">
            <div className="flex items-center justify-between">
              <label className="font-bold text-[var(--color-primario)] flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[var(--color-accion)]" />
                <span>{t.admin.mapaUbicacion}</span>
              </label>

              {latitud !== null && longitud !== null && (
                <button
                  type="button"
                  onClick={handleLimpiarCoordenadas}
                  className="text-[11px] text-rose-600 hover:underline cursor-pointer"
                >
                  Quitar marcador (guardar sin coordenadas, RN-25)
                </button>
              )}
            </div>

            <p className="text-[11px] text-[var(--color-texto-suave)]">
              {t.admin.tocarMapaParaFijar}
            </p>

            {/* Contenedor del mapa con invalidateSize garantizando CERO áreas grises */}
            <div className="h-64 w-full rounded-[var(--radio-chico)] overflow-hidden border border-[var(--color-borde)] relative z-10">
              <MapContainer
                center={centroInicial}
                zoom={14}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <InvalidadorTamanoMapa />
                <SelectorCoordenadas
                  posicion={latitud !== null && longitud !== null ? [latitud, longitud] : null}
                  onSeleccionar={handleSeleccionarCoordenadas}
                />
              </MapContainer>
            </div>

            {/* Visualización de coordenadas */}
            <div className="flex items-center gap-3 text-[11px] text-[var(--color-texto-suave)] font-mono bg-[var(--color-fondo)] p-2 rounded-[var(--radio-chico)] border border-[var(--color-borde)]">
              <span>Lat: <strong>{latitud !== null ? latitud : '—'}</strong></span>
              <span>Lng: <strong>{longitud !== null ? longitud : '—'}</strong></span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[var(--color-borde)]">
            <button
              type="button"
              onClick={onCerrar}
              className="px-3 py-1.5 border border-[var(--color-borde)] rounded-[var(--radio-chico)]"
            >
              {t.kds.cerrar}
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="px-4 py-1.5 bg-[var(--color-accion)] hover:bg-[#B88746] text-[#2C1A1D] font-bold rounded-[var(--radio-chico)] cursor-pointer disabled:opacity-50"
            >
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Subcomponente Modal para Generar e Imprimir Códigos QR de Mesas
function ModalQrsMesas({ sucursal, onCerrar }) {
  const { fetchConToken } = useAuth();
  const { t } = useIdioma();
  const [mesas, setMesas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function cargarQrs() {
      try {
        setCargando(true);
        setError(null);
        const res = await fetchConToken(`/api/admin/sucursales/${sucursal.id}/mesas-qr`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || data.mensaje || 'Error al cargar QRs de mesas');
        setMesas(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setCargando(false);
      }
    }
    cargarQrs();
  }, [sucursal.id, fetchConToken]);

  const handleImprimir = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Estilos para impresión @media print */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #area-impresion-qrs, #area-impresion-qrs * {
            visibility: visible !important;
          }
          #area-impresion-qrs {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            background: white !important;
            padding: 10mm !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            z-index: 999999 !important;
          }
          .no-print {
            display: none !important;
          }
          .cuadricula-print {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 6mm !important;
            page-break-inside: auto !important;
          }
          .tarjeta-mesa-print {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            border: 1.5px dashed #666 !important;
            background: white !important;
            color: #2C1A1D !important;
            padding: 6mm !important;
            border-radius: 8px !important;
            text-align: center !important;
          }
        }
      `}</style>

      {/* Fondo oscuro para visualización en pantalla */}
      <div
        onClick={onCerrar}
        className="fixed inset-0 bg-black/60 backdrop-blur-2xs transition-opacity no-print"
        aria-hidden="true"
      />

      {/* Ventana modal / Área imprimible */}
      <div
        id="area-impresion-qrs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-qrs-modal"
        className="relative w-full max-w-4xl max-h-[90vh] bg-[var(--color-superficie)] border border-[var(--color-borde)] rounded-[var(--radio-medio)] shadow-2xl p-5 sm:p-6 my-6 z-10 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
      >
        {/* Cabecera del modal (en pantalla) */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[var(--color-borde)] pb-3.5 no-print">
          <div>
            <div className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-[var(--color-accion)] shrink-0" />
              <h2
                id="titulo-qrs-modal"
                className="text-base sm:text-lg font-serif font-bold text-[var(--color-primario)]"
              >
                {t.admin.tituloModalQrs} — {sucursal.nombre}
              </h2>
            </div>
            <p className="text-xs text-[var(--color-texto-suave)] mt-0.5">
              {t.admin.subtituloModalQrs}
            </p>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={handleImprimir}
              disabled={cargando || mesas.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[var(--color-accion)] hover:bg-[#B88746] text-[#2C1A1D] text-xs font-bold rounded-[var(--radio-chico)] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Printer className="w-4 h-4" />
              <span>{t.admin.imprimirQrs}</span>
            </button>

            <button
              onClick={onCerrar}
              className="p-1.5 text-[var(--color-texto-suave)] hover:text-[var(--color-primario)] hover:bg-[var(--color-fondo)] rounded-[var(--radio-chico)] transition-colors cursor-pointer"
              aria-label={t.comun.cerrar}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Título simple visible solo al imprimir en papel */}
        <div className="hidden print:block text-center border-b pb-3 mb-2">
          <h1 className="text-xl font-serif font-bold text-[#2C1A1D]">
            {sucursal.nombre}
          </h1>
          <p className="text-xs text-stone-600 mt-0.5">
            {t.admin.tituloModalQrs} — Taza & Miga
          </p>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-[var(--radio-chico)] text-xs flex items-center gap-2 no-print">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Contenido con scroll en pantalla */}
        <div className="flex-1 overflow-y-auto pr-1">
          {cargando ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2 text-xs text-[var(--color-texto-suave)]">
              <RotateCw className="w-6 h-6 animate-spin text-[var(--color-accion)]" />
              <span>{t.admin.cargandoQrs}</span>
            </div>
          ) : mesas.length === 0 ? (
            <div className="py-12 text-center text-xs text-[var(--color-texto-suave)] border border-dashed border-[var(--color-borde)] rounded-[var(--radio-chico)]">
              {t.admin.sinMesasRegistradas}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 cuadricula-print">
              {mesas.map((m) => (
                <div
                  key={m.mesa}
                  className="tarjeta-mesa-print bg-[var(--color-fondo)] border border-[var(--color-borde)] rounded-[var(--radio-medio)] p-4 flex flex-col items-center justify-between text-center gap-3 transition-shadow"
                >
                  {/* Encabezado de la tarjeta */}
                  <div className="w-full flex items-center justify-between border-b border-[var(--color-borde)]/60 pb-2 text-[11px] text-[var(--color-texto-suave)] font-medium">
                    <span className="flex items-center gap-1 truncate">
                      <Store className="w-3.5 h-3.5 text-[var(--color-accion)] shrink-0" />
                      <span className="truncate">{sucursal.nombre}</span>
                    </span>
                    <span className="text-[10px] uppercase tracking-wider font-mono bg-[var(--color-superficie)] px-1.5 py-0.5 rounded border border-[var(--color-borde)]">
                      Taza & Miga
                    </span>
                  </div>

                  {/* Número de mesa */}
                  <div className="pt-1">
                    <h3 className="font-serif font-bold text-lg text-[var(--color-primario)]">
                      {t.admin.mesaNumero}{m.mesa}
                    </h3>
                  </div>

                  {/* Gráfico del código QR vectorial en SVG */}
                  <div className="p-2.5 bg-white rounded-[var(--radio-chico)] border border-stone-200 shadow-2xs flex items-center justify-center">
                    <QrSvg valor={m.url} tamano={140} />
                  </div>

                  {/* Instrucción para el cliente */}
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-[var(--color-primario)]">
                      {t.admin.escanearParaOrdenar}
                    </p>
                    <p className="text-[10px] text-[var(--color-texto-suave)] font-mono truncate max-w-[200px]">
                      Token: {m.token.slice(0, 10)}...{m.token.slice(-6)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
