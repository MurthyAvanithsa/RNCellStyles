// components/HorizontalList.tsx
import React, { memo } from 'react';
import { View, FlatList, useWindowDimensions } from 'react-native';
import type { PlaylistItem, AcardStyle } from '../types/strapitypes';
import VerticalCard from './VerticalCard';

type Props = {
  items: PlaylistItem[]; // playlist.entry
  cardStyle: AcardStyle; // normalized mobile style (AcardStyle)
  /** layout options */
  itemWidthPct?: number; // 0..1 of screen width per card (default 0.78)
  itemSpacing?: number; // px gap between cards (default 12)
  snap?: boolean; // enable snapping (default true)
};

const VerticalList = memo(
  ({ items, cardStyle, itemSpacing = 12, snap = true }: Props) => {
    const renderItem = ({ item }: { item: PlaylistItem }) => (
      <View style={{ marginRight: itemSpacing }}>
        <VerticalCard content={item} cardStyle={cardStyle} />
      </View>
    );

    return (
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(it, idx) => String((it as any).id ?? idx)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: itemSpacing }}
        decelerationRate={snap ? 'fast' : 'normal'}
        snapToAlignment={snap ? 'start' : undefined}
        disableIntervalMomentum={snap}
      />
    );
  },
);

export default VerticalList;
