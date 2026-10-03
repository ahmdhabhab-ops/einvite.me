// Image maths for "Edit text in image" (see ImageTextModal in App.jsx).
// Works on plain RGBA pixel arrays (the data of an ImageData), so it runs
// the same in the browser and in the tests. Nothing here ever changes a
// pixel outside the box the couple drew.

// box = { x, y, w, h } in pixels of the same array (integers).

const idx = (w, x, y) => (y * w + x) * 4;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function median(values) {
  if (!values.length) return 0;
  const s = Float64Array.from(values).sort();
  return s[s.length >> 1];
}

// The background color around the text: the median of the pixels along the
// inside edge of the box, plus how much those pixels vary (to tell real
// letters apart from paper texture or a soft gradient).
export function boxBackground(data, w, h, box) {
  const ring = [];
  const band = Math.max(1, Math.min(3, Math.floor(Math.min(box.w, box.h) / 8)));
  for (let y = box.y; y < box.y + box.h; y++) {
    for (let x = box.x; x < box.x + box.w; x++) {
      const edge = x < box.x + band || x >= box.x + box.w - band || y < box.y + band || y >= box.y + box.h - band;
      if (edge) ring.push(idx(w, x, y));
    }
  }
  const bg = [0, 1, 2].map((c) => median(ring.map((i) => data[i + c])));
  const dists = ring.map((i) => colorDistance(data, i, bg));
  const sorted = Float64Array.from(dists).sort();
  const p85 = sorted[Math.floor(sorted.length * 0.85)] || 0;
  return { color: bg, spread: p85 };
}

function colorDistance(data, i, rgb) {
  const dr = data[i] - rgb[0], dg = data[i + 1] - rgb[1], db = data[i + 2] - rgb[2];
  return Math.sqrt(dr * dr * 0.3 + dg * dg * 0.59 + db * db * 0.11) * 1.7;
}

// Finds the letters inside the box: pixels clearly different from the
// background around them. Returns { mask, bbox } where mask is a Uint8Array
// (1 = remove) of the whole w*h array, widened a little so the soft edges
// of the letters go too, and bbox is the letters' own bounding box (before
// widening). Returns null when it can't tell the letters apart (busy
// photo, or almost nothing found), so the caller can use the whole box.
export function findLetters(data, w, h, box, { grow } = {}) {
  const { color, spread } = boxBackground(data, w, h, box);
  const threshold = Math.max(26, spread * 1.6 + 12);
  const core = new Uint8Array(w * h);
  let count = 0, x1 = Infinity, y1 = Infinity, x2 = -1, y2 = -1;
  for (let y = box.y; y < box.y + box.h; y++) {
    for (let x = box.x; x < box.x + box.w; x++) {
      if (colorDistance(data, idx(w, x, y), color) > threshold) {
        core[y * w + x] = 1;
        count++;
        if (x < x1) x1 = x; if (x > x2) x2 = x;
        if (y < y1) y1 = y; if (y > y2) y2 = y;
      }
    }
  }
  const area = box.w * box.h;
  if (count < Math.max(6, area * 0.004) || count > area * 0.7) return null;
  const r = grow ?? clamp(Math.round(box.h * 0.04), 2, 6);
  const mask = dilate(core, w, h, box, r);
  return { mask, bbox: { x: x1, y: y1, w: x2 - x1 + 1, h: y2 - y1 + 1 }, coverage: count / area, color: letterColor(data, w, core, box, color, threshold) };
}

// The letters' own color: the median of the letter pixels that differ most
// from the background (their solid middle, not the soft edges), as #rrggbb.
function letterColor(data, w, core, box, bg, threshold) {
  const strong = [];
  for (let y = box.y; y < box.y + box.h; y++) {
    for (let x = box.x; x < box.x + box.w; x++) {
      const i = idx(w, x, y);
      if (core[y * w + x] && colorDistance(data, i, bg) > threshold * 1.5) strong.push(i);
    }
  }
  const list = strong.length >= 4 ? strong : [];
  if (!list.length) return null;
  const hex = (v) => Math.round(v).toString(16).padStart(2, "0");
  return `#${[0, 1, 2].map((c) => hex(median(list.map((i) => data[i + c])))).join("")}`;
}

// Every pixel of the box.
export function boxMask(w, h, box) {
  const mask = new Uint8Array(w * h);
  for (let y = box.y; y < box.y + box.h; y++) mask.fill(1, y * w + box.x, y * w + box.x + box.w);
  return mask;
}

// Widens the mask by r pixels (a square brush), but never past the box.
function dilate(src, w, h, box, r) {
  const tmp = new Uint8Array(w * h);
  const out = new Uint8Array(w * h);
  for (let y = box.y; y < box.y + box.h; y++) {
    for (let x = box.x; x < box.x + box.w; x++) {
      let on = 0;
      for (let dx = -r; dx <= r && !on; dx++) {
        const xx = x + dx;
        if (xx >= box.x && xx < box.x + box.w && src[y * w + xx]) on = 1;
      }
      tmp[y * w + x] = on;
    }
  }
  for (let y = box.y; y < box.y + box.h; y++) {
    for (let x = box.x; x < box.x + box.w; x++) {
      let on = 0;
      for (let dy = -r; dy <= r && !on; dy++) {
        const yy = y + dy;
        if (yy >= box.y && yy < box.y + box.h && tmp[yy * w + x]) on = 1;
      }
      out[y * w + x] = on;
    }
  }
  return out;
}

// "Quick fill": paints over the masked pixels with the colors around them,
// from the edge of each hole inwards, then softens the result and adds a
// little grain like the surrounding area so it doesn't look flat. Good on
// plain colors, gradients and paper; on detailed photos the AI erase does
// better. Returns a new array; `data` isn't changed.
export function quickFill(data, w, h, mask, box, { seed = 1 } = {}) {
  const out = new Uint8ClampedArray(data);
  const known = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) known[i] = mask[i] ? 0 : 1;
  // The first ring of holes: masked pixels next to a known one. Each pass
  // fills the current ring from its known neighbours, then moves one pixel
  // further in.
  const queued = new Uint8Array(w * h);
  let frontier = [];
  const enqueueAround = (x, y, list) => {
    for (let dy = -1; dy <= 1; dy++) {
      const yy = y + dy;
      if (yy < box.y || yy >= box.y + box.h) continue;
      for (let dx = -1; dx <= 1; dx++) {
        const xx = x + dx;
        if (xx < box.x || xx >= box.x + box.w) continue;
        const q = yy * w + xx;
        if (!known[q] && !queued[q]) { queued[q] = 1; list.push(q); }
      }
    }
  };
  for (let y = box.y; y < box.y + box.h; y++) {
    for (let x = box.x; x < box.x + box.w; x++) {
      const p = y * w + x;
      if (known[p] || queued[p]) continue;
      let touches = false;
      for (let dy = -1; dy <= 1 && !touches; dy++) for (let dx = -1; dx <= 1 && !touches; dx++) {
        const xx = x + dx, yy = y + dy;
        if (xx >= 0 && xx < w && yy >= 0 && yy < h && known[yy * w + xx]) touches = true;
      }
      if (touches) { queued[p] = 1; frontier.push(p); }
    }
  }
  const filledOrder = [];
  while (frontier.length) {
    const values = [];
    for (const p of frontier) {
      const x = p % w, y = (p - x) / w;
      let r = 0, g = 0, b = 0, a = 0, wsum = 0;
      for (let dy = -1; dy <= 1; dy++) {
        const yy = y + dy;
        if (yy < 0 || yy >= h) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx;
          if ((!dx && !dy) || xx < 0 || xx >= w) continue;
          const q = yy * w + xx;
          if (!known[q]) continue;
          const wt = dx && dy ? 0.7 : 1;
          const i = q * 4;
          r += out[i] * wt; g += out[i + 1] * wt; b += out[i + 2] * wt; a += out[i + 3] * wt; wsum += wt;
        }
      }
      values.push(wsum > 0 ? [r / wsum, g / wsum, b / wsum, a / wsum] : null);
    }
    const next = [];
    const filledNow = [];
    frontier.forEach((p, k) => {
      const v = values[k];
      if (!v) { queued[p] = 0; return; } // reached again from a filled neighbour later
      const i = p * 4;
      out[i] = v[0]; out[i + 1] = v[1]; out[i + 2] = v[2]; out[i + 3] = v[3];
      known[p] = 1;
      filledOrder.push(p);
      filledNow.push(p);
    });
    for (const p of filledNow) {
      const x = p % w;
      enqueueAround(x, (p - x) / w, next);
    }
    if (!filledNow.length) break; // a hole with no known pixel around it at all
    frontier = next;
  }
  // Soften the streaks the edge-inwards fill leaves (filled pixels only).
  for (let pass = 0; pass < 2; pass++) {
    const src = new Uint8ClampedArray(out);
    for (const p of filledOrder) {
      const x = p % w, y = (p - x) / w;
      let r = 0, g = 0, b = 0, a = 0, n = 0;
      for (let dy = -2; dy <= 2; dy++) {
        const yy = y + dy;
        if (yy < 0 || yy >= h) continue;
        for (let dx = -2; dx <= 2; dx++) {
          const xx = x + dx;
          if (xx < 0 || xx >= w) continue;
          const i = (yy * w + xx) * 4;
          r += src[i]; g += src[i + 1]; b += src[i + 2]; a += src[i + 3]; n++;
        }
      }
      const i = p * 4;
      out[i] = r / n; out[i + 1] = g / n; out[i + 2] = b / n; out[i + 3] = a / n;
    }
  }
  // Grain like the untouched pixels around the box.
  const grain = surroundingGrain(data, w, h, mask, box);
  if (grain > 1.5) {
    let s = seed >>> 0 || 1;
    const rand = () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
    for (const p of filledOrder) {
      const n = (rand() + rand() + rand() - 1.5) * grain * 1.2;
      const i = p * 4;
      out[i] += n; out[i + 1] += n; out[i + 2] += n;
    }
  }
  return out;
}

// How grainy the untouched pixels near the box are: the average difference
// between neighbouring pixels.
function surroundingGrain(data, w, h, mask, box) {
  let sum = 0, n = 0;
  for (let y = box.y; y < box.y + box.h; y++) {
    for (let x = box.x; x < box.x + box.w - 1; x++) {
      const p = y * w + x;
      if (mask[p] || mask[p + 1]) continue;
      const i = p * 4;
      sum += Math.abs(data[i] - data[i + 4]) + Math.abs(data[i + 1] - data[i + 5]) + Math.abs(data[i + 2] - data[i + 6]);
      n += 3;
    }
  }
  return n ? Math.min(12, sum / n) : 0;
}

// Puts `edited` over `original` only where the mask is on, with a soft
// edge `feather` pixels wide, and never outside the box. Returns a new
// array; every pixel outside the box is exactly the original.
export function blendInBox(original, edited, w, h, mask, box, feather = 0) {
  const out = new Uint8ClampedArray(original);
  const alpha = feather > 0 ? softMask(mask, w, h, box, feather) : null;
  for (let y = box.y; y < box.y + box.h; y++) {
    for (let x = box.x; x < box.x + box.w; x++) {
      const p = y * w + x;
      const a = alpha ? alpha[p] : mask[p];
      if (!a) continue;
      const i = p * 4;
      for (let c = 0; c < 4; c++) out[i + c] = original[i + c] + (edited[i + c] - original[i + c]) * a;
    }
  }
  return out;
}

// The mask blurred by `r` pixels (values 0..1), inside the box only. The
// mask's own pixels stay fully on; only the area just around them fades.
function softMask(mask, w, h, box, r) {
  const out = new Float32Array(w * h);
  for (let y = box.y; y < box.y + box.h; y++) {
    for (let x = box.x; x < box.x + box.w; x++) {
      const p = y * w + x;
      if (mask[p]) { out[p] = 1; continue; }
      let best = Infinity;
      for (let dy = -r; dy <= r; dy++) {
        const yy = y + dy;
        if (yy < box.y || yy >= box.y + box.h) continue;
        for (let dx = -r; dx <= r; dx++) {
          const xx = x + dx;
          if (xx < box.x || xx >= box.x + box.w) continue;
          if (mask[yy * w + xx]) best = Math.min(best, Math.hypot(dx, dy));
        }
      }
      if (best <= r) out[p] = 1 - best / (r + 1);
    }
  }
  return out;
}

// Font size (in the same pixels as the box) for `lines` lines of text that
// fill a box `height` tall, for the Builder's line height of 1.4.
export function fontSizeForLines(height, lines) {
  const n = Math.max(1, lines);
  return height / ((n - 1) * 1.4 + 1.05);
}
