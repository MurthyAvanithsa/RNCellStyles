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

// components/ContentCard.tsx
import {
  parseAspect,
  pxToNumber,
  mapFitToRN,
  percentToFraction,
  parseBackgroundPosition,
  pickImageByKey,
  boxToOffsets,
  textAlignFrom,
  styleFromFont,
  toTextBlockStyle,
  badgeAnchorStyle,
  pickTextByKey,
} from '../utils/cardStyleUtils'; // adjust path

type Props = {
  content: PlaylistItem;
  cardStyle: AcardStyle;
  index?: number;
};

/** ---- component ---- */
const ContentCard = memo(({ content, cardStyle }: Props) => {
  // console.log('Rendering ContentCard with style:', cardStyle);
  // console.log('Image key:', cardStyle.imageKey);

  const borderRadius = pxToNumber(cardStyle?.borderStyle?.borderRadius);

  // console.log({ cardStyle });
  // Primary / secondary keys (from normalized AcardStyle)
  const primaryKey =
    cardStyle?.mainImage?.sourceKey ?? cardStyle?.imageKey ?? null;
  const secondaryKey =
    cardStyle?.secondaryImage?.sourceKey ??
    cardStyle?.secondaryImageKey ??
    null;

  const primaryUri = useMemo(
    () => pickImageByKey(content, primaryKey),
    [content, primaryKey],
  );
  const secondaryUri = useMemo(
    () => pickImageByKey(content, secondaryKey),
    [content, secondaryKey],
  );

  // Text
  const titleText = cardStyle.showTitle
    ? pickTextByKey(content, cardStyle?.titleSourceKey, content?.title)
    : undefined;

  const descText = cardStyle.showDescription
    ? pickTextByKey(content, cardStyle?.descriptionSourceKey, content?.desc)
    : undefined;

  // Aspect ratio: prefer mainImage.aspectRatio → container W/H → default 16:9
  const containerW = pxToNumber(cardStyle?.container?.width);
  const containerH = pxToNumber(cardStyle?.container?.height);
  const aspectFromWH =
    containerW && containerH ? containerW / containerH : undefined;
  const aspect =
    parseAspect(cardStyle?.mainImage?.aspectRatio || '') ??
    aspectFromWH ??
    16 / 9;

  // image sizing/margins
  const mainW = pxToNumber(cardStyle?.mainImage?.width);
  const mainH = pxToNumber(cardStyle?.mainImage?.height);
  const mainMargin = boxToOffsets(cardStyle?.mainImage?.mainImageMargin);
  const secondaryW = pxToNumber(cardStyle?.secondaryImage?.width);
  const secondaryH = pxToNumber(cardStyle?.secondaryImage?.height);
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
                        marginTop: secondaryMargin.top,
                        marginRight: secondaryMargin.right,
                        marginBottom: secondaryMargin.bottom,
                        marginLeft: secondaryMargin.left,
                        borderRadius: 16,
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
          const h = pxToNumber(b?.height);
          const w = pxToNumber(b?.width);

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
