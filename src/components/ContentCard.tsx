// components/ContentCard.tsx
import React, { memo, useMemo } from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';
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
  content: PlaylistItem;
  cardStyle: AcardStyle;
  index?: number;
};

/** ---- helpers ---- */
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
  const w = Number(m[1]);
  const h = Number(m[2]);
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

const toTextBlockStyle = (
  s?: TitleStyleT | DescStyleT | null,
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

const badgeAnchorStyle = (b?: BadgeT | null): any => {
  if (!b) return {};
  const pos = String(b.position || '').toLowerCase();
  const m = b.margin;
  const { top, right, bottom, left } = boxToOffsets(m);
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

/** ---- component ---- */
const ContentCard = memo(({ content, cardStyle }: Props) => {
  const borderRadius = toNum(cardStyle?.borderStyle?.borderRadius);

  console.log({ cardStyle });
  // Primary / secondary keys (from normalized AcardStyle)
  const primaryKey =
    cardStyle?.mainImage?.sourceKey ?? cardStyle?.imageKey ?? null;
  const secondaryKey =
    cardStyle?.secondaryImage?.sourceKey ??
    cardStyle?.secondaryImageKey ??
    null;

  const primaryUri = useMemo(
    () => pickByKey(content, primaryKey),
    [content, primaryKey],
  );
  const secondaryUri = useMemo(
    () => pickByKey(content, secondaryKey),
    [content, secondaryKey],
  );

  // Text
  const titleText = cardStyle.showTitle
    ? pickText(content, cardStyle?.titleSourceKey, content?.title)
    : undefined;

  const descText = cardStyle.showDescription
    ? pickText(content, cardStyle?.descriptionSourceKey, content?.desc)
    : undefined;

  // Aspect ratio: prefer mainImage.aspectRatio → container W/H → default 16:9
  const containerW = toNum(cardStyle?.container?.width);
  const containerH = toNum(cardStyle?.container?.height);
  const aspectFromWH =
    containerW && containerH ? containerW / containerH : undefined;
  const aspect =
    parseAspect(cardStyle?.mainImage?.aspectRatio) ?? aspectFromWH ?? 16 / 9;

  // image sizing/margins
  const mainW = toNum(cardStyle?.mainImage?.width);
  const mainH = toNum(cardStyle?.mainImage?.height);
  const mainMargin = boxToOffsets(cardStyle?.mainImage?.mainImageMargin);
  const secondaryW = toNum(cardStyle?.secondaryImage?.width);
  const secondaryH = toNum(cardStyle?.secondaryImage?.height);
  const secondaryMargin = boxToOffsets(cardStyle?.secondaryImage?.imageMargin);

  // Text styles
  const { viewStyle: titleViewStyle, textStyle: titleTextStyle } =
    toTextBlockStyle(cardStyle?.titleStyle);
  const { viewStyle: descViewStyle, textStyle: descTextStyle } =
    toTextBlockStyle(cardStyle?.descriptionStyle);

  // Badges: mapper yields single badge or null; support array too just in case
  const rawBadge = cardStyle?.badgeStyle as any;
  const badges: BadgeT[] = Array.isArray(rawBadge)
    ? rawBadge
    : rawBadge
    ? [rawBadge]
    : [];

  // Render order based on `useSecondaryAsBackground`
  const bgFirst = !!cardStyle.useSecondaryAsBackground;

  return (
    <>
      {/* Visual container */}
      <View
        style={{
          aspectRatio: aspect,
          width: containerW, // RN respects width + aspectRatio → height is computed
          height: containerH, // if both provided, height wins (but we typically set width only)
          borderRadius,
          overflow: 'hidden',
          // backgroundColor: 'transparent',
        }}
      >
        {/* Background image (either secondary or primary) */}
        {bgFirst ? (
          <>
            {/* Secondary as background */}
            {!!secondaryUri && (
              <Image
                source={{ uri: secondaryUri }}
                style={[StyleSheet.absoluteFillObject, { borderRadius }]}
                resizeMode="cover"
              />
            )}
            {/* Primary overlay (positioned if W/H provided, else full-bleed) */}
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
                    : [StyleSheet.absoluteFillObject, { borderRadius }]
                }
                resizeMode={mainW && mainH ? 'contain' : 'cover'}
              />
            )}
          </>
        ) : (
          <>
            {/* Primary as background */}
            {!!primaryUri && (
              <Image
                source={{ uri: primaryUri }}
                style={[StyleSheet.absoluteFillObject, { borderRadius }]}
                resizeMode="cover"
              />
            )}
            {/* Secondary overlay (positioned if W/H provided, else full-bleed) */}
            {!!secondaryUri && (
              <Image
                source={{ uri: secondaryUri }}
                style={
                  secondaryW && secondaryH
                    ? {
                        width: secondaryW,
                        height: secondaryH,
                        marginTop: 25,
                        marginRight: secondaryMargin.right,
                        marginBottom: secondaryMargin.bottom,
                        marginLeft: 48,
                        borderRadius,
                        position: 'absolute',
                      }
                    : [StyleSheet.absoluteFillObject, { borderRadius }]
                }
                resizeMode={secondaryW && secondaryH ? 'contain' : 'cover'}
              />
            )}
          </>
        )}

        {/* Badge(s) overlay */}
        {badges.map((b, i) => {
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
              key={`badge-${i}`}
              style={[
                anchor,
                {
                  minHeight: h ?? undefined,
                  minWidth: w ?? undefined,
                  backgroundColor: 'transparent',
                  borderRadius,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                },
              ]}
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

      {/* Title & Description BELOW the image
      {cardStyle.showTitle && !!titleText && (
        <View style={{ marginTop: 6 }}>
          <View style={titleViewStyle}>
            <Text numberOfLines={1} style={titleTextStyle}>
              {titleText}
            </Text>
          </View>
        </View>
      )} */}

      {cardStyle.showDescription && !!descText && (
        <View style={{ marginTop: cardStyle.showTitle ? 2 : 6 }}>
          <View style={descViewStyle}>
            <Text numberOfLines={2} style={descTextStyle}>
              {descText}
            </Text>
          </View>
        </View>
      )}
    </>
  );
});

export default ContentCard;
