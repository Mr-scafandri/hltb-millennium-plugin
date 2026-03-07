import { callable } from '@steambrew/client';
import { log, logError } from './logger';

export interface PluginSettings {
  showInLibrary: boolean;
  showInStore: boolean;
  showViewDetails: boolean;
  alignRight: boolean;
  alignBottom: boolean;
  horizontalOffset: number;
  verticalOffset: number;
}

interface SettingsResponse {
  success: boolean;
  error?: string;
  data?: PluginSettings;
}

const DEFAULT_SETTINGS: PluginSettings = {
  showInLibrary: true,
  showInStore: true,
  showViewDetails: true,
  alignRight: true,
  alignBottom: true,
  horizontalOffset: 0,
  verticalOffset: 0,
};

const GetSettingsRpc = callable<[], string>('GetSettings');
const SaveSettingsRpc = callable<[{ settings_json: string }], string>('SaveSettings');

let cachedSettings: PluginSettings = { ...DEFAULT_SETTINGS };

export async function initSettings(): Promise<void> {
  try {
    const resultJson = await GetSettingsRpc();
    if (!resultJson) return;

    const result: SettingsResponse = JSON.parse(resultJson);
    if (result.success && result.data) {
      cachedSettings = { ...DEFAULT_SETTINGS, ...result.data };
      log('Settings loaded from backend');
    }
  } catch (e) {
    logError('Failed to load settings:', e);
  }
}

export function getSettings(): PluginSettings {
  return cachedSettings;
}

export async function saveSettings(settings: PluginSettings): Promise<void> {
  cachedSettings = settings;

  try {
    const resultJson = await SaveSettingsRpc({ settings_json: JSON.stringify(settings) });
    if (!resultJson) return;

    const result = JSON.parse(resultJson);
    if (!result.success) {
      logError('Failed to save settings:', result.error);
    }
  } catch (e) {
    logError('Failed to save settings:', e);
  }
}
