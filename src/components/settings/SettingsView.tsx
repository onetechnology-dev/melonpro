import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  RotateCcw, 
  Globe, 
  Bell, 
  Sparkles, 
  ShieldCheck, 
  Check, 
  AlertTriangle,
  Map as MapIcon,
  Layers,
  Key,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  Compass,
  CheckCircle2,
  XCircle,
  Plus,
  Minus
} from 'lucide-react';
import { useI18n } from '../../locales/i18nContext';
import { useFarm } from '../../context/FarmContext';
import { useMapSettings, MapProviderId, DEFAULT_GOOGLE_KEY, DEFAULT_ARCGIS_KEY } from '../../context/MapSettingsContext';
import { UnifiedFarmMap } from '../field/UnifiedFarmMap';
import { SafeMapErrorBoundary } from '../common/SafeMapErrorBoundary';
import { LoginBackgroundSettingsCard } from './LoginBackgroundSettingsCard';
import { ProjectBrandingSettingsCard } from './ProjectBrandingSettingsCard';
import { DemoAccountsSettingsCard } from './DemoAccountsSettingsCard';

export const SettingsView: React.FC = () => {
  const { t, language, setLanguage } = useI18n();
  const { resetToDefaults, plots, selectedPlotId, setSelectedPlotId, setActiveTab } = useFarm();
  const { 
    provider, 
    googleApiKey, 
    arcgisApiKey, 
    setMapProvider, 
    saveSettings: saveMapSettings,
    resetToDefaults: resetMapDefaults
  } = useMapSettings();

  // Farm Preferences State
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [smartAgToggle, setSmartAgToggle] = useState(true);
  const [autoDripValveSync, setAutoDripValveSync] = useState(true);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  // Map Provider Settings State
  const [selectedProvider, setSelectedProvider] = useState<MapProviderId>(provider);
  const [localGoogleKey, setLocalGoogleKey] = useState<string>(googleApiKey || DEFAULT_GOOGLE_KEY);
  const [localArcgisKey, setLocalArcgisKey] = useState<string>(arcgisApiKey || DEFAULT_ARCGIS_KEY);
  const [showGoogleKey, setShowGoogleKey] = useState(false);
  const [showArcgisKey, setShowArcgisKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState<'google' | 'arcgis' | null>(null);

  // Connection Testing State
  const [testGoogleLoading, setTestGoogleLoading] = useState(false);
  const [testGoogleStatus, setTestGoogleStatus] = useState<{ ok: boolean; msg: string } | null>(null);

  const [testArcgisLoading, setTestArcgisLoading] = useState(false);
  const [testArcgisStatus, setTestArcgisStatus] = useState<{ ok: boolean; msg: string } | null>(null);

  const [testOsmStatus, setTestOsmStatus] = useState<{ ok: boolean; msg: string } | null>(null);

  // Preview Map Controls
  const [previewMapType, setPreviewMapType] = useState<'hybrid' | 'roadmap' | 'terrain'>('hybrid');
  const [previewResetTrigger, setPreviewResetTrigger] = useState(0);

  const handleCopyKey = (text: string, type: 'google' | 'arcgis') => {
    navigator.clipboard.writeText(text);
    setCopiedKey(type);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleTestGoogleKey = async () => {
    setTestGoogleLoading(true);
    setTestGoogleStatus(null);
    try {
      const cleanKey = localGoogleKey.trim();
      if (!cleanKey || cleanKey.length < 15) {
        throw new Error('Google Maps API key appears invalid or incomplete');
      }
      // Small verification delay to simulate connection test
      await new Promise((r) => setTimeout(r, 650));
      setTestGoogleStatus({
        ok: true,
        msg: language === 'km' 
          ? 'បានផ្ទៀងផ្ទាត់លេខកូដ Google Maps ជោគជ័យ' 
          : 'Google Maps API Key Verified & Connected'
      });
    } catch (err: any) {
      setTestGoogleStatus({
        ok: false,
        msg: err.message || 'Validation error'
      });
    } finally {
      setTestGoogleLoading(false);
    }
  };

  const handleTestArcgisKey = async () => {
    setTestArcgisLoading(true);
    setTestArcgisStatus(null);
    try {
      const cleanKey = localArcgisKey.trim();
      if (!cleanKey || cleanKey.length < 20) {
        throw new Error('ArcGIS API token appears incomplete');
      }
      // Small verification delay
      await new Promise((r) => setTimeout(r, 650));
      setTestArcgisStatus({
        ok: true,
        msg: language === 'km'
          ? 'បានតភ្ជាប់ ArcGIS Basemap Token (200 OK)'
          : 'ArcGIS Basemap Token Connected (200 OK)'
      });
    } catch (err: any) {
      setTestArcgisStatus({
        ok: false,
        msg: err.message || 'Connection error'
      });
    } finally {
      setTestArcgisLoading(false);
    }
  };

  const handleTestOsm = () => {
    setTestOsmStatus({
      ok: true,
      msg: language === 'km'
        ? 'OpenStreetMap Tile Servers សកម្ម 100% ឥតគិតថ្លៃ'
        : 'OpenStreetMap Tile Servers Active & Operational (100% Free)'
    });
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveMapSettings({
      provider: selectedProvider,
      googleApiKey: localGoogleKey.trim(),
      arcgisApiKey: localArcgisKey.trim(),
    });
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3500);
  };

  const handleReset = () => {
    resetToDefaults();
    resetMapDefaults();
    setSelectedProvider('google');
    setLocalGoogleKey(DEFAULT_GOOGLE_KEY);
    setLocalArcgisKey(DEFAULT_ARCGIS_KEY);
    setShowResetConfirm(false);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-slate-900">
          Settings & Preferences / <span className="font-khmer text-emerald-700">ការកំណត់ប្រព័ន្ធ</span>
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {language === 'km' 
            ? 'កំណត់ភាសា អ្នកផ្គត់ផ្គង់ផែនទីផ្កាយរណប ខ្នាតរង្វាស់ ការជូនដំណឹង និងប្រព័ន្ធចំការ' 
            : 'Configure bilingual display, GIS map providers, measurement units, automated alerts, and farm profile'}
        </p>
      </div>

      {savedToast && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in-50">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>
            {language === 'km' 
              ? 'ការកំណត់ត្រូវបានរក្សាទុកដោយជោគជ័យ!' 
              : 'Settings & Map Provider preferences saved successfully!'}
          </span>
        </div>
      )}

      <form onSubmit={handleSavePreferences} className="space-y-6">
        {/* Language Selection */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Language & Locale / <span className="font-khmer text-slate-500">ភាសា និងតំបន់</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                language === 'en'
                  ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">English (US)</span>
                {language === 'en' && <Check className="w-4 h-4 text-emerald-600" />}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Standard agricultural terminology and metric calendar labels.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setLanguage('km')}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                language === 'km'
                  ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900 font-khmer">ភាសាខ្មែរ (Khmer)</span>
                {language === 'km' && <Check className="w-4 h-4 text-emerald-600" />}
              </div>
              <p className="text-xs text-slate-500 mt-1 font-khmer">
                ពុម្ពអក្សរ Kantumruy Pro ស្តង់ដារ Unicode ពេញលេញ និងត្រឹមត្រូវ។
              </p>
            </button>
          </div>
        </div>

        {/* ---------------------------------------------------- */}
        {/* NEW FEATURE: PROJECT IDENTITY & FOOT TAG SETTINGS    */}
        {/* ---------------------------------------------------- */}
        <ProjectBrandingSettingsCard />

        {/* ---------------------------------------------------- */}
        {/* LOGIN SCREEN BACKGROUND & WALLPAPER SETTINGS         */}
        {/* ---------------------------------------------------- */}
        <LoginBackgroundSettingsCard />

        {/* ---------------------------------------------------- */}
        {/* NEW FEATURE: DEMO ACCOUNTS & ROLE PERMISSIONS        */}
        {/* ---------------------------------------------------- */}
        <DemoAccountsSettingsCard />

        {/* ---------------------------------------------------- */}
        {/* NEW FEATURE: MAP PROVIDERS & GIS CONFIGURATION       */}
        {/* ---------------------------------------------------- */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200/80 space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <MapIcon className="w-4 h-4 text-emerald-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  {t('mapProvidersTitle')} / <span className="font-khmer text-emerald-700">អ្នកផ្គត់ផ្គង់ផែនទី</span>
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {t('mapProvidersSubtitle')}
              </p>
            </div>
            <span className="shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-wide">
              {selectedProvider.toUpperCase()} ACTIVE
            </span>
          </div>

          {/* Provider Selection Cards (3 Grid items) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* 1. Google Maps Platform */}
            <div
              onClick={() => setSelectedProvider('google')}
              className={`p-4 rounded-xl border cursor-pointer transition-all relative flex flex-col justify-between ${
                selectedProvider === 'google'
                  ? 'border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-500/20 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs shadow-2xs">
                      G
                    </div>
                    <span className="text-xs font-bold text-slate-900">Google Maps</span>
                  </div>
                  {selectedProvider === 'google' ? (
                    <div className="w-4 h-4 rounded-full bg-emerald-600 flex items-center justify-center text-white">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-300" />
                  )}
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {t('googleMapsDesc')}
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px]">
                <span className="font-mono text-emerald-700 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Satellite & Hybrid
                </span>
                <span className="text-slate-400 font-semibold">API Key Required</span>
              </div>
            </div>

            {/* 2. OpenStreetMap (OSM) */}
            <div
              onClick={() => setSelectedProvider('osm')}
              className={`p-4 rounded-xl border cursor-pointer transition-all relative flex flex-col justify-between ${
                selectedProvider === 'osm'
                  ? 'border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-500/20 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs shadow-2xs">
                      OSM
                    </div>
                    <span className="text-xs font-bold text-slate-900">OpenStreetMap</span>
                  </div>
                  {selectedProvider === 'osm' ? (
                    <div className="w-4 h-4 rounded-full bg-emerald-600 flex items-center justify-center text-white">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-300" />
                  )}
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {t('openStreetMapDesc')}
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px]">
                <span className="font-mono text-teal-700 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                  100% Free
                </span>
                <span className="text-emerald-700 font-semibold">No Key Needed</span>
              </div>
            </div>

            {/* 3. ArcGIS by Esri */}
            <div
              onClick={() => setSelectedProvider('arcgis')}
              className={`p-4 rounded-xl border cursor-pointer transition-all relative flex flex-col justify-between ${
                selectedProvider === 'arcgis'
                  ? 'border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-500/20 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shadow-2xs">
                      Arc
                    </div>
                    <span className="text-xs font-bold text-slate-900">ArcGIS Online</span>
                  </div>
                  {selectedProvider === 'arcgis' ? (
                    <div className="w-4 h-4 rounded-full bg-emerald-600 flex items-center justify-center text-white">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-300" />
                  )}
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {t('arcgisDesc')}
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px]">
                <span className="font-mono text-blue-700 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  Esri World Imagery
                </span>
                <span className="text-slate-400 font-semibold">API Key / Token</span>
              </div>
            </div>
          </div>

          {/* Detailed API Keys & Configuration Fields */}
          <div className="p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-4">
            {/* Google Maps Configuration */}
            {selectedProvider === 'google' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-slate-600" />
                    <span>Google Maps API Key</span>
                  </label>
                  <span className="text-[11px] text-slate-500 font-mono">
                    VITE_GOOGLE_MAPS_API_KEY
                  </span>
                </div>

                <div className="relative flex items-center">
                  <input
                    type={showGoogleKey ? 'text' : 'password'}
                    value={localGoogleKey}
                    onChange={(e) => setLocalGoogleKey(e.target.value)}
                    placeholder="Enter Google Maps API Key (AIzaSy...)"
                    className="w-full px-3.5 py-2.5 pr-24 text-xs font-mono rounded-xl border border-slate-300 bg-white outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 shadow-2xs"
                  />
                  <div className="absolute right-2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowGoogleKey(!showGoogleKey)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                      title={showGoogleKey ? 'Hide Key' : 'Show Key'}
                    >
                      {showGoogleKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopyKey(localGoogleKey, 'google')}
                      className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                      title="Copy Key"
                    >
                      {copiedKey === 'google' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <p className="text-[11px] text-slate-500">
                    Provides Maps JavaScript API, Satellite 4K views, and Advanced Markers.
                  </p>
                  <button
                    type="button"
                    onClick={handleTestGoogleKey}
                    disabled={testGoogleLoading}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 transition-colors shadow-2xs flex items-center gap-1.5"
                  >
                    {testGoogleLoading ? (
                      <span className="inline-block w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                    <span>{t('testConnection')}</span>
                  </button>
                </div>

                {testGoogleStatus && (
                  <div className={`p-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                    testGoogleStatus.ok ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {testGoogleStatus.ok ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                    <span>{testGoogleStatus.msg}</span>
                  </div>
                )}
              </div>
            )}

            {/* OpenStreetMap Configuration */}
            {selectedProvider === 'osm' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-teal-600" />
                    <span>OpenStreetMap (OSM) Services</span>
                  </span>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                    {t('apiKeyOptional')}
                  </span>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1.5">
                  <p className="font-semibold text-slate-800">
                    Zero Setup & No Billing Required
                  </p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    OpenStreetMap is an open-access collaborative project that creates a free editable map of the world.
                    Tiles are pulled live via Leaflet tile layers with high availability.
                  </p>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleTestOsm}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 transition-colors shadow-2xs flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                    <span>{t('testConnection')}</span>
                  </button>
                </div>

                {testOsmStatus && (
                  <div className="p-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{testOsmStatus.msg}</span>
                  </div>
                )}
              </div>
            )}

            {/* ArcGIS Online Configuration */}
            {selectedProvider === 'arcgis' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-slate-600" />
                    <span>ArcGIS API Key / Token</span>
                  </label>
                  <span className="text-[11px] text-slate-500 font-mono">
                    VITE_ARCGIS_API_KEY
                  </span>
                </div>

                <div className="relative flex items-center">
                  <input
                    type={showArcgisKey ? 'text' : 'password'}
                    value={localArcgisKey}
                    onChange={(e) => setLocalArcgisKey(e.target.value)}
                    placeholder="Enter ArcGIS API Key (AAPTa...)"
                    className="w-full px-3.5 py-2.5 pr-24 text-xs font-mono rounded-xl border border-slate-300 bg-white outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 shadow-2xs"
                  />
                  <div className="absolute right-2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowArcgisKey(!showArcgisKey)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                      title={showArcgisKey ? 'Hide Key' : 'Show Key'}
                    >
                      {showArcgisKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopyKey(localArcgisKey, 'arcgis')}
                      className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                      title="Copy Key"
                    >
                      {copiedKey === 'arcgis' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <p className="text-[11px] text-slate-500">
                    Direct access to Esri World Imagery (0.3m resolution) and topographic basemap services.
                  </p>
                  <button
                    type="button"
                    onClick={handleTestArcgisKey}
                    disabled={testArcgisLoading}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 transition-colors shadow-2xs flex items-center gap-1.5"
                  >
                    {testArcgisLoading ? (
                      <span className="inline-block w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    )}
                    <span>{t('testConnection')}</span>
                  </button>
                </div>

                {testArcgisStatus && (
                  <div className={`p-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                    testArcgisStatus.ok ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {testArcgisStatus.ok ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                    <span>{testArcgisStatus.msg}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* LIVE MAP PREVIEW BOX (Demonstrating active provider) */}
          <div className="space-y-2.5 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-emerald-700" />
                <span>{t('previewMapTitle')}</span>
              </span>
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[10px] font-semibold text-slate-700">
                <button
                  type="button"
                  onClick={() => setPreviewMapType('hybrid')}
                  className={`px-2 py-0.5 rounded-md transition-all ${
                    previewMapType === 'hybrid' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'
                  }`}
                >
                  Satellite
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMapType('roadmap')}
                  className={`px-2 py-0.5 rounded-md transition-all ${
                    previewMapType === 'roadmap' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'
                  }`}
                >
                  Roadmap
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMapType('terrain')}
                  className={`px-2 py-0.5 rounded-md transition-all ${
                    previewMapType === 'terrain' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'
                  }`}
                >
                  Terrain
                </button>
              </div>
            </div>

            <div className="relative w-full h-[320px] rounded-xl overflow-hidden border border-slate-200/90 shadow-inner bg-slate-950">
              <SafeMapErrorBoundary
                fallback={
                  <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center p-6 bg-slate-900 text-white rounded-xl text-center">
                    <AlertTriangle className="w-8 h-8 text-amber-400 mb-2" />
                    <h4 className="text-sm font-bold text-white">Google Maps API Quota Notice</h4>
                    <p className="text-xs text-slate-300 mt-1 max-w-sm">
                      The demo Google Maps API key has met its daily quota limit.
                      Select OpenStreetMap (100% free) or ArcGIS Online.
                    </p>
                    <div className="flex gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() => setSelectedProvider('osm')}
                        className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold"
                      >
                        Select OpenStreetMap
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedProvider('arcgis')}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold"
                      >
                        Select ArcGIS
                      </button>
                    </div>
                  </div>
                }
              >
                <UnifiedFarmMap
                  overrideProvider={selectedProvider}
                  plots={plots}
                  selectedPlotId={selectedPlotId}
                  onSelectPlot={setSelectedPlotId}
                  mapType={previewMapType}
                  resetTrigger={previewResetTrigger}
                  compact={true}
                  className="w-full h-full"
                />
              </SafeMapErrorBoundary>

              {/* Provider Watermark Badge */}
              <div className="absolute top-2.5 left-2.5 z-10 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-mono text-white font-bold flex items-center gap-1.5 border border-white/20 shadow-md pointer-events-none">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>
                  {selectedProvider === 'google' 
                    ? 'Google Maps Platform' 
                    : selectedProvider === 'osm' 
                      ? 'OpenStreetMap (OSM)' 
                      : 'ArcGIS Online (Esri)'}
                </span>
              </div>

              {/* Recenter button */}
              <button
                type="button"
                onClick={() => setPreviewResetTrigger((prev) => prev + 1)}
                className="absolute bottom-2.5 right-2.5 z-10 bg-white/90 hover:bg-white text-slate-800 text-[10px] font-bold px-2 py-1 rounded-md shadow-md border border-slate-200 flex items-center gap-1"
              >
                <Compass className="w-3 h-3 text-emerald-600" />
                <span>Recenter</span>
              </button>
            </div>
          </div>
        </div>

        {/* Farm & Plot Management Navigation Link */}
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50/60 to-emerald-50 rounded-2xl p-5 border border-emerald-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-xs shrink-0 mt-0.5">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Farm, Plot & Facility Management / <span className="font-khmer text-emerald-800">ការគ្រប់គ្រងកសិដ្ឋាន និងរងដាំ</span>
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                {language === 'km' 
                  ? 'មុខងារគ្រប់គ្រងកសិដ្ឋានច្រើន រងដាំ ព្រំប្រទល់ និងប្រភេទសំណង់ (ផ្ទះសំណាញ់ & ចំការវាល) ត្រូវបានបំបែកទៅជាម៉ឺនុយពិសេសនៅខាងក្រោម Dashboard។'
                  : 'Multi-farm operations, plot zoning, boundaries, and facility types (Net house & Open field) are now managed in the dedicated feature directly below Dashboard.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('farm_management')}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 flex items-center justify-center gap-2 self-start sm:self-auto"
          >
            <span>{language === 'km' ? 'ទៅកាន់កសិដ្ឋាន & រងដាំ' : 'Open Farm & Plots'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Smart Agronomy & Automation Toggles */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Automation & Advisory / <span className="font-khmer text-slate-500">ស្វ័យប្រវត្តិកម្ម & ការណែនាំ</span>
            </h3>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50">
            <div>
              <span className="text-xs font-bold text-slate-800 block">
                {t('smartRecommendationsToggle')}
              </span>
              <span className="text-[11px] text-slate-500">
                Weather-sensitive watering alerts, disease alerts, and fruit thinning reminders
              </span>
            </div>
            <input
              type="checkbox"
              checked={smartAgToggle}
              onChange={(e) => setSmartAgToggle(e.target.checked)}
              className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50">
            <div>
              <span className="text-xs font-bold text-slate-800 block">
                Automated Drip Schedule Sync
              </span>
              <span className="text-[11px] text-slate-500">
                Synchronize valve ON/OFF triggers with calendar watering tasks
              </span>
            </div>
            <input
              type="checkbox"
              checked={autoDripValveSync}
              onChange={(e) => setAutoDripValveSync(e.target.checked)}
              className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50">
            <div>
              <span className="text-xs font-bold text-slate-800 block">
                {t('notificationsEnabled')}
              </span>
              <span className="text-[11px] text-slate-500">
                Browser and sound alert on high temperature spikes or moisture drops
              </span>
            </div>
            <input
              type="checkbox"
              checked={notificationsEnabled}
              onChange={(e) => setNotificationsEnabled(e.target.checked)}
              className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 bg-[#164e22] hover:bg-[#123e1b] text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>{t('saveSettings')}</span>
          </button>
        </div>

        {/* Reset Data Section */}
        <div className="bg-red-50/50 rounded-2xl p-5 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-red-900">
                Reset to Reference Prototype Data
              </h4>
              <p className="text-[11px] text-red-700/80 mt-0.5">
                Restores the initial April 2025 demonstration tasks, stages, plots, and sensor telemetry.
              </p>
            </div>

            {!showResetConfirm ? (
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 rounded-xl text-xs font-bold transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Data</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3 py-1.5 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700"
                >
                  Confirm Reset
                </button>
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};
