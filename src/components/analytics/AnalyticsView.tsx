import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Droplet, 
  Sprout, 
  Scale, 
  Calendar, 
  CheckCircle2 
} from 'lucide-react';
import { useI18n } from '../../locales/i18nContext';
import { useFarm } from '../../context/FarmContext';

export const AnalyticsView: React.FC = () => {
  const { t, language } = useI18n();
  const { plots, cropCycles, harvestRecords } = useFarm();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-slate-900">
          Agronomy & Yield Analytics / <span className="font-khmer text-emerald-700">វិភាគទិន្នន័យកសិកម្ម</span>
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {language === 'km' 
            ? 'ប្រៀបធៀបប្រសិទ្ធភាពវដ្តដំណាំ ការប្រើប្រាស់ទឹក និងទិន្នផលតាមរដូវកាល' 
            : 'Comparative performance analysis across varieties, greenhouse efficiency, and water usage'}
        </p>
      </div>

      {/* High Level KPI summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Average Brix Level
          </span>
          <span className="text-3xl font-extrabold text-amber-600 font-mono mt-1 block">
            15.1° <span className="text-sm font-semibold text-slate-500">Bx</span>
          </span>
          <span className="text-xs text-emerald-700 font-semibold mt-1 block">
            +0.8° Bx above target
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Water Efficiency
          </span>
          <span className="text-3xl font-extrabold text-sky-600 font-mono mt-1 block">
            32 <span className="text-sm font-semibold text-slate-500">L/kg fruit</span>
          </span>
          <span className="text-xs text-emerald-700 font-semibold mt-1 block">
            -18% drip irrigation saving
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Grade A (Export) Ratio
          </span>
          <span className="text-3xl font-extrabold text-emerald-700 font-mono mt-1 block">
            78.4%
          </span>
          <span className="text-xs text-emerald-700 font-semibold mt-1 block">
            Netting symmetry index 92%
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Seasonal Yield Avg
          </span>
          <span className="text-3xl font-extrabold text-slate-900 font-mono mt-1 block">
            20.2 <span className="text-sm font-semibold text-slate-500">t/ha</span>
          </span>
          <span className="text-xs text-emerald-700 font-semibold mt-1 block">
            18–22 target range met
          </span>
        </div>
      </div>

      {/* Plot Comparison Matrix */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80">
        <h3 className="text-sm font-bold text-slate-900 mb-1">
          {t('cropCycleComparison')}
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Direct comparative breakdown of active greenhouse plots and varieties.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="pb-3 font-bold">Plot / Facility</th>
                <th className="pb-3 font-bold">Variety</th>
                <th className="pb-3 font-bold">Duration</th>
                <th className="pb-3 font-bold">Plant Density</th>
                <th className="pb-3 font-bold">Avg Soil EC / pH</th>
                <th className="pb-3 font-bold">Health Score</th>
                <th className="pb-3 font-bold">Projected Yield</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {plots.map((plot) => (
                <tr key={plot.id} className="hover:bg-slate-50/60">
                  <td className="py-3 font-sans font-bold text-slate-900">
                    {plot.name}
                    <span className="block text-[10px] text-slate-400 font-mono capitalize">
                      {plot.facilityType.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 font-sans text-slate-700 font-medium">
                    {language === 'km' ? plot.melonVarietyKm : plot.melonVarietyEn}
                  </td>
                  <td className="py-3 text-slate-800">
                    85 days (DAS: 52)
                  </td>
                  <td className="py-3 text-slate-800">
                    {(plot.plantCount / plot.areaHa).toFixed(0)} plants/ha
                  </td>
                  <td className="py-3 text-slate-700">
                    EC {plot.soilEc} · pH {plot.soilPh}
                  </td>
                  <td className="py-3">
                    <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200 font-bold text-[11px]">
                      {plot.healthScore}/100
                    </span>
                  </td>
                  <td className="py-3 font-bold text-emerald-700">
                    {plot.areaHa >= 1.2 ? '21.0 t/ha' : plot.areaHa >= 1.0 ? '19.5 t/ha' : '17.8 t/ha'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visual Chart Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">
              Yield Comparison by Season (t/ha)
            </h3>
            <span className="text-xs text-slate-400">Past 4 cycles</span>
          </div>

          <div className="space-y-3 pt-2">
            {[
              { season: '2024 Dry Season 1', yieldTons: 17.5, max: 25, isCurrent: false },
              { season: '2024 Monsoon Batch', yieldTons: 15.8, max: 25, isCurrent: false },
              { season: '2024 Dry Season 2', yieldTons: 19.2, max: 25, isCurrent: false },
              { season: '2025 Current Cycle (Est.)', yieldTons: 20.8, max: 25, isCurrent: true },
            ].map((item, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className={item.isCurrent ? 'text-emerald-800 font-bold' : 'text-slate-700'}>
                    {item.season}
                  </span>
                  <span className="font-mono text-slate-800 font-bold">{item.yieldTons} t/ha</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      item.isCurrent ? 'bg-[#164e22]' : 'bg-emerald-400'
                    }`}
                    style={{ width: `${(item.yieldTons / item.max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">
              Sugar Content (Brix) Distribution
            </h3>
            <span className="text-xs text-amber-600 font-semibold">Target: 14.5°+</span>
          </div>

          <div className="space-y-3 pt-2">
            {[
              { label: 'Grade S (Exquisite >= 16.0° Bx)', percent: 32, color: 'bg-amber-500' },
              { label: 'Grade A (Supermarket 14.5° - 15.9°)', percent: 48, color: 'bg-emerald-500' },
              { label: 'Grade B (Local Market 13.0° - 14.4°)', percent: 16, color: 'bg-sky-500' },
              { label: 'Grade C (Under 13.0° Bx)', percent: 4, color: 'bg-slate-400' },
            ].map((b, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700">{b.label}</span>
                  <span className="font-mono font-bold text-slate-800">{b.percent}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${b.color}`}
                    style={{ width: `${b.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
