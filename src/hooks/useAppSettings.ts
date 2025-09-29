// useAppSettings.ts
import { useCallback, useEffect, useState } from 'react';
import {
  getSettingsEnsureFresh,
  refreshAndCacheSettings,
  SETTINGS_TTL_MS,
} from '../services/remoteConfig';
import type { ListSetting, AcardStyle, MCardStyle } from '../types/strapitypes';

export function useAppSettings() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [listSettings, setListSettings] = useState<ListSetting[]>([]);
  const [cardSettings, setCardSettings] = useState<MCardStyle[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSettingsEnsureFresh(SETTINGS_TTL_MS);
      setListSettings(data.listSettings);
      setCardSettings(data.cardStyles);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  const forceRefresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await refreshAndCacheSettings();
      setListSettings(data.listSettings);
      setCardSettings(data.cardStyles);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to refresh settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // initial load
    load();
  }, [load]);

  useEffect(() => {
    // auto-refresh every 10 minutes (uses TTL-aware getter)
    const id = setInterval(async () => {
      try {
        const data = await getSettingsEnsureFresh(SETTINGS_TTL_MS);
        setListSettings(data.listSettings);
        setCardSettings(data.cardStyles);
      } catch {
        /* ignore periodic refresh errors */
      }
    }, SETTINGS_TTL_MS);

    return () => clearInterval(id);
  }, []);

  return {
    loading,
    error,
    listSettings,
    cardSettings,
    reload: load,
    forceRefresh,
  };
}
