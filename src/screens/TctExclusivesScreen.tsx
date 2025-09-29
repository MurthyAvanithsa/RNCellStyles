// screens/TctExclusivesScreen.tsx (example)
import React, { useEffect, useMemo, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import HorizontalList from '../components/HorizontalList';
import { useAppSettings } from '../hooks/useAppSettings';
import type {
  PlaylistItem,
  AcardStyle,
  ListSetting,
} from '../types/strapitypes';
import { findCardStyleForListPreset } from '../utils/cardMap';

type PlaylistResponse = {
  id?: string;
  title?: string;
  entry?: PlaylistItem[];
  [k: string]: any;
};

// const PLAYLIST_URL =
//   'https://tctdsp.trilogyapps.com/v1/playlist?playlistid=NOkIrulm&page_offset=1&page_limit=100';

// Topten playlist
const PLAYLIST_URL =
  'https://tctdsp.trilogyapps.com/v1/playlist?playlistid=WmbDI15m&page_offset=1&page_limit=100';
async function fetchPlaylist(): Promise<{
  items: PlaylistItem[];
  feedTitle: string | null;
}> {
  const res = await fetch(PLAYLIST_URL);
  if (!res.ok) throw new Error('Failed to fetch playlist');
  const json: PlaylistResponse = await res.json();
  return { items: json.entry ?? [], feedTitle: json.title ?? null };
}

export default function TctExclusivesScreen() {
  const {
    loading: settingsLoading,
    error: settingsError,
    listSettings,
    cardSettings,
  } = useAppSettings(); // cardSettings: MCardStyle[] (mobile)
  const [items, setItems] = useState<PlaylistItem[]>([]);
  const [feedTitle, setFeedTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { items: it, feedTitle: ft } = await fetchPlaylist();
        setItems(it);
        setFeedTitle(ft);
      } catch (e: any) {
        setErr(e?.message ?? 'Failed to load playlist');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // pick a list preset (example: first one)
  const chosenList: ListSetting | undefined = useMemo(
    () => listSettings?.[5],
    [listSettings],
  );

  // mobile-only: find & normalize to AcardStyle
  const acard: AcardStyle | null = useMemo(() => {
    if (!chosenList) return null;
    return (
      findCardStyleForListPreset(chosenList.presetName, cardSettings) ?? null
    );
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
  if (!acard)
    return <Text>No Card Style for preset: {chosenList.presetName}</Text>;
  if (!items.length) return <Text>No playlist items.</Text>;

  return (
    <View style={{ flex: 1, paddingVertical: 12 }}>
      <HorizontalList items={items} cardStyle={acard} />
    </View>
  );
}
