import { callable } from '@steambrew/webkit';

export interface HltbGameResult {
  searched_name: string;
  game_id?: number;
  game_name?: string;
  comp_main?: number | null;
  comp_plus?: number | null;
  comp_100?: number | null;
}

interface BackendResponse {
  success: boolean;
  error?: string;
  data?: HltbGameResult;
}

const GetHltbData = callable<[{ app_id: number; fallback_name?: string }], string>('GetHltbData');

export async function fetchHltbData(appId: number, fallbackName?: string): Promise<HltbGameResult | null> {
  try {
    const resultJson = await GetHltbData({ app_id: appId, fallback_name: fallbackName });
    if (!resultJson) return null;

    const result: BackendResponse = JSON.parse(resultJson);
    if (!result.success || !result.data) return null;

    return result.data;
  } catch (e) {
    console.error('[HLTB] Backend call failed:', e);
    return null;
  }
}
