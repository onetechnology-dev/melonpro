import React, { useState } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Filter, 
  Check, 
  Clock, 
  MapPin, 
  User, 
  Calendar,
  AlertCircle,
  Sliders,
  LayoutGrid,
  List,
  Sparkles,
  RotateCcw,
  CalendarPlus,
  Eye,
  Edit3,
  Trash2,
  Copy,
  Scale,
  Droplets,
  Scissors,
  Flower2,
  Bug,
  ClipboardCheck,
  Search,
  Tag,
  X
} from 'lucide-react';
import { useI18n } from '../../locales/i18nContext';
import { useFarm } from '../../context/FarmContext';
import { FarmTask, TaskStatus, TaskType, AgronomicTaskPreset } from '../../types/melon';
import { TaskPresetSettingsModal, getStageConfig } from './TaskPresetSettingsModal';
import { TASK_TYPE_METADATA } from '../../data/agronomicTaskPresets';
import { TaskTypesManager } from './TaskTypesManager';
import { getTaskTypeIcon } from '../../data/taskTypePresets';

interface TasksViewProps {
  onOpenTaskModal: (task?: FarmTask) => void;
}

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

export const TasksView: React.FC<TasksViewProps> = ({ onOpenTaskModal }) => {
  const { t, language } = useI18n();
  const { 
    filteredTasks, 
    plots, 
    updateTaskStatus, 
    currentSimulatedDate, 
    taskPresets, 
    updateTaskPreset, 
    deleteTaskPreset, 
    addTaskPreset,
    resetTaskPresets,
    taskTypes,
    growthStages 
  } = useFarm();

  // Primary Sub-Tab: 'calendar_tasks' vs 'agronomic_presets' vs 'task_types'
  const [activeSection, setActiveSection] = useState<'calendar_tasks' | 'agronomic_presets' | 'task_types'>('calendar_tasks');

  // View Layout Switcher: 'catalog' (cards grid) vs 'list' (rows/table), default is 'list'
  const [viewLayout, setViewLayout] = useState<'catalog' | 'list'>('list');

  // Filters for calendar tasks
  const [activeFilter, setActiveFilter] = useState<'all' | 'today' | 'pending' | 'completed'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Task Preset Settings Modal State
  const [isPresetSettingsOpen, setIsPresetSettingsOpen] = useState(false);

  // Agronomic Presets Stage Filter (when viewing presets tab)
  const [presetStageFilter, setPresetStageFilter] = useState<string>('all');

  // Filtered Calendar Tasks
  const displayedTasks = filteredTasks.filter((task) => {
    if (activeFilter === 'today' && task.date !== currentSimulatedDate) return false;
    if (activeFilter === 'pending' && (task.status === 'completed' || task.status === 'skipped')) return false;
    if (activeFilter === 'completed' && task.status !== 'completed') return false;
    if (typeFilter !== 'all' && task.type !== typeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (task.titleEn?.toLowerCase().includes(q) || task.titleKm?.toLowerCase().includes(q));
      const matchWorker = task.assignedWorker?.toLowerCase().includes(q);
      const matchDosage = task.dosageOrVolume?.toLowerCase().includes(q);
      if (!matchTitle && !matchWorker && !matchDosage) return false;
    }
    return true;
  });

  // Filtered Agronomic Presets (for inline view)
  const displayedPresets = taskPresets.filter((preset) => {
    if (presetStageFilter !== 'all' && preset.stageKey !== presetStageFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchEn = preset.titleEn.toLowerCase().includes(q);
      const matchKm = preset.titleKm.toLowerCase().includes(q);
      const matchStage = preset.stageKey.toLowerCase().includes(q);
      const matchDosage = preset.dosageOrVolume?.toLowerCase().includes(q);
      if (!matchEn && !matchKm && !matchStage && !matchDosage) return false;
    }
    return true;
  });

  const enabledPresetsCount = taskPresets.filter((p) => p.enabled).length;

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------------ */}
      {/* 1. HEADER WITH ACTIONS                                              */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Farm Tasks
            </h1>
            <span className="text-slate-300">•</span>
            <span className="font-khmer font-bold text-emerald-800 text-xl sm:text-2xl">
              កិច្ចការចំការ & កាលវិភាគ
            </span>
          </div>
          <p className="text-sm sm:text-base text-slate-500 mt-1">
            {language === 'km' 
              ? 'បញ្ជីការងារប្រចាំថ្ងៃ កិច្ចការដែលត្រូវធ្វើ និងគំរូកិច្ចការស្វ័យប្រវត្តិតាមដំណាក់កាលលូតលាស់' 
              : 'Daily task dispatch, technicians log, and automated melon agronomic tasks across botanical growth stages'}
          </p>
        </div>

        {/* Action Buttons: "+ Add Task", "Task Preset Settings", "Task Types" */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Button 1: "+ Add Task" */}
          <button
            type="button"
            onClick={() => onOpenTaskModal()}
            className="flex items-center gap-2 px-4.5 py-2.5 bg-[#164e22] hover:bg-[#123e1b] text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4.5 h-4.5" />
            <span>{t('addTask')}</span>
          </button>

          {/* Button 2: "Task Preset Settings" */}
          <button
            type="button"
            onClick={() => setIsPresetSettingsOpen(true)}
            className="flex items-center gap-2 px-4.5 py-2.5 bg-emerald-50 hover:bg-emerald-100/90 text-emerald-950 border border-emerald-300 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer hover:shadow-sm"
            title="Configure Auto-generate 6 key melon agronomic tasks in farm calendar based on Growth Stages"
          >
            <Sliders className="w-4.5 h-4.5 text-emerald-700 shrink-0" />
            <span>{language === 'km' ? 'ការកំណត់គំរូកិច្ចការ' : 'Task Preset Settings'}</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-700 text-white leading-tight">
              {enabledPresetsCount}
            </span>
          </button>

          {/* Button 3: "Task Types" Shortcut */}
          <button
            type="button"
            onClick={() => setActiveSection('task_types')}
            className={`flex items-center gap-2 px-4.5 py-2.5 border rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer hover:shadow-sm ${
              activeSection === 'task_types'
                ? 'bg-teal-700 text-white border-teal-800'
                : 'bg-teal-50 hover:bg-teal-100/90 text-teal-950 border-teal-300'
            }`}
            title="Manage custom and system Task Types (Add, Edit, Delete)"
          >
            <Tag className={`w-4.5 h-4.5 shrink-0 ${activeSection === 'task_types' ? 'text-teal-200' : 'text-teal-700'}`} />
            <span>{language === 'km' ? 'ប្រភេទកិច្ចការ' : 'Task Types'}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold leading-tight ${
              activeSection === 'task_types' ? 'bg-teal-900 text-teal-100' : 'bg-teal-700 text-white'
            }`}>
              {taskTypes.length}
            </span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. SUB-SECTION NAV (CALENDAR TASKS vs AGRONOMIC TASK PRESETS vs TASK TYPES) */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl shadow-xs border border-slate-200/80">
        {/* Main Tab Navigation */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl text-xs sm:text-sm font-bold shrink-0 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={() => setActiveSection('calendar_tasks')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
              activeSection === 'calendar_tasks'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4 text-emerald-700" />
            <span>{language === 'km' ? 'កិច្ចការក្នុងប្រតិទិន' : 'Calendar Tasks'}</span>
            <span className="px-2 py-0.5 bg-slate-200 rounded-full text-xs font-mono text-slate-700">
              {filteredTasks.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('agronomic_presets')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
              activeSection === 'agronomic_presets'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>{language === 'km' ? 'គំរូកិច្ចការ ៦ ដំណាក់កាល' : '6 Key Agronomic Presets'}</span>
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-mono font-bold">
              {taskPresets.length}
            </span>
          </button>

          {/* Feature: Task Type right after button "6 Key Agronomic Presets" */}
          <button
            type="button"
            onClick={() => setActiveSection('task_types')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
              activeSection === 'task_types'
                ? 'bg-white text-teal-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Tag className="w-4 h-4 text-teal-600" />
            <span>{language === 'km' ? 'ប្រភេទកិច្ចការ' : 'Task Types'}</span>
            <span className="px-2 py-0.5 bg-teal-100 text-teal-800 rounded-full text-xs font-mono font-bold">
              {taskTypes.length}
            </span>
          </button>
        </div>

        {/* Search & View Switcher (Catalog vs List) */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Search Input */}
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'km' ? 'ស្វែងរកកិច្ចការ...' : 'Search tasks / SOP...'}
              className="w-full pl-8.5 pr-8 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* View Mode Toggle: Catalog vs List */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80 shrink-0">
            <button
              type="button"
              onClick={() => setViewLayout('catalog')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewLayout === 'catalog'
                  ? 'bg-white text-emerald-950 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Catalog View (Cards Grid)"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-emerald-700" />
              <span>{language === 'km' ? 'កាតាឡុក' : 'Catalog'}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewLayout('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewLayout === 'list'
                  ? 'bg-white text-emerald-950 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              title="List View (Data Table / Rows)"
            >
              <List className="w-3.5 h-3.5 text-emerald-700" />
              <span>{language === 'km' ? 'បញ្ជី' : 'List'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. SUB-SECTION CONTENT                                              */}
      {/* ------------------------------------------------------------------ */}
      {activeSection === 'calendar_tasks' ? (
        /* ================================================================ */
        /* VIEW 1: FARM CALENDAR TASKS (CATALOG & LIST VIEWS)               */
        /* ================================================================ */
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl shadow-xs border border-slate-200/80">
            {/* Status Tabs */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl text-xs sm:text-sm font-semibold overflow-x-auto">
              {(['all', 'today', 'pending', 'completed'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveFilter(tab)}
                  className={`px-3.5 py-1.5 rounded-lg capitalize whitespace-nowrap transition-all cursor-pointer ${
                    activeFilter === tab ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab === 'today' ? `${t('today')} (${currentSimulatedDate || 'Today'})` : t(tab as any)}
                </button>
              ))}
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 font-medium cursor-pointer"
              >
                <option value="all">
                  {language === 'km' ? 'គ្រប់ប្រភេទសកម្មភាព (All Activities)' : 'All Activities'}
                </option>
                {taskTypes.map((tt) => (
                  <option key={tt.key} value={tt.key}>
                    {language === 'km' ? `${tt.nameKm} (${tt.nameEn})` : `${tt.nameEn} (${tt.nameKm})`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tasks Display */}
          {displayedTasks.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <CheckSquare className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-700">No Farm Tasks Match Filter</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                No scheduled activities found for this selection. Click "+ Add Task" to schedule one, or auto-generate from Task Preset Settings.
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  onClick={() => setIsPresetSettingsOpen(true)}
                  className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold rounded-xl cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5 inline mr-1" />
                  Auto-Generate from Presets
                </button>
                <button
                  onClick={() => onOpenTaskModal()}
                  className="px-3.5 py-2 bg-[#164e22] hover:bg-[#123e1b] text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 inline mr-1" />
                  {t('addTask')}
                </button>
              </div>
            </div>
          ) : viewLayout === 'catalog' ? (
            /* --- CALENDAR TASKS CATALOG VIEW (CARDS GRID) --- */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedTasks.map((task) => {
                const plot = plots.find((p) => p.id === task.plotId);
                const isCompleted = task.status === 'completed';
                const customType = taskTypes.find((tt) => tt.key === task.type);
                const typeLabelEn = customType?.nameEn || TASK_TYPE_METADATA[task.type]?.labelEn || task.type;
                const typeLabelKm = customType?.nameKm || TASK_TYPE_METADATA[task.type]?.labelKm || task.type;
                const typeBadgeBg = customType?.badgeBg || TASK_TYPE_METADATA[task.type]?.badgeBg || 'bg-slate-100 text-slate-800';
                const typeBorderColor = customType?.borderColor || TASK_TYPE_METADATA[task.type]?.borderColor || 'border-slate-300';
                const typeIcon = customType 
                  ? getTaskTypeIcon(customType.iconName, 'w-4 h-4') 
                  : (TASK_TYPE_ICONS[task.type] || <Droplets className="w-4 h-4" />);
                const stageMeta = getStageConfig(task.stageKey, growthStages);

                return (
                  <div
                    key={task.id}
                    onClick={() => onOpenTaskModal(task)}
                    className={`bg-white rounded-2xl border transition-all cursor-pointer p-5 flex flex-col justify-between hover:shadow-md relative overflow-hidden ${
                      isCompleted
                        ? 'border-slate-200/60 bg-slate-50/50 opacity-75'
                        : 'border-slate-200 hover:border-emerald-400 shadow-2xs'
                    }`}
                  >
                    {/* Top status bar */}
                    {stageMeta && (
                      <div className={`absolute top-0 left-0 right-0 h-1.5 ${stageMeta.accentBar}`} />
                    )}

                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold ${typeBadgeBg} border ${typeBorderColor}`}>
                          {typeIcon}
                          <span>{language === 'km' ? typeLabelKm : typeLabelEn}</span>
                        </span>

                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${
                          task.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : task.status === 'in_progress'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                        }`}>
                          {task.status}
                        </span>
                      </div>

                      {/* Title & Checkbox */}
                      <div className="flex items-start gap-3 mb-3.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateTaskStatus(task.id, isCompleted ? 'pending' : 'completed');
                          }}
                          className={`mt-0.5 w-6 h-6 rounded-lg border flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
                            isCompleted ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 hover:border-emerald-600 bg-white'
                          }`}
                        >
                          {isCompleted && <Check className="w-4 h-4" />}
                        </button>

                        <div className="flex-1">
                          <h4 className={`text-base sm:text-lg font-bold leading-snug line-clamp-2 ${isCompleted ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                            {task.titleEn}
                          </h4>
                          <p className="text-sm font-khmer text-emerald-800 font-semibold mt-0.5 line-clamp-1">
                            {task.titleKm}
                          </p>
                        </div>
                      </div>

                      {/* Dosage pill */}
                      {task.dosageOrVolume && (
                        <div className="mb-3.5 text-xs sm:text-sm text-emerald-900 bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200/70 flex items-center gap-2">
                          <Scale className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="font-semibold truncate">{task.dosageOrVolume}</span>
                        </div>
                      )}
                    </div>

                    {/* Footer Info */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 gap-2">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="flex items-center gap-1 font-mono font-medium">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {task.date} · {task.time || '07:00'}
                        </span>
                        <span className="flex items-center gap-1 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {plot?.name || 'Field'}
                        </span>
                      </div>

                      <span className="text-xs sm:text-sm text-emerald-700 font-bold hover:underline shrink-0">
                        Edit →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* --- CALENDAR TASKS LIST VIEW (ROWS) --- */
            <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/80 space-y-3">
              {displayedTasks.map((task) => {
                const plot = plots.find((p) => p.id === task.plotId);
                const isCompleted = task.status === 'completed';
                const customType = taskTypes.find((tt) => tt.key === task.type);
                const typeLabelEn = customType?.nameEn || TASK_TYPE_METADATA[task.type]?.labelEn || task.type;
                const typeLabelKm = customType?.nameKm || TASK_TYPE_METADATA[task.type]?.labelKm || task.type;
                const typeBadgeBg = customType?.badgeBg || TASK_TYPE_METADATA[task.type]?.badgeBg || 'bg-slate-100 text-slate-800';
                const typeBorderColor = customType?.borderColor || TASK_TYPE_METADATA[task.type]?.borderColor || 'border-slate-300';
                const typeIcon = customType 
                  ? getTaskTypeIcon(customType.iconName, 'w-3.5 h-3.5') 
                  : (TASK_TYPE_ICONS[task.type] || <Droplets className="w-3.5 h-3.5" />);

                return (
                  <div
                    key={task.id}
                    onClick={() => onOpenTaskModal(task)}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      isCompleted 
                        ? 'bg-slate-50/50 border-slate-200/60 opacity-75' 
                        : 'bg-white border-slate-200 hover:border-emerald-300 shadow-2xs hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-start gap-3.5 flex-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateTaskStatus(task.id, isCompleted ? 'pending' : 'completed');
                        }}
                        className={`mt-1 w-6 h-6 rounded-lg border flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
                          isCompleted ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 hover:border-emerald-600 bg-white'
                        }`}
                      >
                        {isCompleted && <Check className="w-4 h-4" />}
                      </button>

                      <div className="flex-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold ${typeBadgeBg} border ${typeBorderColor}`}>
                            {typeIcon}
                            <span>{language === 'km' ? typeLabelKm : typeLabelEn}</span>
                          </span>

                          <h4 className={`text-sm sm:text-base font-bold ${isCompleted ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                            {task.titleEn}
                          </h4>

                          {task.titleKm && (
                            <span className="text-xs sm:text-sm font-khmer text-emerald-800 font-semibold">
                              ({task.titleKm})
                            </span>
                          )}

                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full capitalize ${
                            task.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : task.status === 'in_progress'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                          }`}>
                            {task.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-3.5 mt-2 text-xs sm:text-sm text-slate-500 flex-wrap">
                          <span className="flex items-center gap-1 font-mono font-medium">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {task.date} · {task.time || '07:00'}
                          </span>
                          <span className="flex items-center gap-1 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {plot?.name || 'Field'}
                          </span>
                          {task.assignedWorker && (
                            <span className="flex items-center gap-1 font-medium">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              {task.assignedWorker}
                            </span>
                          )}
                          {task.dosageOrVolume && (
                            <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/50">
                              {task.dosageOrVolume}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                      <span className="text-xs sm:text-sm text-slate-400 hover:text-emerald-700 font-bold">
                        Edit Details →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : activeSection === 'agronomic_presets' ? (
        /* ================================================================ */
        /* VIEW 2: 6 KEY AGRONOMIC TASK PRESETS (CATALOG & LIST VIEWS)      */
        /* ================================================================ */
        <div className="space-y-4">
          {/* Presets Sub-Header with Quick Actions */}
          <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Auto-Generate 6 Key Melon Agronomic Tasks
                </h3>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                  {enabledPresetsCount} Active
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === 'km'
                  ? 'គំរូកិច្ចការទាំង ៦ នេះនឹងត្រូវបង្កើតដោយស្វ័យប្រវត្តិចូលប្រតិទិនចំការសម្រាប់ដំណាំនីមួយៗ ផ្អែកតាមដំណាក់កាលលូតលាស់'
                  : 'These 6 standard agronomic tasks automatically populate the Farm Calendar based on each Growth Stage duration'}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setIsPresetSettingsOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Open Full Preset Manager</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (window.confirm(language === 'km' 
                    ? 'កំណត់ឡើងវិញទៅ ៦ កិច្ចការដើមមែនទេ?' 
                    : 'Restore 6 factory melon tasks?')) {
                    resetTaskPresets();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Presets Display */}
          {viewLayout === 'catalog' ? (
            /* --- PRESETS CATALOG (CARDS GRID) --- */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedPresets.map((preset, idx) => {
                const stageMeta = getStageConfig(preset.stageKey, growthStages);
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
                    <div className={`h-1.5 w-full ${stageMeta.accentBar}`} />

                    <div className="p-4 sm:p-5 flex-1 flex flex-col">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${stageMeta.badgeBg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${stageMeta.dotBg}`} />
                          {language === 'km' ? stageMeta.nameKm : stageMeta.nameEn}
                        </span>

                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={preset.enabled}
                            onChange={() => updateTaskPreset({ ...preset, enabled: !preset.enabled })}
                            className="sr-only peer"
                          />
                          <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-emerald-600"></div>
                        </label>
                      </div>

                      <div className="mb-2.5">
                        <h4 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                          {preset.titleEn}
                        </h4>
                        <p className="text-xs font-khmer text-emerald-800 font-medium mt-0.5 line-clamp-1">
                          {preset.titleKm}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 mb-2.5 text-[11px]">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg font-bold ${typeMeta.badgeBg} border ${typeMeta.borderColor}`}>
                          {typeIcon}
                          <span>{language === 'km' ? typeMeta.labelKm : typeMeta.labelEn}</span>
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg font-semibold bg-slate-100 text-slate-700">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{preset.time}</span>
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg font-semibold bg-slate-100 text-slate-700 font-mono">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>Day {preset.dayOffset}</span>
                        </span>
                      </div>

                      {preset.dosageOrVolume && (
                        <div className="mb-2 text-xs text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-200/60 flex items-center gap-2">
                          <Scale className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="font-semibold truncate">{preset.dosageOrVolume}</span>
                        </div>
                      )}

                      <div className="text-[11px] text-slate-500 line-clamp-2 bg-slate-50/50 p-2 rounded-xl mb-3 flex-1">
                        {language === 'km' ? preset.notesKm || preset.notesEn : preset.notesEn || preset.notesKm}
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50/90 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-400 font-bold">
                        Stage: {preset.stageKey}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsPresetSettingsOpen(true)}
                        className="text-xs text-emerald-700 font-bold hover:underline cursor-pointer"
                      >
                        Configure →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* --- PRESETS LIST (TABLE) --- */
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/90 text-slate-600 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-3 w-12 text-center">#</th>
                      <th className="py-3 px-4">Growth Stage</th>
                      <th className="py-3 px-4">Task Name (EN / KM)</th>
                      <th className="py-3 px-3">Activity Type</th>
                      <th className="py-3 px-3">Schedule</th>
                      <th className="py-3 px-3">Dosage / Supplies</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedPresets.map((preset, idx) => {
                      const stageMeta = getStageConfig(preset.stageKey, growthStages);
                      const typeMeta = TASK_TYPE_METADATA[preset.type] || TASK_TYPE_METADATA.watering;
                      const typeIcon = TASK_TYPE_ICONS[preset.type] || <Droplets className="w-3.5 h-3.5" />;

                      return (
                        <tr key={preset.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3 text-center font-mono font-bold text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${stageMeta.badgeBg}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${stageMeta.dotBg}`} />
                              <span>{language === 'km' ? stageMeta.nameKm : stageMeta.nameEn}</span>
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{preset.titleEn}</div>
                            <div className="text-[11px] font-khmer text-emerald-800 font-medium">{preset.titleKm}</div>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold ${typeMeta.badgeBg} border ${typeMeta.borderColor}`}>
                              {typeIcon}
                              <span>{language === 'km' ? typeMeta.labelKm : typeMeta.labelEn}</span>
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-800 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{preset.time}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              Day {preset.dayOffset}
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            {preset.dosageOrVolume ? (
                              <span className="font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                                {preset.dosageOrVolume}
                              </span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={preset.enabled}
                                onChange={() => updateTaskPreset({ ...preset, enabled: !preset.enabled })}
                                className="sr-only peer"
                              />
                              <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-emerald-600"></div>
                            </label>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => setIsPresetSettingsOpen(true)}
                              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer"
                            >
                              Edit Details →
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ================================================================ */
        /* VIEW 3: TASK TYPES MANAGER (ADD / EDIT / DELETE TASK TYPES)      */
        /* ================================================================ */
        <TaskTypesManager />
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 4. TASK PRESET SETTINGS MODAL                                       */}
      {/* ------------------------------------------------------------------ */}
      <TaskPresetSettingsModal
        isOpen={isPresetSettingsOpen}
        onClose={() => setIsPresetSettingsOpen(false)}
        onOpenTaskModal={onOpenTaskModal}
      />
    </div>
  );
};
