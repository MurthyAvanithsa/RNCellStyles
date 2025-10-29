// screens/TctExclusivesScreen.tsx
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

/** ---- minimal helpers to map cardStyle → RN text style ---- */
const toNum = (v: any): number | undefined =>
  typeof v === 'number'
    ? v
    : typeof v === 'string' && v.trim() !== ''
    ? Number(v)
    : undefined;

const textAlignFrom = (align?: string | null) => {
  const a = String(align || '').toLowerCase();
  if (a === 'center' || a === 'middle') return 'center' as const;
  if (a === 'right') return 'right' as const;
  return 'left' as const;
};

const styleFromFont = (fs?: any) => {
  if (!fs) return {};
  const out: any = {};
  if (fs.fontSize != null) out.fontSize = fs.fontSize;
  if (fs.fontWeight) out.fontWeight = fs.fontWeight;
  if (fs.fontStyle) out.fontStyle = fs.fontStyle;
  if (fs.lineHeight != null) out.lineHeight = fs.lineHeight;
  if (fs.textDecoration) out.textDecorationLine = fs.textDecoration;
  if (fs.textTransform) out.textTransform = fs.textTransform;
  if (fs.color) out.color = fs.color;
  return out;
};

const toTextBlockStyle = (s?: any): { viewStyle: any; textStyle: any } => {
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

export default function TctExclusivesScreen() {
  const {
    loading: settingsLoading,
    error: settingsError,
    listSettings,
    cardSettings,
  } = useAppSettings();

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

  // pick a list preset (example: index 5)
  const chosenList: ListSetting | undefined = useMemo(
    () => listSettings?.[5],
    [listSettings],
  );

  const acard: AcardStyle | null = useMemo(() => {
    if (!chosenList) return null;
    return (
      findCardStyleForListPreset(chosenList.presetName, cardSettings) ?? null
    );
  }, [chosenList, cardSettings]);

  // Prefer dedicated feed/rail/list title style from cardStyle; fall back to card titleStyle
  const feedTitleStyles = useMemo(() => {
    const s =
      (acard as any)?.feedTitleStyle ??
      (acard as any)?.railTitleStyle ??
      (acard as any)?.listTitleStyle ??
      (acard as any)?.sectionTitleStyle ??
      acard?.titleStyle ??
      {};
    const { viewStyle, textStyle } = toTextBlockStyle(s);

    // Optional spacing defaults if card style doesn't specify container spacing
    const containerDefaults = {
      marginHorizontal:
        toNum((acard as any)?.container?.paddingHorizontal) ?? 16,
      marginTop: 12,
      marginBottom: 8,
    };

    return {
      containerStyle: { ...containerDefaults, ...viewStyle },
      textStyle: {
        fontSize: 18,
        fontWeight: '600',
        ...textStyle,
      },
    };
  }, [acard]);

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
      {feedTitle ? (
        <View style={feedTitleStyles.containerStyle}>
          <Text style={feedTitleStyles.textStyle}>{feedTitle}</Text>
        </View>
      ) : null}

      <HorizontalList items={items} cardStyle={acard} />
    </View>
  );
}
