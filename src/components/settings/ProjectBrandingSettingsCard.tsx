import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  RotateCcw, 
  Check, 
  CheckCircle2, 
  Tag, 
  Type, 
  Eye, 
  Compass, 
  Layers, 
  Globe2,
  ExternalLink,
  Laptop
} from 'lucide-react';
import { useI18n } from '../../locales/i18nContext';
import { useMapSettings, DEFAULT_PROJECT_NAME, DEFAULT_FOOT_TAG } from '../../context/MapSettingsContext';
import { MelonLogo, SidebarGreenhouseBanner } from '../common/MelonIllustrations';

export const PROJECT_NAME_PRESETS = [
  'MelonPro',
  'Greenhouse OS',
  'Smart Farm Pro',
  'Khmer Melon Tech',
  'AgriPulse ERP',
  'Battambang Melon Farm'
];

export const FOOT_TAG_PRESETS = [
  'MelonPro ERP & Farm Operations — Smart Farming Together',
  'Healthy Melons, Happier Farmers, A Greener Tomorrow',
  'ដំណោះស្រាយគ្រប់គ្រងកសិដ្ឋានត្រសក់ផ្អែមពេញលេញ • MelonPro Smart Farming',
  'Enterprise Greenhouse & Precision Crop Lifecycle Platform',
  'GAP Certified Sustainable Agriculture & Traceability OS',
  'Smart Greenhouse Automation & Sensor Telemetry System'
];

export const ProjectBrandingSettingsCard: React.FC = () => {
  const { t, language } = useI18n();
  const { 
    projectName, 
    footTag, 
    setProjectName, 
    setFootTag, 
    saveSettings 
  } = useMapSettings();

  // Local state for editing before save or live preview
  const [localProjectName, setLocalProjectName] = useState(projectName || DEFAULT_PROJECT_NAME);
  const [localFootTag, setLocalFootTag] = useState(footTag || DEFAULT_FOOT_TAG);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activePreviewMode, setActivePreviewMode] = useState<'sidebar' | 'footer' | 'tab'>('sidebar');

  // Keep local fields in sync if external settings change
  useEffect(() => {
    setLocalProjectName(projectName || DEFAULT_PROJECT_NAME);
  }, [projectName]);

  useEffect(() => {
    setLocalFootTag(footTag ?? DEFAULT_FOOT_TAG);
  }, [footTag]);

  const handleApply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    const trimmedName = localProjectName.trim() || DEFAULT_PROJECT_NAME;
    const trimmedFootTag = localFootTag.trim() || DEFAULT_FOOT_TAG;

    setProjectName(trimmedName);
    setFootTag(trimmedFootTag);

    await saveSettings({
      projectName: trimmedName,
      footTag: trimmedFootTag,
    });

    setIsSaving(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetDefaults = async () => {
    setLocalProjectName(DEFAULT_PROJECT_NAME);
    setLocalFootTag(DEFAULT_FOOT_TAG);
    setProjectName(DEFAULT_PROJECT_NAME);
    setFootTag(DEFAULT_FOOT_TAG);

    await saveSettings({
      projectName: DEFAULT_PROJECT_NAME,
      footTag: DEFAULT_FOOT_TAG,
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200/80 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shadow-2xs border border-emerald-200/60">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              {t('brandingTitle')} / <span className="font-khmer text-emerald-700">ឈ្មោះគម្រោង & ស្លាកខាងក្រោម</span>
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            {t('brandingSubtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-wide">
            {projectName || DEFAULT_PROJECT_NAME}
          </span>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in-50">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{t('brandingSaved')}</span>
        </div>
      )}

      {/* Editing Form */}
      <div className="space-y-5">
        {/* 1. Project Name Field */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t('projectNameLabel')}</span>
              <span className="text-[10px] text-slate-400 font-normal">({language === 'km' ? 'ឈ្មោះម៉ាកសញ្ញា' : 'Brand Name'})</span>
            </label>
            <span className="text-[10px] font-mono text-slate-400">
              {localProjectName.length} / 50
            </span>
          </div>
          
          <div className="relative">
            <input
              type="text"
              maxLength={50}
              value={localProjectName}
              onChange={(e) => setLocalProjectName(e.target.value)}
              placeholder={t('projectNamePlaceholder')}
              className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-2xs"
            />
            {localProjectName && (
              <button
                type="button"
                onClick={() => setLocalProjectName('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 p-1"
                title="Clear"
              >
                ✕
              </button>
            )}
          </div>
          <p className="text-[11px] text-slate-500">
            {t('projectNameHelp')}
          </p>

          {/* Project Name Presets */}
          <div className="pt-1">
            <span className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wider">
              {t('presetProjectNames')}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PROJECT_NAME_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setLocalProjectName(preset)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
                    localProjectName === preset
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-400/20'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 2. Foot Tag Field */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t('footTagLabel')}</span>
              <span className="text-[10px] text-slate-400 font-normal">({language === 'km' ? 'ពាក្យស្លោកខាងក្រោម' : 'Footer Tagline'})</span>
            </label>
            <span className="text-[10px] font-mono text-slate-400">
              {localFootTag.length} / 120
            </span>
          </div>

          <div className="relative">
            <input
              type="text"
              maxLength={120}
              value={localFootTag}
              onChange={(e) => setLocalFootTag(e.target.value)}
              placeholder={t('footTagPlaceholder')}
              className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-2xs font-khmer"
            />
            {localFootTag && (
              <button
                type="button"
                onClick={() => setLocalFootTag('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 p-1"
                title="Clear"
              >
                ✕
              </button>
            )}
          </div>
          <p className="text-[11px] text-slate-500">
            {t('footTagHelp')}
          </p>

          {/* Foot Tag Presets */}
          <div className="pt-1">
            <span className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wider">
              {t('presetFootTags')}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {FOOT_TAG_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setLocalFootTag(preset)}
                  className={`p-2 rounded-xl text-left text-xs transition-all border ${
                    localFootTag === preset
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold ring-1 ring-emerald-400/20'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50 font-normal'
                  }`}
                >
                  <p className="truncate font-khmer leading-snug">{preset}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ---------------------------------------------------- */}
        {/* 3. Interactive Live Preview Box                      */}
        {/* ---------------------------------------------------- */}
        <div className="pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-xs font-bold text-slate-800">
                {t('previewBranding')}
              </span>
            </div>
            
            {/* Preview Viewport Switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setActivePreviewMode('sidebar')}
                className={`px-2 py-0.5 rounded-md transition-colors ${
                  activePreviewMode === 'sidebar'
                    ? 'bg-white text-emerald-800 shadow-2xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Sidebar Preview
              </button>
              <button
                type="button"
                onClick={() => setActivePreviewMode('footer')}
                className={`px-2 py-0.5 rounded-md transition-colors ${
                  activePreviewMode === 'footer'
                    ? 'bg-white text-emerald-800 shadow-2xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Footer Tag
              </button>
              <button
                type="button"
                onClick={() => setActivePreviewMode('tab')}
                className={`px-2 py-0.5 rounded-md transition-colors ${
                  activePreviewMode === 'tab'
                    ? 'bg-white text-emerald-800 shadow-2xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Browser Tab
              </button>
            </div>
          </div>

          {/* Preview Container */}
          <div className="bg-slate-900/95 rounded-2xl p-4 sm:p-5 border border-slate-800 text-white shadow-inner relative overflow-hidden">
            {activePreviewMode === 'sidebar' && (
              <div className="space-y-4">
                {/* Brand Header Preview */}
                <div className="bg-white rounded-xl p-3 text-slate-900 border border-slate-200 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <MelonLogo className="w-8 h-8 shrink-0 drop-shadow-xs" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-lg font-black tracking-tight text-[#164e22] truncate">
                          {localProjectName || DEFAULT_PROJECT_NAME}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded font-bold uppercase">
                          Brand
                        </span>
                      </div>
                      <p className="text-[10px] font-semibold text-slate-500 tracking-wider uppercase truncate">
                        {language === 'km' ? 'កសិកម្មឆ្លាតវៃជាមួយគ្នា' : 'Smart Farming Together'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">Top Brand</span>
                </div>

                {/* Sidebar Bottom Banner Preview */}
                <div className="relative rounded-xl overflow-hidden shadow-xs border border-emerald-900/30">
                  <SidebarGreenhouseBanner className="w-full h-20 object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/95 via-emerald-900/50 to-transparent p-3 flex flex-col justify-end text-white">
                    <p className="text-xs font-extrabold leading-tight tracking-wide truncate">
                      {localProjectName || DEFAULT_PROJECT_NAME} ERP & Farm Operations
                    </p>
                    <p className="text-[10px] text-emerald-200/95 font-khmer mt-0.5 font-medium truncate">
                      {localFootTag || DEFAULT_FOOT_TAG}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activePreviewMode === 'footer' && (
              <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                  <span className="text-slate-400 font-medium">Page Content End</span>
                  <span className="text-emerald-400 font-mono text-[10px]">Viewport Bottom</span>
                </div>
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-emerald-400">
                      {localProjectName || DEFAULT_PROJECT_NAME}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-300 font-khmer text-[11px]">
                      {localFootTag || DEFAULT_FOOT_TAG}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    © 2026 Enterprise Farm OS
                  </span>
                </div>
              </div>
            )}

            {activePreviewMode === 'tab' && (
              <div className="space-y-2">
                <div className="bg-slate-800/80 rounded-t-xl px-3 py-2 flex items-center gap-2 max-w-sm border border-slate-700/60 shadow-xs">
                  <span className="text-xs">🍈</span>
                  <span className="text-xs font-medium text-slate-200 truncate flex-1">
                    {localProjectName || DEFAULT_PROJECT_NAME} — Smart Farm Management...
                  </span>
                  <span className="text-slate-500 text-xs">✕</span>
                </div>
                <div className="p-3 bg-slate-950/90 rounded-xl border border-slate-800 text-[11px] text-slate-400">
                  <p>
                    The browser document tab title dynamically changes to reflect <span className="text-emerald-400 font-semibold">{localProjectName || DEFAULT_PROJECT_NAME}</span> in real time.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3 pt-3">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t('resetBranding')}</span>
          </button>

          <button
            type="button"
            onClick={() => handleApply()}
            disabled={isSaving}
            className="px-5 py-2.5 bg-[#164e22] hover:bg-[#123e1b] text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : t('saveSettings')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
