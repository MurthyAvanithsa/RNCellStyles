// screens/HomeScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useAppSettings } from '../hooks/useAppSettings';
import type {
  PlaylistItem,
  ListSetting,
  AcardStyle,
} from '../types/strapitypes';
import { findCardStyleForListPreset } from '../utils/cardMap-old';
import ContentCard from '../components/ContentCard';

//Topten
// const PLAYLIST_URL =
//   'https://tctdsp.trilogyapps.com/v1/playlist?playlistid=WmbDI15m&page_offset=1&page_limit=100';

// TCT Exclusive playlist - 16x9-Title
const PLAYLIST_URL =
  'https://tctdsp.trilogyapps.com/v1/playlist?playlistid=NOkIrulm&page_offset=1&page_limit=100';

type PlaylistResponse = {
  id?: string;
  title?: string; // top-level feed title
  type?: any;
  entry?: PlaylistItem[];
  extensions?: Record<string, any>;
};

async function fetchPlaylist(): Promise<{
  items: PlaylistItem[];
  feedTitle: string | null;
}> {
  const res = await fetch(PLAYLIST_URL);
  if (!res.ok) throw new Error('Failed to fetch playlist');
  const json: PlaylistResponse = await res.json();
  return {
    items: json?.entry ?? [],
    feedTitle: json?.title ?? null,
  };
}

export default function HomeScreen() {
  const {
    loading: settingsLoading,
    error: settingsError,
    listSettings,
    cardSettings, // may be legacy or mobile schema or already AcardStyle
  } = useAppSettings();

  const [items, setItems] = useState<PlaylistItem[]>([]);
  const [title, setTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { items: fetchedItems, feedTitle } = await fetchPlaylist();
        setItems(fetchedItems);
        setTitle(feedTitle);
      } catch (e: any) {
        setErr(e?.message ?? 'Failed to load playlist');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Choose the list/preset you want to render (index 0 as per your example)
  const chosenList: ListSetting | undefined = useMemo(
    () => listSettings?.[0],
    [listSettings],
  );

  // Find the matching style regardless of the incoming schema
  const selectedAcard: AcardStyle | undefined = useMemo(() => {
    if (!chosenList?.presetName || !cardSettings?.length) return undefined;
    return findCardStyleForListPreset(chosenList.presetName, cardSettings);
  }, [chosenList, cardSettings]);

  if (settingsLoading || loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
        <Text>Loading…</Text>
      </View>
    );
  }
  if (settingsError) return <Text>Settings error: {settingsError}</Text>;
  if (err) return <Text>Playlist error: {err}</Text>;
  if (!chosenList) return <Text>No List Settings found.</Text>;
  if (!selectedAcard)
    return <Text>No Card Style found for preset: {chosenList.presetName}</Text>;
  if (!items[0]) return <Text>No playlist items.</Text>;

  // Pass the feed title down; ContentCard will decide if/when to show it
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <ContentCard content={items[1]} cardStyle={selectedAcard} />
    </View>
  );
}
