// Small, focused helpers for Strapi-driven card rendering

export type ResizeModeRN =
  | 'cover'
  | 'contain'
  | 'stretch'
  | 'repeat'
  | 'center';

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/** Parse "16:9", "3x4", "9/16", or a numeric string into an aspect ratio (w/h). */
export function parseAspect(aspect?: string): number | null {
  if (!aspect) return null;
  const s = String(aspect).trim();
  const m = s.match(/^(\d+)(?:[:x/])(\d+)$/i);
  if (m) {
    const w = Number(m[1]),
      h = Number(m[2]);
    if (w && h) return w / h;
  }
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Convert "81%" or 0.81 into a fraction in [0,1]. */
export function percentToFraction(
  input?: string | number | null,
): number | undefined {
  if (input == null) return undefined;
  if (typeof input === 'number') return clamp01(input);
  const m = String(input)
    .trim()
    .match(/^(\d+(?:\.\d+)?)%$/);
  if (!m) return undefined;
  const v = Number(m[1]) / 100;
  return Number.isFinite(v) ? clamp01(v) : undefined;
}

/** Convert "16px" or a number-like string into a number (px). */
export function pxToNumber(input?: string | number | null): number | undefined {
  if (input == null) return undefined;
  if (typeof input === 'number') return input;
  const s = String(input).trim();
  const m = s.match(/^(\d+(?:\.\d+)?)px$/i);
  if (m) return Number(m[1]);
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

/** Map CSS-ish object-fit to React Native Image resizeMode. */
export function mapFitToRN(fit?: string | null): ResizeModeRN {
  const f = String(fit || '').toLowerCase();
  if (f === 'contain') return 'contain';
  if (f === 'fill') return 'stretch'; // closest equivalent
  if (f === 'scale-down') return 'contain'; // closest equivalent
  if (f === 'none') return 'cover';
  return 'cover';
}

/** Parse strings like "left center", "right top" into axes. */
export function parseBackgroundPosition(pos?: string) {
  const s = String(pos || '').toLowerCase();
  const horiz: 'left' | 'center' | 'right' = /\bright\b/.test(s)
    ? 'right'
    : /\bleft\b/.test(s)
    ? 'left'
    : 'center';
  const vert: 'top' | 'center' | 'bottom' = /\btop\b/.test(s)
    ? 'top'
    : /\bbottom\b/.test(s)
    ? 'bottom'
    : 'center';
  return { horiz, vert } as const;
}

/** Try several places on a playlist item to resolve an image by key. */
export function pickImageByKey(item: any, key?: string | null): string {
  if (!key) return '';
  // 1) extensions map
  const ext = item?.extensions?.[key];
  if (typeof ext === 'string' && ext) return ext;

  // 2) images map
  const img = item?.images?.[key];
  if (typeof img === 'string' && img) return img;

  // 3) media_group array form
  const arr = Array.isArray(item?.media_group) ? item.media_group : null;
  if (arr) {
    const imageGroup = arr.find((g: any) => g?.type === 'image');
    const mi = imageGroup?.media_item?.find?.((m: any) => m?.key === key);
    if (mi?.src) return mi.src;
    const keyed = arr.find((g: any) => g?.key === key);
    if (keyed?.src) return keyed.src;
  }

  // 4) media_group object form
  const obj = item?.media_group?.[key];
  if (obj) {
    if (typeof obj === 'string') return obj;
    if (typeof obj === 'object') return obj.src || obj.url || obj.uri || '';
  }

  // 5) flat field
  const flat = item?.[key];
  if (typeof flat === 'string' && flat) return flat;

  return '';
}
