// screens/HomeScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import {
  resolveComponentForBlock,
  type PageLayoutComponent,
} from '../services/componentMapping';
import { useAppSettings } from '../hooks/useAppSettings';
import { findCardStyleForListPreset } from '../utils/cardMap';

// ─────────────────────────────────────────────────────────────────────────────
// Strapi endpoint (page compositions)
const STRAPI_URL =
  'https://strapi-dev.trilogyapps.com/api/mobile-pages?populate=all';

// Minimal types
type MobilePage = {
  id: number;
  name: string;
  pageLayout?: PageLayoutComponent[];
};
type StrapiResponse<T> = { data: T[]; meta: any };

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

type PlaylistItem = any;
type AcardStyle = any;

async function fetchPlaylistByUrl(url?: string): Promise<PlaylistItem[]> {
  if (!url) return [];
  const res = await fetch(url);
  if (!res.ok) return [];
  const json = await res.json();
  // Support both virtual feed (items) and playlist (entry)
  return (json?.entry ?? json?.items ?? []) as PlaylistItem[];
}

function getRailPresetName(block: PageLayoutComponent): string | undefined {
  // Update if your schema stores preset elsewhere
  return (
    (block as any)?.presetName ||
    (block?.cardStyle?.name as string | undefined) ||
    (block?.name as string | undefined)
  );
}

// Title for horizontal rails: use the rail name (stable)
function extractTitleForHorizontal(block: PageLayoutComponent): string {
  return String(block?.name ?? '');
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-rail loader + renderer (no slicing; fit only controls visible width)
function RailLoader({
  pageId,
  block,
  cardSettings,
}: {
  pageId: number;
  block: PageLayoutComponent;
  cardSettings: any[] | undefined;
}) {
  const [items, setItems] = useState<PlaylistItem[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch playlist items for this rail
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const it = await fetchPlaylistByUrl(block.playlistUrl);
        if (!cancelled) setItems(it);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message ?? 'Unknown rail error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [block]);

  // Resolve component type (horizontal/vertical)
  const resolved = resolveComponentForBlock(block);

  // Resolve preset → AcardStyle using global cardSettings
  const presetName = getRailPresetName(block);
  const selectedAcard: AcardStyle | undefined = useMemo(() => {
    if (!presetName || !cardSettings?.length) return undefined;
    return findCardStyleForListPreset(presetName, cardSettings);
  }, [presetName, cardSettings]);

  if (loading) {
    return (
      <View style={{ padding: 12 }}>
        <Text style={{ opacity: 0.7 }}>
          Loading rail: #{block.id} “{block.name ?? block.__component}”
        </Text>
        <ActivityIndicator />
      </View>
    );
  }

  if (err) {
    return (
      <View style={{ padding: 12 }}>
        <Text style={{ color: 'tomato' }}>
          Rail error #{block.id} “{block.name ?? block.__component}”: {err}
        </Text>
      </View>
    );
  }

  if (!resolved) {
    return (
      <View style={{ padding: 12 }}>
        <Text style={{ color: 'gold' }}>
          Unknown component type: {block.__component} (rail #{block.id})
        </Text>
      </View>
    );
  }

  if (!selectedAcard) {
    return (
      <View style={{ padding: 12 }}>
        <Text style={{ color: 'orange' }}>
          No preset match for “{presetName ?? '(no preset)'}”. Check card
          presets/settings.
        </Text>
      </View>
    );
  }

  if (!items || items.length === 0) {
    return (
      <View style={{ padding: 12 }}>
        <Text style={{ color: '#888' }}>
          Rail “{block.name ?? block.__component}” has 0 items (playlistUrl:{' '}
          {block.playlistUrl ?? '—'}).
        </Text>
      </View>
    );
  }

  // Show title if configured
  const showTitle = !!(block as any)?.showTitle;
  const title = showTitle ? extractTitleForHorizontal(block) : '';

  // We DO NOT slice items. itemLimit means "how many tiles visible", not "how many to render".
  const fitCount = Number((block as any)?.itemLimit) || undefined;

  const Keyed = resolved.Component;
  const isHorizontal = resolved.kind === 'horizontal';

  return (
    <View style={{ paddingVertical: 12 }}>
      {isHorizontal ? (
        <Keyed
          items={items}
          cardStyle={selectedAcard}
          showTitle={showTitle}
          title={title}
          fitCount={fitCount} // width calc only, list still scrolls
          snap={(block as any)?.snap ?? true}
          itemSpacing={(block as any)?.itemSpacing ?? 12}
          itemWidthPct={(block as any)?.itemWidthPct ?? 0.78}
        />
      ) : (
        <Keyed items={items} cardStyle={selectedAcard} />
      )}
    </View>
  );
}

export default function HomeScreen() {
  const {
    cardSettings,
    loading: settingsLoading,
    error: settingsError,
  } = useAppSettings();

  const [blocks, setBlocks] = useState<PageLayoutComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [pageInfo, setPageInfo] = useState<{ id: number; name: string } | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchJSON<StrapiResponse<MobilePage>>(STRAPI_URL);
        const page =
          res.data.find(p => p.name?.trim().toLowerCase() === 'home') ??
          res.data[0];

        if (!page) throw new Error('No pages returned from Strapi');

        if (!cancelled) {
          setPageInfo({ id: page.id, name: page.name });
          setBlocks(page.pageLayout ?? []);
        }
      } catch (e: any) {
        if (!cancelled) setErr(e?.message ?? 'Failed to load pages');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (settingsLoading || loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
        <Text>Loading…</Text>
      </View>
    );
  }

  if (settingsError) {
    return <Text style={{ padding: 16 }}>Settings error: {settingsError}</Text>;
  }
  if (err) {
    return <Text style={{ padding: 16, color: 'tomato' }}>Error: {err}</Text>;
  }
  if (!blocks.length || !pageInfo) {
    return (
      <View style={{ padding: 16 }}>
        <Text>No components in pageLayout.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {blocks.map((block, i) => (
        <RailLoader
          key={`${pageInfo!.id}-${block.__component}-${block.id}-${i}`}
          pageId={pageInfo!.id}
          block={block}
          cardSettings={cardSettings}
        />
      ))}
    </View>
  );
}
