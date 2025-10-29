// services/cardStyleMapper.ts
// Converts Strapi MCardStyle → AcardStyle

import type {
  MCardStyle,
  AcardStyle,
  border,
  margin,
  Padding,
  badge,
  titleStyle,
  descriptionStyle,
  cardStyle,
} from '../types/strapitypes';

// ── tiny helpers ─────────────────────────────────────────────────────────
const toNum = (v: any): number | null =>
  typeof v === 'number'
    ? v
    : typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))
    ? Number(v)
    : null;

const isNonEmptyObject = (v: any) =>
  v && typeof v === 'object' && Object.keys(v).length > 0;

const pickBorder = (v: any | null | undefined): border | undefined => {
  // console.log({ v });
  if (!isNonEmptyObject(v)) return undefined;
  const out: border = {
    id: v.id ?? undefined,
    borderStyle: v.borderStyle ?? v.style ?? null,
    borderWidth: toNum(v.borderWidth),
    borderColor: v.borderColor ?? null,
    borderRadius:
      toNum(v.borderRadius) ??
      (typeof v.borderRadius === 'string' ? v.borderRadius : null),
  };
  // If all are null/undefined except id, treat as empty
  const hasAny =
    out.borderStyle != null ||
    out.borderWidth != null ||
    out.borderColor != null ||
    out.borderRadius != null;
  return hasAny ? out : undefined;
};

const pickMargin = (m?: margin | null): margin | null =>
  m
    ? {
        id: m.id,
        top: toNum(m.top),
        right: toNum(m.right),
        bottom: toNum(m.bottom),
        left: toNum(m.left),
      }
    : null;

const pickPadding = (p?: Padding | null): Padding | null =>
  p
    ? {
        id: p.id,
        top: toNum(p.top),
        right: toNum(p.right),
        bottom: toNum(p.bottom),
        left: toNum(p.left),
      }
    : null;

// Some Strapi collections use `badgeStyle` as an array; your type says `badge`.
// We'll normalize by taking the first item if it's an array.
const normalizeBadge = (v: any): badge | null => {
  if (!v) return null;
  const raw = Array.isArray(v) ? v[0] : v;
  if (!isNonEmptyObject(raw)) return null;
  return {
    id: raw.id,
    label: raw.label ?? null,
    position: raw.position ?? null,
    height: toNum(raw.height),
    width: toNum(raw.width),
    labelStyle: isNonEmptyObject(raw.labelStyle)
      ? {
          id: raw.labelStyle.id,
          color: raw.labelStyle.color ?? null,
          height: toNum(raw.labelStyle.height),
          width: toNum(raw.labelStyle.width),
          align: raw.labelStyle.align ?? null,
          fontStyle: isNonEmptyObject(raw.labelStyle.fontStyle)
            ? {
                id: raw.labelStyle.fontStyle.id,
                fontSize: toNum(raw.labelStyle.fontStyle.fontSize),
                fontWeight: raw.labelStyle.fontStyle.fontWeight ?? null,
                fontStyle: raw.labelStyle.fontStyle.fontStyle ?? null,
                lineHeight: toNum(raw.labelStyle.fontStyle.lineHeight),
                textTransform: raw.labelStyle.fontStyle.textTransform ?? null,
                textDecoration: raw.labelStyle.fontStyle.textDecoration ?? null,
                color: raw.labelStyle.fontStyle.color ?? null,
              }
            : null,
        }
      : null,
    margin: pickMargin(raw.margin),
  };
};

const normalizeTitleStyle = (v: any): titleStyle | null => {
  if (!isNonEmptyObject(v)) return null;
  return {
    id: v.id,
    color: v.color ?? null,
    height: toNum(v.height),
    width: toNum(v.width),
    align: v.align ?? null,
    fontStyle: isNonEmptyObject(v.fontStyle)
      ? {
          id: v.fontStyle.id,
          fontSize: toNum(v.fontStyle.fontSize),
          fontWeight: v.fontStyle.fontWeight ?? null,
          fontStyle: v.fontStyle.fontStyle ?? null,
          lineHeight: toNum(v.fontStyle.lineHeight),
          textTransform: v.fontStyle.textTransform ?? null,
          textDecoration: v.fontStyle.textDecoration ?? null,
          color: v.fontStyle.color ?? null,
        }
      : null,
  };
};

const normalizeDescriptionStyle = (v: any): descriptionStyle | null => {
  if (!isNonEmptyObject(v)) return null;
  return {
    id: v.id,
    color: v.color ?? null,
    height: toNum(v.height),
    width: toNum(v.width),
    align: v.align ?? null,
    fontStyle: isNonEmptyObject(v.fontStyle)
      ? {
          id: v.fontStyle.id,
          fontSize: toNum(v.fontStyle.fontSize),
          fontWeight: v.fontStyle.fontWeight ?? null,
          fontStyle: v.fontStyle.fontStyle ?? null,
          lineHeight: toNum(v.fontStyle.lineHeight),
          textTransform: v.fontStyle.textTransform ?? null,
          textDecoration: v.fontStyle.textDecoration ?? null,
          color: v.fontStyle.color ?? null,
        }
      : null,
  };
};

const normalizeImageBlock = (img: any | null | undefined) => {
  if (!img) return null;
  return {
    id: img.id,
    sourceKey: img.sourceKey ?? null,
    aspectRatio: img.aspectRatio ?? null,
    height: toNum(img.height),
    width: toNum(img.width),
    margin: pickMargin(img.margin),
    padding: pickPadding(img.padding),
  };
};

const normalizeSecondaryImageBlock = (img: any | null | undefined) => {
  if (!img) return null;
  return {
    id: img.id,
    sourceKey: img.sourceKey ?? null,
    height: toNum(img.height),
    width: toNum(img.width),
    imagePosition: img.imagePosition ?? null,
    margin: pickMargin(img.margin),
    padding: pickPadding(img.padding),
    opacity: toNum(img.opacity),
  };
};

// ── main mapper ──────────────────────────────────────────────────────────────
export function toAcardStyle(input: MCardStyle): AcardStyle {
  const cs: cardStyle | null = input.cardStyle ?? null;

  const image = normalizeImageBlock(cs?.image);
  const secondary = normalizeSecondaryImageBlock(cs?.secondaryImage);

  const border = pickBorder(cs?.borderStyle);

  const titleStyle = normalizeTitleStyle(cs?.titleStyle);
  const descriptionStyle = normalizeDescriptionStyle(cs?.descriptionStyle);
  const badgeStyle = normalizeBadge(
    (cs as any)?.badgeStyle ?? (cs as any)?.badgestyle,
  );

  // Decide container size; prefer explicit width/height, else fall back to image dims
  const containerWidth = toNum(cs?.width) ?? image?.width ?? null;
  const containerHeight = toNum(cs?.height) ?? image?.height ?? null;

  const acard: AcardStyle = {
    presetName: input.name || '',
    imageKey: image?.sourceKey ?? null,
    secondaryImageKey: secondary?.sourceKey ?? null,

    container: {
      width: containerWidth,
      height: containerHeight,
    },

    mainImage: {
      sourceKey: image?.sourceKey ?? null,
      aspectRatio: image?.aspectRatio ?? null,
      height: image?.height ?? null,
      width: image?.width ?? null,
      mainImageMargin: {
        id: image?.margin?.id,
        top: image?.margin?.top ?? null,
        right: image?.margin?.right ?? null,
        bottom: image?.margin?.bottom ?? null,
        left: image?.margin?.left ?? null,
      },
      mainImagePadding: {
        id: image?.padding?.id,
        top: image?.padding?.top ?? null,
        right: image?.padding?.right ?? null,
        bottom: image?.padding?.bottom ?? null,
        left: image?.padding?.left ?? null,
      },
    },

    secondaryImage: {
      sourceKey: secondary?.sourceKey ?? null,
      height: secondary?.height ?? null,
      width: secondary?.width ?? null,
      imagePosition: secondary?.imagePosition ?? null,
      imageMargin: {
        id: secondary?.margin?.id,
        top: secondary?.margin?.top ?? null,
        right: secondary?.margin?.right ?? null,
        bottom: secondary?.margin?.bottom ?? null,
        left: secondary?.margin?.left ?? null,
      },
      imagePadding: {
        id: secondary?.padding?.id,
        top: secondary?.padding?.top ?? null,
        right: secondary?.padding?.right ?? null,
        bottom: secondary?.padding?.bottom ?? null,
        left: secondary?.padding?.left ?? null,
      },
    },

    useSecondaryAsBackground: false, // can be toggled later if you support that behavior
    titleSourceKey: cs?.titleSourceKey ?? null,
    descriptionSourceKey: cs?.descriptionSourceKey ?? null,
    showTitle: !!cs?.showTitle,
    showDescription: !!cs?.showDescription,
    showBadges: !!cs?.showBadges,

    borderStyle: border,
    titleStyle,
    descriptionStyle,
    badgeStyle,
  };

  return acard;
}

// Optional: bulk map convenience
// export function mapStrapiListToAcardStyles(
//   list: Array<MCardStyle>,
// ): Array<AcardStyle> {
//   return list.map(toAcardStyle);
// }

export function findCardStyleForListPreset(
  listPresetName: string,
  cards: any[],
): AcardStyle | undefined {
  const wanted = (listPresetName || '').toLowerCase();
  const normalized = (cards || []).map(toAcardStyle);
  return normalized.find(c => (c.presetName || '').toLowerCase() === wanted);
}
