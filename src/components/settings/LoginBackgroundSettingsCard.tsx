import React, { useState, useRef } from 'react';
import { 
  Image as ImageIcon, 
  UploadCloud, 
  Link as LinkIcon, 
  Sparkles, 
  RotateCcw, 
  Check, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  Sliders, 
  Monitor, 
  Trash2,
  Lock,
  User as UserIcon,
  ShieldCheck,
  ArrowRight,
  Key
} from 'lucide-react';
import { useI18n } from '../../locales/i18nContext';
import { useMapSettings } from '../../context/MapSettingsContext';
import { 
  LOGIN_BG_PRESETS, 
  DEFAULT_LOGIN_BG_CONFIG, 
  LoginBackgroundConfig, 
  resolveLoginBackgroundUrl,
  getDarknessOverlayClasses,
  getBlurClass
} from '../../data/loginBackgroundPresets';
import { compressImageFile, validateImageUrl } from '../../utils/imageUtils';
import { api } from '../../services/apiService';
import { MelonLogo } from '../common/MelonIllustrations';

export const LoginBackgroundSettingsCard: React.FC = () => {
  const { t, language } = useI18n();
  const { 
    loginBgConfig, 
    setLoginBgConfig, 
    resetLoginBgToDefault,
    showDemoAccounts
  } = useMapSettings();

  // Local editing state
  const [activeTab, setActiveTab] = useState<'presets' | 'upload' | 'url'>('presets');
  const [selectedUrl, setSelectedUrl] = useState<string>(loginBgConfig.url);
  const [selectedBlur, setSelectedBlur] = useState<LoginBackgroundConfig['blur']>(loginBgConfig.blur || 'subtle');
  const [selectedDarkness, setSelectedDarkness] = useState<LoginBackgroundConfig['darkness']>(loginBgConfig.darkness || 'balanced');

  // URL input state
  const [urlInput, setUrlInput] = useState<string>(
    loginBgConfig.url.startsWith('http') ? loginBgConfig.url : ''
  );
  const [urlStatus, setUrlStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [validatingUrl, setValidatingUrl] = useState(false);

  // Upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(
    loginBgConfig.url.startsWith('data:image') || loginBgConfig.url.startsWith('/uploads') 
      ? loginBgConfig.url 
      : null
  );

  // Temporary feedback toast
  const [appliedNotice, setAppliedNotice] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setAppliedNotice(msg);
    setTimeout(() => setAppliedNotice(null), 3000);
  };

  // Synchronize when context updates externally
  React.useEffect(() => {
    setSelectedUrl(loginBgConfig.url);
    setSelectedBlur(loginBgConfig.blur);
    setSelectedDarkness(loginBgConfig.darkness);
  }, [loginBgConfig]);

  // Handle Preset Selection
  const handleSelectPreset = (presetId: string) => {
    setSelectedUrl(presetId);
    setLoginBgConfig({
      url: presetId,
      blur: selectedBlur,
      darkness: selectedDarkness,
    });
    showNotice(
      language === 'km' 
        ? 'បានផ្លាស់ប្តូររូបភាពផ្ទាំងខាងក្រោយរួចរាល់' 
        : 'Login wallpaper preset selected and applied'
    );
  };

  // Handle URL Validation & Application
  const handleApplyUrl = async () => {
    const cleanUrl = urlInput.trim();
    if (!cleanUrl) {
      setUrlStatus({
        ok: false,
        msg: language === 'km' ? 'សូមបញ្ចូលតំណភ្ជាប់រូបភាព' : 'Please enter an image URL'
      });
      return;
    }

    setValidatingUrl(true);
    setUrlStatus(null);
    try {
      const isValid = await validateImageUrl(cleanUrl);
      if (!isValid) {
        throw new Error(
          language === 'km' 
            ? 'មិនអាចទាញយករូបភាពពីតំណភ្ជាប់នេះបានទេ សូមពិនិត្យមើល URL ឡើងវិញ' 
            : 'Unable to load image from this URL. Please verify the link.'
        );
      }

      setSelectedUrl(cleanUrl);
      setLoginBgConfig({
        url: cleanUrl,
        blur: selectedBlur,
        darkness: selectedDarkness,
      });
      setUrlStatus({
        ok: true,
        msg: language === 'km' ? 'បានផ្ទៀងផ្ទាត់ និងដាក់ប្រើរូបភាពជោគជ័យ' : 'Valid image URL applied successfully'
      });
      showNotice(
        language === 'km' 
          ? 'បានដាក់ប្រើរូបភាពតាមរយៈ URL ជោគជ័យ' 
          : 'Custom image URL applied to login background'
      );
    } catch (err: any) {
      setUrlStatus({
        ok: false,
        msg: err.message || 'Image URL validation failed'
      });
    } finally {
      setValidatingUrl(false);
    }
  };

  // Handle File Upload & Client-Side Compression
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      if (!file.type.startsWith('image/')) {
        throw new Error(language === 'km' ? 'ឯកសារត្រូវតែជារូបភាព (PNG, JPG, WEBP)' : 'File must be an image');
      }

      // Max 10MB raw file limit before compression
      if (file.size > 10 * 1024 * 1024) {
        throw new Error(language === 'km' ? 'ទំហំរូបភាពមិនត្រូវលើសពី 10MB ទេ' : 'Image file size must be under 10MB');
      }

      // Compress client-side to max 1920x1080 JPEG (~150-300KB)
      const { dataUrl } = await compressImageFile(file, 1920, 1080, 0.85);
      setUploadedPreview(dataUrl);

      // Try uploading to server public/uploads endpoint if online
      let finalUrl = dataUrl;
      try {
        const uploadRes = await api.uploadLoginBackground(dataUrl, 'jpg');
        if (uploadRes?.success && uploadRes.url) {
          finalUrl = uploadRes.url;
        }
      } catch {
        // Fallback to storing lightweight dataUrl directly
        finalUrl = dataUrl;
      }

      setSelectedUrl(finalUrl);
      setLoginBgConfig({
        url: finalUrl,
        blur: selectedBlur,
        darkness: selectedDarkness,
      });

      showNotice(
        language === 'km' 
          ? 'បានបញ្ចូលរូបភាពពីកុំព្យូទ័រជោគជ័យ' 
          : 'Custom wallpaper uploaded and applied successfully'
      );
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle Overlay Darkness change
  const handleDarknessChange = (darkness: LoginBackgroundConfig['darkness']) => {
    setSelectedDarkness(darkness);
    setLoginBgConfig({
      url: selectedUrl,
      blur: selectedBlur,
      darkness,
    });
  };

  // Handle Blur change
  const handleBlurChange = (blur: LoginBackgroundConfig['blur']) => {
    setSelectedBlur(blur);
    setLoginBgConfig({
      url: selectedUrl,
      blur,
      darkness: selectedDarkness,
    });
  };

  // Reset to default
  const handleResetToDefault = () => {
    resetLoginBgToDefault();
    setSelectedUrl(DEFAULT_LOGIN_BG_CONFIG.url);
    setSelectedBlur(DEFAULT_LOGIN_BG_CONFIG.blur);
    setSelectedDarkness(DEFAULT_LOGIN_BG_CONFIG.darkness);
    setUrlInput('');
    setUrlStatus(null);
    setUploadedPreview(null);
    showNotice(
      language === 'km' 
        ? 'បានកំណត់មកផ្ទាំងរូបភាពដើម (Greenhouse Classic)' 
        : 'Reset to default greenhouse wallpaper'
    );
  };

  // Active resolved background URL for preview
  const resolvedPreviewUrl = resolveLoginBackgroundUrl(selectedUrl);
  const darknessOverlayClass = getDarknessOverlayClasses(selectedDarkness);
  const blurOverlayClass = getBlurClass(selectedBlur);

  // Determine current active badge label
  const isDefault = !selectedUrl || selectedUrl === 'preset:default';
  const activePreset = LOGIN_BG_PRESETS.find((p) => p.id === selectedUrl);
  const isCustomUrl = selectedUrl.startsWith('http://') || selectedUrl.startsWith('https://');
  const isCustomUpload = selectedUrl.startsWith('data:image') || selectedUrl.startsWith('/uploads');

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200/80 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-xs">
              <ImageIcon className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>{t('loginBgTitle')}</span>
                <span className="font-khmer text-emerald-700 text-xs">/ ផ្ទៃខាងក្រោយទំព័រចូលប្រើ</span>
              </h3>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {t('loginBgSubtitle')}
          </p>
        </div>

        {/* Status Pill & Reset Button */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              {isDefault 
                ? (language === 'km' ? 'ទម្រង់ដើម (Default)' : 'Classic Default') 
                : activePreset 
                  ? (language === 'km' ? activePreset.nameKm : activePreset.name)
                  : isCustomUpload 
                    ? t('customUploadBadge') 
                    : t('customUrlBadge')}
            </span>
          </span>

          {!isDefault && (
            <button
              type="button"
              onClick={handleResetToDefault}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 border border-slate-200 hover:border-red-200 transition-colors flex items-center gap-1 cursor-pointer"
              title={t('resetToDefaultBg')}
            >
              <RotateCcw className="w-3 h-3" />
              <span className="text-[11px]">{t('resetToDefaultBg')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Toast Notice */}
      {appliedNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in-50">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{appliedNotice}</span>
        </div>
      )}

      {/* Mode Navigation Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl max-w-md text-xs font-bold text-slate-600">
        <button
          type="button"
          onClick={() => setActiveTab('presets')}
          className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'presets'
              ? 'bg-white text-emerald-900 shadow-2xs font-extrabold'
              : 'hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>{t('presetWallpapers')}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'upload'
              ? 'bg-white text-emerald-900 shadow-2xs font-extrabold'
              : 'hover:text-slate-900'
          }`}
        >
          <UploadCloud className="w-3.5 h-3.5 text-emerald-600" />
          <span>{t('uploadCustomImage')}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('url')}
          className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'url'
              ? 'bg-white text-emerald-900 shadow-2xs font-extrabold'
              : 'hover:text-slate-900'
          }`}
        >
          <LinkIcon className="w-3.5 h-3.5 text-emerald-600" />
          <span>{t('customImageUrl')}</span>
        </button>
      </div>

      {/* TAB 1: CURATED PRESETS GALLERY */}
      {activeTab === 'presets' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              {language === 'km' 
                ? 'ជ្រើសរើសរូបភាពគំរូគុណភាពខ្ពស់ដែលបានរៀបចំទុកជាស្រេច:' 
                : 'Select from high-definition curated agricultural and greenhouse themes:'}
            </span>
            <span className="font-mono text-[11px] font-bold text-emerald-700">
              {LOGIN_BG_PRESETS.length} Options
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {LOGIN_BG_PRESETS.map((preset) => {
              const isSelected = selectedUrl === preset.id || (isDefault && preset.id === 'preset:default');
              return (
                <div
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset.id)}
                  className={`group relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-emerald-600 ring-2 ring-emerald-500/20 shadow-md'
                      : 'border-slate-200 hover:border-emerald-400/70 hover:shadow-sm'
                  }`}
                >
                  {/* Thumbnail Container */}
                  <div className="relative aspect-video w-full bg-slate-900 overflow-hidden">
                    <img
                      src={preset.url}
                      alt={preset.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />

                    {/* Tag badge */}
                    <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-black/60 text-white backdrop-blur-xs border border-white/20">
                      {preset.tag}
                    </span>

                    {/* Selection Indicator */}
                    {isSelected ? (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/40 border border-white/40 group-hover:border-white transition-colors" />
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="p-2.5 bg-white flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-1 group-hover:text-emerald-700 transition-colors">
                        {language === 'km' ? preset.nameKm : preset.name}
                      </h4>
                      <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5 leading-tight">
                        {language === 'km' ? preset.descriptionKm : preset.description}
                      </p>
                    </div>

                    <div className="mt-2 pt-1 border-t border-slate-100 flex items-center justify-between text-[10px]">
                      <span className="font-semibold text-slate-400 capitalize">
                        {preset.category}
                      </span>
                      {isSelected ? (
                        <span className="font-bold text-emerald-700 flex items-center gap-0.5">
                          <Check className="w-2.5 h-2.5" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 group-hover:text-emerald-600 font-semibold transition-colors">
                          Select
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: UPLOAD CUSTOM PHOTO */}
      {activeTab === 'upload' && (
        <div className="p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <UploadCloud className="w-4 h-4 text-emerald-600" />
              <span>{t('uploadCustomImage')}</span>
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              Auto Resized & Compressed (Web Ready)
            </span>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            onChange={handleFileUpload}
            className="hidden"
            id="login-bg-file-input"
          />

          {/* Drag & Drop Upload Zone */}
          <label
            htmlFor="login-bg-file-input"
            className="flex flex-col items-center justify-center p-6 sm:p-8 border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl bg-white hover:bg-emerald-50/20 transition-all cursor-pointer text-center group"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-2xs">
              {isUploading ? (
                <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <UploadCloud className="w-6 h-6" />
              )}
            </div>
            <p className="text-xs font-bold text-slate-800 group-hover:text-emerald-800">
              {isUploading ? 'Processing & Optimizing Image...' : t('dragOrClickUpload')}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {t('uploadHint')}
            </p>
          </label>

          {/* Upload Error Banner */}
          {uploadError && (
            <div className="p-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 bg-red-100 text-red-800">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Active Upload Preview Card */}
          {uploadedPreview && isCustomUpload && (
            <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={uploadedPreview}
                  alt="Uploaded background preview"
                  className="w-14 h-10 object-cover rounded-lg border border-slate-200 shadow-2xs"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-800">
                      {language === 'km' ? 'រូបភាពផ្ទាល់ខ្លួនត្រូវបានដាក់ប្រើ' : 'Custom Upload Applied & Active'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {language === 'km' ? 'ផ្ទុកក្នុងប្រព័ន្ធ និងបង្ហាញលើផ្ទាំងចូលប្រើ' : 'Loaded in local storage & synced to farm profile'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleResetToDefault}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                title="Remove Custom Image"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CUSTOM IMAGE URL */}
      {activeTab === 'url' && (
        <div className="p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-slate-600" />
              <span>{t('customImageUrl')}</span>
            </label>
            <span className="text-[11px] text-slate-500 font-mono">
              HTTPS Direct Image Link
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                setUrlStatus(null);
              }}
              placeholder={t('enterImageUrlPlaceholder')}
              className="flex-1 px-3.5 py-2.5 text-xs font-mono rounded-xl border border-slate-300 bg-white outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 shadow-2xs"
            />
            <button
              type="button"
              onClick={handleApplyUrl}
              disabled={validatingUrl || !urlInput.trim()}
              className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
            >
              {validatingUrl ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              )}
              <span>{t('applyImageUrl')}</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-500">
            {language === 'km' 
              ? 'បញ្ចូលតំណភ្ជាប់រូបភាពផ្ទាល់ពី Unsplash, CDN ឬគេហទំព័រក្រុមហ៊ុនរបស់អ្នក' 
              : 'Paste direct link from Unsplash, high-res farm photos, or your enterprise CDN'}
          </p>

          {urlStatus && (
            <div className={`p-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 ${
              urlStatus.ok ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
            }`}>
              {urlStatus.ok ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
              <span>{urlStatus.msg}</span>
            </div>
          )}
        </div>
      )}

      {/* VISUAL ATMOSPHERE CONTROLS (Darkness & Blur) */}
      <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-3.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
          <Sliders className="w-3.5 h-3.5 text-emerald-700" />
          <span>{language === 'km' ? 'ពន្លឺ និងកម្រិតព្រិលនៃផ្ទាំងខាងក្រោយ' : 'Atmosphere Lighting & Blur Tuning'}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Overlay Darkness Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
              {t('overlayDarkness')}
            </label>
            <div className="grid grid-cols-3 gap-1.5 bg-slate-200/60 p-1 rounded-xl">
              {(['light', 'balanced', 'deep'] as const).map((darkness) => (
                <button
                  key={darkness}
                  type="button"
                  onClick={() => handleDarknessChange(darkness)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedDarkness === darkness
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {darkness === 'light' ? t('lightContrast') : darkness === 'balanced' ? t('balancedContrast') : t('deepContrast')}
                </button>
              ))}
            </div>
          </div>

          {/* Blur Intensity Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
              {t('blurIntensity')}
            </label>
            <div className="grid grid-cols-4 gap-1.5 bg-slate-200/60 p-1 rounded-xl">
              {(['none', 'subtle', 'medium', 'deep'] as const).map((blur) => (
                <button
                  key={blur}
                  type="button"
                  onClick={() => handleBlurChange(blur)}
                  className={`py-1.5 px-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedBlur === blur
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {blur === 'none' ? t('blurNone') : blur === 'subtle' ? t('blurSubtle') : blur === 'medium' ? t('blurMedium') : t('blurDeep')}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* LIVE INTERACTIVE LOGIN PREVIEW MOCKUP */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Monitor className="w-3.5 h-3.5 text-emerald-700" />
            <span>{t('previewLoginScreen')}</span>
          </span>
          <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-semibold">
            Live Scaled Preview (100% WYSIWYG)
          </span>
        </div>

        {/* Scaled Preview Box */}
        <div className="relative w-full h-[280px] sm:h-[320px] rounded-2xl overflow-hidden border border-slate-300 shadow-inner flex items-center justify-center select-none">
          {/* Background Image Layer */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-all duration-700 transform scale-102"
            style={{ backgroundImage: `url(${resolvedPreviewUrl})` }}
          />

          {/* Blur & Darkness Overlays */}
          <div className={`absolute inset-0 ${darknessOverlayClass} ${blurOverlayClass} transition-all duration-500`} />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-black/40 to-black/80 pointer-events-none" />

          {/* Mini Login Card Mockup */}
          <div className="relative z-10 w-full max-w-[280px] sm:max-w-[320px] bg-slate-900/85 backdrop-blur-xl rounded-xl border border-white/20 p-3 sm:p-4 text-white shadow-2xl space-y-2 pointer-events-none transform scale-95 sm:scale-100">
            {/* Header */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-xs mb-1">
                <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
              </div>
              <h5 className="text-xs sm:text-sm font-black text-white tracking-tight">
                {language === 'km' ? 'ចូលប្រើប្រព័ន្ធ MelonPro' : 'Sign In to MelonPro'}
              </h5>
              <p className="text-[9px] text-slate-300">
                {language === 'km' ? 'ប្រព័ន្ធគ្រប់គ្រងចំការឆ្លាតវៃ' : 'Smart Melon Farm ERP & Crop OS'}
              </p>
            </div>

            {/* Inputs Mockup */}
            <div className="space-y-1.5 pt-1">
              <div className="px-2.5 py-1.5 bg-slate-800/80 border border-slate-700 rounded-lg text-[10px] text-slate-400 flex items-center gap-1.5">
                <UserIcon className="w-3 h-3 text-slate-500" />
                <span>username / email</span>
              </div>
              <div className="px-2.5 py-1.5 bg-slate-800/80 border border-slate-700 rounded-lg text-[10px] text-slate-400 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-slate-500" />
                  <span>••••••••</span>
                </div>
                {showDemoAccounts && (
                  <span className="text-[9px] text-emerald-400 font-mono">Demo: 123</span>
                )}
              </div>
            </div>

            {/* Button Mockup */}
            <div className="pt-1">
              <div className="w-full py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg text-[10px] font-bold text-center flex items-center justify-center gap-1 shadow-md shadow-emerald-950/40">
                <span>{language === 'km' ? 'ចូលប្រើប្រព័ន្ធ' : 'Sign In to Workspace'}</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>

            {/* Mini Demo Accounts Directory Mockup below form */}
            {showDemoAccounts && (
              <div className="mt-1.5 pt-1.5 border-t border-white/10 flex items-center justify-between text-[8px] text-slate-300">
                <div className="flex items-center gap-1 text-emerald-400 font-bold">
                  <Key className="w-2.5 h-2.5" />
                  <span>Demo Accounts</span>
                </div>
                <span className="text-[8px] text-indigo-300 font-mono">Dev • Admin • Farmer • Team</span>
              </div>
            )}
          </div>

          {/* Watermark badge */}
          <div className="absolute top-2.5 left-2.5 z-20 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-mono text-white font-bold flex items-center gap-1.5 border border-white/20 shadow-md pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>MelonPro Login Portal Wallpaper</span>
          </div>

          {/* Active Preset Watermark */}
          <div className="absolute bottom-2.5 right-2.5 z-20 bg-black/75 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-medium text-slate-300 border border-white/10 pointer-events-none">
            {activePreset ? (language === 'km' ? activePreset.nameKm : activePreset.name) : isCustomUpload ? 'Custom Upload' : 'Custom Web Image'}
          </div>
        </div>
      </div>
    </div>
  );
};
