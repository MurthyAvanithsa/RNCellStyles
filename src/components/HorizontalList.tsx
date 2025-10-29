// components/HorizontalList.tsx
import React, { useMemo } from 'react';
import { View, FlatList, useWindowDimensions, Text } from 'react-native';
import ContentCard from './ContentCard';

type PlaylistItem = any;
type AcardStyle = any;

type Props = {
  items?: PlaylistItem[];
  cardStyle: AcardStyle; // normalized via preset
  showTitle?: boolean;
  title?: string;
  itemWidthPct?: number; // fallback % when not fitting count (default 0.78)
  itemSpacing?: number; // px gap between items (default 8)
  snap?: boolean; // default true
  fitCount?: number; // how many tiles visible per viewport; list still scrolls
};

const HorizontalList = ({
  items = [],
  cardStyle,
  showTitle = false,
  title = '',
  itemSpacing = 8,
  snap = true,
  fitCount,
}: Props) => {
  const { width: screenW } = useWindowDimensions();

  // If fitCount is provided, compute a uniform width so N items fit the viewport.
  const uniformWidth = useMemo(() => {
    if (!fitCount || fitCount <= 0) return null;
    const horizontalPadding = 16; // must match contentContainerStyle padding
    const totalGaps = itemSpacing * Math.max(0, fitCount - 1);
    const available = screenW - horizontalPadding * 2 - totalGaps;
    return Math.max(1, Math.floor(available / fitCount));
  }, [fitCount, itemSpacing, screenW]);
  // Decide snap interval: uniform width → clean snapping; else fallback
  const snapInterval = itemSpacing;

  return (
    <View>
      {showTitle && !!title && (
        <Text
          style={{
            paddingHorizontal: 16,
            marginBottom: 8,
            fontSize: 18,
            fontWeight: '600',
            color: '#fff',
          }}
        >
          {title}
        </Text>
      )}

      <FlatList
        horizontal
        data={items}
        keyExtractor={(it, idx) => String((it as any)?.id ?? idx)}
        renderItem={({ item }) => (
          <View style={{ width: uniformWidth }}>
            <ContentCard content={item} cardStyle={cardStyle} />
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ width: itemSpacing }} />}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        showsHorizontalScrollIndicator={false}
        removeClippedSubviews={false}
        decelerationRate={snap ? 'fast' : 'normal'}
        snapToInterval={snap ? snapInterval : undefined}
        snapToAlignment={snap ? 'start' : undefined}
        disableIntervalMomentum={snap}
      />
    </View>
  );
};

export default HorizontalList;
