/* =====================================================================
   DETECTOR DE CUADROS + HOMOGRAFÍA 3x3 + CORRECCIÓN DE LENTE (pure JS)
   Pipeline: reducción -> gris -> Gauss -> Sobel+NMS -> Hough orientado
   -> combinaciones de 4 rectas -> puntuación (soporte de borde, convexidad,
   área, proporción física estimada vs. medida introducida) -> refinamiento
   subpíxel en alta resolución -> estimación de distorsión radial (barril/cojín)
   ===================================================================== */
(function (G) {
  'use strict';

  function toGray(img, maxSide) {
    const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
    const s = Math.min(1, maxSide / Math.max(iw, ih));
    const w = Math.max(8, Math.round(iw * s)), h = Math.max(8, Math.round(ih * s));
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, w, h);
    const d = ctx.getImageData(0, 0, w, h).data;
    const g = new Float32Array(w * h);
    for (let i = 0, j = 0; i < g.length; i++, j += 4) g[i] = 0.299 * d[j] + 0.587 * d[j + 1] + 0.114 * d[j + 2];
    return { g, w, h, sx: iw / w, sy: ih / h, iw, ih };
  }

  function blur(src, w, h, sigma) {
    const r = Math.ceil(sigma * 2.5), k = [];
    let sum = 0;
    for (let i = -r; i <= r; i++) { const v = Math.exp(-i * i / (2 * sigma * sigma)); k.push(v); sum += v; }
    for (let i = 0; i < k.length; i++) k[i] /= sum;
    const tmp = new Float32Array(w * h), out = new Float32Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let a = 0; for (let i = -r; i <= r; i++) { const xx = Math.min(w - 1, Math.max(0, x + i)); a += src[y * w + xx] * k[i + r]; }
      tmp[y * w + x] = a;
    }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let a = 0; for (let i = -r; i <= r; i++) { const yy = Math.min(h - 1, Math.max(0, y + i)); a += tmp[yy * w + x] * k[i + r]; }
      out[y * w + x] = a;
    }
    return out;
  }

  function sobel(g, w, h) {
    const gx = new Float32Array(w * h), gy = new Float32Array(w * h), mag = new Float32Array(w * h);
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const a = g[i - w - 1], b = g[i - w], c = g[i - w + 1], d = g[i - 1], f = g[i + 1], p = g[i + w - 1], q = g[i + w], r = g[i + w + 1];
      const X = (c + 2 * f + r) - (a + 2 * d + p), Y = (p + 2 * q + r) - (a + 2 * b + c);
      gx[i] = X; gy[i] = Y; mag[i] = Math.hypot(X, Y);
    }
    return { gx, gy, mag };
  }

  // Canny simplificado: NMS + umbral por percentil + histéresis
  function canny(S, w, h) {
    const { gx, gy, mag } = S, n = w * h;
    const nms = new Float32Array(n);
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      const i = y * w + x, m = mag[i]; if (m < 1) continue;
      let a = Math.atan2(gy[i], gx[i]) * 180 / Math.PI; if (a < 0) a += 180;
      let o1, o2;
      if (a < 22.5 || a >= 157.5) { o1 = i - 1; o2 = i + 1; }
      else if (a < 67.5) { o1 = i - w - 1; o2 = i + w + 1; }
      else if (a < 112.5) { o1 = i - w; o2 = i + w; }
      else { o1 = i - w + 1; o2 = i + w - 1; }
      if (m >= mag[o1] && m >= mag[o2]) nms[i] = m;
    }
    let mx = 0; for (let i = 0; i < n; i++) if (nms[i] > mx) mx = nms[i];
    const hist = new Uint32Array(256); let cnt = 0;
    for (let i = 0; i < n; i++) if (nms[i] > 0) { hist[Math.min(255, (nms[i] / mx * 255) | 0)]++; cnt++; }
    let acc = 0, hiB = 255; for (let b = 255; b >= 0; b--) { acc += hist[b]; if (acc > cnt * 0.30) { hiB = b; break; } }
    const hi = Math.max(hiB / 255 * mx, mx * 0.06), lo = hi * 0.45;
    const edge = new Uint8Array(n), stack = [];
    for (let i = 0; i < n; i++) if (nms[i] >= hi) { edge[i] = 1; stack.push(i); }
    while (stack.length) {
      const i = stack.pop();
      for (const o of [-1, 1, -w, w, -w - 1, -w + 1, w - 1, w + 1]) { const j = i + o; if (j > 0 && j < n && !edge[j] && nms[j] >= lo) { edge[j] = 1; stack.push(j); } }
    }
    return { edge, mx };
  }

  // Hough orientado por gradiente (cada píxel vota sólo en ±10° de su normal)
  function hough(edge, S, w, h) {
    const NT = 180, diag = Math.ceil(Math.hypot(w, h)), NR = 2 * diag + 1;
    const acc = new Float32Array(NT * NR);
    const cs = new Float32Array(NT), sn = new Float32Array(NT);
    for (let t = 0; t < NT; t++) { cs[t] = Math.cos(t * Math.PI / NT); sn[t] = Math.sin(t * Math.PI / NT); }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x; if (!edge[i]) continue;
      let a = Math.atan2(S.gy[i], S.gx[i]) * 180 / Math.PI; if (a < 0) a += 180;
      const t0 = Math.round(a);
      for (let dt = -10; dt <= 10; dt++) {
        let t = t0 + dt; if (t < 0) t += NT; if (t >= NT) t -= NT;
        const r = Math.round(x * cs[t] + y * sn[t]) + diag;
        acc[t * NR + r] += 1;
      }
    }
    const peaks = [];
    let mx = 0; for (let i = 0; i < acc.length; i++) if (acc[i] > mx) mx = acc[i];
    const thr = Math.max(12, mx * 0.10);
    for (let t = 0; t < NT; t++) for (let r = 2; r < NR - 2; r++) {
      const v = acc[t * NR + r]; if (v < thr) continue;
      let ok = true;
      for (let dt = -2; dt <= 2 && ok; dt++) for (let dr = -2; dr <= 2; dr++) {
        if (!dt && !dr) continue; let tt = t + dt, rr = r + dr;
        if (tt < 0) { tt += NT; rr = NR - 1 - rr; } else if (tt >= NT) { tt -= NT; rr = NR - 1 - rr; }
        if (rr < 0 || rr >= NR) continue;
        if (acc[tt * NR + rr] > v) { ok = false; break; }
      }
      if (ok) peaks.push({ theta: t * Math.PI / NT, rho: r - diag, votes: v });
    }
    peaks.sort((a, b) => b.votes - a.votes);
    const sel = [];
    for (const p of peaks) {
      if (sel.some(q => { let dt = Math.abs(p.theta - q.theta); dt = Math.min(dt, Math.PI - dt); const sameSign = Math.abs(p.theta - q.theta) < Math.PI / 2; const dr = sameSign ? Math.abs(p.rho - q.rho) : Math.abs(p.rho + q.rho); return dt < 0.07 && dr < Math.max(6, diag * 0.015); })) continue;
      sel.push(p); if (sel.length >= 44) break;
    }
    return sel;
  }

  function intersect(a, b) {
    const c1 = Math.cos(a.theta), s1 = Math.sin(a.theta), c2 = Math.cos(b.theta), s2 = Math.sin(b.theta);
    const det = c1 * s2 - s1 * c2; if (Math.abs(det) < 1e-6) return null;
    return { x: (a.rho * s2 - s1 * b.rho) / det, y: (c1 * b.rho - a.rho * c2) / det };
  }

  function orderCorners(pts) {
    const cx = pts.reduce((s, p) => s + p.x, 0) / 4, cy = pts.reduce((s, p) => s + p.y, 0) / 4;
    const s = pts.slice().sort((a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx)); // horario en pantalla
    let k = 0, best = Infinity; s.forEach((p, i) => { if (p.x + p.y < best) { best = p.x + p.y; k = i; } });
    return [0, 1, 2, 3].map(i => s[(k + i) % 4]); // TL, TR, BR, BL
  }

  function isConvex(q) {
    let sign = 0;
    for (let i = 0; i < 4; i++) {
      const a = q[i], b = q[(i + 1) % 4], c = q[(i + 2) % 4];
      const cr = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
      if (Math.abs(cr) < 1e-9) return false; const s = Math.sign(cr);
      if (!sign) sign = s; else if (s !== sign) return false;
    }
    return true;
  }
  function polyArea(q) { let a = 0; for (let i = 0; i < 4; i++) { const p = q[i], r = q[(i + 1) % 4]; a += p.x * r.y - r.x * p.y; } return Math.abs(a) / 2; }

  // Proporción física (ancho/alto) desde un cuadrilátero en perspectiva (Zhang & He)
  function physicalAspect(q, W, H) {
    const cx = W / 2, cy = H / 2, D = Math.hypot(W, H);
    const m = [q[0], q[1], q[3], q[2]].map(p => [p.x - cx, p.y - cy, 1]); // m1=TL m2=TR m3=BL m4=BR
    const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const c14 = cross(m[0], m[3]);
    const k2 = dot(c14, m[2]) / dot(cross(m[1], m[3]), m[2]);
    const k3 = dot(c14, m[1]) / dot(cross(m[2], m[3]), m[1]);
    const n2 = m[1].map((v, i) => k2 * v - m[0][i]), n3 = m[2].map((v, i) => k3 * v - m[0][i]);
    let f2 = NaN;
    if (Math.abs(n2[2] * n3[2]) > 1e-9) f2 = -(n2[0] * n3[0] + n2[1] * n3[1]) / (n2[2] * n3[2]);
    const fmin = 0.45 * D, fmax = 3 * D;
    if (!(f2 > fmin * fmin && f2 < fmax * fmax)) f2 = (0.85 * D) ** 2;
    const r2 = (n2[0] ** 2 + n2[1] ** 2 + f2 * n2[2] ** 2) / (n3[0] ** 2 + n3[1] ** 2 + f2 * n3[2] ** 2);
    const r = Math.sqrt(Math.abs(r2));
    if (!isFinite(r) || r <= 0) {
      const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
      return (d(q[0], q[1]) + d(q[3], q[2])) / (d(q[0], q[3]) + d(q[1], q[2]));
    }
    return r;
  }

  function sideSupport(a, b, S, edge, w, h) {
    const L = Math.hypot(b.x - a.x, b.y - a.y), n = Math.max(12, Math.min(80, Math.round(L / 3)));
    const nx = -(b.y - a.y) / L, ny = (b.x - a.x) / L;
    let hit = 0, tot = 0, gap = 0, maxGap = 0;
    for (let k = 0; k < n; k++) {
      const t = 0.04 + 0.92 * k / (n - 1), x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t;
      tot++;
      let found = false;
      for (let o = -3; o <= 3 && !found; o++) {
        const xx = Math.round(x + nx * o), yy = Math.round(y + ny * o);
        if (xx < 1 || yy < 1 || xx >= w - 1 || yy >= h - 1) continue;
        const i = yy * w + xx; if (!edge[i]) continue;
        const m = S.mag[i]; if (m < 1) continue;
        if (Math.abs(S.gx[i] * nx + S.gy[i] * ny) / m > 0.85) found = true;
      }
      if (found) { hit++; gap = 0; } else { gap++; if (gap > maxGap) maxGap = gap; }
    }
    return tot ? (hit / tot) * Math.max(0, 1 - 2.2 * maxGap / tot) : 0;
  }

  function findQuad(img, targetAspect) {
    const P = toGray(img, 480), { w, h } = P;
    const g = blur(P.g, w, h, 1.4), S = sobel(g, w, h), { edge } = canny(S, w, h);
    const lines = hough(edge, S, w, h);
    const hor = [], ver = [];
    for (const l of lines) { const deg = l.theta * 180 / Math.PI; (deg > 45 && deg < 135 ? hor : ver).push(l); }
    hor.splice(18); ver.splice(18);
    const imgArea = w * h, cands = [];
    for (let i = 0; i < hor.length; i++) for (let j = i + 1; j < hor.length; j++)
      for (let k = 0; k < ver.length; k++) for (let l = k + 1; l < ver.length; l++) {
        const pts = [intersect(hor[i], ver[k]), intersect(hor[i], ver[l]), intersect(hor[j], ver[l]), intersect(hor[j], ver[k])];
        if (pts.some(p => !p || p.x < -0.04 * w || p.y < -0.04 * h || p.x > 1.04 * w || p.y > 1.04 * h)) continue;
        const q = orderCorners(pts); if (!isConvex(q)) continue;
        const ar = polyArea(q) / imgArea; if (ar < 0.04 || ar > 0.995) continue;
        let minSide = Infinity; for (let s = 0; s < 4; s++) minSide = Math.min(minSide, Math.hypot(q[s].x - q[(s + 1) % 4].x, q[s].y - q[(s + 1) % 4].y));
        if (minSide < 0.08 * Math.min(w, h)) continue;
        // ángulos interiores razonables (perspectiva extrema descartada)
        let badAng = false;
        for (let s = 0; s < 4; s++) { const a = q[(s + 3) % 4], b = q[s], c = q[(s + 1) % 4];
          const v1x = a.x - b.x, v1y = a.y - b.y, v2x = c.x - b.x, v2y = c.y - b.y;
          const cosA = (v1x * v2x + v1y * v2y) / (Math.hypot(v1x, v1y) * Math.hypot(v2x, v2y)); if (Math.abs(cosA) > 0.75) badAng = true; }
        if (badAng) continue;
        const sup = [0, 1, 2, 3].map(s => sideSupport(q[s], q[(s + 1) % 4], S, edge, w, h));
        const mean = (sup[0] + sup[1] + sup[2] + sup[3]) / 4, mn = Math.min(...sup);
        if (mn < 0.25) continue;
        // las aristas de un cuadro TERMINAN en sus esquinas (rechaza líneas de suelo/zócalo/puertas que continúan)
        let ext = 0;
        for (let s = 0; s < 4; s++) { const a = q[s], b = q[(s + 1) % 4], dx = (b.x - a.x) * 0.1, dy = (b.y - a.y) * 0.1;
          ext += sideSupport({ x: b.x + dx * 0.15, y: b.y + dy * 0.15 }, { x: b.x + dx, y: b.y + dy }, S, edge, w, h);
          ext += sideSupport({ x: a.x - dx * 0.15, y: a.y - dy * 0.15 }, { x: a.x - dx, y: a.y - dy }, S, edge, w, h); }
        ext /= 8;
        let prior = 1, phys = physicalAspect(q, w, h);
        if (targetAspect > 0) {
          const e = Math.log(phys / targetAspect);
          prior = 0.12 + 0.88 * Math.exp(-(e * e) / (2 * 0.12 * 0.12));
        }
        const score = mean * (0.4 + 0.6 * mn) * prior * (0.55 + 0.45 * Math.sqrt(ar)) * (1 - 0.7 * ext);
        cands.push({ q, score, sup, phys, prior, ar });
      }
    cands.sort((a, b) => b.score - a.score);
    G.__lastCands = cands.slice(0, 6).map(c => ({ q: c.q.map(p => [Math.round(p.x * P.sx), Math.round(p.y * P.sy)]), s: +c.score.toFixed(3), sup: c.sup.map(v => +v.toFixed(2)), pr: +c.prior.toFixed(2) }));
    const best = cands[0];
    if (!best) return null;
    return { quad: best.q.map(p => ({ x: p.x * P.sx, y: p.y * P.sy })), score: best.score, phys: best.phys, prior: best.prior, iw: P.iw, ih: P.ih, candidates: cands.length };
  }

  /* ---------- Refinamiento subpíxel + distorsión radial ---------- */
  function makeSampler(P) {
    const { g, w, h } = P;
    return (x, y) => {
      if (x < 0) x = 0; if (y < 0) y = 0; if (x > w - 1.001) x = w - 1.001; if (y > h - 1.001) y = h - 1.001;
      const x0 = x | 0, y0 = y | 0, fx = x - x0, fy = y - y0, i = y0 * w + x0;
      return g[i] * (1 - fx) * (1 - fy) + g[i + 1] * fx * (1 - fy) + g[i + w] * (1 - fx) * fy + g[i + w + 1] * fx * fy;
    };
  }

  function fitLine(pts) { // total least squares => {nx,ny,c} con nx*x+ny*y=c
    const n = pts.length; let mx = 0, my = 0; pts.forEach(p => { mx += p.x; my += p.y; }); mx /= n; my /= n;
    let sxx = 0, syy = 0, sxy = 0; pts.forEach(p => { const dx = p.x - mx, dy = p.y - my; sxx += dx * dx; syy += dy * dy; sxy += dx * dy; });
    const th = 0.5 * Math.atan2(2 * sxy, sxx - syy); // dirección principal
    const nx = -Math.sin(th), ny = Math.cos(th);
    return { nx, ny, c: nx * mx + ny * my };
  }
  function robustLine(pts) {
    let L = fitLine(pts), cur = pts;
    for (let it = 0; it < 3 && cur.length > 6; it++) {
      const res = cur.map(p => Math.abs(L.nx * p.x + L.ny * p.y - L.c));
      const med = res.slice().sort((a, b) => a - b)[res.length >> 1];
      const thr = Math.max(0.6, med * 2.5);
      const nxt = cur.filter((p, i) => res[i] <= thr); if (nxt.length < 6) break;
      cur = nxt; L = fitLine(cur);
    }
    L.inliers = cur; return L;
  }
  function lineInter(a, b) { const det = a.nx * b.ny - a.ny * b.nx; if (Math.abs(det) < 1e-9) return null; return { x: (a.c * b.ny - a.ny * b.c) / det, y: (a.nx * b.c - a.c * b.nx) / det }; }

  // Modelo de distorsión radial (1 parámetro) en coordenadas normalizadas por semidiagonal
  function lensModel(iw, ih, k1) {
    const cx = iw / 2, cy = ih / 2, R = Math.hypot(cx, cy);
    return {
      k1,
      distort(p) { if (!k1) return p; const x = (p.x - cx) / R, y = (p.y - cy) / R, f = 1 + k1 * (x * x + y * y); return { x: cx + x * f * R, y: cy + y * f * R }; },
      undistort(p) { if (!k1) return p; const xd = (p.x - cx) / R, yd = (p.y - cy) / R; let x = xd, y = yd;
        for (let i = 0; i < 8; i++) { const f = 1 + k1 * (x * x + y * y); x = xd / f; y = yd / f; } return { x: cx + x * R, y: cy + y * R }; }
    };
  }

  function refine(img, quadPx) {
    const P = toGray(img, 1600), smp = makeSampler({ g: blur(P.g, P.w, P.h, 0.9), w: P.w, h: P.h });
    const q = quadPx.map(p => ({ x: p.x / P.sx, y: p.y / P.sy }));
    const searchR = Math.max(4, Math.min(P.w, P.h) * 0.012);
    const sidePts = [];
    for (let s = 0; s < 4; s++) {
      const a = q[s], b = q[(s + 1) % 4], L = Math.hypot(b.x - a.x, b.y - a.y);
      const tx = (b.x - a.x) / L, ty = (b.y - a.y) / L, nx = -ty, ny = tx;
      const N = Math.max(20, Math.min(120, Math.round(L / 6))), pts = [];
      // polaridad dominante del borde
      for (let k = 0; k < N; k++) {
        const t = 0.06 + 0.88 * k / (N - 1), x0 = a.x + (b.x - a.x) * t, y0 = a.y + (b.y - a.y) * t;
        let bestV = 0, bestO = 0, prof = [];
        for (let o = -searchR; o <= searchR + 1e-6; o += 0.5) {
          const d = smp(x0 + nx * (o + 0.75), y0 + ny * (o + 0.75)) - smp(x0 + nx * (o - 0.75), y0 + ny * (o - 0.75));
          prof.push(Math.abs(d));
        }
        let bi = 0; prof.forEach((v, i) => { if (v > bestV) { bestV = v; bi = i; } });
        if (bestV < 4) continue;
        let off = 0; if (bi > 0 && bi < prof.length - 1) { const l = prof[bi - 1], r = prof[bi + 1], den = l - 2 * bestV + r; if (den < 0) off = 0.5 * (l - r) / den; }
        bestO = -searchR + (bi + off) * 0.5;
        pts.push({ x: (x0 + nx * bestO) * P.sx, y: (y0 + ny * bestO) * P.sy, w: bestV });
      }
      sidePts.push(pts);
    }
    if (sidePts.some(p => p.length < 8)) return { quad: quadPx, k1: 0 };
    const iw = P.iw, ih = P.ih;
    const evalK = (k1) => {
      const lm = lensModel(iw, ih, k1); let err = 0, cnt = 0; const lines = [];
      for (const pts of sidePts) { const up = pts.map(p => lm.undistort(p)); const L = robustLine(up); lines.push(L);
        L.inliers.forEach(p => { const r = L.nx * p.x + L.ny * p.y - L.c; err += r * r; cnt++; }); }
      return { err: err / Math.max(1, cnt), lines, lm };
    };
    let best = evalK(0); const base = best.err; let bestK = 0;
    for (let k = -0.30; k <= 0.30001; k += 0.01) { const r = evalK(k); if (r.err < best.err) { best = r; bestK = k; } }
    for (let k = bestK - 0.01; k <= bestK + 0.01; k += 0.002) { const r = evalK(k); if (r.err < best.err) { best = r; bestK = k; } }
    if (!(best.err < base * 0.6 && Math.abs(bestK) >= 0.015)) { best = evalK(0); bestK = 0; }
    const L = best.lines, und = [lineInter(L[3], L[0]), lineInter(L[0], L[1]), lineInter(L[1], L[2]), lineInter(L[2], L[3])];
    if (und.some(p => !p)) return { quad: quadPx, k1: 0 };
    const lm = best.lm, dist = und.map(p => lm.distort(p));
    // no aceptar refinamientos que se alejen demasiado
    const maxShift = Math.max(iw, ih) * 0.04;
    if (dist.some((p, i) => Math.hypot(p.x - quadPx[i].x, p.y - quadPx[i].y) > maxShift)) return { quad: quadPx, k1: 0 };
    return { quad: dist, k1: bestK, residual: Math.sqrt(best.err) };
  }

  function detectArtwork(img, targetAspect) {
    const t0 = performance.now();
    const r = findQuad(img, targetAspect);
    if (!r) return null;
    const ref = refine(img, r.quad);
    const quad = orderCorners(ref.quad);
    return {
      corners: quad.map(p => ({ x: p.x / r.iw, y: p.y / r.ih })),
      cornersPx: quad, k1: ref.k1, score: r.score, physAspect: r.phys, aspectMatch: r.prior,
      confidence: Math.min(1, r.score / 0.6), ms: Math.round(performance.now() - t0), candidates: r.candidates
    };
  }

  /* ---------- Homografía 3x3 real ---------- */
  function solve(A, b) { // Gauss con pivoteo parcial
    const n = b.length; A = A.map(r => r.slice()); b = b.slice();
    for (let c = 0; c < n; c++) {
      let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
      if (Math.abs(A[p][c]) < 1e-12) return null;
      [A[c], A[p]] = [A[p], A[c]]; [b[c], b[p]] = [b[p], b[c]];
      for (let r = c + 1; r < n; r++) { const f = A[r][c] / A[c][c]; for (let k = c; k < n; k++) A[r][k] -= f * A[c][k]; b[r] -= f * b[c]; }
    }
    const x = new Array(n);
    for (let r = n - 1; r >= 0; r--) { let s = b[r]; for (let k = r + 1; k < n; k++) s -= A[r][k] * x[k]; x[r] = s / A[r][r]; }
    return x;
  }
  // H tal que dst ~ H * src
  function homography(src, dst) {
    const A = [], b = [];
    for (let i = 0; i < 4; i++) {
      const { x, y } = src[i], u = dst[i].x, v = dst[i].y;
      A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.push(u);
      A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); b.push(v);
    }
    const h = solve(A, b); if (!h) return null;
    return [h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7], 1];
  }
  function applyH(H, x, y) { const w = H[6] * x + H[7] * y + H[8]; return { x: (H[0] * x + H[1] * y + H[2]) / w, y: (H[3] * x + H[4] * y + H[5]) / w }; }

  // Rectificación por mapeo inverso píxel a píxel con muestreo bilineal (+ corrección de lente)
  function warpPerspective(img, cornersPx, outW, outH, k1) {
    const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
    const sc = document.createElement('canvas'); sc.width = iw; sc.height = ih;
    const sctx = sc.getContext('2d', { willReadFrequently: true }); sctx.drawImage(img, 0, 0);
    const S = sctx.getImageData(0, 0, iw, ih).data;
    const lm = lensModel(iw, ih, k1 || 0);
    const und = cornersPx.map(p => lm.undistort(p));
    const H = homography([{ x: 0, y: 0 }, { x: outW, y: 0 }, { x: outW, y: outH }, { x: 0, y: outH }], und);
    const oc = document.createElement('canvas'); oc.width = outW; oc.height = outH;
    const octx = oc.getContext('2d'); const O = octx.createImageData(outW, outH), D = O.data;
    const useLens = !!k1;
    for (let y = 0; y < outH; y++) {
      const yy = y + 0.5;
      for (let x = 0; x < outW; x++) {
        const xx = x + 0.5, w = H[6] * xx + H[7] * yy + H[8];
        let sx = (H[0] * xx + H[1] * yy + H[2]) / w, sy = (H[3] * xx + H[4] * yy + H[5]) / w;
        if (useLens) { const p = lm.distort({ x: sx, y: sy }); sx = p.x; sy = p.y; }
        sx -= 0.5; sy -= 0.5;
        if (sx < 0) sx = 0; if (sy < 0) sy = 0; if (sx > iw - 1.001) sx = iw - 1.001; if (sy > ih - 1.001) sy = ih - 1.001;
        const x0 = sx | 0, y0 = sy | 0, fx = sx - x0, fy = sy - y0;
        const i00 = (y0 * iw + x0) * 4, i10 = i00 + 4, i01 = i00 + iw * 4, i11 = i01 + 4;
        const w00 = (1 - fx) * (1 - fy), w10 = fx * (1 - fy), w01 = (1 - fx) * fy, w11 = fx * fy, o = (y * outW + x) * 4;
        D[o] = S[i00] * w00 + S[i10] * w10 + S[i01] * w01 + S[i11] * w11;
        D[o + 1] = S[i00 + 1] * w00 + S[i10 + 1] * w10 + S[i01 + 1] * w01 + S[i11 + 1] * w11;
        D[o + 2] = S[i00 + 2] * w00 + S[i10 + 2] * w10 + S[i01 + 2] * w01 + S[i11 + 2] * w11;
        D[o + 3] = 255;
      }
    }
    octx.putImageData(O, 0, 0);
    return oc;
  }

  G.FrameDetector = { detectArtwork, homography, applyH, warpPerspective, orderCorners, physicalAspect, lensModel };
})(window);
