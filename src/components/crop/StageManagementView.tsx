import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Layers, 
  Sprout, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  ChevronRight, 
  Edit3, 
  Plus, 
  Sliders, 
  RotateCcw, 
  FastForward, 
  Sparkles, 
  AlertCircle, 
  Info, 
  MapPin, 
  Droplets, 
  Activity, 
  Thermometer, 
  X, 
  Check, 
  ShieldCheck,
  ChevronDown,
  Search,
  Filter,
  LayoutGrid,
  Table as TableIcon,
  Trash2,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Gauge,
  BookmarkPlus,
  HelpCircle,
  Percent
} from 'lucide-react';
import { useI18n } from '../../locales/i18nContext';
import { useFarm } from '../../context/FarmContext';
import { useAuth } from '../../context/AuthContext';
import { CropCycle, GrowthStage, GrowthStageKey, Plot } from '../../types/melon';
import { 
  CropVarietyPreset, 
  getStagesForVariety, 
  calculateChainedStages, 
  calculateDateOffset 
} from '../../data/cropVarieties';
import { StageSettingsModal } from './StageSettingsModal';

// Color Palette Definition for Custom Stages
const COLOR_THEMES: Record<string, {
  name: string;
  badgeBg: string;
  badgeText: string;
  ringColor: string;
  dotBg: string;
  borderActive: string;
  accentBg: string;
}> = {
  emerald: {
    name: 'Emerald (Green)',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-800',
    ringColor: 'ring-emerald-500',
    dotBg: 'bg-emerald-500',
    borderActive: 'border-emerald-600',
    accentBg: 'bg-emerald-600'
  },
  teal: {
    name: 'Teal (Aqua)',
    badgeBg: 'bg-teal-100',
    badgeText: 'text-teal-800',
    ringColor: 'ring-teal-500',
    dotBg: 'bg-teal-500',
    borderActive: 'border-teal-600',
    accentBg: 'bg-teal-600'
  },
  sky: {
    name: 'Sky Blue',
    badgeBg: 'bg-sky-100',
    badgeText: 'text-sky-800',
    ringColor: 'ring-sky-500',
    dotBg: 'bg-sky-500',
    borderActive: 'border-sky-600',
    accentBg: 'bg-sky-600'
  },
  indigo: {
    name: 'Indigo (Deep Blue)',
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-800',
    ringColor: 'ring-indigo-500',
    dotBg: 'bg-indigo-500',
    borderActive: 'border-indigo-600',
    accentBg: 'bg-indigo-600'
  },
  amber: {
    name: 'Amber (Gold)',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
    ringColor: 'ring-amber-500',
    dotBg: 'bg-amber-500',
    borderActive: 'border-amber-600',
    accentBg: 'bg-amber-600'
  },
  purple: {
    name: 'Purple (Royal)',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-800',
    ringColor: 'ring-purple-500',
    dotBg: 'bg-purple-500',
    borderActive: 'border-purple-600',
    accentBg: 'bg-purple-600'
  },
  rose: {
    name: 'Rose (Crimson)',
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-800',
    ringColor: 'ring-rose-500',
    dotBg: 'bg-rose-500',
    borderActive: 'border-rose-600',
    accentBg: 'bg-rose-600'
  },
  orange: {
    name: 'Orange (Warm)',
    badgeBg: 'bg-orange-100',
    badgeText: 'text-orange-800',
    ringColor: 'ring-orange-500',
    dotBg: 'bg-orange-500',
    borderActive: 'border-orange-600',
    accentBg: 'bg-orange-600'
  },
  cyan: {
    name: 'Cyan (Mint)',
    badgeBg: 'bg-cyan-100',
    badgeText: 'text-cyan-800',
    ringColor: 'ring-cyan-500',
    dotBg: 'bg-cyan-500',
    borderActive: 'border-cyan-600',
    accentBg: 'bg-cyan-600'
  }
};

// Stage Agronomic Standards Fallbacks
const DEFAULT_STAGE_CONFIGS: Record<string, {
  nameEn: string;
  nameKm: string;
  defaultDays: number;
  ecTarget: string;
  phTarget: string;
  irrigationGuidelineEn: string;
  irrigationGuidelineKm: string;
  keyPracticesEn: string[];
  keyPracticesKm: string[];
  color: string;
}> = {
  seedling: {
    nameEn: 'Seedling & Germination',
    nameKm: 'កូនដុះពន្លក & សាបកូន',
    defaultDays: 10,
    ecTarget: '0.8 - 1.2 mS/cm',
    phTarget: '6.0 - 6.5',
    irrigationGuidelineEn: 'Keep peat moss consistently moist with fine misting 2-3x/day.',
    irrigationGuidelineKm: 'រក្សាសំណើមជីកំប៉ុសឱ្យថេរដោយបាញ់អ័ព្ទ ២-៣ ដងក្នុងមួយថ្ងៃ។',
    keyPracticesEn: [
      'Germination trays at 28-32°C temperature',
      'Expose to morning sunlight on Day 3',
      'Mild nutrient feed at first true leaf'
    ],
    keyPracticesKm: [
      'រក្សាសីតុណ្ហភាពថាសបណ្តុះ ២៨-៣២°C',
      'បញ្ចេញហាលថ្ងៃព្រឹកនៅថ្ងៃទី ៣',
      'ស្រោចជីកម្លាំងស្រាលពេលមានស្លឹកពិតទី ១'
    ],
    color: 'emerald'
  },
  transplanting: {
    nameEn: 'Transplanting & Rooting',
    nameKm: 'ស្ទូងកូនដំណាំ & ចាក់ឫស',
    defaultDays: 8,
    ecTarget: '1.2 - 1.5 mS/cm',
    phTarget: '6.0 - 6.5',
    irrigationGuidelineEn: 'Drip 300-500 ml/bag daily; check root-zone moisture.',
    irrigationGuidelineKm: 'ស្រោចដំណក់ទឹក ៣០០-៥០០ មីលីលីត្រ/ថង់ រាល់ថ្ងៃ ពិនិត្យសំណើមឫស។',
    keyPracticesEn: [
      'Hardening seedlings 2 days prior to transplant',
      'Transplant in late afternoon or cloudy window',
      'Root stimulator and Trichoderma application'
    ],
    keyPracticesKm: [
      'បង្ហាត់កូនដំណាំឱ្យរឹងមាំ ២ ថ្ងៃមុនស្ទូង',
      'ស្ទូងពេលរសៀលត្រជាក់ ឬអាកាសធាតុស្រទុំ',
      'បញ្ចូលថ្នាំជំនួយឫស និងផ្សិតទ្រីកូឌែម៉ា'
    ],
    color: 'teal'
  },
  vine_growth: {
    nameEn: 'Vine & Foliage Growth',
    nameKm: 'ការលូតលាស់ដើម & ស្លឹក',
    defaultDays: 18,
    ecTarget: '1.5 - 1.8 mS/cm',
    phTarget: '6.0 - 6.5',
    irrigationGuidelineEn: 'Increase drip cycles to 4-5 times/day; maintain 70-80% moisture.',
    irrigationGuidelineKm: 'បង្កើនជុំស្រោចទឹក ៤-៥ ដង/ថ្ងៃ រក្សាសំណើម ៧០-៨០%។',
    keyPracticesEn: [
      'Vertical vine trellising and string clip attachment',
      'Lateral shoot pruning below node 8',
      'High-Nitrogen (N) and balanced Potassium (K) fertigation'
    ],
    keyPracticesKm: [
      'ចងដើមឡើងត្រង់តាមខ្សែ និងគៀបគន្លាស់ជ័រ',
      'កាត់ខ្នែងចំហៀងក្រោមថ្នាំងទី ៨ ចេញ',
      'បញ្ចូលជីអាសូតខ្ពស់ និងប៉ូតាស្យូមសមាមាត្រ'
    ],
    color: 'sky'
  },
  flowering: {
    nameEn: 'Flowering & Budding',
    nameKm: 'ចេញផ្កា & ក្តិប',
    defaultDays: 8,
    ecTarget: '1.8 - 2.0 mS/cm',
    phTarget: '6.2 - 6.5',
    irrigationGuidelineEn: 'Stable drip delivery; avoid overwatering to prevent floral drop.',
    irrigationGuidelineKm: 'ស្រោចទឹកថេរ ចៀសវាងសំណើមជ្រុលនាំឱ្យរលូតផ្កា។',
    keyPracticesEn: [
      'Select flower nodes 9 to 13 for retention',
      'Clean greenhouse walkways and ventilate',
      'Foliar spray Boron + Calcium for bloom vigor'
    ],
    keyPracticesKm: [
      'ជ្រើសរើសផ្កាថ្នាំងទី ៩ ដល់ ១៣ ទុកបង្កាត់',
      'សម្អាតរោងកញ្ចក់ និងបើកខ្យល់ចេញចូល',
      'បាញ់ជីបំប៉នបូរ៉ុន + កាល់ស្យូមពង្រឹងផ្កា'
    ],
    color: 'indigo'
  },
  pollination: {
    nameEn: 'Artificial Pollination',
    nameKm: 'ការបង្កាត់លម្អងផ្កា',
    defaultDays: 6,
    ecTarget: '1.8 - 2.1 mS/cm',
    phTarget: '6.2 - 6.5',
    irrigationGuidelineEn: 'Irrigate after pollination window concludes (post 11:00 AM).',
    irrigationGuidelineKm: 'ស្រោចទឹកក្រោយបញ្ចប់ការបង្កាត់លម្អង (ក្រោយម៉ោង ១១ ព្រឹក)។',
    keyPracticesEn: [
      'Hand pollination between 06:30 AM - 10:30 AM',
      'Pollinate 2-3 female flowers per vine',
      'Attach colored date tag to record pollination day'
    ],
    keyPracticesKm: [
      'បង្កាត់ដោយដៃចន្លោះម៉ោង ០៦:៣០ - ១០:៣០ ព្រឹក',
      'បង្កាត់ផ្កាញី ២-៣ ក្នុងមួយដើម',
      'ចងស្លាកពណ៌កត់ត្រាកាលបរិច្ឆេទបង្កាត់'
    ],
    color: 'amber'
  },
  fruit_development: {
    nameEn: 'Fruit Expansion & Netting',
    nameKm: 'ពង្រីកផ្លែ & បង្កើតក្រឡា',
    defaultDays: 28,
    ecTarget: '2.2 - 2.6 mS/cm',
    phTarget: '6.0 - 6.5',
    irrigationGuidelineEn: 'High water demand initially; taper down during netting crack.',
    irrigationGuidelineKm: 'តម្រូវការទឹកខ្ពស់ដំបូង រួចបន្ថយពេលផ្លែចាប់ផ្តើមប្រេះក្រឡា។',
    keyPracticesEn: [
      'Fruit thinning: retain single prime melon per plant',
      'Hang fruit with melon rope or mesh hammock',
      'Elevated Potassium (K) & Calcium (Ca) for sugar & skin netting'
    ],
    keyPracticesKm: [
      'ជ្រើសរើសផ្លែស្អាត ១ គ្រាប់ក្នុងមួយដើម',
      'ចងព្យួរផ្លែដោយខ្សែចំណង ឬថង់សំណាញ់',
      'បង្កើនជីប៉ូតាស្យូម និងកាល់ស្យូមបង្កើតក្រឡា និងផ្អែម'
    ],
    color: 'purple'
  },
  harvest: {
    nameEn: 'Ripening & Harvesting',
    nameKm: 'ទុំ & ប្រមូលផល',
    defaultDays: 8,
    ecTarget: '1.2 - 1.4 mS/cm',
    phTarget: '6.0 - 6.5',
    irrigationGuidelineEn: 'Cut irrigation by 60-80% 5-7 days before harvest for Brix sugar peak.',
    irrigationGuidelineKm: 'កាត់បន្ថយទឹក ៦០-៨០% មុនប្រមូលផល ៥-៧ ថ្ងៃ ដើម្បីប្រមូលផ្តុំជាតិស្ករ Brix។',
    keyPracticesEn: [
      'Brix refractometer sampling (target 14 - 16.5°Bx)',
      'Aroma and stem slip inspection',
      'T-stem cutting in cool early morning'
    ],
    keyPracticesKm: [
      'វាស់កម្រិតផ្អែម Brix (គោលដៅ ១៤ - ១៦.៥°Bx)',
      'ពិនិត្យក្លិនក្រអូប និងស្នាមប្រេះទង',
      'កាត់ទងផ្លែរាងអក្សរ T នៅពេលព្រលឹមត្រជាក់'
    ],
    color: 'rose'
  }
};

// Quick Custom Stage Preset Templates for Agronomists
const QUICK_STAGE_SUGGESTIONS = [
  {
    nameEn: 'Netting Crack & Ball Shading',
    nameKm: 'ប្រេះក្រឡា & បាំងស្បៃការពារផ្លែ',
    targetDays: 14,
    ecTarget: '2.4 - 2.6 mS/cm',
    phTarget: '6.0 - 6.5',
    color: 'purple',
    irrigationGuidelineEn: 'Strictly control moisture; taper drip to prevent melon skin cracking.',
    irrigationGuidelineKm: 'គ្រប់គ្រងសំណើមដីយ៉ាងម៉ត់ចត់ បន្ថយការស្រោចទឹកការពារការប្រេះបែកផ្លែ។',
    keyPracticesEn: ['Inspect netting cracks', 'Cover with fruit melon paper hat', 'High potassium and boron'],
    keyPracticesKm: ['ពិនិត្យការប្រេះក្រឡា', 'ពាក់មួកក្រដាសការពារកម្តៅថ្ងៃលើផ្លែ', 'បញ្ចូលជីប៉ូតាស្យូម និងបូរ៉ុន']
  },
  {
    nameEn: 'Vine Trellising & Clip Training',
    nameKm: 'ចងដើមតាមខ្សែ & កាត់ខ្នែង',
    targetDays: 16,
    ecTarget: '1.6 - 1.8 mS/cm',
    phTarget: '6.2 - 6.5',
    color: 'sky',
    irrigationGuidelineEn: 'Drip 800 - 1000 ml/plant daily; keep soil moisture 75%.',
    irrigationGuidelineKm: 'ស្រោចទឹក ៨០០ - ១០០០ មល/ដើម/ថ្ងៃ រក្សាសំណើម ៧៥%។',
    keyPracticesEn: ['Train main shoot to vertical twine', 'Prune laterals up to node 8', 'Foliar zinc & amino acids'],
    keyPracticesKm: ['បង្ហាត់ដើមឡើងត្រង់តាមខ្សែ', 'កាត់ខ្នែងចំហៀងក្រោមថ្នាំងទី ៨ ចេញ', 'បាញ់ជីអាស៊ីតអាមីណូ']
  },
  {
    nameEn: 'Fruit Thinning & Hammock Hanging',
    nameKm: 'ជ្រើសរើសផ្លែ & ព្យួរថង់សំណាញ់',
    targetDays: 10,
    ecTarget: '2.2 - 2.5 mS/cm',
    phTarget: '6.2 - 6.5',
    color: 'amber',
    irrigationGuidelineEn: 'Peak water uptake; supply 1.5 - 2.0 L/plant across 5 cycles.',
    irrigationGuidelineKm: 'តម្រូវការទឹកខ្ពស់ ស្រោច ១.៥ - ២.០ លីត្រ/ដើម ចែកជា ៥ ជុំ។',
    keyPracticesEn: ['Retain 1 prime melon per vine', 'Suspend fruit horizontally with cord', 'Prune remaining floral sets'],
    keyPracticesKm: ['ទុកផ្លែស្អាតបំផុត ១ គ្រាប់ក្នុងមួយដើម', 'ចងព្យួរផ្លែដោយខ្សែចំណង', 'កាត់ក្តិបដែលនៅសល់ចោល']
  },
  {
    nameEn: 'Sugar Brix Accumulation & Hardening',
    nameKm: 'ប្រមូលផ្តុំកម្រិតស្ករ Brix & បង្ហាត់ផ្លែ',
    targetDays: 10,
    ecTarget: '2.5 - 2.8 mS/cm',
    phTarget: '6.0 - 6.5',
    color: 'rose',
    irrigationGuidelineEn: 'Reduce irrigation by 50-70%; elevate EC to induce sugar concentration.',
    irrigationGuidelineKm: 'កាត់បន្ថយទឹក ៥០-៧០% ដំឡើងកំហាប់ EC ដើម្បីប្រមូលផ្តុំជាតិស្ករ។',
    keyPracticesEn: ['Refractometer random test', 'Remove lower yellowing leaves', 'Withhold excess nitrogen'],
    keyPracticesKm: ['វាស់កម្រិតផ្អែម Brix ដោយឧបករណ៍ស្ទង់', 'កាត់ស្លឹកលឿងបាតដើមចេញ', 'បញ្ឈប់ការផ្តល់ជីអាសូត']
  },
  {
    nameEn: 'Pre-Harvest Flush & EC Reduction',
    nameKm: 'បន្ថយជី & លាងដីមុនប្រមូលផល',
    targetDays: 5,
    ecTarget: '1.0 - 1.2 mS/cm',
    phTarget: '6.2 - 6.6',
    color: 'cyan',
    irrigationGuidelineEn: 'Flush substrate with clean low-EC water to purge salt buildup.',
    irrigationGuidelineKm: 'លាងស្រទាប់ដាំដុះជាមួយទឹកស្អាត EC ទាប ដើម្បីជម្រះជាតិអំបិលលើស។',
    keyPracticesEn: ['Clean water leaching', 'Check run-off EC below 1.5', 'Inspect fruit stem slip readiness'],
    keyPracticesKm: ['ស្រោចទឹកស្អាតលាងដី', 'ពិនិត្យទឹកហូរចេញ EC ក្រោម ១.៥', 'ពិនិត្យស្នាមប្រេះទងផ្លែ']
  }
];

interface StageManagementViewProps {
  initialCycleId?: string;
}

export const StageManagementView: React.FC<StageManagementViewProps> = ({ initialCycleId }) => {
  const { language } = useI18n();
  const { cropCycles, plots, cropVarieties, customStages, updateCropCycle, updatePlot } = useFarm();
  const { canEdit } = useAuth();

  // Active Selected Cycle
  const [selectedCycleId, setSelectedCycleId] = useState<string>(() => {
    if (initialCycleId && cropCycles.some((c) => c.id === initialCycleId)) {
      return initialCycleId;
    }
    const active = cropCycles.find((c) => c.status === 'active');
    return active ? active.id : (cropCycles[0]?.id || '');
  });

  // View Layout Mode
  const [viewMode, setViewMode] = useState<'detail' | 'matrix'>('detail');

  // Stage Edit Modal State
  const [editingStage, setEditingStage] = useState<{
    stage: GrowthStage;
    index: number;
  } | null>(null);

  // Add Custom Stage Modal State
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);

  // Stage Settings Modal State (Custom Stages Manager)
  const [showStageSettingsModal, setShowStageSettingsModal] = useState(false);

  // Apply Variety Preset Modal State
  const [showApplyVarietyModal, setShowApplyVarietyModal] = useState(false);

  // Delete Stage Confirmation Modal State
  const [stageToDelete, setStageToDelete] = useState<GrowthStage | null>(null);

  // Quick Notification Toast
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 3800);
  };

  const currentCycle = useMemo(() => {
    return cropCycles.find((c) => c.id === selectedCycleId) || cropCycles[0];
  }, [cropCycles, selectedCycleId]);

  const currentPlot = useMemo(() => {
    if (!currentCycle) return undefined;
    return plots.find((p) => p.id === currentCycle.plotId);
  }, [plots, currentCycle]);

  // Match variety for current crop planting
  const matchedVariety = useMemo<CropVarietyPreset | undefined>(() => {
    if (!currentCycle) return cropVarieties[0];
    const found = cropVarieties.find((v) => 
      v.nameEn.toLowerCase() === currentCycle.variety.toLowerCase() ||
      currentCycle.variety.toLowerCase().includes(v.nameEn.toLowerCase()) ||
      v.nameEn.toLowerCase().includes(currentCycle.variety.toLowerCase())
    );
    return found || cropVarieties[0];
  }, [cropVarieties, currentCycle]);

  // Resolve Stages for the current crop
  const resolvedStages = useMemo<GrowthStage[]>(() => {
    if (!currentCycle) return [];
    if (currentCycle.stages && currentCycle.stages.length > 0) {
      return currentCycle.stages;
    }

    // Dynamic generation from variety preset if cycle stages are empty
    if (matchedVariety) {
      return getStagesForVariety(matchedVariety, currentCycle.sowingDate, `stg-${currentCycle.id}`);
    }

    return [];
  }, [currentCycle, matchedVariety]);

  // Active Stage in the resolved list
  const activeStage = useMemo(() => {
    return resolvedStages.find((s) => s.status === 'current') || resolvedStages[0];
  }, [resolvedStages]);

  const activeStageIndex = useMemo(() => {
    return resolvedStages.findIndex((s) => s.id === activeStage?.id);
  }, [resolvedStages, activeStage]);

  // Count Custom vs Standard Stages
  const stageStats = useMemo(() => {
    const total = resolvedStages.length;
    const customCount = resolvedStages.filter((s) => s.isCustom).length;
    const standardCount = total - customCount;
    const completedCount = resolvedStages.filter((s) => s.status === 'completed').length;
    const totalDays = resolvedStages.reduce((sum, s) => sum + (s.targetDays || 0), 0);
    return { total, customCount, standardCount, completedCount, totalDays };
  }, [resolvedStages]);

  // Calculate Overall Cycle Progress
  const overallProgress = useMemo(() => {
    if (!resolvedStages.length) return 0;
    const completedCount = resolvedStages.filter((s) => s.status === 'completed').length;
    const currentProgress = (activeStage?.progress || 0) / 100;
    return Math.round(((completedCount + currentProgress) / resolvedStages.length) * 100);
  }, [resolvedStages, activeStage]);

  // Helper to persist updated stages to cycle and plot
  const saveStagesToCycle = (newStages: GrowthStage[], newActiveKey?: GrowthStageKey) => {
    if (!currentCycle) return;

    const lastStage = newStages[newStages.length - 1];
    const activeStg = newStages.find((s) => s.status === 'current') || newStages[0];
    const stageKeyToSet = newActiveKey || activeStg?.key || currentCycle.currentStageKey;

    const updatedCycle: CropCycle = {
      ...currentCycle,
      stages: newStages,
      currentStageKey: stageKeyToSet,
      harvestWindowStart: lastStage?.startDate || currentCycle.harvestWindowStart,
      harvestWindowEnd: lastStage?.endDate || currentCycle.harvestWindowEnd
    };

    updateCropCycle(updatedCycle);

    if (currentPlot && stageKeyToSet) {
      updatePlot({
        ...currentPlot,
        currentStage: stageKeyToSet
      });
    }
  };

  // Handler: Set Specific Stage as Active
  const handleSetActiveStageById = (stageId: string) => {
    if (!currentCycle) return;

    const targetIdx = resolvedStages.findIndex((s) => s.id === stageId);
    if (targetIdx === -1) return;

    const targetStage = resolvedStages[targetIdx];
    const updatedStages = resolvedStages.map((stage, idx) => {
      if (idx < targetIdx) {
        return { ...stage, status: 'completed' as const, progress: 100 };
      } else if (idx === targetIdx) {
        return { ...stage, status: 'current' as const, progress: stage.progress || 15 };
      } else {
        return { ...stage, status: 'upcoming' as const, progress: 0 };
      }
    });

    saveStagesToCycle(updatedStages, targetStage.key);

    showNotification(
      language === 'km' 
        ? `បានកំណត់ដំណាក់កាល "${targetStage.nameKm || targetStage.nameEn}" ជាដំណាក់កាលសកម្ម!`
        : `Activated "${targetStage.nameEn}" stage for ${currentCycle.name}!`
    );
  };

  // Handler: Advance to Next Stage
  const handleAdvanceNextStage = () => {
    if (activeStageIndex < resolvedStages.length - 1) {
      const nextStage = resolvedStages[activeStageIndex + 1];
      handleSetActiveStageById(nextStage.id);
    } else {
      showNotification(
        language === 'km' 
          ? 'ដំណាំនេះបានឈានដល់ដំណាក់កាលចុងក្រោយ (ប្រមូលផល) រួចរាល់ហើយ!' 
          : 'This crop has already reached the final Harvest stage!'
      );
    }
  };

  // Handler: Rollback to Previous Stage
  const handleRollbackPreviousStage = () => {
    if (activeStageIndex > 0) {
      const prevStage = resolvedStages[activeStageIndex - 1];
      handleSetActiveStageById(prevStage.id);
    }
  };

  // Handler: Move Stage Position Up or Down
  const handleMoveStage = (index: number, direction: 'up' | 'down') => {
    if (!currentCycle) return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= resolvedStages.length) return;

    const copy = [...resolvedStages];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;

    // Automatically re-chain dates based on new order
    const chained = calculateChainedStages(copy, currentCycle.sowingDate);
    saveStagesToCycle(chained);

    showNotification(
      language === 'km'
        ? `បានផ្លាស់ប្តូរលំដាប់ដំណាក់កាល "${temp.nameKm || temp.nameEn}"!`
        : `Reordered stage "${temp.nameEn}"!`
    );
  };

  // Handler: Update Stage Progress Directly (0-100)
  const handleUpdateStageProgress = (stageId: string, newProgress: number) => {
    if (!currentCycle) return;

    const updatedStages = resolvedStages.map((s) => {
      if (s.id === stageId) {
        const p = Math.min(100, Math.max(0, newProgress));
        const isCompleted = p >= 100;
        return {
          ...s,
          progress: p,
          status: isCompleted ? ('completed' as const) : s.status === 'upcoming' ? ('current' as const) : s.status
        };
      }
      return s;
    });

    saveStagesToCycle(updatedStages);
  };

  // Handler: Auto-Chain Stage Dates
  const handleAutoChainDates = () => {
    if (!currentCycle) return;
    const chained = calculateChainedStages(resolvedStages, currentCycle.sowingDate);
    saveStagesToCycle(chained);
    showNotification(
      language === 'km'
        ? 'បានតម្រឹមថ្ងៃកាលវិភាគស្វ័យប្រវត្តពីថ្ងៃសាបដល់ប្រមូលផល!'
        : 'Timeline dates auto-chained from sowing to harvest!'
    );
  };

  // Handler: Sync from Variety Preset
  const handleSyncFromVariety = () => {
    if (!currentCycle || !matchedVariety) return;
    const newStages = getStagesForVariety(matchedVariety, currentCycle.sowingDate, `stg-${currentCycle.id}`);
    saveStagesToCycle(newStages);
    showNotification(
      language === 'km'
        ? `បានធ្វើសមកាលកម្ម ${newStages.length} ដំណាក់កាលស្របតាមពូជ ${matchedVariety.nameKm || matchedVariety.nameEn}!`
        : `Synchronized ${newStages.length} dynamic stages from cultivar ${matchedVariety.nameEn}!`
    );
  };

  // Handler: Apply Variety Preset
  const handleApplyVarietyPreset = (variety: CropVarietyPreset) => {
    if (!currentCycle) return;
    const newStages = getStagesForVariety(variety, currentCycle.sowingDate, `stg-${currentCycle.id}`);
    const lastStage = newStages[newStages.length - 1];

    const updatedCycle: CropCycle = {
      ...currentCycle,
      variety: variety.nameEn,
      harvestWindowStart: lastStage?.startDate || currentCycle.harvestWindowStart,
      harvestWindowEnd: lastStage?.endDate || currentCycle.harvestWindowEnd,
      stages: newStages,
      currentStageKey: newStages[0]?.key
    };

    updateCropCycle(updatedCycle);

    if (currentPlot) {
      updatePlot({
        ...currentPlot,
        melonVarietyEn: variety.nameEn,
        melonVarietyKm: variety.nameKm,
        melonType: variety.category === 'specialty' ? 'cantaloupe' : (variety.category as any),
        currentStage: newStages[0]?.key
      });
    }

    setShowApplyVarietyModal(false);
    showNotification(
      language === 'km'
        ? `បានអនុវត្តគំរូពូជ "${variety.nameKm}" សម្រាប់ ${currentCycle.name}!`
        : `Applied "${variety.nameEn}" stages to ${currentCycle.name}!`
    );
  };

  // Handler: Delete Stage
  const handleConfirmDeleteStage = () => {
    if (!currentCycle || !stageToDelete) return;

    if (resolvedStages.length <= 1) {
      showNotification(
        language === 'km'
          ? 'មិនអាចលុបដំណាក់កាលទាំងអស់បានទេ! ត្រូវរក្សាទុកយ៉ាងហោច ១ ដំណាក់កាល។'
          : 'Cannot delete the only remaining stage! At least 1 stage must exist.'
      );
      setStageToDelete(null);
      return;
    }

    const filtered = resolvedStages.filter((s) => s.id !== stageToDelete.id);
    const chained = calculateChainedStages(filtered, currentCycle.sowingDate);
    saveStagesToCycle(chained);

    showNotification(
      language === 'km'
        ? `បានលុបដំណាក់កាល "${stageToDelete.nameKm || stageToDelete.nameEn}" ដោយជោគជ័យ!`
        : `Stage "${stageToDelete.nameEn}" deleted successfully!`
    );
    setStageToDelete(null);
  };

  // Handler: Save Modal Edits
  const handleSaveStageModal = (updatedStage: GrowthStage) => {
    if (!currentCycle) return;

    const updatedStages = resolvedStages.map((s) => 
      s.id === updatedStage.id ? updatedStage : s
    );

    // If target days changed, optionally re-chain dates from this stage forward
    const chained = calculateChainedStages(updatedStages, currentCycle.sowingDate);
    saveStagesToCycle(chained, updatedStage.status === 'current' ? updatedStage.key : undefined);
    setEditingStage(null);

    showNotification(
      language === 'km'
        ? `បានកែប្រែទិន្នន័យដំណាក់កាល "${updatedStage.nameKm}" ដោយជោគជ័យ!`
        : `Updated stage "${updatedStage.nameEn}" successfully!`
    );
  };

  // Helper to resolve theme styles for a stage
  const getStageTheme = (stage: GrowthStage) => {
    const colorKey = stage.color || (DEFAULT_STAGE_CONFIGS[stage.key]?.color) || 'emerald';
    return COLOR_THEMES[colorKey] || COLOR_THEMES.emerald;
  };

  return (
    <div className={`space-y-6 ${language === 'km' ? 'font-khmer' : ''}`}>
      {/* Toast Notification */}
      <AnimatePresence>
        {notificationMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-5 right-5 z-50 bg-emerald-950 text-white px-4 py-2.5 rounded-xl shadow-xl border border-emerald-700 text-xs font-bold flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{notificationMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Bar with Batch Selector & View Switcher */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 mb-1">
            <Layers className="w-4 h-4 text-emerald-600" />
            <span>{language === 'km' ? 'គ្រប់គ្រងដំណាក់កាលលូតលាស់' : 'Stage Management & Agronomic Timeline'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>{language === 'km' ? 'កាលវិភាគ & ដំណាក់កាលដំណាំនីមួយៗ (Dynamic Stages)' : 'Crop Growth Stage Management'}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            {language === 'km'
              ? 'គ្រប់គ្រង និងបន្ថែមដំណាក់កាលផ្ទាល់ខ្លួន (Custom Stages) សម្រាប់ដំណាំនីមួយៗ ដោយផ្អែកលើលក្ខណៈពិសេសនៃពូជត្រសក់ផ្អែម។ កំណត់ថ្ងៃគោលដៅ ប៉ារ៉ាម៉ែត្រ EC/pH និងតម្រឹមថ្ងៃកាលវិភាគស្វ័យប្រវត្ត។'
              : 'Configure dynamic botanical & custom growth stages tailored for each crop batch and melon variety. Calibrate durations, EC/pH targets, irrigation protocols, and re-chain dates automatically.'}
          </p>
        </div>

        {/* View Mode Toggle & Primary Add Custom Stage Action */}
        <div className="flex items-center gap-2.5 flex-wrap self-start lg:self-auto">
          {canEdit('crop_management') && (
            <>
              <button
                type="button"
                onClick={() => setShowAddCustomModal(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#164e22] hover:bg-[#123e1b] text-white shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{language === 'km' ? '+ បន្ថែមដំណាក់កាលផ្ទាល់ខ្លួន' : '+ Add Custom Stage'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowStageSettingsModal(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 hover:text-emerald-800 border border-slate-200/90 hover:border-emerald-500 shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
                title="Stage Settings / ការកំណត់ដំណាក់កាល"
              >
                <Sliders className="w-4 h-4 text-emerald-600" />
                <span>{language === 'km' ? 'ការកំណត់ដំណាក់កាល' : 'Stage Settings'}</span>
              </button>
            </>
          )}

          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200/80">
            <button
              type="button"
              onClick={() => setViewMode('detail')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'detail'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-emerald-700" />
              <span>{language === 'km' ? 'លម្អិតតាមដំណាំ' : 'Planting Detail'}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('matrix')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'matrix'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5 text-emerald-700" />
              <span>{language === 'km' ? 'តារាងគ្រប់ដំណាំ' : 'All Crops Matrix'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: DETAILED PLANTING STAGE WORKSPACE */}
      {viewMode === 'detail' && (
        <div className="space-y-6">
          {/* CROP PLANTING SELECTOR CAROUSEL / PILLS */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                <span>{language === 'km' ? 'ជ្រើសរើសវដ្តដំណាំដើម្បីគ្រប់គ្រង:' : 'Select Crop Batch to Manage:'}</span>
              </span>
              <span className="text-xs font-mono font-bold text-slate-500">
                {cropCycles.length} {language === 'km' ? 'ដំណាំ' : 'Batches'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {cropCycles.map((cycle) => {
                const plot = plots.find((p) => p.id === cycle.plotId);
                const activeStg = cycle.stages?.find((s) => s.status === 'current') || cycle.stages?.[0];
                const isSelected = cycle.id === selectedCycleId;
                const customCount = cycle.stages?.filter((s) => s.isCustom).length || 0;

                return (
                  <button
                    key={cycle.id}
                    type="button"
                    onClick={() => setSelectedCycleId(cycle.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-emerald-50/80 border-emerald-600 shadow-sm ring-2 ring-emerald-500/20'
                        : 'bg-slate-50/60 hover:bg-slate-100 border-slate-200/80 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-mono text-[10px] font-black bg-white px-1.5 py-0.2 rounded border border-slate-200 text-slate-800">
                          {cycle.batchNumber}
                        </span>
                        <div className="flex items-center gap-1">
                          {customCount > 0 && (
                            <span className="text-[9px] font-bold bg-purple-100 text-purple-700 px-1 py-0.2 rounded">
                              +{customCount} custom
                            </span>
                          )}
                          <span className={`text-[10px] font-bold uppercase px-1.5 py-0.2 rounded ${
                            cycle.status === 'active' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-slate-200 text-slate-700'
                          }`}>
                            {cycle.status}
                          </span>
                        </div>
                      </div>
                      <h4 className="text-xs font-black text-slate-900 truncate">
                        {cycle.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {cycle.variety} · {plot?.name || 'Plot'}
                      </p>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                      <span className="text-slate-400 font-semibold">
                        {language === 'km' ? 'ដំណាក់កាល:' : 'Stage:'}
                      </span>
                      <span className="font-bold text-emerald-800 bg-emerald-100/70 px-1.5 py-0.2 rounded">
                        {language === 'km' ? (activeStg?.nameKm || activeStg?.nameEn) : activeStg?.nameEn}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* DYNAMIC VARIETY STAGE CONTEXT BANNER */}
          {currentCycle && matchedVariety && (
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-white shrink-0 shadow-sm"
                  style={{ backgroundColor: matchedVariety.color || '#164e22' }}
                >
                  <Sprout className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                      {language === 'km' ? 'ពូជដំណាំគោល:' : 'Crop Variety Profile:'}
                    </span>
                    <span className="text-xs font-black text-slate-900">
                      {language === 'km' ? matchedVariety.nameKm : matchedVariety.nameEn}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 capitalize border border-slate-200">
                      {matchedVariety.category.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500 flex-wrap font-medium">
                    <span>
                      <Clock className="w-3 h-3 inline mr-1 text-slate-400" />
                      {matchedVariety.daysToMaturity} {language === 'km' ? 'ថ្ងៃដល់ប្រមូលផល' : 'days maturity'}
                    </span>
                    <span>·</span>
                    <span>
                      <Sparkles className="w-3 h-3 inline mr-1 text-amber-500" />
                      {matchedVariety.targetBrix}°Bx Brix
                    </span>
                    <span>·</span>
                    <span>
                      <Gauge className="w-3 h-3 inline mr-1 text-emerald-600" />
                      Ideal EC: {matchedVariety.idealEc} mS/cm · pH {matchedVariety.idealPh}
                    </span>
                    <span>·</span>
                    <span className="font-bold text-emerald-700">
                      {stageStats.total} {language === 'km' ? 'ដំណាក់កាល' : 'stages'} ({stageStats.customCount} {language === 'km' ? 'បន្ថែម' : 'custom'})
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons for Dynamic Variety Stages */}
              <div className="flex items-center gap-2 flex-wrap shrink-0">
                {canEdit('crop_management') && (
                  <>
                    <button
                      type="button"
                      onClick={handleAutoChainDates}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
                      title="Auto-calculate sequential dates for all stages"
                    >
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>{language === 'km' ? 'តម្រឹមថ្ងៃស្វ័យប្រវត្ត' : 'Auto-Chain Dates'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSyncFromVariety}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition-colors cursor-pointer flex items-center gap-1.5 border border-emerald-200"
                      title="Reset or synchronize stages with this variety's profile"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{language === 'km' ? 'ធ្វើសមកាលកម្មពីពូជ' : 'Sync from Variety'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowApplyVarietyModal(true)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <BookmarkPlus className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{language === 'km' ? 'ប្តូរគំរូពូជ' : 'Apply Variety Preset'}</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ACTIVE BATCH HERO CARD */}
          {currentCycle && (
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden border border-slate-800">
              <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/30 text-emerald-300 border border-emerald-400/30">
                      {currentCycle.batchNumber}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/10 text-slate-200 border border-white/10">
                      {currentPlot?.name || 'Greenhouse'}
                    </span>
                    <span className="text-xs text-emerald-300 font-medium">
                      {currentCycle.variety}
                    </span>
                    {stageStats.customCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/30 text-purple-200 border border-purple-400/30 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-purple-300" />
                        <span>{stageStats.customCount} {language === 'km' ? 'ដំណាក់កាលបន្ថែម' : 'Custom Stages'}</span>
                      </span>
                    )}
                  </div>

                  <h3 className="text-2xl font-black text-white tracking-tight">
                    {currentCycle.name}
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-white/10 text-xs">
                    <div>
                      <span className="text-slate-400 block">{language === 'km' ? 'ថ្ងៃសាប' : 'Sowing Date'}</span>
                      <span className="font-mono font-bold text-white mt-0.5 block">{currentCycle.sowingDate}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">{language === 'km' ? 'ថ្ងៃស្ទូង' : 'Transplant Date'}</span>
                      <span className="font-mono font-bold text-white mt-0.5 block">{currentCycle.transplantDate}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">{language === 'km' ? 'ប្រមូលផលរំពឹងទុក' : 'Target Harvest'}</span>
                      <span className="font-mono font-bold text-emerald-300 mt-0.5 block">{currentCycle.harvestWindowStart}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">{language === 'km' ? 'វឌ្ឍនភាពសរុប' : 'Cycle Progress'}</span>
                      <span className="font-mono font-black text-emerald-400 mt-0.5 block text-sm">{overallProgress}%</span>
                    </div>
                  </div>
                </div>

                {/* Right: Active Stage Focus & Action Buttons */}
                <div className="bg-white/10 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/15 flex flex-col justify-between shrink-0 min-w-[280px]">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider block">
                      {language === 'km' ? 'ដំណាក់កាលសកម្មបច្ចុប្បន្ន' : 'Current Active Stage'}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      <h4 className="text-lg font-black text-white">
                        {language === 'km' ? (activeStage?.nameKm || activeStage?.nameEn) : activeStage?.nameEn}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">
                      {activeStage?.startDate} → {activeStage?.endDate} ({activeStage?.targetDays} {language === 'km' ? 'ថ្ងៃ' : 'days'})
                    </p>

                    {/* Progress Bar for Active Stage */}
                    <div className="mt-3">
                      <div className="flex justify-between text-[11px] mb-1 font-mono">
                        <span className="text-slate-300">{language === 'km' ? 'វឌ្ឍនភាពដំណាក់កាល:' : 'Stage Progress:'}</span>
                        <span className="text-emerald-300 font-bold">{activeStage?.progress || 0}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/20 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-300"
                          style={{ width: `${activeStage?.progress || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Advance Stage Control */}
                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2">
                    <button
                      type="button"
                      disabled={!canEdit('crop_management') || activeStageIndex <= 0}
                      onClick={handleRollbackPreviousStage}
                      className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                      title="Rollback to previous stage"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      disabled={!canEdit('crop_management') || activeStageIndex >= resolvedStages.length - 1}
                      onClick={handleAdvanceNextStage}
                      className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <span>{language === 'km' ? 'ឈានទៅដំណាក់កាលបន្ទាប់' : 'Advance Next Stage'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DYNAMIC GROWTH STAGES TIMELINE CARDS */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-700" />
                  <span>
                    {language === 'km' 
                      ? `ដំណាក់កាលលូតលាស់នៃដំណាំ (${stageStats.total} ដំណាក់កាល)` 
                      : `Botanical & Custom Growth Stages (${stageStats.total} Stages)`}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {language === 'km' 
                    ? 'កំណត់ដំណាក់កាលសកម្ម កែសម្រួលកាលវិភាគ បន្ថែមដំណាក់កាលផ្ទាល់ខ្លួន ឬរៀបចំលំដាប់ឡើងចុះ។' 
                    : 'Activate, adjust days, reorder, delete or add custom stages tailored for this crop cultivar.'}
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs flex-wrap">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>{language === 'km' ? 'បានបញ្ចប់' : 'Completed'}</span>
                </span>
                <span className="flex items-center gap-1.5 text-slate-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                  <span>{language === 'km' ? 'កំពុងសកម្ម' : 'Active'}</span>
                </span>
                <span className="flex items-center gap-1.5 text-slate-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                  <span>{language === 'km' ? 'ខាងមុខ' : 'Upcoming'}</span>
                </span>
                {stageStats.customCount > 0 && (
                  <span className="flex items-center gap-1.5 text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                    <Sparkles className="w-3 h-3 text-purple-600" />
                    <span>{stageStats.customCount} Custom</span>
                  </span>
                )}
              </div>
            </div>

            {/* Stages Stack Cards */}
            <div className="space-y-3.5">
              {resolvedStages.map((stage, idx) => {
                const defaultConf = DEFAULT_STAGE_CONFIGS[stage.key] || DEFAULT_STAGE_CONFIGS.seedling;
                const ecTarget = stage.ecTarget || defaultConf.ecTarget;
                const phTarget = stage.phTarget || defaultConf.phTarget;
                const irrigationGuidelineEn = stage.irrigationGuidelineEn || defaultConf.irrigationGuidelineEn;
                const irrigationGuidelineKm = stage.irrigationGuidelineKm || defaultConf.irrigationGuidelineKm;
                const theme = getStageTheme(stage);
                const isCurrent = stage.status === 'current';
                const isCompleted = stage.status === 'completed';

                return (
                  <div
                    key={stage.id}
                    className={`bg-white rounded-2xl border transition-all overflow-hidden ${
                      isCurrent
                        ? `${theme.borderActive} shadow-md ring-2 ${theme.ringColor}/20`
                        : isCompleted
                          ? 'border-emerald-200/90 shadow-2xs bg-emerald-50/20'
                          : 'border-slate-200/80 shadow-2xs hover:border-slate-300'
                    }`}
                  >
                    <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left: Stage Index, Title & Badge */}
                      <div className="flex items-start sm:items-center gap-3.5">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-2xs ${
                          isCompleted
                            ? 'bg-emerald-600 text-white'
                            : isCurrent
                              ? 'bg-slate-900 text-white ring-4 ring-emerald-500/30'
                              : 'bg-slate-100 text-slate-500'
                        }`}>
                          {isCompleted ? <Check className="w-5 h-5 stroke-[2.5]" /> : idx + 1}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm sm:text-base font-black text-slate-900">
                              {language === 'km' ? (stage.nameKm || stage.nameEn) : stage.nameEn}
                            </h4>

                            {stage.isCustom && (
                              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-300 flex items-center gap-1 shadow-2xs">
                                <Sparkles className="w-3 h-3 text-purple-600" />
                                <span>{language === 'km' ? 'ដំណាក់កាលផ្ទាល់ខ្លួន' : 'Custom Stage'}</span>
                              </span>
                            )}

                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                              isCompleted
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                : isCurrent
                                  ? 'bg-blue-100 text-blue-800 border-blue-300 animate-pulse'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                              {isCompleted 
                                ? (language === 'km' ? '✓ បានបញ្ចប់' : '✓ Completed') 
                                : isCurrent 
                                  ? (language === 'km' ? '● កំពុងសកម្ម' : '● Active') 
                                  : (language === 'km' ? '○ ខាងមុខ' : '○ Upcoming')}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 font-medium">
                            <span className="flex items-center gap-1 font-mono text-slate-700">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              {stage.startDate} → {stage.endDate}
                            </span>
                            <span>·</span>
                            <span className="flex items-center gap-1 text-slate-700 font-semibold">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              {stage.targetDays} {language === 'km' ? 'ថ្ងៃ' : 'days target'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Middle: Agronomic Targets (EC / pH / Irrigation) */}
                      <div className="bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200/60 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs lg:max-w-md w-full">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block uppercase">EC Target</span>
                          <span className="font-mono font-bold text-slate-800">{ecTarget}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block uppercase">pH Target</span>
                          <span className="font-mono font-bold text-slate-800">{phTarget}</span>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <span className="text-[10px] text-slate-400 font-bold block uppercase">{language === 'km' ? 'វឌ្ឍនភាព' : 'Progress'}</span>
                          <span className="font-mono font-bold text-emerald-800">{stage.progress}%</span>
                        </div>
                      </div>

                      {/* Right: Stage Control Buttons & Reordering */}
                      <div className="flex items-center gap-1.5 self-end lg:self-center shrink-0 flex-wrap">
                        {canEdit('crop_management') && (
                          <>
                            {/* Reorder Buttons */}
                            <div className="flex items-center bg-slate-100 rounded-xl p-0.5 border border-slate-200">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveStage(idx, 'up')}
                                className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                                title="Move Stage Up"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === resolvedStages.length - 1}
                                onClick={() => handleMoveStage(idx, 'down')}
                                className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                                title="Move Stage Down"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {!isCurrent && (
                              <button
                                type="button"
                                onClick={() => handleSetActiveStageById(stage.id)}
                                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer flex items-center gap-1"
                              >
                                <FastForward className="w-3 h-3 text-emerald-700" />
                                <span>{language === 'km' ? 'កំណត់ជាសកម្ម' : 'Set Active'}</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => setEditingStage({ stage, index: idx })}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50 transition-all cursor-pointer flex items-center gap-1"
                            >
                              <Edit3 className="w-3 h-3 text-slate-500" />
                              <span>{language === 'km' ? 'កែសម្រួល' : 'Edit'}</span>
                            </button>

                            {/* Delete Stage Button */}
                            <button
                              type="button"
                              onClick={() => setStageToDelete(stage)}
                              className="p-1.5 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all cursor-pointer"
                              title="Delete this growth stage"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Stage Progress Slider & Key Agronomic Protocol Guide */}
                    <div className="px-4 sm:px-5 py-3 bg-slate-50/70 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      {/* Left: Agronomic Instruction snippet */}
                      <div className="flex items-center gap-2 text-slate-600 text-[11px] max-w-xl">
                        <Droplets className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="line-clamp-1">
                          {language === 'km' ? irrigationGuidelineKm : irrigationGuidelineEn}
                        </span>
                      </div>

                      {/* Right: Quick Progress Adjuster */}
                      {canEdit('crop_management') && (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {language === 'km' ? 'លៃតម្រូវ %:' : 'Adjust %:'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateStageProgress(stage.id, (stage.progress || 0) - 10)}
                            className="w-6 h-6 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 font-bold text-slate-700 flex items-center justify-center cursor-pointer shadow-2xs"
                          >
                            -
                          </button>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={stage.progress || 0}
                            onChange={(e) => handleUpdateStageProgress(stage.id, parseInt(e.target.value, 10))}
                            className="w-24 accent-emerald-600 cursor-pointer"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateStageProgress(stage.id, (stage.progress || 0) + 10)}
                            className="w-6 h-6 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 font-bold text-slate-700 flex items-center justify-center cursor-pointer shadow-2xs"
                          >
                            +
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateStageProgress(stage.id, 100)}
                            className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 hover:bg-emerald-200 text-emerald-800 cursor-pointer"
                          >
                            100%
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: MULTI-CROP STAGE MATRIX TABLE */}
      {viewMode === 'matrix' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">
                {language === 'km' ? 'តារាងប្រៀបធៀបដំណាក់កាលគ្រប់វដ្តដំណាំ' : 'All Crop Batches Stage Progression Matrix'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === 'km' 
                  ? 'តាមដានស្ថានភាពដំណាក់កាលលូតលាស់នៃគ្រប់រោងកញ្ចក់ក្នុងចំការក្នុងពេលដំណាលគ្នា' 
                  : 'Holistic overview of active growth stages across all greenhouses and open fields.'}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">{language === 'km' ? 'វដ្តដំណាំ' : 'Crop Batch'}</th>
                  <th className="py-3 px-4">{language === 'km' ? 'ទីតាំងរោង' : 'Plot / Greenhouse'}</th>
                  <th className="py-3 px-4">{language === 'km' ? 'ពូជត្រសក់' : 'Cultivar'}</th>
                  <th className="py-3 px-4">{language === 'km' ? 'ដំណាក់កាលសកម្ម' : 'Active Stage'}</th>
                  <th className="py-3 px-4">{language === 'km' ? 'វឌ្ឍនភាព' : 'Progress'}</th>
                  <th className="py-3 px-4">{language === 'km' ? 'ថ្ងៃប្រមូលផល' : 'Harvest Window'}</th>
                  <th className="py-3 px-4 text-right">{language === 'km' ? 'សកម្មភាព' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {cropCycles.map((cycle) => {
                  const plot = plots.find((p) => p.id === cycle.plotId);
                  const activeStg = cycle.stages?.find((s) => s.status === 'current') || cycle.stages?.[0];
                  const completedCount = cycle.stages?.filter((s) => s.status === 'completed').length || 0;
                  const totalStgs = cycle.stages?.length || 7;
                  const percent = Math.round((completedCount / totalStgs) * 100);
                  const customStgsCount = cycle.stages?.filter((s) => s.isCustom).length || 0;

                  return (
                    <tr key={cycle.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <Sprout className="w-4 h-4 text-emerald-700" />
                          <div>
                            <span className="block font-black">{cycle.name}</span>
                            <span className="font-mono text-[10px] text-slate-400">{cycle.batchNumber}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800">{plot?.name || 'Plot'}</span>
                        <span className="block text-[10px] text-slate-400 capitalize">{plot?.facilityType?.replace('_', ' ') || 'net house'}</span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-emerald-800">
                        <span>{cycle.variety}</span>
                        {customStgsCount > 0 && (
                          <span className="ml-1 text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-700">
                            +{customStgsCount} custom
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-xs bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          {language === 'km' ? (activeStg?.nameKm || activeStg?.nameEn) : activeStg?.nameEn}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="w-24">
                          <div className="flex justify-between text-[10px] font-mono text-slate-500 mb-1">
                            <span>{completedCount}/{totalStgs}</span>
                            <span>{percent}%</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div className="h-full bg-emerald-600" style={{ width: `${percent}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                        {cycle.harvestWindowStart}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCycleId(cycle.id);
                            setViewMode('detail');
                          }}
                          className="px-3 py-1 rounded-lg text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 transition-colors cursor-pointer"
                        >
                          {language === 'km' ? 'គ្រប់គ្រង' : 'Manage'}
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

      {/* ========================================================= */}
      {/* MODAL 1: ADD CUSTOM STAGE                                 */}
      {/* ========================================================= */}
      {showAddCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-1.5">
                    <span>{language === 'km' ? 'បន្ថែមដំណាក់កាលផ្ទាល់ខ្លួន (Custom Stage)' : 'Add Custom Growth Stage'}</span>
                    <Sparkles className="w-4 h-4 text-purple-600" />
                  </h3>
                  <p className="text-xs text-slate-500">
                    {currentCycle?.name} ({currentCycle?.variety})
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAddCustomModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Suggestions Chips */}
            <div className="p-4 bg-purple-50/50 border-b border-purple-100 text-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-purple-900 text-[11px] uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>{language === 'km' ? 'គំរូដំណាក់កាលផ្ទាល់ខ្លួន (ចុចដើម្បីបំពេញស្វ័យប្រវត្ត):' : 'Custom Stage Presets (Click to autofill):'}</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddCustomModal(false);
                    setShowStageSettingsModal(true);
                  }}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200"
                >
                  <Sliders className="w-3 h-3 text-emerald-600" />
                  <span>{language === 'km' ? 'គ្រប់គ្រងគំរូដំណាក់កាល' : 'Manage Stage Settings'}</span>
                </button>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {customStages.map((sug) => (
                  <button
                    key={sug.id}
                    type="button"
                    onClick={() => {
                      const form = document.getElementById('addCustomStageForm') as HTMLFormElement;
                      if (!form) return;
                      (form.elements.namedItem('nameEn') as HTMLInputElement).value = sug.nameEn;
                      (form.elements.namedItem('nameKm') as HTMLInputElement).value = sug.nameKm;
                      (form.elements.namedItem('targetDays') as HTMLInputElement).value = String(sug.defaultDays);
                      (form.elements.namedItem('ecTarget') as HTMLInputElement).value = sug.ecTarget || '2.0 - 2.4 mS/cm';
                      (form.elements.namedItem('phTarget') as HTMLInputElement).value = sug.phTarget || '6.0 - 6.5';
                      (form.elements.namedItem('color') as HTMLSelectElement).value = sug.color || 'purple';
                      (form.elements.namedItem('irrigationGuidelineEn') as HTMLInputElement).value = sug.irrigationGuidelineEn || '';
                      (form.elements.namedItem('irrigationGuidelineKm') as HTMLInputElement).value = sug.irrigationGuidelineKm || '';
                      (form.elements.namedItem('notesEn') as HTMLTextAreaElement).value = sug.notesEn || '';
                      (form.elements.namedItem('notesKm') as HTMLTextAreaElement).value = sug.notesKm || '';
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white border border-purple-200 text-purple-800 hover:bg-purple-100 text-[11px] font-semibold transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
                  >
                    + {language === 'km' ? sug.nameKm : sug.nameEn}
                  </button>
                ))}
              </div>
            </div>

            {/* Form */}
            <form
              id="addCustomStageForm"
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const nameEn = (form.elements.namedItem('nameEn') as HTMLInputElement).value.trim();
                const nameKm = (form.elements.namedItem('nameKm') as HTMLInputElement).value.trim() || nameEn;
                const targetDays = parseInt((form.elements.namedItem('targetDays') as HTMLInputElement).value, 10) || 7;
                const position = (form.elements.namedItem('position') as HTMLSelectElement).value;
                const relativeStageId = (form.elements.namedItem('relativeStageId') as HTMLSelectElement)?.value;
                const ecTarget = (form.elements.namedItem('ecTarget') as HTMLInputElement).value.trim() || '2.0 - 2.4 mS/cm';
                const phTarget = (form.elements.namedItem('phTarget') as HTMLInputElement).value.trim() || '6.0 - 6.5';
                const color = (form.elements.namedItem('color') as HTMLSelectElement).value;
                const irrigationGuidelineEn = (form.elements.namedItem('irrigationGuidelineEn') as HTMLInputElement).value.trim();
                const irrigationGuidelineKm = (form.elements.namedItem('irrigationGuidelineKm') as HTMLInputElement).value.trim();
                const notesEn = (form.elements.namedItem('notesEn') as HTMLTextAreaElement).value.trim();
                const notesKm = (form.elements.namedItem('notesKm') as HTMLTextAreaElement).value.trim();
                const status = (form.elements.namedItem('status') as HTMLSelectElement).value as any;

                const stageKey = `custom_${nameEn.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`;

                const newStage: GrowthStage = {
                  id: `stg-custom-${Date.now()}`,
                  key: stageKey,
                  nameEn,
                  nameKm,
                  startDate: currentCycle?.sowingDate || '',
                  endDate: currentCycle?.sowingDate || '',
                  targetDays,
                  status,
                  progress: status === 'completed' ? 100 : 0,
                  isCustom: true,
                  color,
                  ecTarget,
                  phTarget,
                  irrigationGuidelineEn,
                  irrigationGuidelineKm,
                  notesEn,
                  notesKm
                };

                // Position insertion logic
                let updated = [...resolvedStages];
                if (position === 'start') {
                  updated.unshift(newStage);
                } else if (position === 'end') {
                  updated.push(newStage);
                } else if (position === 'before_harvest') {
                  const harvestIdx = updated.findIndex((s) => s.key === 'harvest' || s.nameEn.toLowerCase().includes('harvest'));
                  if (harvestIdx !== -1) {
                    updated.splice(harvestIdx, 0, newStage);
                  } else {
                    updated.push(newStage);
                  }
                } else if (position === 'after' && relativeStageId) {
                  const idx = updated.findIndex((s) => s.id === relativeStageId);
                  if (idx !== -1) {
                    updated.splice(idx + 1, 0, newStage);
                  } else {
                    updated.push(newStage);
                  }
                } else {
                  updated.push(newStage);
                }

                // Automatically re-chain dates
                const chained = calculateChainedStages(updated, currentCycle?.sowingDate || '');
                saveStagesToCycle(chained);
                setShowAddCustomModal(false);

                showNotification(
                  language === 'km'
                    ? `បានបន្ថែមដំណាក់កាលថ្មី "${newStage.nameKm}" ដោយជោគជ័យ!`
                    : `Added custom stage "${newStage.nameEn}" successfully!`
                );
              }}
              className="p-5 overflow-y-auto space-y-4 text-xs"
            >
              {/* Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Stage Name (English) *
                  </label>
                  <input
                    type="text"
                    name="nameEn"
                    placeholder="e.g. Netting Development, Ball Shading..."
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1 font-khmer">
                    ឈ្មោះដំណាក់កាល (ភាសាខ្មែរ)
                  </label>
                  <input
                    type="text"
                    name="nameKm"
                    placeholder="ឧ. បង្កើតក្រឡាសំបក & បាំងស្បៃការពារ..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold font-khmer"
                  />
                </div>
              </div>

              {/* Target Days & Insertion Position */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'km' ? 'ចំនួនថ្ងៃគោលដៅ (Target Days)' : 'Target Days (Duration)'} *
                  </label>
                  <input
                    type="number"
                    name="targetDays"
                    defaultValue={10}
                    min="1"
                    max="100"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'km' ? 'ទីតាំងបញ្ចូលក្នុងកាលវិភាគ' : 'Insertion Position'}
                  </label>
                  <select
                    name="position"
                    defaultValue="before_harvest"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    <option value="before_harvest">{language === 'km' ? 'មុនពេលប្រមូលផល (Before Harvest)' : 'Before Harvest Stage'}</option>
                    <option value="after">{language === 'km' ? 'បន្ទាប់ពីដំណាក់កាលជាក់លាក់ (After Specific Stage)' : 'After Specific Stage...'}</option>
                    <option value="start">{language === 'km' ? 'នៅខាងដើមដំបូង (At Beginning)' : 'At the Very Beginning'}</option>
                    <option value="end">{language === 'km' ? 'នៅខាងចុងបំផុត (At the End)' : 'At the End'}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'km' ? 'បន្ទាប់ពីដំណាក់កាលណា' : 'Insert After'}
                  </label>
                  <select
                    name="relativeStageId"
                    defaultValue={resolvedStages[resolvedStages.length - 2]?.id}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    {resolvedStages.map((s, sIdx) => (
                      <option key={s.id} value={s.id}>
                        {sIdx + 1}. {s.nameEn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Agronomic Targets & Color Accent */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    EC Target (mS/cm)
                  </label>
                  <input
                    type="text"
                    name="ecTarget"
                    defaultValue="2.0 - 2.4 mS/cm"
                    placeholder="e.g. 2.2 - 2.6 mS/cm"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    pH Target
                  </label>
                  <input
                    type="text"
                    name="phTarget"
                    defaultValue="6.0 - 6.5"
                    placeholder="e.g. 6.2 - 6.5"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'km' ? 'ពណ៌សម្គាល់' : 'Color Theme'}
                  </label>
                  <select
                    name="color"
                    defaultValue="purple"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    {Object.entries(COLOR_THEMES).map(([k, c]) => (
                      <option key={k} value={k}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Initial Status */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'km' ? 'ស្ថានភាពចាប់ផ្តើម' : 'Initial Status'}
                </label>
                <select
                  name="status"
                  defaultValue="upcoming"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                >
                  <option value="upcoming">{language === 'km' ? 'ខាងមុខ (Upcoming)' : 'Upcoming'}</option>
                  <option value="current">{language === 'km' ? 'កំពុងសកម្ម (Current Active)' : 'Current (Active)'}</option>
                  <option value="completed">{language === 'km' ? 'បានបញ្ចប់ (Completed)' : 'Completed'}</option>
                </select>
              </div>

              {/* Irrigation Guidelines */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Irrigation Guideline (English)
                  </label>
                  <input
                    type="text"
                    name="irrigationGuidelineEn"
                    placeholder="e.g. Reduce drip by 50% to prevent fruit splitting..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1 font-khmer">
                    ការណែនាំស្រោចទឹក (ភាសាខ្មែរ)
                  </label>
                  <input
                    type="text"
                    name="irrigationGuidelineKm"
                    placeholder="ឧ. បន្ថយការស្រោចទឹក ៥០% ការពារការប្រេះបែកផ្លែ..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-khmer"
                  />
                </div>
              </div>

              {/* Agronomic Protocol Notes */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Agronomic Protocol & Practices (English)
                </label>
                <textarea
                  name="notesEn"
                  rows={2}
                  placeholder="Specific tasks, nutrient formula, pruning, shade adjustments..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 font-khmer">
                  ពិធីការថែទាំ & កំណត់ចំណាំកសិកម្ម (ភាសាខ្មែរ)
                </label>
                <textarea
                  name="notesKm"
                  rows={2}
                  placeholder="ការណែនាំអំពីការបញ្ចូលជី កាត់ខ្នែង ឬបាំងស្បៃការពារ..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-khmer"
                />
              </div>

              {/* Footer Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddCustomModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  {language === 'km' ? 'បោះបង់' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#164e22] hover:bg-[#123e1b] text-white font-bold rounded-xl shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>{language === 'km' ? 'រក្សាទុកដំណាក់កាលថ្មី' : 'Save Custom Stage'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: EDIT GROWTH STAGE PARAMETERS                     */}
      {/* ========================================================= */}
      {editingStage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    {language === 'km' ? 'កែប្រែដំណាក់កាលលូតលាស់' : 'Edit Growth Stage'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {currentCycle?.name} · {editingStage.stage.nameEn}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingStage(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const updated: GrowthStage = {
                  ...editingStage.stage,
                  nameEn: (form.elements.namedItem('nameEn') as HTMLInputElement).value,
                  nameKm: (form.elements.namedItem('nameKm') as HTMLInputElement).value,
                  startDate: (form.elements.namedItem('startDate') as HTMLInputElement).value,
                  endDate: (form.elements.namedItem('endDate') as HTMLInputElement).value,
                  targetDays: parseInt((form.elements.namedItem('targetDays') as HTMLInputElement).value, 10) || 10,
                  status: (form.elements.namedItem('status') as HTMLSelectElement).value as any,
                  progress: parseInt((form.elements.namedItem('progress') as HTMLInputElement).value, 10) || 0,
                  ecTarget: (form.elements.namedItem('ecTarget') as HTMLInputElement).value,
                  phTarget: (form.elements.namedItem('phTarget') as HTMLInputElement).value,
                  color: (form.elements.namedItem('color') as HTMLSelectElement).value,
                  irrigationGuidelineEn: (form.elements.namedItem('irrigationGuidelineEn') as HTMLInputElement).value,
                  irrigationGuidelineKm: (form.elements.namedItem('irrigationGuidelineKm') as HTMLInputElement).value,
                  notesEn: (form.elements.namedItem('notesEn') as HTMLTextAreaElement).value,
                  notesKm: (form.elements.namedItem('notesKm') as HTMLTextAreaElement).value
                };
                handleSaveStageModal(updated);
              }}
              className="p-5 overflow-y-auto space-y-4 text-xs"
            >
              {/* Names */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Stage Name (English)
                  </label>
                  <input
                    type="text"
                    name="nameEn"
                    defaultValue={editingStage.stage.nameEn}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1 font-khmer">
                    ឈ្មោះដំណាក់កាល (ភាសាខ្មែរ)
                  </label>
                  <input
                    type="text"
                    name="nameKm"
                    defaultValue={editingStage.stage.nameKm}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold font-khmer"
                  />
                </div>
              </div>

              {/* Dates & Target Days */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'km' ? 'ថ្ងៃចាប់ផ្តើម' : 'Start Date'}
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    defaultValue={editingStage.stage.startDate}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'km' ? 'ថ្ងៃបញ្ចប់' : 'End Date'}
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    defaultValue={editingStage.stage.endDate}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'km' ? 'ចំនួនថ្ងៃគោលដៅ' : 'Target Days'}
                  </label>
                  <input
                    type="number"
                    name="targetDays"
                    defaultValue={editingStage.stage.targetDays}
                    min="1"
                    max="100"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs font-semibold"
                  />
                </div>
              </div>

              {/* EC & pH Targets & Color Theme */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    EC Target
                  </label>
                  <input
                    type="text"
                    name="ecTarget"
                    defaultValue={editingStage.stage.ecTarget || DEFAULT_STAGE_CONFIGS[editingStage.stage.key]?.ecTarget || '1.8 - 2.2 mS/cm'}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    pH Target
                  </label>
                  <input
                    type="text"
                    name="phTarget"
                    defaultValue={editingStage.stage.phTarget || DEFAULT_STAGE_CONFIGS[editingStage.stage.key]?.phTarget || '6.0 - 6.5'}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Color Accent
                  </label>
                  <select
                    name="color"
                    defaultValue={editingStage.stage.color || DEFAULT_STAGE_CONFIGS[editingStage.stage.key]?.color || 'emerald'}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    {Object.entries(COLOR_THEMES).map(([k, c]) => (
                      <option key={k} value={k}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status & Progress */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'km' ? 'ស្ថានភាព' : 'Status'}
                  </label>
                  <select
                    name="status"
                    defaultValue={editingStage.stage.status}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    <option value="upcoming">{language === 'km' ? 'ខាងមុខ (Upcoming)' : 'Upcoming'}</option>
                    <option value="current">{language === 'km' ? 'កំពុងសកម្ម (Current)' : 'Current (Active)'}</option>
                    <option value="completed">{language === 'km' ? 'បានបញ្ចប់ (Completed)' : 'Completed'}</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'km' ? 'វឌ្ឍនភាព (%)' : 'Progress (%)'}
                  </label>
                  <input
                    type="number"
                    name="progress"
                    defaultValue={editingStage.stage.progress || 0}
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Irrigation Guidelines */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Irrigation Guideline (EN)
                  </label>
                  <input
                    type="text"
                    name="irrigationGuidelineEn"
                    defaultValue={editingStage.stage.irrigationGuidelineEn || ''}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1 font-khmer">
                    ការណែនាំស្រោចទឹក (KM)
                  </label>
                  <input
                    type="text"
                    name="irrigationGuidelineKm"
                    defaultValue={editingStage.stage.irrigationGuidelineKm || ''}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-khmer"
                  />
                </div>
              </div>

              {/* Agronomic Notes */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Agronomic Notes & Protocol (English)
                </label>
                <textarea
                  name="notesEn"
                  defaultValue={editingStage.stage.notesEn}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  placeholder="Specific fertigation, pruning, or pollination guidelines..."
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 font-khmer">
                  កំណត់ចំណាំកសិកម្ម & ពិធីការថែទាំ (ភាសាខ្មែរ)
                </label>
                <textarea
                  name="notesKm"
                  defaultValue={editingStage.stage.notesKm}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-khmer"
                  placeholder="ការណែនាំអំពីការស្រោចទឹក បញ្ចូលជី កាត់ខ្នែង..."
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingStage(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  {language === 'km' ? 'បោះបង់' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#164e22] hover:bg-[#123e1b] text-white font-bold rounded-xl shadow-sm cursor-pointer"
                >
                  {language === 'km' ? 'រក្សាទុកការកែប្រែ' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: APPLY VARIETY PRESET TEMPLATE                    */}
      {/* ========================================================= */}
      {showApplyVarietyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <BookmarkPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    {language === 'km' ? 'ជ្រើសរើសគំរូពូជត្រសក់ផ្អែម' : 'Apply Variety Growth Template'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {language === 'km' 
                      ? 'កំណត់ដំណាក់កាលលូតលាស់នៃដំណាំនេះឱ្យស្របតាមពូជថ្មី' 
                      : `Adapt botanical stages & durations for ${currentCycle?.name}`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowApplyVarietyModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List of Varieties */}
            <div className="p-5 overflow-y-auto space-y-3">
              {cropVarieties.map((variety) => {
                const isSelected = matchedVariety?.id === variety.id;
                const stagesCount = variety.stages?.length || 7;

                return (
                  <div
                    key={variety.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span 
                          className="w-3 h-3 rounded-full shrink-0" 
                          style={{ backgroundColor: variety.color || '#164e22' }} 
                        />
                        <h4 className="text-sm font-black text-slate-900">
                          {language === 'km' ? variety.nameKm : variety.nameEn}
                        </h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 capitalize">
                          {variety.category.replace('_', ' ')}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            {language === 'km' ? 'ពូជបច្ចុប្បន្ន' : 'Current Variety'}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-500 max-w-md line-clamp-1">
                        {language === 'km' ? variety.descriptionKm : variety.descriptionEn}
                      </p>

                      <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-600 font-medium">
                        <span>
                          <Clock className="w-3 h-3 inline mr-1 text-slate-400" />
                          {variety.daysToMaturity} {language === 'km' ? 'ថ្ងៃ' : 'days'}
                        </span>
                        <span>·</span>
                        <span>
                          <Sparkles className="w-3 h-3 inline mr-1 text-amber-500" />
                          {variety.targetBrix}°Bx
                        </span>
                        <span>·</span>
                        <span>
                          <Layers className="w-3 h-3 inline mr-1 text-emerald-600" />
                          {stagesCount} {language === 'km' ? 'ដំណាក់កាល' : 'stages'}
                        </span>
                        <span>·</span>
                        <span>
                          EC {variety.idealEc} · pH {variety.idealPh}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleApplyVarietyPreset(variety)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-[#164e22] hover:bg-[#123e1b] text-white shadow-2xs transition-colors cursor-pointer shrink-0"
                    >
                      {language === 'km' ? 'អនុវត្តគំរូនេះ' : 'Apply Template'}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setShowApplyVarietyModal(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs cursor-pointer"
              >
                {language === 'km' ? 'បិទ' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: DELETE STAGE CONFIRMATION DIALOG                 */}
      {/* ========================================================= */}
      {stageToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 text-center animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>

            <h3 className="font-extrabold text-slate-900 text-base mb-1">
              {language === 'km' ? 'តើអ្នកប្រាកដជាចង់លុបដំណាក់កាលនេះ?' : 'Delete Growth Stage?'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {language === 'km'
                ? `ដំណាក់កាល "${stageToDelete.nameKm || stageToDelete.nameEn}" នឹងត្រូវដកចេញពីវដ្តដំណាំនេះ ហើយកាលវិភាគនឹងត្រូវតម្រឹមឡើងវិញដោយស្វ័យប្រវត្ត។`
                : `Stage "${stageToDelete.nameEn}" (${stageToDelete.targetDays} days) will be removed and subsequent timeline dates will be automatically recalculated.`}
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setStageToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-colors"
              >
                {language === 'km' ? 'បោះបង់' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteStage}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer shadow-sm transition-colors"
              >
                {language === 'km' ? 'យល់ព្រមលុប' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 5: STAGE SETTINGS (CUSTOM STAGES MANAGER)           */}
      {/* ========================================================= */}
      <StageSettingsModal
        isOpen={showStageSettingsModal}
        onClose={() => setShowStageSettingsModal(false)}
      />
    </div>
  );
};
