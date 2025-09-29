import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  StrapiListResponse,
  ListSetting,
  MCardStyle,
  AcardStyle,
} from '../types/strapitypes';

export const STRAPI_BASE = 'https://strapi-dev.trilogyapps.com';
export const LIST_SETTINGS_URL = `${STRAPI_BASE}/api/list-settings?populate=all`;
export const CARD_SETTINGS_URL = `${STRAPI_BASE}/api/mobile-card-styles?populate=all`;
// export const CARD_SETTINGS_URL = `${STRAPI_BASE}/api/card-settings?populate=all`;
export const ASYNC_STORAGE_KEYS = {
  listSettings: 'mbs:v2:listSettings',
  cardStyles: 'mbs:v2:cardStyles',
  lastFetched: 'mbs:v2:lastFetched',
} as const;

export type CachedSettings = {
  listSettings: ListSetting[];
  cardStyles: MCardStyle[];
  fetchedAt: number;
};

export const SETTINGS_TTL_MS = 1 * 60 * 1000; // 10 minutes

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.json();
}

export async function refreshAndCacheSettings(): Promise<CachedSettings> {
  const [listsRes, cardsRes] = await Promise.all([
    fetchJSON<StrapiListResponse<ListSetting>>(LIST_SETTINGS_URL),
    fetchJSON<StrapiListResponse<MCardStyle>>(CARD_SETTINGS_URL),
  ]);
  const listSettings = listsRes?.data ?? [];
  const cardStyles = cardsRes?.data ?? [];
  // console.log({ cardStyles });
  // Cache to AsyncStorage
  const payload: CachedSettings = {
    listSettings,
    cardStyles,
    fetchedAt: Date.now(),
  };

  await AsyncStorage.multiSet([
    [ASYNC_STORAGE_KEYS.listSettings, JSON.stringify(listSettings)],
    [ASYNC_STORAGE_KEYS.cardStyles, JSON.stringify(cardStyles)],
    [ASYNC_STORAGE_KEYS.lastFetched, String(payload.fetchedAt)],
  ]);

  return payload;
}

export async function loadCachedSettings(): Promise<CachedSettings | null> {
  const [listRaw, styleRaw, tsRaw] = await AsyncStorage.multiGet([
    ASYNC_STORAGE_KEYS.listSettings,
    ASYNC_STORAGE_KEYS.cardStyles,
    ASYNC_STORAGE_KEYS.lastFetched,
  ]);

  const listSettings = listRaw[1]
    ? (JSON.parse(listRaw[1]!) as ListSetting[])
    : null;
  const cardStyles = styleRaw[1]
    ? (JSON.parse(styleRaw[1]!) as MCardStyle[])
    : null;
  // console.log({ cardStyles });
  const fetchedAt = tsRaw[1] ? Number(tsRaw[1]) : 0;

  if (listSettings && cardStyles)
    return { listSettings, cardStyles, fetchedAt };
  return null;
}

export async function getSettingsEnsureFresh(
  maxAgeMs = SETTINGS_TTL_MS,
): Promise<CachedSettings> {
  const cached = await loadCachedSettings();
  if (cached && Date.now() - cached.fetchedAt < maxAgeMs) return cached;
  return refreshAndCacheSettings();
}
