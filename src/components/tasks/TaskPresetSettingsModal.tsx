import React, { useState, useMemo } from 'react';
import { 
  X, 
  Plus, 
  Sliders, 
  LayoutGrid, 
  List, 
  Search, 
  RotateCcw, 
  CalendarPlus, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Edit3, 
  Trash2, 
  Copy, 
  Eye, 
  Sparkles, 
  Droplets, 
  Scissors, 
  Flower2, 
  Bug, 
  Scale, 
  ClipboardCheck, 
  Check, 
  ChevronRight, 
  Layers,
  ArrowRight,
  Info
} from 'lucide-react';
import { useI18n } from '../../locales/i18nContext';
import { useFarm } from '../../context/FarmContext';
import { AgronomicTaskPreset, GrowthStageKey, TaskType, FarmTask, CropCycle } from '../../types/melon';
import { DEFAULT_AGRONOMIC_TASK_PRESETS, TASK_TYPE_METADATA, buildTasksFromPresets } from '../../data/agronomicTaskPresets';
import { getStageColorTheme, DEFAULT_GROWTH_STAGES, GrowthStagePreset } from '../../data/customStagePresets';

interface TaskPresetSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTaskModal?: (task?: FarmTask) => void;
}

export interface StageDisplayMeta {
  nameEn: string;
  nameKm: string;
  colorName: string;
  badgeBg: string;
  badgeText: string;
  dotBg: string;
  border: string;
  accentBar: string;
  defaultDays?: number;
  ecTarget?: string;
  phTarget?: string;
}

/**
 * Dynamically resolves growth stage visual styles and bilingual names
 * directly from the Stage Settings configured in Crop Management.
 */
export function getStageConfig(
  stageKey: string,
  growthStagesList?: GrowthStagePreset[]
): StageDisplayMeta {
  // 1. Look up in active growthStages from Stage Settings Crop Management
  if (growthStagesList && growthStagesList.length > 0) {
    const matched = growthStagesList.find((s) => s.key === stageKey);
    if (matched) {
      const theme = getStageColorTheme(matched.color);
      return {
        nameEn: matched.nameEn,
        nameKm: matched.nameKm,
        colorName: matched.color || 'emerald',
        badgeBg: theme.badgeBg,
        badgeText: theme.badgeText,
        dotBg: theme.dotBg,
        border: theme.borderActive || 'border-emerald-200',
        accentBar: theme.accentBg || 'bg-emerald-500',
        defaultDays: matched.defaultDays,
        ecTarget: matched.ecTarget,
        phTarget: matched.phTarget,
      };
    }
  }

  // 2. Check DEFAULT_GROWTH_STAGES
  const fallback = DEFAULT_GROWTH_STAGES.find((s) => s.key === stageKey);
  if (fallback) {
    const theme = getStageColorTheme(fallback.color);
    return {
      nameEn: fallback.nameEn,
      nameKm: fallback.nameKm,
      colorName: fallback.color || 'emerald',
      badgeBg: theme.badgeBg,
      badgeText: theme.badgeText,
      dotBg: theme.dotBg,
      border: theme.borderActive || 'border-emerald-200',
      accentBar: theme.accentBg || 'bg-emerald-500',
      defaultDays: fallback.defaultDays,
      ecTarget: fallback.ecTarget,
      phTarget: fallback.phTarget,
    };
  }

  // 3. Fallback for any unknown stage key
  const formatted = stageKey.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    nameEn: formatted,
    nameKm: formatted,
    colorName: 'emerald',
    badgeBg: 'bg-emerald-50 text-emerald-800',
    badgeText: 'text-emerald-800',
    dotBg: 'bg-emerald-500',
    border: 'border-emerald-200',
    accentBar: 'bg-emerald-500',
    defaultDays: 7,
  };
}

// Backwards-compatible export
export const STAGE_CONFIG: Record<string, StageDisplayMeta> = new Proxy(
  {},
  {
    get: (_, prop: string) => getStageConfig(prop),
  }
);

const TASK_TYPE_ICONS: Record<TaskType, React.ReactNode> = {
  watering: <Droplets className="w-3.5 h-3.5" />,
  fertilizing: <Sparkles className="w-3.5 h-3.5" />,
  vine_maintenance: <Scissors className="w-3.5 h-3.5" />,
  flowering_pollination: <Flower2 className="w-3.5 h-3.5" />,
  pest_check: <Bug className="w-3.5 h-3.5" />,
  harvest_prep: <ClipboardCheck className="w-3.5 h-3.5" />,
  harvest: <Scale className="w-3.5 h-3.5" />,
  pruning: <Scissors className="w-3.5 h-3.5" />,
};

export const TaskPresetSettingsModal: React.FC<TaskPresetSettingsModalProps> = ({
  isOpen,
  onClose,
  onOpenTaskModal,
}) => {
  const { language } = useI18n();
  const {
    taskPresets,
    addTaskPreset,
    updateTaskPreset,
    deleteTaskPreset,
    resetTaskPresets,
    cropCycles,
    cropVarieties,
    growthStages,
    addTask,
    tasks,
    plots,
  } = useFarm();

  // Active growth stages list from Stage Settings Crop Management
  const activeGrowthStages = useMemo(() => {
    return growthStages && growthStages.length > 0 ? growthStages : DEFAULT_GROWTH_STAGES;
  }, [growthStages]);

  // Layout View Mode: default is 'list' as requested
  const [viewMode, setViewMode] = useState<'catalog' | 'list'>('list');
  
  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('all');

  // Sub-modals
  const [editingPreset, setEditingPreset] = useState<AgronomicTaskPreset | null>(null);
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [viewingPreset, setViewingPreset] = useState<AgronomicTaskPreset | null>(null);
  const [presetToDelete, setPresetToDelete] = useState<AgronomicTaskPreset | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [assignSuccessMessage, setAssignSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Active / Enabled Presets Count
  const enabledCount = taskPresets.filter((p) => p.enabled).length;

  // Dynamic stage filter tabs populated directly from active Stage Settings
  const stageKeysList = [
    { key: 'all', labelEn: 'All Stages', labelKm: 'គ្រប់ដំណាក់កាល', dotBg: '' },
    ...activeGrowthStages.map((stg) => {
      const cfg = getStageConfig(stg.key, activeGrowthStages);
      return {
        key: stg.key,
        labelEn: stg.nameEn,
        labelKm: stg.nameKm,
        dotBg: cfg.dotBg,
      };
    }),
  ];

  // Filtered Presets
  const filteredPresets = taskPresets.filter((preset) => {
    if (selectedStageFilter !== 'all' && preset.stageKey !== selectedStageFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchEn = preset.titleEn.toLowerCase().includes(q);
      const matchKm = preset.titleKm.toLowerCase().includes(q);
      const matchStage = preset.stageKey.toLowerCase().includes(q);
      const matchDosage = preset.dosageOrVolume?.toLowerCase().includes(q) || false;
      const matchNotes = (preset.notesEn?.toLowerCase().includes(q) || preset.notesKm?.toLowerCase().includes(q)) || false;
      if (!matchEn && !matchKm && !matchStage && !matchDosage && !matchNotes) return false;
    }
    return true;
  });

  // Handle Toggle Enabled
  const handleToggleEnabled = (preset: AgronomicTaskPreset) => {
    updateTaskPreset({
      ...preset,
      enabled: !preset.enabled,
    });
  };

  // Handle Duplicate
  const handleDuplicatePreset = (preset: AgronomicTaskPreset) => {
    addTaskPreset({
      stageKey: preset.stageKey,
      titleEn: `${preset.titleEn} (Copy)`,
      titleKm: `${preset.titleKm} (ចម្លង)`,
      type: preset.type,
      time: preset.time,
      priority: preset.priority,
      dayOffset: preset.dayOffset,
      dosageOrVolume: preset.dosageOrVolume,
      notesEn: preset.notesEn,
      notesKm: preset.notesKm,
      enabled: true,
      order: taskPresets.length + 1,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-50/60 via-teal-50/40 to-white">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-600 to-[#123e1b] flex items-center justify-center text-white shadow-md shadow-emerald-900/20 shrink-0">
              <Sliders className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  Task Preset Settings
                </h2>
                <span className="text-slate-300 hidden sm:inline">•</span>
                <span className="font-khmer font-bold text-emerald-800 text-base">
                  ការកំណត់គំរូកិច្ចការស្វ័យប្រវត្តិ
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {enabledCount} / {taskPresets.length} Active
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                {language === 'km'
                  ? 'កំណត់ និងគ្រប់គ្រងកិច្ចការស្វ័យប្រវត្តិចំនួន ៦ សំខាន់ៗក្នុងប្រតិទិនចំការ ផ្អែកលើដំណាក់កាលលូតលាស់ពី Stage Settings'
                  : 'Configure, add, edit, or delete the 6 key agronomic tasks auto-generated on the Farm Calendar based on Stage Settings'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* NOTIFICATION BANNER (if tasks were assigned) */}
        {assignSuccessMessage && (
          <div className="mx-6 mt-4 p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl flex items-center justify-between gap-3 text-xs font-semibold animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{assignSuccessMessage}</span>
            </div>
            <button
              onClick={() => setAssignSuccessMessage(null)}
              className="text-emerald-700 hover:text-emerald-900 font-bold p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* TOOLBAR & CONTROLS */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-white flex flex-col gap-3.5">
          {/* Top Line: Search, View Switcher & Action Buttons */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  language === 'km'
                    ? 'ស្វែងរកតាមឈ្មោះកិច្ចការ, ដំណាក់កាល, ជី ឬចំណាំ...'
                    : 'Search preset title, stage, dosage, or notes...'
                }
                className="w-full pl-9.5 pr-8 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* View Switcher & Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* View Mode Toggle: Catalog vs List (default is list) */}
              <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-white text-emerald-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                  title="List View (Table)"
                >
                  <List className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{language === 'km' ? 'បញ្ជី' : 'List'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('catalog')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'catalog'
                      ? 'bg-white text-emerald-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                  title="Catalog View (Cards)"
                >
                  <LayoutGrid className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{language === 'km' ? 'កាតាឡុក' : 'Catalog'}</span>
                </button>
              </div>

              {/* Assign to Farm Calendar Button */}
              <button
                type="button"
                onClick={() => setIsAssignDialogOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                title="Assign / Auto-Generate tasks into Farm Calendar for active cycles"
              >
                <CalendarPlus className="w-4 h-4 text-emerald-700" />
                <span>{language === 'km' ? 'បង្កើតកិច្ចការចូលប្រតិទិន' : 'Assign to Calendar'}</span>
              </button>

              {/* Reset to Factory Defaults Button */}
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(language === 'km' 
                    ? 'តើអ្នកប្រាកដជាចង់កំណត់គំរូកិច្ចការស្វ័យប្រវត្តិនេះឡើងវិញទៅ ៦ កិច្ចការដើមមែនទេ?' 
                    : 'Reset all task presets to factory 6 key agronomic melon tasks?')) {
                    resetTaskPresets();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                title="Restore default 6 key melon tasks"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">{language === 'km' ? 'កំណត់ឡើងវិញ' : 'Reset'}</span>
              </button>

              {/* Add New Task Preset Button */}
              <button
                type="button"
                onClick={() => {
                  setEditingPreset(null);
                  setIsAddEditOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-[#164e22] hover:bg-[#123e1b] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>{language === 'km' ? '+ បន្ថែមគំរូកិច្ចការ' : '+ Add Task Preset'}</span>
              </button>
            </div>
          </div>

          {/* Growth Stages Filter Tabs (Applied dynamically from Stage Settings Crop Management) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            {stageKeysList.map((stg) => {
              const isActive = selectedStageFilter === stg.key;
              const count = stg.key === 'all' 
                ? taskPresets.length 
                : taskPresets.filter((p) => p.stageKey === stg.key).length;

              return (
                <button
                  key={stg.key}
                  type="button"
                  onClick={() => setSelectedStageFilter(stg.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                  }`}
                >
                  {stg.dotBg && (
                    <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-300' : stg.dotBg}`} />
                  )}
                  <span>{language === 'km' ? stg.labelKm : stg.labelEn}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-emerald-950/60 text-emerald-200' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* CONTENT AREA: LIST (DEFAULT) OR CATALOG */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50/60">
          {filteredPresets.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-slate-300 p-8">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Sliders className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-700">No Task Presets Found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                No agronomic task presets match your filter. Click "+ Add Task Preset" or "Reset" to restore standard melon tasks.
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  onClick={resetTaskPresets}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Restore 6 Key Tasks
                </button>
                <button
                  onClick={() => {
                    setEditingPreset(null);
                    setIsAddEditOpen(true);
                  }}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  + Add Preset
                </button>
              </div>
            </div>
          ) : viewMode === 'list' ? (
            /* --- DEFAULT: LIST VIEW (DATA TABLE) --- */
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/90 text-slate-600 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-3 w-12 text-center">#</th>
                      <th className="py-3 px-4 min-w-[150px]">Growth Stage (Stage Settings)</th>
                      <th className="py-3 px-4 min-w-[260px]">Task Name (EN / KM)</th>
                      <th className="py-3 px-3 min-w-[150px]">Activity Type</th>
                      <th className="py-3 px-3 min-w-[120px]">Schedule & Time</th>
                      <th className="py-3 px-3 min-w-[130px]">Dosage / Supplies</th>
                      <th className="py-3 px-3 text-center">Priority</th>
                      <th className="py-3 px-3 text-center">Auto-Gen</th>
                      <th className="py-3 px-4 text-right min-w-[110px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPresets.map((preset, idx) => {
                      const stageMeta = getStageConfig(preset.stageKey, activeGrowthStages);
                      const typeMeta = TASK_TYPE_METADATA[preset.type] || TASK_TYPE_METADATA.watering;
                      const typeIcon = TASK_TYPE_ICONS[preset.type] || <Droplets className="w-3.5 h-3.5" />;

                      return (
                        <tr
                          key={preset.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            !preset.enabled ? 'opacity-60 bg-slate-50/40' : ''
                          }`}
                        >
                          {/* Order / Index */}
                          <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-400">
                            {preset.order || idx + 1}
                          </td>

                          {/* Stage (from Stage Settings Crop Management) */}
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${stageMeta.badgeBg}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${stageMeta.dotBg}`} />
                              <span>{language === 'km' ? stageMeta.nameKm : stageMeta.nameEn}</span>
                            </span>
                          </td>

                          {/* Task Name */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">
                              {preset.titleEn}
                            </div>
                            <div className="text-[11px] font-khmer text-emerald-800 font-medium">
                              {preset.titleKm}
                            </div>
                          </td>

                          {/* Activity Type */}
                          <td className="py-3.5 px-3">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold ${typeMeta.badgeBg} border ${typeMeta.borderColor}`}>
                              {typeIcon}
                              <span>{language === 'km' ? typeMeta.labelKm : typeMeta.labelEn}</span>
                            </span>
                          </td>

                          {/* Schedule & Time */}
                          <td className="py-3.5 px-3">
                            <div className="font-semibold text-slate-800 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{preset.time || '07:30'}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                              Day {preset.dayOffset} of Stage
                            </div>
                          </td>

                          {/* Dosage */}
                          <td className="py-3.5 px-3">
                            {preset.dosageOrVolume ? (
                              <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md inline-block max-w-[130px] truncate" title={preset.dosageOrVolume}>
                                {preset.dosageOrVolume}
                              </span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>

                          {/* Priority */}
                          <td className="py-3.5 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold capitalize inline-block ${
                              preset.priority === 'high'
                                ? 'bg-rose-100 text-rose-800'
                                : preset.priority === 'medium'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-600'
                            }`}>
                              {preset.priority}
                            </span>
                          </td>

                          {/* Auto-Gen Toggle */}
                          <td className="py-3.5 px-3 text-center">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={preset.enabled}
                                onChange={() => handleToggleEnabled(preset)}
                                className="sr-only peer"
                              />
                              <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-emerald-600"></div>
                            </label>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => setViewingPreset(preset)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                                title="View Details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingPreset(preset);
                                  setIsAddEditOpen(true);
                                }}
                                className="p-1.5 rounded-lg text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 transition-colors cursor-pointer"
                                title="Edit Preset"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setPresetToDelete(preset)}
                                className="p-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Delete Preset"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* --- CATALOG VIEW (CARDS GRID) --- */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPresets.map((preset, idx) => {
                const stageMeta = getStageConfig(preset.stageKey, activeGrowthStages);
                const typeMeta = TASK_TYPE_METADATA[preset.type] || TASK_TYPE_METADATA.watering;
                const typeIcon = TASK_TYPE_ICONS[preset.type] || <Droplets className="w-3.5 h-3.5" />;

                return (
                  <div
                    key={preset.id}
                    className={`bg-white rounded-2xl border transition-all hover:shadow-md relative overflow-hidden flex flex-col justify-between ${
                      preset.enabled
                        ? 'border-slate-200/90 shadow-2xs hover:border-emerald-400'
                        : 'border-slate-200/50 opacity-70 bg-slate-50/50'
                    }`}
                  >
                    {/* Top Stage Accent Stripe */}
                    <div className={`h-1.5 w-full ${stageMeta.accentBar}`} />

                    <div className="p-4 sm:p-5 flex-1 flex flex-col">
                      {/* Stage Badge & Enable Toggle */}
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${stageMeta.badgeBg}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${stageMeta.dotBg}`} />
                            {language === 'km' ? stageMeta.nameKm : stageMeta.nameEn}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 font-mono">
                            #{preset.order || idx + 1}
                          </span>
                        </div>

                        {/* Enable/Disable Toggle */}
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={preset.enabled}
                            onChange={() => handleToggleEnabled(preset)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                        </label>
                      </div>

                      {/* Bilingual Titles */}
                      <div className="mb-3">
                        <h4 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                          {preset.titleEn}
                        </h4>
                        <p className="text-xs font-khmer text-emerald-800 font-medium mt-0.5 line-clamp-1">
                          {preset.titleKm}
                        </p>
                      </div>

                      {/* Badges: Type, Time, Offset, Priority */}
                      <div className="flex flex-wrap items-center gap-1.5 mb-3 text-[11px]">
                        {/* Task Type */}
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg font-bold ${typeMeta.badgeBg} border ${typeMeta.borderColor}`}>
                          {typeIcon}
                          <span>{language === 'km' ? typeMeta.labelKm : typeMeta.labelEn}</span>
                        </span>

                        {/* Scheduled Time */}
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg font-semibold bg-slate-100 text-slate-700">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{preset.time || '07:30'}</span>
                        </span>

                        {/* Day Offset */}
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg font-semibold bg-slate-100 text-slate-700 font-mono">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>Day {preset.dayOffset}</span>
                        </span>

                        {/* Priority Badge */}
                        <span className={`px-2 py-0.5 rounded-lg font-bold capitalize ${
                          preset.priority === 'high'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : preset.priority === 'medium'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-600'
                        }`}>
                          {preset.priority}
                        </span>
                      </div>

                      {/* Dosage or Supplies Pill */}
                      {preset.dosageOrVolume && (
                        <div className="mb-2 text-xs text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-200/60 flex items-center gap-2">
                          <Scale className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="font-semibold truncate">{preset.dosageOrVolume}</span>
                        </div>
                      )}

                      {/* Agronomic SOP Notes */}
                      <div className="text-[11px] text-slate-500 line-clamp-2 bg-slate-50/50 p-2 rounded-xl mb-3 flex-1">
                        {language === 'km' ? preset.notesKm || preset.notesEn : preset.notesEn || preset.notesKm}
                      </div>

                      {/* Dynamic Placeholders Indicator */}
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono flex-wrap">
                        <span className="text-slate-500 font-semibold">Tags:</span>
                        {preset.titleEn.includes('{varietyEn}') && <span className="bg-emerald-50 text-emerald-700 px-1 rounded">variety</span>}
                        {preset.titleEn.includes('{targetBrix}') && <span className="bg-amber-50 text-amber-700 px-1 rounded">targetBrix</span>}
                        {preset.titleEn.includes('{idealEc}') && <span className="bg-blue-50 text-blue-700 px-1 rounded">idealEc</span>}
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="p-3 bg-slate-50/90 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setViewingPreset(preset)}
                        className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 font-semibold px-2 py-1 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>{language === 'km' ? 'លម្អិត' : 'View'}</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDuplicatePreset(preset)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 transition-colors cursor-pointer"
                          title="Duplicate"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPreset(preset);
                            setIsAddEditOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 transition-colors cursor-pointer"
                          title="Edit Preset"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPresetToDelete(preset)}
                          className="p-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete Preset"
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

        {/* MODAL FOOTER */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Info className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {language === 'km'
                ? 'កិច្ចការស្វ័យប្រវត្តិនឹងត្រូវបង្កើតឡើងនៅពេលបង្កើត Crop Batch ថ្មី ឬដោយចុច "Assign to Calendar"'
                : 'Tasks are automatically created for each batch upon planting, or can be synced anytime via "Assign to Calendar"'}
            </span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              {language === 'km' ? 'បិទ' : 'Done & Close'}
            </button>
          </div>
        </div>
      </div>

      {/* --- SUB-MODAL 1: ADD / EDIT PRESET --- */}
      {isAddEditOpen && (
        <AddEditPresetModal
          isOpen={isAddEditOpen}
          presetToEdit={editingPreset}
          growthStages={activeGrowthStages}
          onClose={() => {
            setIsAddEditOpen(false);
            setEditingPreset(null);
          }}
          onSave={(data) => {
            if (editingPreset) {
              updateTaskPreset({
                ...editingPreset,
                ...data,
              });
            } else {
              addTaskPreset(data);
            }
            setIsAddEditOpen(false);
            setEditingPreset(null);
          }}
        />
      )}

      {/* --- SUB-MODAL 2: VIEW PRESET DETAILS --- */}
      {viewingPreset && (
        <ViewPresetDetailsModal
          preset={viewingPreset}
          growthStages={activeGrowthStages}
          onClose={() => setViewingPreset(null)}
          onEdit={() => {
            setEditingPreset(viewingPreset);
            setViewingPreset(null);
            setIsAddEditOpen(true);
          }}
        />
      )}

      {/* --- SUB-MODAL 3: ASSIGN / AUTO-GENERATE TO FARM CALENDAR --- */}
      {isAssignDialogOpen && (
        <AssignTasksDialog
          isOpen={isAssignDialogOpen}
          onClose={() => setIsAssignDialogOpen(false)}
          onSuccess={(msg) => {
            setAssignSuccessMessage(msg);
            setIsAssignDialogOpen(false);
          }}
        />
      )}

      {/* --- SUB-MODAL 4: DELETE CONFIRMATION --- */}
      {presetToDelete && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              {language === 'km' ? 'លុបគំរូកិច្ចការស្វ័យប្រវត្តិ?' : 'Delete Task Preset?'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {language === 'km' 
                ? `តើអ្នកប្រាកដជាចង់លុប "${presetToDelete.titleKm || presetToDelete.titleEn}"?` 
                : `Are you sure you want to remove "${presetToDelete.titleEn}"? Existing tasks on your calendar will not be affected.`}
            </p>

            <div className="flex items-center justify-center gap-3 mt-5">
              <button
                type="button"
                onClick={() => setPresetToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteTaskPreset(presetToDelete.id);
                  setPresetToDelete(null);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl cursor-pointer shadow-xs"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* SUB-COMPONENT: ADD / EDIT PRESET MODAL                                     */
/* -------------------------------------------------------------------------- */

interface AddEditPresetModalProps {
  isOpen: boolean;
  presetToEdit: AgronomicTaskPreset | null;
  growthStages: GrowthStagePreset[];
  onClose: () => void;
  onSave: (data: Omit<AgronomicTaskPreset, 'id'>) => void;
}

const AddEditPresetModal: React.FC<AddEditPresetModalProps> = ({
  isOpen,
  presetToEdit,
  growthStages,
  onClose,
  onSave,
}) => {
  const { language } = useI18n();

  const defaultInitialStage = presetToEdit?.stageKey || growthStages[0]?.key || 'seedling';
  const [stageKey, setStageKey] = useState<GrowthStageKey>(defaultInitialStage as GrowthStageKey);
  const [titleEn, setTitleEn] = useState(presetToEdit?.titleEn || '');
  const [titleKm, setTitleKm] = useState(presetToEdit?.titleKm || '');
  const [type, setType] = useState<TaskType>(presetToEdit?.type || 'watering');
  const [time, setTime] = useState(presetToEdit?.time || '07:30');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(presetToEdit?.priority || 'high');
  const [dayOffset, setDayOffset] = useState<number>(presetToEdit?.dayOffset ?? 0);
  const [dosageOrVolume, setDosageOrVolume] = useState(presetToEdit?.dosageOrVolume || '');
  const [notesEn, setNotesEn] = useState(presetToEdit?.notesEn || '');
  const [notesKm, setNotesKm] = useState(presetToEdit?.notesKm || '');
  const [enabled, setEnabled] = useState(presetToEdit ? presetToEdit.enabled : true);
  const [order, setOrder] = useState<number>(presetToEdit?.order || 1);

  const [error, setError] = useState<string | null>(null);

  // Selected stage details from Stage Settings Crop Management
  const selectedStageObj = growthStages.find((s) => s.key === stageKey);
  const selectedStageMeta = getStageConfig(stageKey, growthStages);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleEn.trim()) {
      setError('Please provide a Task Title (English)');
      return;
    }
    setError(null);

    onSave({
      stageKey,
      titleEn: titleEn.trim(),
      titleKm: titleKm.trim() || titleEn.trim(),
      type,
      time: time || '08:00',
      priority,
      dayOffset: Number(dayOffset) || 0,
      dosageOrVolume: dosageOrVolume.trim() || undefined,
      notesEn: notesEn.trim() || undefined,
      notesKm: notesKm.trim() || undefined,
      enabled,
      order: Number(order) || 1,
    });
  };

  const insertPlaceholder = (token: string, target: 'titleEn' | 'notesEn') => {
    if (target === 'titleEn') {
      setTitleEn((prev) => `${prev} ${token}`);
    } else {
      setNotesEn((prev) => `${prev} ${token}`);
    }
  };

  return (
    <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {presetToEdit 
                  ? (language === 'km' ? 'កែប្រែគំរូកិច្ចការស្វ័យប្រវត្តិ' : 'Edit Task Preset')
                  : (language === 'km' ? '+ បន្ថែមគំរូកិច្ចការស្វ័យប្រវត្តិថ្មី' : '+ Add New Task Preset')}
              </h3>
              <p className="text-xs text-slate-500">
                Target Botanical Growth Stage from Stage Settings & Farm Calendar parameters
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Row 1: Target Growth Stage (Applied directly from Stage Settings Crop Management) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Target Growth Stage / ដំណាក់កាលលូតលាស់ *
              </label>
              <select
                value={stageKey}
                onChange={(e) => setStageKey(e.target.value as GrowthStageKey)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {growthStages.map((stg) => (
                  <option key={stg.key} value={stg.key}>
                    {stg.nameEn} ({stg.nameKm}) · {stg.defaultDays} {language === 'km' ? 'ថ្ងៃ' : 'Days'}
                  </option>
                ))}
              </select>
              {selectedStageObj && (
                <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-500">
                  <span className={`w-2 h-2 rounded-full inline-block ${selectedStageMeta.dotBg}`} />
                  <span>
                    Stage Duration: <strong>{selectedStageObj.defaultDays} {language === 'km' ? 'ថ្ងៃ' : 'Days'}</strong>
                    {selectedStageObj.ecTarget ? ` · Target EC: ${selectedStageObj.ecTarget}` : ''}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Day Offset from Stage Start (ថ្ងៃគម្លាត)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="45"
                  value={dayOffset}
                  onChange={(e) => setDayOffset(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[11px] text-slate-500 whitespace-nowrap">
                  (0 = Day 1 of Stage)
                </span>
              </div>
            </div>
          </div>

          {/* Row 2: Title English with Dynamic Tokens */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-700">
                Task Title (English) *
              </label>
              <div className="flex items-center gap-1 text-[10px]">
                <span className="text-slate-400">Add tag:</span>
                <button
                  type="button"
                  onClick={() => insertPlaceholder('{varietyEn}', 'titleEn')}
                  className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-mono font-semibold"
                >
                  +{'{varietyEn}'}
                </button>
                <button
                  type="button"
                  onClick={() => insertPlaceholder('{targetBrix}', 'titleEn')}
                  className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 hover:bg-amber-100 font-mono font-semibold"
                >
                  +{'{targetBrix}'}
                </button>
                <button
                  type="button"
                  onClick={() => insertPlaceholder('{idealEc}', 'titleEn')}
                  className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-mono font-semibold"
                >
                  +{'{idealEc}'}
                </button>
              </div>
            </div>
            <input
              type="text"
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              placeholder="e.g. Nursery Seeding & Peat Moss Hydration for {varietyEn}"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Row 3: Title Khmer */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Task Title (Khmer / ភាសាខ្មែរ)
            </label>
            <input
              type="text"
              value={titleKm}
              onChange={(e) => setTitleKm(e.target.value)}
              placeholder="ឧទាហរណ៍៖ សាបគ្រាប់ក្នុងថាស និងផ្តល់សំណើមជីកំប៉ុសសម្រាប់ {varietyKm}"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-800 font-khmer outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Row 4: Activity Type, Scheduled Time, Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Activity Type / ប្រភេទ
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TaskType)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="watering">Watering & Drip (ស្រោចទឹក)</option>
                <option value="fertilizing">Fertilizing & Feeding (ដាក់ជី)</option>
                <option value="vine_maintenance">Vine Maintenance (ថែទាំដើម)</option>
                <option value="flowering_pollination">Flowering & Pollination (បង្កាត់)</option>
                <option value="pest_check">Pest Inspection (ពិនិត្យសត្វល្អិត)</option>
                <option value="harvest_prep">Harvest Prep (រៀបចំប្រមូលផល)</option>
                <option value="harvest">Harvest & Sorting (ប្រមូលផល)</option>
                <option value="pruning">Pruning (កាត់តម្រឹម)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Scheduled Time (ម៉ោង)
              </label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="07:30"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Priority / អាទិភាព
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="high">High (ខ្ពស់)</option>
                <option value="medium">Medium (មធ្យម)</option>
                <option value="low">Low (ទាប)</option>
              </select>
            </div>
          </div>

          {/* Row 5: Dosage / Volume / Supplies */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Dosage, Supplies, or Tool (កម្រិត ឬសម្ភារៈ)
            </label>
            <input
              type="text"
              value={dosageOrVolume}
              onChange={(e) => setDosageOrVolume(e.target.value)}
              placeholder="e.g. 200 L Water (pH 6.2) / Trellis Clips / Brix Refractometer"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Row 6: SOP Notes (English & Khmer) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Agronomic Notes (English)
              </label>
              <textarea
                rows={3}
                value={notesEn}
                onChange={(e) => setNotesEn(e.target.value)}
                placeholder="Technical SOP, guidelines, target pH/EC..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Agronomic Notes (Khmer / ភាសាខ្មែរ)
              </label>
              <textarea
                rows={3}
                value={notesKm}
                onChange={(e) => setNotesKm(e.target.value)}
                placeholder="ការណែនាំបច្ចេកទេស និងបទដ្ឋាន SOP..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-800 font-khmer outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Row 7: Order & Enabled Switch */}
          <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-200/60">
            <div className="flex items-center gap-2">
              <label className="font-bold text-slate-700">Display Order (#):</label>
              <input
                type="number"
                min="1"
                max="99"
                value={order}
                onChange={(e) => setOrder(parseInt(e.target.value, 10) || 1)}
                className="w-16 px-2 py-1 rounded-lg border border-slate-200 bg-white font-mono font-bold text-slate-800 text-center"
              />
            </div>

            <div className="flex items-center gap-3">
              <span className="font-bold text-slate-700">Auto-Generate Active:</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-[#164e22] hover:bg-[#123e1b] rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {presetToEdit ? 'Save Changes' : '+ Add Preset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* SUB-COMPONENT: VIEW PRESET DETAILS MODAL                                   */
/* -------------------------------------------------------------------------- */

interface ViewPresetDetailsModalProps {
  preset: AgronomicTaskPreset;
  growthStages: GrowthStagePreset[];
  onClose: () => void;
  onEdit: () => void;
}

const ViewPresetDetailsModal: React.FC<ViewPresetDetailsModalProps> = ({
  preset,
  growthStages,
  onClose,
  onEdit,
}) => {
  const { language } = useI18n();
  const stageMeta = getStageConfig(preset.stageKey, growthStages);
  const typeMeta = TASK_TYPE_METADATA[preset.type] || TASK_TYPE_METADATA.watering;

  return (
    <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white ${stageMeta.accentBar}`}>
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Task Preset Details</h3>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${stageMeta.badgeBg}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${stageMeta.dotBg}`} />
                {stageMeta.nameEn} ({stageMeta.nameKm})
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Agronomic Task Title
            </div>
            <h4 className="text-base font-bold text-slate-900">{preset.titleEn}</h4>
            <p className="text-sm font-khmer text-emerald-800 font-semibold mt-0.5">{preset.titleKm}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-200/70">
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">Activity Type</span>
              <span className="font-bold text-slate-800">{typeMeta.labelEn}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">Scheduled Time</span>
              <span className="font-mono font-bold text-slate-800">{preset.time}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">Stage Offset</span>
              <span className="font-mono font-bold text-slate-800">Day {preset.dayOffset}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">Priority</span>
              <span className="font-bold text-slate-800 capitalize">{preset.priority}</span>
            </div>
          </div>

          {preset.dosageOrVolume && (
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Target Supplies & Dosage
              </div>
              <div className="p-2.5 bg-emerald-50/60 border border-emerald-200 rounded-xl text-emerald-900 font-semibold">
                {preset.dosageOrVolume}
              </div>
            </div>
          )}

          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Agronomic Notes & SOP
            </div>
            <div className="space-y-2 text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
              {preset.notesEn && <p className="leading-relaxed">{preset.notesEn}</p>}
              {preset.notesKm && <p className="font-khmer text-emerald-900 leading-relaxed">{preset.notesKm}</p>}
            </div>
          </div>

          <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-amber-900 flex items-start gap-2 text-[11px]">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Template Placeholders:</span>
              <p className="mt-0.5 text-amber-800">
                Variables like <code>{'{varietyEn}'}</code>, <code>{'{targetBrix}'}</code>, and <code>{'{idealEc}'}</code> are automatically replaced with values from the crop variety when generating tasks for each batch.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs"
          >
            Edit This Preset
          </button>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* SUB-COMPONENT: ASSIGN / AUTO-GENERATE TO FARM CALENDAR DIALOG              */
/* -------------------------------------------------------------------------- */

interface AssignTasksDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

const AssignTasksDialog: React.FC<AssignTasksDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { language } = useI18n();
  const {
    cropCycles,
    taskPresets,
    cropVarieties,
    addTask,
    tasks,
    plots,
  } = useFarm();

  const activeCycles = cropCycles.filter((c) => c.status === 'active' || c.status === 'planned');
  const [selectedCycleIds, setSelectedCycleIds] = useState<string[]>(
    activeCycles.map((c) => c.id)
  );

  const toggleSelectCycle = (cycleId: string) => {
    setSelectedCycleIds((prev) =>
      prev.includes(cycleId) ? prev.filter((id) => id !== cycleId) : [...prev, cycleId]
    );
  };

  const handleSelectAll = () => {
    if (selectedCycleIds.length === activeCycles.length) {
      setSelectedCycleIds([]);
    } else {
      setSelectedCycleIds(activeCycles.map((c) => c.id));
    }
  };

  const handleGenerate = () => {
    if (selectedCycleIds.length === 0) return;

    let createdTotal = 0;
    const targetCycles = activeCycles.filter((c) => selectedCycleIds.includes(c.id));

    targetCycles.forEach((cycle) => {
      const matchedVariety = cropVarieties.find(
        (v) => v.nameEn.toLowerCase() === cycle.variety.toLowerCase()
      );

      const tasksToGenerate = buildTasksFromPresets(
        taskPresets,
        cycle,
        cycle.stages || [],
        {
          assignedWorker: cycle.assignedAgronomist,
          targetBrix: matchedVariety?.targetBrix,
          idealEc: matchedVariety?.idealEc,
          varietyEn: matchedVariety?.nameEn || cycle.variety,
          varietyKm: matchedVariety?.nameKm || cycle.variety,
        }
      );

      tasksToGenerate.forEach((t) => {
        // Prevent exact duplicate on same date and same stageKey
        const exists = tasks.some(
          (et) => et.batchId === cycle.id && et.stageKey === t.stageKey && et.date === t.date
        );
        if (!exists) {
          addTask(t);
          createdTotal++;
        }
      });
    });

    onSuccess(
      language === 'km'
        ? `បានបង្កើត ${createdTotal} កិច្ចការស្វ័យប្រវត្តិចូលក្នុងប្រតិទិនចំការសម្រាប់ ${targetCycles.length} ដំណាំ!`
        : `Successfully assigned & generated ${createdTotal} agronomic tasks across ${targetCycles.length} crop batch(es) in the Farm Calendar!`
    );
  };

  const enabledPresets = taskPresets.filter((p) => p.enabled);

  return (
    <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-white">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-md">
              <CalendarPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {language === 'km' ? 'បង្កើតកិច្ចការចូលប្រតិទិន' : 'Assign to Farm Calendar'}
              </h3>
              <p className="text-xs text-slate-500">
                Auto-generate active agronomic tasks for crop batches
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Info Badge */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center justify-between">
            <div>
              <span className="font-bold text-emerald-950 block">
                {enabledPresets.length} Active Presets Ready
              </span>
              <span className="text-[11px] text-emerald-700">
                Seedling, Transplanting, Trellising, Pollination, Netting, Brix Test
              </span>
            </div>
            <span className="px-2.5 py-1 bg-emerald-700 text-white font-bold rounded-xl text-xs">
              {enabledPresets.length} Tasks / Batch
            </span>
          </div>

          {/* Select Batches */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-bold text-slate-700">
                Select Active Crop Batches ({selectedCycleIds.length} / {activeCycles.length}):
              </label>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-emerald-700 hover:text-emerald-900 font-bold cursor-pointer"
              >
                {selectedCycleIds.length === activeCycles.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            {activeCycles.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 rounded-xl text-slate-400">
                No active or planned crop batches found.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {activeCycles.map((cycle) => {
                  const plot = plots.find((p) => p.id === cycle.plotId);
                  const isChecked = selectedCycleIds.includes(cycle.id);

                  return (
                    <div
                      key={cycle.id}
                      onClick={() => toggleSelectCycle(cycle.id)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-emerald-50/50 border-emerald-400 shadow-2xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                          isChecked ? 'bg-emerald-700 border-emerald-700 text-white' : 'border-slate-300'
                        }`}>
                          {isChecked && <Check className="w-3 h-3" />}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{cycle.name}</div>
                          <div className="text-[10px] text-slate-500">
                            {cycle.variety} · {plot?.name || cycle.plotId} · Sowing: {cycle.sowingDate}
                          </div>
                        </div>
                      </div>

                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {cycle.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={selectedCycleIds.length === 0}
            onClick={handleGenerate}
            className={`px-5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              selectedCycleIds.length > 0
                ? 'bg-[#164e22] hover:bg-[#123e1b] text-white shadow-xs'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            Generate Tasks Now
          </button>
        </div>
      </div>
    </div>
  );
};
