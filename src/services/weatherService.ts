export interface FarmLocation {
  id: string;
  nameEn: string;
  nameKm: string;
  lat: number;
  lng: number;
  provinceEn: string;
  provinceKm: string;
}

export const FARM_LOCATIONS: FarmLocation[] = [
  {
    id: 'battambang',
    nameEn: 'MelonPro Farm Hub (Battambang)',
    nameKm: 'ចំការមេឡុងប្រូ (ខេត្តបាត់ដំបង)',
    lat: 13.0957,
    lng: 103.2022,
    provinceEn: 'Battambang',
    provinceKm: 'ខេត្តបាត់ដំបង',
  },
  {
    id: 'kandal-main',
    nameEn: 'MelonPro Central Farm (Kandal)',
    nameKm: 'ចំការមេឡុងប្រូកណ្តាល (ខេត្តកណ្តាល)',
    lat: 11.4886,
    lng: 104.8324,
    provinceEn: 'Kandal Province',
    provinceKm: 'ខេត្តកណ្តាល',
  },
  {
    id: 'kampong-speu',
    nameEn: 'Greenhouse Zone B (Kampong Speu)',
    nameKm: 'តំបន់ផ្ទះសំណាញ់ B (កំពង់ស្ពឺ)',
    lat: 11.4533,
    lng: 104.5209,
    provinceEn: 'Kampong Speu',
    provinceKm: 'ខេត្តកំពង់ស្ពឺ',
  },
  {
    id: 'siem-reap',
    nameEn: 'Northern Horticultural Hub (Siem Reap)',
    nameKm: 'មជ្ឈមណ្ឌលកសិកម្មភាគខាងជើង (សៀមរាប)',
    lat: 13.3671,
    lng: 103.8448,
    provinceEn: 'Siem Reap',
    provinceKm: 'ខេត្តសៀមរាប',
  },
];

export const DEFAULT_FARM_LOCATION = FARM_LOCATIONS[0]; // Battambang

export interface RealTimeWeather {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  precipitation: number;
  rain: number;
  weatherCode: number;
  windSpeed: number;
  windDirection: number;
  uvIndex: number;
  conditionEn: string;
  conditionKm: string;
  iconName: 'sun' | 'cloud-sun' | 'cloud' | 'cloud-rain' | 'cloud-lightning';
  updatedAt: string;
  isDay: boolean;
  forecast: DailyForecast[];
  hourly: HourlyForecast[];
  melonImpacts: MelonWeatherImpact;
}

export interface DailyForecast {
  date: string;
  dayEn: string;
  dayKm: string;
  maxTemp: number;
  minTemp: number;
  weatherCode: number;
  rainProbability: number;
  uvIndexMax: number;
  conditionEn: string;
  conditionKm: string;
  iconName: 'sun' | 'cloud-sun' | 'cloud' | 'cloud-rain' | 'cloud-lightning';
}

export interface HourlyForecast {
  time: string;
  hour: string;
  temp: number;
  humidity: number;
  rainProb: number;
}

export interface MelonWeatherImpact {
  pollinationStatus: 'optimal' | 'moderate' | 'critical';
  pollinationMessageEn: string;
  pollinationMessageKm: string;
  diseaseRisk: 'low' | 'medium' | 'high';
  diseaseMessageEn: string;
  diseaseMessageKm: string;
  irrigationAdjustmentPct: number; // e.g. +10% or -15%
  irrigationMessageEn: string;
  irrigationMessageKm: string;
  brixSunlightScore: number; // 0-100
  brixMessageEn: string;
  brixMessageKm: string;
  vpdValue: number; // kPa (Vapor Pressure Deficit)
}

// Convert WMO code to condition text and icon
export function parseWmoCode(code: number): {
  en: string;
  km: string;
  iconName: 'sun' | 'cloud-sun' | 'cloud' | 'cloud-rain' | 'cloud-lightning';
} {
  switch (code) {
    case 0:
      return { en: 'Clear Sky', km: 'មេឃស្រឡះល្អ', iconName: 'sun' };
    case 1:
      return { en: 'Mainly Clear', km: 'មេឃស្រឡះភាគច្រើន', iconName: 'sun' };
    case 2:
      return { en: 'Partly Cloudy', km: 'មានពពកតិចតួច', iconName: 'cloud-sun' };
    case 3:
      return { en: 'Overcast', km: 'ពពកច្រើនក្រាស់', iconName: 'cloud' };
    case 45:
    case 48:
      return { en: 'Foggy', km: 'មានអ័ព្ទ', iconName: 'cloud' };
    case 51:
    case 53:
    case 55:
      return { en: 'Drizzle', km: 'ភ្លៀងរលឹមស្រិចៗ', iconName: 'cloud-rain' };
    case 61:
      return { en: 'Light Rain', km: 'ភ្លៀងធ្លាក់តិចៗ', iconName: 'cloud-rain' };
    case 63:
      return { en: 'Moderate Rain', km: 'ភ្លៀងធ្លាក់មធ្យម', iconName: 'cloud-rain' };
    case 65:
      return { en: 'Heavy Rain', km: 'ភ្លៀងធ្លាក់ខ្លាំង', iconName: 'cloud-rain' };
    case 80:
    case 81:
    case 82:
      return { en: 'Rain Showers', km: 'ភ្លៀងធ្លាក់រាយប៉ាយ', iconName: 'cloud-rain' };
    case 95:
    case 96:
    case 99:
      return { en: 'Thunderstorm', km: 'ផ្គររន្ទះ និងខ្យល់កន្ត្រាក់', iconName: 'cloud-lightning' };
    default:
      return { en: 'Partly Cloudy', km: 'មានពពកតិចតួច', iconName: 'cloud-sun' };
  }
}

// Calculate Vapor Pressure Deficit (VPD) in kPa
export function calculateVpd(temp: number, humidity: number): number {
  // Saturation vapor pressure SVP = 0.61078 * exp((17.27 * T) / (T + 237.3))
  const svp = 0.61078 * Math.exp((17.27 * temp) / (temp + 237.3));
  const avp = svp * (humidity / 100);
  const vpd = svp - avp;
  return Number(vpd.toFixed(2));
}

// Compute specific melon crop agronomic impacts
export function analyzeMelonImpacts(
  temp: number,
  humidity: number,
  rainProb: number,
  windSpeed: number,
  uvIndex: number
): MelonWeatherImpact {
  const vpd = calculateVpd(temp, humidity);

  // 1. Pollination evaluation (melons need 24-32°C, wind < 15km/h, no heavy rain)
  let pollinationStatus: 'optimal' | 'moderate' | 'critical' = 'optimal';
  let pollinationMessageEn = 'Optimal temperature & low wind. High pollen viability and active bee visitation.';
  let pollinationMessageKm = 'សីតុណ្ហភាព និងខ្យល់អំណោយផលល្អ។ លម្អងមានគុណភាពខ្ពស់ និងឃ្មុំបង្កាត់សកម្ម។';

  if (temp > 35) {
    pollinationStatus = 'critical';
    pollinationMessageEn = 'Heat stress (>35°C) causes pollen sterility & flower drop. Complete hand pollination before 8:30 AM.';
    pollinationMessageKm = 'កម្ដៅខ្លាំង (>35°C) ធ្វើឱ្យលម្អងស្ងួត និងជ្រុះផ្កា។ ត្រូវបង្កាត់លម្អងឱ្យចប់មុនម៉ោង 8:30 ព្រឹក។';
  } else if (temp > 32 || windSpeed > 18 || rainProb > 50) {
    pollinationStatus = 'moderate';
    pollinationMessageEn = 'Moderate conditions. Ensure greenhouse side-nets are adjusted to stabilize air flow.';
    pollinationMessageKm = 'លក្ខខណ្ឌមធ្យម។ សម្រួលសំណាញ់ចំហៀងផ្ទះសំណាញ់ដើម្បីការពារលំហូរខ្យល់។';
  }

  // 2. Fungal Pathogen & Disease Risk (Powdery & Downy Mildew thrive in humidity > 75%)
  let diseaseRisk: 'low' | 'medium' | 'high' = 'low';
  let diseaseMessageEn = 'Low humidity and dry foliage. Low risk for downy mildew and gummy stem blight.';
  let diseaseMessageKm = 'សំណើមទាប និងស្លឹកស្ងួតល្អ។ ហានិភ័យទាបនៃជំងឺផ្សិតស្លឹក និងរលួយដើម។';

  if (humidity > 80 || rainProb > 65) {
    diseaseRisk = 'high';
    diseaseMessageEn = 'High relative humidity (>80%). Extreme risk for Downy Mildew (Pseudoperonospora cubensis). Activate circulation fans.';
    diseaseMessageKm = 'សំណើមខ្ពស់ខ្លាំង (>80%)។ ហានិភ័យខ្ពស់នៃជំងឺផ្សិតស្លឹកផ្កាយ។ បើកកង្ហារបញ្ចេញខ្យល់ជាបន្ទាន់។';
  } else if (humidity > 70) {
    diseaseRisk = 'medium';
    diseaseMessageEn = 'Elevated humidity. Inspect lower leaves for early fungal spores; ensure soil surface is dry.';
    diseaseMessageKm = 'សំណើមកើនឡើង។ ពិនិត្យស្លឹកក្រោមរកស្ព័រផ្សិត និងរក្សាផ្ទៃរងកុំឱ្យដក់ទឹក។';
  }

  // 3. Irrigation Volume Adjustment
  let irrigationAdjustmentPct = 0;
  let irrigationMessageEn = 'Standard drip irrigation schedule maintains target 65% soil moisture.';
  let irrigationMessageKm = 'កាលវិភាគស្រោចស្រពដំណក់ទឹកធម្មតា រក្សាសំណើមដី 65%។';

  if (temp > 33 && humidity < 55) {
    irrigationAdjustmentPct = +15;
    irrigationMessageEn = 'High evapotranspiration (VPD > 1.4 kPa). Increase drip fertigation duration by 15%.';
    irrigationMessageKm = 'ការហួតទឹកខ្ពស់ (VPD > 1.4 kPa)។ បង្កើនការស្រោចស្រពជីដំណក់ទឹក 15% បន្ថែម។';
  } else if (rainProb > 70) {
    irrigationAdjustmentPct = -25;
    irrigationMessageEn = 'Rain expected. Open-field valve cycles paused; greenhouse fertigation reduced by 25%.';
    irrigationMessageKm = 'អាចមានភ្លៀងធ្លាក់។ ពន្យារស្រោចស្រពចំការបើកចំហ និងកាត់បន្ថយក្នុងផ្ទះសំណាញ់ 25%។';
  }

  // 4. Brix & Sugar Accumulation Score
  const brixScore = Math.min(100, Math.max(30, Math.round((uvIndex * 8) + (temp > 26 && temp < 34 ? 25 : 10))));
  let brixMessageEn = 'High photosynthesis rate. Optimal sunlight drives sucrose transfer into melon fruit.';
  let brixMessageKm = 'រស្មីសំយោគខ្ពស់ល្អ។ ពន្លឺថ្ងៃជំរុញជាតិស្ករកើនឡើងក្នុងសាច់ផ្លែមេឡុង។';

  if (uvIndex < 4 || rainProb > 60) {
    brixMessageEn = 'Low sunlight & diffuse clouds. Sugar accumulation is slowed; avoid over-watering near harvest.';
    brixMessageKm = 'ពន្លឺថ្ងៃខ្សោយ។ ជាតិស្ករកើនយឺត ជៀសវាងការស្រោចទឹកច្រើនជិតពេលប្រមូលផល។';
  }

  return {
    pollinationStatus,
    pollinationMessageEn,
    pollinationMessageKm,
    diseaseRisk,
    diseaseMessageEn,
    diseaseMessageKm,
    irrigationAdjustmentPct,
    irrigationMessageEn,
    irrigationMessageKm,
    brixSunlightScore: brixScore,
    brixMessageEn,
    brixMessageKm,
    vpdValue: vpd,
  };
}

const CACHE_KEY_PREFIX = 'melonpro_weather_cache_';

export async function fetchRealTimeWeather(location: FarmLocation): Promise<RealTimeWeather> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,weather_code,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,relative_humidity_2m,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max&timezone=auto`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Weather fetch failed: ${response.status}`);
    }

    const data = await response.json();
    const current = data.current;
    const daily = data.daily;
    const hourly = data.hourly;

    const weatherCond = parseWmoCode(current.weather_code);
    const uvNow = daily?.uv_index_max?.[0] ?? 7.5;
    const rainProbNow = daily?.precipitation_probability_max?.[0] ?? 10;

    const melonImpacts = analyzeMelonImpacts(
      current.temperature_2m,
      current.relative_humidity_2m,
      rainProbNow,
      current.wind_speed_10m,
      uvNow
    );

    // Build 5-day daily forecast
    const forecast: DailyForecast[] = [];
    const dayNamesEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayNamesKm = ['អាទិត្យ', 'ច័ន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍'];

    const todayDate = new Date();
    for (let i = 0; i < Math.min(5, daily?.time?.length || 0); i++) {
      const dObj = new Date(daily.time[i]);
      const dayIndex = dObj.getDay();
      const isToday = i === 0;
      const parsed = parseWmoCode(daily.weather_code[i]);

      forecast.push({
        date: daily.time[i],
        dayEn: isToday ? 'Today' : dayNamesEn[dayIndex],
        dayKm: isToday ? 'ថ្ងៃនេះ' : dayNamesKm[dayIndex],
        maxTemp: Math.round(daily.temperature_2m_max[i]),
        minTemp: Math.round(daily.temperature_2m_min[i]),
        weatherCode: daily.weather_code[i],
        rainProbability: daily.precipitation_probability_max?.[i] ?? 0,
        uvIndexMax: daily.uv_index_max?.[i] ?? 7,
        conditionEn: parsed.en,
        conditionKm: parsed.km,
        iconName: parsed.iconName,
      });
    }

    // Build next 12 hours
    const hourlyForecasts: HourlyForecast[] = [];
    const currentHourIndex = todayDate.getHours();
    if (hourly?.time) {
      for (let h = currentHourIndex; h < Math.min(currentHourIndex + 12, hourly.time.length); h++) {
        const timeStr = hourly.time[h];
        const hNum = new Date(timeStr).getHours();
        hourlyForecasts.push({
          time: timeStr,
          hour: `${hNum}:00`,
          temp: Math.round(hourly.temperature_2m[h]),
          humidity: Math.round(hourly.relative_humidity_2m[h]),
          rainProb: hourly.precipitation_probability?.[h] ?? 0,
        });
      }
    }

    const weatherResult: RealTimeWeather = {
      temperature: Math.round(current.temperature_2m),
      apparentTemperature: Math.round(current.apparent_temperature),
      humidity: Math.round(current.relative_humidity_2m),
      precipitation: current.precipitation,
      rain: current.rain,
      weatherCode: current.weather_code,
      windSpeed: Math.round(current.wind_speed_10m),
      windDirection: current.wind_direction_10m,
      uvIndex: Math.round(uvNow * 10) / 10,
      conditionEn: weatherCond.en,
      conditionKm: weatherCond.km,
      iconName: weatherCond.iconName,
      updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isDay: Boolean(current.is_day),
      forecast,
      hourly: hourlyForecasts,
      melonImpacts,
    };

    // Cache locally
    try {
      localStorage.setItem(`${CACHE_KEY_PREFIX}${location.id}`, JSON.stringify(weatherResult));
    } catch {
      // Ignore storage errors
    }

    return weatherResult;
  } catch (error) {
    console.warn('Real-time weather fetch error, loading cached or fallback data:', error);
    
    // Attempt cache read
    try {
      const cached = localStorage.getItem(`${CACHE_KEY_PREFIX}${location.id}`);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {
      // ignore
    }

    // Fallback realistic tropical agricultural weather for Cambodia
    return getFallbackWeather();
  }
}

function getFallbackWeather(): RealTimeWeather {
  const impacts = analyzeMelonImpacts(32, 68, 15, 11, 8.2);
  return {
    temperature: 32,
    apparentTemperature: 35,
    humidity: 68,
    precipitation: 0,
    rain: 0,
    weatherCode: 2,
    windSpeed: 11,
    windDirection: 180,
    uvIndex: 8.2,
    conditionEn: 'Partly Cloudy',
    conditionKm: 'មានពពកតិចតួច',
    iconName: 'cloud-sun',
    updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isDay: true,
    forecast: [
      { date: '2025-04-20', dayEn: 'Today', dayKm: 'ថ្ងៃនេះ', maxTemp: 33, minTemp: 24, weatherCode: 2, rainProbability: 15, uvIndexMax: 8.2, conditionEn: 'Partly Cloudy', conditionKm: 'មានពពកតិចតួច', iconName: 'cloud-sun' },
      { date: '2025-04-21', dayEn: 'Mon', dayKm: 'ច័ន្ទ', maxTemp: 34, minTemp: 25, weatherCode: 1, rainProbability: 10, uvIndexMax: 8.5, conditionEn: 'Sunny', conditionKm: 'មេឃស្រឡះ', iconName: 'sun' },
      { date: '2025-04-22', dayEn: 'Tue', dayKm: 'អង្គារ', maxTemp: 33, minTemp: 25, weatherCode: 2, rainProbability: 20, uvIndexMax: 8.0, conditionEn: 'Partly Cloudy', conditionKm: 'មានពពកតិចតួច', iconName: 'cloud-sun' },
      { date: '2025-04-23', dayEn: 'Wed', dayKm: 'ពុធ', maxTemp: 31, minTemp: 24, weatherCode: 61, rainProbability: 60, uvIndexMax: 6.5, conditionEn: 'Light Rain', conditionKm: 'ភ្លៀងធ្លាក់តិចៗ', iconName: 'cloud-rain' },
      { date: '2025-04-24', dayEn: 'Thu', dayKm: 'ព្រហស្បតិ៍', maxTemp: 32, minTemp: 24, weatherCode: 2, rainProbability: 25, uvIndexMax: 7.8, conditionEn: 'Partly Cloudy', conditionKm: 'មានពពកតិចតួច', iconName: 'cloud-sun' },
    ],
    hourly: [
      { time: '08:00', hour: '8:00', temp: 28, humidity: 76, rainProb: 10 },
      { time: '10:00', hour: '10:00', temp: 31, humidity: 68, rainProb: 10 },
      { time: '12:00', hour: '12:00', temp: 34, humidity: 60, rainProb: 15 },
      { time: '14:00', hour: '14:00', temp: 35, humidity: 56, rainProb: 20 },
      { time: '16:00', hour: '16:00', temp: 33, humidity: 62, rainProb: 25 },
      { time: '18:00', hour: '18:00', temp: 30, humidity: 70, rainProb: 15 },
    ],
    melonImpacts: impacts,
  };
}
