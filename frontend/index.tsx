import { useState, useEffect } from 'react';
import { definePlugin, Millennium, IconsModule, Field, DialogButton } from '@steambrew/client';
import { log } from './services/logger';
import { LIBRARY_SELECTORS } from './types';
import { setupObserver, resetState, disconnectObserver, refreshDisplay } from './injection/observer';
import { exposeDebugTools, removeDebugTools } from './debug/tools';
import { removeStyles } from './display/styles';
import { removeExistingDisplay } from './display/components';
import { clearCache, getCacheStats } from './services/cache';
import { getSettings, saveSettings, initSettings } from './services/settings';
import { initializeIdCache } from './services/hltbApi';
import { getIdCacheStats, clearIdCache } from './services/hltbIdCache';

let currentDocument: Document | undefined;
let initializedForUserId: string | null = null;

const STORE_POSITION_OPTIONS = [
  { value: 'top', label: 'Sidebar start' },
  { value: 'achievements', label: 'Achievements' },
  { value: 'details', label: 'Game details' },
  { value: 'bottom', label: 'Sidebar end' },
];

const SettingsContent = () => {
  const [message, setMessage] = useState('');
  const [showInLibrary, setShowInLibrary] = useState(true);
  const [showInStore, setShowInStore] = useState(true);
  const [horizontalOffset, setHorizontalOffset] = useState('0');
  const [verticalOffset, setVerticalOffset] = useState('0');
  const [showViewDetails, setShowViewDetails] = useState(true);
  const [alignRight, setAlignRight] = useState(true);
  const [alignBottom, setAlignBottom] = useState(true);
  const [storePosition, setStorePosition] = useState('achievements');
  const [showStoreViewDetails, setShowStoreViewDetails] = useState(true);

  useEffect(() => {
    const settings = getSettings();
    setShowInLibrary(settings.showInLibrary);
    setShowInStore(settings.showInStore);
    setHorizontalOffset(String(settings.horizontalOffset));
    setVerticalOffset(String(settings.verticalOffset));
    setShowViewDetails(settings.showViewDetails);
    setAlignRight(settings.alignRight);
    setAlignBottom(settings.alignBottom);
    setStorePosition(settings.storePosition);
    setShowStoreViewDetails(settings.showStoreViewDetails);
  }, []);

  const onShowInLibraryChange = (checked: boolean) => {
    setShowInLibrary(checked);
    saveSettings({ ...getSettings(), showInLibrary: checked });
    refreshDisplay();
  };

  const onShowInStoreChange = (checked: boolean) => {
    setShowInStore(checked);
    saveSettings({ ...getSettings(), showInStore: checked });
  };

  const onStorePositionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setStorePosition(value);
    saveSettings({ ...getSettings(), storePosition: value as any });
  };

  const onShowStoreViewDetailsChange = (checked: boolean) => {
    setShowStoreViewDetails(checked);
    saveSettings({ ...getSettings(), showStoreViewDetails: checked });
  };

  const onHorizontalOffsetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setHorizontalOffset(value);
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      saveSettings({ ...getSettings(), horizontalOffset: numValue });
      refreshDisplay();
    }
  };

  const onVerticalOffsetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setVerticalOffset(value);
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      saveSettings({ ...getSettings(), verticalOffset: numValue });
      refreshDisplay();
    }
  };

  const onShowViewDetailsChange = (checked: boolean) => {
    setShowViewDetails(checked);
    saveSettings({ ...getSettings(), showViewDetails: checked });
    refreshDisplay();
  };

  const onAlignRightChange = (checked: boolean) => {
    setAlignRight(checked);
    saveSettings({ ...getSettings(), alignRight: checked });
    refreshDisplay();
  };

  const onAlignBottomChange = (checked: boolean) => {
    setAlignBottom(checked);
    saveSettings({ ...getSettings(), alignBottom: checked });
    refreshDisplay();
  };

  const onCacheStats = () => {
    const stats = getCacheStats();
    const idStats = getIdCacheStats();

    const parts: string[] = [];

    // Result cache stats
    if (stats.count === 0) {
      parts.push('Result cache: empty');
    } else {
      const age = stats.oldestTimestamp
        ? Math.round((Date.now() - stats.oldestTimestamp) / (1000 * 60 * 60 * 24))
        : 0;
      parts.push(`Result cache: ${stats.count} games, oldest ${age}d`);
    }

    // ID cache stats
    if (idStats.count === 0) {
      parts.push('ID cache: empty');
    } else {
      const age = idStats.ageMs
        ? Math.round(idStats.ageMs / (1000 * 60 * 60 * 24))
        : 0;
      parts.push(`ID cache: ${idStats.count} mappings, ${age}d old`);
    }

    setMessage(parts.join(' | '));
  };

  const onClearCache = () => {
    clearCache();
    clearIdCache();
    setMessage('All caches cleared');
  };

  return (
    <>
      {/* Library View */}
      <div style={{ fontSize: '16px', fontWeight: 'bold', padding: '16px 0 8px', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '0' }}>Library View</div>
      <Field label="Show in Library" bottomSeparator="standard">
        <input
          type="checkbox"
          checked={showInLibrary}
          onChange={(e) => onShowInLibraryChange(e.target.checked)}
          style={{ width: '20px', height: '20px' }}
        />
      </Field>
      <Field label="Horizontal Offset (px)" description="Distance from aligned edge. Negative values shift in the opposite direction." bottomSeparator="standard">
        <input
          type="number"
          value={horizontalOffset}
          onChange={onHorizontalOffsetChange}
          style={{ width: '60px', padding: '4px 8px' }}
        />
      </Field>
      <Field label="Vertical Offset (px)" description="Distance from aligned edge. Negative values shift in the opposite direction." bottomSeparator="standard">
        <input
          type="number"
          value={verticalOffset}
          onChange={onVerticalOffsetChange}
          style={{ width: '60px', padding: '4px 8px' }}
        />
      </Field>
      <Field label="Align to Right" description="Uncheck for left align" bottomSeparator="standard">
        <input
          type="checkbox"
          checked={alignRight}
          onChange={(e) => onAlignRightChange(e.target.checked)}
          style={{ width: '20px', height: '20px' }}
        />
      </Field>
      <Field label="Align to Bottom" description="Uncheck for top align" bottomSeparator="standard">
        <input
          type="checkbox"
          checked={alignBottom}
          onChange={(e) => onAlignBottomChange(e.target.checked)}
          style={{ width: '20px', height: '20px' }}
        />
      </Field>
      <Field label="Show View Details Link" description="Display link to HLTB game page" bottomSeparator="standard">
        <input
          type="checkbox"
          checked={showViewDetails}
          onChange={(e) => onShowViewDetailsChange(e.target.checked)}
          style={{ width: '20px', height: '20px' }}
        />
      </Field>

      {/* Store View */}
      <div style={{ fontSize: '16px', fontWeight: 'bold', padding: '28px 0 8px', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '0' }}>Store View</div>
      <Field label="Show in Store" description="Store settings apply on next page load" bottomSeparator="standard">
        <input
          type="checkbox"
          checked={showInStore}
          onChange={(e) => onShowInStoreChange(e.target.checked)}
          style={{ width: '20px', height: '20px' }}
        />
      </Field>
      <Field label="Position" bottomSeparator="standard">
        <select
          value={storePosition}
          onChange={onStorePositionChange}
          style={{ padding: '4px 8px' }}
        >
          {STORE_POSITION_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </Field>
      <Field label="Show View Details Link" description="Display link to HLTB game page" bottomSeparator="standard">
        <input
          type="checkbox"
          checked={showStoreViewDetails}
          onChange={(e) => onShowStoreViewDetailsChange(e.target.checked)}
          style={{ width: '20px', height: '20px' }}
        />
      </Field>

      {/* Cache */}
      <div style={{ fontSize: '16px', fontWeight: 'bold', padding: '28px 0 8px', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '0' }}>Cache</div>
      <Field label="Cache Statistics" bottomSeparator="standard">
        <DialogButton onClick={onCacheStats} style={{ padding: '8px 16px' }}>View Stats</DialogButton>
      </Field>
      <Field label="Clear Cache" bottomSeparator="standard">
        <DialogButton onClick={onClearCache} style={{ padding: '8px 16px' }}>Clear</DialogButton>
      </Field>
      {message && <Field description={message} />}
    </>
  );
};

export default definePlugin(() => {
  log('HLTB plugin loading...');

  // Start loading settings from backend in background (non-blocking)
  initSettings();

  Millennium.AddWindowCreateHook?.((context: any) => {
    // Only handle main Steam windows (Desktop or Big Picture)
    if (!context.m_strName?.startsWith('SP ')) return;

    const doc = context.m_popup?.document;
    if (!doc?.body) return;

    log('Window created:', context.m_strName);

    // Clean up old document if switching modes
    if (currentDocument && currentDocument !== doc) {
      log('Mode switch detected, cleaning up old document');
      removeDebugTools(currentDocument);
      removeStyles(currentDocument);
      removeExistingDisplay(currentDocument);
      disconnectObserver();
      resetState();
    }

    currentDocument = doc;
    setupObserver(doc, LIBRARY_SELECTORS);
    exposeDebugTools(doc);

    // Initialize ID cache in background (non-blocking)
    // Uses HLTB's Steam import API to get steam_id -> hltb_id mappings
    // Skip if already successfully initialized for this user ID
    const steamUserId = (window as any).App?.m_CurrentUser?.strSteamID;
    if (steamUserId && steamUserId !== initializedForUserId) {
      initializeIdCache(steamUserId).then((success) => {
        if (success) {
          initializedForUserId = steamUserId;
          log('ID cache initialized successfully');
        }
      });
    }
  });

  return {
    title: 'HLTB for Steam',
    icon: <IconsModule.Settings />,
    content: <SettingsContent />,
  };
});
