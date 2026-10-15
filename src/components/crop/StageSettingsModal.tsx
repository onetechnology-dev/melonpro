import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Sliders, 
  Plus, 
  Edit3, 
  Trash2, 
  RotateCcw, 
  Check, 
  CheckCircle2, 
  Sparkles,
  Layers,
  Droplets,
  BookOpen,
  Search,
  Tag,
  Clock,
  Activity
} from 'lucide-react';
import { useI18n } from '../../locales/i18nContext';
import { useFarm } from '../../context/FarmContext';
import { 
  GrowthStagePreset, 
  STAGE_COLOR_THEMES, 
  getStageColorTheme 
} from '../../data/customStagePresets';

interface StageSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStageSelected?: (stage: GrowthStagePreset) => void;
  initialStageToEdit?: GrowthStagePreset | null;
  initialMode?: 'list' | 'add' | 'edit';
}

export const StageSettingsModal: React.FC<StageSettingsModalProps> = ({
  isOpen,
  onClose,
  onStageSelected,
  initialStageToEdit,
  initialMode,
}) => {
  const { language } = useI18n();
  const { 
    growthStages, 
    addGrowthStage, 
    updateGrowthStage, 
    deleteGrowthStage, 
    resetGrowthStages 
  } = useFarm();

  // Mode: 'list' | 'add' | 'edit'
  const [mode, setMode] = useState<'list' | 'add' | 'edit'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Search & Filter Category: 'all' | 'botanical' | 'custom'
  const [stageFilter, setStageFilter] = useState<'all' | 'botanical' | 'custom'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Form Fields
  const [nameEn, setNameEn] = useState('');
  const [nameKm, setNameKm] = useState('');
  const [key, setKey] = useState('');
  const [defaultDays, setDefaultDays] = useState(10);
  const [color, setColor] = useState('emerald');
  const [isCustom, setIsCustom] = useState(false);
  const [ecTarget, setEcTarget] = useState('2.0 - 2.4 mS/cm');
  const [phTarget, setPhTarget] = useState('6.0 - 6.5');
  const [irrigationEn, setIrrigationEn] = useState('');
  const [irrigationKm, setIrrigationKm] = useState('');
  const [notesEn, setNotesEn] = useState('');
  const [notesKm, setNotesKm] = useState('');

  // Confirm delete modal state
  const [deletingStage, setDeletingStage] = useState<GrowthStagePreset | null>(null);

  // Notification toast
  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const resetForm = () => {
    setNameEn('');
    setNameKm('');
    setKey('');
    setDefaultDays(10);
    setColor('emerald');
    setIsCustom(false);
    setEcTarget('2.0 - 2.4 mS/cm');
    setPhTarget('6.0 - 6.5');
    setIrrigationEn('');
    setIrrigationKm('');
    setNotesEn('');
    setNotesKm('');
    setEditingId(null);
    setMode('list');
  };

  const handleCancelForm = () => {
    resetForm();
    if (initialMode && initialMode !== 'list') {
      onClose();
    }
  };

  const handleStartAdd = () => {
    resetForm();
    setIsCustom(true);
    setColor('purple');
    setMode('add');
  };

  const handleStartEdit = (stage: GrowthStagePreset) => {
    setEditingId(stage.id);
    setNameEn(stage.nameEn);
    setNameKm(stage.nameKm);
    setKey(stage.key);
    setDefaultDays(stage.defaultDays);
    setColor(stage.color || 'emerald');
    setIsCustom(!!stage.isCustom);
    setEcTarget(stage.ecTarget || '2.0 - 2.4 mS/cm');
    setPhTarget(stage.phTarget || '6.0 - 6.5');
    setIrrigationEn(stage.irrigationGuidelineEn || '');
    setIrrigationKm(stage.irrigationGuidelineKm || '');
    setNotesEn(stage.notesEn || '');
    setNotesKm(stage.notesKm || '');
    setMode('edit');
  };

  useEffect(() => {
    if (isOpen) {
      if (initialStageToEdit) {
        handleStartEdit(initialStageToEdit);
      } else if (initialMode === 'add') {
        handleStartAdd();
      } else {
        setMode('list');
        setEditingId(null);
      }
    } else {
      resetForm();
    }
  }, [isOpen, initialStageToEdit, initialMode]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nameEn.trim()) {
      showToast(language === 'km' ? 'សូមបញ្ចូលឈ្មោះដំណាក់កាលជាភាសាអង់គ្លេស!' : 'Please enter stage name in English!');
      return;
    }

    const stageKey = key.trim() 
      ? key.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_')
      : nameEn.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');

    if (mode === 'add') {
      addGrowthStage({
        key: stageKey,
        nameEn: nameEn.trim(),
        nameKm: nameKm.trim() || nameEn.trim(),
        defaultDays: Number(defaultDays) || 7,
        color,
        ecTarget: ecTarget.trim() || undefined,
        phTarget: phTarget.trim() || undefined,
        irrigationGuidelineEn: irrigationEn.trim() || undefined,
        irrigationGuidelineKm: irrigationKm.trim() || undefined,
        notesEn: notesEn.trim() || undefined,
        notesKm: notesKm.trim() || undefined,
        isCustom
      });

      showToast(
        language === 'km'
          ? `បានបន្ថែមដំណាក់កាលថ្មី "${nameKm.trim() || nameEn.trim()}" ដោយជោគជ័យ!`
          : `Added new growth stage "${nameEn.trim()}" successfully!`
      );
      resetForm();
      if (initialMode && initialMode !== 'list') {
        setTimeout(() => {
          onClose();
        }, 300);
      }
    } else if (mode === 'edit' && editingId) {
      const existing = growthStages.find((s) => s.id === editingId);
      if (!existing) return;

      const updated: GrowthStagePreset = {
        ...existing,
        key: stageKey,
        nameEn: nameEn.trim(),
        nameKm: nameKm.trim() || nameEn.trim(),
        defaultDays: Number(defaultDays) || 7,
        color,
        ecTarget: ecTarget.trim() || undefined,
        phTarget: phTarget.trim() || undefined,
        irrigationGuidelineEn: irrigationEn.trim() || undefined,
        irrigationGuidelineKm: irrigationKm.trim() || undefined,
        notesEn: notesEn.trim() || undefined,
        notesKm: notesKm.trim() || undefined,
        isCustom
      };

      updateGrowthStage(updated);

      showToast(
        language === 'km'
          ? `បានកែប្រែដំណាក់កាល "${nameKm.trim() || nameEn.trim()}" រួចរាល់!`
          : `Updated growth stage "${nameEn.trim()}" successfully!`
      );
      resetForm();
      if (initialMode && initialMode !== 'list') {
        setTimeout(() => {
          onClose();
        }, 300);
      }
    }
  };

  const handleConfirmDelete = () => {
    if (!deletingStage) return;
    deleteGrowthStage(deletingStage.id);
    showToast(
      language === 'km'
        ? `បានលុបដំណាក់កាល "${deletingStage.nameKm || deletingStage.nameEn}"!`
        : `Deleted growth stage "${deletingStage.nameEn}"!`
    );
    setDeletingStage(null);
    if (editingId === deletingStage.id) {
      resetForm();
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm(
      language === 'km' 
        ? 'តើអ្នកប្រាកដជាចង់កំណត់ដំណាក់កាលលូតលាស់ទាំងអស់ទៅលំនាំដើមវិញទេ?' 
        : 'Are you sure you want to restore default growth stages presets?'
    )) {
      resetGrowthStages();
      showToast(
        language === 'km'
          ? 'បានកំណត់ដំណាក់កាលទៅលំនាំដើមវិញ!'
          : 'Restored default growth stages!'
      );
      resetForm();
    }
  };

  // Filtered Stages list
  const filteredStages = useMemo(() => {
    return growthStages.filter((s) => {
      // Category filter
      if (stageFilter === 'botanical' && s.isCustom) return false;
      if (stageFilter === 'custom' && !s.isCustom) return false;
      
      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        s.nameEn.toLowerCase().includes(q) ||
        s.nameKm.toLowerCase().includes(q) ||
        s.key.toLowerCase().includes(q)
      );
    });
  }, [growthStages, stageFilter, searchQuery]);

  const botanicalCount = growthStages.filter((s) => !s.isCustom).length;
  const customCount = growthStages.filter((s) => s.isCustom).length;
  const activeTheme = getStageColorTheme(color);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="relative bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-4xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toast Notification */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-4 right-4 z-60 bg-emerald-950 text-white px-4 py-2 rounded-xl shadow-xl border border-emerald-700 text-xs font-bold flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{notification}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div 
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs border transition-colors ${
                mode === 'edit'
                  ? 'text-white'
                  : mode === 'add'
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-200/60'
              }`}
              style={mode === 'edit' ? { backgroundColor: activeTheme.hex, borderColor: activeTheme.hex } : undefined}
            >
              {mode === 'edit' ? (
                <Edit3 className="w-5 h-5" />
              ) : mode === 'add' ? (
                <Plus className="w-5 h-5" />
              ) : (
                <Sliders className="w-5 h-5 text-emerald-700" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900 flex items-center gap-2 flex-wrap">
                  {mode === 'edit' ? (
                    language === 'km' ? (
                      <>
                        <span>កែប្រែដំណាក់កាលលូតលាស់:</span>
                        <span className="text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-xl border border-emerald-200 font-khmer font-bold">
                          {nameKm || nameEn || 'ដំណាក់កាល'}
                        </span>
                        {nameEn && nameKm && nameKm !== nameEn && (
                          <span className="text-xs font-mono text-slate-500 font-semibold">
                            ({nameEn})
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        <span>Edit Growth Stage:</span>
                        <span className="text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-xl border border-emerald-200 font-bold">
                          {nameEn || 'State Name'}
                        </span>
                        {nameKm && (
                          <span className="text-sm font-khmer text-emerald-700 font-semibold">
                            ({nameKm})
                          </span>
                        )}
                      </>
                    )
                  ) : mode === 'add' ? (
                    language === 'km' ? (
                      <>
                        <span>បន្ថែមដំណាក់កាលលូតលាស់:</span>
                        <span className="text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-xl border border-emerald-200 font-khmer font-bold">
                          {nameKm || nameEn || 'ដំណាក់កាលថ្មី'}
                        </span>
                      </>
                    ) : (
                      <>
                        <span>Add Growth Stage:</span>
                        <span className="text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-xl border border-emerald-200 font-bold">
                          {nameEn || 'New State'}
                        </span>
                      </>
                    )
                  ) : (
                    <span>{language === 'km' ? 'ការកំណត់ដំណាក់កាលលូតលាស់' : 'Growth Stages Settings'}</span>
                  )}
                </h3>

                {mode !== 'list' ? (
                  <>
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {defaultDays} {language === 'km' ? 'ថ្ងៃ' : 'Days'}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      {isCustom
                        ? (language === 'km' ? 'ដំណាក់កាលពិសេស' : 'Specialty Stage')
                        : (language === 'km' ? 'ដំណាក់កាលស្តង់ដារ' : 'Botanical Standard')}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {growthStages.length} {language === 'km' ? 'ដំណាក់កាលសរុប' : 'Total Stages'}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      {botanicalCount} Botanical · {customCount} Specialty
                    </span>
                  </>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {mode === 'edit'
                  ? (language === 'km'
                      ? `កែប្រែព័ត៌មានលម្អិត រយៈពេលគោលដៅ គោលដៅ EC/pH និងការណែនាំស្រោចស្រពសម្រាប់ "${nameKm || nameEn || 'ដំណាក់កាលនេះ'}"`
                      : `Configure stage duration, target EC/pH, irrigation schedule, and agronomic guidelines for ${nameEn || 'this growth stage'}`)
                  : mode === 'add'
                    ? (language === 'km'
                        ? 'កំណត់ដំណាក់កាលលូតលាស់ថ្មីសម្រាប់ដំណាំត្រសក់ផ្អែម និងបញ្ចូលរយៈពេលគោលដៅ'
                        : 'Define a new botanical or specialty growth stage for melon crop lifecycle')
                    : (language === 'km'
                        ? 'គ្រប់គ្រង បន្ថែម កែប្រែ និងលុបដំណាក់កាលលូតលាស់នៃដំណាំត្រសក់ផ្អែម (Stage Settings)'
                        : 'Add, edit, or delete existing botanical and specialty growth stages for melon crops')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-all flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Top Action Bar when in list mode */}
          {mode === 'list' && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-50/40 p-3 sm:p-3.5 rounded-2xl border border-emerald-100">
              {/* Category Filter Chips & Search */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="bg-white p-0.5 rounded-xl border border-slate-200 flex items-center shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setStageFilter('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      stageFilter === 'all'
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {language === 'km' ? 'ទាំងអស់' : 'All'} ({growthStages.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStageFilter('botanical')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      stageFilter === 'botanical'
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {language === 'km' ? 'ធម្មជាតិ (Botanical)' : 'Botanical'} ({botanicalCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStageFilter('custom')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      stageFilter === 'custom'
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {language === 'km' ? 'ពិសេស (Specialty)' : 'Specialty'} ({customCount})
                  </button>
                </div>

                <div className="relative min-w-[160px]">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={language === 'km' ? 'ស្វែងរកដំណាក់កាល...' : 'Search stages...'}
                    className="w-full pl-8 pr-3 py-1 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                  />
                </div>
              </div>

              {/* Action Buttons: Reset & Add */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-white border border-slate-200/80 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Restore default growth stages / កំណត់ឡើងវិញទៅលំនាំដើម"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>{language === 'km' ? 'លំនាំដើម' : 'Reset'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleStartAdd}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#164e22] hover:bg-[#123e1b] text-white shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>{language === 'km' ? '+ បន្ថែមដំណាក់កាល' : 'Add Growth State'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Form when mode is 'add' or 'edit' */}
          {mode !== 'list' && (
            <form id="stage-settings-form" onSubmit={handleSave} className="bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-4 text-left">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/70">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                    {mode === 'add' ? <Plus className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                  </div>
                  <h4 className="text-sm sm:text-base font-extrabold text-slate-900">
                    {mode === 'add'
                      ? (language === 'km' ? `បន្ថែមដំណាក់កាលលូតលាស់: ${nameKm || nameEn || 'ដំណាក់កាលថ្មី'}` : `Add Growth Stage: ${nameEn || 'New State'}`)
                      : (language === 'km' ? `កែប្រែដំណាក់កាលលូតលាស់: ${nameKm || nameEn}` : `Edit Growth Stage: ${nameEn}`)}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 px-2.5 py-1 rounded-lg hover:bg-slate-200/60 transition-all cursor-pointer"
                >
                  {language === 'km' ? 'បោះបង់' : 'Cancel'}
                </button>
              </div>

              {/* Stage Type Selector: Botanical Standard vs Specialty Custom */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  1. {language === 'km' ? 'ប្រភេទដំណាក់កាល (Stage Classification)' : 'Stage Classification'}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCustom(false)}
                    className={`p-3 rounded-xl border-2 transition-all flex items-center gap-2.5 text-left cursor-pointer ${
                      !isCustom
                        ? 'border-emerald-600 bg-emerald-50/80 shadow-xs ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      !isCustom ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-extrabold text-slate-900 block">
                        Botanical Standard
                      </span>
                      <span className="text-[11px] text-slate-500 font-khmer block">
                        {language === 'km' ? 'ដំណាក់កាលធម្មជាតិ ៧ ជំហាន' : 'Core Phenological Stage'}
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsCustom(true)}
                    className={`p-3 rounded-xl border-2 transition-all flex items-center gap-2.5 text-left cursor-pointer ${
                      isCustom
                        ? 'border-purple-600 bg-purple-50/80 shadow-xs ring-2 ring-purple-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isCustom ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-800'
                    }`}>
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-extrabold text-slate-900 block">
                        Specialty / Custom Stage
                      </span>
                      <span className="text-[11px] text-slate-500 font-khmer block">
                        {language === 'km' ? 'ដំណាក់កាលបច្ចេកទេសពិសេស' : 'Special Management Window'}
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Stage Names En & Km */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    2. Stage Name (English) / <span className="font-khmer">ឈ្មោះជាភាសាអង់គ្លេស</span> *
                  </label>
                  <input
                    type="text"
                    required
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    placeholder="e.g. Brix & Sweetening Boost"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Stage Name (Khmer) / <span className="font-khmer">ឈ្មោះជាភាសាខ្មែរ</span> *
                  </label>
                  <input
                    type="text"
                    required
                    value={nameKm}
                    onChange={(e) => setNameKm(e.target.value)}
                    placeholder="ឧ. ការបង្កើនជាតិស្ករផ្លែ"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white font-khmer font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Duration and Key */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    3. Target Duration (Days) / <span className="font-khmer">ចំនួនថ្ងៃ</span> *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="120"
                      required
                      value={defaultDays}
                      onChange={(e) => setDefaultDays(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      days
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Target EC / <span className="font-khmer">គោលដៅ EC</span>
                  </label>
                  <input
                    type="text"
                    value={ecTarget}
                    onChange={(e) => setEcTarget(e.target.value)}
                    placeholder="e.g. 2.0 - 2.4 mS/cm"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Target pH / <span className="font-khmer">គោលដៅ pH</span>
                  </label>
                  <input
                    type="text"
                    value={phTarget}
                    onChange={(e) => setPhTarget(e.target.value)}
                    placeholder="e.g. 6.0 - 6.5"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Color Swatch Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  4. Color Theme / <span className="font-khmer">ពណ៌សម្គាល់ដំណាក់កាល</span>
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
                  {Object.entries(STAGE_COLOR_THEMES).map(([colorKey, theme]) => {
                    const isSelected = color === colorKey;
                    return (
                      <button
                        key={colorKey}
                        type="button"
                        onClick={() => setColor(colorKey)}
                        className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                          isSelected 
                            ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20 shadow-2xs' 
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <span 
                          className="w-5 h-5 rounded-full shadow-xs border border-white"
                          style={{ backgroundColor: theme.hex }}
                        />
                        <span className="text-[10px] font-bold text-slate-700 truncate w-full text-center">
                          {theme.name.split(' ')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Irrigation Guidelines */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Droplets className="w-3.5 h-3.5 text-cyan-600" />
                    <span>Irrigation Guideline (English)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={irrigationEn}
                    onChange={(e) => setIrrigationEn(e.target.value)}
                    placeholder="e.g. Taper irrigation volume by 30% to concentrate sugars."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Droplets className="w-3.5 h-3.5 text-cyan-600" />
                    <span className="font-khmer">ការណែនាំស្រោចទឹក (ភាសាខ្មែរ)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={irrigationKm}
                    onChange={(e) => setIrrigationKm(e.target.value)}
                    placeholder="ឧ. បន្ថយការស្រោចទឹក ៣០% ដើម្បីប្រមូលផ្តុំជាតិស្ករ។"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-khmer text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Agronomic Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-purple-600" />
                    <span>Agronomic Notes & Practices (English)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={notesEn}
                    onChange={(e) => setNotesEn(e.target.value)}
                    placeholder="e.g. Inspect fruit netting, monitor Brix levels with refractometer."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-purple-600" />
                    <span className="font-khmer">ចំណាំបច្ចេកទេសកសិកម្ម (ភាសាខ្មែរ)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={notesKm}
                    onChange={(e) => setNotesKm(e.target.value)}
                    placeholder="ឧ. ពិនិត្យការចេញក្រឡា វាស់កម្រិត Brix ដោយឧបករណ៍ refractometer។"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-khmer text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

            </form>
          )}

          {/* List of Existing Growth Stages (ONLY visible in 'list' mode, hidden during Add/Edit form) */}
          {mode === 'list' && (
            <div className="space-y-3 text-left">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {language === 'km' 
                    ? `បញ្ជីដំណាក់កាលលូតលាស់ដែលមាន (${filteredStages.length})` 
                    : `Configured Growth Stages (${filteredStages.length})`}
                </span>
              </h4>
              <span className="text-[11px] text-slate-400 font-medium">
                {language === 'km' ? 'ចុចរូបខ្មៅដៃកែប្រែ ឬធុងសំរាមលុបដំណាក់កាល' : 'Edit or delete existing stages'}
              </span>
            </div>

            {filteredStages.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">
                  {language === 'km' ? 'រកមិនឃើញដំណាក់កាលណាទេ' : 'No growth stages found'}
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto font-khmer">
                  {language === 'km'
                    ? 'ចុចប៊ូតុង "បន្ថែមដំណាក់កាល" ឬ "លំនាំដើម" ដើម្បីបង្កើត ឬកំណត់ដំណាក់កាលឡើងវិញ'
                    : 'Click "+ Add Stage" or "Reset" to restore default growth stages.'}
                </p>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={handleStartAdd}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#164e22] text-white cursor-pointer"
                  >
                    + {language === 'km' ? 'បន្ថែមដំណាក់កាល' : 'Add Stage'}
                  </button>
                  <button
                    type="button"
                    onClick={handleResetDefaults}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 cursor-pointer"
                  >
                    {language === 'km' ? 'ស្តារលំនាំដើម' : 'Restore Presets'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredStages.map((stage, idx) => {
                  const theme = getStageColorTheme(stage.color);
                  const isCurrentlyEditing = editingId === stage.id;

                  return (
                    <div
                      key={stage.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                        isCurrentlyEditing 
                          ? 'border-emerald-500 bg-emerald-50/30 ring-2 ring-emerald-500/20 shadow-sm' 
                          : 'border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-xs'
                      }`}
                    >
                      <div>
                        {/* Stage Top Bar */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span 
                              className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs border border-white"
                              style={{ backgroundColor: theme.hex }}
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <h5 className="font-extrabold text-sm text-slate-900 leading-tight truncate">
                                  {stage.nameEn}
                                </h5>
                                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${
                                  stage.isCustom 
                                    ? 'bg-purple-100 text-purple-700 border-purple-200' 
                                    : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                }`}>
                                  {stage.isCustom ? 'Specialty' : 'Botanical'}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 font-khmer truncate mt-0.5">
                                {stage.nameKm}
                              </p>
                            </div>
                          </div>

                          <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full shrink-0 ${theme.badgeBg} ${theme.badgeText}`}>
                            {stage.defaultDays} {language === 'km' ? 'ថ្ងៃ' : 'days'}
                          </span>
                        </div>

                        {/* Agronomic Targets */}
                        <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-600 my-2 pt-2 border-t border-slate-100">
                          {stage.ecTarget && (
                            <span className="bg-slate-100 px-2 py-0.5 rounded-md font-mono font-medium">
                              EC: <strong className="text-slate-800">{stage.ecTarget}</strong>
                            </span>
                          )}
                          {stage.phTarget && (
                            <span className="bg-slate-100 px-2 py-0.5 rounded-md font-mono font-medium">
                              pH: <strong className="text-slate-800">{stage.phTarget}</strong>
                            </span>
                          )}
                        </div>

                        {/* Guideline / Notes Preview */}
                        {(stage.irrigationGuidelineEn || stage.irrigationGuidelineKm) && (
                          <p className="text-xs text-slate-500 line-clamp-2 mt-1 italic font-khmer">
                            💧 {language === 'km' && stage.irrigationGuidelineKm ? stage.irrigationGuidelineKm : stage.irrigationGuidelineEn}
                          </p>
                        )}
                        {(stage.notesEn || stage.notesKm) && (
                          <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 font-khmer">
                            🌱 {language === 'km' && stage.notesKm ? stage.notesKm : stage.notesEn}
                          </p>
                        )}
                      </div>

                      {/* Card Action Controls: Edit & Delete buttons */}
                      <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] font-mono text-slate-400">
                          #{idx + 1} · key: {stage.key}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {onStageSelected && (
                            <button
                              type="button"
                              onClick={() => {
                                onStageSelected(stage);
                                onClose();
                              }}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-all cursor-pointer"
                            >
                              {language === 'km' ? 'ជ្រើសរើស' : 'Select'}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleStartEdit(stage)}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-600 hover:text-emerald-800 bg-slate-100 hover:bg-emerald-100/70 border border-slate-200 hover:border-emerald-300 transition-all flex items-center gap-1 cursor-pointer"
                            title={language === 'km' ? 'កែប្រែដំណាក់កាលនេះ' : 'Edit this growth stage'}
                          >
                            <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                            <span>{language === 'km' ? 'កែប្រែ' : 'Edit'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletingStage(stage)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all cursor-pointer"
                            title={language === 'km' ? 'លុបដំណាក់កាលនេះ' : 'Delete this growth stage'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-slate-200/90 bg-slate-50/95 backdrop-blur-xs flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 font-khmer">
            {mode !== 'list'
              ? (language === 'km' 
                  ? (mode === 'add' ? 'បន្ថែមដំណាក់កាលលូតលាស់ថ្មី' : `កែប្រែដំណាក់កាល: ${nameKm || nameEn}`) 
                  : (mode === 'add' ? 'Add New Growth State' : `Editing Growth State: ${nameEn}`))
              : (language === 'km' ? 'MelonPro ការកំណត់ដំណាក់កាលលូតលាស់' : 'MelonPro Growth Stage Settings')}
          </div>

          <div className="flex items-center gap-2.5">
            {mode !== 'list' ? (
              <>
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 transition-all cursor-pointer shadow-2xs"
                >
                  {language === 'km' ? 'បោះបង់' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  form="stage-settings-form"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#164e22] hover:bg-[#123e1b] text-white shadow-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {mode === 'add'
                      ? (language === 'km' ? 'រក្សាទុកដំណាក់កាលថ្មី' : 'Save New State')
                      : (language === 'km' ? 'ធ្វើបច្ចុប្បន្នភាពដំណាក់កាល' : 'Update State')}
                  </span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200/80 hover:bg-slate-300/80 text-slate-800 transition-all cursor-pointer"
              >
                {language === 'km' ? 'បិទ' : 'Close'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deletingStage && (
        <div 
          className="fixed inset-0 z-70 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setDeletingStage(null)}
        >
          <div 
            className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl border border-slate-200 text-left space-y-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h4 className="font-extrabold text-base text-slate-900">
                  {language === 'km' ? 'តើអ្នកប្រាកដជាចង់លុបដំណាក់កាលនេះ?' : 'Delete Growth Stage?'}
                </h4>
                <p className="text-xs text-slate-500 font-khmer">
                  {deletingStage.nameKm} ({deletingStage.nameEn})
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 font-khmer">
              {language === 'km'
                ? `តើអ្នកប្រាកដជាចង់លុបដំណាក់កាល "${deletingStage.nameKm || deletingStage.nameEn}" ចេញពីប្រព័ន្ធ? ដំណាំដែលកំពុងដាំរួចហើយនឹងមិនរងផលប៉ះពាល់ទេ។`
                : `Are you sure you want to delete "${deletingStage.nameEn}"? Existing crop batches will preserve their configured schedules.`}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingStage(null)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer"
              >
                {language === 'km' ? 'បោះបង់' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-all cursor-pointer shadow-xs"
              >
                {language === 'km' ? 'យល់ព្រមលុប' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};
