interface Rgb {
  r: number;
  g: number;
  b: number;
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

function rgbToHsl({ r, g, b }: Rgb) {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255];
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  return { h: h / 6, s, l };
}

function hslToHex(h: number, s: number, l: number) {
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    const a = s * Math.min(l, 1 - l);
    const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(c * 255)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function hexToRgb(hex: string): Rgb | null {
  const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex.trim());
  if (!m) return null;
  return {
    r: Number.parseInt(m[1] ?? "0", 16),
    g: Number.parseInt(m[2] ?? "0", 16),
    b: Number.parseInt(m[3] ?? "0", 16),
  };
}

/** WCAG 2.x relative luminance */
function luminance({ r, g, b }: Rgb): number {
  const lin = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrastRatio(a: Rgb, b: Rgb): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** Text contrast (WCAG AA, normal text). */
export const MIN_CONTRAST = 4.5;

/**
 * Turn a raw artwork color into an accent that stays legible on the theme:
 * keep the hue, tame the saturation, then walk the lightness away from the
 * background until accent-on-background (and the reverse, on-accent text on
 * an accent button, which uses the background color) reaches 4.5:1.
 */
export function fitAccent(rgb: Rgb, backgroundHex: string): string {
  const bg = hexToRgb(backgroundHex) ?? { r: 18, g: 17, b: 16 };
  const dark = luminance(bg) < 0.2;
  const { h, s, l } = rgbToHsl(rgb);
  const sat = clamp(s, 0.35, 0.8);
  let light = dark ? clamp(l, 0.62, 0.76) : clamp(l, 0.3, 0.42);
  for (let i = 0; i < 40; i++) {
    const hex = hslToHex(h, sat, light);
    const c = hexToRgb(hex);
    if (c && contrastRatio(c, bg) >= MIN_CONTRAST) return hex;
    light = clamp(light + (dark ? 0.02 : -0.02), 0, 1);
  }
  return hslToHex(h, sat, light);
}

/** Average color of an image, weighted toward saturated pixels. Null if the image is tainted. */
export function sampleImageColor(img: HTMLImageElement): Rgb | null {
  const size = 24;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  try {
    ctx.drawImage(img, 0, 0, size, size);
    const { data } = ctx.getImageData(0, 0, size, size);
    let r = 0;
    let g = 0;
    let b = 0;
    let weight = 0;
    for (let i = 0; i < data.length; i += 4) {
      const pr = data[i] ?? 0;
      const pg = data[i + 1] ?? 0;
      const pb = data[i + 2] ?? 0;
      const w = 0.15 + (Math.max(pr, pg, pb) - Math.min(pr, pg, pb)) / 255;
      r += pr * w;
      g += pg * w;
      b += pb * w;
      weight += w;
    }
    return { r: r / weight, g: g / weight, b: b / weight };
  } catch {
    return null; // cross-origin image without CORS headers
  }
}
