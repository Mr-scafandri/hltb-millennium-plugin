import type { LibrarySelectors, GamePageInfo, UIMode } from '../types';
import { log } from '../services/logger';

// Stored by the Big Picture route patch when it fires
let routePatchAppId: number | null = null;
let routePatchGameName: string | undefined = undefined;

export function setRoutePatchData(appId: number, gameName?: string): void {
  routePatchAppId = appId;
  routePatchGameName = gameName;
}

export function clearRoutePatchData(): void {
  routePatchAppId = null;
  routePatchGameName = undefined;
}

function extractGameName(appId: number): string | undefined {
  try {
    const overview = window.appStore?.GetAppOverviewByAppID(appId);
    return overview?.display_name || undefined;
  } catch {
    return undefined;
  }
}

function tryExtractGamePage(
  doc: Document,
  imageSelector: string,
  containerSelector: string,
  appIdPattern: RegExp
): GamePageInfo | null {
  const img = doc.querySelector(imageSelector) as HTMLImageElement | null;
  if (!img) return null;

  const src = img.src || '';
  const match = src.match(appIdPattern);
  if (!match) return null;

  const appId = parseInt(match[1], 10);
  const container = img.closest(containerSelector) as HTMLElement | null;
  if (!container) return null;

  return { appId, container };
}

export async function detectGamePage(
  doc: Document,
  selectors: LibrarySelectors,
  mode: UIMode
): Promise<GamePageInfo | null> {
  if (mode === 'desktop') {
    return detectDesktop(doc, selectors);
  }
  return detectBigPicture(doc, selectors);
}

// Desktop: pathname is reliable and updates on navigation.
// GetActiveAppID is a fallback (works in desktop, errors in Big Picture).
async function detectDesktop(doc: Document, selectors: LibrarySelectors): Promise<GamePageInfo | null> {
  // Strategy 1: pathname from MainWindowBrowserManager
  if (window.MainWindowBrowserManager?.m_lastLocation?.pathname) {
    const match = window.MainWindowBrowserManager.m_lastLocation.pathname.match(/\/app\/(\d+)/);
    if (match) {
      const appId = parseInt(match[1], 10);
      const container = doc.querySelector(selectors.containerSelector) as HTMLElement | null;
      if (container) {
        log('Detected via pathname:', appId);
        return { appId, container, gameName: extractGameName(appId) };
      }
    }
  }

  // Strategy 2: Steam Client API
  if (window.SteamClient?.Apps?.GetActiveAppID) {
    try {
      // @ts-ignore - GetActiveAppID might return -1 or 0 if invalid
      const appId = await window.SteamClient.Apps.GetActiveAppID();
      if (appId > 0) {
        const container = doc.querySelector(selectors.containerSelector) as HTMLElement | null;
        if (container) {
          log('Detected via GetActiveAppID:', appId);
          return { appId, container, gameName: extractGameName(appId) };
        }
      }
    } catch {
      // GetActiveAppID not available
    }
  }

  return null;
}

// Big Picture: pathname is stale and GetActiveAppID errors.
// Route patch (set up in observer.ts) provides appid from React component tree.
// Image-based detection is a fallback. Custom logos can cause wrong appId.
function detectBigPicture(doc: Document, selectors: LibrarySelectors): GamePageInfo | null {
  // Strategy 1: appId from route patch (set by routerHook.addPatch callback)
  if (routePatchAppId) {
    const container = doc.querySelector(selectors.containerSelector) as HTMLElement | null;
    if (container) {
      log('Detected via route patch:', routePatchAppId);
      return { appId: routePatchAppId, container, gameName: routePatchGameName || extractGameName(routePatchAppId) };
    }
  }

  // Strategy 2: extract appId from header image URL (/assets/{appId}/...)
  // Fragile: custom logos can cause wrong appId.
  const result =
    tryExtractGamePage(doc, selectors.headerImageSelector, selectors.containerSelector, selectors.appIdPattern) ||
    tryExtractGamePage(doc, selectors.fallbackImageSelector, selectors.containerSelector, selectors.appIdPattern);
  if (result) {
    log('Detected via image:', result.appId);
    result.gameName = extractGameName(result.appId);
    return result;
  }

  return null;
}
