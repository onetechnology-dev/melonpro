import React from 'react';
import { 
  Droplets, 
  Sparkles, 
  Scissors, 
  Flower2, 
  Bug, 
  ClipboardCheck, 
  Scale, 
  Sprout, 
  Sun, 
  ShieldAlert, 
  Wrench, 
  Activity, 
  Thermometer, 
  Layers, 
  Clock, 
  Tag,
  Trees,
  Wheat,
  HeartPulse,
  Compass,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { TaskTypeItem } from '../types/melon';

export interface TaskTypeColorOption {
  key: string;
  labelEn: string;
  labelKm: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  dotBg: string;
  accentBar: string;
  previewClass: string;
}

export const TASK_TYPE_COLOR_PALETTES: Record<string, TaskTypeColorOption> = {
  blue: {
    key: 'blue',
    labelEn: 'Blue (Water / Irrigation)',
    labelKm: 'ខៀវ (ស្រោចទឹក / ទុយោ)',
    badgeBg: 'bg-blue-50 text-blue-700',
    badgeText: 'text-blue-700',
    borderColor: 'border-blue-200',
    dotBg: 'bg-blue-500',
    accentBar: 'bg-blue-600',
    previewClass: 'bg-blue-500 text-white',
  },
  emerald: {
    key: 'emerald',
    labelEn: 'Emerald (Fertilizer / Nutrition)',
    labelKm: 'បៃតងចាស់ (ជី / ជីវជាតិ)',
    badgeBg: 'bg-emerald-50 text-emerald-800',
    badgeText: 'text-emerald-800',
    borderColor: 'border-emerald-200',
    dotBg: 'bg-emerald-500',
    accentBar: 'bg-emerald-600',
    previewClass: 'bg-emerald-600 text-white',
  },
  teal: {
    key: 'teal',
    labelEn: 'Teal (Vine / Trellising)',
    labelKm: 'បៃតងសមុទ្រ (ថែទាំដើម / ចងទ្រើង)',
    badgeBg: 'bg-teal-50 text-teal-800',
    badgeText: 'text-teal-800',
    borderColor: 'border-teal-200',
    dotBg: 'bg-teal-500',
    accentBar: 'bg-teal-600',
    previewClass: 'bg-teal-600 text-white',
  },
  amber: {
    key: 'amber',
    labelEn: 'Amber (Flowering / Pollination)',
    labelKm: 'លឿងទុំ (ចេញផ្កា / បង្កាត់)',
    badgeBg: 'bg-amber-50 text-amber-800',
    badgeText: 'text-amber-800',
    borderColor: 'border-amber-200',
    dotBg: 'bg-amber-500',
    accentBar: 'bg-amber-500',
    previewClass: 'bg-amber-500 text-white',
  },
  rose: {
    key: 'rose',
    labelEn: 'Rose (Pest / Protection)',
    labelKm: 'ផ្កាឈូកក្រហម (សត្វល្អិត / ជំងឺ)',
    badgeBg: 'bg-rose-50 text-rose-800',
    badgeText: 'text-rose-800',
    borderColor: 'border-rose-200',
    dotBg: 'bg-rose-500',
    accentBar: 'bg-rose-600',
    previewClass: 'bg-rose-500 text-white',
  },
  purple: {
    key: 'purple',
    labelEn: 'Purple (Prep / Quality)',
    labelKm: 'ស្វាយ (ត្រៀម / គុណភាព)',
    badgeBg: 'bg-purple-50 text-purple-800',
    badgeText: 'text-purple-800',
    borderColor: 'border-purple-200',
    dotBg: 'bg-purple-500',
    accentBar: 'bg-purple-600',
    previewClass: 'bg-purple-600 text-white',
  },
  orange: {
    key: 'orange',
    labelEn: 'Orange (Harvest / Sorting)',
    labelKm: 'ទឹកក្រូច (ប្រមូលផល / ចាត់ថ្នាក់)',
    badgeBg: 'bg-orange-50 text-orange-800',
    badgeText: 'text-orange-800',
    borderColor: 'border-orange-200',
    dotBg: 'bg-orange-500',
    accentBar: 'bg-orange-600',
    previewClass: 'bg-orange-500 text-white',
  },
  lime: {
    key: 'lime',
    labelEn: 'Lime (Pruning / Training)',
    labelKm: 'បៃតងខ្ចី (កាត់តម្រឹម / ចងមែក)',
    badgeBg: 'bg-lime-50 text-lime-800',
    badgeText: 'text-lime-800',
    borderColor: 'border-lime-300',
    dotBg: 'bg-lime-500',
    accentBar: 'bg-lime-600',
    previewClass: 'bg-lime-600 text-white',
  },
  indigo: {
    key: 'indigo',
    labelEn: 'Indigo (Environment / Sensor)',
    labelKm: 'ទឹកប៊ិចចាស់ (បរិយាកាស / សេនស័រ)',
    badgeBg: 'bg-indigo-50 text-indigo-800',
    badgeText: 'text-indigo-800',
    borderColor: 'border-indigo-200',
    dotBg: 'bg-indigo-500',
    accentBar: 'bg-indigo-600',
    previewClass: 'bg-indigo-600 text-white',
  },
  cyan: {
    key: 'cyan',
    labelEn: 'Cyan (Foliar / Spraying)',
    labelKm: 'ផ្ទៃមេឃ (បាញ់ថ្នាំលើស្លឹក)',
    badgeBg: 'bg-cyan-50 text-cyan-800',
    badgeText: 'text-cyan-800',
    borderColor: 'border-cyan-200',
    dotBg: 'bg-cyan-500',
    accentBar: 'bg-cyan-600',
    previewClass: 'bg-cyan-600 text-white',
  },
  slate: {
    key: 'slate',
    labelEn: 'Slate (General / Admin)',
    labelKm: 'ប្រផេះ (ទូទៅ / រដ្ឋបាល)',
    badgeBg: 'bg-slate-100 text-slate-800',
    badgeText: 'text-slate-800',
    borderColor: 'border-slate-300',
    dotBg: 'bg-slate-500',
    accentBar: 'bg-slate-600',
    previewClass: 'bg-slate-600 text-white',
  },
};

export const AVAILABLE_TASK_ICONS = [
  { name: 'Droplets', label: 'Droplets (Water)' },
  { name: 'Sparkles', label: 'Sparkles (Fertilizer)' },
  { name: 'Scissors', label: 'Scissors (Pruning)' },
  { name: 'Flower2', label: 'Flower (Pollination)' },
  { name: 'Bug', label: 'Bug (Pest Scouting)' },
  { name: 'ClipboardCheck', label: 'Clipboard (Inspection)' },
  { name: 'Scale', label: 'Scale (Harvest)' },
  { name: 'Sprout', label: 'Sprout (Seedling)' },
  { name: 'Sun', label: 'Sun (Climate)' },
  { name: 'ShieldAlert', label: 'Shield (Treatment)' },
  { name: 'Wrench', label: 'Wrench (Maintenance)' },
  { name: 'Activity', label: 'Activity (Health Check)' },
  { name: 'Thermometer', label: 'Thermometer (Sensors)' },
  { name: 'Layers', label: 'Layers (Substrate)' },
  { name: 'Trees', label: 'Trees (Orchard / Greenhouse)' },
  { name: 'Wheat', label: 'Wheat (Crop)' },
  { name: 'HeartPulse', label: 'HeartPulse (Care)' },
  { name: 'Compass', label: 'Compass (Field Plan)' },
  { name: 'Clock', label: 'Clock (Timing)' },
  { name: 'Tag', label: 'Tag (Custom)' },
];

export const getTaskTypeIcon = (iconName?: string, className: string = 'w-4 h-4'): React.ReactNode => {
  switch (iconName) {
    case 'Droplets': return <Droplets className={className} />;
    case 'Sparkles': return <Sparkles className={className} />;
    case 'Scissors': return <Scissors className={className} />;
    case 'Flower2': return <Flower2 className={className} />;
    case 'Bug': return <Bug className={className} />;
    case 'ClipboardCheck': return <ClipboardCheck className={className} />;
    case 'Scale': return <Scale className={className} />;
    case 'Sprout': return <Sprout className={className} />;
    case 'Sun': return <Sun className={className} />;
    case 'ShieldAlert': return <ShieldAlert className={className} />;
    case 'Wrench': return <Wrench className={className} />;
    case 'Activity': return <Activity className={className} />;
    case 'Thermometer': return <Thermometer className={className} />;
    case 'Layers': return <Layers className={className} />;
    case 'Trees': return <Trees className={className} />;
    case 'Wheat': return <Wheat className={className} />;
    case 'HeartPulse': return <HeartPulse className={className} />;
    case 'Compass': return <Compass className={className} />;
    case 'Clock': return <Clock className={className} />;
    default: return <Tag className={className} />;
  }
};

export const getColorStyle = (colorKey: string) => {
  return TASK_TYPE_COLOR_PALETTES[colorKey] || TASK_TYPE_COLOR_PALETTES.blue;
};

export const DEFAULT_TASK_TYPES: TaskTypeItem[] = [
  {
    id: 'type-watering',
    key: 'watering',
    nameEn: 'Watering & Drip',
    nameKm: 'ស្រោចទឹក និងទុយោដំណក់',
    descriptionEn: 'Daily root zone hydration, EC/pH drip irrigation, and moisture balance in substrate bags.',
    descriptionKm: 'ការស្រោចទឹកតាមប្រព័ន្ធដំណក់ ត្រួតពិនិត្យជាតិប្រៃ EC និងកម្រិត pH ដី ឬស្មៅដូង។',
    color: 'blue',
    iconName: 'Droplets',
    badgeBg: 'bg-blue-50 text-blue-700',
    badgeText: 'text-blue-700',
    borderColor: 'border-blue-200',
    isSystem: true,
  },
  {
    id: 'type-fertilizing',
    key: 'fertilizing',
    nameEn: 'Fertilizing & Feeding',
    nameKm: 'បញ្ចូលជី និងសារធាតុចិញ្ចឹម',
    descriptionEn: 'Formulated NPK, Calcium Nitrate, and micronutrient fertigation schedules per growth stage.',
    descriptionKm: 'ការបញ្ចូលជីរូបមន្ត A & B កាល់ស្យូមនីត្រាត និងសារធាតុចិញ្ចឹមត្រសក់ផ្អែម។',
    color: 'emerald',
    iconName: 'Sparkles',
    badgeBg: 'bg-emerald-50 text-emerald-800',
    badgeText: 'text-emerald-800',
    borderColor: 'border-emerald-200',
    isSystem: true,
  },
  {
    id: 'type-vine_maintenance',
    key: 'vine_maintenance',
    nameEn: 'Vine Maintenance',
    nameKm: 'ថែទាំដើម និងកាត់ខ្នែង',
    descriptionEn: 'Vertical vine trellising with clips, stem training, and lateral shoot pruning below node 8.',
    descriptionKm: 'ចងដើមឡើងត្រង់តាមខ្សែ គាបក្លីប និងកាត់ខ្នែងចំហៀងក្រោមថ្នាំងទី ៨ ចេញ។',
    color: 'teal',
    iconName: 'Scissors',
    badgeBg: 'bg-teal-50 text-teal-800',
    badgeText: 'text-teal-800',
    borderColor: 'border-teal-200',
    isSystem: true,
  },
  {
    id: 'type-flowering_pollination',
    key: 'flowering_pollination',
    nameEn: 'Flowering & Pollination',
    nameKm: 'ចេញផ្កា និងបង្កាត់លម្អង',
    descriptionEn: 'Manual flower pollination from 06:30-10:30 AM on nodes 9-13 and tag date marking.',
    descriptionKm: 'បង្កាត់លម្អងផ្កាញីដោយដៃពេលព្រឹកព្រលឹមលើថ្នាំងទី ៩ ដល់ ១៣ និងចងស្លាកកាលបរិច្ឆេទ។',
    color: 'amber',
    iconName: 'Flower2',
    badgeBg: 'bg-amber-50 text-amber-800',
    badgeText: 'text-amber-800',
    borderColor: 'border-amber-200',
    isSystem: true,
  },
  {
    id: 'type-pest_check',
    key: 'pest_check',
    nameEn: 'Pest & Disease Scouting',
    nameKm: 'ត្រួតពិនិត្យសត្វល្អិត និងជំងឺ',
    descriptionEn: 'Inspecting yellow sticky traps, leaf undersides for thrips, red spider mites, or downy mildew.',
    descriptionKm: 'ពិនិត្យអន្ទាក់ស្អិតពណ៌លឿង ពិនិត្យក្រោមកូនស្លឹកស្វែងរកដង្កូវ ទ្រីប និងផ្សិត។',
    color: 'rose',
    iconName: 'Bug',
    badgeBg: 'bg-rose-50 text-rose-800',
    badgeText: 'text-rose-800',
    borderColor: 'border-rose-200',
    isSystem: true,
  },
  {
    id: 'type-harvest_prep',
    key: 'harvest_prep',
    nameEn: 'Harvest Preparation',
    nameKm: 'រៀបចំប្រមូលផល',
    descriptionEn: 'Brix sweetness refractometer testing, watering cut-off 3-5 days prior to harvest for sugar accumulation.',
    descriptionKm: 'វាស់កម្រិតផ្អែម Brix បន្ថយ ឬផ្អាកស្រោចទឹក ៣-៥ ថ្ងៃមុនប្រមូលផលដើម្បីបង្កើនជាតិស្ករ។',
    color: 'purple',
    iconName: 'ClipboardCheck',
    badgeBg: 'bg-purple-50 text-purple-800',
    badgeText: 'text-purple-800',
    borderColor: 'border-purple-200',
    isSystem: true,
  },
  {
    id: 'type-harvest',
    key: 'harvest',
    nameEn: 'Harvest & Sorting',
    nameKm: 'ប្រមូលផល និងចាត់ថ្នាក់',
    descriptionEn: 'T-stem cutting in cool morning, melon weighing, grading, and foam net packaging into crates.',
    descriptionKm: 'កាត់ទងផ្លែរាងអក្សរ T នៅពេលព្រលឹមត្រជាក់ ថ្លឹងទម្ងន់ ចាត់ថ្នាក់ និងវេចខ្ចប់។',
    color: 'orange',
    iconName: 'Scale',
    badgeBg: 'bg-orange-50 text-orange-800',
    badgeText: 'text-orange-800',
    borderColor: 'border-orange-200',
    isSystem: true,
  },
  {
    id: 'type-pruning',
    key: 'pruning',
    nameEn: 'Shoot Pruning & Training',
    nameKm: 'កាត់តម្រឹមមែក និងស្លឹកចាស់',
    descriptionEn: 'Removing lower aging leaves and unproductive shoots to enhance airflow and sunlight penetration.',
    descriptionKm: 'កាត់ស្លឹកចាស់ៗផ្នែកខាងក្រោមចេញ ដើម្បីបង្កើនខ្យល់ចេញចូល និងពន្លឺថ្ងៃ។',
    color: 'lime',
    iconName: 'Scissors',
    badgeBg: 'bg-lime-50 text-lime-800',
    badgeText: 'text-lime-800',
    borderColor: 'border-lime-300',
    isSystem: true,
  },
];
