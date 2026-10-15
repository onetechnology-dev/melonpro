import { GrowthStageKey, TaskType, FarmTask, GrowthStage, CropCycle } from '../types/melon';
import { calculateDateOffset } from './cropVarieties';

export interface AgronomicTaskPreset {
  id: string;
  stageKey: GrowthStageKey;
  titleEn: string;
  titleKm: string;
  type: TaskType;
  time: string; // e.g. "08:00"
  priority: 'low' | 'medium' | 'high';
  dayOffset: number; // 0 = start of stage, 1 = +1 day from stage start, etc.
  dosageOrVolume?: string;
  notesEn?: string;
  notesKm?: string;
  enabled: boolean;
  order: number;
}

export const DEFAULT_AGRONOMIC_TASK_PRESETS: AgronomicTaskPreset[] = [
  {
    id: 'preset-seedling-hydration',
    stageKey: 'seedling',
    titleEn: 'Nursery Seeding & Peat Moss Hydration for {varietyEn}',
    titleKm: 'សាបគ្រាប់ក្នុងថាស និងផ្តល់សំណើមជីកំប៉ុសសម្រាប់ {varietyKm}',
    type: 'watering',
    time: '08:00',
    priority: 'high',
    dayOffset: 0,
    dosageOrVolume: '200 L Water (pH 6.2)',
    notesEn: 'Nursery seeding into plug trays and peat moss substrate hydration to ensure uniform germination.',
    notesKm: 'សាបគ្រាប់ចូលក្នុងថាសបណ្តុះ និងផ្តល់សំណើមជីកំប៉ុសដើម្បីធានាអត្រាដុះពន្លកស្មើគ្នា។',
    enabled: true,
    order: 1,
  },
  {
    id: 'preset-transplant-rooting',
    stageKey: 'transplanting',
    titleEn: 'Transplant to Cocopeat Grow Bags & Connect Drip Line',
    titleKm: 'ប្តូរកូនដាំចូលថង់ដូង និងតំណទុយោដំណក់ទឹក',
    type: 'watering',
    time: '07:30',
    priority: 'high',
    dayOffset: 0,
    dosageOrVolume: 'EC 1.5 - 1.8 mS/cm',
    notesEn: 'Transplant hardened seedlings in the cool morning and verify drip emitter delivery.',
    notesKm: 'ស្ទូងកូនដំណាំពេលព្រឹកត្រជាក់ និងពិនិត្យក្បាលដំណក់ទឹកស្រោចស្រព។',
    enabled: true,
    order: 2,
  },
  {
    id: 'preset-vine-trellising',
    stageKey: 'vine_growth',
    titleEn: 'Vertical Trellis Stringing & Lateral Shoot Pruning Below Node 10',
    titleKm: 'ចងដើមឡើងខ្សែ និងកាត់មែកខ្នែងក្រោមថ្នាំងទី ១០',
    type: 'vine_maintenance',
    time: '09:00',
    priority: 'medium',
    dayOffset: 0,
    dosageOrVolume: 'Trellis String Clips',
    notesEn: 'Vertical trellis stringing and prune secondary lateral suckers below node 10 to train central leader vine.',
    notesKm: 'ចងដើមមេឡើងខ្សែត្រង់ និងកាត់ខ្នែងចំហៀងក្រោមថ្នាំងទី ១០ ចេញដើម្បីពង្រឹងដើមមេ។',
    enabled: true,
    order: 3,
  },
  {
    id: 'preset-pollination-tagging',
    stageKey: 'pollination',
    titleEn: 'Manual Hand Pollination & Tagging Date for Nodes 11–13',
    titleKm: 'បង្កាត់លម្អងដោយដៃ និងចងស្លាកកាលបរិច្ឆេទនៅថ្នាំង ១១-១៣',
    type: 'flowering_pollination',
    time: '07:00',
    priority: 'high',
    dayOffset: 0,
    dosageOrVolume: 'Color Date Tags',
    notesEn: 'Manual hand pollination in early morning (06:30 - 10:30) and attach tracking tags for nodes 11 to 13.',
    notesKm: 'បង្កាត់លម្អងផ្កាដោយដៃនៅពេលព្រឹក និងចងស្លាកកត់ត្រាកាលបរិច្ឆេទនៅថ្នាំងទី ១១-១៣។',
    enabled: true,
    order: 4,
  },
  {
    id: 'preset-fruit-selection',
    stageKey: 'fruit_development',
    titleEn: 'Fruit Selection & Net String Hanging ({targetBrix}° Brix Target)',
    titleKm: 'ជ្រើសរើសផ្លែល្អបំផុត ១ ក្នុងមួយដើម និងចងខ្សែយោងផ្លែ',
    type: 'vine_maintenance',
    time: '08:30',
    priority: 'high',
    dayOffset: 0,
    dosageOrVolume: 'Melon String Slings',
    notesEn: 'Select single prime fruit per vine and suspend with melon rope or mesh sling to support weight expansion.',
    notesKm: 'ជ្រើសរើសផ្លែល្អ ១ គ្រាប់ក្នុងមួយដើម និងចងខ្សែយោងផ្លែដើម្បីការពារកុំឱ្យបាក់ទង និងជួយបង្កើតក្រឡាស្អាត។',
    enabled: true,
    order: 5,
  },
  {
    id: 'preset-harvest-brix',
    stageKey: 'harvest',
    titleEn: 'Refractometer Sugar Brix Test & Harvest Quality Sorting',
    titleKm: 'វាស់កម្រិតជាតិផ្អែម Brix និងប្រមូលផលជ្រើសរើសប្រភេទ Grade A',
    type: 'harvest',
    time: '06:30',
    priority: 'high',
    dayOffset: 0,
    dosageOrVolume: 'Brix Refractometer',
    notesEn: 'Measure sugar Brix degrees and harvest prime melon fruits during cool dawn hours for peak crunch and sweetness.',
    notesKm: 'វាស់កម្រិតជាតិផ្អែម Brix និងប្រមូលផលជ្រើសរើសផ្លែគុណភាព Grade A ពេលព្រឹកព្រលឹម ដើម្បីធានាភាពស្រស់ និងផ្អែម។',
    enabled: true,
    order: 6,
  },
];

export const TASK_TYPE_METADATA: Record<TaskType, {
  labelEn: string;
  labelKm: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  iconName: string;
}> = {
  watering: {
    labelEn: 'Watering & Drip',
    labelKm: 'ស្រោចទឹក និងដំណក់ទឹក',
    badgeBg: 'bg-blue-50 text-blue-700',
    badgeText: 'text-blue-700',
    borderColor: 'border-blue-200',
    iconName: 'Droplets',
  },
  fertilizing: {
    labelEn: 'Fertilizing & Feeding',
    labelKm: 'បញ្ចូលជី និងសារធាតុចិញ្ចឹម',
    badgeBg: 'bg-emerald-50 text-emerald-700',
    badgeText: 'text-emerald-700',
    borderColor: 'border-emerald-200',
    iconName: 'Sparkles',
  },
  vine_maintenance: {
    labelEn: 'Vine Maintenance',
    labelKm: 'ថែទាំដើម និងកាត់ខ្នែង',
    badgeBg: 'bg-teal-50 text-teal-700',
    badgeText: 'text-teal-700',
    borderColor: 'border-teal-200',
    iconName: 'Scissors',
  },
  flowering_pollination: {
    labelEn: 'Flowering & Pollination',
    labelKm: 'ចេញផ្កា និងបង្កាត់លម្អង',
    badgeBg: 'bg-amber-50 text-amber-700',
    badgeText: 'text-amber-700',
    borderColor: 'border-amber-200',
    iconName: 'Flower2',
  },
  pest_check: {
    labelEn: 'Pest & Disease Scouting',
    labelKm: 'ត្រួតពិនិត្យសត្វល្អិត និងជំងឺ',
    badgeBg: 'bg-rose-50 text-rose-700',
    badgeText: 'text-rose-700',
    borderColor: 'border-rose-200',
    iconName: 'Bug',
  },
  harvest_prep: {
    labelEn: 'Harvest Preparation',
    labelKm: 'រៀបចំប្រមូលផល',
    badgeBg: 'bg-purple-50 text-purple-700',
    badgeText: 'text-purple-700',
    borderColor: 'border-purple-200',
    iconName: 'ClipboardCheck',
  },
  harvest: {
    labelEn: 'Harvest & Sorting',
    labelKm: 'ប្រមូលផល និងចាត់ថ្នាក់',
    badgeBg: 'bg-orange-50 text-orange-700',
    badgeText: 'text-orange-700',
    borderColor: 'border-orange-200',
    iconName: 'Scale',
  },
  pruning: {
    labelEn: 'Pruning',
    labelKm: 'កាត់តម្រឹម',
    badgeBg: 'bg-lime-50 text-lime-700',
    badgeText: 'text-lime-700',
    borderColor: 'border-lime-200',
    iconName: 'Scissors',
  },
};

/**
 * Builds farm calendar tasks for a specific crop cycle based on active task presets.
 */
export const buildTasksFromPresets = (
  presets: AgronomicTaskPreset[],
  cycle: CropCycle,
  stagesList: GrowthStage[],
  options?: {
    assignedWorker?: string;
    targetBrix?: number;
    idealEc?: number;
    varietyEn?: string;
    varietyKm?: string;
  }
): Omit<FarmTask, 'id'>[] => {
  const enabledPresets = presets.filter((p) => p.enabled);
  const vEn = options?.varietyEn || cycle.variety || 'Melon';
  const vKm = options?.varietyKm || cycle.variety || 'ត្រសក់ផ្អែម';
  const brix = options?.targetBrix || 14.5;
  const ec = options?.idealEc || 1.8;
  const worker = options?.assignedWorker || cycle.assignedAgronomist || 'Sokha Agronomist';

  const generatedTasks: Omit<FarmTask, 'id'>[] = [];

  enabledPresets.forEach((preset) => {
    // Determine stage start date
    const matchedStage = stagesList.find((s) => s.key === preset.stageKey);
    let baseDate = matchedStage?.startDate;

    if (!baseDate) {
      if (preset.stageKey === 'seedling') {
        baseDate = cycle.sowingDate;
      } else if (preset.stageKey === 'transplanting') {
        baseDate = cycle.transplantDate;
      } else if (preset.stageKey === 'harvest') {
        baseDate = cycle.harvestWindowStart || cycle.stages?.[cycle.stages.length - 1]?.startDate;
      } else {
        baseDate = cycle.transplantDate || cycle.sowingDate;
      }
    }

    if (!baseDate) return;

    // Calculate actual task date using dayOffset
    const taskDate = preset.dayOffset === 0
      ? baseDate
      : calculateDateOffset(baseDate, preset.dayOffset);

    // Replace template placeholders in titles
    const titleEn = preset.titleEn
      .replace('{varietyEn}', vEn)
      .replace('{targetBrix}', String(brix))
      .replace('{idealEc}', String(ec));

    const titleKm = preset.titleKm
      .replace('{varietyKm}', vKm)
      .replace('{targetBrix}', String(brix))
      .replace('{idealEc}', String(ec));

    const notesEn = preset.notesEn
      ?.replace('{varietyEn}', vEn)
      ?.replace('{targetBrix}', String(brix))
      ?.replace('{idealEc}', String(ec));

    const notesKm = preset.notesKm
      ?.replace('{varietyKm}', vKm)
      ?.replace('{targetBrix}', String(brix))
      ?.replace('{idealEc}', String(ec));

    generatedTasks.push({
      titleEn,
      titleKm,
      type: preset.type,
      date: taskDate,
      time: preset.time,
      plotId: cycle.plotId,
      batchId: cycle.id,
      stageKey: preset.stageKey,
      status: 'pending',
      assignedWorker: worker,
      priority: preset.priority,
      dosageOrVolume: preset.dosageOrVolume,
      notesEn,
      notesKm,
    });
  });

  return generatedTasks;
};
