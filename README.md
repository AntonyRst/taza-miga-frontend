# Frontend — Taza & Miga Web App

> Interfaz web moderna para clientes y personal, desarrollada en React 19 con Vite, Tailwind CSS v4 y una arquitectura de componentes desacoplada, accesible y reactiva.

---

## 🎨 Principios visuales y de diseño (`docs/diseno.md`)

La interfaz visual sigue una estética minimalista, estructurada y artesanal:

* **Paleta cromática:** Tonos cálidos y naturales inspirados en el café y la molienda: café espresso / ébano (`#2C1A1D`) como color primario, crema cálida (`#FDFBF7`) como fondo de superficies, verde salvia (`#4E6E58`) para acentos botánicos / éxito, y ámbar para advertencias y acciones clave.
* **Tipografía:** *Young Serif* para encabezados y nombres de marca; *Figtree* para cuerpo de texto legible y números tabulares (`tabular-nums`) en cronómetros y precios.
* **Diseño sin sombras pesadas:** Los contenedores, modales y tarjetas utilizan bordes sutiles (`border border-[var(--color-borde)]`) y radios consistentes (6px para controles y 10px para paneles), evitando sombras difuminadas artificiales.
* **Tipografía *Sentence case*:** Etiquetas, botones y encabezados utilizan mayúscula inicial natural, descartando el uso de `uppercase` forzado.

---

## 📂 Estructura de carpetas

```text
frontend/
├── src/
│   ├── components/              # Componentes de UI organizados modularmente
│   │   ├── admin/               # Paneles de gestión (productos, categorías, personal, sucursales con Leaflet, métricas Recharts, historial, auditoría)
│   │   ├── cliente/             # Barra superior, modal de personalización, drawer de carrito y modal de pedido
│   │   ├── comunes/             # Modales genéricos, estados de carga, botones y alertas
│   │   └── kds/                 # Comandas de cocina, semáforo de tiempos, modal de cancelación y ticket térmico
│   ├── context/                 # Estado global mediante Context API
│   │   ├── AuthContext.jsx      # Sesión de personal, almacenamiento de JWT y cliente HTTP `fetchConToken`
│   │   ├── CarritoContext.jsx   # Persistencia del carrito en localStorage y subtotales en centavos
│   │   └── IdiomaContext.jsx    # Selector de idioma ES/EN y función de traducción `t()`
│   ├── i18n/                    # Diccionarios de internacionalización
│   │   ├── es.js                # Traducciones completas en español
│   │   └── en.js                # Traducciones completas en inglés
│   ├── pages/                   # Vistas principales correspondientes a cada ruta
│   │   ├── Catalogo.jsx         # Ruta `/` (autoservicio, categorías, búsqueda y tarjeta de comanda activa)
│   │   ├── Seguimiento.jsx      # Ruta `/order/:codigo` (seguimiento en vivo y búsqueda manual)
│   │   ├── StaffAccess.jsx      # Ruta `/staff-access` (login con credenciales y JWT)
│   │   ├── Kds.jsx              # Ruta `/kds` (panel en tiempo real del barista con aviso sonoro)
│   │   └── Admin.jsx            # Ruta `/admin` (panel de control administrativo con RBAC)
│   ├── schemas/                 # Esquemas Zod para formularios interactivos con React Hook Form
│   ├── App.jsx                  # Enrutador principal y guardianes de ruta protegida
│   ├── main.jsx                 # Punto de entrada de la aplicación
│   └── index.css                # Configuración de Tailwind CSS v4 y variables CSS del tema
├── public/                      # Recursos estáticos
├── index.html                   # HTML base con fuentes tipográficas
└── vite.config.js
```

---

## 🌐 Internacionalización (ES / EN)

El sistema soporta español e inglés de forma nativa sin librerías externas:

* Todos los textos fijos de la interfaz provienen de los diccionarios [`src/i18n/es.js`](file:///home/anton/REPOS/kit-inicio/frontend/src/i18n/es.js) y [`src/i18n/en.js`](file:///home/anton/REPOS/kit-inicio/frontend/src/i18n/en.js).
* **Regla mandatoria:** Ningún texto visible al usuario se escribe quemado (*hardcoded*) dentro de los componentes.
* Los nombres y descripciones de las categorías, productos y opciones se extraen dinámicamente de las columnas `_es` y `_en` de la base de datos según el idioma activo seleccionado.

---

## 🔐 Manejo de sesión y cliente HTTP seguro (`AuthContext`)

* **Almacenamiento de sesión:** El token JWT del personal se almacena en `localStorage` con expiración automática de 8 horas. No se almacenan contraseñas, roles manipulables ni datos sensibles fuera del token.
* **Cliente `fetchConToken`:** Envoltorio de `fetch` que inyecta automáticamente el encabezado `Authorization: Bearer <token>`.
* **Manejo defensivo de respuestas:** Normaliza rutas previniendo duplicaciones de `/api`, intercepta caídas de servidor retornando estados HTTP 503 seguros y realiza lectura con caché para prevenir excepciones de `JSON.parse` ante respuestas vacías o páginas de error HTML.
* **Bloqueo de contraseñas temporales:** Si el usuario cuenta con la bandera `debe_cambiar_password = true`, la interfaz bloquea el acceso general y despliega forzosamente el modal de cambio obligatorio de contraseña.

---

## ⚙️ Variables de entorno (`.env`)

Crea un archivo `.env` en la raíz de `frontend/` a partir de `.env.example`:

```ini
# URL base hacia la API del backend
VITE_API_URL=http://localhost:3001/api
```

---

## 📜 Scripts disponibles

| Comando | Descripción |
| --- | --- |
| `pnpm run dev` | Inicia el servidor de desarrollo en Vite (`http://localhost:5173`). |
| `pnpm run build` | Compila y optimiza la aplicación para producción en la carpeta `dist/`. |
| `pnpm run preview` | Previsualiza localmente el build generado de producción. |

---

## 🗺️ Visualización de mapas (Leaflet)

El registro de sucursales en `/admin` integra un mapa interactivo con OpenStreetMap mediante `leaflet` y `react-leaflet`. Se incluye un controlador `InvalidadorTamanoMapa` (`useMap().invalidateSize()`) que garantiza que el mapa se renderice completo y fluido sin áreas grises ni teselas congeladas al abrirse dentro de ventanas modales.
