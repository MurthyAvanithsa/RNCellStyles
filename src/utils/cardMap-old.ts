// utils/cardMap.ts
import type {
  MCardStyle,
  AcardStyle,
  border as Border, // avoid name shadowing
  Padding,
  margin,
} from '../types/strapitypes';

/** number-like -> number | null */
const toNum = (v: unknown): number | null => {
  if (v == null) return null;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/** Always return a box object (no null) */
const toBox = <T extends margin | Padding | null | undefined>(b: T) => ({
  id: b?.id,
  top: b?.top ?? null,
  right: b?.right ?? null,
  bottom: b?.bottom ?? null,
  left: b?.left ?? null,
});

/** Convert possible legacy {borderStyle,...} to Border */
const normalizeBorder = (cs: any): Border | undefined => {
  if (cs?.border) return cs.border as Border;

  const b = cs?.borderStyle ?? cs?.border_style ?? null;
  if (!b || typeof b !== 'object') return undefined;

  return {
    borderStyle: b.borderStyle ?? b.style ?? null,
    borderWidth: toNum(b.borderWidth ?? b.width),
    borderColor: b.borderColor ?? b.color ?? null,
    borderRadius: toNum(b.borderRadius ?? b.radius),
  };
};

/** Prefer single badge, but accept arrays (badgeStyle) */
const normalizeBadge = (cs: any): any => {
  if (cs?.badge) return cs.badge;
  if (Array.isArray(cs?.badgeStyle)) return cs.badgeStyle;
  return undefined;
};

/** Mobile (MCardStyle or close-enough) -> AcardStyle */
export function toAcardStyle(input: any): AcardStyle {
  const cs = (input?.cardStyle ?? {}) as any;

  // Primary / secondary keys (also mirrored at top-level)
  const primarySourceKey = cs?.image?.sourceKey;

  const secondarySourceKey = cs?.secondaryImage?.sourceKey;

  const containerWidth = toNum(cs.width);

  const containerHeight = toNum(cs.height);

  // console.log({
  //   cs: cs,
  //   containerWidth: containerWidth,
  //   containerHeight: containerHeight,
  // });

  const border: Border | undefined = normalizeBorder(cs);

  const container: AcardStyle['container'] = {
    width: containerWidth,
    height: containerHeight,
  };

  const mainImage: AcardStyle['mainImage'] = {
    sourceKey: primarySourceKey,
    aspectRatio: cs?.image?.aspectRatio,
    mainImageMargin: toBox(cs?.image?.margin),
    mainImagePadding: toBox(cs?.image?.padding),
  };

  const secondaryImage: AcardStyle['secondaryImage'] = {
    sourceKey: secondarySourceKey,
    height: toNum(cs?.secondaryImage?.height),
    width: toNum(cs?.secondaryImage?.width),
    imagePosition:
      cs?.secondaryImage?.imagePosition ?? cs?.secondaryImage?.position ?? null,
    imageMargin: toBox(cs?.secondaryImage?.margin),
    imagePadding: toBox(cs?.secondaryImage?.padding),
  };

  const result = {
    presetName: input?.cardName ?? input?.name ?? '',

    // mirrors for compatibility with callers expecting keys
    imageKey: primarySourceKey,
    secondaryImageKey: secondarySourceKey,

    container,
    mainImage,
    secondaryImage,

    // Flags / content toggles
    useSecondaryAsBackground: false, // mobile schema uses `useSecondaryImage`, not "as background"
    titleSorceKey: cs?.titleSourceKey ?? null, // (spelling matches your type)
    descriptionSourceKey: cs?.descriptionSourceKey ?? null,
    showTitle: Boolean(cs?.showTitle),
    showDescription: Boolean(cs?.showDescription),
    showBadges: Boolean(cs?.showBadges),

    // Top-level spacing & styles passthrough
    border,

    titleStyle: cs?.titleStyle ?? undefined,
    descriptionStyle: cs?.descriptionStyle ?? undefined,
    badge: normalizeBadge(cs),
  } as AcardStyle & {};

  return result;
}

/** Find by preset name from ANY card settings array (normalizes first) */
export function findCardStyleForListPreset(
  listPresetName: string,
  cards: any[],
): AcardStyle | undefined {
  const wanted = (listPresetName || '').toLowerCase();
  const normalized = (cards || []).map(toAcardStyle);
  return normalized.find(c => (c.presetName || '').toLowerCase() === wanted);
}
