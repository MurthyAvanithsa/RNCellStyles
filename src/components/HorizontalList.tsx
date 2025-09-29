// components/HorizontalList.tsx
import React, { memo } from 'react';
import { View, FlatList, useWindowDimensions } from 'react-native';
import ContentCard from './ContentCard';
import type { PlaylistItem, AcardStyle } from '../types/strapitypes';

type Props = {
  items: PlaylistItem[]; // playlist.entry
  cardStyle: AcardStyle; // normalized mobile style (AcardStyle)
  feedTitle?: string | null; // playlist.title (top-level)
  /** layout options */
  itemWidthPct?: number; // 0..1 of screen width per card (default 0.78)
  itemSpacing?: number; // px gap between cards (default 12)
  snap?: boolean; // enable snapping (default true)
};

const HorizontalList = memo(
  ({
    items,
    cardStyle,
    feedTitle,
    itemWidthPct = 0.78,
    itemSpacing = 12,
    snap = true,
  }: Props) => {
    const { width: screenW } = useWindowDimensions();
    const cardW = Math.round(screenW * itemWidthPct);

    const renderItem = ({ item }: { item: PlaylistItem }) => (
      <View style={{ width: cardW, marginRight: itemSpacing }}>
        <ContentCard content={item} cardStyle={cardStyle} />
      </View>
    );

    return (
      <FlatList
        horizontal
        data={items}
        renderItem={renderItem}
        keyExtractor={(it, idx) => String((it as any).id ?? idx)}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: itemSpacing }}
        decelerationRate={snap ? 'fast' : 'normal'}
        snapToInterval={snap ? cardW + itemSpacing : undefined}
        snapToAlignment={snap ? 'start' : undefined}
        disableIntervalMomentum={snap}
      />
    );
  },
);

export default HorizontalList;

// components/HorizontalPlaylist.tsx
// import React, { memo } from 'react';
// import { View, FlatList, useWindowDimensions } from 'react-native';
// import ContentCard from './ContentCard';
// import type {
//   PlaylistItem,
//   AcardStyle,
//   ListSetting,
// } from '../types/strapitypes';

// type Props = {
//   items: PlaylistItem[];
//   cardStyle: AcardStyle;
//   list: ListSetting; // read tilesToShow from here
//   feedTitle?: string | null;
//   cardSpacing?: number; // gap between tiles & side padding (default 12)
//   snap?: boolean; // snapping (default true)
// };

// const toNum = (v: any) =>
//   typeof v === 'number' && Number.isFinite(v)
//     ? v
//     : v != null && !Number.isNaN(Number(v))
//     ? Number(v)
//     : undefined;

// const HorizontalList = memo(
//   ({
//     items,
//     cardStyle,
//     list,
//     feedTitle,
//     cardSpacing = 12,
//     snap = true,
//   }: Props) => {
//     const { width: screenWidth } = useWindowDimensions();

//     // tilesToShow (guard to >=1)
//     const tilesToShow = Math.max(1, Math.floor(Number(list?.tilesToShow) || 1));

//     // optional explicit width (if your style ever provides it)
//     const cssWidth = toNum(cardStyle?.container?.width);

//     // EXACT formula you provided:
//     // const cardWidth = cssProps.width
//     //   ? cssProps.width
//     //   : (screenWidth - cardSpacing * (tilesToShow + 1)) / tilesToShow;
//     const cardWidth =
//       cssWidth ?? (screenWidth - cardSpacing * (tilesToShow + 1)) / tilesToShow;

//     const renderItem = ({
//       item,
//       index,
//     }: {
//       item: PlaylistItem;
//       index: number;
//     }) => (
//       <View
//         style={{
//           width: cardWidth,
//           // inter-tile gap
//           marginRight: index === items.length - 1 ? 0 : cardSpacing,
//         }}
//       >
//         <ContentCard
//           content={item}
//           cardStyle={cardStyle}
//           feedTitle={feedTitle}
//         />
//       </View>
//     );

//     return (
//       <FlatList
//         horizontal
//         data={items}
//         renderItem={renderItem}
//         keyExtractor={(it, idx) => String((it as any).id ?? idx)}
//         showsHorizontalScrollIndicator={false}
//         // side paddings = cardSpacing so total gaps = tilesToShow + 1
//         contentContainerStyle={{ paddingHorizontal: cardSpacing }}
//         // nice snapping per tile
//         decelerationRate={snap ? 'fast' : 'normal'}
//         snapToInterval={snap ? cardWidth + cardSpacing : undefined}
//         snapToAlignment={snap ? 'start' : undefined}
//         disableIntervalMomentum={snap}
//       />
//     );
//   },
// );

// export default HorizontalList;
//
