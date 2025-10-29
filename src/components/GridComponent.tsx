// components/GridComponent.tsx
import React, { memo, useMemo, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  useWindowDimensions,
  ListRenderItemInfo,
} from 'react-native';
import ContentCard from './ContentCard';
import type { AcardStyle, PlaylistItem } from '../types/strapitypes';

type Props = {
  data: PlaylistItem[];
  cardStyle: AcardStyle;

  /** Grid layout */
  columns?: number; // default 3
  gap?: number; // default 12
  contentPadding?: number; // default 16

  /** List extras */
  keyPrefix?: string; // default 'grid'
  onEndReached?: () => void;
  onEndReachedThreshold?: number; // default 0.3
  ListHeaderComponent?: React.ReactElement | null;
  ListFooterComponent?: React.ReactElement | null;
};

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

const GridComponent = memo((props: Props) => {
  const {
    data,
    cardStyle,
    columns = 2,
    gap = 12,
    contentPadding = 16,
    keyPrefix = 'grid',
    onEndReached,
    onEndReachedThreshold = 0.3,
    ListHeaderComponent,
    ListFooterComponent,
  } = props;

  const { width: screenW } = useWindowDimensions();

  // Compute item width based on columns + gap + outer padding
  const itemWidth = useMemo(() => {
    const totalGap = gap * (columns - 1);
    const innerWidth = Math.max(0, screenW - contentPadding * 2 - totalGap);
    return Math.floor(innerWidth / columns);
  }, [screenW, contentPadding, gap, columns]);

  // Derive aspect (prefer cardStyle.mainImage.aspectRatio → container → fallback 16:9)
  const aspect = useMemo(() => {
    const containerW = toNum(cardStyle?.container?.width);
    const containerH = toNum(cardStyle?.container?.height);
    const fromWH =
      containerW && containerH ? containerW / containerH : undefined;
    return parseAspect(cardStyle?.mainImage?.aspectRatio) ?? fromWH ?? 16 / 9;
  }, [cardStyle]);
  console.log({ columns });
  // Create a shallow “override” style with computed width (height derives from aspect)
  const computedCardStyle: AcardStyle = useMemo(() => {
    const prevContainer = cardStyle?.container ?? {};
    return {
      ...cardStyle,
      container: {
        ...prevContainer,
        width: itemWidth,
        // Don't force height; let ContentCard use width+aspectRatio to compute
        height: undefined,
      },
    };
  }, [cardStyle, itemWidth]);

  // Estimate row height for getItemLayout (good for large lists perf)
  const estimatedTileHeight = useMemo(() => {
    const border = toNum(cardStyle?.borderStyle?.borderRadius) ?? 0;
    const imgH = Math.round(itemWidth / aspect);
    const textBlock =
      (cardStyle?.showTitle ? 24 : 0) + (cardStyle?.showDescription ? 36 : 0);
    const extra = 8; // margins between blocks
    return imgH + textBlock + extra + border * 0; // border doesn't add height (overflow hidden)
  }, [itemWidth, aspect, cardStyle]);

  const itemSeparator = useCallback(
    () => <View style={{ height: gap }} />,
    [gap],
  );

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<PlaylistItem>) => {
      // Wrap each item in a fixed-width container so FlatList can lay out columns
      return (
        <View
          style={{
            width: itemWidth,
            marginRight: (index + 1) % columns === 0 ? 0 : gap, // gap between columns except last
          }}
        >
          <ContentCard
            content={item}
            cardStyle={computedCardStyle}
            index={index}
          />
        </View>
      );
    },
    [itemWidth, columns, gap, computedCardStyle],
  );

  const keyExtractor = useCallback(
    (item: any, i: number) =>
      `${keyPrefix}-${item?.id ?? item?.guid ?? item?.link ?? i}`,
    [keyPrefix],
  );

  // Helpful when you have many items: lets RN skip measurement
  const getItemLayout = useCallback(
    (_: any, index: number) => {
      // Every "row" contains `columns` items; compute row index
      const row = Math.floor(index / columns);
      const rowHeight = estimatedTileHeight;
      const length = rowHeight;
      const offset =
        row * rowHeight + // previous full rows
        row * gap; // vertical gap between rows
      return { length, offset, index };
    },
    [columns, estimatedTileHeight, gap],
  );

  return (
    <FlatList
      data={data}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      numColumns={columns}
      columnWrapperStyle={styles.column}
      ItemSeparatorComponent={itemSeparator}
      contentContainerStyle={{
        paddingHorizontal: contentPadding,
        paddingTop: contentPadding,
        paddingBottom: Math.max(contentPadding, gap),
      }}
      onEndReached={onEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      removeClippedSubviews
      initialNumToRender={12}
      windowSize={10}
      maxToRenderPerBatch={12}
      updateCellsBatchingPeriod={50}
      getItemLayout={getItemLayout}
    />
  );
});

const styles = StyleSheet.create({
  column: {
    // space-between visually handled by per-item right margin; keep this clean
  },
});

export default GridComponent;
