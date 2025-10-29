// utils/cardUtils.ts  (or cardStyleUtils.ts — keep everything in one place)
import type {
  margin,
  Padding,
  fontStyle,
  titleStyle,
  descriptionStyle,
  badge,
} from '../types/strapitypes';

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
  if (f === 'fill') return 'stretch';
  if (f === 'scale-down') return 'contain';
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
  const ext = item?.extensions?.[key];
  if (typeof ext === 'string' && ext) return ext;
  const img = item?.images?.[key];
  if (typeof img === 'string' && img) return img;

  const arr = Array.isArray(item?.media_group) ? item.media_group : null;
  if (arr) {
    const imageGroup = arr.find((g: any) => g?.type === 'image');
    const mi = imageGroup?.media_item?.find?.((m: any) => m?.key === key);
    if (mi?.src) return mi.src;
    const keyed = arr.find((g: any) => g?.key === key);
    if (keyed?.src) return keyed.src;
  }

  const obj = item?.media_group?.[key];
  if (obj) {
    if (typeof obj === 'string') return obj;
    if (typeof obj === 'object') return obj.src || obj.url || obj.uri || '';
  }

  const flat = item?.[key];
  if (typeof flat === 'string' && flat) return flat;

  return '';
}

/** ---------- New: moved from ContentCard ---------- */
export const boxToOffsets = (b?: margin | Padding | null) => ({
  top: pxToNumber(b?.top) ?? 0,
  right: pxToNumber(b?.right) ?? 0,
  bottom: pxToNumber(b?.bottom) ?? 0,
  left: pxToNumber(b?.left) ?? 0,
});

export const textAlignFrom = (align?: string | null) => {
  const a = String(align || '').toLowerCase();
  if (a === 'center' || a === 'middle') return 'center' as const;
  if (a === 'right') return 'right' as const;
  return 'left' as const;
};

export const styleFromFont = (fs?: fontStyle | null): any => {
  if (!fs) return {};
  const out: any = {};
  if (fs.fontSize != null) out.fontSize = fs.fontSize;
  if (fs.fontWeight) out.fontWeight = fs.fontWeight as any;
  if (fs.fontStyle) out.fontStyle = fs.fontStyle as any;
  if (fs.lineHeight != null) out.lineHeight = fs.lineHeight;
  if (fs.textDecoration) out.textDecorationLine = fs.textDecoration as any;
  if (fs.textTransform) out.textTransform = fs.textTransform as any;
  if (fs.color) out.color = fs.color;
  return out;
};

export const toTextBlockStyle = (
  s?: titleStyle | descriptionStyle | null,
): { viewStyle: any; textStyle: any } => {
  const viewStyle: any = {};
  if (s?.height != null) viewStyle.height = s.height;
  if (s?.width != null) viewStyle.width = s.width;

  const textStyle: any = {
    textAlign: textAlignFrom(s?.align),
    ...(s?.color ? { color: s.color } : {}),
    ...styleFromFont(s?.fontStyle),
  };

  return { viewStyle, textStyle };
};

export const badgeAnchorStyle = (b?: badge | null): any => {
  if (!b) return {};
  const pos = String(b?.position || '').toLowerCase();
  const { top, right, bottom, left } = boxToOffsets(b?.margin);
  const base: any = { position: 'absolute' };

  if (pos.includes('top') && pos.includes('left'))
    return { ...base, top, left };
  if (pos.includes('top') && pos.includes('right'))
    return { ...base, top, right };
  if (pos.includes('bottom') && pos.includes('left'))
    return { ...base, bottom, left };
  if (pos.includes('bottom') && pos.includes('right'))
    return { ...base, bottom, right };

  if (pos === 'top') return { ...base, top, left };
  if (pos === 'bottom') return { ...base, bottom, left };
  if (pos === 'right') return { ...base, top, right };
  return { ...base, top, left };
};

/** Pick title/desc text by key with sensible fallbacks */
export const pickTextByKey = (
  item: any,
  key?: string | null,
  fallback?: string,
): string | undefined => {
  if (!key) return fallback;
  const direct = item?.[key];
  if (typeof direct === 'string' && direct) return direct;
  const ext = item?.extensions?.[key];
  if (typeof ext === 'string' && ext) return ext;
  if (key === 'title') return item?.title ?? fallback;
  if (key === 'summary' || key === 'description' || key === 'desc')
    return item?.desc ?? fallback;
  return fallback;
};
