// components/VerticalCard.tsx
import React, { memo, useMemo } from 'react';
import { View, Image, Text } from 'react-native';
import type {
  AcardStyle,
  PlaylistItem,
  margin,
  Padding,
  titleStyle as TitleStyleT,
  descriptionStyle as DescStyleT,
  fontStyle as FontStyleT,
  badge as BadgeT,
} from '../types/strapitypes';

type Props = {
  content: PlaylistItem | PlaylistItem[];
  cardStyle: AcardStyle;
  index?: number;
};

/** ---------- helpers ---------- */
const toNum = (v: any): number | undefined =>
  typeof v === 'number'
    ? v
    : typeof v === 'string' && v.trim() !== ''
    ? Number(v)
    : undefined;

const parseAspect = (aspect?: string | null): number | undefined => {
  if (!aspect) return undefined;
  const m = String(aspect).match(/(\d+)\D+(\d+)/);
  if (!m) return undefined;
  const w = Number(m[1]),
    h = Number(m[2]);
  return w && h ? w / h : undefined;
};

const pickByKey = (item: any, key?: string | null): string | undefined => {
  if (!key) return undefined;
  const ext = item?.extensions?.[key];
  if (typeof ext === 'string' && ext) return ext;
  const img = item?.images?.[key];
  if (typeof img === 'string' && img) return img;
  const mediaItems =
    item?.media_group?.find((g: any) => g.type === 'image')?.media_item || [];
  const found = mediaItems.find((mi: any) => mi.key === key);
  return found?.src;
};

const pickText = (
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

const boxToOffsets = (b?: margin | Padding | null) => ({
  top: toNum(b?.top) ?? 0,
  right: toNum(b?.right) ?? 0,
  bottom: toNum(b?.bottom) ?? 0,
  left: toNum(b?.left) ?? 0,
});

const textAlignFrom = (align?: string | null) => {
  const a = String(align || '').toLowerCase();
  if (a === 'center' || a === 'middle') return 'center' as const;
  if (a === 'right') return 'right' as const;
  return 'left' as const;
};

const styleFromFont = (fs?: FontStyleT | null): any => {
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

const toTextBlockStyle = (s?: TitleStyleT | DescStyleT | null): any => ({
  textAlign: textAlignFrom(s?.align),
  ...(s?.color ? { color: s.color } : {}),
  ...styleFromFont(s?.fontStyle),
});

const badgeAnchorStyle = (b?: BadgeT | null): any => {
  if (!b) return {};
  const pos = String(b.position || '').toLowerCase();
  const { top, right, bottom, left } = boxToOffsets(b.margin);
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

/** ---------- component (single or list) ---------- */
const VerticalCard = memo(({ content, cardStyle }: Props) => {
  const playlist: PlaylistItem[] = Array.isArray(content) ? content : [content];

  // shared, from cardStyle only
  const borderRadius = toNum(cardStyle?.borderStyle?.borderRadius);
  const containerW = toNum(cardStyle?.container?.width);
  const containerH = toNum(cardStyle?.container?.height);
  const aspectFromWH =
    containerW && containerH ? containerW / containerH : undefined;
  const aspect =
    parseAspect(cardStyle?.mainImage?.aspectRatio) ?? aspectFromWH ?? 16 / 9;

  //   const gap = toNum(cardStyle?.container?.gap) ?? 0;

  const titleDefault = toTextBlockStyle(cardStyle?.titleStyle);
  const descDefault = toTextBlockStyle(cardStyle?.descriptionStyle);

  const primaryKey =
    cardStyle?.mainImage?.sourceKey ?? cardStyle?.imageKey ?? null;
  const secondaryKey =
    cardStyle?.secondaryImage?.sourceKey ??
    cardStyle?.secondaryImageKey ??
    null;

  const mainW = toNum(cardStyle?.mainImage?.width);
  const mainH = toNum(cardStyle?.mainImage?.height);
  const mainMargin = boxToOffsets(cardStyle?.mainImage?.mainImageMargin);
  const secondaryW = toNum(cardStyle?.secondaryImage?.width);
  const secondaryH = toNum(cardStyle?.secondaryImage?.height);
  const secondaryMargin = boxToOffsets(cardStyle?.secondaryImage?.imageMargin);

  const rawBadge = cardStyle?.badgeStyle as any;
  const badges: BadgeT[] = Array.isArray(rawBadge)
    ? rawBadge
    : rawBadge
    ? [rawBadge]
    : [];

  const bgFirst = !!cardStyle.useSecondaryAsBackground;

  return (
    <>
      {playlist.map((item, i) => {
        const primaryUri = useMemo(
          () => pickByKey(item, primaryKey),
          [item, primaryKey],
        );
        const secondaryUri = useMemo(
          () => pickByKey(item, secondaryKey),
          [item, secondaryKey],
        );

        // up to 4 lines (from titleLines; fallback to title/description)
        const configuredLines: Array<{
          text?: string;
          style?: TitleStyleT | null;
        }> =
          (cardStyle as any)?.titleLines?.slice?.(0, 4)?.map((ln: any) => ({
            text: pickText(item, ln?.sourceKey),
            style: ln?.style ?? null,
          })) ?? [];

        if (!configuredLines.length) {
          const titleText = cardStyle.showTitle
            ? pickText(item, cardStyle?.titleSourceKey, item?.title)
            : undefined;
          const descText = cardStyle.showDescription
            ? pickText(item, cardStyle?.descriptionSourceKey, item?.desc)
            : undefined;
          if (titleText)
            configuredLines.push({
              text: titleText,
              style: cardStyle?.titleStyle as any,
            });
          if (descText)
            configuredLines.push({
              text: descText,
              style: cardStyle?.descriptionStyle as any,
            });
        }

        const titleLines = configuredLines.filter(l => !!l.text).slice(0, 4);

        return (
          <View
            key={item?.id?.toString?.() ?? String(i)}
            style={{ flexDirection: 'row', alignItems: 'center' }}
          >
            {/* LEFT: image block */}
            <View
              style={{
                aspectRatio: aspect,
                width: containerW,
                height: containerH,
                borderRadius,
                borderWidth: 2,
                // borderColor: '#e40808ff',
                overflow: 'hidden',
                paddingTop: 5,
                paddingRight: 5,
                paddingBottom: 5,
                paddingLeft: 5,
                marginTop: 5,
                marginRight: 5,
                marginBottom: 5,
                marginLeft: 15,
              }}
            >
              {bgFirst ? (
                <>
                  {!!secondaryUri && (
                    <Image
                      source={{ uri: secondaryUri }}
                      style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        bottom: 0,
                        left: 0,
                        borderRadius,
                      }}
                      resizeMode="cover"
                    />
                  )}
                  {!!primaryUri && (
                    <Image
                      source={{ uri: primaryUri }}
                      style={
                        mainW && mainH
                          ? {
                              width: mainW,
                              height: mainH,
                              marginTop: mainMargin.top,
                              marginRight: mainMargin.right,
                              marginBottom: mainMargin.bottom,
                              marginLeft: mainMargin.left,
                              borderRadius,
                              position: 'absolute',
                            }
                          : {
                              position: 'absolute',
                              top: 0,
                              right: 0,
                              bottom: 0,
                              left: 0,
                              borderRadius,
                            }
                      }
                      resizeMode={mainW && mainH ? 'contain' : 'cover'}
                    />
                  )}
                </>
              ) : (
                <>
                  {!!primaryUri && (
                    <Image
                      source={{ uri: primaryUri }}
                      style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        bottom: 0,
                        left: 0,
                        borderRadius,
                      }}
                      resizeMode="cover"
                    />
                  )}
                  {!!secondaryUri && (
                    <Image
                      source={{ uri: secondaryUri }}
                      style={
                        secondaryW && secondaryH
                          ? {
                              width: secondaryW,
                              height: secondaryH,
                              marginTop: secondaryMargin.top,
                              marginRight: secondaryMargin.right,
                              marginBottom: secondaryMargin.bottom,
                              marginLeft: secondaryMargin.left,
                              borderRadius,
                              position: 'absolute',
                            }
                          : {
                              position: 'absolute',
                              top: 0,
                              right: 0,
                              bottom: 0,
                              left: 0,
                              borderRadius,
                            }
                      }
                      resizeMode={
                        secondaryW && secondaryH ? 'contain' : 'cover'
                      }
                    />
                  )}
                </>
              )}

              {/* Badges */}
              {badges.map((b, bi) => {
                const anchor = badgeAnchorStyle(b);
                const labelColor =
                  b?.labelStyle?.fontStyle?.color ??
                  b?.labelStyle?.color ??
                  undefined;
                const fontBlock = styleFromFont(b?.labelStyle?.fontStyle);
                const h = toNum(b?.height);
                const w = toNum(b?.width);
                return (
                  <View
                    key={`badge-${bi}`}
                    style={{
                      ...anchor,
                      minHeight: h ?? undefined,
                      minWidth: w ?? undefined,
                      backgroundColor: 'transparent',
                      borderRadius,
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                    }}
                  >
                    {!!b?.label && (
                      <Text
                        numberOfLines={1}
                        style={[{ color: labelColor }, fontBlock]}
                      >
                        {b.label}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>

            {/* GAP from cardStyle.container.gap */}
            <View style={{ width: 10, height: 1, opacity: 1 }} />

            {/* RIGHT: up to 4 lines */}
            <View style={{ flex: 1, justifyContent: 'center' }}>
              {titleLines.map((ln, idx) => {
                const lineStyle = toTextBlockStyle(ln?.style ?? null);
                const baseStyle = ln?.style
                  ? lineStyle
                  : idx === 0
                  ? titleDefault
                  : descDefault;
                return (
                  <Text key={`line-${idx}`} numberOfLines={1} style={baseStyle}>
                    {ln.text}
                  </Text>
                );
              })}
            </View>
          </View>
        );
      })}
    </>
  );
});

export default VerticalCard;
