import React, { memo, useMemo } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  useWindowDimensions,
} from 'react-native';
import VerticalCard from '../components/VerticalCard';
import type { AcardStyle, PlaylistItem } from '../types/strapitypes';

/** ---------- tiny helpers ---------- */
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

const toClock = (secs?: number | string | null) => {
  if (secs == null) return null;
  const n =
    typeof secs === 'string'
      ? Number(secs)
      : typeof secs === 'number'
      ? secs
      : NaN;
  if (!isFinite(n) || n <= 0) return null;
  const h = Math.floor(n / 3600);
  const m = Math.floor((n % 3600) / 60);
  const s = Math.floor(n % 60);
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
};

type Props = {
  playlist: PlaylistItem[];
  cardStyle: AcardStyle;
  /** optional layout props */
  contentPadding?: number; // default 16
  gap?: number; // default 16
  leftWidthPct?: number; // default 0.55
  showDurationBadge?: boolean; // default true
};

const LandingScreen = memo(
  ({
    playlist,
    cardStyle,
    contentPadding = 16,
    gap = 16,
    leftWidthPct = 0.55,
    showDurationBadge = true,
  }: Props) => {
    const { width: screenW } = useWindowDimensions();

    // card aspect (for computing height)
    const containerW = toNum(cardStyle?.container?.width);
    const containerH = toNum(cardStyle?.container?.height);
    const fromWH =
      containerW && containerH ? containerW / containerH : undefined;
    const aspect =
      parseAspect(cardStyle?.mainImage?.aspectRatio) ?? fromWH ?? 16 / 9;

    const rowInnerW = screenW - contentPadding * 2 - gap;
    const leftW = Math.floor(rowInnerW * leftWidthPct);
    const leftH = Math.round(leftW / aspect);

    /** helper to render each item row */
    const renderItem = ({ item }: { item: PlaylistItem }) => {
      const durationSecs =
        item?.duration ??
        item?.extensions?.duration ??
        item?.extensions?.durationSeconds ??
        item?.extensions?.lengthSeconds ??
        null;
      const duration = toClock(durationSecs);
      const textStyle = cardStyle.titleStyle;
      const textColor = textStyle?.color;
      //   const durBadgeBg = durBadge?.backgroundColor ?? 'rgba(0,0,0,0.75)';
      //   const durBadgeRadius = toNum(durBadge?.borderRadius) ?? 6;
      //   const durBadgePadH = toNum(durBadge?.paddingHorizontal) ?? 6;
      //   const durBadgePadV = toNum(durBadge?.paddingVertical) ?? 2;
      //   const durBadgeOffsetX = toNum(durBadge?.offsetRight) ?? 8;
      //   const durBadgeOffsetY = toNum(durBadge?.offsetBottom) ?? 8;
      const textFontSize = toNum(textStyle?.fontStyle?.fontSize) ?? 12;
      const textFontWeight = textStyle?.fontStyle?.fontWeight ?? '600';

      // computed card style per item width
      const computedCardStyle: AcardStyle = {
        ...cardStyle,
        container: {
          ...(cardStyle?.container ?? {}),
          width: leftW,
          height: undefined,
        },
      };

      return (
        <View
          style={[
            styles.row,
            {
              paddingHorizontal: contentPadding,
              paddingVertical: gap / 2,
              columnGap: gap,
            },
          ]}
        >
          {/* LEFT: VerticalCard (image + 1–4 titles from Strapi) */}
          <View style={{ width: leftW, height: leftH }}>
            <VerticalCard content={item} cardStyle={computedCardStyle} />

            {showDurationBadge && duration ? (
              <View
                style={{
                  position: 'absolute',
                  right: 8,
                  bottom: 8,

                  backgroundColor: 'rgba(0,0,0,0.75)',
                  borderRadius: 6,
                  paddingHorizontal: 3,
                  paddingVertical: 1,
                  //   position: 'absolute',
                  //   right: durBadgeOffsetX,
                  //   bottom: durBadgeOffsetY,
                  //   backgroundColor: durBadgeBg,
                  //   borderRadius: durBadgeRadius,
                  //   paddingHorizontal: durBadgePadH,
                  //   paddingVertical: durBadgePadV,
                }}
              >
                <Text
                  style={{
                    color: textColor || '#fff',
                    fontSize: 12,
                    fontWeight: textFontWeight as any,
                  }}
                >
                  {duration}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      );
    };

    return (
      <FlatList
        data={playlist}
        renderItem={renderItem}
        keyExtractor={(it, idx) => it?.id?.toString?.() ?? String(idx)}
        contentContainerStyle={{ paddingBottom: contentPadding }}
      />
    );
  },
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default LandingScreen;
