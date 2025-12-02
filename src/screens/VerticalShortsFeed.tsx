import React, { useState, useCallback, useMemo } from 'react';
import {
  useWindowDimensions,
  View,
  Text,
  ActivityIndicator,
} from 'react-native';
import Video from 'react-native-video';
import { FlashList, ListRenderItemInfo } from '@shopify/flash-list';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

type Clip = {
  id: string;
  src: any; // require(...) or { uri: '...' }
  poster?: any;
  muted?: boolean;
  title?: string;
};

const CLIPS: Clip[] = [
  {
    id: '1',
    src: 'https://cdn.pixabay.com/video/2022/10/14/134810-760489671_tiny.mp4',
    title: 'Local vertical #1',
  },
  {
    id: '2',
    src: 'https://cdn.pixabay.com/video/2022/10/05/133642-757816789_tiny.mp4',
    title: 'Local vertical #2',
  },
  {
    id: '3',
    src: 'https://cdn.pixabay.com/video/2022/10/17/135333-761273772_tiny.mp4',
    title: 'Local vertical #3',
  },
  {
    id: '4',
    src: 'https://cdn.pixabay.com/video/2022/07/24/125314-733046618_tiny.mp4',
    title: 'Local vertical #4',
  },
  {
    id: '5',
    src: 'https://cdn.pixabay.com/video/2022/07/20/124774-732319023_tiny.mp4',
    title: 'Local vertical #5',
  },
  {
    id: '6',
    src: 'https://cdn.pixabay.com/video/2022/10/17/135326-761273757_tiny.mp4',
    title: 'Local vertical #6',
  },
  {
    id: '7',
    src: 'https://cdn.pixabay.com/video/2022/10/05/133644-757816799_tiny.mp4',
    title: 'Local vertical #7',
  },
];

export default function VerticalShortsFeed() {
  const { height, width } = useWindowDimensions();

  const [activeIndex, setActiveIndex] = useState(0);
  const [activePaused, setActivePaused] = useState(false);
  const [loadingIndex, setLoadingIndex] = useState<number | null>(0);

  /** When a new video becomes visible */
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
      if (!viewableItems?.length) return;
      const next = viewableItems[0].index ?? 0;
      setActiveIndex(next);
      setActivePaused(false); // auto-resume next clip
      setLoadingIndex(next);
    },
    [],
  );

  const viewabilityConfig = useMemo(
    () => ({ itemVisiblePercentThreshold: 90 }),
    [],
  );

  const renderItem = ({ item, index }: ListRenderItemInfo<Clip>) => {
    const isActive = activeIndex === index;
    const paused = !isActive || activePaused;
    const showSpinner = loadingIndex === index;

    /** Allow tap to toggle pause, but never block vertical scroll */
    const tap = Gesture.Tap()
      .maxDeltaY(10) // any Y-movement → it's a scroll
      .simultaneousWithExternalGesture(Gesture.Native()) // let list scroll win
      .onEnd((_e, success) => {
        if (success && isActive) setActivePaused(p => !p);
      });

    return (
      <View style={{ height, width, backgroundColor: 'black' }}>
        <GestureDetector gesture={tap}>
          <View
            style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
          >
            {showSpinner && (
              <ActivityIndicator
                size="large"
                color="#ffffff"
                style={{ position: 'absolute', zIndex: 2 }}
              />
            )}

            <Video
              source={{ uri: item.src }}
              style={{ height, width }}
              resizeMode="cover"
              paused={paused}
              repeat
              muted={item.muted ?? true}
              playInBackground={false}
              playWhenInactive={false}
              ignoreSilentSwitch="ignore"
              onLoadStart={() => isActive && setLoadingIndex(index)}
              onLoad={() => isActive && setLoadingIndex(null)}
              onError={e => console.warn('Video error', e)}
            />

            {/* Text overlay — non-interactive so scroll and tap still work */}
            <View
              pointerEvents="none"
              style={{ position: 'absolute', bottom: 32, left: 16, right: 16 }}
            >
              {!!item.title && (
                <Text
                  style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}
                >
                  {item.title}
                </Text>
              )}
              <Text style={{ color: 'white', opacity: 0.7, marginTop: 4 }}>
                {isActive
                  ? paused
                    ? 'Paused — tap to play'
                    : 'Playing — tap to pause'
                  : 'Swipe for next'}
              </Text>
            </View>
          </View>
        </GestureDetector>
      </View>
    );
  };

  return (
    <FlashList
      style={{ flex: 1 }}
      data={CLIPS}
      renderItem={renderItem}
      keyExtractor={i => i.id}
      pagingEnabled={false} // use explicit interval paging
      snapToInterval={height} // full-screen snapping
      snapToAlignment="start"
      decelerationRate="fast"
      showsVerticalScrollIndicator={false}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
      overrideItemLayout={(layout: { [k: string]: any }) => {
        layout.size = height;
        layout.span = 1;
      }}
    />
  );
}
