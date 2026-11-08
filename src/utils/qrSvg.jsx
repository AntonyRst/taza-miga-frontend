/**
 * Generador nativo de códigos QR en SVG sin dependencias externas.
 * Implementación estándar basada en especificación ISO/IEC 18004.
 */

// Tablas de Galois Field GF(256)
const EXP_TABLE = new Array(256);
const LOG_TABLE = new Array(256);

for (let i = 0, x = 1; i < 256; i++) {
  EXP_TABLE[i] = x;
  LOG_TABLE[x] = i;
  x <<= 1;
  if (x & 256) x ^= 0x11d;
}

function gmult(a, b) {
  if (a === 0 || b === 0) return 0;
  return EXP_TABLE[(LOG_TABLE[a] + LOG_TABLE[b]) % 255];
}

// Polinomios generadores Reed-Solomon
function obtenerPolinomioGenerador(grado) {
  let poly = [1];
  for (let i = 0; i < grado; i++) {
    const factor = [1, EXP_TABLE[i]];
    const res = new Array(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      res[j] ^= poly[j];
      res[j + 1] ^= gmult(poly[j], factor[1]);
    }
    poly = res;
  }
  return poly;
}

function calcularEcc(datos, numEcc) {
  const gen = obtenerPolinomioGenerador(numEcc);
  const info = datos.concat(new Array(numEcc).fill(0));
  for (let i = 0; i < datos.length; i++) {
    const coef = info[i];
    if (coef !== 0) {
      for (let j = 0; j < gen.length; j++) {
        info[i + j] ^= gmult(gen[j], coef);
      }
    }
  }
  return info.slice(datos.length);
}

// Capacidades de datos (bytes de datos y de ECC nivel L) para versiones 1 a 10
// [totalCodewords, dataCodewords, eccPerBlock, blocks]
const TABLA_VERSIONES_L = [
  null,
  { version: 1, total: 26, data: 19, ecc: 7, blocks: 1 },
  { version: 2, total: 44, data: 34, ecc: 10, blocks: 1 },
  { version: 3, total: 70, data: 55, ecc: 15, blocks: 1 },
  { version: 4, total: 100, data: 80, ecc: 20, blocks: 1 },
  { version: 5, total: 134, data: 108, ecc: 26, blocks: 1 },
  { version: 6, total: 172, data: 136, ecc: 18, blocks: 2 },
  { version: 7, total: 196, data: 156, ecc: 20, blocks: 2 },
  { version: 8, total: 242, data: 194, ecc: 24, blocks: 2 },
  { version: 9, total: 292, data: 232, ecc: 30, blocks: 2 },
  { version: 10, total: 346, data: 274, ecc: 18, blocks: 2 + 2 }
];

// Posiciones de patrones de alineación para versiones 1 a 10
const ALINEACION = [
  [],
  [],
  [6, 18],
  [6, 22],
  [6, 26],
  [6, 30],
  [6, 34],
  [6, 22, 38],
  [6, 24, 42],
  [6, 26, 46],
  [6, 28, 50]
];

// Generador de matriz de bits QR
function generarMatrizQr(texto) {
  const bytesTexto = [];
  for (let i = 0; i < texto.length; i++) {
    const code = texto.charCodeAt(i);
    if (code < 128) {
      bytesTexto.push(code);
    } else if (code < 2048) {
      bytesTexto.push(192 | (code >> 6), 128 | (code & 63));
    } else {
      bytesTexto.push(224 | (code >> 12), 128 | ((code >> 6) & 63), 128 | (code & 63));
    }
  }

  // Determinar versión mínima nivel L
  // Modo byte: 4 bits modo + 8/16 bits conteo + datos*8
  let vInfo = null;
  for (let v = 1; v <= 10; v++) {
    const info = TABLA_VERSIONES_L[v];
    const bitsHeader = 4 + (v < 10 ? 8 : 16);
    const bitsRequeridos = bitsHeader + bytesTexto.length * 8;
    if (bitsRequeridos <= info.data * 8) {
      vInfo = info;
      break;
    }
  }

  if (!vInfo) {
    vInfo = TABLA_VERSIONES_L[10];
  }

  const version = vInfo.version;
  const numModulos = version * 4 + 17;

  // Codificar datos en flujo de bits
  const bits = [];
  function pushBits(val, len) {
    for (let i = len - 1; i >= 0; i--) {
      bits.push((val >> i) & 1);
    }
  }

  // 1. Indicador de modo Byte: 0100
  pushBits(0b0100, 4);

  // 2. Conteo de caracteres
  pushBits(bytesTexto.length, version < 10 ? 8 : 16);

  // 3. Bytes de texto
  for (const b of bytesTexto) {
    pushBits(b, 8);
  }

  // 4. Terminador (hasta 4 ceros)
  const maxBits = vInfo.data * 8;
  const cerosFaltantes = Math.min(4, maxBits - bits.length);
  for (let i = 0; i < cerosFaltantes; i++) bits.push(0);

  // 5. Relleno a múltiplo de 8
  while (bits.length % 8 !== 0) bits.push(0);

  // 6. Bytes de relleno alternados 0xEC y 0x11
  const bytesRelleno = [0xec, 0x11];
  let rellenoIdx = 0;
  while (bits.length < maxBits) {
    pushBits(bytesRelleno[rellenoIdx % 2], 8);
    rellenoIdx++;
  }

  // Convertir bits a palabras de código (codewords)
  const codewords = [];
  for (let i = 0; i < bits.length; i += 8) {
    let b = 0;
    for (let j = 0; j < 8; j++) {
      b = (b << 1) | bits[i + j];
    }
    codewords.push(b);
  }

  // Bloques de datos y cálculo ECC
  const totalBloques = vInfo.blocks;
  const dataPerBlock = Math.floor(vInfo.data / totalBloques);
  const eccPerBlock = vInfo.ecc;

  const bloquesDatos = [];
  const bloquesEcc = [];

  let offset = 0;
  for (let b = 0; b < totalBloques; b++) {
    const len = dataPerBlock + (b >= totalBloques - (vInfo.data % totalBloques) ? 1 : 0);
    const slice = codewords.slice(offset, offset + len);
    offset += len;
    bloquesDatos.push(slice);
    bloquesEcc.push(calcularEcc(slice, eccPerBlock));
  }

  // Intercalar datos
  const secuenciaFinal = [];
  const maxDataLen = Math.max(...bloquesDatos.map((b) => b.length));
  for (let i = 0; i < maxDataLen; i++) {
    for (let b = 0; b < totalBloques; b++) {
      if (i < bloquesDatos[b].length) {
        secuenciaFinal.push(bloquesDatos[b][i]);
      }
    }
  }

  // Intercalar ECC
  for (let i = 0; i < eccPerBlock; i++) {
    for (let b = 0; b < totalBloques; b++) {
      secuenciaFinal.push(bloquesEcc[b][i]);
    }
  }

  // Matriz de módulos y máscara de función
  const matriz = Array.from({ length: numModulos }, () => new Array(numModulos).fill(null));
  const esFuncion = Array.from({ length: numModulos }, () => new Array(numModulos).fill(false));

  function setModulo(f, c, val, funcion = true) {
    matriz[f][c] = val;
    if (funcion) esFuncion[f][c] = true;
  }

  // 1. Patrones de búsqueda (Finder patterns 7x7)
  function ponerFinder(origenF, origenC) {
    for (let f = -1; f <= 7; f++) {
      for (let c = -1; c <= 7; c++) {
        const ff = origenF + f;
        const cc = origenC + c;
        if (ff < 0 || ff >= numModulos || cc < 0 || cc >= numModulos) continue;
        const enCaja = f >= 0 && f <= 6 && c >= 0 && c <= 6;
        const esBorde = f === 0 || f === 6 || c === 0 || c === 6;
        const esCentro = f >= 2 && f <= 4 && c >= 2 && c <= 4;
        setModulo(ff, cc, enCaja && (esBorde || esCentro) ? 1 : 0);
      }
    }
  }

  ponerFinder(0, 0);
  ponerFinder(0, numModulos - 7);
  ponerFinder(numModulos - 7, 0);

  // 2. Patrones de alineación
  const posAlineacion = ALINEACION[version] || [];
  for (const f of posAlineacion) {
    for (const c of posAlineacion) {
      if (esFuncion[f][c]) continue;
      for (let df = -2; df <= 2; df++) {
        for (let dc = -2; dc <= 2; dc++) {
          const val = Math.max(Math.abs(df), Math.abs(dc)) !== 1 ? 1 : 0;
          setModulo(f + df, c + dc, val);
        }
      }
    }
  }

  // 3. Patrones de sincronización (Timing)
  for (let i = 8; i < numModulos - 8; i++) {
    if (!esFuncion[6][i]) setModulo(6, i, i % 2 === 0 ? 1 : 0);
    if (!esFuncion[i][6]) setModulo(i, 6, i % 2 === 0 ? 1 : 0);
  }

  // 4. Módulo oscuro fijo
  setModulo(4 * version + 9, 8, 1);

  // 5. Espacios reservados para información de formato
  for (let i = 0; i <= 8; i++) {
    if (!esFuncion[8][i]) setModulo(8, i, 0, true);
    if (!esFuncion[i][8]) setModulo(i, 8, 0, true);
  }
  for (let i = numModulos - 8; i < numModulos; i++) {
    if (!esFuncion[8][i]) setModulo(8, i, 0, true);
    if (!esFuncion[i][8]) setModulo(i, 8, 0, true);
  }

  // 6. Colocar bits de datos en zig-zag
  const todosLosBits = [];
  for (const b of secuenciaFinal) {
    for (let i = 7; i >= 0; i--) {
      todosLosBits.push((b >> i) & 1);
    }
  }

  let bitIdx = 0;
  let haciaArriba = true;

  for (let derecha = numModulos - 1; derecha > 0; derecha -= 2) {
    if (derecha === 6) derecha--; // Saltear columna de sincronización

    const filas = haciaArriba
      ? Array.from({ length: numModulos }, (_, i) => numModulos - 1 - i)
      : Array.from({ length: numModulos }, (_, i) => i);

    for (const f of filas) {
      for (let c = derecha; c >= derecha - 1; c--) {
        if (!esFuncion[f][c]) {
          const bit = bitIdx < todosLosBits.length ? todosLosBits[bitIdx++] : 0;
          matriz[f][c] = bit;
        }
      }
    }
    haciaArriba = !haciaArriba;
  }

  // 7. Aplicar máscara estándar 0: (fila + columna) % 2 === 0
  for (let f = 0; f < numModulos; f++) {
    for (let c = 0; c < numModulos; c++) {
      if (!esFuncion[f][c]) {
        if ((f + c) % 2 === 0) {
          matriz[f][c] ^= 1;
        }
      }
    }
  }

  // 8. Información de formato para nivel L y máscara 0: bits 111011111000100 (con BCH y XOR 0x5412)
  const formatBits = [1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 0];

  // Copia 1: alrededor de la esquina superior izquierda
  matriz[8][0] = formatBits[0];
  matriz[8][1] = formatBits[1];
  matriz[8][2] = formatBits[2];
  matriz[8][3] = formatBits[3];
  matriz[8][4] = formatBits[4];
  matriz[8][5] = formatBits[5];
  matriz[8][7] = formatBits[6];
  matriz[8][8] = formatBits[7];
  matriz[7][8] = formatBits[8];
  matriz[5][8] = formatBits[9];
  matriz[4][8] = formatBits[10];
  matriz[3][8] = formatBits[11];
  matriz[2][8] = formatBits[12];
  matriz[1][8] = formatBits[13];
  matriz[0][8] = formatBits[14];

  // Copia 2: esquina inferior izquierda y superior derecha
  for (let i = 0; i < 7; i++) {
    matriz[numModulos - 1 - i][8] = formatBits[i];
  }
  for (let i = 0; i < 8; i++) {
    matriz[8][numModulos - 8 + i] = formatBits[7 + i];
  }

  return { matriz, numModulos };
}

/**
 * Componente React que renderiza un código QR en SVG puro y vectorial.
 */
export default function QrSvg({ valor, tamano = 160, className = '' }) {
  if (!valor) return null;

  try {
    const { matriz, numModulos } = generarMatrizQr(valor);
    const margen = 2; // Margen de zona de silencio
    const totalDim = numModulos + margen * 2;

    const rectangulos = [];
    for (let f = 0; f < numModulos; f++) {
      for (let c = 0; c < numModulos; c++) {
        if (matriz[f][c] === 1) {
          rectangulos.push(
            <rect
              key={`${f}-${c}`}
              x={c + margen}
              y={f + margen}
              width={1}
              height={1}
              fill="currentColor"
            />
          );
        }
      }
    }

    return (
      <svg
        viewBox={`0 0 ${totalDim} ${totalDim}`}
        width={tamano}
        height={tamano}
        className={`text-[#2C1A1D] ${className}`}
        shapeRendering="crispEdges"
        aria-label={`Código QR para ${valor}`}
      >
        <rect width={totalDim} height={totalDim} fill="#FFFFFF" />
        {rectangulos}
      </svg>
    );
  } catch (err) {
    console.error('Error generando QR SVG:', err);
    return (
      <div
        style={{ width: tamano, height: tamano }}
        className="flex items-center justify-center bg-gray-100 text-xs text-red-600 p-2 text-center"
      >
        Error al generar QR
      </div>
    );
  }
}
