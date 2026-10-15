import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { api } from '../services/apiService';
import { 
  LoginBackgroundConfig, 
  DEFAULT_LOGIN_BG_CONFIG, 
  parseLoginBgConfig,
  resolveLoginBackgroundUrl 
} from '../data/loginBackgroundPresets';

export type MapProviderId = 'google' | 'osm' | 'arcgis';

export const DEFAULT_PROJECT_NAME = 'MelonPro';
export const DEFAULT_FOOT_TAG = 'MelonPro ERP & Farm Operations — Smart Farming Together';
export const DEFAULT_SHOW_DEMO_ACCOUNTS = true;

export interface MapSettings {
  provider: MapProviderId;
  googleApiKey: string;
  arcgisApiKey: string;
  osmLayerType: 'standard' | 'topo' | 'satellite';
  arcgisLayerType: 'satellite' | 'streets' | 'topo';
  loginBgConfig: LoginBackgroundConfig;
  projectName: string;
  footTag: string;
  showDemoAccounts: boolean;
}

export const DEFAULT_GOOGLE_KEY = 
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 
  'AIzaSyDhJoeKPt_mCq7_ohdDV-3sfzUv43NxScI';

export const DEFAULT_ARCGIS_KEY = 
  import.meta.env.VITE_ARCGIS_API_KEY || 
  'AAPTa3Hqy5Co-o8CwwxDA02Ga3g..iTswZDboe0yi9lBXA4FHN_LCRRHPzeMsuu2zbhhfkHMRpMdXMTSqobDD_QsEZTpWA7Xpx7fqRy1ZwctIZM59XM550Nl_vqqv79Qa9mCjnIFysy-K5Dl55nF6ZAJvUlEqXKMwdwL33knPcifOPqnZjuQCxubnA0iAhu1-SQBgLqz3_JLDU-oJP-YLs1e-T_o5eu6iVXR0Bgn08Jx01AxpbsXGAOn_au24IDKGzmshtJYwufCerT2XKfNxISw.AT1_gsBSONW4';

export const STORAGE_KEY = 'melonpro_system_settings_v2';
export const LEGACY_STORAGE_KEY = 'melonpro_map_settings_v1';

interface MapSettingsContextType {
  settings: MapSettings;
  provider: MapProviderId;
  googleApiKey: string;
  arcgisApiKey: string;
  loginBgConfig: LoginBackgroundConfig;
  loginBgUrl: string; // resolved image URL ready for <img> or CSS background
  projectName: string;
  footTag: string;
  showDemoAccounts: boolean;
  setMapProvider: (provider: MapProviderId) => void;
  setGoogleApiKey: (key: string) => void;
  setArcgisApiKey: (key: string) => void;
  setOsmLayerType: (type: 'standard' | 'topo' | 'satellite') => void;
  setArcgisLayerType: (type: 'satellite' | 'streets' | 'topo') => void;
  setLoginBgConfig: (config: Partial<LoginBackgroundConfig> | string) => void;
  resetLoginBgToDefault: () => void;
  setProjectName: (name: string) => void;
  setFootTag: (tag: string) => void;
  setShowDemoAccounts: (show: boolean) => void;
  saveSettings: (partial?: Partial<MapSettings>) => Promise<void>;
  resetToDefaults: () => void;
  isGoogleConfigured: boolean;
  isArcgisConfigured: boolean;
}

const MapSettingsContext = createContext<MapSettingsContextType | null>(null);

export const MapSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<MapSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          provider: parsed.provider || 'google',
          googleApiKey: parsed.googleApiKey || DEFAULT_GOOGLE_KEY,
          arcgisApiKey: parsed.arcgisApiKey || DEFAULT_ARCGIS_KEY,
          osmLayerType: parsed.osmLayerType || 'satellite',
          arcgisLayerType: parsed.arcgisLayerType || 'satellite',
          loginBgConfig: parseLoginBgConfig(parsed.loginBgConfig || parsed.loginBgUrl),
          projectName: typeof parsed.projectName === 'string' && parsed.projectName.trim() 
            ? parsed.projectName.trim() 
            : DEFAULT_PROJECT_NAME,
          footTag: typeof parsed.footTag === 'string' && parsed.footTag.trim() 
            ? parsed.footTag.trim() 
            : DEFAULT_FOOT_TAG,
          showDemoAccounts: parsed.showDemoAccounts !== undefined 
            ? Boolean(parsed.showDemoAccounts) 
            : DEFAULT_SHOW_DEMO_ACCOUNTS,
        };
      }
    } catch (e) {
      console.warn('Failed to read map/system settings from storage', e);
    }

    return {
      provider: 'google',
      googleApiKey: DEFAULT_GOOGLE_KEY,
      arcgisApiKey: DEFAULT_ARCGIS_KEY,
      osmLayerType: 'satellite',
      arcgisLayerType: 'satellite',
      loginBgConfig: { ...DEFAULT_LOGIN_BG_CONFIG },
      projectName: DEFAULT_PROJECT_NAME,
      footTag: DEFAULT_FOOT_TAG,
      showDemoAccounts: DEFAULT_SHOW_DEMO_ACCOUNTS,
    };
  });

  // Sync document title with current project name
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const title = settings.projectName || DEFAULT_PROJECT_NAME;
      document.title = `${title} — Smart Farm Management & Crop Operations`;
    }
  }, [settings.projectName]);

  // Sync settings from backend if available on startup
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const serverSettings = await api.getSettings();
        if (serverSettings && isMounted) {
          setSettings((prev) => {
            const updated: MapSettings = {
              ...prev,
              provider: (serverSettings.mapProvider as MapProviderId) || prev.provider,
              googleApiKey: serverSettings.googleApiKey || prev.googleApiKey || DEFAULT_GOOGLE_KEY,
              arcgisApiKey: serverSettings.arcgisApiKey || prev.arcgisApiKey || DEFAULT_ARCGIS_KEY,
              loginBgConfig: serverSettings.loginBgUrl 
                ? parseLoginBgConfig(serverSettings.loginBgUrl) 
                : prev.loginBgConfig,
              projectName: typeof serverSettings.projectName === 'string' && serverSettings.projectName.trim()
                ? serverSettings.projectName.trim()
                : prev.projectName || DEFAULT_PROJECT_NAME,
              footTag: typeof serverSettings.footTag === 'string' && serverSettings.footTag.trim()
                ? serverSettings.footTag.trim()
                : prev.footTag || DEFAULT_FOOT_TAG,
              showDemoAccounts: serverSettings.showDemoAccounts !== undefined
                ? Boolean(serverSettings.showDemoAccounts)
                : (prev.showDemoAccounts ?? DEFAULT_SHOW_DEMO_ACCOUNTS),
            };
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            } catch {
              // ignore
            }
            return updated;
          });
        }
      } catch {
        // Backend offline or running in mock mode, use localStorage/env
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const persistSettings = useCallback((newSettings: MapSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    } catch (e) {
      console.warn('Failed to save settings to storage', e);
    }
  }, []);

  const setMapProvider = useCallback((provider: MapProviderId) => {
    persistSettings({ ...settings, provider });
    api.updateSettings({ mapProvider: provider }).catch(() => {});
  }, [settings, persistSettings]);

  const setGoogleApiKey = useCallback((googleApiKey: string) => {
    persistSettings({ ...settings, googleApiKey });
  }, [settings, persistSettings]);

  const setArcgisApiKey = useCallback((arcgisApiKey: string) => {
    persistSettings({ ...settings, arcgisApiKey });
  }, [settings, persistSettings]);

  const setOsmLayerType = useCallback((osmLayerType: 'standard' | 'topo' | 'satellite') => {
    persistSettings({ ...settings, osmLayerType });
  }, [settings, persistSettings]);

  const setArcgisLayerType = useCallback((arcgisLayerType: 'satellite' | 'streets' | 'topo') => {
    persistSettings({ ...settings, arcgisLayerType });
  }, [settings, persistSettings]);

  const setLoginBgConfig = useCallback((newConfig: Partial<LoginBackgroundConfig> | string) => {
    let updatedConfig: LoginBackgroundConfig;
    if (typeof newConfig === 'string') {
      updatedConfig = { ...settings.loginBgConfig, url: newConfig };
    } else {
      updatedConfig = { ...settings.loginBgConfig, ...newConfig };
    }
    const updated = { ...settings, loginBgConfig: updatedConfig };
    persistSettings(updated);
    // Sync to backend
    api.updateSettings({ loginBgUrl: JSON.stringify(updatedConfig) }).catch(() => {});
  }, [settings, persistSettings]);

  const resetLoginBgToDefault = useCallback(() => {
    const updatedConfig = { ...DEFAULT_LOGIN_BG_CONFIG };
    const updated = { ...settings, loginBgConfig: updatedConfig };
    persistSettings(updated);
    api.updateSettings({ loginBgUrl: JSON.stringify(updatedConfig) }).catch(() => {});
  }, [settings, persistSettings]);

  const setProjectName = useCallback((name: string) => {
    const validName = name.trim() || DEFAULT_PROJECT_NAME;
    const updated = { ...settings, projectName: validName };
    persistSettings(updated);
    api.updateSettings({ projectName: validName }).catch(() => {});
  }, [settings, persistSettings]);

  const setFootTag = useCallback((tag: string) => {
    const updated = { ...settings, footTag: tag };
    persistSettings(updated);
    api.updateSettings({ footTag: tag }).catch(() => {});
  }, [settings, persistSettings]);

  const setShowDemoAccounts = useCallback((show: boolean) => {
    const updated = { ...settings, showDemoAccounts: show };
    persistSettings(updated);
    api.updateSettings({ showDemoAccounts: show }).catch(() => {});
  }, [settings, persistSettings]);

  const saveSettings = useCallback(async (partial?: Partial<MapSettings>) => {
    const updated = { ...settings, ...(partial || {}) };
    persistSettings(updated);
    try {
      await api.updateSettings({
        mapProvider: updated.provider,
        googleApiKey: updated.googleApiKey,
        arcgisApiKey: updated.arcgisApiKey,
        loginBgUrl: JSON.stringify(updated.loginBgConfig),
        projectName: updated.projectName,
        footTag: updated.footTag,
        showDemoAccounts: updated.showDemoAccounts !== undefined ? updated.showDemoAccounts : true,
      });
    } catch (e) {
      console.warn('Failed to sync settings with server', e);
    }
  }, [settings, persistSettings]);

  const resetToDefaults = useCallback(() => {
    const defaults: MapSettings = {
      provider: 'google',
      googleApiKey: DEFAULT_GOOGLE_KEY,
      arcgisApiKey: DEFAULT_ARCGIS_KEY,
      osmLayerType: 'satellite',
      arcgisLayerType: 'satellite',
      loginBgConfig: { ...DEFAULT_LOGIN_BG_CONFIG },
      projectName: DEFAULT_PROJECT_NAME,
      footTag: DEFAULT_FOOT_TAG,
      showDemoAccounts: DEFAULT_SHOW_DEMO_ACCOUNTS,
    };
    persistSettings(defaults);
    api.updateSettings({
      mapProvider: defaults.provider,
      googleApiKey: defaults.googleApiKey,
      arcgisApiKey: defaults.arcgisApiKey,
      loginBgUrl: JSON.stringify(defaults.loginBgConfig),
      projectName: defaults.projectName,
      footTag: defaults.footTag,
      showDemoAccounts: defaults.showDemoAccounts,
    }).catch(() => {});
  }, [persistSettings]);

  const isGoogleConfigured = Boolean(settings.googleApiKey && settings.googleApiKey.trim().length > 5);
  const isArcgisConfigured = Boolean(settings.arcgisApiKey && settings.arcgisApiKey.trim().length > 10);
  const resolvedLoginBgUrl = resolveLoginBackgroundUrl(settings.loginBgConfig?.url);

  return (
    <MapSettingsContext.Provider
      value={{
        settings,
        provider: settings.provider,
        googleApiKey: settings.googleApiKey,
        arcgisApiKey: settings.arcgisApiKey,
        loginBgConfig: settings.loginBgConfig,
        loginBgUrl: resolvedLoginBgUrl,
        projectName: settings.projectName || DEFAULT_PROJECT_NAME,
        footTag: settings.footTag ?? DEFAULT_FOOT_TAG,
        showDemoAccounts: settings.showDemoAccounts !== undefined ? settings.showDemoAccounts : DEFAULT_SHOW_DEMO_ACCOUNTS,
        setMapProvider,
        setGoogleApiKey,
        setArcgisApiKey,
        setOsmLayerType,
        setArcgisLayerType,
        setLoginBgConfig,
        resetLoginBgToDefault,
        setProjectName,
        setFootTag,
        setShowDemoAccounts,
        saveSettings,
        resetToDefaults,
        isGoogleConfigured,
        isArcgisConfigured,
      }}
    >
      <APIProvider
        apiKey={settings.googleApiKey || DEFAULT_GOOGLE_KEY}
        libraries={['marker', 'geometry', 'drawing']}
      >
        {children}
      </APIProvider>
    </MapSettingsContext.Provider>
  );
};

export const useMapSettings = (): MapSettingsContextType => {
  const context = useContext(MapSettingsContext);
  if (!context) {
    throw new Error('useMapSettings must be used within a MapSettingsProvider');
  }
  return context;
};

export const useAppSettings = useMapSettings;
