import React, { useState } from 'react';
import { 
  Scale, 
  Plus, 
  CheckCircle2, 
  TrendingUp, 
  Award, 
  CheckSquare, 
  Square,
  Sparkles,
  BarChart3
} from 'lucide-react';
import { useI18n } from '../../locales/i18nContext';
import { useFarm } from '../../context/FarmContext';
import { YieldMelonGraphic } from '../common/MelonIllustrations';

export const HarvestYieldView: React.FC = () => {
  const { t, language } = useI18n();
  const { plots, harvestRecords, addHarvestRecord } = useFarm();

  const [showLogHarvestModal, setShowLogHarvestModal] = useState(false);

  // Harvest checklist state
  const [checklist, setChecklist] = useState([
    { id: 1, textEn: 'Fine corky netting fully developed across entire fruit rind', textKm: 'ក្រឡាសំណាញ់ឡើងពេញស្មើលើសំបកផ្លែ', checked: true },
    { id: 2, textEn: 'Subtle sweet aroma detectable at blossom end', textKm: 'ក្លិនក្រអូបផ្អែមស្រាលភាយចេញពីគូទផ្លែ', checked: true },
    { id: 3, textEn: 'Micro-hair loss on peduncle & hairline slip crack around stem', textKm: 'រោមលើទងជ្រុះអស់ និងមានស្នាមប្រេះរាងកងជុំវិញទង', checked: true },
    { id: 4, textEn: 'Digital refractometer reading >= 14.5° Brix in test sample', textKm: 'កម្រិតជាតិស្ករវាស់ជាក់ស្តែង >= ១៤.៥° Brix', checked: false },
    { id: 5, textEn: 'Irrigation cut back by 40% 4 days prior to harvest to concentrate sugar', textKm: 'បន្ថយការស្រោចទឹក ៤០% រយៈពេល ៤ ថ្ងៃមុនប្រមូលផល', checked: true },
  ]);

  const toggleChecklist = (id: number) => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  // Form states
  const [plotId, setPlotId] = useState(plots[0]?.id || 'plot-a');
  const [harvestDate, setHarvestDate] = useState('2025-05-25');
  const [totalWeightKg, setTotalWeightKg] = useState(25000);
  const [fruitCount, setFruitCount] = useState(16500);
  const [brix, setBrix] = useState(15.4);
  const [gradeA, setGradeA] = useState(80);
  const [gradeB, setGradeB] = useState(16);
  const [gradeC, setGradeC] = useState(4);
  const [actualYield, setActualYield] = useState(20.8);
  const [notes, setNotes] = useState('');

  const handleSaveHarvest = (e: React.FormEvent) => {
    e.preventDefault();
    addHarvestRecord({
      plotId,
      batchId: 'BATCH-2025-M2',
      harvestDate,
      totalWeightKg: Number(totalWeightKg),
      fruitCount: Number(fruitCount),
      averageWeightKg: Number((totalWeightKg / fruitCount).toFixed(2)),
      brixSugarDegree: Number(brix),
      gradeA_Percent: Number(gradeA),
      gradeB_Percent: Number(gradeB),
      gradeC_Percent: Number(gradeC),
      actualYieldTonsPerHa: Number(actualYield),
      targetYieldTonsPerHa: 20.0,
      recordedBy: 'Sokha Farmer',
      notes,
    });
    setShowLogHarvestModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-slate-900">
            Harvest & Yield Performance / <span className="font-khmer text-emerald-700">ប្រមូលផល & ទិន្នផល</span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {language === 'km' 
              ? 'កត់ត្រាទម្ងន់ប្រមូលផល កម្រិតជាតិស្ករ Brix ចំណាត់ថ្នាក់ផ្លែ និងការវាយតម្លៃគុណភាព' 
              : 'Log harvested weights, fruit counts, Brix sugar grades, and yield benchmarks'}
          </p>
        </div>

        <button
          onClick={() => setShowLogHarvestModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#164e22] hover:bg-[#123e1b] text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Record New Harvest</span>
        </button>
      </div>

      {/* Top Benchmark Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block uppercase tracking-wider">
              {t('yieldForecast')}
            </span>
            <span className="text-2xl font-extrabold text-slate-900 font-mono mt-1 block">
              18–22 <span className="text-sm font-semibold text-slate-600">t/ha</span>
            </span>
            <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1 mt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              +12% vs prior dry season
            </span>
          </div>
          <YieldMelonGraphic className="w-16 h-16 shrink-0" />
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block uppercase tracking-wider">
              Target Sugar Sweetness
            </span>
            <span className="text-2xl font-extrabold text-amber-600 font-mono mt-1 block">
              14.5 – 16.0 <span className="text-sm font-semibold text-slate-600">°Bx</span>
            </span>
            <span className="text-xs text-slate-500 mt-1 block">
              Premium grade benchmark for supermarket export
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block uppercase tracking-wider">
              Average Fruit Sizing
            </span>
            <span className="text-2xl font-extrabold text-emerald-700 font-mono mt-1 block">
              1.5 – 1.8 <span className="text-sm font-semibold text-slate-600">kg/fruit</span>
            </span>
            <span className="text-xs text-slate-500 mt-1 block">
              Ideal 1 prime fruit per vine canopy model
            </span>
          </div>
        </div>
      </div>

      {/* Harvest Readiness Checklist */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Harvest Readiness Checklist / <span className="font-khmer text-slate-500">តារាងត្រួតពិនិត្យភាពរួចរាល់ប្រមូលផល</span>
            </h3>
          </div>
          <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            {checklist.filter(c => c.checked).length} / {checklist.length} verified
          </span>
        </div>

        <p className="text-xs text-slate-500 mb-4">
          Melons do not continue to build sweetness after being cut from the vine. Ensure all maturity indicators are satisfied.
        </p>

        <div className="space-y-2.5">
          {checklist.map((item) => (
            <div
              key={item.id}
              onClick={() => toggleChecklist(item.id)}
              className="p-3 rounded-xl border border-slate-200 hover:border-emerald-300 transition-all cursor-pointer flex items-center justify-between bg-slate-50/50"
            >
              <div className="flex items-center gap-3">
                {item.checked ? (
                  <CheckSquare className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <Square className="w-5 h-5 text-slate-400 shrink-0" />
                )}
                <div>
                  <p className={`text-xs font-bold ${item.checked ? 'text-slate-900' : 'text-slate-600'}`}>
                    {language === 'km' ? item.textKm : item.textEn}
                  </p>
                  <p className="text-[11px] text-slate-400 font-khmer">
                    {language === 'km' ? item.textEn : item.textKm}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Historical Harvest Log Table */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80">
        <h3 className="text-sm font-bold text-slate-800 mb-4">
          Harvest Records History / <span className="font-khmer text-slate-500">ប្រវត្តិទិន្នផលប្រមូលបាន</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="pb-2.5 font-bold">Date & Batch</th>
                <th className="pb-2.5 font-bold">Plot</th>
                <th className="pb-2.5 font-bold">Total Weight</th>
                <th className="pb-2.5 font-bold">Fruit Count</th>
                <th className="pb-2.5 font-bold">Avg Weight</th>
                <th className="pb-2.5 font-bold">Brix (°Bx)</th>
                <th className="pb-2.5 font-bold">Actual Yield</th>
                <th className="pb-2.5 font-bold">Grade A%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {harvestRecords.map((hrv) => {
                const plot = plots.find((p) => p.id === hrv.plotId);
                return (
                  <tr key={hrv.id} className="hover:bg-slate-50/60 font-mono">
                    <td className="py-3 font-sans font-bold text-slate-800">
                      {hrv.harvestDate}
                      <span className="block text-[10px] text-slate-400 font-mono">{hrv.batchId}</span>
                    </td>
                    <td className="py-3 font-sans text-slate-700">{plot?.name}</td>
                    <td className="py-3 font-bold text-slate-900">{hrv.totalWeightKg.toLocaleString()} kg</td>
                    <td className="py-3 text-slate-700">{hrv.fruitCount.toLocaleString()}</td>
                    <td className="py-3 text-slate-700">{hrv.averageWeightKg} kg</td>
                    <td className="py-3 font-bold text-amber-600">{hrv.brixSugarDegree}° Bx</td>
                    <td className="py-3 font-bold text-emerald-700">{hrv.actualYieldTonsPerHa} t/ha</td>
                    <td className="py-3">
                      <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200 font-bold text-[11px]">
                        {hrv.gradeA_Percent}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Harvest Modal */}
      {showLogHarvestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-white rounded-2xl max-w-3xl w-full flex flex-col shadow-2xl border border-slate-200 max-h-[90vh] overflow-hidden">
            <div className="shrink-0 p-5 px-6 border-b border-slate-100 flex items-center justify-between bg-white z-10">
              <h3 className="text-base font-bold text-slate-900">Record Harvest & Quality</h3>
              <button onClick={() => setShowLogHarvestModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveHarvest} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Plot</label>
                    <select
                      value={plotId}
                      onChange={(e) => setPlotId(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-none"
                    >
                      {plots.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Harvest Date</label>
                    <input
                      type="date"
                      required
                      value={harvestDate}
                      onChange={(e) => setHarvestDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Total (kg)</label>
                    <input
                      type="number"
                      value={totalWeightKg}
                      onChange={(e) => setTotalWeightKg(parseInt(e.target.value))}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Fruit Count</label>
                    <input
                      type="number"
                      value={fruitCount}
                      onChange={(e) => setFruitCount(parseInt(e.target.value))}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Brix (°Bx)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={brix}
                      onChange={(e) => setBrix(parseFloat(e.target.value))}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Grade A (%)</label>
                    <input
                      type="number"
                      value={gradeA}
                      onChange={(e) => setGradeA(parseInt(e.target.value))}
                      className="w-full px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Grade B (%)</label>
                    <input
                      type="number"
                      value={gradeB}
                      onChange={(e) => setGradeB(parseInt(e.target.value))}
                      className="w-full px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Grade C (%)</label>
                    <input
                      type="number"
                      value={gradeC}
                      onChange={(e) => setGradeC(parseInt(e.target.value))}
                      className="w-full px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Yield (t/ha)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={actualYield}
                    onChange={(e) => setActualYield(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Notes / Market Channel</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Exported to Aeon Mall and local premium fruit distributors."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-none resize-none"
                  />
                </div>
              </div>

              <div className="shrink-0 px-6 py-4 border-t border-slate-200/80 bg-slate-50/95 backdrop-blur-xs flex items-center justify-end gap-3 z-10 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setShowLogHarvestModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#164e22] hover:bg-[#123e1b] rounded-xl shadow-xs transition-colors"
                >
                  Save Harvest
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
