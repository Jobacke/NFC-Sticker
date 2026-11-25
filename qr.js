/**
 * Minimaler, vollständig offline-fähiger QR-Code-Generator (ISO/IEC 18004)
 * Unterstützt Byte-Modus für Versionen 1–8 (ECC-Level M, bis 152 Bytes).
 */
(function (global) {
  "use strict";

  // Versionen 1-8, ECC-Level M: [dataCodewords, ecCodewordsPerBlock, blocks]
  const VERSION_SPECS_M = {
    1: { data: 16, ecPerBlock: 10, blocks: 1, align: [] },
    2: { data: 28, ecPerBlock: 16, blocks: 1, align: [6, 18] },
    3: { data: 44, ecPerBlock: 26, blocks: 1, align: [6, 22] },
    4: { data: 64, ecPerBlock: 18, blocks: 2, align: [6, 26] },
    5: { data: 86, ecPerBlock: 24, blocks: 2, align: [6, 30] },
    6: { data: 108, ecPerBlock: 16, blocks: 4, align: [6, 34] },
    7: { data: 124, ecPerBlock: 18, blocks: 4, align: [6, 22, 38] },
    8: { data: 154, ecPerBlock: 22, blocks: 4, align: [6, 24, 42] }
  };

  // Format-Info-Bits (15 Bit) für ECC-Level M (00) und Masken 0..7
  const FORMAT_INFO_M = [
    0x5412, 0x5125, 0x5e7c, 0x5b4b,
    0x45f9, 0x40ce, 0x4f97, 0x4aa0
  ];

  // Version-Info-Bits (18 Bit) für Versionen >= 7
  const VERSION_INFO = {
    7: 0x07c94,
    8: 0x085bc
  };

  // GF(256) Tabellen (Polynom 0x11d)
  const GF_EXP = new Uint8Array(512);
  const GF_LOG = new Uint8Array(256);
  (function initGF() {
    let x = 1;
    for (let i = 0; i < 255; i++) {
      GF_EXP[i] = x;
      GF_LOG[x] = i;
      x <<= 1;
      if (x & 0x100) x ^= 0x11d;
    }
    for (let i = 255; i < 512; i++) {
      GF_EXP[i] = GF_EXP[i - 255];
    }
  })();

  function gfMul(a, b) {
    if (a === 0 || b === 0) return 0;
    return GF_EXP[GF_LOG[a] + GF_LOG[b]];
  }

  function rsGeneratorPoly(degree) {
    let poly = [1];
    for (let i = 0; i < degree; i++) {
      const next = new Array(poly.length + 1).fill(0);
      const factor = GF_EXP[i];
      for (let j = 0; j < poly.length; j++) {
        next[j] ^= poly[j];
        next[j + 1] ^= gfMul(poly[j], factor);
      }
      poly = next;
    }
    return poly;
  }

  function rsEncode(data, ecLen) {
    const gen = rsGeneratorPoly(ecLen);
    const res = new Uint8Array(ecLen);
    for (let i = 0; i < data.length; i++) {
      const factor = data[i] ^ res[0];
      for (let j = 0; j < ecLen - 1; j++) {
        res[j] = res[j + 1] ^ gfMul(gen[j + 1], factor);
      }
      res[ecLen - 1] = gfMul(gen[ecLen], factor);
    }
    return Array.from(res);
  }

  function encodeUTF8(str) {
    if (typeof TextEncoder !== "undefined") {
      return Array.from(new TextEncoder().encode(str));
    }
    const bytes = [];
    for (let i = 0; i < str.length; i++) {
      const c = str.charCodeAt(i);
      if (c < 0x80) bytes.push(c);
      else if (c < 0x800) {
        bytes.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
      } else {
        bytes.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
      }
    }
    return bytes;
  }

  function chooseVersion(byteLen) {
    // Byte-Modus Header: 4 Bit Modus + 8 Bit Länge = 12 Bit (bei V1-V9)
    const neededBytes = Math.ceil((12 + byteLen * 8) / 8);
    for (let v = 1; v <= 8; v++) {
      if (neededBytes <= VERSION_SPECS_M[v].data) return v;
    }
    return null;
  }

  function buildCodewords(bytes, version) {
    const spec = VERSION_SPECS_M[version];
    const bits = [];
    const pushBits = (val, len) => {
      for (let i = len - 1; i >= 0; i--) bits.push((val >> i) & 1);
    };

    // Modus 0100 (Byte) + Länge (8 Bit)
    pushBits(0b0100, 4);
    pushBits(bytes.length, 8);
    for (const b of bytes) pushBits(b, 8);

    const maxBits = spec.data * 8;
    const terminator = Math.min(4, maxBits - bits.length);
    for (let i = 0; i < terminator; i++) bits.push(0);
    while (bits.length % 8 !== 0) bits.push(0);

    const dataCodewords = [];
    for (let i = 0; i < bits.length; i += 8) {
      let byte = 0;
      for (let j = 0; j < 8; j++) byte = (byte << 1) | bits[i + j];
      dataCodewords.push(byte);
    }

    const padBytes = [0xec, 0x11];
    let padIdx = 0;
    while (dataCodewords.length < spec.data) {
      dataCodewords.push(padBytes[padIdx % 2]);
      padIdx++;
    }

    // Blöcke aufteilen (bei Version 7/8 ggf. ungleiche Blocklängen nach ISO 18004)
    const numBlocks = spec.blocks;
    const shortLen = Math.floor(spec.data / numBlocks);
    const numLongBlocks = spec.data % numBlocks;
    const numShortBlocks = numBlocks - numLongBlocks;

    const dataBlocks = [];
    const ecBlocks = [];
    let offset = 0;

    for (let b = 0; b < numBlocks; b++) {
      const len = b < numShortBlocks ? shortLen : shortLen + 1;
      const slice = dataCodewords.slice(offset, offset + len);
      offset += len;
      dataBlocks.push(slice);
      ecBlocks.push(rsEncode(slice, spec.ecPerBlock));
    }

    // Interleaving
    const result = [];
    const maxDataLen = shortLen + (numLongBlocks > 0 ? 1 : 0);
    for (let i = 0; i < maxDataLen; i++) {
      for (let b = 0; b < numBlocks; b++) {
        if (i < dataBlocks[b].length) result.push(dataBlocks[b][i]);
      }
    }
    for (let i = 0; i < spec.ecPerBlock; i++) {
      for (let b = 0; b < numBlocks; b++) {
        result.push(ecBlocks[b][i]);
      }
    }

    return result;
  }

  function createMatrix(version) {
    const size = version * 4 + 17;
    const modules = Array.from({ length: size }, () => new Int8Array(size));
    const isFunction = Array.from({ length: size }, () => new Uint8Array(size));

    function setFn(r, c, dark) {
      if (r >= 0 && r < size && c >= 0 && c < size) {
        modules[r][c] = dark ? 1 : 0;
        isFunction[r][c] = 1;
      }
    }

    function drawFinder(top, left) {
      for (let r = -1; r <= 7; r++) {
        for (let c = -1; c <= 7; c++) {
          const rr = top + r;
          const cc = left + c;
          if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
          const inOuter = r >= 0 && r <= 6 && c >= 0 && c <= 6;
          const onBorder = r === 0 || r === 6 || c === 0 || c === 6;
          const inCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          setFn(rr, cc, inOuter && (onBorder || inCenter));
        }
      }
    }

    function drawAlignment(cr, cc) {
      for (let r = -2; r <= 2; r++) {
        for (let c = -2; c <= 2; c++) {
          const dark = Math.max(Math.abs(r), Math.abs(c)) !== 1;
          setFn(cr + r, cc + c, dark);
        }
      }
    }

    // Finder Patterns + Separatoren
    drawFinder(0, 0);
    drawFinder(0, size - 7);
    drawFinder(size - 7, 0);

    // Alignment Patterns
    const alignCoords = VERSION_SPECS_M[version].align;
    for (let i = 0; i < alignCoords.length; i++) {
      for (let j = 0; j < alignCoords.length; j++) {
        const r = alignCoords[i];
        const c = alignCoords[j];
        if (isFunction[r][c]) continue;
        drawAlignment(r, c);
      }
    }

    // Timing Patterns
    for (let i = 8; i < size - 8; i++) {
      const dark = i % 2 === 0;
      if (!isFunction[6][i]) setFn(6, i, dark);
      if (!isFunction[i][6]) setFn(i, 6, dark);
    }

    // Dark Module
    setFn(size - 8, 8, true);

    // Format Info Reservierung
    for (let i = 0; i < 9; i++) {
      if (i !== 6) {
        isFunction[8][i] = 1;
        isFunction[i][8] = 1;
      }
    }
    for (let i = 0; i < 8; i++) {
      isFunction[8][size - 1 - i] = 1;
      isFunction[size - 1 - i][8] = 1;
    }

    // Version Info für V7/V8
    if (version >= 7 && VERSION_INFO[version]) {
      const vBits = VERSION_INFO[version];
      for (let i = 0; i < 18; i++) {
        const dark = ((vBits >> i) & 1) === 1;
        const r = Math.floor(i / 3);
        const c = size - 11 + (i % 3);
        setFn(r, c, dark);
        setFn(c, r, dark);
      }
    }

    return { size, modules, isFunction };
  }

  function placeData(matrix, codewords) {
    const { size, modules, isFunction } = matrix;
    let bitIdx = 0;
    const totalBits = codewords.length * 8;
    let upward = true;

    for (let right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (let step = 0; step < size; step++) {
        const r = upward ? size - 1 - step : step;
        for (let dx = 0; dx < 2; dx++) {
          const c = right - dx;
          if (isFunction[r][c]) continue;
          let bit = 0;
          if (bitIdx < totalBits) {
            bit = (codewords[bitIdx >> 3] >> (7 - (bitIdx & 7))) & 1;
            bitIdx++;
          }
          modules[r][c] = bit;
        }
      }
      upward = !upward;
    }
  }

  function maskBit(mask, r, c) {
    switch (mask) {
      case 0: return (r + c) % 2 === 0;
      case 1: return r % 2 === 0;
      case 2: return c % 3 === 0;
      case 3: return (r + c) % 3 === 0;
      case 4: return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0;
      case 5: return ((r * c) % 2 + (r * c) % 3) === 0;
      case 6: return (((r * c) % 2 + (r * c) % 3) % 2) === 0;
      case 7: return (((r + c) % 2 + (r * c) % 3) % 2) === 0;
      default: return false;
    }
  }

  function writeFormatInfo(modules, size, mask) {
    const bits = FORMAT_INFO_M[mask];
    // Links oben vertikal & horizontal
    const coords1 = [
      [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
      [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]
    ];
    for (let i = 0; i < 15; i++) {
      const bit = (bits >> (14 - i)) & 1;
      modules[coords1[i][0]][coords1[i][1]] = bit;
    }
    // Unten links & oben rechts
    for (let i = 0; i < 7; i++) {
      modules[size - 1 - i][8] = (bits >> (14 - i)) & 1;
    }
    for (let i = 7; i < 15; i++) {
      modules[8][size - 15 + i] = (bits >> (14 - i)) & 1;
    }
  }

  function penaltyScore(modules, size) {
    let score = 0;
    // Regel 1: Läufe >= 5
    for (let r = 0; r < size; r++) {
      let run = 1;
      for (let c = 1; c < size; c++) {
        if (modules[r][c] === modules[r][c - 1]) {
          run++;
        } else {
          if (run >= 5) score += 3 + (run - 5);
          run = 1;
        }
      }
      if (run >= 5) score += 3 + (run - 5);
    }
    for (let c = 0; c < size; c++) {
      let run = 1;
      for (let r = 1; r < size; r++) {
        if (modules[r][c] === modules[r - 1][c]) {
          run++;
        } else {
          if (run >= 5) score += 3 + (run - 5);
          run = 1;
        }
      }
      if (run >= 5) score += 3 + (run - 5);
    }
    // Regel 2: 2x2 Blöcke
    for (let r = 0; r < size - 1; r++) {
      for (let c = 0; c < size - 1; c++) {
        const v = modules[r][c];
        if (v === modules[r][c + 1] && v === modules[r + 1][c] && v === modules[r + 1][c + 1]) {
          score += 3;
        }
      }
    }
    // Regel 4: Verhältnis dunkler Module
    let dark = 0;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) dark += modules[r][c];
    }
    const pct = (dark * 100) / (size * size);
    score += Math.floor(Math.abs(pct - 50) / 5) * 10;
    return score;
  }

  function generateMatrix(text) {
    const bytes = encodeUTF8(text);
    const version = chooseVersion(bytes.length);
    if (!version) return null;

    const codewords = buildCodewords(bytes, version);
    const base = createMatrix(version);
    placeData(base, codewords);

    let bestMask = 0;
    let bestScore = Infinity;
    let bestModules = null;

    for (let mask = 0; mask < 8; mask++) {
      const candidate = base.modules.map((row) => Int8Array.from(row));
      for (let r = 0; r < base.size; r++) {
        for (let c = 0; c < base.size; c++) {
          if (!base.isFunction[r][c] && maskBit(mask, r, c)) {
            candidate[r][c] ^= 1;
          }
        }
      }
      writeFormatInfo(candidate, base.size, mask);
      const score = penaltyScore(candidate, base.size);
      if (score < bestScore) {
        bestScore = score;
        bestMask = mask;
        bestModules = candidate;
      }
    }

    return { size: base.size, modules: bestModules, version, mask: bestMask };
  }

  function toSVG(text, fgColor = "#0d1018") {
    const qr = generateMatrix(text);
    if (!qr) return null;

    const quiet = 2;
    const total = qr.size + quiet * 2;
    const paths = [];

    for (let r = 0; r < qr.size; r++) {
      for (let c = 0; c < qr.size; c++) {
        if (qr.modules[r][c]) {
          paths.push(`M${c + quiet},${r + quiet}h1v1h-1z`);
        }
      }
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges" role="img" aria-label="QR-Code"><path fill="${fgColor}" d="${paths.join("")}"/></svg>`;
  }

  global.MiniQR = { generateMatrix, toSVG };
})(typeof window !== "undefined" ? window : globalThis);
