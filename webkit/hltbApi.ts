import { callable } from '@steambrew/webkit';

// Also defined in frontend/types.ts (separate build target, can't share code)
export interface HltbGameResult {
  searched_name: string;
  game_id?: number;
  game_name?: string;
  comp_main?: number | null;
  comp_plus?: number | null;
  comp_100?: number | null;
}

// Also defined in frontend/services/hltbApi.ts (separate build target, can't share code)
interface BackendResponse {
  success: boolean;
  error?: string;
  data?: HltbGameResult;
  fromCache?: boolean;
  isStale?: boolean;
}

const GetHltbData = callable<[{ app_id: number; fallback_name?: string; force_refresh?: boolean }], string>('GetHltbData');

export interface FetchResult {
  data: HltbGameResult | null;
  refreshPromise: Promise<HltbGameResult | null> | null;
}

export async function fetchHltbData(appId: number, fallbackName?: string): Promise<FetchResult> {
  try {
    const resultJson = await GetHltbData({ app_id: appId, fallback_name: fallbackName });
    if (!resultJson) return { data: null, refreshPromise: null };

    const result: BackendResponse = JSON.parse(resultJson);
    if (!result.success || !result.data) return { data: null, refreshPromise: null };

    // Background refresh for stale data or misses (same pattern as library)
    const isMiss = result.data && !result.data.game_id;
    if (result.fromCache && (result.isStale || isMiss)) {
      const refreshPromise = GetHltbData({ app_id: appId, fallback_name: fallbackName, force_refresh: true })
        .then((json) => {
          if (!json) return null;
          const r: BackendResponse = JSON.parse(json);
          return (r.success && r.data) ? r.data : null;
        })
        .catch(() => null);
      return { data: result.data, refreshPromise };
    }

    return { data: result.data, refreshPromise: null };
  } catch (e) {
    console.error('[HLTB] Backend call failed:', e);
    return { data: null, refreshPromise: null };
  }
}
