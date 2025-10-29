// screens/ShowsScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useAppSettings } from '../hooks/useAppSettings';
import type {
  PlaylistItem,
  ListSetting,
  AcardStyle,
} from '../types/strapitypes';
import { findCardStyleForListPreset } from '../utils/cardMap';
import GridComponent from '../components/GridComponent';
import LandingScreen from './LandingScreen';
import VerticalCard from '../components/VerticalCard';
import VerticalList from '../components/VerticalList';
// TCT Exclusive playlist
const PLAYLIST_URL =
  'https://tctdsp.trilogyapps.com/v1/playlist?playlistid=defz98Cf&page_offset=1&page_limit=100';

type PlaylistResponse = {
  id?: string;
  title?: string;
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
  return { items: json?.entry ?? [], feedTitle: json?.title ?? null };
}

/** ---- helpers for mapping card-style text configs to RN styles ---- */
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

export default function ShowsScreen() {
  const {
    loading: settingsLoading,
    error: settingsError,
    listSettings,
    cardSettings,
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

  // Choose the list/preset (index 0 or pick by name)
  const chosenList: ListSetting | undefined = useMemo(
    () => listSettings?.[0],
    [listSettings],
  );

  // Resolve AcardStyle for that preset
  const selectedAcard: AcardStyle | undefined = useMemo(() => {
    if (!chosenList?.presetName || !cardSettings?.length) return undefined;
    return findCardStyleForListPreset(chosenList.presetName, cardSettings);
  }, [chosenList, cardSettings]);

  // Map title styles from selectedAcard
  const headerStyles = useMemo(() => {
    const s: any = selectedAcard?.titleStyle ?? {};

    const { viewStyle, textStyle } = toTextBlockStyle(s);

    return {
      containerStyle: {
        marginTop: 16,
        marginBottom: 8,
        marginLeft: 16,
        ...viewStyle,
      },
      textStyle: {
        // sensible defaults, overridden by card style if provided
        fontSize: textStyle?.fontSize,
        fontWeight: textStyle?.fontWeight,
        color: textStyle?.color,
        textAlign: textStyle?.textAlign,
      },
    };
  }, [selectedAcard]);

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
  if (!items?.length) return <Text>No playlist items.</Text>;

  return (
    <View style={{ flex: 1 }}>
      {title ? (
        <View style={headerStyles.containerStyle}>
          <Text style={headerStyles.textStyle}>{title}</Text>
        </View>
      ) : null}

      {/* <GridComponent data={items} cardStyle={selectedAcard} /> */}
      {/* <LandingScreen cardStyle={selectedAcard} playlist={items} /> */}
      {/* <VerticalCard content={items} cardStyle={selectedAcard} /> */}
      <VerticalList items={items} cardStyle={selectedAcard} />
    </View>
  );
}
