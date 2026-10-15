import defaultGreenhouseBg from '../assets/images/greenhouse_mode_bg.jpg';
import aerialNetHousesBg from '../assets/images/Aerial Farm Map with Net Houses.png';
import aerial3dFarmBg from '../assets/images/Aerial 3D melon farm map.png';
import aerialMelonFarmBg from '../assets/images/Aerial melon net house farm.png';

export interface LoginBackgroundConfig {
  url: string; // Preset ID (e.g. 'preset:default'), or full URL / data URL
  blur: 'none' | 'subtle' | 'medium' | 'deep';
  darkness: 'light' | 'balanced' | 'deep';
}

export interface LoginBackgroundPreset {
  id: string;
  name: string;
  nameKm: string;
  description: string;
  descriptionKm: string;
  url: string;
  category: 'greenhouse' | 'aerial' | 'harvest' | 'smart';
  tag: string;
}

export const DEFAULT_LOGIN_BG_CONFIG: LoginBackgroundConfig = {
  url: 'preset:default',
  blur: 'subtle',
  darkness: 'balanced',
};

export const LOGIN_BG_PRESETS: LoginBackgroundPreset[] = [
  {
    id: 'preset:default',
    name: 'Smart Greenhouse Sanctuary (Default)',
    nameKm: 'ផ្ទះសំណាញ់ត្រសក់ផ្អែមឆ្លាតវៃ (ទម្រង់ដើម)',
    description: 'Lush green melon foliage under state-of-the-art framework with ambient natural lighting',
    descriptionKm: 'ទិដ្ឋភាពជួរដំណាំត្រសក់ផ្អែមខៀវស្រងាត់ក្នុងផ្ទះសំណាញ់ទំនើប',
    url: defaultGreenhouseBg,
    category: 'greenhouse',
    tag: 'Classic Default',
  },
  {
    id: 'preset:aerial-nethouses',
    name: 'Aerial Net Houses Drone Survey',
    nameKm: 'ទិដ្ឋភាពពីលើអាកាសផ្ទះសំណាញ់ចំការ',
    description: 'Top-down aerial orthomosaic of commercial net house installations and parcels',
    descriptionKm: 'ទិដ្ឋភាពពីដ្រូនពីលើអាកាសបង្ហាញពីរចនាសម្ព័ន្ធផ្ទះសំណាញ់ពាណិជ្ជកម្ម',
    url: aerialNetHousesBg,
    category: 'aerial',
    tag: 'Drone Survey',
  },
  {
    id: 'preset:aerial-3d',
    name: '3D Smart Agro-Park Digital Twin',
    nameKm: 'ផែនទី 3D ចំការឌីជីថលឆ្លាតវៃ',
    description: 'High-definition 3D terrain modeling showing net house plots and irrigation infrastructure',
    descriptionKm: 'ទម្រង់ផែនទី 3D បង្ហាញពីប្លង់ដីចំការ និងប្រព័ន្ធស្រោចស្រពឆ្លាតវៃ',
    url: aerial3dFarmBg,
    category: 'smart',
    tag: 'Digital Twin',
  },
  {
    id: 'preset:aerial-melon',
    name: 'Commercial Melon Plantation',
    nameKm: 'ចំការត្រសក់ផ្អែមពាណិជ្ជកម្មខ្នាតធំ',
    description: 'Panoramic landscape showing commercial net houses surrounded by fertile agro-zones',
    descriptionKm: 'ទិដ្ឋភាពទេសភាពចំការត្រសក់ផ្អែមពាណិជ្ជកម្មហ៊ុំព័ទ្ធដោយតំបន់កសិកម្ម',
    url: aerialMelonFarmBg,
    category: 'aerial',
    tag: 'Landscape',
  },
  {
    id: 'preset:hydroponic-tech',
    name: 'Automated Hydroponic Glasshouse',
    nameKm: 'ផ្ទះកញ្ចក់វៃឆ្លាត Hydroponic',
    description: 'Modern climate-controlled hydroponic greenhouse with precision fertigation',
    descriptionKm: 'ផ្ទះកញ្ចក់ទំនើបគ្រប់គ្រងអាកាសធាតុជាមួយប្រព័ន្ធផ្តល់ជីទឹកស្វ័យប្រវត្តិ',
    url: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=2000&q=80',
    category: 'smart',
    tag: 'High-Tech Glasshouse',
  },
  {
    id: 'preset:golden-sunset',
    name: 'Golden Hour Agricultural Horizon',
    nameKm: 'ចំការពេលថ្ងៃរៀបលិចពណ៌មាស',
    description: 'Warm golden sunlight casting across organic greenhouse structures and crop canopies',
    descriptionKm: 'ពន្លឺព្រះអាទិត្យពណ៌មាសចាំងឆ្លុះលើរោងដំណាំកសិកម្មធម្មជាតិ',
    url: 'https://images.unsplash.com/photo-1592417817098-8f3d6910985c?auto=format&fit=crop&w=2000&q=80',
    category: 'greenhouse',
    tag: 'Golden Sunset',
  },
  {
    id: 'preset:melon-harvest',
    name: 'Premium Sweet Cantaloupes Harvest',
    nameKm: 'ផ្លែត្រសក់ផ្អែមប្រមូលផលកម្រិតពិសេស',
    description: 'Vibrant sweet melons ready for market grading and high-yield delivery',
    descriptionKm: 'ផ្លែត្រសក់ផ្អែមស្រស់ៗគុណភាពខ្ពស់ត្រៀមប្រមូលផលចេញលក់លើទីផ្សារ',
    url: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=2000&q=80',
    category: 'harvest',
    tag: 'Fresh Harvest',
  },
  {
    id: 'preset:precision-nursery',
    name: 'Precision Nursery & Smart Seedlings',
    nameKm: 'ថ្នាលបណ្តុះកូនដំណាំបច្ចេកវិទ្យាច្បាស់លាស់',
    description: 'Controlled micro-climate nursery ensuring high seedling vigor and germination',
    descriptionKm: 'ថ្នាលបណ្តុះកូនដំណាំជាមួយការគ្រប់គ្រងសំណើម និងសីតុណ្ហភាពសុក្រឹត',
    url: 'https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?auto=format&fit=crop&w=2000&q=80',
    category: 'smart',
    tag: 'Precision Seedlings',
  },
];

/**
 * Resolves a stored background URL / preset ID to a renderable image URL.
 */
export function resolveLoginBackgroundUrl(rawUrl?: string | null): string {
  if (!rawUrl || rawUrl === 'preset:default') {
    return defaultGreenhouseBg;
  }

  // Check if it's one of the curated presets
  const preset = LOGIN_BG_PRESETS.find((p) => p.id === rawUrl);
  if (preset) {
    return preset.url;
  }

  // Otherwise, it is a custom image (http/https URL, data URL, or local path)
  return rawUrl;
}

/**
 * Parses raw settings value (which could be a JSON string or plain URL string).
 */
export function parseLoginBgConfig(raw: any): LoginBackgroundConfig {
  if (!raw) {
    return { ...DEFAULT_LOGIN_BG_CONFIG };
  }

  if (typeof raw === 'object' && raw.url) {
    return {
      url: raw.url || 'preset:default',
      blur: raw.blur || 'subtle',
      darkness: raw.darkness || 'balanced',
    };
  }

  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        return {
          url: parsed.url || 'preset:default',
          blur: parsed.blur || 'subtle',
          darkness: parsed.darkness || 'balanced',
        };
      } catch {
        // Fallback to treating as plain URL
      }
    }
    return {
      url: trimmed || 'preset:default',
      blur: 'subtle',
      darkness: 'balanced',
    };
  }

  return { ...DEFAULT_LOGIN_BG_CONFIG };
}

/**
 * Returns CSS classes for overlay darkness.
 */
export function getDarknessOverlayClasses(darkness: 'light' | 'balanced' | 'deep'): string {
  switch (darkness) {
    case 'light':
      return 'bg-gradient-to-br from-slate-950/65 via-emerald-950/50 to-slate-950/70';
    case 'deep':
      return 'bg-gradient-to-br from-slate-950/94 via-emerald-950/90 to-slate-950/96';
    case 'balanced':
    default:
      return 'bg-gradient-to-br from-slate-950/88 via-emerald-950/80 to-slate-950/92';
  }
}

/**
 * Returns CSS classes or filter for blur.
 */
export function getBlurClass(blur: 'none' | 'subtle' | 'medium' | 'deep'): string {
  switch (blur) {
    case 'none':
      return 'backdrop-blur-none';
    case 'medium':
      return 'backdrop-blur-[6px]';
    case 'deep':
      return 'backdrop-blur-[12px]';
    case 'subtle':
    default:
      return 'backdrop-blur-[2px]';
  }
}
