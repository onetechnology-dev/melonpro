import React, { useState } from 'react';
import { 
  Users2, 
  Key, 
  Check, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  Code2, 
  UserCog, 
  Sprout, 
  Eye, 
  EyeOff,
  Lock,
  ArrowRight
} from 'lucide-react';
import { useI18n } from '../../locales/i18nContext';
import { useMapSettings } from '../../context/MapSettingsContext';

export const DemoAccountsSettingsCard: React.FC = () => {
  const { t, language } = useI18n();
  const { showDemoAccounts, setShowDemoAccounts, saveSettings } = useMapSettings();

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggle = async (newValue: boolean) => {
    setIsUpdating(true);
    setShowDemoAccounts(newValue);
    await saveSettings({ showDemoAccounts: newValue });
    setIsUpdating(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200/80 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shadow-2xs border border-indigo-200/60">
              <Users2 className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              {t('demoAccountsTitle')} / <span className="font-khmer text-indigo-700">{language === 'km' ? 'គណនីសាកល្បង & សិទ្ធិតួនាទី' : 'Demo Accounts & Role Directory'}</span>
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            {t('demoAccountsSubtitle')}
          </p>
        </div>

        {/* Dynamic Status Badge */}
        <div className="flex items-center gap-2 shrink-0">
          <span 
            className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-all flex items-center gap-1.5 shadow-2xs ${
              showDemoAccounts 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                : 'bg-slate-100 text-slate-600 border-slate-300'
            }`}
          >
            <span 
              className={`w-2 h-2 rounded-full ${
                showDemoAccounts ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`} 
            />
            <span>
              {showDemoAccounts 
                ? (language === 'km' ? 'កំពុងបង្ហាញលើ LOGIN' : 'VISIBLE ON LOGIN FORM') 
                : (language === 'km' ? 'បានលាក់ពី LOGIN' : 'HIDDEN FROM LOGIN FORM')}
            </span>
          </span>
        </div>
      </div>

      {/* Success Notification */}
      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in-50">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{t('demoAccountsSaveSuccess')}</span>
        </div>
      )}

      {/* Main Interactive Toggle Switch */}
      <div 
        onClick={() => !isUpdating && handleToggle(!showDemoAccounts)}
        className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer select-none flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          showDemoAccounts 
            ? 'border-indigo-300 bg-indigo-50/40 hover:bg-indigo-50/60 shadow-xs' 
            : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/60'
        }`}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-bold text-slate-900">
              {t('showDemoAccountsToggle')}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-white border border-slate-200 text-slate-600 shadow-2xs">
              {language === 'km' ? 'ប៊ូតុង 1-Click Login' : '1-Click Quick Login'}
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
            {t('showDemoAccountsDesc')}
          </p>
        </div>

        {/* Tactile Switch Button */}
        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
          <span className="text-xs font-bold text-slate-700">
            {showDemoAccounts 
              ? (language === 'km' ? 'បើក (On)' : 'Enabled') 
              : (language === 'km' ? 'បិទ (Off)' : 'Disabled')}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={showDemoAccounts}
            disabled={isUpdating}
            className={`w-12 h-6.5 flex items-center rounded-full p-1 transition-colors duration-300 cursor-pointer shadow-inner focus:outline-hidden ${
              showDemoAccounts ? 'bg-indigo-600' : 'bg-slate-300'
            }`}
          >
            <div
              className={`bg-white w-4.5 h-4.5 rounded-full shadow-md transform transition-transform duration-300 ${
                showDemoAccounts ? 'translate-x-5.5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Live Preview of Demo Accounts Cards State */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            {showDemoAccounts ? (
              <Eye className="w-3.5 h-3.5 text-indigo-600" />
            ) : (
              <EyeOff className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>{t('demoAccountsLivePreview')}</span>
          </span>
          <span className="text-[10px] font-mono text-slate-500">
            {showDemoAccounts ? t('demoAccountsEnabledNotice') : t('demoAccountsDisabledNotice')}
          </span>
        </div>

        {/* Visual Mockup Box */}
        <div className="relative rounded-2xl border border-slate-200 bg-slate-900 p-3 sm:p-4 text-white overflow-hidden shadow-inner">
          {/* Subtle Ambient Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-950/60 via-slate-900 to-emerald-950/40 pointer-events-none" />

          {/* Directory Header Bar Mockup */}
          <div className={`relative z-10 flex items-center justify-between gap-2 pb-2.5 border-b border-white/10 transition-opacity duration-300 ${
            showDemoAccounts ? 'opacity-100' : 'opacity-30'
          }`}>
            <div className="flex items-center gap-2">
              <Key className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-bold text-white">
                {language === 'km' ? 'បញ្ជីគណនីសាកល្បង (Demo Accounts)' : 'Demo Accounts & Role Permissions'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-mono text-[10px] font-bold">
              <Sparkles className="w-2.5 h-2.5" />
              <span>Password: 123</span>
            </div>
          </div>

          {/* 4 Cards Grid Preview */}
          <div className={`relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2.5 transition-all duration-300 ${
            showDemoAccounts ? 'opacity-100 filter-none' : 'opacity-25 grayscale'
          }`}>
            {/* Developer */}
            <div className="p-2 rounded-xl bg-slate-800/90 border border-indigo-500/40 shadow-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="px-1 py-0.2 rounded text-[8px] font-black uppercase bg-indigo-500/30 text-indigo-300 flex items-center gap-0.5">
                  <Code2 className="w-2 h-2" /> Dev
                </span>
                <span className="text-[9px] font-mono text-emerald-400">PW: 123</span>
              </div>
              <p className="text-xs font-bold text-white truncate">Meng Luk</p>
              <p className="text-[10px] text-slate-400 font-mono truncate">@developer</p>
              <div className="mt-2 pt-1 border-t border-slate-700/60">
                <div className="w-full py-0.5 bg-indigo-600/80 rounded text-[9px] font-bold text-center text-white flex items-center justify-center gap-1">
                  <span>1-Click Login</span>
                  <ArrowRight className="w-2 h-2" />
                </div>
              </div>
            </div>

            {/* Admin */}
            <div className="p-2 rounded-xl bg-slate-800/90 border border-blue-500/40 shadow-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="px-1 py-0.2 rounded text-[8px] font-black uppercase bg-blue-500/30 text-blue-300 flex items-center gap-0.5">
                  <UserCog className="w-2 h-2" /> Admin
                </span>
                <span className="text-[9px] font-mono text-emerald-400">PW: 123</span>
              </div>
              <p className="text-xs font-bold text-white truncate">Sokha Chea</p>
              <p className="text-[10px] text-slate-400 font-mono truncate">@admin</p>
              <div className="mt-2 pt-1 border-t border-slate-700/60">
                <div className="w-full py-0.5 bg-blue-600/80 rounded text-[9px] font-bold text-center text-white flex items-center justify-center gap-1">
                  <span>1-Click Login</span>
                  <ArrowRight className="w-2 h-2" />
                </div>
              </div>
            </div>

            {/* Farmer */}
            <div className="p-2 rounded-xl bg-slate-800/90 border border-emerald-500/40 shadow-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="px-1 py-0.2 rounded text-[8px] font-black uppercase bg-emerald-500/30 text-emerald-300 flex items-center gap-0.5">
                  <Sprout className="w-2 h-2" /> Farmer
                </span>
                <span className="text-[9px] font-mono text-emerald-400">PW: 123</span>
              </div>
              <p className="text-xs font-bold text-white truncate">Bunthoeun Mean</p>
              <p className="text-[10px] text-slate-400 font-mono truncate">@farmer</p>
              <div className="mt-2 pt-1 border-t border-slate-700/60">
                <div className="w-full py-0.5 bg-emerald-600/80 rounded text-[9px] font-bold text-center text-white flex items-center justify-center gap-1">
                  <span>1-Click Login</span>
                  <ArrowRight className="w-2 h-2" />
                </div>
              </div>
            </div>

            {/* Team */}
            <div className="p-2 rounded-xl bg-slate-800/90 border border-amber-500/40 shadow-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="px-1 py-0.2 rounded text-[8px] font-black uppercase bg-amber-500/30 text-amber-300 flex items-center gap-0.5">
                  <Users2 className="w-2 h-2" /> Team
                </span>
                <span className="text-[9px] font-mono text-emerald-400">PW: 123</span>
              </div>
              <p className="text-xs font-bold text-white truncate">Sreymom Pich</p>
              <p className="text-[10px] text-slate-400 font-mono truncate">@team</p>
              <div className="mt-2 pt-1 border-t border-slate-700/60">
                <div className="w-full py-0.5 bg-amber-600/80 rounded text-[9px] font-bold text-center text-white flex items-center justify-center gap-1">
                  <span>1-Click Login</span>
                  <ArrowRight className="w-2 h-2" />
                </div>
              </div>
            </div>
          </div>

          {/* Disabled Overlay Banner */}
          {!showDemoAccounts && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 text-center animate-in fade-in-50">
              <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 mb-2 shadow-lg">
                <Lock className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-xs font-bold text-white">
                {language === 'km' ? 'បញ្ជីគណនីសាកល្បងត្រូវបានលាក់ពីទម្រង់ Login' : 'Demo Accounts Directory Hidden'}
              </p>
              <p className="text-[11px] text-slate-300 mt-0.5 max-w-sm">
                {language === 'km' 
                  ? 'អ្នកប្រើប្រាស់នឹងឃើញតែទម្រង់ Sign In ស្អាតបរិសុទ្ធ គ្មានប៊ូតុងចុចចូលស្វ័យប្រវត្តិឡើយ។' 
                  : 'Visitors will see only the clean sign-in form without demo credentials or 1-click buttons.'}
              </p>
              <button
                type="button"
                onClick={() => handleToggle(true)}
                className="mt-2.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{language === 'km' ? 'បើកបង្ហាញឡើងវិញ' : 'Enable & Show on Login'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
