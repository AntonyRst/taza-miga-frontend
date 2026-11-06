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
  AlertCircle
} from 'lucide-react';
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
  const { fetchConToken } = useAuth();
  const { t } = useIdioma();

  const [sucursales, setSucursales] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const [mostrarModal, setMostrarModal] = useState(false);
  const [sucursalEditando, setSucursalEditando] = useState(null);

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
              className="bg-[var(--color-superficie)] border border-[var(--color-borde)] rounded-[var(--radio-medio)] p-4 flex flex-col justify-between gap-3 shadow-xs"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-[var(--color-accion)]" />
                    <h3 className="font-bold text-sm text-[var(--color-primario)]">
                      {suc.nombre}
                    </h3>
                  </div>
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

              <div className="flex justify-end pt-2 border-t border-[var(--color-borde)]">
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
              </div>
            </div>
          ))}
        </div>
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
      <div className="w-full max-w-2xl bg-[var(--color-superficie)] border border-[var(--color-borde)] rounded-[var(--radio-medio)] shadow-2xl p-5 flex flex-col gap-4 max-h-[92vh] overflow-y-auto">
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
