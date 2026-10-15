import { GrowthStage } from '../types/melon';

export interface GrowthStagePreset {
  id: string;
  key: string;
  nameEn: string;
  nameKm: string;
  defaultDays: number;
  color: string;
  ecTarget?: string;
  phTarget?: string;
  irrigationGuidelineEn?: string;
  irrigationGuidelineKm?: string;
  notesEn?: string;
  notesKm?: string;
  keyPracticesEn?: string[];
  keyPracticesKm?: string[];
  iconName?: string;
  isCustom?: boolean;
  category?: 'botanical' | 'custom' | string;
}

export type CustomStagePreset = GrowthStagePreset;

export const STAGE_COLOR_THEMES: Record<string, {
  name: string;
  badgeBg: string;
  badgeText: string;
  ringColor: string;
  dotBg: string;
  borderActive: string;
  accentBg: string;
  hex: string;
}> = {
  emerald: {
    name: 'Emerald Green',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-800',
    ringColor: 'ring-emerald-500',
    dotBg: 'bg-emerald-500',
    borderActive: 'border-emerald-600',
    accentBg: 'bg-emerald-600',
    hex: '#059669',
  },
  teal: {
    name: 'Teal (Aqua)',
    badgeBg: 'bg-teal-100',
    badgeText: 'text-teal-800',
    ringColor: 'ring-teal-500',
    dotBg: 'bg-teal-500',
    borderActive: 'border-teal-600',
    accentBg: 'bg-teal-600',
    hex: '#0d9488',
  },
  sky: {
    name: 'Sky Blue',
    badgeBg: 'bg-sky-100',
    badgeText: 'text-sky-800',
    ringColor: 'ring-sky-500',
    dotBg: 'bg-sky-500',
    borderActive: 'border-sky-600',
    accentBg: 'bg-sky-600',
    hex: '#0284c7',
  },
  indigo: {
    name: 'Indigo Blue',
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-800',
    ringColor: 'ring-indigo-500',
    dotBg: 'bg-indigo-500',
    borderActive: 'border-indigo-600',
    accentBg: 'bg-indigo-600',
    hex: '#4f46e5',
  },
  purple: {
    name: 'Royal Purple',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-800',
    ringColor: 'ring-purple-500',
    dotBg: 'bg-purple-500',
    borderActive: 'border-purple-600',
    accentBg: 'bg-purple-600',
    hex: '#9333ea',
  },
  amber: {
    name: 'Amber Gold',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
    ringColor: 'ring-amber-500',
    dotBg: 'bg-amber-500',
    borderActive: 'border-amber-600',
    accentBg: 'bg-amber-600',
    hex: '#d97706',
  },
  rose: {
    name: 'Rose Pink',
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-800',
    ringColor: 'ring-rose-500',
    dotBg: 'bg-rose-500',
    borderActive: 'border-rose-600',
    accentBg: 'bg-rose-600',
    hex: '#e11d48',
  },
  orange: {
    name: 'Vibrant Orange',
    badgeBg: 'bg-orange-100',
    badgeText: 'text-orange-800',
    ringColor: 'ring-orange-500',
    dotBg: 'bg-orange-500',
    borderActive: 'border-orange-600',
    accentBg: 'bg-orange-600',
    hex: '#ea580c',
  },
  cyan: {
    name: 'Cyan Light Blue',
    badgeBg: 'bg-cyan-100',
    badgeText: 'text-cyan-800',
    ringColor: 'ring-cyan-500',
    dotBg: 'bg-cyan-500',
    borderActive: 'border-cyan-600',
    accentBg: 'bg-cyan-600',
    hex: '#0891b2',
  },
};

export const DEFAULT_GROWTH_STAGES: GrowthStagePreset[] = [
  // 7 Standard Botanical Stages
  {
    id: 'stage-seedling',
    key: 'seedling',
    nameEn: 'Seedling & Germination',
    nameKm: 'កូនដុះពន្លក & សាបកូន',
    defaultDays: 7,
    color: 'emerald',
    ecTarget: '0.8 - 1.2 mS/cm',
    phTarget: '5.8 - 6.2',
    irrigationGuidelineEn: 'Keep peat moss consistently moist with fine misting 2-3x/day.',
    irrigationGuidelineKm: 'រក្សាសំណើមជីកំប៉ុសឱ្យថេរដោយបាញ់អ័ព្ទ ២-៣ ដងក្នុងមួយថ្ងៃ។',
    notesEn: 'Germination trays at 28-32°C. Morning sunlight on Day 3. Mild nutrient feed.',
    notesKm: 'រក្សាសីតុណ្ហភាព ២៨-៣២°C។ ហាលថ្ងៃព្រឹកនៅថ្ងៃទី ៣។ ស្រោចជីកម្លាំងស្រាល។',
    isCustom: false
  },
  {
    id: 'stage-transplanting',
    key: 'transplanting',
    nameEn: 'Transplanting & Rooting',
    nameKm: 'ស្ទូងកូនដំណាំ & ចាក់ឫស',
    defaultDays: 7,
    color: 'teal',
    ecTarget: '1.2 - 1.6 mS/cm',
    phTarget: '6.0 - 6.5',
    irrigationGuidelineEn: 'Drip 300-500 ml/bag daily; check root-zone moisture.',
    irrigationGuidelineKm: 'ស្រោចដំណក់ទឹក ៣០០-៥០០ មីលីលីត្រ/ថង់ រាល់ថ្ងៃ ពិនិត្យសំណើមឫស។',
    notesEn: 'Hardening seedlings 2 days prior. Transplant in late afternoon. Root stimulator application.',
    notesKm: 'បង្ហាត់កូនដំណាំ ២ ថ្ងៃមុនស្ទូង។ ស្ទូងពេលរសៀលត្រជាក់។ បញ្ចូលថ្នាំជំនួយឫស។',
    isCustom: false
  },
  {
    id: 'stage-vine-growth',
    key: 'vine_growth',
    nameEn: 'Vine & Foliage Growth',
    nameKm: 'ការលូតលាស់ដើម & ស្លឹក',
    defaultDays: 20,
    color: 'sky',
    ecTarget: '1.8 - 2.2 mS/cm',
    phTarget: '6.0 - 6.5',
    irrigationGuidelineEn: 'Increase drip cycles to 4-5 times/day; maintain 70-80% moisture.',
    irrigationGuidelineKm: 'បង្កើនជុំស្រោចទឹក ៤-៥ ដង/ថ្ងៃ រក្សាសំណើម ៧០-៨០%។',
    notesEn: 'Vertical vine trellising with clips. Lateral shoot pruning below node 8. High-N balanced fertigation.',
    notesKm: 'ចងដើមឡើងត្រង់តាមខ្សែ។ កាត់ខ្នែងចំហៀងក្រោមថ្នាំងទី ៨ ចេញ។ បញ្ចូលជីអាសូត និងប៉ូតាស្យូម។',
    isCustom: false
  },
  {
    id: 'stage-flowering',
    key: 'flowering',
    nameEn: 'Flowering & Budding',
    nameKm: 'ចេញផ្កា & ក្តិប',
    defaultDays: 12,
    color: 'indigo',
    ecTarget: '2.0 - 2.4 mS/cm',
    phTarget: '6.0 - 6.5',
    irrigationGuidelineEn: 'Stable drip delivery; avoid overwatering to prevent floral drop.',
    irrigationGuidelineKm: 'ស្រោចទឹកថេរ ចៀសវាងសំណើមជ្រុលនាំឱ្យរលូតផ្កា។',
    notesEn: 'Select flower nodes 9 to 13 for retention. Clean walkways and ventilate. Foliar spray Boron + Calcium.',
    notesKm: 'ជ្រើសរើសផ្កាថ្នាំងទី ៩ ដល់ ១៣ ទុកបង្កាត់។ សម្អាតផ្ទះសំណាញ់ និងបើកខ្យល់។ បាញ់ជីបំប៉នបូរ៉ុន + កាល់ស្យូម។',
    isCustom: false
  },
  {
    id: 'stage-pollination',
    key: 'pollination',
    nameEn: 'Artificial Pollination',
    nameKm: 'ការបង្កាត់លម្អងផ្កា',
    defaultDays: 14,
    color: 'amber',
    ecTarget: '2.0 - 2.4 mS/cm',
    phTarget: '6.0 - 6.5',
    irrigationGuidelineEn: 'Irrigate after pollination window concludes (post 11:00 AM).',
    irrigationGuidelineKm: 'ស្រោចទឹកក្រោយបញ្ចប់ការបង្កាត់លម្អង (ក្រោយម៉ោង ១១ ព្រឹក)។',
    notesEn: 'Hand pollination 06:30 AM - 10:30 AM. Pollinate 2-3 female flowers per vine. Attach colored date tags.',
    notesKm: 'បង្កាត់ដោយដៃ ០៦:៣០ - ១០:៣០ ព្រឹក។ បង្កាត់ផ្កាញី ២-៣ ក្នុងមួយដើម។ ចងស្លាកពណ៌កត់ត្រាកាលបរិច្ឆេទ។',
    isCustom: false
  },
  {
    id: 'stage-fruit-development',
    key: 'fruit_development',
    nameEn: 'Fruit Expansion & Netting',
    nameKm: 'ពង្រីកផ្លែ & បង្កើតក្រឡា',
    defaultDays: 20,
    color: 'purple',
    ecTarget: '2.2 - 2.6 mS/cm',
    phTarget: '6.0 - 6.5',
    irrigationGuidelineEn: 'High water demand initially; taper down during netting crack.',
    irrigationGuidelineKm: 'តម្រូវការទឹកខ្ពស់ដំបូង រួចបន្ថយពេលផ្លែចាប់ផ្តើមប្រេះក្រឡា។',
    notesEn: 'Fruit thinning: retain single prime melon per plant. Hang fruit with melon rope or mesh hammock. Elevated Potassium & Calcium.',
    notesKm: 'ជ្រើសរើសផ្លែស្អាត ១ គ្រាប់ក្នុងមួយដើម។ ចងព្យួរផ្លែដោយខ្សែចំណង ឬសំណាញ់។ បង្កើនជីប៉ូតាស្យូម និងកាល់ស្យូមបង្កើតក្រឡា។',
    isCustom: false
  },
  {
    id: 'stage-harvest',
    key: 'harvest',
    nameEn: 'Ripening & Harvesting',
    nameKm: 'ទុំ & ប្រមូលផល',
    defaultDays: 10,
    color: 'rose',
    ecTarget: '1.2 - 1.4 mS/cm',
    phTarget: '6.0 - 6.5',
    irrigationGuidelineEn: 'Cut irrigation by 60-80% 5-7 days before harvest for Brix sugar peak.',
    irrigationGuidelineKm: 'កាត់បន្ថយទឹក ៦០-៨០% មុនប្រមូលផល ៥-៧ ថ្ងៃ ដើម្បីប្រមូលផ្តុំជាតិស្ករ Brix។',
    notesEn: 'Brix refractometer sampling. Aroma and stem slip inspection. T-stem cutting in cool early morning.',
    notesKm: 'វាស់កម្រិតផ្អែម Brix។ ពិនិត្យក្លិនក្រអូប និងស្នាមប្រេះទង។ កាត់ទងផ្លែរាងអក្សរ T នៅពេលព្រលឹមត្រជាក់។',
    isCustom: false
  },

  // 4 Specialty / Custom Stages
  {
    id: 'stage-netting-dev',
    key: 'netting_development',
    nameEn: 'Netting Development',
    nameKm: 'ការបង្កើតក្រឡាសំណាញ់',
    defaultDays: 10,
    color: 'purple',
    ecTarget: '2.0 - 2.4 mS/cm',
    phTarget: '6.0 - 6.5',
    irrigationGuidelineEn: 'Maintain constant soil moisture to prevent fruit cracking and ensure uniform netting lines.',
    irrigationGuidelineKm: 'រក្សាសំណើមដីឱ្យថេរដើម្បីកុំឱ្យផ្លែប្រេះ និងបង្កើតក្រឡាសំណាញ់ស្មើស្អាត។',
    notesEn: 'Inspect netting formation and adjust net house humidity. Maintain night aeration.',
    notesKm: 'ត្រួតពិនិត្យការចេញក្រឡាសំណាញ់ និងកែសម្រួលសំណើមក្នុងរោង។ បើកខ្យល់ចេញចូលពេលយប់។',
    isCustom: true
  },
  {
    id: 'stage-sweetness-boost',
    key: 'brix_sweetening_boost',
    nameEn: 'Brix & Sweetening Boost',
    nameKm: 'ការបង្កើនជាតិស្ករផ្លែ',
    defaultDays: 8,
    color: 'amber',
    ecTarget: '2.4 - 2.8 mS/cm',
    phTarget: '6.2 - 6.6',
    irrigationGuidelineEn: 'Taper off water delivery by 30-40% to concentrate natural fruit sucrose & fructose.',
    irrigationGuidelineKm: 'បន្ថយការស្រោចទឹក ៣០-៤០% ដើម្បីបង្កើនជាតិស្ករ Sucrose និង Fructose ក្នុងផ្លែ។',
    notesEn: 'Apply potassium sulfate boost. Check sugar levels with digital refractometer.',
    notesKm: 'បន្ថែមជីប៉ូតាស្យូមស៊ុលហ្វាត។ វាស់កម្រិតជាតិស្ករជាមួយឧបករណ៍ Refractometer។',
    isCustom: true
  },
  {
    id: 'stage-fruit-thinning',
    key: 'fruit_thinning_hanging',
    nameEn: 'Fruit Selection & Hanging',
    nameKm: 'ជ្រើសរើសផ្លែ & ចងខ្សែយោង',
    defaultDays: 5,
    color: 'sky',
    ecTarget: '1.8 - 2.2 mS/cm',
    phTarget: '6.0 - 6.5',
    irrigationGuidelineEn: 'Standard irrigation volume. Avoid water deficit during young fruit cell division.',
    irrigationGuidelineKm: 'ផ្តល់បរិមាណទឹកធម្មតា។ ចៀសវាងការខ្វះទឹកពេលកោសិកាផ្លែកំពុងពង្រីក។',
    notesEn: 'Select 1 best fruit per vine (nodes 11-13). Hang fruit securely with net sling.',
    notesKm: 'ជ្រើសរើសផ្លែល្អបំផុត ១ ក្នុងមួយដើម (ថ្នាំង ១១-១៣)។ ចងខ្សែយោងផ្លែឱ្យមាំ។',
    isCustom: true
  },
  {
    id: 'stage-preharvest-flush',
    key: 'preharvest_flushing',
    nameEn: 'Pre-Harvest Cleanse & Flush',
    nameKm: 'ការបង្ហូរទឹកមុនប្រមូលផល',
    defaultDays: 6,
    color: 'teal',
    ecTarget: '0.8 - 1.2 mS/cm',
    phTarget: '6.0 - 6.5',
    irrigationGuidelineEn: 'Irrigate with pure clean water to flush excess fertilizer salts from crop root zone.',
    irrigationGuidelineKm: 'ស្រោចទឹកស្អាតសុទ្ធដើម្បីលាងជម្រះសំណល់ជាតិជីចេញពីឫសដំណាំ។',
    notesEn: 'Guarantees crisp texture, clean aroma, and superior post-harvest shelf life.',
    notesKm: 'ធានាឱ្យសាច់ផ្លែស្រួយ ឈ្ងុយឆ្ងាញ់ និងទុកបានយូរក្រោយប្រមូលផល។',
    isCustom: true
  }
];

export const INITIAL_CUSTOM_STAGE_PRESETS: GrowthStagePreset[] = DEFAULT_GROWTH_STAGES;

export function getStageColorTheme(colorKey?: string) {
  if (!colorKey) return STAGE_COLOR_THEMES.emerald;
  return STAGE_COLOR_THEMES[colorKey] || STAGE_COLOR_THEMES.emerald;
}

export function createGrowthStageFromPreset(
  preset: CustomStagePreset,
  startDate: string,
  endDate: string,
  days?: number
): GrowthStage {
  return {
    id: `stg-custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    key: preset.key,
    nameEn: preset.nameEn,
    nameKm: preset.nameKm,
    startDate,
    endDate,
    targetDays: days || preset.defaultDays,
    status: 'upcoming',
    progress: 0,
    isCustom: true,
    color: preset.color,
    ecTarget: preset.ecTarget,
    phTarget: preset.phTarget,
    irrigationGuidelineEn: preset.irrigationGuidelineEn,
    irrigationGuidelineKm: preset.irrigationGuidelineKm,
    notesEn: preset.notesEn,
    notesKm: preset.notesKm,
  };
}
