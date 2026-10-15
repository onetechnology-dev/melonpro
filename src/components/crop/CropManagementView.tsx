import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Sprout, 
  Calendar, 
  Plus, 
  Search, 
  Filter, 
  Layers, 
  Clock, 
  Users, 
  CheckCircle2, 
  ChevronRight, 
  ArrowRight,
  Sparkles,
  Info,
  Edit3,
  Trash2,
  MapPin,
  Scale,
  Percent,
  Thermometer,
  Droplets,
  CalendarDays,
  LayoutGrid,
  Table as TableIcon,
  AlertTriangle,
  X,
  Wheat,
  Activity,
  Check,
  Tag,
  Palette,
  Hash,
  Sliders,
  RotateCcw,
  BookOpen
} from 'lucide-react';
import { useI18n } from '../../locales/i18nContext';
import { useFarm } from '../../context/FarmContext';
import { GrowthStageKey, Plot, CropCycle } from '../../types/melon';
import { CropVarietyPreset, VarietyCategory, VarietyStageConfig } from '../../data/cropVarieties';
import { AddNewCropModal } from '../common/AddNewCropModal';
import { StageManagementView } from './StageManagementView';
import { StageSettingsModal } from './StageSettingsModal';
import { 
  GrowthStagePreset, 
  STAGE_COLOR_THEMES, 
  getStageColorTheme 
} from '../../data/customStagePresets';

// Helper to resolve dynamic category metadata & colors
export const getCategoryMeta = (catId: string, categories: VarietyCategory[]) => {
  const found = categories.find(
    (c) => c.id === catId || c.code.toLowerCase() === catId?.toLowerCase()
  );
  if (found) {
    return {
      nameEn: found.nameEn,
      nameKm: found.nameKm,
      code: found.code,
      color: found.color,
      category: found
    };
  }
  return {
    nameEn: (catId || 'Specialty').replace(/_/g, ' '),
    nameKm: catId || '',
    code: (catId || 'SPECIALTY').toUpperCase(),
    color: '#0284C7',
    category: null
  };
};

export const CropManagementView: React.FC = () => {
  const { language } = useI18n();
  const { 
    plots, 
    cropCycles, 
    cropVarieties, 
    varietyCategories,
    growthStages,
    addGrowthStage,
    updateGrowthStage,
    deleteGrowthStage,
    resetGrowthStages,
    addVarietyCategory,
    updateVarietyCategory,
    deleteVarietyCategory,
    updateCropCycle,
    deleteCropCycle,
    deleteAllCropCycles,
    emptyPlotCrop,
    addCropVariety, 
    updateCropVariety, 
    deleteCropVariety, 
    setActiveTab, 
    setSelectedPlotId,
    selectedCycleId,
    setSelectedCycleId 
  } = useFarm();

  // Active Tab: 'plantings' (crop batches) vs 'varieties' (master catalog) vs 'stages' (stage settings) vs 'categories' (variety categories)
  const [activeSubTab, setActiveSubTab] = useState<'plantings' | 'varieties' | 'stages' | 'categories'>('plantings');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'planned' | 'completed'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [stageViewMode, setStageViewMode] = useState<'catalog' | 'list'>('list');

  // Modal States
  const [showAddCropModal, setShowAddCropModal] = useState(false);
  const [editingCropCycle, setEditingCropCycle] = useState<CropCycle | null>(null);
  const [presetForNewCrop, setPresetForNewCrop] = useState<CropVarietyPreset | null>(null);
  const [targetPlotForNewPlanting, setTargetPlotForNewPlanting] = useState<string | undefined>(undefined);

  // Variety Modal State
  const [showVarietyModal, setShowVarietyModal] = useState(false);
  const [editingVariety, setEditingVariety] = useState<CropVarietyPreset | null>(null);

  // Category Modal State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<VarietyCategory | null>(null);

  // Stage Settings Modal State
  const [showStageSettingsModal, setShowStageSettingsModal] = useState(false);
  const [editingStage, setEditingStage] = useState<GrowthStagePreset | null>(null);
  const [stageModalMode, setStageModalMode] = useState<'list' | 'add' | 'edit'>('list');
  const [stageViewSection, setStageViewSection] = useState<'presets' | 'cycles'>('presets');
  const [stageCategoryFilter, setStageCategoryFilter] = useState<'all' | 'botanical' | 'custom'>('all');
  const [stageSearchQuery, setStageSearchQuery] = useState('');

  // Delete Confirmation Modal State
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'crop' | 'variety' | 'category' | 'stage' | 'all_crops';
    id: string;
    name: string;
    count?: number;
  } | null>(null);

  // Toast notification
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  // Empty Plots calculation (plots that currently have no active crop cycle)
  const emptyPlots = useMemo(() => {
    return plots.filter((plot) => {
      const hasActive = cropCycles.some((c) => c.plotId === plot.id && c.status === 'active');
      return !hasActive;
    });
  }, [plots, cropCycles]);

  // KPI Calculations
  const stats = useMemo(() => {
    const totalCycles = cropCycles.length;
    const activeCycles = cropCycles.filter((c) => c.status === 'active').length;
    const plannedCycles = cropCycles.filter((c) => c.status === 'planned').length;
    const completedCycles = cropCycles.filter((c) => c.status === 'completed').length;
    const emptyPlotsCount = emptyPlots.length;
    const totalVarieties = cropVarieties.length;
    const totalCategories = varietyCategories.length;
    const totalTargetYield = cropCycles.reduce((sum, c) => sum + (c.targetYieldTons || 0), 0);
    const avgMaturityDays = cropVarieties.length > 0 
      ? Math.round(cropVarieties.reduce((sum, v) => sum + v.daysToMaturity, 0) / cropVarieties.length) 
      : 75;

    return { 
      totalCycles, 
      activeCycles, 
      plannedCycles, 
      completedCycles, 
      emptyPlotsCount, 
      totalVarieties, 
      totalCategories, 
      totalTargetYield, 
      avgMaturityDays 
    };
  }, [cropCycles, cropVarieties, varietyCategories, emptyPlots]);

  // Filtered Crop Cycles
  const filteredCycles = useMemo(() => {
    return cropCycles.filter((cycle) => {
      const matchesSearch = 
        cycle.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cycle.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cycle.variety.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cycle.assignedAgronomist && cycle.assignedAgronomist.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || cycle.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [cropCycles, searchQuery, statusFilter]);

  // Filtered Empty Plots
  const filteredEmptyPlots = useMemo(() => {
    return emptyPlots.filter((p) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q);
    });
  }, [emptyPlots, searchQuery]);

  // Filtered Varieties
  const filteredVarieties = useMemo(() => {
    return cropVarieties.filter((variety) => {
      const matchesSearch = 
        variety.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        variety.nameKm.toLowerCase().includes(searchQuery.toLowerCase()) ||
        variety.descriptionEn.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = 
        categoryFilter === 'all' || 
        variety.category === categoryFilter ||
        variety.category.toLowerCase() === categoryFilter.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [cropVarieties, searchQuery, categoryFilter]);

  // Filtered Categories
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return varietyCategories;
    const q = searchQuery.toLowerCase();
    return varietyCategories.filter((cat) => {
      return (
        cat.nameEn.toLowerCase().includes(q) ||
        cat.nameKm.toLowerCase().includes(q) ||
        cat.code.toLowerCase().includes(q) ||
        (cat.descriptionEn && cat.descriptionEn.toLowerCase().includes(q)) ||
        (cat.descriptionKm && cat.descriptionKm.toLowerCase().includes(q))
      );
    });
  }, [varietyCategories, searchQuery]);

  // Filtered Growth Stages (for Stage Settings master view)
  const filteredGrowthStages = useMemo(() => {
    return growthStages.filter((stage) => {
      const q = stageSearchQuery.toLowerCase();
      const matchesSearch = 
        !stageSearchQuery.trim() ||
        stage.nameEn.toLowerCase().includes(q) ||
        stage.nameKm.toLowerCase().includes(q) ||
        stage.key.toLowerCase().includes(q) ||
        (stage.notesEn && stage.notesEn.toLowerCase().includes(q)) ||
        (stage.notesKm && stage.notesKm.toLowerCase().includes(q)) ||
        (stage.keyPracticesEn && stage.keyPracticesEn.some((p) => p.toLowerCase().includes(q))) ||
        (stage.keyPracticesKm && stage.keyPracticesKm.some((p) => p.toLowerCase().includes(q)));

      const matchesCategory = 
        stageCategoryFilter === 'all' ||
        (stageCategoryFilter === 'botanical' && (!stage.isCustom || stage.category === 'botanical')) ||
        (stageCategoryFilter === 'custom' && (stage.isCustom || stage.category === 'custom'));

      return matchesSearch && matchesCategory;
    });
  }, [growthStages, stageSearchQuery, stageCategoryFilter]);

  // Handle Delete Confirmation
  const handleConfirmDelete = () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === 'crop') {
      deleteCropCycle(deleteTarget.id);
      showNotification(
        language === 'km' 
          ? `បានលុបដំណាំ ${deleteTarget.name} ដោយជោគជ័យ!` 
          : `Crop batch "${deleteTarget.name}" deleted successfully!`
      );
    } else if (deleteTarget.type === 'variety') {
      deleteCropVariety(deleteTarget.id);
      showNotification(
        language === 'km' 
          ? `បានលុបពូជដំណាំ ${deleteTarget.name} ដោយជោគជ័យ!` 
          : `Crop variety "${deleteTarget.name}" deleted successfully!`
      );
    } else if (deleteTarget.type === 'category') {
      deleteVarietyCategory(deleteTarget.id);
      showNotification(
        language === 'km' 
          ? `បានលុបប្រភេទពូជ ${deleteTarget.name} ដោយជោគជ័យ!` 
          : `Variety category "${deleteTarget.name}" deleted successfully!`
      );
    } else if (deleteTarget.type === 'all_crops') {
      deleteAllCropCycles();
      showNotification(
        language === 'km' 
          ? 'បានលុបដំណាំទាំងអស់ដោយជោគជ័យ! រងទាំងអស់ឥឡូវនេះទំនេរ។' 
          : 'All crop plantings deleted. All plots are now empty and ready to plant!'
      );
    } else if (deleteTarget.type === 'stage') {
      deleteGrowthStage(deleteTarget.id);
      showNotification(
        language === 'km' 
          ? `បានលុបដំណាក់កាលលូតលាស់ ${deleteTarget.name} ដោយជោគជ័យ!` 
          : `Growth stage "${deleteTarget.name}" deleted successfully!`
      );
    }

    setDeleteTarget(null);
  };

  // Handle Plant Variety Shortcut
  const handlePlantVariety = (variety: CropVarietyPreset) => {
    setPresetForNewCrop(variety);
    setEditingCropCycle(null);
    setShowAddCropModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notificationMsg && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-900 text-white px-4 py-2.5 rounded-xl shadow-lg border border-emerald-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 mb-1">
            <Sprout className="w-4 h-4 text-emerald-600" />
            <span>Smart Cultivation & Agronomy Management</span>
          </div>
          <h1 className="text-xl lg:text-2xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
            <span>Crop Management</span>
            <span className="text-base font-normal text-slate-400 font-khmer">/ ការគ្រប់គ្រងដំណាំ</span>
          </h1>
          <p className="text-xs text-slate-500 font-khmer mt-0.5">
            {language === 'km' 
              ? 'គ្រប់គ្រងវដ្តដាំដុះជាក់ស្តែង តាមដានដំណាក់កាលលូតលាស់ និងកំណត់កាតាឡុកពូជត្រសក់ផ្អែម'
              : 'Add, edit, and manage active crop batches across greenhouses and maintain cultivar library'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => {
              setEditingCropCycle(null);
              setPresetForNewCrop(null);
              setShowAddCropModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#164e22] hover:bg-[#123e1b] text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'km' ? '+ ដាំដំណាំថ្មី' : 'Add New Planting'}</span>
          </button>

          {activeSubTab === 'plantings' && cropCycles.length > 0 && (
            <button
              onClick={() => {
                setDeleteTarget({
                  type: 'all_crops',
                  id: 'all',
                  name: language === 'km' ? 'ដំណាំទាំងអស់' : 'All Crop Plantings',
                  count: cropCycles.length,
                });
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold shadow-2xs hover:border-rose-300 transition-all cursor-pointer"
              title={language === 'km' ? 'លុបដំណាំទាំងអស់ដើម្បីទុកដី/រងឲ្យទំនេរ' : 'Delete all crop plantings to clear plots to empty'}
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>{language === 'km' ? 'លុបដំណាំទាំងអស់ (ទុកទំនេរ)' : 'Delete All Crops (Empty)'}</span>
            </button>
          )}

          <button
            onClick={() => {
              setEditingVariety(null);
              setShowVarietyModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold shadow-2xs hover:border-slate-300 transition-all cursor-pointer"
          >
            <Wheat className="w-4 h-4 text-emerald-700" />
            <span>{language === 'km' ? '+ បន្ថែមពូជថ្មី' : '+ Add Variety'}</span>
          </button>

          <button
            onClick={() => {
              setEditingCategory(null);
              setShowCategoryModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold shadow-2xs hover:border-slate-300 transition-all cursor-pointer"
          >
            <Tag className="w-4 h-4 text-amber-600" />
            <span>{language === 'km' ? '+ បន្ថែមប្រភេទ' : '+ Add Category'}</span>
          </button>

          <button
            onClick={() => {
              setEditingStage(null);
              setStageModalMode('list');
              setShowStageSettingsModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold shadow-2xs hover:border-slate-300 transition-all cursor-pointer"
          >
            <Sliders className="w-4 h-4 text-purple-600" />
            <span>{language === 'km' ? 'ការកំណត់ដំណាក់កាល' : 'Stage Settings'}</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            {language === 'km' ? 'វដ្តដំណាំសរុប' : 'Total Batches'}
          </span>
          <div className="text-xl font-black text-slate-900 mt-1 font-mono">
            {stats.totalCycles}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {stats.activeCycles} {language === 'km' ? 'កំពុងដាំ' : 'active'} · {stats.completedCycles} {language === 'km' ? 'បានប្រមូល' : 'done'}
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            {language === 'km' ? 'ដំណាំកំពុងដាំ' : 'Active Crops'}
          </span>
          <div className="text-xl font-black text-emerald-800 mt-1 font-mono flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            {stats.activeCycles}
          </div>
          <div className="text-[10px] text-emerald-600 mt-0.5">
            {language === 'km' ? 'ក្នុងរោងកញ្ចក់' : 'Across Greenhouses'}
          </div>
        </div>

        {/* Empty Plots Card */}
        <div 
          className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {language === 'km' ? 'រងទំនេរ (គ្មានដំណាំ)' : 'Empty Plots'}
            </span>
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
          </div>
          <div className="text-xl font-black text-amber-900 mt-1 font-mono">
            {stats.emptyPlotsCount} <span className="text-xs font-semibold text-slate-400">/ {plots.length}</span>
          </div>
          <div className="text-[10px] text-amber-700 font-semibold mt-0.5 truncate">
            {stats.emptyPlotsCount > 0 
              ? (language === 'km' ? 'រួចរាល់សម្រាប់ដាំ' : 'Ready to plant') 
              : (language === 'km' ? 'រងទាំងអស់កំពុងដាំ' : 'All plots planted')}
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            {language === 'km' ? 'ពូជដំណាំក្នុងស្តុក' : 'Master Varieties'}
          </span>
          <div className="text-xl font-black text-slate-900 mt-1 font-mono">
            {stats.totalVarieties}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {language === 'km' ? 'ពូជត្រសក់ផ្អែម' : 'Melon Cultivars'}
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            {language === 'km' ? 'ទិន្នផលរំពឹងទុក' : 'Target Yield'}
          </span>
          <div className="text-xl font-black text-slate-900 mt-1 font-mono">
            {stats.totalTargetYield} <span className="text-xs font-normal text-slate-500">Tons</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {language === 'km' ? 'ការប៉ាន់ស្មាន' : 'Projected volume'}
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            {language === 'km' ? 'វដ្តលូតលាស់មធ្យម' : 'Avg Maturity'}
          </span>
          <div className="text-xl font-black text-slate-900 mt-1 font-mono">
            {stats.avgMaturityDays} <span className="text-xs font-normal text-slate-500">Days</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {language === 'km' ? 'ពីសាបដល់ប្រមូលផល' : 'Seed to harvest'}
          </div>
        </div>
      </div>

      {/* Sub-Tabs: Batches vs Varieties */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('plantings')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'plantings'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Sprout className="w-3.5 h-3.5" />
            <span>{language === 'km' ? 'វដ្តដាំដុះដំណាំ' : 'Crop Plantings & Batches'}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              activeSubTab === 'plantings' ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {cropCycles.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('varieties')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'varieties'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Wheat className="w-3.5 h-3.5" />
            <span>{language === 'km' ? 'កាតាឡុកពូជដំណាំ' : 'Master Crop Varieties'}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              activeSubTab === 'varieties' ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {cropVarieties.length}
            </span>
          </button>

          {/* Stage Settings (Growth Stages Settings & Master Management) */}
          <button
            onClick={() => setActiveSubTab('stages')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'stages'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-purple-400" />
            <span>{language === 'km' ? 'ការកំណត់ដំណាក់កាល' : 'Stage Settings'}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              activeSubTab === 'stages' ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {growthStages.length}
            </span>
          </button>

          {/* New Feature: Categories for Variety (Button added right after Stage Management) */}
          <button
            onClick={() => setActiveSubTab('categories')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'categories'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Tag className="w-3.5 h-3.5 text-amber-500" />
            <span>{language === 'km' ? 'ប្រភេទពូជដំណាំ' : 'Categories'}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              activeSubTab === 'categories' ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {varietyCategories.length}
            </span>
          </button>
        </div>

        {/* Search & Filter Controls (for Plantings, Varieties, and Categories) */}
        {activeSubTab !== 'stages' && (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative min-w-[200px] flex-1 sm:flex-none">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  activeSubTab === 'plantings' 
                    ? (language === 'km' ? 'ស្វែងរកដំណាំ, វដ្ត...' : 'Search crops, batches...')
                    : activeSubTab === 'varieties'
                    ? (language === 'km' ? 'ស្វែងរកពូជដំណាំ...' : 'Search cultivars...')
                    : (language === 'km' ? 'ស្វែងរកប្រភេទពូជ...' : 'Search categories...')
                }
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {activeSubTab === 'plantings' ? (
              <>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-700 font-semibold"
                >
                  <option value="all">{language === 'km' ? 'គ្រប់ស្ថានភាព (All)' : 'All Status'}</option>
                  <option value="active">{language === 'km' ? '● កំពុងដាំ (Active)' : '● Active'}</option>
                  <option value="planned">{language === 'km' ? '○ គ្រោងដាំ (Planned)' : '○ Planned'}</option>
                  <option value="completed">{language === 'km' ? '✓ បានប្រមូលផល (Completed)' : '✓ Completed'}</option>
                </select>

                <div className="bg-slate-100 p-0.5 rounded-xl flex items-center">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-500'}`}
                    title="Grid view"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-1.5 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-500'}`}
                    title="Table view"
                  >
                    <TableIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            ) : activeSubTab === 'varieties' ? (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-700 font-semibold"
              >
                <option value="all">{language === 'km' ? 'គ្រប់ប្រភេទពូជ' : 'All Categories'}</option>
                {varietyCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nameEn} {language === 'km' && c.nameKm ? `(${c.nameKm})` : ''}
                  </option>
                ))}
              </select>
            ) : (
              <button
                onClick={() => {
                  setEditingCategory(null);
                  setShowCategoryModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#164e22] hover:bg-[#123e1b] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{language === 'km' ? 'បន្ថែមប្រភេទ' : 'Add Category'}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Quick Status Filter Pills for Plantings View */}
      {activeSubTab === 'plantings' && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold">
          <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider pl-1">
            {language === 'km' ? 'ចម្រោះរហ័ស:' : 'Filter:'}
          </span>
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white shadow-2xs font-bold'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>{language === 'km' ? 'ទាំងអស់' : 'All'}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${statusFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {stats.totalCycles}
            </span>
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'active'
                ? 'bg-emerald-700 text-white shadow-2xs font-bold'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>{language === 'km' ? 'កំពុងដាំ' : 'Active'}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${statusFilter === 'active' ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {stats.activeCycles}
            </span>
          </button>
          <button
            onClick={() => setStatusFilter('planned')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'planned'
                ? 'bg-blue-700 text-white shadow-2xs font-bold'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span>{language === 'km' ? 'គ្រោងដាំ' : 'Planned'}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${statusFilter === 'planned' ? 'bg-blue-800 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {stats.plannedCycles}
            </span>
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'completed'
                ? 'bg-slate-700 text-white shadow-2xs font-bold'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span>{language === 'km' ? 'បានប្រមូលផល' : 'Completed'}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${statusFilter === 'completed' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {stats.completedCycles}
            </span>
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW 1: CROP PLANTINGS & BATCHES (ADD / EDIT / DELETE)    */}
      {/* ========================================================= */}
      {activeSubTab === 'plantings' && (
        <div className="space-y-6">
          {/* Empty / Available Plots Showcase */}
          {statusFilter === 'all' && filteredEmptyPlots.length > 0 && (
            <div className="bg-amber-50/30 border border-amber-200/90 rounded-2xl p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                    <Sprout className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <span>{language === 'km' ? 'រងទំនេរមិនទាន់ដាំដំណាំ (Empty / Available Plots)' : 'Empty / Available Plots (Ready to Plant)'}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200/90 text-amber-900 font-mono">
                        {filteredEmptyPlots.length} {language === 'km' ? 'រងទំនេរ' : 'Vacant'}
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {language === 'km' 
                        ? 'រងទាំងនេះមិនទាន់មានដំណាំដាំដុះសកម្មនៅឡើយទេ។ ចុចប៊ូតុងខាងក្រោមដើម្បីចាប់ផ្តើមដាំដំណាំថ្មី។'
                        : 'These plots currently have no active crop planted. Click to launch a new planting batch.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filteredEmptyPlots.map((plot) => {
                  const totalM2 = plot.areaM2 || (plot.areaHa ? Math.round(plot.areaHa * 10000) : 3600);
                  return (
                    <div
                      key={plot.id}
                      className="p-4 rounded-xl bg-white border border-dashed border-amber-300 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-extrabold text-slate-900 text-sm">
                                {plot.name}
                              </h4>
                              <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                                {plot.code}
                              </span>
                            </div>
                            <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80">
                              {language === 'km' ? '∅ ទំនេរ / គ្មានដំណាំដាំដុះ' : '∅ Empty Plot · No Plant'}
                            </span>
                          </div>
                          <div className="w-8 h-8 rounded-xl bg-amber-100/60 text-amber-800 flex items-center justify-center shrink-0">
                            <Sprout className="w-4 h-4" />
                          </div>
                        </div>

                        <div className="text-xs text-slate-600 space-y-1 mb-3 pt-2 border-t border-slate-100">
                          <div className="flex justify-between">
                            <span className="text-slate-400">{language === 'km' ? 'ទំហំផ្ទៃដី' : 'Facility Area'}:</span>
                            <span className="font-mono font-bold text-slate-800">{totalM2.toLocaleString()} m² ({plot.areaHa} ha)</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">{language === 'km' ? 'ចំនួនដើមដាំ' : 'Plant Capacity'}:</span>
                            <span className="font-mono font-bold text-slate-800">{(plot.plantCount || 2800).toLocaleString()} {language === 'km' ? 'ដើម' : 'plants'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">{language === 'km' ? 'ប្រព័ន្ធ' : 'Facility Type'}:</span>
                            <span className="font-semibold text-slate-700">{plot.facilityType === 'open_field' ? 'Open Field' : 'Net House (Greenhouse)'}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setTargetPlotForNewPlanting(plot.id);
                          setEditingCropCycle(null);
                          setShowAddCropModal(true);
                        }}
                        className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{language === 'km' ? '+ ចាប់ផ្តើមដាំដំណាំលើរងនេះ' : '+ Plant Crop in this Plot'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {cropCycles.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-amber-300 p-8 space-y-3.5">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-2xs">
                <Sprout className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {language === 'km' ? 'រងដាំទាំងអស់ទំនេរ (គ្មានដំណាំដាំដុះ)' : 'All Plots are Empty (No Planted Crops)'}
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  {language === 'km' 
                    ? `រងដាំទាំងអស់ចំនួន ${plots.length} គឺទំនេរ និងរួចរាល់សម្រាប់ការដាំដុះវដ្តថ្មី។ ចុចប៊ូតុងខាងក្រោមដើម្បីចាប់ផ្តើមដាំដំណាំថ្មី។`
                    : `All ${plots.length} greenhouse plots are currently empty with no active crops. Click below or pick an available plot to start planting.`}
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingCropCycle(null);
                  setPresetForNewCrop(null);
                  setShowAddCropModal(true);
                }}
                className="px-5 py-2.5 bg-[#164e22] hover:bg-[#123e1b] text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{language === 'km' ? '+ ចាប់ផ្តើមដាំដំណាំថ្មី' : '+ Add New Planting'}</span>
              </button>
            </div>
          ) : filteredCycles.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300 p-8">
              <Sprout className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-700">
                {language === 'km' ? 'រកមិនឃើញដំណាំដែលស្វែងរកទេ' : 'No crop batches found'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {language === 'km' 
                  ? 'សូមព្យាយាមស្វែងរកពាក្យផ្សេង ឬចុចប៊ូតុងខាងក្រោមដើម្បីបង្កើតដំណាំថ្មី'
                  : 'Try adjusting your search criteria or add a new crop batch to get started.'}
              </p>
              <button
                onClick={() => {
                  setEditingCropCycle(null);
                  setShowAddCropModal(true);
                }}
                className="mt-4 px-4 py-2 bg-[#164e22] text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{language === 'km' ? 'បន្ថែមដំណាំថ្មី' : 'Add New Planting'}</span>
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            /* Grid View of Crops */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {filteredCycles.map((cycle) => {
                const associatedPlot = plots.find((p) => p.id === cycle.plotId);
                const currentStage = cycle.stages.find((s) => s.status === 'current') || cycle.stages[0];
                const completedStagesCount = cycle.stages.filter((s) => s.status === 'completed').length;
                const progressPercent = Math.round((completedStagesCount / cycle.stages.length) * 100);

                return (
                  <div
                    key={cycle.id}
                    className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      {/* Card Header: Batch Name, Status Badge & Actions */}
                      <div className="p-4 border-b border-slate-100 flex items-start justify-between gap-3 bg-slate-50/50">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-100/70 border border-emerald-200 flex items-center justify-center shrink-0 text-emerald-800">
                            <Sprout className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-extrabold text-slate-900 text-sm leading-tight">
                                {cycle.name}
                              </h3>
                              <span className="font-mono text-[10px] bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded font-bold">
                                {cycle.batchNumber}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-slate-600">
                              <span className="font-semibold text-emerald-800">
                                {cycle.variety}
                              </span>
                              <span>·</span>
                              <span className="flex items-center gap-1 text-slate-500">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                {associatedPlot ? associatedPlot.name : 'Unassigned Plot'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Status Badge & Action Menu */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <select
                            value={cycle.status}
                            onChange={(e) => {
                              const newStatus = e.target.value as 'active' | 'planned' | 'completed';
                              updateCropCycle({ ...cycle, status: newStatus });
                              showNotification(
                                language === 'km'
                                  ? `បានផ្លាស់ប្តូរស្ថានភាពទៅជា ${
                                      newStatus === 'active' 
                                        ? 'សកម្ម' 
                                        : newStatus === 'completed' 
                                        ? 'បានប្រមូលផល' 
                                        : 'គ្រោងទុក'
                                    }`
                                  : `Batch status updated to ${newStatus}`
                              );
                            }}
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border cursor-pointer outline-none transition-colors ${
                              cycle.status === 'active'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                : cycle.status === 'planned'
                                ? 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
                                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            <option value="active">● Active</option>
                            <option value="planned">○ Planned</option>
                            <option value="completed">✓ Completed</option>
                          </select>

                          {/* Quick Edit Button */}
                          <button
                            onClick={() => {
                              setEditingCropCycle(cycle);
                              setShowAddCropModal(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit crop details"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick Delete / Empty Plot Button */}
                          <button
                            onClick={() => {
                              setDeleteTarget({
                                type: 'crop',
                                id: cycle.id,
                                name: cycle.name,
                              });
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title={language === 'km' ? 'លុបដំណាំចេញ (ទុកដី/រងឲ្យទំនេរ)' : 'Delete crop to empty plot'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-4 space-y-3.5">
                        {/* Current Phenological Stage Indicator */}
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="text-slate-500 font-medium">
                              {language === 'km' ? 'ដំណាក់កាលបច្ចុប្បន្ន' : 'Current Stage'}:
                            </span>
                            <span className="font-bold text-slate-900 flex items-center gap-1">
                              <span>{language === 'km' ? currentStage?.nameKm : currentStage?.nameEn}</span>
                              <span className="text-[10px] text-slate-400 font-mono">({progressPercent}%)</span>
                            </span>
                          </div>

                          {/* 7-Step Stage Dots & Progress Bar */}
                          <div className="relative pt-1">
                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-emerald-600 to-teal-500 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${Math.max(8, progressPercent)}%` }}
                              ></div>
                            </div>

                            {/* Stage Step Indicators */}
                            <div className="flex justify-between items-center mt-2 px-1">
                              {cycle.stages.map((stg, sIdx) => (
                                <div key={stg.id || sIdx} className="flex flex-col items-center">
                                  <div
                                    className={`w-2.5 h-2.5 rounded-full border-2 ${
                                      stg.status === 'completed'
                                        ? 'bg-emerald-600 border-emerald-600'
                                        : stg.status === 'current'
                                        ? 'bg-amber-400 border-emerald-600 ring-2 ring-emerald-200'
                                        : 'bg-white border-slate-300'
                                    }`}
                                    title={`${stg.nameEn} (${stg.targetDays}d)`}
                                  ></div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Dates & Metrics Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-[11px] font-mono">
                          <div className="bg-slate-50 p-2 rounded-xl">
                            <span className="text-[10px] text-slate-400 uppercase block font-sans font-semibold">
                              Sowing Date
                            </span>
                            <span className="font-bold text-slate-800">{cycle.sowingDate}</span>
                          </div>

                          <div className="bg-slate-50 p-2 rounded-xl">
                            <span className="text-[10px] text-slate-400 uppercase block font-sans font-semibold">
                              Transplant
                            </span>
                            <span className="font-bold text-slate-800">{cycle.transplantDate}</span>
                          </div>

                          <div className="bg-slate-50 p-2 rounded-xl">
                            <span className="text-[10px] text-slate-400 uppercase block font-sans font-semibold">
                              Harvest Window
                            </span>
                            <span className="font-bold text-emerald-800">{cycle.harvestWindowStart}</span>
                          </div>

                          <div className="bg-slate-50 p-2 rounded-xl">
                            <span className="text-[10px] text-slate-400 uppercase block font-sans font-semibold">
                              {language === 'km' ? 'ទិន្នផល' : 'Target Yield'}
                            </span>
                            <span className="font-bold text-slate-900 font-mono">
                              {cycle.targetYieldKg
                                ? `${cycle.targetYieldKg.toLocaleString()} kg`
                                : cycle.targetYieldTons
                                ? `${(cycle.targetYieldTons * 1000).toLocaleString()} kg`
                                : '5,040 kg'}
                            </span>
                          </div>
                        </div>

                        {/* Agronomist & Plot Specs */}
                        {cycle.assignedAgronomist && (
                          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                            <span className="flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-slate-400" />
                              <span>{cycle.assignedAgronomist}</span>
                            </span>
                            {associatedPlot && (
                              <span className="text-[11px] font-mono font-medium text-slate-400">
                                {associatedPlot.facilityType} · {associatedPlot.areaHa} ha
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Footer: Quick Actions */}
                    <div className="p-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedCycleId(cycle.id);
                            if (cycle.plotId) setSelectedPlotId(cycle.plotId);
                            setActiveTab('calendar');
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <CalendarDays className="w-3 h-3 text-emerald-700" />
                          <span>Calendar</span>
                        </button>

                        <button
                          onClick={() => {
                            if (cycle.plotId) setSelectedPlotId(cycle.plotId);
                            setActiveTab('field');
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <MapPin className="w-3 h-3 text-blue-600" />
                          <span>Field Map</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingCropCycle(cycle);
                            setShowAddCropModal(true);
                          }}
                          className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>{language === 'km' ? 'កែប្រែ' : 'Edit Crop'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table View of Crops */
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-900 text-white text-[10px] uppercase font-bold tracking-wider">
                      <th className="py-2.5 px-3">Batch Code</th>
                      <th className="py-2.5 px-3">Crop / Batch Name</th>
                      <th className="py-2.5 px-3">Cultivar Variety</th>
                      <th className="py-2.5 px-3">Plot Location</th>
                      <th className="py-2.5 px-3">Current Stage</th>
                      <th className="py-2.5 px-3">Sowing Date</th>
                      <th className="py-2.5 px-3">Harvest Est.</th>
                      <th className="py-2.5 px-3 text-right">{language === 'km' ? 'ទិន្នផល (Kg)' : 'Target Yield (Kg)'}</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150">
                    {filteredCycles.map((cycle, idx) => {
                      const associatedPlot = plots.find((p) => p.id === cycle.plotId);
                      const currentStage = cycle.stages.find((s) => s.status === 'current') || cycle.stages[0];

                      return (
                        <tr 
                          key={cycle.id} 
                          className={`hover:bg-slate-50/80 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}
                        >
                          <td className="py-2 px-3 font-mono font-bold text-slate-500">
                            {cycle.batchNumber}
                          </td>
                          <td className="py-2 px-3 font-extrabold text-slate-900">
                            {cycle.name}
                          </td>
                          <td className="py-2 px-3 font-semibold text-emerald-800">
                            {cycle.variety}
                          </td>
                          <td className="py-2 px-3 text-slate-600">
                            {associatedPlot ? associatedPlot.name : '-'}
                          </td>
                          <td className="py-2 px-3 font-medium text-slate-800">
                            {language === 'km' ? currentStage?.nameKm : currentStage?.nameEn}
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-600">
                            {cycle.sowingDate}
                          </td>
                          <td className="py-2 px-3 font-mono font-semibold text-emerald-800">
                            {cycle.harvestWindowStart}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">
                            {cycle.targetYieldKg
                              ? `${cycle.targetYieldKg.toLocaleString()} kg`
                              : cycle.targetYieldTons
                              ? `${(cycle.targetYieldTons * 1000).toLocaleString()} kg`
                              : '5,040 kg'}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <select
                              value={cycle.status}
                              onChange={(e) => {
                                const newStatus = e.target.value as 'active' | 'planned' | 'completed';
                                updateCropCycle({ ...cycle, status: newStatus });
                                showNotification(
                                  language === 'km'
                                    ? `បានផ្លាស់ប្តូរស្ថានភាពទៅជា ${
                                        newStatus === 'active' 
                                          ? 'សកម្ម' 
                                          : newStatus === 'completed' 
                                          ? 'បានប្រមូលផល' 
                                          : 'គ្រោងទុក'
                                      }`
                                    : `Batch status updated to ${newStatus}`
                                );
                              }}
                              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border cursor-pointer outline-none transition-colors ${
                                cycle.status === 'active'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                  : cycle.status === 'planned'
                                  ? 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
                                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                              }`}
                            >
                              <option value="active">Active</option>
                              <option value="planned">Planned</option>
                              <option value="completed">Completed</option>
                            </select>
                          </td>
                          <td className="py-2 px-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => {
                                  setEditingCropCycle(cycle);
                                  setShowAddCropModal(true);
                                }}
                                className="p-1 text-slate-500 hover:text-emerald-800 hover:bg-emerald-50 rounded transition-colors"
                                title="Edit crop"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setDeleteTarget({
                                    type: 'crop',
                                    id: cycle.id,
                                    name: cycle.name,
                                  });
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                title="Delete crop"
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
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW 2: MASTER CROP VARIETIES CATALOG (ADD / EDIT / DEL)  */}
      {/* ========================================================= */}
      {activeSubTab === 'varieties' && (
        <div>
          {filteredVarieties.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300 p-8">
              <Wheat className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-700">
                {language === 'km' ? 'រកមិនឃើញពូជដំណាំទេ' : 'No crop varieties found'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {language === 'km'
                  ? 'សូមចុចប៊ូតុងខាងក្រោមដើម្បីបង្កើតពូជដំណាំថ្មី'
                  : 'Add a new crop variety to populate your botanical catalog.'}
              </p>
              <button
                onClick={() => {
                  setEditingVariety(null);
                  setShowVarietyModal(true);
                }}
                className="mt-4 px-4 py-2 bg-[#164e22] text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{language === 'km' ? '+ បន្ថែមពូជថ្មី' : '+ Add New Variety'}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredVarieties.map((variety) => {
                const catMeta = getCategoryMeta(variety.category, varietyCategories);

                return (
                  <div
                    key={variety.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
                  >
                    <div>
                      {/* Variety Top Banner */}
                      <div className="p-4 border-b border-slate-100 flex items-start justify-between gap-3 bg-gradient-to-r from-slate-50 to-white">
                        <div className="flex items-start gap-3">
                          <div 
                            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-white shadow-xs"
                            style={{ backgroundColor: variety.color || catMeta.color || '#10b981' }}
                          >
                            <Wheat className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <span 
                              className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border inline-block"
                              style={{
                                backgroundColor: `${catMeta.color}18`,
                                color: catMeta.color,
                                borderColor: `${catMeta.color}40`,
                              }}
                            >
                              {language === 'km' && catMeta.nameKm ? catMeta.nameKm : catMeta.nameEn}
                            </span>
                            <h3 className="font-extrabold text-slate-900 text-sm mt-1 leading-snug">
                              {variety.nameEn}
                            </h3>
                            <div className="text-[11px] text-slate-500 font-khmer mt-0.5">
                              {variety.nameKm}
                            </div>
                          </div>
                        </div>

                        {/* Edit / Delete Variety Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => {
                              setEditingVariety(variety);
                              setShowVarietyModal(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit variety specs"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setDeleteTarget({
                                type: 'variety',
                                id: variety.id,
                                name: variety.nameEn,
                              });
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete variety"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Variety Specs Grid */}
                      <div className="p-4 space-y-3">
                        <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs">
                          <div className="bg-slate-50 p-2 rounded-xl">
                            <span className="text-[10px] text-slate-400 uppercase block font-sans font-semibold">
                              Maturity
                            </span>
                            <span className="font-black text-slate-900">{variety.daysToMaturity}d</span>
                          </div>

                          <div className="bg-amber-50/70 p-2 rounded-xl border border-amber-100">
                            <span className="text-[10px] text-amber-700 uppercase block font-sans font-semibold">
                              Target Brix
                            </span>
                            <span className="font-black text-amber-900">{variety.targetBrix}°Bx</span>
                          </div>

                          <div className="bg-emerald-50/70 p-2 rounded-xl border border-emerald-100">
                            <span className="text-[10px] text-emerald-700 uppercase block font-sans font-semibold">
                              Yield/Plant
                            </span>
                            <span className="font-black text-emerald-900">{variety.expectedYieldKgPerPlant} kg</span>
                          </div>
                        </div>

                        {/* Agronomic Conditions */}
                        <div className="grid grid-cols-3 gap-2 text-[10.5px] font-mono text-slate-600 pt-1">
                          <div className="flex items-center gap-1">
                            <Droplets className="w-3 h-3 text-blue-500" />
                            <span>EC: <strong>{variety.idealEc}</strong></span>
                          </div>
                          <div>
                            <span>pH: <strong>{variety.idealPh}</strong></span>
                          </div>
                          <div>
                            <span>Space: <strong>{variety.plantSpacingCm} cm</strong></span>
                          </div>
                        </div>

                        {/* Dynamic Stages Indicator */}
                        <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium pt-1 border-t border-slate-100">
                          <span className="flex items-center gap-1">
                            <Layers className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{variety.stages?.length || 7} {language === 'km' ? 'ដំណាក់កាលលូតលាស់' : 'Growth Stages'}</span>
                          </span>
                          {variety.stages?.some((s) => s.isCustom) && (
                            <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 flex items-center gap-0.5">
                              <Sparkles className="w-2.5 h-2.5" />
                              <span>{language === 'km' ? 'ពូជមានដំណាក់កាលពិសេស' : 'Specialty Custom Stages'}</span>
                            </span>
                          )}
                        </div>

                        {/* Botanical & Market Description */}
                        <p className="text-[11px] text-slate-600 leading-relaxed border-t border-slate-100 pt-2 line-clamp-2">
                          {language === 'km' && variety.descriptionKm ? variety.descriptionKm : variety.descriptionEn}
                        </p>
                      </div>
                    </div>

                    {/* Variety Footer: "Plant this Crop" Action */}
                    <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] font-medium text-slate-500">
                        {variety.nettingRequired ? '✓ Netting required' : 'Smooth rind'}
                      </span>
                      <button
                        onClick={() => handlePlantVariety(variety)}
                        className="px-3 py-1.5 bg-[#164e22] hover:bg-[#123e1b] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Sprout className="w-3.5 h-3.5" />
                        <span>{language === 'km' ? 'ដាំពូជនេះ' : 'Plant This'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW 3: STAGE SETTINGS (GROWTH STAGES MASTER & TIMELINES) */}
      {/* ========================================================= */}
      {activeSubTab === 'stages' && (
        <div className="space-y-5">
          {/* Section Sub-Navigation Bar */}
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 shadow-2xs">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <span>Stage Settings</span>
                  <span className="text-sm font-normal text-slate-400 font-khmer">/ ការកំណត់ដំណាក់កាលលូតលាស់</span>
                </h3>
                <p className="text-xs text-slate-500 font-khmer mt-0.5">
                  {language === 'km'
                    ? 'កំណត់ដំណាក់កាលស្តង់ដារ រយៈពេល គោលដៅ EC/pH ការស្រោចស្រព និងតាមដានវដ្តដំណាំ'
                    : 'Manage master botanical stages, durations, EC/pH targets, irrigation protocols, and batch tracking'}
                </p>
              </div>
            </div>

            {/* Sub-view Switcher & Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {stageViewSection === 'presets' && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingStage(null);
                    setStageModalMode('add');
                    setShowStageSettingsModal(true);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-[#164e22] hover:bg-[#123e1b] text-white rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{language === 'km' ? '+ បន្ថែមដំណាក់កាល' : 'Add Growth State'}</span>
                </button>
              )}

              <div className="flex items-center p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setStageViewSection('presets')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    stageViewSection === 'presets'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-purple-600" />
                  <span>{language === 'km' ? 'បញ្ជីដំណាក់កាល' : 'Growth States Master'}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 font-mono">
                    {growthStages.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setStageViewSection('cycles')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    stageViewSection === 'cycles'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{language === 'km' ? 'កាលវិភាគតាមវដ្តដាំដុះ' : 'Batch Timelines'}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 font-mono">
                    {cropCycles.length}
                  </span>
                </button>
              </div>

              {stageViewSection === 'presets' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingStage(null);
                      setStageModalMode('list');
                      setShowStageSettingsModal(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                    title={language === 'km' ? 'ផ្ទាំងកំណត់ពេញលេញ' : 'Configure Stages Modal'}
                  >
                    <Sliders className="w-3.5 h-3.5 text-slate-500" />
                    <span>{language === 'km' ? 'ផ្ទាំងកំណត់' : 'Configure'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(
                        language === 'km' 
                          ? 'តើអ្នកពិតជាចង់កំណត់ដំណាក់កាលលូតលាស់ទាំងអស់ឡើងវិញជាស្តង់ដារមែនទេ?' 
                          : 'Are you sure you want to reset all growth stages to default presets?'
                      )) {
                        resetGrowthStages();
                        showNotification(language === 'km' ? 'បានកំណត់ដំណាក់កាលឡើងវិញជាស្តង់ដារជោគជ័យ!' : 'Growth stages reset to defaults!');
                      }
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-2 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 border border-slate-200 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                    title={language === 'km' ? 'កំណត់ឡើងវិញជាស្តង់ដារ' : 'Reset to Default Stages'}
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Sub-view: PRESETS (Growth Stages Master) */}
          {stageViewSection === 'presets' ? (
            <div className="space-y-4">
              {/* KPI Bar for Growth Stages */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    {language === 'km' ? 'ដំណាក់កាលសរុប' : 'Total Stages'}
                  </span>
                  <div className="text-xl font-black text-slate-900 mt-1 font-mono flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-purple-600" />
                    {growthStages.length}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {language === 'km' ? 'ដំណាក់កាលក្នុងប្រព័ន្ធ' : 'Available growth stages'}
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    {language === 'km' ? 'ដំណាក់កាលស្តង់ដារ' : 'Botanical Standard'}
                  </span>
                  <div className="text-xl font-black text-emerald-800 mt-1 font-mono flex items-center gap-2">
                    <Sprout className="w-4 h-4 text-emerald-600" />
                    {growthStages.filter((s) => !s.isCustom || s.category === 'botanical').length}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {language === 'km' ? 'វដ្តលូតលាស់ស្នូល' : 'Core physiological phases'}
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    {language === 'km' ? 'ដំណាក់កាលពិសេស' : 'Specialty Stages'}
                  </span>
                  <div className="text-xl font-black text-purple-800 mt-1 font-mono flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    {growthStages.filter((s) => s.isCustom || s.category === 'custom').length}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {language === 'km' ? 'ដំណាក់កាលបច្ចេកទេស' : 'Tailored agronomy actions'}
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    {language === 'km' ? 'រយៈពេលវដ្តស្តង់ដារ' : 'Standard Duration'}
                  </span>
                  <div className="text-xl font-black text-slate-900 mt-1 font-mono flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-500" />
                    {growthStages
                      .filter((s) => !s.isCustom || s.category === 'botanical')
                      .reduce((sum, s) => sum + (s.defaultDays || 0), 0)}{' '}
                    <span className="text-xs font-normal text-slate-500">{language === 'km' ? 'ថ្ងៃ' : 'Days'}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {language === 'km' ? 'ពីកូនដំណាំដល់ប្រមូលផល' : 'Seedling to harvest phase'}
                  </div>
                </div>
              </div>

              {/* Filters & Search Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
                {/* Category Filter Chips */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setStageCategoryFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      stageCategoryFilter === 'all'
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    <span>{language === 'km' ? 'ទាំងអស់' : 'All Stages'}</span>
                    <span className="ml-1.5 text-[10px] opacity-75">({growthStages.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStageCategoryFilter('botanical')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      stageCategoryFilter === 'botanical'
                        ? 'bg-emerald-800 text-white shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    <span>{language === 'km' ? 'ដំណាក់កាលស្តង់ដារ' : 'Botanical Standard'}</span>
                    <span className="ml-1.5 text-[10px] opacity-75">
                      ({growthStages.filter((s) => !s.isCustom || s.category === 'botanical').length})
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStageCategoryFilter('custom')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      stageCategoryFilter === 'custom'
                        ? 'bg-purple-800 text-white shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    <span>{language === 'km' ? 'ដំណាក់កាលពិសេស' : 'Specialty Stages'}</span>
                    <span className="ml-1.5 text-[10px] opacity-75">
                      ({growthStages.filter((s) => s.isCustom || s.category === 'custom').length})
                    </span>
                  </button>
                </div>

                {/* Search Box & View Mode Toggle (Catalog vs List) */}
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <div className="relative min-w-[220px] w-full sm:w-auto">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={stageSearchQuery}
                      onChange={(e) => setStageSearchQuery(e.target.value)}
                      placeholder={
                        language === 'km'
                          ? 'ស្វែងរកដំណាក់កាល, EC/pH, ការស្រោចស្រព...'
                          : 'Search stage name, key, EC/pH, notes...'
                      }
                      className="w-full pl-8.5 pr-8 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                    />
                    {stageSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setStageSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* View Mode Toggle */}
                  <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80 shrink-0">
                    <button
                      type="button"
                      onClick={() => setStageViewMode('catalog')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        stageViewMode === 'catalog'
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                      title={language === 'km' ? 'ទិដ្ឋភាពកាតាឡុក (ក្រឡា)' : 'Catalog View'}
                    >
                      <LayoutGrid className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{language === 'km' ? 'កាតាឡុក' : 'Catalog'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStageViewMode('list')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        stageViewMode === 'list'
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                      title={language === 'km' ? 'ទិដ្ឋភាពបញ្ជី (តារាង)' : 'List View'}
                    >
                      <TableIcon className="w-3.5 h-3.5 text-purple-700" />
                      <span>{language === 'km' ? 'បញ្ជី' : 'List'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Stage Cards Grid or Table List View */}
              {filteredGrowthStages.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-2xs">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <Sliders className="w-7 h-7" />
                  </div>
                  <h4 className="text-base font-bold text-slate-800">
                    {language === 'km' ? 'រកមិនឃើញដំណាក់កាលលូតលាស់ទេ' : 'No growth stages found'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    {stageSearchQuery
                      ? (language === 'km' ? 'សូមសាកល្បងស្វែងរកពាក្យគន្លឹះផ្សេងទៀត' : 'Try adjusting your search criteria or filters.')
                      : (language === 'km' ? 'មិនទាន់មានដំណាក់កាលណាមួយនៅឡើយទេ' : 'No stages available under this filter.')}
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    {stageSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setStageSearchQuery('')}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        {language === 'km' ? 'សម្អាតការស្វែងរក' : 'Clear Search'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setEditingStage(null);
                        setStageModalMode('add');
                        setShowStageSettingsModal(true);
                      }}
                      className="px-4 py-2 bg-[#164e22] hover:bg-[#123e1b] text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{language === 'km' ? 'បន្ថែមដំណាក់កាលថ្មី' : 'Add Growth State'}</span>
                    </button>
                  </div>
                </div>
              ) : stageViewMode === 'catalog' ? (
                /* Catalog Grid View */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredGrowthStages.map((stage, idx) => {
                    const theme = getStageColorTheme(stage.color);
                    const isBotanical = !stage.isCustom || stage.category === 'botanical';

                    return (
                      <div
                        key={stage.id}
                        className="bg-white rounded-2xl border border-slate-200/90 hover:border-slate-300 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden relative group"
                      >
                        {/* Top Accent Strip */}
                        <div className={`h-1.5 w-full ${theme.accentBg}`} />

                        <div className="p-4 sm:p-5 space-y-3.5 flex-1">
                          {/* Card Header */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs ${theme.badgeBg} ${theme.badgeText}`}
                              >
                                {idx + 1}
                              </div>
                              <div>
                                <h4 className="text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-emerald-800 transition-colors">
                                  {stage.nameEn}
                                </h4>
                                <div className="text-xs font-khmer font-bold text-emerald-800">
                                  {stage.nameKm}
                                </div>
                              </div>
                            </div>

                            {/* Badge */}
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                                isBotanical
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-purple-50 text-purple-700 border-purple-200'
                              }`}
                            >
                              {isBotanical
                                ? (language === 'km' ? 'ស្តង់ដារ' : 'Botanical')
                                : (language === 'km' ? 'ពិសេស' : 'Specialty')}
                            </span>
                          </div>

                          {/* Key & Duration Pill */}
                          <div className="flex items-center justify-between text-xs pt-1">
                            <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md font-semibold">
                              #{stage.key.toUpperCase()}
                            </span>

                            <div className="flex items-center gap-1 font-mono font-bold text-slate-800 bg-amber-50/80 border border-amber-200/60 px-2 py-0.5 rounded-lg text-[11px]">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>
                                {stage.defaultDays} {language === 'km' ? 'ថ្ងៃ' : 'days'}
                              </span>
                            </div>
                          </div>

                          {/* Targets Box: EC, pH, Irrigation */}
                          <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-100 space-y-1.5 text-xs">
                            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-400 font-sans text-[10px]">EC:</span>
                                <span className="font-bold text-slate-800">{stage.ecTarget || '2.0 - 2.4 mS/cm'}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-400 font-sans text-[10px]">pH:</span>
                                <span className="font-bold text-slate-800">{stage.phTarget || '6.0 - 6.5'}</span>
                              </div>
                            </div>

                            {(stage.irrigationGuidelineKm || stage.irrigationGuidelineEn) && (
                              <div className="flex items-start gap-1.5 text-[10.5px] text-slate-600 pt-1 border-t border-slate-200/60">
                                <Droplets className="w-3 h-3 text-blue-500 shrink-0 mt-0.5" />
                                <span className="line-clamp-2">
                                  {language === 'km' && stage.irrigationGuidelineKm
                                    ? stage.irrigationGuidelineKm
                                    : stage.irrigationGuidelineEn}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Key Practices or Notes */}
                          {(stage.notesKm || stage.notesEn) && (
                            <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2 italic">
                              {language === 'km' && stage.notesKm ? stage.notesKm : stage.notesEn}
                            </p>
                          )}
                        </div>

                        {/* Card Footer Actions */}
                        <div className="px-4 py-2.5 bg-slate-50/90 border-t border-slate-100 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingStage(stage);
                              setStageModalMode('edit');
                              setShowStageSettingsModal(true);
                            }}
                            className="flex-1 py-1.5 px-3 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{language === 'km' ? 'កែប្រែ' : 'Edit Stage'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setDeleteTarget({
                                type: 'stage',
                                id: stage.id,
                                name: language === 'km' ? stage.nameKm : stage.nameEn,
                              });
                            }}
                            className="py-1.5 px-2.5 bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer shadow-2xs"
                            title={language === 'km' ? 'លុបដំណាក់កាលនេះ' : 'Delete stage'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* List View (Table) */
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-900 text-white text-[10px] uppercase font-bold tracking-wider">
                          <th className="py-3 px-3 text-center w-12">#</th>
                          <th className="py-3 px-4 min-w-[180px]">{language === 'km' ? 'ដំណាក់កាលលូតលាស់' : 'Growth Stage'}</th>
                          <th className="py-3 px-3 min-w-[90px]">{language === 'km' ? 'កូដ' : 'Key Code'}</th>
                          <th className="py-3 px-3 min-w-[110px]">{language === 'km' ? 'ប្រភេទ' : 'Category'}</th>
                          <th className="py-3 px-3 min-w-[95px]">{language === 'km' ? 'រយៈពេល' : 'Duration'}</th>
                          <th className="py-3 px-3 min-w-[140px]">EC & pH Targets</th>
                          <th className="py-3 px-4 min-w-[200px]">{language === 'km' ? 'ការស្រោចស្រព និងចំណាំ' : 'Irrigation & Guidelines'}</th>
                          <th className="py-3 px-3 text-right min-w-[110px]">{language === 'km' ? 'សកម្មភាព' : 'Actions'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredGrowthStages.map((stage, idx) => {
                          const theme = getStageColorTheme(stage.color);
                          const isBotanical = !stage.isCustom || stage.category === 'botanical';

                          return (
                            <tr
                              key={stage.id}
                              className={`hover:bg-slate-50/80 transition-colors group ${
                                idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                              }`}
                            >
                              {/* Order / Index */}
                              <td className="py-3 px-3 text-center">
                                <div
                                  className={`w-7 h-7 rounded-lg inline-flex items-center justify-center font-bold text-xs shadow-2xs ${theme.badgeBg} ${theme.badgeText}`}
                                >
                                  {idx + 1}
                                </div>
                              </td>

                              {/* Stage Name */}
                              <td className="py-3 px-4">
                                <div className="font-extrabold text-slate-900 group-hover:text-emerald-800 transition-colors">
                                  {stage.nameEn}
                                </div>
                                <div className="text-xs font-khmer font-bold text-emerald-800">
                                  {stage.nameKm}
                                </div>
                              </td>

                              {/* Key Code */}
                              <td className="py-3 px-3">
                                <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-semibold">
                                  #{stage.key.toUpperCase()}
                                </span>
                              </td>

                              {/* Category Badge */}
                              <td className="py-3 px-3">
                                <span
                                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border inline-block whitespace-nowrap ${
                                    isBotanical
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : 'bg-purple-50 text-purple-700 border-purple-200'
                                  }`}
                                >
                                  {isBotanical
                                    ? (language === 'km' ? 'ស្តង់ដារ' : 'Botanical')
                                    : (language === 'km' ? 'ពិសេស' : 'Specialty')}
                                </span>
                              </td>

                              {/* Duration Days */}
                              <td className="py-3 px-3">
                                <div className="inline-flex items-center gap-1 font-mono font-bold text-slate-800 bg-amber-50/80 border border-amber-200/60 px-2 py-0.5 rounded-lg text-[11px] whitespace-nowrap">
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  <span>
                                    {stage.defaultDays} {language === 'km' ? 'ថ្ងៃ' : 'days'}
                                  </span>
                                </div>
                              </td>

                              {/* EC & pH Targets */}
                              <td className="py-3 px-3 font-mono text-[11px]">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-slate-400 font-sans text-[10px]">EC:</span>
                                  <span className="font-bold text-slate-800">{stage.ecTarget || '2.0 - 2.4'}</span>
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-slate-400 font-sans text-[10px]">pH:</span>
                                  <span className="font-bold text-slate-800">{stage.phTarget || '6.0 - 6.5'}</span>
                                </div>
                              </td>

                              {/* Irrigation & Technical Notes */}
                              <td className="py-3 px-4 max-w-xs">
                                {(stage.irrigationGuidelineKm || stage.irrigationGuidelineEn) && (
                                  <div className="flex items-start gap-1 text-[11px] text-slate-700 line-clamp-1 mb-0.5">
                                    <Droplets className="w-3 h-3 text-blue-500 shrink-0 mt-0.5" />
                                    <span>
                                      {language === 'km' && stage.irrigationGuidelineKm
                                        ? stage.irrigationGuidelineKm
                                        : stage.irrigationGuidelineEn}
                                    </span>
                                  </div>
                                )}
                                {(stage.notesKm || stage.notesEn) && (
                                  <p className="text-[10.5px] text-slate-500 line-clamp-1 italic font-khmer">
                                    {language === 'km' && stage.notesKm ? stage.notesKm : stage.notesEn}
                                  </p>
                                )}
                                {!stage.irrigationGuidelineKm && !stage.irrigationGuidelineEn && !stage.notesKm && !stage.notesEn && (
                                  <span className="text-[10px] text-slate-400">-</span>
                                )}
                              </td>

                              {/* Actions */}
                              <td className="py-3 px-3 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingStage(stage);
                                      setStageModalMode('edit');
                                      setShowStageSettingsModal(true);
                                    }}
                                    className="py-1 px-2.5 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                                  >
                                    <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>{language === 'km' ? 'កែប្រែ' : 'Edit'}</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setDeleteTarget({
                                        type: 'stage',
                                        id: stage.id,
                                        name: language === 'km' ? stage.nameKm : stage.nameEn,
                                      });
                                    }}
                                    className="py-1 px-2 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-300 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer shadow-2xs"
                                    title={language === 'km' ? 'លុបដំណាក់កាលនេះ' : 'Delete stage'}
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
              )}
            </div>
          ) : (
            /* Sub-view: CYCLES (Live Crop Batch Timelines) */
            <StageManagementView initialCycleId={selectedCycleId} />
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW 4: VARIETY CATEGORIES CATALOG (ADD / EDIT / DELETE)  */}
      {/* ========================================================= */}
      {activeSubTab === 'categories' && (
        <div className="space-y-5">
          {/* Top Categories Overview KPI Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                {language === 'km' ? 'ប្រភេទពូជសរុប' : 'Total Categories'}
              </span>
              <div className="text-xl font-black text-slate-900 mt-1 font-mono flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-500" />
                {varietyCategories.length}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {language === 'km' ? 'ក្រុមពូជត្រសក់ផ្អែម' : 'Taxonomic classifications'}
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                {language === 'km' ? 'ពូជដែលបានចាត់ថ្នាក់' : 'Cultivars Categorized'}
              </span>
              <div className="text-xl font-black text-emerald-800 mt-1 font-mono flex items-center gap-2">
                <Wheat className="w-4 h-4 text-emerald-600" />
                {cropVarieties.length}
              </div>
              <div className="text-[10px] text-emerald-600 mt-0.5">
                {language === 'km' ? 'ពូជទាំងអស់មានប្រភេទ' : 'Linked to categories'}
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                {language === 'km' ? 'ប្រភេទដើមប្រព័ន្ធ' : 'Default Types'}
              </span>
              <div className="text-xl font-black text-slate-900 mt-1 font-mono">
                {varietyCategories.filter((c) => c.isDefault).length}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {language === 'km' ? 'ពូជស្នូលទូទៅ' : 'Core melon archetypes'}
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                {language === 'km' ? 'ប្រភេទផ្ទាល់ខ្លួន' : 'Custom Categories'}
              </span>
              <div className="text-xl font-black text-slate-900 mt-1 font-mono">
                {varietyCategories.filter((c) => !c.isDefault).length}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {language === 'km' ? 'បង្កើតបន្ថែមដោយកសិដ្ឋាន' : 'Farm customized categories'}
              </div>
            </div>
          </div>

          {/* Categories Grid */}
          {filteredCategories.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300 p-8">
              <Tag className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-700">
                {language === 'km' ? 'រកមិនឃើញប្រភេទពូជទេ' : 'No variety categories found'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {language === 'km' 
                  ? 'សូមព្យាយាមស្វែងរកពាក្យផ្សេង ឬចុចប៊ូតុងខាងក្រោមដើម្បីបង្កើតប្រភេទពូជថ្មី'
                  : 'Try adjusting your search query or create a new category to group your cultivars.'}
              </p>
              <button
                onClick={() => {
                  setEditingCategory(null);
                  setShowCategoryModal(true);
                }}
                className="mt-4 px-4 py-2 bg-[#164e22] text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{language === 'km' ? '+ បង្កើតប្រភេទពូជថ្មី' : '+ Add New Category'}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredCategories.map((cat) => {
                const memberVarieties = cropVarieties.filter(
                  (v) => v.category === cat.id || v.category === cat.code || v.category.toLowerCase() === cat.id.toLowerCase()
                );

                return (
                  <div
                    key={cat.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
                  >
                    <div>
                      {/* Card Top Banner */}
                      <div className="p-4 border-b border-slate-100 flex items-start justify-between gap-3 bg-gradient-to-r from-slate-50 to-white">
                        <div className="flex items-start gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-white shadow-xs"
                            style={{ backgroundColor: cat.color }}
                          >
                            <Tag className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border"
                                style={{
                                  backgroundColor: `${cat.color}15`,
                                  color: cat.color,
                                  borderColor: `${cat.color}40`,
                                }}
                              >
                                {cat.code}
                              </span>
                              {cat.isDefault && (
                                <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-500">
                                  Default
                                </span>
                              )}
                            </div>
                            <h3 className="font-extrabold text-slate-900 text-sm mt-1 leading-snug">
                              {cat.nameEn}
                            </h3>
                            <div className="text-[11px] text-slate-500 font-khmer mt-0.5">
                              {cat.nameKm}
                            </div>
                          </div>
                        </div>

                        {/* Actions: Edit / Delete */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => {
                              setEditingCategory(cat);
                              setShowCategoryModal(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit category"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setDeleteTarget({
                                type: 'category',
                                id: cat.id,
                                name: cat.nameEn,
                                count: memberVarieties.length,
                              });
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Description & Color Swatch */}
                      <div className="p-4 space-y-3">
                        {/* Descriptions */}
                        <div className="space-y-1">
                          {cat.descriptionEn && (
                            <p className="text-xs text-slate-600 leading-relaxed">
                              {cat.descriptionEn}
                            </p>
                          )}
                          {cat.descriptionKm && (
                            <p className="text-[11px] text-slate-500 font-khmer leading-relaxed">
                              {cat.descriptionKm}
                            </p>
                          )}
                        </div>

                        {/* Color Theme Pill */}
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-[10px] uppercase font-bold text-slate-400">Color Palette:</span>
                          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 rounded-md border border-slate-200">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }}></span>
                            <span className="text-[10px] font-mono text-slate-700 font-semibold">{cat.color}</span>
                          </div>
                        </div>

                        {/* Associated Cultivars Section */}
                        <div className="pt-2 border-t border-slate-100">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                              <Wheat className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{language === 'km' ? 'ពូជក្នុងប្រភេទនេះ' : 'Assigned Cultivars'}</span>
                            </span>
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                              {memberVarieties.length} {language === 'km' ? 'ពូជ' : 'varieties'}
                            </span>
                          </div>

                          {memberVarieties.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {memberVarieties.map((v) => (
                                <button
                                  key={v.id}
                                  onClick={() => {
                                    setEditingVariety(v);
                                    setShowVarietyModal(true);
                                  }}
                                  className="text-[11px] px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium transition-colors flex items-center gap-1 cursor-pointer"
                                  title="Click to view/edit variety specs"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: v.color || cat.color }}></span>
                                  <span>{v.nameEn}</span>
                                  <span className="text-[9px] font-mono text-slate-400">({v.daysToMaturity}d)</span>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-400 italic bg-slate-50/70 p-2 rounded-lg border border-dashed border-slate-200 text-center">
                              {language === 'km' ? 'មិនទាន់មានពូជក្នុងប្រភេទនេះទេ' : 'No cultivars registered under this category yet'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Card Footer: Quick Add Variety in this category */}
                    <div className="p-3 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          setEditingVariety(null);
                          setShowVarietyModal(true);
                        }}
                        className="w-full py-1.5 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{language === 'km' ? 'បន្ថែមពូជក្នុងប្រភេទនេះ' : 'Add Cultivar to Category'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: ADD / EDIT CROP CYCLE BATCH                      */}
      {/* ========================================================= */}
      <AddNewCropModal
        isOpen={showAddCropModal}
        onClose={() => {
          setShowAddCropModal(false);
          setEditingCropCycle(null);
          setPresetForNewCrop(null);
          setTargetPlotForNewPlanting(undefined);
        }}
        defaultPlotId={targetPlotForNewPlanting}
        cropCycleToEdit={editingCropCycle}
        initialVarietyPreset={presetForNewCrop}
      />

      {/* ========================================================= */}
      {/* MODAL 2: ADD / EDIT CROP VARIETY (CULTIVAR)               */}
      {/* ========================================================= */}
      {/* ========================================================= */}
      {/* MODAL 2: ADD / EDIT CROP VARIETY (CULTIVAR)               */}
      {/* ========================================================= */}
      {showVarietyModal && (typeof document !== 'undefined' ? createPortal(
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowVarietyModal(false);
              setEditingVariety(null);
            }
          }}
          className="fixed inset-0 z-[99999] bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in-50"
          style={{ zIndex: 99999 }}
        >
          <div 
            className="bg-white rounded-3xl w-full max-w-4xl lg:max-w-5xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden m-auto relative"
            style={{ zIndex: 100000 }}
          >
            {/* Modal Header */}
            <div className="px-6 sm:px-8 py-4 sm:py-5 border-b border-slate-100 bg-gradient-to-r from-emerald-50/80 via-slate-50 to-white flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shrink-0">
                  <Wheat className="w-5.5 h-5.5" />
                </div>
                <div className="text-left">
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2.5 flex-wrap">
                    <span>
                      {editingVariety 
                        ? (language === 'km' ? 'កែប្រែពូជដំណាំ' : 'Edit Crop Variety')
                        : (language === 'km' ? 'បន្ថែមពូជដំណាំថ្មី' : 'Add New Crop Variety')}
                    </span>
                    <span className="text-xs px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-khmer font-bold">
                      {editingVariety 
                        ? (language === 'km' ? 'កែប្រែពូជ' : 'Edit Cultivar') 
                        : (language === 'km' ? 'ពូជថ្មី' : 'New Cultivar')}
                    </span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 font-khmer mt-1">
                    {language === 'km' 
                      ? 'កំណត់លក្ខណៈបច្ចេកទេសពូជត្រសក់ផ្អែម បង្កើតកាលវិភាគលូតលាស់ និងតម្រូវការដាំដុះ' 
                      : 'Configure botanical specifications, ideal agronomic targets, and stage duration timeline'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowVarietyModal(false);
                  setEditingVariety(null);
                }}
                className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors shrink-0 cursor-pointer"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <VarietyForm
              key={editingVariety ? editingVariety.id : 'new-variety'}
              varietyToEdit={editingVariety}
              categories={varietyCategories}
              onClose={() => {
                setShowVarietyModal(false);
                setEditingVariety(null);
              }}
              onSave={(saved) => {
                const targetId = saved?.id;
                const isExisting = editingVariety || (targetId && cropVarieties.some(cv => String(cv.id).trim() === String(targetId).trim()));
                if (isExisting) {
                  updateCropVariety(saved as CropVarietyPreset);
                  showNotification(
                    language === 'km' 
                      ? `បានកែប្រែពូជ ${saved.nameEn} ដោយជោគជ័យ!` 
                      : `Variety "${saved.nameEn}" updated successfully!`
                  );
                } else {
                  addCropVariety(saved);
                  showNotification(
                    language === 'km' 
                      ? `បានបង្កើតពូជ ${saved.nameEn} ដោយជោគជ័យ!` 
                      : `New variety "${saved.nameEn}" added successfully!`
                  );
                }
                setShowVarietyModal(false);
                setEditingVariety(null);
              }}
            />
          </div>
        </div>,
        document.body
      ) : null)}

      {/* ========================================================= */}
      {/* MODAL 3: ADD / EDIT VARIETY CATEGORY                      */}
      {/* ========================================================= */}
      <CategoryModal
        isOpen={showCategoryModal}
        categoryToEdit={editingCategory}
        onClose={() => {
          setShowCategoryModal(false);
          setEditingCategory(null);
        }}
        onSave={(cat) => {
          if (editingCategory) {
            updateVarietyCategory(cat as VarietyCategory);
            showNotification(
              language === 'km'
                ? `បានកែប្រែប្រភេទ ${cat.nameEn} ដោយជោគជ័យ!`
                : `Category "${cat.nameEn}" updated successfully!`
            );
          } else {
            addVarietyCategory(cat);
            showNotification(
              language === 'km'
                ? `បានបង្កើតប្រភេទថ្មី ${cat.nameEn} ដោយជោគជ័យ!`
                : `New category "${cat.nameEn}" created successfully!`
            );
          }
          setShowCategoryModal(false);
          setEditingCategory(null);
        }}
      />

      {/* ========================================================= */}
      {/* MODAL 5: STAGE SETTINGS MODAL                             */}
      {/* ========================================================= */}
      <StageSettingsModal
        isOpen={showStageSettingsModal}
        onClose={() => {
          setShowStageSettingsModal(false);
          setEditingStage(null);
          setStageModalMode('list');
        }}
        initialStageToEdit={editingStage}
        initialMode={stageModalMode}
      />

      {/* ========================================================= */}
      {/* MODAL 4: DELETE CONFIRMATION                              */}
      {/* ========================================================= */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full p-5 text-center animate-in zoom-in-95 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h4 className="font-extrabold text-slate-900 text-base">
                {language === 'km' ? 'តើអ្នកប្រាកដថាចង់លុប?' : 'Confirm Deletion'}
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {deleteTarget.type === 'all_crops' ? (
                  <div>
                    <span className="font-bold text-rose-700 block mb-1">
                      {language === 'km'
                        ? `អ្នកកំពុងរៀបចំលុបដំណាំទាំងអស់ (ចំនួន ${deleteTarget.count || cropCycles.length} វដ្តដាំដុះ)។`
                        : `You are about to delete all ${deleteTarget.count || cropCycles.length} crop planting batches.`}
                    </span>
                    <span>
                      {language === 'km'
                        ? 'សកម្មភាពនេះនឹងលុបដំណាំទាំងអស់ចេញពីរងដាំ ហើយកំណត់រងទាំងអស់ឲ្យទំនេរ (គ្មានដំណាំដាំដុះ) រួចរាល់សម្រាប់ការដាំដុះថ្មី។ បញ្ជីពូជដំណាំ និងរងដាំនឹងនៅរក្សាទុកដដែល។'
                        : 'This will delete all crop plantings and reset all greenhouse plots to empty (no plants). The plots and master crop catalog will remain intact.'}
                    </span>
                  </div>
                ) : deleteTarget.type === 'crop'
                  ? (language === 'km'
                      ? `អ្នកកំពុងរៀបចំលុបដំណាំ "${deleteTarget.name}"។ រងដែលជាប់ទាក់ទងនឹងត្រូវកំណត់ជាទំនេរ (គ្មានដំណាំ)។ សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។`
                      : `Are you sure you want to delete the crop batch "${deleteTarget.name}"? The associated plot will be emptied. This action cannot be undone.`)
                  : deleteTarget.type === 'variety'
                  ? (language === 'km'
                      ? `អ្នកកំពុងរៀបចំលុបពូជ "${deleteTarget.name}"។ សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។`
                      : `Are you sure you want to delete the variety "${deleteTarget.name}"? This action cannot be undone.`)
                  : deleteTarget.type === 'category'
                  ? (language === 'km'
                      ? `អ្នកកំពុងរៀបចំលុបប្រភេទពូជ "${deleteTarget.name}"។ ពូជចំនួន ${deleteTarget.count || 0} នៅក្នុងប្រភេទនេះ នឹងត្រូវប្តូរទៅកាន់ 'Specialty / White Pearl' ដោយស្វ័យប្រវត្តិ ដើម្បីការពារការបាត់បង់ទិន្នន័យ។`
                      : `Are you sure you want to delete category "${deleteTarget.name}"? Any ${deleteTarget.count || 0} cultivar(s) under this category will automatically be reassigned to "Specialty / White Pearl" to safeguard data.`)
                  : (language === 'km'
                      ? `អ្នកកំពុងរៀបចំលុបដំណាក់កាលលូតលាស់ "${deleteTarget.name}"។ សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។`
                      : `Are you sure you want to delete the growth stage "${deleteTarget.name}"? This action cannot be undone.`)}
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                {language === 'km' ? 'បោះបង់' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                {deleteTarget.type === 'all_crops'
                  ? (language === 'km' ? 'លុបទាំងអស់ឲ្យទំនេរ' : 'Delete All & Make Empty')
                  : (language === 'km' ? 'លុបចេញ' : 'Yes, Delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// Sub-component: Form to Add/Edit Variety Category
// ============================================================
interface CategoryModalProps {
  isOpen: boolean;
  categoryToEdit?: VarietyCategory | null;
  onClose: () => void;
  onSave: (category: VarietyCategory | Omit<VarietyCategory, 'id'>) => void;
}

const PRESET_COLORS = [
  { label: 'Amber Gold', hex: '#EAB308' },
  { label: 'Japanese Green', hex: '#15803D' },
  { label: 'Cantaloupe Orange', hex: '#EA580C' },
  { label: 'Hami Ochre', hex: '#CA8A04' },
  { label: 'Ocean Sky', hex: '#0284C7' },
  { label: 'Emerald Jade', hex: '#059669' },
  { label: 'Royal Purple', hex: '#7C3AED' },
  { label: 'Ruby Crimson', hex: '#E11D48' },
  { label: 'Rose Pink', hex: '#DB2777' },
  { label: 'Indigo Night', hex: '#4F46E5' },
  { label: 'Warm Bronze', hex: '#D97706' },
  { label: 'Slate Charcoal', hex: '#475569' },
];

const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  categoryToEdit,
  onClose,
  onSave,
}) => {
  const { language } = useI18n();
  const [nameEn, setNameEn] = useState(categoryToEdit?.nameEn || '');
  const [nameKm, setNameKm] = useState(categoryToEdit?.nameKm || '');
  const [code, setCode] = useState(categoryToEdit?.code || '');
  const [color, setColor] = useState(categoryToEdit?.color || '#EAB308');
  const [descriptionEn, setDescriptionEn] = useState(categoryToEdit?.descriptionEn || '');
  const [descriptionKm, setDescriptionKm] = useState(categoryToEdit?.descriptionKm || '');

  // Keep state updated when categoryToEdit changes
  React.useEffect(() => {
    if (categoryToEdit) {
      setNameEn(categoryToEdit.nameEn);
      setNameKm(categoryToEdit.nameKm || '');
      setCode(categoryToEdit.code);
      setColor(categoryToEdit.color);
      setDescriptionEn(categoryToEdit.descriptionEn || '');
      setDescriptionKm(categoryToEdit.descriptionKm || '');
    } else {
      setNameEn('');
      setNameKm('');
      setCode('');
      setColor('#EAB308');
      setDescriptionEn('');
      setDescriptionKm('');
    }
  }, [categoryToEdit, isOpen]);

  // Auto-generate code when user types nameEn if code wasn't customized
  const handleNameEnChange = (val: string) => {
    setNameEn(val);
    if (!categoryToEdit && (!code || code === nameEn.toUpperCase().replace(/[^A-Z0-9]/g, '_'))) {
      setCode(val.toUpperCase().replace(/[^A-Z0-9]/g, '_'));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEn.trim()) return;

    const finalCode = (code.trim() || nameEn.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_'));

    if (categoryToEdit) {
      onSave({
        ...categoryToEdit,
        nameEn: nameEn.trim(),
        nameKm: nameKm.trim() || nameEn.trim(),
        code: finalCode,
        color,
        descriptionEn: descriptionEn.trim(),
        descriptionKm: descriptionKm.trim(),
      });
    } else {
      onSave({
        nameEn: nameEn.trim(),
        nameKm: nameKm.trim() || nameEn.trim(),
        code: finalCode,
        color,
        descriptionEn: descriptionEn.trim(),
        descriptionKm: descriptionKm.trim(),
        isDefault: false,
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full flex flex-col overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-2xs font-bold"
              style={{ backgroundColor: color }}
            >
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">
                {categoryToEdit
                  ? (language === 'km' ? 'កែប្រែប្រភេទពូជ' : 'Edit Variety Category')
                  : (language === 'km' ? 'បង្កើតប្រភេទពូជថ្មី' : 'Add New Variety Category')}
              </h3>
              <p className="text-[11px] text-slate-500">
                {language === 'km' ? 'កំណត់ក្រុមពូជ ពណ៌សម្គាល់ និងការពិពណ៌នា' : 'Organize melon cultivars by botanical taxonomy and rind profile'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs overflow-y-auto max-h-[75vh]">
          {/* Live Preview Card */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              {language === 'km' ? 'ការបង្ហាញគំរូជាក់ស្តែង (Live Preview)' : 'Live Badge & Tag Preview'}
            </span>
            <div className="flex items-center gap-3 flex-wrap">
              <span
                className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border shadow-2xs inline-flex items-center gap-1.5"
                style={{
                  backgroundColor: `${color}18`,
                  color: color,
                  borderColor: `${color}40`,
                }}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></span>
                <span>{nameEn || 'Sample Category'}</span>
                {nameKm && <span className="font-khmer font-normal">({nameKm})</span>}
              </span>

              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                CODE: {code || (nameEn ? nameEn.toUpperCase().replace(/[^A-Z0-9]/g, '_') : 'CODE')}
              </span>
            </div>
          </div>

          {/* Names EN & KM */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Category Name (English) *
              </label>
              <input
                type="text"
                required
                value={nameEn}
                onChange={(e) => handleNameEnChange(e.target.value)}
                placeholder="e.g. Watermelon Hybrid"
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-bold text-slate-900 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                ឈ្មោះប្រភេទ (ភាសាខ្មែរ)
              </label>
              <input
                type="text"
                value={nameKm}
                onChange={(e) => setNameKm(e.target.value)}
                placeholder="ឧ. ឪឡឹកកូនកាត់..."
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-khmer text-slate-900 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Code & Color */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Taxonomy / Identifier Code *
              </label>
              <div className="relative">
                <Hash className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
                  placeholder="e.g. WATERMELON"
                  className="w-full pl-8 pr-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-mono font-bold text-slate-900 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Theme Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-8 h-8 rounded border p-0.5 cursor-pointer shrink-0"
                />
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="#EAB308"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-mono text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Preset Color Swatches */}
          <div>
            <label className="font-semibold text-slate-600 block mb-1.5">
              Quick Color Palette Presets
            </label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {PRESET_COLORS.map((p) => (
                <button
                  key={p.hex}
                  type="button"
                  onClick={() => setColor(p.hex)}
                  title={p.label}
                  className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                    color.toLowerCase() === p.hex.toLowerCase()
                      ? 'scale-125 border-slate-900 shadow-xs'
                      : 'border-white hover:scale-110 shadow-2xs'
                  }`}
                  style={{ backgroundColor: p.hex }}
                />
              ))}
            </div>
          </div>

          {/* Description EN */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Description (English)
            </label>
            <textarea
              rows={2}
              value={descriptionEn}
              onChange={(e) => setDescriptionEn(e.target.value)}
              placeholder="Botanical rind characteristics, sweetness profile, flesh texture..."
              className="w-full p-2 border border-slate-300 rounded-lg bg-white text-xs text-slate-800"
            />
          </div>

          {/* Description KM */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              ការពិពណ៌នា (ភាសាខ្មែរ)
            </label>
            <textarea
              rows={2}
              value={descriptionKm}
              onChange={(e) => setDescriptionKm(e.target.value)}
              placeholder="លក្ខណៈសម្គាល់សំបក សាច់ផ្លែ ជាតិផ្អែម ក្លិន..."
              className="w-full p-2 border border-slate-300 rounded-lg bg-white font-khmer text-xs text-slate-800"
            />
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              {language === 'km' ? 'បោះបង់' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#164e22] hover:bg-[#123e1b] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>
                {categoryToEdit 
                  ? (language === 'km' ? 'រក្សាទុកការកែប្រែ' : 'Save Changes') 
                  : (language === 'km' ? 'បង្កើតប្រភេទ' : 'Create Category')}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================
// Internal Sub-component: Form to Add/Edit Crop Variety
// ============================================================
interface VarietyFormProps {
  varietyToEdit?: CropVarietyPreset | null;
  categories: VarietyCategory[];
  onClose: () => void;
  onSave: (variety: any) => void;
}

const VarietyForm: React.FC<VarietyFormProps> = ({ varietyToEdit, categories, onClose, onSave }) => {
  const { language } = useI18n();
  const { growthStages } = useFarm();

  // Resolve standard 7 growth stages from Growth Stages Master
  const stageSeedling = growthStages.find((s) => s.key === 'seedling' || s.id === 'stage-seedling');
  const stageTransplant = growthStages.find((s) => s.key === 'transplanting' || s.key === 'transplant' || s.id === 'stage-transplanting');
  const stageVine = growthStages.find((s) => s.key === 'vine_growth' || s.key === 'vineGrow' || s.id === 'stage-vine-growth');
  const stageFlowering = growthStages.find((s) => s.key === 'flowering' || s.id === 'stage-flowering');
  const stagePollination = growthStages.find((s) => s.key === 'pollination' || s.key === 'pollinate' || s.id === 'stage-pollination');
  const stageFruitDev = growthStages.find((s) => s.key === 'fruit_development' || s.key === 'fruitDev' || s.id === 'stage-fruit-development');
  const stageHarvest = growthStages.find((s) => s.key === 'harvest' || s.id === 'stage-harvest');

  const seedlingNameEn = stageSeedling?.nameEn || 'Seedling & Germination';
  const seedlingNameKm = stageSeedling?.nameKm || 'កូនដុះពន្លក & សាបកូន';

  const transplantNameEn = stageTransplant?.nameEn || 'Transplanting & Rooting';
  const transplantNameKm = stageTransplant?.nameKm || 'ស្ទូងកូនដំណាំ & ចាក់ឫស';

  const vineNameEn = stageVine?.nameEn || 'Vine & Foliage Growth';
  const vineNameKm = stageVine?.nameKm || 'ការលូតលាស់ដើម & ស្លឹក';

  const floweringNameEn = stageFlowering?.nameEn || 'Flowering & Budding';
  const floweringNameKm = stageFlowering?.nameKm || 'ចេញផ្កា & ក្តិប';

  const pollinationNameEn = stagePollination?.nameEn || 'Artificial Pollination';
  const pollinationNameKm = stagePollination?.nameKm || 'ការបង្កាត់លម្អងផ្កា';

  const fruitDevNameEn = stageFruitDev?.nameEn || 'Fruit Expansion & Netting';
  const fruitDevNameKm = stageFruitDev?.nameKm || 'ពង្រីកផ្លែ & បង្កើតក្រឡា';

  const harvestNameEn = stageHarvest?.nameEn || 'Ripening & Harvesting';
  const harvestNameKm = stageHarvest?.nameKm || 'ទុំ & ប្រមូលផល';

  // Helper to resolve stage duration from varietyToEdit (handling either explicit days or stages array)
  const getInitialStageDays = (key: string, explicitDays: number | undefined | null, defaultDays: number) => {
    if (explicitDays !== undefined && explicitDays !== null && !isNaN(Number(explicitDays)) && Number(explicitDays) > 0) {
      return Number(explicitDays);
    }
    const found = varietyToEdit?.stages?.find((s) => s.key === key);
    if (found && found.targetDays) return Number(found.targetDays);
    return defaultDays;
  };

  const [nameEn, setNameEn] = useState(varietyToEdit?.nameEn || '');
  const [nameKm, setNameKm] = useState(varietyToEdit?.nameKm || '');
  const [category, setCategory] = useState<string>(
    varietyToEdit?.category || (categories.length > 0 ? categories[0].id : 'honeydew')
  );
  const [daysToMaturity, setDaysToMaturity] = useState(varietyToEdit?.daysToMaturity || 75);
  const [targetBrix, setTargetBrix] = useState(varietyToEdit?.targetBrix ?? 15.0);
  const [idealEc, setIdealEc] = useState(varietyToEdit?.idealEc ?? 1.8);
  const [idealPh, setIdealPh] = useState(varietyToEdit?.idealPh ?? 6.5);
  const [plantSpacingCm, setPlantSpacingCm] = useState(varietyToEdit?.plantSpacingCm ?? 40);
  const [expectedYieldKgPerPlant, setExpectedYieldKgPerPlant] = useState(varietyToEdit?.expectedYieldKgPerPlant ?? 1.8);
  const [nettingRequired, setNettingRequired] = useState(varietyToEdit?.nettingRequired ?? false);
  const [color, setColor] = useState(varietyToEdit?.color || '#10b981');
  const [descriptionEn, setDescriptionEn] = useState(varietyToEdit?.descriptionEn || '');
  const [descriptionKm, setDescriptionKm] = useState(varietyToEdit?.descriptionKm || '');

  // Growth Stage durations
  const [seedlingDays, setSeedlingDays] = useState(() => 
    getInitialStageDays('seedling', varietyToEdit?.seedlingDays, 7)
  );
  const [transplantDays, setTransplantDays] = useState(() => 
    getInitialStageDays('transplanting', varietyToEdit?.transplantDays, 7)
  );
  const [vineGrowthDays, setVineGrowthDays] = useState(() => 
    getInitialStageDays('vine_growth', varietyToEdit?.vineGrowthDays, 20)
  );
  const [floweringDays, setFloweringDays] = useState(() => 
    getInitialStageDays('flowering', varietyToEdit?.floweringDays, 12)
  );
  const [pollinationDays, setPollinationDays] = useState(() => 
    getInitialStageDays('pollination', varietyToEdit?.pollinationDays, 14)
  );
  const [fruitDevDays, setFruitDevDays] = useState(() => 
    getInitialStageDays('fruit_development', varietyToEdit?.fruitDevDays, 20)
  );
  const [harvestDays, setHarvestDays] = useState(() => 
    getInitialStageDays('harvest', varietyToEdit?.harvestDays, 10)
  );

  // Sync state whenever varietyToEdit or categories change
  useEffect(() => {
    if (varietyToEdit) {
      setNameEn(varietyToEdit.nameEn || '');
      setNameKm(varietyToEdit.nameKm || '');
      setCategory(varietyToEdit.category || (categories.length > 0 ? categories[0].id : 'honeydew'));
      setTargetBrix(varietyToEdit.targetBrix ?? 15.0);
      setIdealEc(varietyToEdit.idealEc ?? 1.8);
      setIdealPh(varietyToEdit.idealPh ?? 6.5);
      setPlantSpacingCm(varietyToEdit.plantSpacingCm ?? 40);
      setExpectedYieldKgPerPlant(varietyToEdit.expectedYieldKgPerPlant ?? 1.8);
      setNettingRequired(Boolean(varietyToEdit.nettingRequired));
      setColor(varietyToEdit.color || '#10b981');
      setDescriptionEn(varietyToEdit.descriptionEn || '');
      setDescriptionKm(varietyToEdit.descriptionKm || '');

      const s = getInitialStageDays('seedling', varietyToEdit.seedlingDays, 7);
      const t = getInitialStageDays('transplanting', varietyToEdit.transplantDays, 7);
      const v = getInitialStageDays('vine_growth', varietyToEdit.vineGrowthDays, 20);
      const fl = getInitialStageDays('flowering', varietyToEdit.floweringDays, 12);
      const p = getInitialStageDays('pollination', varietyToEdit.pollinationDays, 14);
      const fr = getInitialStageDays('fruit_development', varietyToEdit.fruitDevDays, 20);
      const h = getInitialStageDays('harvest', varietyToEdit.harvestDays, 10);

      setSeedlingDays(s);
      setTransplantDays(t);
      setVineGrowthDays(v);
      setFloweringDays(fl);
      setPollinationDays(p);
      setFruitDevDays(fr);
      setHarvestDays(h);
      setDaysToMaturity(varietyToEdit.daysToMaturity || (s + t + v + fl + p + fr + h));
    } else {
      setNameEn('');
      setNameKm('');
      const defaultCat = categories.length > 0 ? categories[0] : null;
      setCategory(defaultCat ? defaultCat.id : 'honeydew');
      setColor(defaultCat?.color || '#10b981');
      setDaysToMaturity(75);
      setTargetBrix(15.0);
      setIdealEc(1.8);
      setIdealPh(6.5);
      setPlantSpacingCm(40);
      setExpectedYieldKgPerPlant(1.8);
      setNettingRequired(false);
      setDescriptionEn('');
      setDescriptionKm('');
      setSeedlingDays(7);
      setTransplantDays(7);
      setVineGrowthDays(20);
      setFloweringDays(12);
      setPollinationDays(14);
      setFruitDevDays(20);
      setHarvestDays(10);
    }
  }, [varietyToEdit, categories]);

  // Synchronize stage days with total days to maturity
  const handleStageChange = (
    setter: React.Dispatch<React.SetStateAction<number>>,
    newVal: number,
    field: string
  ) => {
    const valid = Math.max(0, newVal);
    setter(valid);

    const s = field === 'seedling' ? valid : seedlingDays;
    const t = field === 'transplant' ? valid : transplantDays;
    const v = field === 'vineGrowth' ? valid : vineGrowthDays;
    const fl = field === 'flowering' ? valid : floweringDays;
    const p = field === 'pollination' ? valid : pollinationDays;
    const fr = field === 'fruitDev' ? valid : fruitDevDays;
    const h = field === 'harvest' ? valid : harvestDays;
    setDaysToMaturity(s + t + v + fl + p + fr + h);
  };

  const currentCategoryMeta = categories.find((c) => c.id === category) || categories[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEn.trim()) {
      alert(language === 'km' ? 'សូមបញ្ចូលឈ្មោះពូជដំណាំជាភាសាអង់គ្លេស' : 'Please provide the cultivar name in English');
      return;
    }

    const getExistingStage = (k: string) => varietyToEdit?.stages?.find(s => s.key === k);

    const stagesConfig: VarietyStageConfig[] = [
      {
        ...(getExistingStage('seedling') || {}),
        key: 'seedling',
        nameEn: seedlingNameEn,
        nameKm: seedlingNameKm,
        targetDays: Math.max(1, Number(seedlingDays) || 7),
        color: stageSeedling?.color || getExistingStage('seedling')?.color || 'emerald',
        ecTarget: getExistingStage('seedling')?.ecTarget || stageSeedling?.ecTarget,
        phTarget: getExistingStage('seedling')?.phTarget || stageSeedling?.phTarget,
      },
      {
        ...(getExistingStage('transplanting') || getExistingStage('transplant') || {}),
        key: 'transplanting',
        nameEn: transplantNameEn,
        nameKm: transplantNameKm,
        targetDays: Math.max(1, Number(transplantDays) || 7),
        color: stageTransplant?.color || getExistingStage('transplanting')?.color || 'teal',
        ecTarget: getExistingStage('transplanting')?.ecTarget || stageTransplant?.ecTarget,
        phTarget: getExistingStage('transplanting')?.phTarget || stageTransplant?.phTarget,
      },
      {
        ...(getExistingStage('vine_growth') || getExistingStage('vineGrow') || {}),
        key: 'vine_growth',
        nameEn: vineNameEn,
        nameKm: vineNameKm,
        targetDays: Math.max(1, Number(vineGrowthDays) || 20),
        color: stageVine?.color || getExistingStage('vine_growth')?.color || 'sky',
        ecTarget: getExistingStage('vine_growth')?.ecTarget || stageVine?.ecTarget,
        phTarget: getExistingStage('vine_growth')?.phTarget || stageVine?.phTarget,
      },
      {
        ...(getExistingStage('flowering') || {}),
        key: 'flowering',
        nameEn: floweringNameEn,
        nameKm: floweringNameKm,
        targetDays: Math.max(1, Number(floweringDays) || 12),
        color: stageFlowering?.color || getExistingStage('flowering')?.color || 'indigo',
        ecTarget: getExistingStage('flowering')?.ecTarget || stageFlowering?.ecTarget,
        phTarget: getExistingStage('flowering')?.phTarget || stageFlowering?.phTarget,
      },
      {
        ...(getExistingStage('pollination') || getExistingStage('pollinate') || {}),
        key: 'pollination',
        nameEn: pollinationNameEn,
        nameKm: pollinationNameKm,
        targetDays: Math.max(1, Number(pollinationDays) || 14),
        color: stagePollination?.color || getExistingStage('pollination')?.color || 'amber',
        ecTarget: getExistingStage('pollination')?.ecTarget || stagePollination?.ecTarget,
        phTarget: getExistingStage('pollination')?.phTarget || stagePollination?.phTarget,
      },
      {
        ...(getExistingStage('fruit_development') || getExistingStage('fruitDev') || {}),
        key: 'fruit_development',
        nameEn: fruitDevNameEn,
        nameKm: fruitDevNameKm,
        targetDays: Math.max(1, Number(fruitDevDays) || 20),
        color: stageFruitDev?.color || getExistingStage('fruit_development')?.color || 'purple',
        ecTarget: getExistingStage('fruit_development')?.ecTarget || stageFruitDev?.ecTarget,
        phTarget: getExistingStage('fruit_development')?.phTarget || stageFruitDev?.phTarget,
      },
      {
        ...(getExistingStage('harvest') || {}),
        key: 'harvest',
        nameEn: harvestNameEn,
        nameKm: harvestNameKm,
        targetDays: Math.max(1, Number(harvestDays) || 10),
        color: stageHarvest?.color || getExistingStage('harvest')?.color || 'rose',
        ecTarget: getExistingStage('harvest')?.ecTarget || stageHarvest?.ecTarget,
        phTarget: getExistingStage('harvest')?.phTarget || stageHarvest?.phTarget,
      },
    ];

    const sDays = Math.max(1, Number(seedlingDays) || 7);
    const tDays = Math.max(1, Number(transplantDays) || 7);
    const vDays = Math.max(1, Number(vineGrowthDays) || 20);
    const flDays = Math.max(1, Number(floweringDays) || 12);
    const pDays = Math.max(1, Number(pollinationDays) || 14);
    const frDays = Math.max(1, Number(fruitDevDays) || 20);
    const hDays = Math.max(1, Number(harvestDays) || 10);
    const calculatedTotalDays = sDays + tDays + vDays + flDays + pDays + frDays + hDays;

    const data: CropVarietyPreset = {
      ...(varietyToEdit ? { ...varietyToEdit, id: varietyToEdit.id } : { id: `variety-${Date.now()}` }),
      nameEn: nameEn.trim(),
      nameKm: nameKm.trim() || nameEn.trim(),
      category,
      daysToMaturity: calculatedTotalDays,
      seedlingDays: sDays,
      transplantDays: tDays,
      vineGrowthDays: vDays,
      floweringDays: flDays,
      pollinationDays: pDays,
      fruitDevDays: frDays,
      harvestDays: hDays,
      targetBrix: Number(targetBrix) || 14.5,
      idealEc: Number(idealEc) || 1.8,
      idealPh: Number(idealPh) || 6.5,
      plantSpacingCm: Number(plantSpacingCm) || 40,
      expectedYieldKgPerPlant: Number(expectedYieldKgPerPlant) || 1.8,
      nettingRequired: Boolean(nettingRequired),
      color: color || '#10b981',
      descriptionEn: descriptionEn.trim(),
      descriptionKm: descriptionKm.trim(),
      stages: stagesConfig,
    };

    onSave(data);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
      {/* Scrollable Form Body with Large Module Spacing and High-Readability Fonts */}
      <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6 text-left">
        {/* Module 1: Botanical Cultivar Identity */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <Sprout className="w-4 h-4" />
            </div>
            <span className="text-sm sm:text-base font-extrabold text-slate-900 uppercase tracking-wide">
              1. Variety Name & Botanical Identity / <span className="font-khmer font-bold">ឈ្មោះពូជ និងអត្តសញ្ញាណ</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5 text-left">
                Variety Name (English) / <span className="font-khmer">ឈ្មោះពូជ (អង់គ្លេស)</span> *
              </label>
              <input
                type="text"
                required
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="e.g. Golden Honeydew (Inthanon F1)"
                className="w-full px-3.5 py-2.5 text-sm sm:text-base rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5 text-left">
                ឈ្មោះពូជ (ភាសាខ្មែរ) / <span className="font-khmer">Khmer Variety Name</span>
              </label>
              <input
                type="text"
                value={nameKm}
                onChange={(e) => setNameKm(e.target.value)}
                placeholder="ឧ. ត្រសក់ផ្អែមមាស (អ៊ីនថាណុន F1)..."
                className="w-full px-3.5 py-2.5 text-sm sm:text-base rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white font-khmer text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div className="sm:col-span-2">
              <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5 text-left">
                Cultivar Category / <span className="font-khmer">ប្រភេទក្រុមពូជ</span>
              </label>
              <select
                value={category}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  setCategory(selectedId);
                  if (!varietyToEdit) {
                    const cat = categories.find((c) => c.id === selectedId);
                    if (cat) setColor(cat.color);
                  }
                }}
                className="w-full px-3.5 py-2.5 text-sm sm:text-base rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-2xs"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nameEn} {c.nameKm ? `(${c.nameKm})` : ''} [{c.code}]
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5 text-left">
                Color Tag / <span className="font-khmer">ពណ៌សម្គាល់</span>
              </label>
              <div className="flex items-center gap-3 p-1.5 px-3 rounded-xl border border-slate-200 bg-slate-50/50">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-9 h-9 rounded-lg border border-slate-300 p-0.5 cursor-pointer shrink-0"
                />
                <span className="font-mono text-xs sm:text-sm font-bold text-slate-800 uppercase">
                  {color}
                </span>
                <span
                  className="w-4 h-4 rounded-full ml-auto shadow-2xs border border-white"
                  style={{ backgroundColor: color }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Module 2: Growth Stages & Maturity Timeline */}
        <div className="pt-6 border-t border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <span className="text-sm sm:text-base font-extrabold text-slate-900 uppercase tracking-wide">
                2. Growth Stages & Maturity Schedule / <span className="font-khmer font-bold">កាលវិភាគដំណាក់កាលលូតលាស់</span>
              </span>
            </div>

            <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
              {daysToMaturity} Days Total Cycle ({Math.round(daysToMaturity / 7)} weeks)
            </span>
          </div>

          {/* 7 Stage Duration Micro-inputs */}
          <div className="p-4 sm:p-4.5 bg-slate-50/80 rounded-2xl border border-slate-200/90 text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-3.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-bold text-slate-800">
                  {language === 'km' ? 'រយៈពេលដំណាក់កាលនីមួយៗ (ថ្ងៃ):' : 'Stage Durations Breakdown (Days):'}
                </span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-bold flex items-center gap-1">
                  <Sliders className="w-3 h-3 text-purple-600" />
                  <span>{language === 'km' ? 'ដំណាក់កាលដូច Growth Stages Master' : 'Growth Stages Master'}</span>
                </span>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                {language === 'km' ? 'ផ្លាស់ប្តូរថ្ងៃដើម្បីធ្វើបច្ចុប្បន្នភាពវដ្តសរុប' : 'Adjusting stages auto-updates total maturity cycle'}
              </span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2.5 text-center">
              {/* 1. Seedling & Germination */}
              <div className="bg-emerald-100/70 p-2 sm:p-2.5 rounded-2xl border border-emerald-300 shadow-2xs flex flex-col justify-between">
                <div className="mb-1 text-center min-h-[38px] flex flex-col justify-center" title={`${seedlingNameEn} / ${seedlingNameKm}`}>
                  <span className="text-xs sm:text-sm text-emerald-950 font-extrabold block truncate">
                    {language === 'km' && seedlingNameKm ? seedlingNameKm : seedlingNameEn}
                  </span>
                  <span className="text-[10px] text-emerald-800/80 font-medium block truncate font-khmer">
                    {language === 'km' ? seedlingNameEn : seedlingNameKm}
                  </span>
                </div>
                <input
                  type="number"
                  min="1"
                  value={seedlingDays}
                  onChange={(e) => handleStageChange(setSeedlingDays, Math.max(0, parseInt(e.target.value, 10) || 0), 'seedling')}
                  className="w-full text-center text-sm sm:text-base py-1.5 sm:py-2 rounded-xl border border-emerald-300 font-mono bg-white font-bold text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* 2. Transplanting & Rooting */}
              <div className="bg-white p-2 sm:p-2.5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
                <div className="mb-1 text-center min-h-[38px] flex flex-col justify-center" title={`${transplantNameEn} / ${transplantNameKm}`}>
                  <span className="text-xs sm:text-sm text-slate-800 font-extrabold block truncate">
                    {language === 'km' && transplantNameKm ? transplantNameKm : transplantNameEn}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium block truncate font-khmer">
                    {language === 'km' ? transplantNameEn : transplantNameKm}
                  </span>
                </div>
                <input
                  type="number"
                  min="1"
                  value={transplantDays}
                  onChange={(e) => handleStageChange(setTransplantDays, Math.max(0, parseInt(e.target.value, 10) || 0), 'transplant')}
                  className="w-full text-center text-sm sm:text-base py-1.5 sm:py-2 rounded-xl border border-slate-200 font-mono bg-slate-50/50 hover:bg-white focus:bg-white font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* 3. Vine & Foliage Growth */}
              <div className="bg-white p-2 sm:p-2.5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
                <div className="mb-1 text-center min-h-[38px] flex flex-col justify-center" title={`${vineNameEn} / ${vineNameKm}`}>
                  <span className="text-xs sm:text-sm text-slate-800 font-extrabold block truncate">
                    {language === 'km' && vineNameKm ? vineNameKm : vineNameEn}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium block truncate font-khmer">
                    {language === 'km' ? vineNameEn : vineNameKm}
                  </span>
                </div>
                <input
                  type="number"
                  min="1"
                  value={vineGrowthDays}
                  onChange={(e) => handleStageChange(setVineGrowthDays, Math.max(0, parseInt(e.target.value, 10) || 0), 'vineGrowth')}
                  className="w-full text-center text-sm sm:text-base py-1.5 sm:py-2 rounded-xl border border-slate-200 font-mono bg-slate-50/50 hover:bg-white focus:bg-white font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* 4. Flowering & Budding */}
              <div className="bg-white p-2 sm:p-2.5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
                <div className="mb-1 text-center min-h-[38px] flex flex-col justify-center" title={`${floweringNameEn} / ${floweringNameKm}`}>
                  <span className="text-xs sm:text-sm text-slate-800 font-extrabold block truncate">
                    {language === 'km' && floweringNameKm ? floweringNameKm : floweringNameEn}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium block truncate font-khmer">
                    {language === 'km' ? floweringNameEn : floweringNameKm}
                  </span>
                </div>
                <input
                  type="number"
                  min="1"
                  value={floweringDays}
                  onChange={(e) => handleStageChange(setFloweringDays, Math.max(0, parseInt(e.target.value, 10) || 0), 'flowering')}
                  className="w-full text-center text-sm sm:text-base py-1.5 sm:py-2 rounded-xl border border-slate-200 font-mono bg-slate-50/50 hover:bg-white focus:bg-white font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* 5. Artificial Pollination */}
              <div className="bg-white p-2 sm:p-2.5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
                <div className="mb-1 text-center min-h-[38px] flex flex-col justify-center" title={`${pollinationNameEn} / ${pollinationNameKm}`}>
                  <span className="text-xs sm:text-sm text-slate-800 font-extrabold block truncate">
                    {language === 'km' && pollinationNameKm ? pollinationNameKm : pollinationNameEn}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium block truncate font-khmer">
                    {language === 'km' ? pollinationNameEn : pollinationNameKm}
                  </span>
                </div>
                <input
                  type="number"
                  min="1"
                  value={pollinationDays}
                  onChange={(e) => handleStageChange(setPollinationDays, Math.max(0, parseInt(e.target.value, 10) || 0), 'pollination')}
                  className="w-full text-center text-sm sm:text-base py-1.5 sm:py-2 rounded-xl border border-slate-200 font-mono bg-slate-50/50 hover:bg-white focus:bg-white font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* 6. Fruit Expansion & Netting */}
              <div className="bg-white p-2 sm:p-2.5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
                <div className="mb-1 text-center min-h-[38px] flex flex-col justify-center" title={`${fruitDevNameEn} / ${fruitDevNameKm}`}>
                  <span className="text-xs sm:text-sm text-slate-800 font-extrabold block truncate">
                    {language === 'km' && fruitDevNameKm ? fruitDevNameKm : fruitDevNameEn}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium block truncate font-khmer">
                    {language === 'km' ? fruitDevNameEn : fruitDevNameKm}
                  </span>
                </div>
                <input
                  type="number"
                  min="1"
                  value={fruitDevDays}
                  onChange={(e) => handleStageChange(setFruitDevDays, Math.max(0, parseInt(e.target.value, 10) || 0), 'fruitDev')}
                  className="w-full text-center text-sm sm:text-base py-1.5 sm:py-2 rounded-xl border border-slate-200 font-mono bg-slate-50/50 hover:bg-white focus:bg-white font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* 7. Ripening & Harvesting */}
              <div className="bg-amber-100/70 p-2 sm:p-2.5 rounded-2xl border border-amber-300 shadow-2xs flex flex-col justify-between">
                <div className="mb-1 text-center min-h-[38px] flex flex-col justify-center" title={`${harvestNameEn} / ${harvestNameKm}`}>
                  <span className="text-xs sm:text-sm text-amber-950 font-extrabold block truncate">
                    {language === 'km' && harvestNameKm ? harvestNameKm : harvestNameEn}
                  </span>
                  <span className="text-[10px] text-amber-800/80 font-medium block truncate font-khmer">
                    {language === 'km' ? harvestNameEn : harvestNameKm}
                  </span>
                </div>
                <input
                  type="number"
                  min="1"
                  value={harvestDays}
                  onChange={(e) => handleStageChange(setHarvestDays, Math.max(0, parseInt(e.target.value, 10) || 0), 'harvest')}
                  className="w-full text-center text-sm sm:text-base py-1.5 sm:py-2 rounded-xl border border-amber-300 font-mono bg-white font-bold text-amber-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Module 3: Agronomic & Quality Targets */}
        <div className="pt-6 border-t border-slate-200/80 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <Scale className="w-4 h-4" />
            </div>
            <span className="text-sm sm:text-base font-extrabold text-slate-900 uppercase tracking-wide">
              3. Agronomic Targets & Ideal Conditions / <span className="font-khmer font-bold">ប៉ារ៉ាម៉ែត្រកសិកម្ម & លក្ខខណ្ឌសមស្រប</span>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5 text-left">
                Target Brix / <span className="font-khmer">ជាតិផ្អែម</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="5"
                  max="25"
                  value={targetBrix}
                  onChange={(e) => setTargetBrix(Number(e.target.value))}
                  className="w-full px-3 py-2.5 text-sm sm:text-base rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white font-mono font-bold text-amber-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-12 shadow-2xs"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-700/80 font-mono">
                  °Bx
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5 text-left">
                Ideal EC / <span className="font-khmer">កំហាប់ជី EC</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="5.0"
                  value={idealEc}
                  onChange={(e) => setIdealEc(Number(e.target.value))}
                  className="w-full px-3 py-2.5 text-sm sm:text-base rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-14 shadow-2xs"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono">
                  mS/cm
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5 text-left">
                Ideal pH / <span className="font-khmer">កម្រិត pH</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="4.0"
                  max="9.0"
                  value={idealPh}
                  onChange={(e) => setIdealPh(Number(e.target.value))}
                  className="w-full px-3 py-2.5 text-sm sm:text-base rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-10 shadow-2xs"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono">
                  pH
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5 text-left">
                Spacing / <span className="font-khmer">ចម្ងាយដើម</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="10"
                  max="120"
                  value={plantSpacingCm}
                  onChange={(e) => setPlantSpacingCm(Number(e.target.value))}
                  className="w-full px-3 py-2.5 text-sm sm:text-base rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-10 shadow-2xs"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono">
                  cm
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5 text-left">
                Yield per Plant / <span className="font-khmer">ទិន្នផលក្នុង១ដើម (គ.ក្រ)</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  value={expectedYieldKgPerPlant}
                  onChange={(e) => setExpectedYieldKgPerPlant(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 text-sm sm:text-base rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-14 shadow-2xs"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono">
                  kg/plant
                </span>
              </div>
            </div>

            <div className="flex items-center">
              <label className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/70 hover:bg-slate-50 flex items-center gap-3 w-full cursor-pointer transition-colors shadow-2xs">
                <input
                  type="checkbox"
                  id="nettingToggle"
                  checked={nettingRequired}
                  onChange={(e) => setNettingRequired(e.target.checked)}
                  className="accent-emerald-600 w-5 h-5 rounded cursor-pointer shrink-0"
                />
                <div>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 block">
                    {language === 'km' ? 'តម្រូវការចងសំណាញ់/ខ្សែយោង (Netting Required)' : 'Netting & String Trellis Support Required'}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium font-khmer block mt-0.5">
                    {language === 'km' ? 'តម្រូវឱ្យមានខ្សែយោងទង និងសំណាញ់ទ្រផ្លែ' : 'Requires vertical string hanging and fruit cradle net'}
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Module 4: Cultivar Descriptions & Notes */}
        <div className="pt-6 border-t border-slate-200/80 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <Edit3 className="w-4 h-4" />
            </div>
            <span className="text-sm sm:text-base font-extrabold text-slate-900 uppercase tracking-wide">
              4. Botanical Notes & Descriptions / <span className="font-khmer font-bold">ការពិពណ៌នា និងកំណត់សម្គាល់</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5 text-left">
                Description (English) / <span className="font-khmer">ការពិពណ៌នាជាភាសាអង់គ្លេស</span>
              </label>
              <textarea
                rows={3}
                value={descriptionEn}
                onChange={(e) => setDescriptionEn(e.target.value)}
                placeholder="Botanical notes, sugar profile, skin texture, market demand..."
                className="w-full px-3.5 py-2.5 text-sm sm:text-base rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs resize-none"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5 text-left">
                ការពិពណ៌នា (ភាសាខ្មែរ) / <span className="font-khmer">Khmer Description</span>
              </label>
              <textarea
                rows={3}
                value={descriptionKm}
                onChange={(e) => setDescriptionKm(e.target.value)}
                placeholder="ពណ៌សំបក កម្រិតជាតិផ្អែម សាច់ផ្លែ តម្រូវការទីផ្សារ..."
                className="w-full px-3.5 py-2.5 text-sm sm:text-base rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white font-khmer text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs resize-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Frozen Footer Action Bar */}
      <div className="shrink-0 px-6 sm:px-8 py-4 border-t border-slate-200/90 bg-slate-50/95 backdrop-blur-xs flex items-center justify-end gap-3.5 z-10 shadow-2xs">
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-2.5 sm:py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-sm font-bold text-slate-700 transition-colors cursor-pointer"
        >
          {language === 'km' ? 'បោះបង់' : 'Cancel'}
        </button>
        <button
          type="submit"
          className="px-7 py-2.5 sm:py-3 rounded-xl bg-[#164e22] hover:bg-[#123e1b] text-white text-sm sm:text-base font-bold shadow-md transition-colors flex items-center gap-2 cursor-pointer"
        >
          <Wheat className="w-4.5 h-4.5" />
          <span>
            {varietyToEdit 
              ? (language === 'km' ? 'រក្សាទុកការកែប្រែ' : 'Save Changes') 
              : (language === 'km' ? 'បង្កើតពូជថ្មី' : 'Create Variety')}
          </span>
        </button>
      </div>
    </form>
  );
};
