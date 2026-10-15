import { GrowthStage, GrowthStageKey } from '../types/melon.ts';

export interface VarietyStageConfig {
  key: string;
  nameEn: string;
  nameKm: string;
  targetDays: number;
  ecTarget?: string;
  phTarget?: string;
  irrigationGuidelineEn?: string;
  irrigationGuidelineKm?: string;
  keyPracticesEn?: string[];
  keyPracticesKm?: string[];
  color?: string;
  isCustom?: boolean;
}

export interface VarietyCategory {
  id: string;
  code: string;
  nameEn: string;
  nameKm: string;
  color: string;
  bgClass?: string;
  textClass?: string;
  borderClass?: string;
  descriptionEn?: string;
  descriptionKm?: string;
  isDefault?: boolean;
}

export const INITIAL_VARIETY_CATEGORIES: VarietyCategory[] = [
  {
    id: 'honeydew',
    code: 'HONEYDEW',
    nameEn: 'Golden Honeydew',
    nameKm: 'ត្រសក់ផ្អែមមាស',
    color: '#EAB308',
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-800',
    borderClass: 'border-amber-200',
    descriptionEn: 'Smooth vibrant golden skin, sweet crisp pale-green flesh with high sugar accumulation.',
    descriptionKm: 'សំបកពណ៌មាសរលោង សាច់ស្រួយពណ៌បៃតងខ្ចី ជាតិផ្អែមខ្ពស់។',
    isDefault: true
  },
  {
    id: 'crown_melon',
    code: 'CROWN_MELON',
    nameEn: 'Japanese Crown Melon',
    nameKm: 'ត្រសក់ផ្អែមក្រោនជប៉ុន',
    color: '#15803D',
    bgClass: 'bg-emerald-50',
    textClass: 'text-emerald-800',
    borderClass: 'border-emerald-200',
    descriptionEn: 'Premium muskmelon with fine raised netting, exquisite floral aroma and melting sweet jade flesh.',
    descriptionKm: 'ពូជប្រណិតបែបជប៉ុន មានក្រឡាច្បាស់ ក្លិនក្រអូបឈ្ងុយ សាច់ទន់ផ្អែម។',
    isDefault: true
  },
  {
    id: 'cantaloupe',
    code: 'CANTALOUPE',
    nameEn: 'Sweet Cantaloupe',
    nameKm: 'ត្រសក់ផ្អែមសាច់លឿង',
    color: '#EA580C',
    bgClass: 'bg-orange-50',
    textClass: 'text-orange-800',
    borderClass: 'border-orange-200',
    descriptionEn: 'Aromatic orange flesh, yellow-striped netted skin, excellent heat and drought tolerance.',
    descriptionKm: 'សាច់ពណ៌ទឹកក្រូចក្រអូប សំបកឆ្នូតលឿង ធន់នឹងកម្តៅខ្ពស់។',
    isDefault: true
  },
  {
    id: 'hami',
    code: 'HAMI',
    nameEn: 'Hami Melon',
    nameKm: 'ត្រសក់ផ្អែមហាមី',
    color: '#CA8A04',
    bgClass: 'bg-yellow-50',
    textClass: 'text-yellow-800',
    borderClass: 'border-yellow-200',
    descriptionEn: 'Large oblong crispy melon with dense netting, intense honey aroma and long shelf life.',
    descriptionKm: 'រាងទ្រវែង សាច់ស្រួយផ្អែមដូចទឹកឃ្មុំ មានក្រឡាល្អិត រក្សាទុកបានយូរ។',
    isDefault: true
  },
  {
    id: 'specialty',
    code: 'SPECIALTY',
    nameEn: 'Specialty & White Pearl',
    nameKm: 'ពូជពិសេស & គុជខ្យងស',
    color: '#0284C7',
    bgClass: 'bg-sky-50',
    textClass: 'text-sky-800',
    borderClass: 'border-sky-200',
    descriptionEn: 'Rare boutique cultivars including pristine pearl-white rinds and exotic hybrid melons.',
    descriptionKm: 'ពូជកម្រពិសេស សំបកសគុជខ្យង ផ្អែមស្រទន់ និងពូជកូនកាត់កម្រិតខ្ពស់។',
    isDefault: true
  }
];

export interface CropVarietyPreset {
  id: string;
  nameEn: string;
  nameKm: string;
  category: string;
  daysToMaturity: number;
  seedlingDays: number;
  transplantDays: number;
  vineGrowthDays: number;
  floweringDays: number;
  pollinationDays: number;
  fruitDevDays: number;
  harvestDays: number;
  targetBrix: number;
  idealEc: number;
  idealPh: number;
  plantSpacingCm: number;
  expectedYieldKgPerPlant: number;
  nettingRequired: boolean;
  color: string;
  descriptionEn: string;
  descriptionKm: string;
  stages?: VarietyStageConfig[];
}

/**
 * Calculates a date offset from a given base date string (YYYY-MM-DD).
 */
export const calculateDateOffset = (baseDateStr: string, offsetDays: number): string => {
  if (!baseDateStr) return '';
  const parts = baseDateStr.split('-');
  if (parts.length === 3) {
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    d.setDate(d.getDate() + Number(offsetDays || 0));
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dt = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dt}`;
  }
  const d = new Date(baseDateStr);
  if (isNaN(d.getTime())) return '';
  d.setDate(d.getDate() + Number(offsetDays || 0));
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dt = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dt}`;
};

/**
 * Chains stage dates sequentially from base sowing date.
 */
export const calculateChainedStages = (
  stages: GrowthStage[],
  baseSowingDate: string
): GrowthStage[] => {
  let dayCursor = 0;
  return stages.map((stg) => {
    const duration = Math.max(1, Number(stg.targetDays || 1));
    const start = calculateDateOffset(baseSowingDate, dayCursor);
    dayCursor += duration;
    const end = calculateDateOffset(baseSowingDate, dayCursor - 1);
    return {
      ...stg,
      startDate: start,
      endDate: end,
      targetDays: duration
    };
  });
};

/**
 * Generates dynamic growth stages for a crop planting based on its variety preset.
 */
export const getStagesForVariety = (
  variety: CropVarietyPreset,
  sowingDate: string,
  cycleIdPrefix: string = 'stg'
): GrowthStage[] => {
  const baseDate = sowingDate || new Date().toISOString().split('T')[0];

  // If variety has tailored dynamic stages defined, generate from those
  if (variety.stages && variety.stages.length > 0) {
    let dayCursor = 0;
    return variety.stages.map((stgConf, idx) => {
      const duration = Math.max(1, stgConf.targetDays);
      const start = calculateDateOffset(baseDate, dayCursor);
      dayCursor += duration;
      const end = calculateDateOffset(baseDate, dayCursor - 1);

      return {
        id: `${cycleIdPrefix}-${Date.now()}-${idx + 1}`,
        key: stgConf.key as GrowthStageKey,
        nameEn: stgConf.nameEn,
        nameKm: stgConf.nameKm,
        startDate: start,
        endDate: end,
        targetDays: duration,
        status: idx === 0 ? 'current' : 'upcoming',
        progress: idx === 0 ? 30 : 0,
        isCustom: stgConf.isCustom,
        color: stgConf.color,
        ecTarget: stgConf.ecTarget,
        phTarget: stgConf.phTarget,
        irrigationGuidelineEn: stgConf.irrigationGuidelineEn,
        irrigationGuidelineKm: stgConf.irrigationGuidelineKm,
        keyPracticesEn: stgConf.keyPracticesEn,
        keyPracticesKm: stgConf.keyPracticesKm,
        notesEn: stgConf.keyPracticesEn?.join('. '),
        notesKm: stgConf.keyPracticesKm?.join('។ ')
      };
    });
  }

  // Fallback: build dynamic stages from the variety's duration & agronomic properties
  const defaultStagesConfig: VarietyStageConfig[] = [
    {
      key: 'seedling',
      nameEn: 'Seedling & Germination',
      nameKm: 'កូនដុះពន្លក & សាបកូន',
      targetDays: variety.seedlingDays || 7,
      ecTarget: '0.8 - 1.2 mS/cm',
      phTarget: `${(variety.idealPh - 0.3).toFixed(1)} - ${variety.idealPh.toFixed(1)}`,
      irrigationGuidelineEn: 'Keep peat moss consistently moist with fine misting 2-3x/day.',
      irrigationGuidelineKm: 'រក្សាសំណើមជីកំប៉ុសឱ្យថេរដោយបាញ់អ័ព្ទ ២-៣ ដងក្នុងមួយថ្ងៃ។',
      keyPracticesEn: ['Germination trays at 28-32°C', 'Morning sunlight on Day 3', 'Mild nutrient feed'],
      keyPracticesKm: ['រក្សាសីតុណ្ហភាព ២៨-៣២°C', 'ហាលថ្ងៃព្រឹកនៅថ្ងៃទី ៣', 'ស្រោចជីកម្លាំងស្រាល'],
      color: 'emerald'
    },
    {
      key: 'transplanting',
      nameEn: 'Transplanting & Rooting',
      nameKm: 'ស្ទូងកូនដំណាំ & ចាក់ឫស',
      targetDays: variety.transplantDays || 7,
      ecTarget: `1.2 - ${(variety.idealEc - 0.3).toFixed(1)} mS/cm`,
      phTarget: `${(variety.idealPh - 0.2).toFixed(1)} - ${variety.idealPh.toFixed(1)}`,
      irrigationGuidelineEn: 'Drip 300-500 ml/bag daily; check root-zone moisture.',
      irrigationGuidelineKm: 'ស្រោចដំណក់ទឹក ៣០០-៥០០ មីលីលីត្រ/ថង់ រាល់ថ្ងៃ ពិនិត្យសំណើមឫស។',
      keyPracticesEn: ['Hardening seedlings 2 days prior', 'Transplant in late afternoon', 'Root stimulator application'],
      keyPracticesKm: ['បង្ហាត់កូនដំណាំ ២ ថ្ងៃមុនស្ទូង', 'ស្ទូងពេលរសៀលត្រជាក់', 'បញ្ចូលថ្នាំជំនួយឫស'],
      color: 'teal'
    },
    {
      key: 'vine_growth',
      nameEn: 'Vine & Foliage Growth',
      nameKm: 'ការលូតលាស់ដើម & ស្លឹក',
      targetDays: variety.vineGrowthDays || 20,
      ecTarget: `${(variety.idealEc - 0.2).toFixed(1)} - ${variety.idealEc.toFixed(1)} mS/cm`,
      phTarget: `${(variety.idealPh - 0.2).toFixed(1)} - ${variety.idealPh.toFixed(1)}`,
      irrigationGuidelineEn: 'Increase drip cycles to 4-5 times/day; maintain 70-80% moisture.',
      irrigationGuidelineKm: 'បង្កើនជុំស្រោចទឹក ៤-៥ ដង/ថ្ងៃ រក្សាសំណើម ៧០-៨០%។',
      keyPracticesEn: ['Vertical vine trellising with clips', 'Lateral shoot pruning below node 8', 'High-N balanced fertigation'],
      keyPracticesKm: ['ចងដើមឡើងត្រង់តាមខ្សែ', 'កាត់ខ្នែងចំហៀងក្រោមថ្នាំងទី ៨ ចេញ', 'បញ្ចូលជីអាសូត និងប៉ូតាស្យូម'],
      color: 'sky'
    },
    {
      key: 'flowering',
      nameEn: 'Flowering & Budding',
      nameKm: 'ចេញផ្កា & ក្តិប',
      targetDays: variety.floweringDays || 12,
      ecTarget: `${variety.idealEc.toFixed(1)} - ${(variety.idealEc + 0.2).toFixed(1)} mS/cm`,
      phTarget: `${variety.idealPh.toFixed(1)} - ${(variety.idealPh + 0.2).toFixed(1)}`,
      irrigationGuidelineEn: 'Stable drip delivery; avoid overwatering to prevent floral drop.',
      irrigationGuidelineKm: 'ស្រោចទឹកថេរ ចៀសវាងសំណើមជ្រុលនាំឱ្យរលូតផ្កា។',
      keyPracticesEn: ['Select flower nodes 9 to 13 for retention', 'Clean walkways and ventilate', 'Foliar spray Boron + Calcium'],
      keyPracticesKm: ['ជ្រើសរើសផ្កាថ្នាំងទី ៩ ដល់ ១៣ ទុកបង្កាត់', 'សម្អាតផ្ទះសំណាញ់ និងបើកខ្យល់', 'បាញ់ជីបំប៉នបូរ៉ុន + កាល់ស្យូម'],
      color: 'indigo'
    },
    {
      key: 'pollination',
      nameEn: 'Artificial Pollination',
      nameKm: 'ការបង្កាត់លម្អងផ្កា',
      targetDays: variety.pollinationDays || 14,
      ecTarget: `${variety.idealEc.toFixed(1)} - ${(variety.idealEc + 0.3).toFixed(1)} mS/cm`,
      phTarget: `${variety.idealPh.toFixed(1)} - ${(variety.idealPh + 0.2).toFixed(1)}`,
      irrigationGuidelineEn: 'Irrigate after pollination window concludes (post 11:00 AM).',
      irrigationGuidelineKm: 'ស្រោចទឹកក្រោយបញ្ចប់ការបង្កាត់លម្អង (ក្រោយម៉ោង ១១ ព្រឹក)។',
      keyPracticesEn: ['Hand pollination 06:30 AM - 10:30 AM', 'Pollinate 2-3 female flowers per vine', 'Attach colored date tags'],
      keyPracticesKm: ['បង្កាត់ដោយដៃ ០៦:៣០ - ១០:៣០ ព្រឹក', 'បង្កាត់ផ្កាញី ២-៣ ក្នុងមួយដើម', 'ចងស្លាកពណ៌កត់ត្រាកាលបរិច្ឆេទ'],
      color: 'amber'
    },
    {
      key: 'fruit_development',
      nameEn: 'Fruit Expansion & Netting',
      nameKm: 'ពង្រីកផ្លែ & បង្កើតក្រឡា',
      targetDays: variety.fruitDevDays || 20,
      ecTarget: `${(variety.idealEc + 0.2).toFixed(1)} - ${(variety.idealEc + 0.6).toFixed(1)} mS/cm`,
      phTarget: `${(variety.idealPh - 0.2).toFixed(1)} - ${variety.idealPh.toFixed(1)}`,
      irrigationGuidelineEn: 'High water demand initially; taper down during netting crack.',
      irrigationGuidelineKm: 'តម្រូវការទឹកខ្ពស់ដំបូង រួចបន្ថយពេលផ្លែចាប់ផ្តើមប្រេះក្រឡា។',
      keyPracticesEn: ['Fruit thinning: retain single prime melon per plant', 'Hang fruit with melon rope or mesh hammock', 'Elevated Potassium & Calcium'],
      keyPracticesKm: ['ជ្រើសរើសផ្លែស្អាត ១ គ្រាប់ក្នុងមួយដើម', 'ចងព្យួរផ្លែដោយខ្សែចំណង ឬសំណាញ់', 'បង្កើនជីប៉ូតាស្យូម និងកាល់ស្យូមបង្កើតក្រឡា'],
      color: 'purple'
    },
    {
      key: 'harvest',
      nameEn: 'Ripening & Harvesting',
      nameKm: 'ទុំ & ប្រមូលផល',
      targetDays: variety.harvestDays || 10,
      ecTarget: '1.2 - 1.4 mS/cm',
      phTarget: '6.0 - 6.5',
      irrigationGuidelineEn: 'Cut irrigation by 60-80% 5-7 days before harvest for Brix sugar peak.',
      irrigationGuidelineKm: 'កាត់បន្ថយទឹក ៦០-៨០% មុនប្រមូលផល ៥-៧ ថ្ងៃ ដើម្បីប្រមូលផ្តុំជាតិស្ករ Brix។',
      keyPracticesEn: [`Brix refractometer sampling (target ${variety.targetBrix}°Bx)`, 'Aroma and stem slip inspection', 'T-stem cutting in cool early morning'],
      keyPracticesKm: [`វាស់កម្រិតផ្អែម Brix (គោលដៅ ${variety.targetBrix}°Bx)`, 'ពិនិត្យក្លិនក្រអូប និងស្នាមប្រេះទង', 'កាត់ទងផ្លែរាងអក្សរ T នៅពេលព្រលឹមត្រជាក់'],
      color: 'rose'
    }
  ];

  let dayCursor = 0;
  return defaultStagesConfig.map((stgConf, idx) => {
    const duration = Math.max(1, stgConf.targetDays);
    const start = calculateDateOffset(baseDate, dayCursor);
    dayCursor += duration;
    const end = calculateDateOffset(baseDate, dayCursor - 1);

    return {
      id: `${cycleIdPrefix}-${Date.now()}-${idx + 1}`,
      key: stgConf.key as GrowthStageKey,
      nameEn: stgConf.nameEn,
      nameKm: stgConf.nameKm,
      startDate: start,
      endDate: end,
      targetDays: duration,
      status: idx === 0 ? 'current' : 'upcoming',
      progress: idx === 0 ? 30 : 0,
      isCustom: false,
      color: stgConf.color,
      ecTarget: stgConf.ecTarget,
      phTarget: stgConf.phTarget,
      irrigationGuidelineEn: stgConf.irrigationGuidelineEn,
      irrigationGuidelineKm: stgConf.irrigationGuidelineKm,
      keyPracticesEn: stgConf.keyPracticesEn,
      keyPracticesKm: stgConf.keyPracticesKm,
      notesEn: stgConf.keyPracticesEn?.join('. '),
      notesKm: stgConf.keyPracticesKm?.join('។ ')
    };
  });
};

export const CROP_VARIETIES_PRESETS: CropVarietyPreset[] = [
  {
    id: 'mel-2777',
    nameEn: 'Mel 2777',
    nameKm: 'ត្រសក់ផ្អែម Mel 2777',
    category: 'cantaloupe',
    daysToMaturity: 70,
    seedlingDays: 7,
    transplantDays: 7,
    vineGrowthDays: 18,
    floweringDays: 10,
    pollinationDays: 12,
    fruitDevDays: 18,
    harvestDays: 8,
    targetBrix: 15.0,
    idealEc: 1.8,
    idealPh: 6.4,
    plantSpacingCm: 45,
    expectedYieldKgPerPlant: 1.8,
    nettingRequired: false,
    color: '#F97316',
    descriptionEn: 'Premium hybrid melon cultivar with smooth golden rind, crisp sweet salmon-orange flesh, and outstanding disease tolerance.',
    descriptionKm: 'ពូជត្រសក់ផ្អែមកូនកាត់ Mel 2777 សំបកពណ៌មាសរលោង សាច់ពណ៌ទឹកក្រូចស្រួយផ្អែមខ្លាំង និងធន់នឹងជំងឺ។',
    stages: [
      {
        key: 'seedling',
        nameEn: 'Seedling & Germination',
        nameKm: 'កូនដុះពន្លក & សាបកូន',
        targetDays: 7,
        ecTarget: '0.8 - 1.2 mS/cm',
        phTarget: '6.0 - 6.5',
        irrigationGuidelineEn: 'Keep peat moss consistently moist with fine misting 2-3x/day.',
        irrigationGuidelineKm: 'រក្សាសំណើមជីកំប៉ុសឱ្យថេរដោយបាញ់អ័ព្ទ ២-៣ ដងក្នុងមួយថ្ងៃ។',
        keyPracticesEn: ['Germination trays at 28-32°C', 'Morning sunlight on Day 3', 'Mild nutrient feed'],
        keyPracticesKm: ['រក្សាសីតុណ្ហភាព ២៨-៣២°C', 'ហាលថ្ងៃព្រឹកនៅថ្ងៃទី ៣', 'ស្រោចជីកម្លាំងស្រាល'],
        color: 'emerald'
      },
      {
        key: 'transplanting',
        nameEn: 'Transplanting & Rooting',
        nameKm: 'ស្ទូងកូនដំណាំ & ចាក់ឫស',
        targetDays: 7,
        ecTarget: '1.2 - 1.5 mS/cm',
        phTarget: '6.0 - 6.5',
        irrigationGuidelineEn: 'Drip 300-500 ml/bag daily; check root-zone moisture.',
        irrigationGuidelineKm: 'ស្រោចដំណក់ទឹក ៣០០-៥០០ មីលីលីត្រ/ថង់ រាល់ថ្ងៃ ពិនិត្យសំណើមឫស។',
        keyPracticesEn: ['Hardening seedlings 2 days prior', 'Transplant in late afternoon', 'Root stimulator and Trichoderma'],
        keyPracticesKm: ['បង្ហាត់កូនដំណាំ ២ ថ្ងៃមុនស្ទូង', 'ស្ទូងពេលរសៀលត្រជាក់', 'បញ្ចូលថ្នាំជំនួយឫស និងទ្រីកូឌែម៉ា'],
        color: 'teal'
      },
      {
        key: 'vine_growth',
        nameEn: 'Vine & Foliage Growth',
        nameKm: 'ការលូតលាស់ដើម & ស្លឹក',
        targetDays: 18,
        ecTarget: '1.5 - 1.8 mS/cm',
        phTarget: '6.2 - 6.5',
        irrigationGuidelineEn: 'Increase drip cycles to 4-5 times/day; maintain 75% moisture.',
        irrigationGuidelineKm: 'បង្កើនជុំស្រោចទឹក ៤-៥ ដង/ថ្ងៃ រក្សាសំណើម ៧៥%។',
        keyPracticesEn: ['Vertical vine trellising and string clip', 'Prune lateral shoots below node 8', 'High-N balanced fertigation'],
        keyPracticesKm: ['ចងដើមឡើងត្រង់តាមខ្សែ', 'កាត់ខ្នែងចំហៀងក្រោមថ្នាំងទី ៨ ចេញ', 'បញ្ចូលជីអាសូត និងប៉ូតាស្យូម'],
        color: 'sky'
      },
      {
        key: 'flowering',
        nameEn: 'Flowering & Floral Induction',
        nameKm: 'ចេញផ្កា & ក្តិប',
        targetDays: 10,
        ecTarget: '1.8 - 2.0 mS/cm',
        phTarget: '6.2 - 6.5',
        irrigationGuidelineEn: 'Stable drip delivery; avoid overwatering to protect bloom vigor.',
        irrigationGuidelineKm: 'ស្រោចទឹកថេរ ចៀសវាងសំណើមជ្រុលនាំឱ្យរលូតផ្កា។',
        keyPracticesEn: ['Select flower nodes 9 to 13 for retention', 'Foliar spray Boron + Calcium', 'Greenhouse cross-ventilation'],
        keyPracticesKm: ['ជ្រើសរើសផ្កាថ្នាំងទី ៩ ដល់ ១៣ ទុកបង្កាត់', 'បាញ់ជីបំប៉នបូរ៉ុន + កាល់ស្យូម', 'បើកខ្យល់ចេញចូលផ្ទះសំណាញ់'],
        color: 'indigo'
      },
      {
        key: 'pollination',
        nameEn: 'Hand Pollination Window',
        nameKm: 'ការបង្កាត់លម្អងផ្កាដោយដៃ',
        targetDays: 12,
        ecTarget: '1.8 - 2.1 mS/cm',
        phTarget: '6.2 - 6.5',
        irrigationGuidelineEn: 'Irrigate after pollination window concludes (post 11:00 AM).',
        irrigationGuidelineKm: 'ស្រោចទឹកក្រោយបញ្ចប់ការបង្កាត់លម្អង (ក្រោយម៉ោង ១១ ព្រឹក)។',
        keyPracticesEn: ['Pollinate between 06:30 - 10:30 AM', 'Pollinate 2-3 female flowers per vine', 'Attach colored date tag'],
        keyPracticesKm: ['បង្កាត់ដោយដៃចន្លោះម៉ោង ០៦:៣០ - ១០:៣០ ព្រឹក', 'បង្កាត់ផ្កាញី ២-៣ ក្នុងមួយដើម', 'ចងស្លាកពណ៌កត់ត្រាកាលបរិច្ឆេទ'],
        color: 'amber'
      },
      {
        key: 'fruit_development',
        nameEn: 'Fruit Expansion & Sweetening',
        nameKm: 'ពង្រីកផ្លែ & បង្កើតជាតិស្ករ',
        targetDays: 18,
        ecTarget: '2.0 - 2.4 mS/cm',
        phTarget: '6.0 - 6.5',
        irrigationGuidelineEn: 'High water demand initially; keep soil moisture 75-80%.',
        irrigationGuidelineKm: 'តម្រូវការទឹកខ្ពស់ដំបូង រក្សាសំណើមដី ៧៥-៨០%។',
        keyPracticesEn: ['Fruit thinning: retain single prime melon', 'Hang fruit with melon rope', 'High Potassium for smooth golden skin'],
        keyPracticesKm: ['ជ្រើសរើសផ្លែស្អាត ១ គ្រាប់ក្នុងមួយដើម', 'ចងព្យួរផ្លែដោយខ្សែចំណង', 'បង្កើនជីប៉ូតាស្យូម'],
        color: 'purple'
      },
      {
        key: 'harvest',
        nameEn: 'Ripening & Golden Harvest',
        nameKm: 'ទុំ & ប្រមូលផលផ្លែមាស',
        targetDays: 8,
        ecTarget: '1.2 - 1.4 mS/cm',
        phTarget: '6.0 - 6.5',
        irrigationGuidelineEn: 'Cut irrigation by 70% 5-7 days prior to harvest for Brix sugar peak.',
        irrigationGuidelineKm: 'កាត់បន្ថយទឹក ៧០% មុនប្រមូលផល ៥-៧ ថ្ងៃ ដើម្បីប្រមូលផ្តុំជាតិស្ករ Brix។',
        keyPracticesEn: ['Brix testing (target 15.0°Bx)', 'Check stem slip and golden aroma', 'Morning harvest and grading'],
        keyPracticesKm: ['វាស់ជាតិស្ករ Brix (គោលដៅ ១៥.០°Bx)', 'ពិនិត្យក្លិនក្រអូប និងស្នាមប្រេះទង', 'ប្រមូលផលពេលព្រឹក និងចាត់ថ្នាក់'],
        color: 'rose'
      }
    ]
  },
  {
    id: 'inthanon-f1',
    nameEn: 'Golden Honeydew (Inthanon F1)',
    nameKm: 'ត្រសក់ផ្អែមមាស (អ៊ីនថាណុន F1)',
    category: 'honeydew',
    daysToMaturity: 75,
    seedlingDays: 7,
    transplantDays: 7,
    vineGrowthDays: 20,
    floweringDays: 12,
    pollinationDays: 14,
    fruitDevDays: 20,
    harvestDays: 10,
    targetBrix: 15.5,
    idealEc: 1.8,
    idealPh: 6.4,
    plantSpacingCm: 40,
    expectedYieldKgPerPlant: 1.8,
    nettingRequired: false,
    color: '#EAB308',
    descriptionEn: 'High sugar accumulation, smooth vibrant golden skin, crisp pale-green flesh. Extremely popular in Southeast Asian premium supermarkets.',
    descriptionKm: 'ជាតិផ្អែមខ្ពស់ សំបកពណ៌មាសរលោង សាច់ស្រួយពណ៌បៃតងខ្ចី។ ពេញនិយមខ្លាំងក្នុងទីផ្សារកម្ពុជា។',
    stages: [
      {
        key: 'seedling',
        nameEn: 'Seedling & Germination',
        nameKm: 'កូនដុះពន្លក & សាបកូន',
        targetDays: 7,
        ecTarget: '0.8 - 1.2 mS/cm',
        phTarget: '6.0 - 6.5',
        irrigationGuidelineEn: 'Keep peat moss consistently moist with fine misting 2-3x/day.',
        irrigationGuidelineKm: 'រក្សាសំណើមជីកំប៉ុសឱ្យថេរដោយបាញ់អ័ព្ទ ២-៣ ដងក្នុងមួយថ្ងៃ។',
        keyPracticesEn: ['Germination trays at 28-32°C', 'Morning sunlight on Day 3', 'Mild nutrient feed'],
        keyPracticesKm: ['រក្សាសីតុណ្ហភាព ២៨-៣២°C', 'ហាលថ្ងៃព្រឹកនៅថ្ងៃទី ៣', 'ស្រោចជីកម្លាំងស្រាល'],
        color: 'emerald'
      },
      {
        key: 'transplanting',
        nameEn: 'Transplanting & Rooting',
        nameKm: 'ស្ទូងកូនដំណាំ & ចាក់ឫស',
        targetDays: 7,
        ecTarget: '1.2 - 1.5 mS/cm',
        phTarget: '6.0 - 6.5',
        irrigationGuidelineEn: 'Drip 300-500 ml/bag daily; check root-zone moisture.',
        irrigationGuidelineKm: 'ស្រោចដំណក់ទឹក ៣០០-៥០០ មីលីលីត្រ/ថង់ រាល់ថ្ងៃ ពិនិត្យសំណើមឫស។',
        keyPracticesEn: ['Hardening seedlings 2 days prior', 'Transplant in late afternoon', 'Root stimulator and Trichoderma'],
        keyPracticesKm: ['បង្ហាត់កូនដំណាំ ២ ថ្ងៃមុនស្ទូង', 'ស្ទូងពេលរសៀលត្រជាក់', 'បញ្ចូលថ្នាំជំនួយឫស និងទ្រីកូឌែម៉ា'],
        color: 'teal'
      },
      {
        key: 'vine_growth',
        nameEn: 'Vine & Foliage Growth',
        nameKm: 'ការលូតលាស់ដើម & ស្លឹក',
        targetDays: 20,
        ecTarget: '1.5 - 1.8 mS/cm',
        phTarget: '6.2 - 6.5',
        irrigationGuidelineEn: 'Increase drip cycles to 4-5 times/day; maintain 75% moisture.',
        irrigationGuidelineKm: 'បង្កើនជុំស្រោចទឹក ៤-៥ ដង/ថ្ងៃ រក្សាសំណើម ៧៥%។',
        keyPracticesEn: ['Vertical vine trellising and string clip', 'Prune lateral shoots below node 8', 'High-N balanced fertigation'],
        keyPracticesKm: ['ចងដើមឡើងត្រង់តាមខ្សែ', 'កាត់ខ្នែងចំហៀងក្រោមថ្នាំងទី ៨ ចេញ', 'បញ្ចូលជីអាសូត និងប៉ូតាស្យូម'],
        color: 'sky'
      },
      {
        key: 'flowering',
        nameEn: 'Flowering & Floral Induction',
        nameKm: 'ចេញផ្កា & ក្តិប',
        targetDays: 12,
        ecTarget: '1.8 - 2.0 mS/cm',
        phTarget: '6.2 - 6.5',
        irrigationGuidelineEn: 'Stable drip delivery; avoid overwatering to protect bloom vigor.',
        irrigationGuidelineKm: 'ស្រោចទឹកថេរ ចៀសវាងសំណើមជ្រុលនាំឱ្យរលូតផ្កា។',
        keyPracticesEn: ['Select flower nodes 9 to 13 for retention', 'Foliar spray Boron + Calcium', 'Greenhouse cross-ventilation'],
        keyPracticesKm: ['ជ្រើសរើសផ្កាថ្នាំងទី ៩ ដល់ ១៣ ទុកបង្កាត់', 'បាញ់ជីបំប៉នបូរ៉ុន + កាល់ស្យូម', 'បើកខ្យល់ចេញចូលផ្ទះសំណាញ់'],
        color: 'indigo'
      },
      {
        key: 'pollination',
        nameEn: 'Hand Pollination Window',
        nameKm: 'ការបង្កាត់លម្អងផ្កាដោយដៃ',
        targetDays: 14,
        ecTarget: '1.8 - 2.1 mS/cm',
        phTarget: '6.2 - 6.5',
        irrigationGuidelineEn: 'Irrigate after pollination window concludes (post 11:00 AM).',
        irrigationGuidelineKm: 'ស្រោចទឹកក្រោយបញ្ចប់ការបង្កាត់លម្អង (ក្រោយម៉ោង ១១ ព្រឹក)។',
        keyPracticesEn: ['Pollinate between 06:30 - 10:30 AM', 'Pollinate 2-3 female flowers per vine', 'Attach colored date tag'],
        keyPracticesKm: ['បង្កាត់ដោយដៃចន្លោះម៉ោង ០៦:៣០ - ១០:៣០ ព្រឹក', 'បង្កាត់ផ្កាញី ២-៣ ក្នុងមួយដើម', 'ចងស្លាកពណ៌កត់ត្រាកាលបរិច្ឆេទ'],
        color: 'amber'
      },
      {
        key: 'fruit_development',
        nameEn: 'Fruit Expansion & Golden Rind',
        nameKm: 'ពង្រីកផ្លែ & បង្កើតពណ៌មាស',
        targetDays: 20,
        ecTarget: '2.0 - 2.4 mS/cm',
        phTarget: '6.0 - 6.5',
        irrigationGuidelineEn: 'High water demand initially; keep soil moisture 75-80%.',
        irrigationGuidelineKm: 'តម្រូវការទឹកខ្ពស់ដំបូង រក្សាសំណើមដី ៧៥-៨០%។',
        keyPracticesEn: ['Fruit thinning: retain single prime melon', 'Hang fruit with melon rope', 'High Potassium for smooth golden skin'],
        keyPracticesKm: ['ជ្រើសរើសផ្លែស្អាត ១ គ្រាប់ក្នុងមួយដើម', 'ចងព្យួរផ្លែដោយខ្សែចំណង', 'បង្កើនជីប៉ូតាស្យូមបង្កើតសំបកពណ៌មាសរលោង'],
        color: 'purple'
      },
      {
        key: 'harvest',
        nameEn: 'Ripening & Golden Harvest',
        nameKm: 'ទុំ & ប្រមូលផលផ្លែមាស',
        targetDays: 10,
        ecTarget: '1.2 - 1.4 mS/cm',
        phTarget: '6.0 - 6.5',
        irrigationGuidelineEn: 'Cut irrigation by 70% 5-7 days prior to harvest for Brix sugar peak.',
        irrigationGuidelineKm: 'កាត់បន្ថយទឹក ៧០% មុនប្រមូលផល ៥-៧ ថ្ងៃ ដើម្បីប្រមូលផ្តុំជាតិស្ករ Brix។',
        keyPracticesEn: ['Brix testing (target 15.5°Bx)', 'Check stem slip and golden aroma', 'Morning harvest and grading'],
        keyPracticesKm: ['វាស់កម្រិតផ្អែម Brix (គោលដៅ ១៥.៥°Bx)', 'ពិនិត្យស្នាមប្រេះទង និងក្លិនក្រអូប', 'ប្រមូលផលពេលព្រឹក និងចាត់ថ្នាក់'],
        color: 'rose'
      }
    ]
  },
  {
    id: 'aruse-crown',
    nameEn: 'Japanese Crown Muskmelon (Aruse)',
    nameKm: 'ត្រសក់ផ្អែមក្រោនជប៉ុន (អារូសេ)',
    category: 'crown_melon',
    daysToMaturity: 85,
    seedlingDays: 8,
    transplantDays: 7,
    vineGrowthDays: 22,
    floweringDays: 14,
    pollinationDays: 14,
    fruitDevDays: 26,
    harvestDays: 10,
    targetBrix: 16.5,
    idealEc: 2.0,
    idealPh: 6.5,
    plantSpacingCm: 45,
    expectedYieldKgPerPlant: 1.6,
    nettingRequired: true,
    color: '#15803D',
    descriptionEn: 'High-end Japanese cultivar with fine raised netting, exquisite aroma, and melting sweet jade flesh. Single fruit per vine culture.',
    descriptionKm: 'ពូជប្រណិតបែបជប៉ុន មានក្រឡាច្បាស់ ក្លិនក្រអូបឈ្ងុយ សាច់ទន់ផ្អែម។ ទុកមួយផ្លែក្នុងមួយដើម។',
    stages: [
      {
        key: 'seedling',
        nameEn: 'Nursery & Seedling',
        nameKm: 'កូនដុះពន្លក & បណ្តុះកូន',
        targetDays: 8,
        ecTarget: '0.8 - 1.2 mS/cm',
        phTarget: '6.0 - 6.5',
        irrigationGuidelineEn: 'Keep nursery substrate evenly moist at 28-30°C.',
        irrigationGuidelineKm: 'រក្សាសំណើមដីបណ្តុះឱ្យថេរនៅសីតុណ្ហភាព ២៨-៣០°C។',
        keyPracticesEn: ['104-cell plug trays', 'Prevent seedling stretching with optimal lighting', 'Mild nutrient feeding at 1st true leaf'],
        keyPracticesKm: ['ថាសបណ្តុះ ១០៤ រន្ធ', 'ការពារកូនដំណាំមិនឱ្យវែងស្លេកដោយពន្លឺគ្រប់គ្រាន់', 'ស្រោចជីស្រាលពេលចេញស្លឹកពិតទី ១'],
        color: 'emerald'
      },
      {
        key: 'transplanting',
        nameEn: 'Transplanting & Root Establishment',
        nameKm: 'ស្ទូងកូនដំណាំ & ចាក់ឫសរឹងមាំ',
        targetDays: 7,
        ecTarget: '1.2 - 1.5 mS/cm',
        phTarget: '6.2 - 6.5',
        irrigationGuidelineEn: 'Drip 400 ml/bag daily with biological fungicide.',
        irrigationGuidelineKm: 'ស្រោចដំណក់ទឹក ៤០០ មល/ថង់ រាល់ថ្ងៃ ជាមួយផ្សិតការពារឫស។',
        keyPracticesEn: ['Deep transplanting into clean substrate', 'Apply mycorrhizae and Trichoderma', 'Shade during midday peak'],
        keyPracticesKm: ['ស្ទូងជម្រៅសមស្របក្នុងស្រទាប់ដាំដុះស្អាត', 'បញ្ចូលផ្សិតជំនួយឫស Mycorrhizae', 'បាំងស្បៃការពារកម្តៅថ្ងៃត្រង់'],
        color: 'teal'
      },
      {
        key: 'vine_growth',
        nameEn: 'Vine Trellising & Node Management',
        nameKm: 'ការលូតលាស់ដើម & គ្រប់គ្រងថ្នាំង',
        targetDays: 22,
        ecTarget: '1.6 - 1.9 mS/cm',
        phTarget: '6.2 - 6.5',
        irrigationGuidelineEn: 'Increase fertigation frequency; monitor leaf area index.',
        irrigationGuidelineKm: 'បង្កើនជុំស្រោចជីតាមតម្រូវការ តាមដានការរីកលូតលាស់ស្លឹក។',
        keyPracticesEn: ['Train single main leader vine vertically', 'Prune all lateral branches below node 10', 'Pinch topping at node 25-28'],
        keyPracticesKm: ['បង្ហាត់ដើមមេតែមួយឡើងត្រង់', 'កាត់ខ្នែងចំហៀងក្រោមថ្នាំងទី ១០ ចេញ', 'កាត់ត្រួយមេនៅថ្នាំងទី ២៥-២៨'],
        color: 'sky'
      },
      {
        key: 'flowering',
        nameEn: 'Floral Bud Selection',
        nameKm: 'ជ្រើសរើសក្តិប & ផ្កាបង្កាត់',
        targetDays: 14,
        ecTarget: '1.8 - 2.1 mS/cm',
        phTarget: '6.2 - 6.5',
        irrigationGuidelineEn: 'Maintain moderate moisture; foliar calcium feeding.',
        irrigationGuidelineKm: 'រក្សាសំណើមមធ្យម បាញ់ជីបំប៉នកាល់ស្យូមពង្រឹងទងផ្កា។',
        keyPracticesEn: ['Target female flowers specifically at nodes 11 to 13', 'De-leaf old bottom foliage for air circulation', 'Prepare clean pollination brushes'],
        keyPracticesKm: ['ជ្រើសរើសផ្កាញីនៅថ្នាំងទី ១១ ដល់ ១៣ ជាក់លាក់', 'កាត់ស្លឹកចាស់ៗបាតដើមចេញដើម្បីខ្យល់ចេញចូល', 'រៀបចំជក់បង្កាត់ស្អាត'],
        color: 'indigo'
      },
      {
        key: 'pollination',
        nameEn: 'Precision Hand Pollination',
        nameKm: 'ការបង្កាត់លម្អងដោយដៃជាក់លាក់',
        targetDays: 14,
        ecTarget: '1.9 - 2.2 mS/cm',
        phTarget: '6.2 - 6.5',
        irrigationGuidelineEn: 'Withhold morning irrigation until 10:30 AM pollination finish.',
        irrigationGuidelineKm: 'ផ្អាកស្រោចទឹកពេលព្រឹករហូតដល់បង្កាត់រួចម៉ោង ១០:៣០ ព្រឹក។',
        keyPracticesEn: ['Hand pollinate 3 target nodes per vine', 'Label with color-coded date band', 'Confirm initial fruit set swell on Day 3'],
        keyPracticesKm: ['បង្កាត់ដោយដៃ ៣ ថ្នាំងក្នុងមួយដើម', 'ចងខ្សែពណ៌កត់ត្រាកាលបរិច្ឆេទ', 'ពិនិត្យក្តិបផ្លែប៉ោងធំនៅថ្ងៃទី ៣'],
        color: 'amber'
      },
      {
        key: 'custom_thinning_sizing',
        nameEn: 'Fruit Selection & Sizing (Crown Stage)',
        nameKm: 'ជ្រើសរើសផ្លែឯក & ពង្រីកផ្លែ (ក្រោន)',
        targetDays: 14,
        ecTarget: '2.2 - 2.5 mS/cm',
        phTarget: '6.2 - 6.5',
        irrigationGuidelineEn: 'Peak water uptake phase; deliver 1.8 - 2.2 L per plant daily.',
        irrigationGuidelineKm: 'ដំណាក់កាលស្រូបទឹកខ្ពស់បំផុត ស្រោច ១.៨ - ២.២ លីត្រ/ដើម/ថ្ងៃ។',
        keyPracticesEn: ['Select single perfectly spherical melon; prune remainder', 'Suspend fruit with Crown melon cord hammock', 'High potassium and boron delivery'],
        keyPracticesKm: ['ជ្រើសរើសផ្លែរាងមូលល្អឥតខ្ចោះតែ ១ គ្រាប់ កាត់ផ្លែផ្សេងចេញ', 'ចងព្យួរផ្លែដោយខ្សែក្រោនជប៉ុន', 'បញ្ចូលជីប៉ូតាស្យូម និងបូរ៉ុនកម្រិតខ្ពស់'],
        color: 'purple',
        isCustom: true
      },
      {
        key: 'custom_netting_crack',
        nameEn: 'Netting Crack & Sugar Brix Surge',
        nameKm: 'ប្រេះក្រឡា & បង្កើនជាតិស្ករ Brix (ក្រោន)',
        targetDays: 12,
        ecTarget: '2.4 - 2.6 mS/cm',
        phTarget: '6.0 - 6.5',
        irrigationGuidelineEn: 'Strictly control soil moisture; reduce irrigation to prevent fruit split.',
        irrigationGuidelineKm: 'គ្រប់គ្រងសំណើមដីយ៉ាងម៉ត់ចត់ បន្ថយទឹកការពារការប្រេះបែកផ្លែ។',
        keyPracticesEn: ['Primary vertical netting crack initiation', 'Secondary horizontal net interlocking', 'Slip paper melon sunshade hat on fruit'],
        keyPracticesKm: ['ការប្រេះក្រឡាបណ្តោយដំបូង', 'ការប្រេះក្រឡាទទឹងត្បាញចូលគ្នាពេញសំបក', 'ពាក់មួកក្រដាសការពារកម្តៅថ្ងៃលើផ្លែ'],
        color: 'purple',
        isCustom: true
      },
      {
        key: 'harvest',
        nameEn: 'T-Stem Harvest & Curing',
        nameKm: 'កាត់ទង T & ប្រមូលផលប្រណិត',
        targetDays: 10,
        ecTarget: '1.2 - 1.4 mS/cm',
        phTarget: '6.0 - 6.5',
        irrigationGuidelineEn: 'Withhold 80% water for 6 days for maximum Brix sugar concentration.',
        irrigationGuidelineKm: 'ផ្អាកទឹក ៨០% រយៈពេល ៦ ថ្ងៃដើម្បីប្រមូលផ្តុំជាតិស្ករ Brix ខ្ពស់បំផុត។',
        keyPracticesEn: ['Refractometer target: 16.0 - 17.0°Bx', 'Harvest with iconic Japanese T-shaped stem', 'Transfer to 18-20°C packing room'],
        keyPracticesKm: ['គោលដៅជាតិស្ករ Brix: ១៦.០ - ១៧.០°Bx', 'កាត់ទងរាងអក្សរ T តាមស្តង់ដារជប៉ុន', 'ផ្ទេរទៅបន្ទប់វេចខ្ចប់សីតុណ្ហភាព ១៨-២០°C'],
        color: 'rose'
      }
    ]
  },
  {
    id: 'sun-jewel',
    nameEn: 'Sweet Cantaloupe (Sun Jewel)',
    nameKm: 'ត្រសក់ផ្អែមសាច់លឿង (សាន់ជូវែល)',
    category: 'cantaloupe',
    daysToMaturity: 68,
    seedlingDays: 6,
    transplantDays: 6,
    vineGrowthDays: 18,
    floweringDays: 10,
    pollinationDays: 12,
    fruitDevDays: 18,
    harvestDays: 8,
    targetBrix: 14.0,
    idealEc: 1.6,
    idealPh: 6.8,
    plantSpacingCm: 40,
    expectedYieldKgPerPlant: 2.2,
    nettingRequired: false,
    color: '#EA580C',
    descriptionEn: 'Fast-maturing cantaloupe with bright yellow-striped skin, rich aromatic orange flesh, and high heat tolerance for Cambodia summers.',
    descriptionKm: 'ឆាប់ប្រមូលផល សំបកឆ្នូតពណ៌លឿង សាច់ពណ៌ទឹកក្រូចក្រអូប ធន់នឹងកម្តៅខ្ពស់នៅកម្ពុជា។',
    stages: [
      {
        key: 'seedling',
        nameEn: 'Fast Seedling',
        nameKm: 'កូនដុះពន្លករហ័ស',
        targetDays: 6,
        ecTarget: '0.8 - 1.2 mS/cm',
        phTarget: '6.4 - 6.8',
        irrigationGuidelineEn: 'High germination vigor; light misting twice daily.',
        irrigationGuidelineKm: 'ដុះពន្លករហ័ស បាញ់អ័ព្ទ ២ ដងក្នុងមួយថ្ងៃ។',
        keyPracticesEn: ['Germination in 48-60 hours', 'Full morning sun exposure', 'Inspect vigor'],
        keyPracticesKm: ['ដុះពន្លកក្នុងរង្វង់ ៤៨-៦០ ម៉ោង', 'ហាលថ្ងៃព្រឹកពេញលេញ', 'ពិនិត្យភាពរឹងមាំ'],
        color: 'emerald'
      },
      {
        key: 'transplanting',
        nameEn: 'Transplanting & Quick Rooting',
        nameKm: 'ស្ទូងកូនដំណាំ & ចាក់ឫសរហ័ស',
        targetDays: 6,
        ecTarget: '1.2 - 1.4 mS/cm',
        phTarget: '6.5 - 6.8',
        irrigationGuidelineEn: 'Ensure fast root establishment with 400 ml daily drip.',
        irrigationGuidelineKm: 'ធានាការចាក់ឫសរហ័សដោយស្រោចទឹក ៤០០ មល រាល់ថ្ងៃ។',
        keyPracticesEn: ['Field transplanting in raised beds', 'Apply organic booster', 'Check drip dripper calibration'],
        keyPracticesKm: ['ស្ទូងលើរងដីលើកខ្ពស់', 'បញ្ចូលជីសរីរាង្គបំប៉ន', 'ក្រិតក្បាលដំណក់ទឹក'],
        color: 'teal'
      },
      {
        key: 'vine_growth',
        nameEn: 'Vigorous Vine Extension',
        nameKm: 'ការលូតលាស់ដើមយ៉ាងលឿន',
        targetDays: 18,
        ecTarget: '1.5 - 1.7 mS/cm',
        phTarget: '6.5 - 6.8',
        irrigationGuidelineEn: 'Sustain fast growth with balanced N-P-K.',
        irrigationGuidelineKm: 'ទ្រទ្រង់ការលូតលាស់លឿនជាមួយជីតុល្យភាព N-P-K។',
        keyPracticesEn: ['Trellis or ground plastic mulching', 'Pruning side shoots', 'Prevent powdery mildew with sulfur'],
        keyPracticesKm: ['ចងឡើងទ្រើង ឬក្រាលកៅស៊ូ', 'កាត់ខ្នែងចំហៀង', 'ការពារជំងឺផ្សិតម្សៅ'],
        color: 'sky'
      },
      {
        key: 'flowering',
        nameEn: 'Early Flowering',
        nameKm: 'ចេញផ្កាដំណាក់កាលដំបូង',
        targetDays: 10,
        ecTarget: '1.6 - 1.8 mS/cm',
        phTarget: '6.6 - 6.8',
        irrigationGuidelineEn: 'Maintain uniform irrigation to set bloom clusters.',
        irrigationGuidelineKm: 'រក្សាការស្រោចទឹកស្មើល្អដើម្បីក្តិបផ្កាច្រើន។',
        keyPracticesEn: ['Monitor male to female flower ratio', 'Calcium foliar spray', 'Greenhouse heat ventilation'],
        keyPracticesKm: ['តាមដានសមាមាត្រផ្កាឈ្មោល និងផ្កាញី', 'បាញ់ជីកាល់ស្យូម', 'បើកខ្យល់បញ្ចេញកម្តៅ'],
        color: 'indigo'
      },
      {
        key: 'pollination',
        nameEn: 'Rapid Pollination',
        nameKm: 'បង្កាត់លម្អងរហ័ស',
        targetDays: 12,
        ecTarget: '1.6 - 1.9 mS/cm',
        phTarget: '6.6 - 6.8',
        irrigationGuidelineEn: 'Early morning hand pollination or bee introduction.',
        irrigationGuidelineKm: 'បង្កាត់លម្អងដោយដៃពេលព្រលឹម ឬដាក់ឃ្មុំបង្កាត់។',
        keyPracticesEn: ['Pollinate nodes 8-12', 'Tag completed vines', 'Fast fruit set monitoring'],
        keyPracticesKm: ['បង្កាត់ថ្នាំងទី ៨-១២', 'ចងស្លាកសម្គាល់ដើម', 'តាមដានការជាប់ក្តិប'],
        color: 'amber'
      },
      {
        key: 'fruit_development',
        nameEn: 'Orange Flesh Expansion',
        nameKm: 'ពង្រីកផ្លែ & សាច់ពណ៌ទឹកក្រូច',
        targetDays: 18,
        ecTarget: '1.8 - 2.1 mS/cm',
        phTarget: '6.5 - 6.8',
        irrigationGuidelineEn: 'High water volume during sizing; taper off at yellow coloring.',
        irrigationGuidelineKm: 'ផ្តល់ទឹកច្រើនពេលផ្លែរីកធំ រួចបន្ថយពេលឡើងពណ៌លឿង។',
        keyPracticesEn: ['Retain 1-2 melons per vine for cantaloupe', 'Mulch fruit pads to protect underside', 'Potassium boosting'],
        keyPracticesKm: ['ទុក ១-២ ផ្លែក្នុងមួយដើម', 'កល់ទ្រនាប់ការពារបាតផ្លែ', 'បង្កើនជីប៉ូតាស្យូម'],
        color: 'purple'
      },
      {
        key: 'harvest',
        nameEn: 'Aromatic Cantaloupe Harvest',
        nameKm: 'ប្រមូលផលផ្លែសាច់លឿងក្រអូប',
        targetDays: 8,
        ecTarget: '1.2 - 1.4 mS/cm',
        phTarget: '6.5 - 6.8',
        irrigationGuidelineEn: 'Dry out 4 days prior to harvest for aromatic sweetness.',
        irrigationGuidelineKm: 'កាត់ទឹក ៤ ថ្ងៃមុនប្រមូលផលដើម្បីក្លិនក្រអូបឈ្ងុយ និងផ្អែម។',
        keyPracticesEn: ['Target Brix: 13.5 - 14.5°Bx', 'Harvest at half-slip to full-slip', 'Careful crate packing'],
        keyPracticesKm: ['កម្រិតស្ករ Brix: ១៣.៥ - ១៤.៥°Bx', 'ប្រមូលផលពេលទងរបើកពាក់កណ្តាល', 'វេចខ្ចប់ក្នុងកេសថ្នមៗ'],
        color: 'rose'
      }
    ]
  },
  {
    id: 'hami-honey',
    nameEn: 'Hami Melon (Honey Crisp)',
    nameKm: 'ត្រសក់ផ្អែមហាមី (ទឹកឃ្មុំស្រួយ)',
    category: 'hami',
    daysToMaturity: 82,
    seedlingDays: 8,
    transplantDays: 7,
    vineGrowthDays: 20,
    floweringDays: 12,
    pollinationDays: 14,
    fruitDevDays: 23,
    harvestDays: 10,
    targetBrix: 15.0,
    idealEc: 1.9,
    idealPh: 6.6,
    plantSpacingCm: 45,
    expectedYieldKgPerPlant: 2.5,
    nettingRequired: true,
    color: '#CA8A04',
    descriptionEn: 'Oblong crunchy sweet melon with dense netting, intense honey flavor, and long post-harvest shelf life.',
    descriptionKm: 'រាងទ្រវែង សាច់ស្រួយផ្អែមដូចទឹកឃ្មុំ មានក្រឡាល្អិត រក្សាទុកបានយូរក្រោយប្រមូលផល។',
    stages: [
      {
        key: 'seedling',
        nameEn: 'Seedling Nursery',
        nameKm: 'កូនដុះពន្លក & សាបកូន',
        targetDays: 8,
        ecTarget: '0.8 - 1.2 mS/cm',
        phTarget: '6.2 - 6.6',
        irrigationGuidelineEn: 'Keep substrate moist; avoid over-saturation.',
        irrigationGuidelineKm: 'រក្សាសំណើមដីកុំឱ្យជាំទឹកពេក។',
        keyPracticesEn: ['Germinate at 30°C', 'Fungicide drench at emergence', 'Harden with breeze'],
        keyPracticesKm: ['បណ្តុះនៅសីតុណ្ហភាព ៣០°C', 'ស្រោចថ្នាំការពារផ្សិត', 'បង្ហាត់ជាមួយខ្យល់ធម្មជាតិ'],
        color: 'emerald'
      },
      {
        key: 'transplanting',
        nameEn: 'Transplanting & Rooting',
        nameKm: 'ស្ទូងកូនដំណាំ & ចាក់ឫស',
        targetDays: 7,
        ecTarget: '1.2 - 1.5 mS/cm',
        phTarget: '6.2 - 6.6',
        irrigationGuidelineEn: 'Drip 400 ml/plant daily; monitor root establishment.',
        irrigationGuidelineKm: 'ស្រោចដំណក់ទឹក ៤០០ មល/ដើម/ថ្ងៃ តាមដានការចាក់ឫស។',
        keyPracticesEn: ['Spacing 45cm for large oblong fruit development', 'Apply mycorrhizae', 'Mulching'],
        keyPracticesKm: ['គម្លាត ៤៥ សង់ទីម៉ែត្រសម្រាប់ផ្លែទ្រវែងធំ', 'បញ្ចូលផ្សិតជំនួយឫស', 'ក្រាលកៅស៊ូគ្របដី'],
        color: 'teal'
      },
      {
        key: 'vine_growth',
        nameEn: 'Vine Vegetative Growth',
        nameKm: 'ការលូតលាស់ដើម & ស្លឹក',
        targetDays: 20,
        ecTarget: '1.6 - 1.8 mS/cm',
        phTarget: '6.2 - 6.6',
        irrigationGuidelineEn: 'Substantial water volume for robust thick vines.',
        irrigationGuidelineKm: 'ផ្តល់ទឹកគ្រប់គ្រាន់សម្រាប់ដើមថ្លោសរឹងមាំ។',
        keyPracticesEn: ['Heavy-duty trellising cord', 'Prune lateral shoots up to node 9', 'Monitor nutrient uptake'],
        keyPracticesKm: ['ប្រើខ្សែចងធន់មាំ', 'កាត់ខ្នែងចំហៀងក្រោមថ្នាំងទី ៩ ចេញ', 'តាមដានការស្រូបជី'],
        color: 'sky'
      },
      {
        key: 'flowering',
        nameEn: 'Flowering Stage',
        nameKm: 'ចេញផ្កា & ក្តិប',
        targetDays: 12,
        ecTarget: '1.8 - 2.0 mS/cm',
        phTarget: '6.4 - 6.6',
        irrigationGuidelineEn: 'Moderate moisture; ventilate against high humidity.',
        irrigationGuidelineKm: 'សំណើមមធ្យម បើកខ្យល់ការពារសំណើមខ្យល់ខ្ពស់ពេក។',
        keyPracticesEn: ['Identify flower clusters nodes 10-14', 'Boron + Zinc foliar feeding', 'Clean walkways'],
        keyPracticesKm: ['ជ្រើសរើសផ្កាថ្នាំងទី ១០-១៤', 'បាញ់ជីបំប៉នបូរ៉ុន + ស័ង្កសី', 'សម្អាតផ្លូវដើរ'],
        color: 'indigo'
      },
      {
        key: 'pollination',
        nameEn: 'Artificial Pollination',
        nameKm: 'ការបង្កាត់លម្អងផ្កា',
        targetDays: 14,
        ecTarget: '1.8 - 2.1 mS/cm',
        phTarget: '6.4 - 6.6',
        irrigationGuidelineEn: 'Irrigate after pollination window concludes.',
        irrigationGuidelineKm: 'ស្រោចទឹកក្រោយបញ្ចប់ការបង្កាត់លម្អង។',
        keyPracticesEn: ['Morning pollination 07:00 - 10:30 AM', 'Color tags for tracking', 'Check fruit swell'],
        keyPracticesKm: ['បង្កាត់ពេលព្រឹក ០៧:០០ - ១០:៣០ ព្រឹក', 'ចងស្លាកពណ៌តាមដាន', 'ពិនិត្យផ្លែប៉ោងធំ'],
        color: 'amber'
      },
      {
        key: 'custom_hami_sizing',
        nameEn: 'Oblong Fruit Bulking & Sun Protection',
        nameKm: 'ពង្រីកផ្លែទ្រវែង & ការពារកម្តៅថ្ងៃ (ហាមី)',
        targetDays: 15,
        ecTarget: '2.2 - 2.5 mS/cm',
        phTarget: '6.2 - 6.6',
        irrigationGuidelineEn: 'High water requirement; oblong fruit sizing reaches 2.5kg.',
        irrigationGuidelineKm: 'តម្រូវការទឹកខ្ពស់ ផ្លែទ្រវែងរីកធំដល់ ២.៥ គីឡូក្រាម។',
        keyPracticesEn: ['Fruit thinning to 1 prime melon per vine', 'Reinforced mesh melon sling support', 'Paper sunshade cover'],
        keyPracticesKm: ['ជ្រើសរើសផ្លែស្អាត ១ គ្រាប់ក្នុងមួយដើម', 'ចងទ្រនាប់សំណាញ់ទប់ទម្ងន់', 'គ្របក្រដាសការពារកម្តៅថ្ងៃ'],
        color: 'purple',
        isCustom: true
      },
      {
        key: 'custom_hami_curing',
        nameEn: 'Dense Netting & Honey Curing',
        nameKm: 'បង្កើតក្រឡាល្អិត & រសជាតិទឹកឃ្មុំ (ហាមី)',
        targetDays: 8,
        ecTarget: '2.3 - 2.6 mS/cm',
        phTarget: '6.2 - 6.6',
        irrigationGuidelineEn: 'Gradually taper water delivery to develop dense net skin.',
        irrigationGuidelineKm: 'បន្ថយទឹកជាបណ្តើរៗដើម្បីឱ្យសំបកឡើងក្រឡាល្អិតណែន។',
        keyPracticesEn: ['Fine netting formation across oblong fruit', 'High Potassium feeding for crisp texture', 'Check fruit firmness'],
        keyPracticesKm: ['ក្រឡាល្អិតកើតឡើងពេញផ្លែទ្រវែង', 'បញ្ចូលជីប៉ូតាស្យូមបង្កើតសាច់ស្រួយ', 'ពិនិត្យភាពហាប់ណែន'],
        color: 'purple',
        isCustom: true
      },
      {
        key: 'harvest',
        nameEn: 'Crunchy Honey Harvest',
        nameKm: 'ប្រមូលផលផ្លែទឹកឃ្មុំស្រួយ',
        targetDays: 10,
        ecTarget: '1.2 - 1.4 mS/cm',
        phTarget: '6.2 - 6.6',
        irrigationGuidelineEn: 'Reduce water by 75% for 6 days prior to harvest.',
        irrigationGuidelineKm: 'កាត់ទឹក ៧៥% រយៈពេល ៦ ថ្ងៃមុនប្រមូលផល។',
        keyPracticesEn: ['Target Brix: 14.5 - 15.5°Bx', 'Dense netting inspection', 'Long shelf-life packing'],
        keyPracticesKm: ['គោលដៅជាតិស្ករ: ១៤.៥ - ១៥.៥°Bx', 'ពិនិត្យក្រឡាល្អិតពេញលេញ', 'វេចខ្ចប់រក្សាទុកបានយូរ'],
        color: 'rose'
      }
    ]
  },
  {
    id: 'silver-light',
    nameEn: 'Silver Light White Honeydew',
    nameKm: 'ត្រសក់ផ្អែមសូត្រប្រាក់ (Silver Light)',
    category: 'specialty',
    daysToMaturity: 72,
    seedlingDays: 7,
    transplantDays: 7,
    vineGrowthDays: 19,
    floweringDays: 11,
    pollinationDays: 13,
    fruitDevDays: 20,
    harvestDays: 8,
    targetBrix: 14.8,
    idealEc: 1.7,
    idealPh: 6.4,
    plantSpacingCm: 40,
    expectedYieldKgPerPlant: 2.0,
    nettingRequired: false,
    color: '#0284C7',
    descriptionEn: 'Pristine pearl-white rind, exceptionally tender translucent green flesh with floral honey undertones.',
    descriptionKm: 'សំបកពណ៌សគុជខ្យង សាច់ពណ៌បៃតងថ្លា ផ្អែមស្រទន់ក្លិនផ្កាទឹកឃ្មុំ។',
    stages: [
      {
        key: 'seedling',
        nameEn: 'Nursery Seedling',
        nameKm: 'កូនដុះពន្លក & សាបកូន',
        targetDays: 7,
        ecTarget: '0.8 - 1.2 mS/cm',
        phTarget: '6.0 - 6.4',
        irrigationGuidelineEn: 'Gentle misting; avoid wetting leaves overnight.',
        irrigationGuidelineKm: 'បាញ់អ័ព្ទថ្នមៗ ចៀសវាងស្លឹកសើមពេលយប់។',
        keyPracticesEn: ['Germinate in peat moss', 'Morning sun on Day 3', 'Mild organic feed'],
        keyPracticesKm: ['បណ្តុះក្នុងជីកំប៉ុស', 'ហាលថ្ងៃព្រឹកនៅថ្ងៃទី ៣', 'ស្រោចជីសរីរាង្គស្រាល'],
        color: 'emerald'
      },
      {
        key: 'transplanting',
        nameEn: 'Transplanting & Rooting',
        nameKm: 'ស្ទូងកូនដំណាំ & ចាក់ឫស',
        targetDays: 7,
        ecTarget: '1.2 - 1.4 mS/cm',
        phTarget: '6.0 - 6.4',
        irrigationGuidelineEn: '350 ml drip daily with root inoculant.',
        irrigationGuidelineKm: 'ស្រោចទឹក ៣៥០ មល រាល់ថ្ងៃជាមួយថ្នាំការពារឫស។',
        keyPracticesEn: ['Transplant into white cocopeat bags', 'Maintain bag aeration', 'Shade on Day 1'],
        keyPracticesKm: ['ស្ទូងក្នុងថង់ដូងពណ៌ស', 'រក្សាខ្យល់ក្នុងថង់ដាំ', 'បាំងស្បៃថ្ងៃទី ១'],
        color: 'teal'
      },
      {
        key: 'vine_growth',
        nameEn: 'Vine & Foliage Development',
        nameKm: 'ការលូតលាស់ដើម & ស្លឹក',
        targetDays: 19,
        ecTarget: '1.5 - 1.7 mS/cm',
        phTarget: '6.2 - 6.4',
        irrigationGuidelineEn: 'Steady irrigation; keep leaves pristine and unspotted.',
        irrigationGuidelineKm: 'ស្រោចទឹកថេរ រក្សាស្លឹកឱ្យស្អាតគ្មានស្នាមជំងឺ។',
        keyPracticesEn: ['Vertical string clips', 'Prune lateral shoots up to node 8', 'Balanced fertigation'],
        keyPracticesKm: ['គៀបគន្លាស់តាមខ្សែ', 'កាត់ខ្នែងចំហៀងក្រោមថ្នាំងទី ៨', 'បញ្ចូលជីតុល្យភាព'],
        color: 'sky'
      },
      {
        key: 'flowering',
        nameEn: 'Flowering & Bud Selection',
        nameKm: 'ចេញផ្កា & ក្តិប',
        targetDays: 11,
        ecTarget: '1.7 - 1.9 mS/cm',
        phTarget: '6.2 - 6.4',
        irrigationGuidelineEn: 'Controlled delivery to prevent bud drop.',
        irrigationGuidelineKm: 'ស្រោចទឹកគ្រប់គ្រងចៀសវាងរលូតផ្កា។',
        keyPracticesEn: ['Select nodes 10-13', 'Foliar Calcium + Boron', 'Air ventilation'],
        keyPracticesKm: ['ជ្រើសរើសថ្នាំងទី ១០-១៣', 'បាញ់កាល់ស្យូម + បូរ៉ុន', 'បើកខ្យល់ចេញចូល'],
        color: 'indigo'
      },
      {
        key: 'pollination',
        nameEn: 'Artificial Pollination',
        nameKm: 'ការបង្កាត់លម្អងផ្កា',
        targetDays: 13,
        ecTarget: '1.7 - 2.0 mS/cm',
        phTarget: '6.2 - 6.4',
        irrigationGuidelineEn: 'Midday irrigation only after pollination.',
        irrigationGuidelineKm: 'ស្រោចទឹកក្រោយបញ្ចប់ការបង្កាត់លម្អង។',
        keyPracticesEn: ['Hand pollination 06:30 - 10:30 AM', 'Color date bands', 'Inspect fruit set'],
        keyPracticesKm: ['បង្កាត់ដោយដៃ ០៦:៣០ - ១០:៣០ ព្រឹក', 'ចងស្លាកពណ៌កត់ត្រា', 'ពិនិត្យក្តិបផ្លែ'],
        color: 'amber'
      },
      {
        key: 'fruit_development',
        nameEn: 'Pearl White Skin & Flesh Sizing',
        nameKm: 'ពង្រីកផ្លែ & សំបកពណ៌សគុជខ្យង',
        targetDays: 20,
        ecTarget: '2.0 - 2.3 mS/cm',
        phTarget: '6.2 - 6.4',
        irrigationGuidelineEn: 'Avoid touching skin to keep pearl white glow spotless.',
        irrigationGuidelineKm: 'ចៀសវាងប៉ះសំបកផ្លែដើម្បីរក្សាពណ៌សគុជខ្យងឱ្យភ្លឺរលោង។',
        keyPracticesEn: ['Fruit thinning to 1 melon per vine', 'Clean fruit paper cover', 'Elevated Potassium'],
        keyPracticesKm: ['ជ្រើសរើសផ្លែស្អាត ១ គ្រាប់ក្នុងមួយដើម', 'គ្របក្រដាសស្អាតលើផ្លែ', 'បង្កើនជីប៉ូតាស្យូម'],
        color: 'purple'
      },
      {
        key: 'harvest',
        nameEn: 'Translucent Silver Harvest',
        nameKm: 'ប្រមូលផលផ្លែសូត្រប្រាក់',
        targetDays: 8,
        ecTarget: '1.2 - 1.4 mS/cm',
        phTarget: '6.2 - 6.4',
        irrigationGuidelineEn: 'Withhold water 5 days prior to harvest for floral honey sweetness.',
        irrigationGuidelineKm: 'កាត់ទឹក ៥ ថ្ងៃមុនប្រមូលផលដើម្បីក្លិនក្រអូបផ្កាទឹកឃ្មុំ។',
        keyPracticesEn: ['Target Brix: 14.5 - 15.2°Bx', 'Delicate pearl rind handling', 'Cool morning harvest'],
        keyPracticesKm: ['កម្រិតស្ករ: ១៤.៥ - ១៥.២°Bx', 'កាន់សំបកផ្លែថ្នមៗ', 'ប្រមូលផលពេលព្រឹកត្រជាក់'],
        color: 'rose'
      }
    ]
  }
];
