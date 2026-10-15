import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  Sparkles, 
  Droplet, 
  ShieldCheck, 
  Clock, 
  ArrowUpRight,
  ExternalLink,
  Info
} from 'lucide-react';
import { useI18n } from '../../locales/i18nContext';
import { useFarm } from '../../context/FarmContext';
import { YieldMelonGraphic } from '../common/MelonIllustrations';

export const YieldAndAICards: React.FC = () => {
  const { language, t } = useI18n();
  const { recommendations, applyRecommendation, cropCycles, selectedPlotId, currentPlot } = useFarm();
  const [showAllRecommendationsModal, setShowAllRecommendationsModal] = useState(false);

  const isAllPlots = selectedPlotId === 'all';
  const relevantCycles = React.useMemo(() => {
    if (isAllPlots) return cropCycles;
    if (!currentPlot) return [];
    return cropCycles.filter((c) => c.plotId === currentPlot.id);
  }, [isAllPlots, cropCycles, currentPlot]);

  const activeCycles = React.useMemo(() => relevantCycles.filter((c) => c.status === 'active'), [relevantCycles]);
  const hasActiveCrop = activeCycles.length > 0;
  const isCropCompleted = !hasActiveCrop && relevantCycles.length > 0 && relevantCycles.every((c) => c.status === 'completed');

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">
        {/* Yield Forecast Card (approx 35% on large screens) */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-base font-extrabold text-slate-900">
              Yield Forecast / <span className="font-khmer text-slate-600 font-bold">ការព្យាករណ៍ទិន្នផល</span>
            </h3>
          </div>

          <div className="flex items-center justify-between gap-4 py-2">
            <motion.div 
              whileHover={{ scale: 1.1, rotate: [0, -3, 3, 0] }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              className="cursor-pointer"
            >
              <YieldMelonGraphic className="w-20 h-20 shrink-0" />
            </motion.div>
            <div>
              {hasActiveCrop ? (
                <>
                  <div className="text-2xl lg:text-3xl font-black text-slate-900 font-mono tracking-tight">
                    18–22 <span className="text-base font-bold text-slate-600">t/ha</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 font-khmer font-semibold mt-0.5">
                    តោន/ហិកតា (ប្រមូលផលប៉ាន់ស្មាន)
                  </p>
                  
                  <div className="mt-2 inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60 shadow-2xs">
                    <TrendingUp className="w-4 h-4" />
                    <span>+12% vs. last season</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-2xl lg:text-3xl font-black text-slate-300 font-mono tracking-tight">
                    —
                  </div>
                  <p className="text-xs sm:text-sm text-slate-400 font-khmer font-semibold mt-0.5">
                    {isCropCompleted 
                      ? (language === 'km' ? 'ប្រមូលផលរួចរាល់' : 'Harvest completed')
                      : (language === 'km' ? 'គ្មានដំណាំដាំដុះ' : 'No active crop')}
                  </p>
                </>
              )}
            </div>
          </div>

          <p className="text-xs text-slate-500 font-khmer font-medium pt-2.5 border-t border-slate-100">
            {language === 'km' 
              ? 'ផ្អែកលើការកត់ត្រាដើមដុះ ផ្កាកកើត និងកម្រិតជីរៀងរាល់វដ្ត' 
              : 'Grounded in plant density, fruit set counts, and fertigation history'}
          </p>
        </div>

        {/* AI Recommendations Card (approx 65% on large screens) */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <motion.div
                whileHover={{ scale: 1.25, rotate: 15 }}
                className="cursor-pointer"
              >
                <Sparkles className="w-5 h-5 text-emerald-600" />
              </motion.div>
              <h3 className="text-base font-extrabold text-slate-900">
                AI Recommendation / <span className="font-khmer text-slate-600 font-bold">ការណែនាំ AI</span>
              </h3>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAllRecommendationsModal(true)}
              className="text-xs sm:text-sm font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All / <span className="font-khmer">មើលទាំងអស់</span></span>
              <ArrowUpRight className="w-4 h-4" />
            </motion.button>
          </div>

          {/* 3 Metric Columns matching reference */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
            {/* 1. Best Watering Time */}
            <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 flex flex-col justify-between hover:bg-slate-50 transition-colors">
              <div>
                <div className="flex items-center gap-1.5 text-sky-700 mb-1">
                  <motion.div whileHover={{ scale: 1.2 }}>
                    <Droplet className="w-4 h-4 fill-sky-500" />
                  </motion.div>
                  <span className="text-xs font-bold">Best Watering Time</span>
                </div>
                <div className="text-base sm:text-lg font-black text-slate-900 font-mono">
                  {hasActiveCrop ? '5:00 – 7:00 AM' : '—'}
                </div>
              </div>
              <p className="text-xs text-slate-500 font-khmer font-medium mt-2 leading-snug">
                {hasActiveCrop 
                  ? (language === 'km' ? 'ស្រោចពេលព្រលឹមជួយការពារផ្សិត' : 'Early morning minimizes mildew')
                  : (language === 'km' ? 'គ្មានកាលវិភាគស្រោចទឹក' : 'No irrigation schedule')}
              </p>
            </div>

            {/* 2. Disease Risk */}
            <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 flex flex-col justify-between hover:bg-slate-50 transition-colors">
              <div>
                <div className="flex items-center gap-1.5 text-emerald-700 mb-1">
                  <motion.div whileHover={{ scale: 1.2 }}>
                    <ShieldCheck className="w-4 h-4" />
                  </motion.div>
                  <span className="text-xs font-bold">Disease Risk</span>
                </div>
                <div className="text-base sm:text-lg font-black text-emerald-700 flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${hasActiveCrop ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  {hasActiveCrop ? `Low / ${language === 'km' ? 'ទាប' : 'Low'}` : '—'}
                </div>
              </div>
              <p className="text-xs text-slate-500 font-khmer font-medium mt-2 leading-snug">
                {hasActiveCrop 
                  ? (language === 'km' ? 'លក្ខខណ្ឌអំណោយផលល្អ' : 'Conditions are favorable')
                  : (language === 'km' ? 'គ្មានហានិភ័យសកម្ម' : 'No active crop risks')}
              </p>
            </div>

            {/* 3. Harvest Readiness */}
            <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 flex flex-col justify-between hover:bg-slate-50 transition-colors">
              <div>
                <div className="flex items-center gap-1.5 text-amber-700 mb-1">
                  <motion.div whileHover={{ scale: 1.2 }}>
                    <Clock className="w-4 h-4" />
                  </motion.div>
                  <span className="text-xs font-bold">Harvest Readiness</span>
                </div>
                <div className="text-base sm:text-lg font-black text-amber-700">
                  {hasActiveCrop ? 'In 18 days' : '—'}
                </div>
              </div>
              <p className="text-xs text-slate-500 font-khmer font-medium mt-2 leading-snug">
                {hasActiveCrop 
                  ? (language === 'km' ? 'ទិន្នផលប៉ាន់ស្មាន: ២០ តោន/ហិកតា' : 'Estimated yield: 20 t/ha')
                  : (isCropCompleted 
                      ? (language === 'km' ? 'ប្រមូលផលរួចរាល់' : 'Harvest completed') 
                      : (language === 'km' ? 'គ្មានទិន្នន័យ' : 'No data'))}
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Info className="w-4 h-4 shrink-0 text-slate-400" />
            <span>
              {language === 'km'
                ? 'អនុសាសន៍ទាំងអស់ផ្អែកលើទិន្នន័យឧបករណ៍ចាប់សញ្ញា និងអាកាសធាតុជាក់ស្តែង។'
                : 'Recommendations ground to live sensor telemetry, GDD models, and local forecast.'}
            </span>
          </div>
        </div>
      </div>

      {/* View All Recommendations Modal */}
      {showAllRecommendationsModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Smart Agronomy Recommendations / <span className="font-khmer text-emerald-700">ការណែនាំឆ្លាតវៃ</span>
                </h3>
              </div>
              <button
                onClick={() => setShowAllRecommendationsModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3 max-h-[60vh] overflow-y-auto">
              {recommendations.map((rec) => (
                <div key={rec.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      {language === 'km' ? rec.titleKm : rec.titleEn}
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      {language === 'km' ? rec.valueKm : rec.valueEn}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    {language === 'km' ? rec.detailKm : rec.detailEn}
                  </p>
                  <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      Supporting evidence: {rec.supportedByRecords.join(' · ')}
                    </span>
                    {rec.suggestedAction && (
                      <button
                        onClick={() => {
                          applyRecommendation(rec.id);
                          setShowAllRecommendationsModal(false);
                        }}
                        className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors"
                      >
                        {t('applyScheduleChange')}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowAllRecommendationsModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
