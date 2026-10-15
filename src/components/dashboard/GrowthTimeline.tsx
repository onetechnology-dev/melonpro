import React, { useState, useMemo } from 'react';
import { useI18n } from '../../locales/i18nContext';
import { useFarm } from '../../context/FarmContext';
import { 
  SeedlingIllustration, 
  TransplantingIllustration, 
  VineGrowthIllustration, 
  FloweringIllustration, 
  PollinationIllustration, 
  FruitDevelopmentIllustration,
  FertilizingIllustration, 
  PestCheckIllustration, 
  HarvestIllustration 
} from '../common/MelonIllustrations';
import { CheckCircle2, Sparkles, Layers, Sprout } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getStageColorTheme } from '../../data/customStagePresets';

const formatDateRange = (start?: string, end?: string, days?: number) => {
  if (start && end) {
    const sDate = new Date(start);
    const eDate = new Date(end);
    if (!isNaN(sDate.getTime()) && !isNaN(eDate.getTime())) {
      const sMonth = sDate.toLocaleString('en-US', { month: 'short' });
      const eMonth = eDate.toLocaleString('en-US', { month: 'short' });
      const sDay = sDate.getDate();
      const eDay = eDate.getDate();
      if (sMonth === eMonth) {
        return `${sMonth} ${sDay}–${eDay}`;
      }
      return `${sMonth} ${sDay}–${eMonth} ${eDay}`;
    }
  }
  return days ? `${days}d` : '';
};

const getIllustrationForStage = (key: string, isCustom?: boolean) => {
  const k = key.toLowerCase();
  if (k.includes('seedling') || k.includes('germinat')) return SeedlingIllustration;
  if (k.includes('transplant') || k.includes('rooting')) return TransplantingIllustration;
  if (k.includes('vine') || k.includes('vegetative') || k.includes('growth')) return VineGrowthIllustration;
  if (k.includes('flower') || k.includes('bloom') || k.includes('budding') || k.includes('thinning')) return FloweringIllustration;
  if (k.includes('pollin') || k.includes('bee')) return PollinationIllustration;
  if (k.includes('fruit') || k.includes('expansion') || k.includes('netting')) return FruitDevelopmentIllustration;
  if (k.includes('fertiliz') || k.includes('brix') || k.includes('sweet') || k.includes('boost')) return FertilizingIllustration;
  if (k.includes('pest') || k.includes('flush') || k.includes('cleanse')) return PestCheckIllustration;
  if (k.includes('harvest') || k.includes('ripen')) return HarvestIllustration;
  if (isCustom) return FruitDevelopmentIllustration;
  return VineGrowthIllustration;
};

interface TimelineStageItem {
  key: string;
  nameEn: string;
  nameKm: string;
  dateRange: string;
  isCompleted: boolean;
  isCurrent: boolean;
  illustration: React.FC<{ className?: string }>;
  nodeType: string;
  detailEn: string;
  detailKm: string;
  isCustom?: boolean;
  color?: string;
  ecTarget?: string;
  phTarget?: string;
}

export const GrowthTimeline: React.FC<{ showHeader?: boolean }> = ({ showHeader = true }) => {
  const { language } = useI18n();
  const { currentPlot, cropCycles, selectedCycleId, selectedPlotId } = useFarm();
  const [selectedStageKey, setSelectedStageKey] = useState<string | null>(null);

  const isAllPlots = selectedPlotId === 'all';
  const relevantCycles = useMemo(() => {
    if (isAllPlots) return cropCycles;
    if (!currentPlot) return [];
    return cropCycles.filter((c) => c.plotId === currentPlot.id);
  }, [isAllPlots, cropCycles, currentPlot]);

  const activeCycles = useMemo(() => relevantCycles.filter((c) => c.status === 'active'), [relevantCycles]);
  const completedCycles = useMemo(() => relevantCycles.filter((c) => c.status === 'completed'), [relevantCycles]);
  const hasActiveCrop = activeCycles.length > 0;
  const isCropCompleted = !hasActiveCrop && relevantCycles.length > 0 && relevantCycles.every((c) => c.status === 'completed');
  const isCropEmpty = relevantCycles.length === 0;

  const currentCycle = useMemo(() => {
    if (activeCycles.length > 0) return activeCycles[0];
    if (isCropCompleted && completedCycles.length > 0) return completedCycles[0];
    return null;
  }, [activeCycles, isCropCompleted, completedCycles]);

  // Dynamic Botanical Standard stages derived from active planted crop
  const stages: TimelineStageItem[] = useMemo(() => {
    // If no active or completed cycle exists, return empty stages
    if (!currentCycle) {
      return [];
    }

    // 1. If cycle has stages, use them (filtering for Botanical Standard stages)
    if (currentCycle.stages && currentCycle.stages.length > 0) {
      const botanicalOnly = currentCycle.stages.filter((s) => !s.isCustom || s.category === 'botanical');
      const stagesList = botanicalOnly.length >= 7 ? botanicalOnly : currentCycle.stages;

      return stagesList.map((stg, idx, arr) => {
        const isCurrent = !isCropCompleted && (stg.status === 'current' || stg.key === currentCycle.currentStageKey || stg.key === currentPlot?.currentStage);
        const isCompleted = isCropCompleted || stg.status === 'completed';
        
        let nodeType: string = 'hollow_green';
        if (isCompleted) {
          nodeType = 'solid_green';
        } else if (isCurrent) {
          nodeType = 'solid_yellow';
        } else if (idx === 0) {
          nodeType = 'hollow_green';
        } else if (idx === arr.length - 1) {
          nodeType = 'hollow_darkgreen';
        } else if (idx < arr.length / 2) {
          nodeType = 'hollow_yellow';
        } else {
          nodeType = 'hollow_orange';
        }

        return {
          key: stg.key,
          nameEn: stg.nameEn,
          nameKm: stg.nameKm,
          dateRange: formatDateRange(stg.startDate, stg.endDate, stg.targetDays),
          isCompleted,
          isCurrent,
          illustration: getIllustrationForStage(stg.key, stg.isCustom),
          nodeType,
          detailEn: stg.notesEn || stg.irrigationGuidelineEn || 'Active botanical development window.',
          detailKm: stg.notesKm || stg.irrigationGuidelineKm || 'ដំណាក់កាលលូតលាស់នៃដំណាំត្រសក់ផ្អែម។',
          isCustom: !!stg.isCustom,
          color: stg.color,
          ecTarget: stg.ecTarget,
          phTarget: stg.phTarget,
        };
      });
    }

    return [];
  }, [currentCycle, isCropCompleted, currentPlot]);

  const activeDetailStage = stages.find(s => s.key === selectedStageKey);

  return (
    <div className="w-full mb-6">
      {/* Top Header Matching Screenshot */}
      {showHeader ? (
        <div className="mb-3">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Dashboard / <span className="font-khmer text-emerald-800">ផ្ទាំងគ្រប់គ្រង</span>
          </h1>
          <h2 className="text-base sm:text-lg font-bold text-slate-800 mt-0.5">
            Melon Crop Calendar / <span className="font-khmer text-slate-600">ប្រតិទិនដាំត្រសក់ផ្អែម</span>
            {currentPlot && (() => {
              if (isCropCompleted) {
                return (
                  <span className="text-xs sm:text-sm font-bold text-slate-500 ml-2 font-khmer">
                    · {currentPlot.name} ({language === 'km' ? 'ប្រមូលផលរួចរាល់' : 'Harvest Completed'})
                  </span>
                );
              }
              if (!hasActiveCrop) {
                return (
                  <span className="text-xs sm:text-sm font-bold text-slate-400 ml-2 font-khmer">
                    · {currentPlot.name} ({language === 'km' ? 'ទំនេរ' : 'Empty'})
                  </span>
                );
              }
              const rawVariety = language === 'km' ? currentPlot.melonVarietyKm : currentPlot.melonVarietyEn;
              const cleanVariety = rawVariety
                ? Array.from(new Set(rawVariety.split(',').map((s) => s.trim()).filter(Boolean))).join(', ')
                : '';
              return cleanVariety ? (
                <span className="text-xs sm:text-sm font-normal text-slate-500 ml-2">
                  · {currentPlot.name} ({cleanVariety})
                </span>
              ) : null;
            })()}
          </h2>
        </div>
      ) : (
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
            <span>Melon Crop Calendar</span>
            <span className="text-slate-300">/</span>
            <span className="font-khmer text-slate-600 font-semibold text-xs sm:text-sm">ប្រតិទិនដំណាក់កាលលូតលាស់</span>
          </h2>
          {currentPlot && (() => {
            if (isCropCompleted) {
              return (
                <span className="text-xs text-slate-500 font-khmer">
                  {currentPlot.name} ({language === 'km' ? 'ប្រមូលផលរួចរាល់' : 'Harvest Completed'})
                </span>
              );
            }
            if (!hasActiveCrop) {
              return (
                <span className="text-xs text-slate-400 font-khmer">
                  {currentPlot.name} ({language === 'km' ? 'ទំនេរ' : 'Empty'})
                </span>
              );
            }
            const rawVariety = language === 'km' ? currentPlot.melonVarietyKm : currentPlot.melonVarietyEn;
            const cleanVariety = rawVariety
              ? Array.from(new Set(rawVariety.split(',').map((s) => s.trim()).filter(Boolean))).join(', ')
              : '';
            return cleanVariety ? (
              <span className="text-xs text-slate-500">
                {currentPlot.name} ({cleanVariety})
              </span>
            ) : null;
          })()}
        </div>
      )}

      {/* Main Melon Crop Calendar Bar Card or Empty State */}
      {stages.length === 0 ? (
        <div className="w-full bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center shadow-2xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-2.5">
            <Sprout className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-700 font-khmer">
            {isCropCompleted
              ? (language === 'km' ? 'វដ្តដំណាំក្នុងរងនេះបានប្រមូលផលរួចរាល់' : 'Crop harvest completed for this plot')
              : (language === 'km' ? 'គ្មានដំណាំដាំដុះក្នុងរងនេះទេ' : 'No crop planted in this plot')}
          </h3>
          <p className="text-xs text-slate-400 font-khmer mt-1">
            {isCropCompleted
              ? (language === 'km' ? 'រងនេះទំនេរសម្រាប់ការចាប់ផ្តើមដាំដំណាំថ្មី' : 'This plot is available for a new crop planting batch.')
              : (language === 'km' ? 'ទិន្នន័យកាលវិភាគលូតលាស់នឹងបង្ហាញនៅពេលដំណាំត្រូវបានដាំ' : 'Growth timeline and stage monitoring will appear once a crop batch is planted.')}
          </p>
        </div>
      ) : (
        <div className="w-full bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Scrollable Container for smaller screens, full-width responsive on desktop */}
          <div className="w-full overflow-x-auto scrollbar-none">
            <div className="min-w-[920px] w-full relative">
              
              {/* 1. Continuous Pipeline Gradient Bar running across all columns */}
              <div 
                className="absolute top-[72px] h-2 rounded-full -translate-y-1/2 z-0 overflow-hidden shadow-2xs pointer-events-none"
                style={{
                  left: `${100 / (stages.length * 2)}%`,
                  right: `${100 / (stages.length * 2)}%`,
                }}
              >
                <div 
                  className="w-full h-full"
                  style={{
                    background: 'linear-gradient(to right, #A7F3D0 0%, #34D399 20%, #4ADE80 34%, #FBBF24 45%, #F59E0B 58%, #FB923C 68%, #EF4444 82%, #15803D 92%, #14532D 100%)'
                  }}
                />
              </div>

            {/* Intermediate small milestone dots along the pipeline between columns */}
            <div className="absolute top-[72px] left-0 right-0 h-0 -translate-y-1/2 z-10 pointer-events-none">
              {stages.slice(0, -1).map((_, idx) => {
                const posPercent = ((idx + 1) / stages.length) * 100;
                return (
                  <span
                    key={idx}
                    style={{ left: `${posPercent}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white border-2 border-emerald-500 shadow-2xs"
                  />
                );
              })}
            </div>

            {/* 2. Grid of Dynamic Columns with Vertical Hairline Dividers */}
            <div 
              className="grid divide-x divide-slate-100"
              style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))` }}
            >
              {stages.map((stage) => {
                const Illustration = stage.illustration;
                const isSelected = selectedStageKey === stage.key;

                return (
                  <div
                    key={stage.key}
                    onClick={() => setSelectedStageKey(isSelected ? null : stage.key)}
                    className={`
                      relative py-4 px-2 flex flex-col items-center justify-between cursor-pointer group transition-all
                      ${stage.isCurrent ? 'bg-amber-50/20' : 'hover:bg-slate-50/50'}
                    `}
                  >
                    {/* Top Illustration Slot directly sitting above the bar with physics hover animation */}
                    <motion.div 
                      className="h-16 flex items-end justify-center mb-1 cursor-pointer select-none"
                      whileHover={{ scale: 1.25, y: -6 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                    >
                      <Illustration className="w-14 h-14 object-contain drop-shadow-sm select-none" />
                    </motion.div>

                    {/* Central Milestone Node on the pipeline */}
                    <div className="relative z-20 my-1">
                      {stage.nodeType === 'hollow_green' && (
                        <div className="w-4.5 h-4.5 rounded-full bg-white border-2.5 border-emerald-500 ring-2 ring-emerald-100 shadow-xs" />
                      )}
                      {stage.nodeType === 'solid_green' && (
                        <div className="w-4.5 h-4.5 rounded-full bg-emerald-600 border-2 border-white ring-2 ring-emerald-500 shadow-xs" />
                      )}
                      {stage.nodeType === 'hollow_yellow' && (
                        <div className="w-4.5 h-4.5 rounded-full bg-white border-2.5 border-amber-400 ring-2 ring-amber-100 shadow-xs" />
                      )}
                      {stage.nodeType === 'solid_yellow' && (
                        <motion.div 
                          animate={{ scale: [1, 1.25, 1] }}
                          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                          className="w-4.5 h-4.5 rounded-full bg-amber-500 border-2 border-white ring-4 ring-amber-400/40 shadow-xs" 
                        />
                      )}
                      {stage.nodeType === 'hollow_orange' && (
                        <div className="w-4.5 h-4.5 rounded-full bg-white border-2.5 border-orange-400 ring-2 ring-orange-100 shadow-xs" />
                      )}
                      {stage.nodeType === 'hollow_red' && (
                        <div className="w-4.5 h-4.5 rounded-full bg-white border-2.5 border-red-500 ring-2 ring-red-100 shadow-xs" />
                      )}
                      {stage.nodeType === 'hollow_darkgreen' && (
                        <div className="w-4.5 h-4.5 rounded-full bg-white border-2.5 border-emerald-800 ring-2 ring-emerald-200 shadow-xs" />
                      )}
                    </div>

                    {/* Bottom Stage Titles and Date Range with larger typography */}
                    <div className="mt-2 text-center w-full px-0.5">
                      <div className="flex items-center justify-center gap-1">
                        <p className={`text-sm font-extrabold truncate leading-tight ${
                          stage.isCurrent ? 'text-amber-900' : 'text-slate-800'
                        }`}>
                          {stage.nameEn}
                        </p>
                        {stage.isCustom && (
                          <span 
                            className="w-2 h-2 rounded-full shrink-0 shadow-2xs" 
                            style={{ backgroundColor: getStageColorTheme(stage.color).hex }} 
                            title="Custom Growth Stage" 
                          />
                        )}
                      </div>
                      <p className="text-xs sm:text-[13px] text-slate-500 font-semibold truncate font-khmer mt-0.5 leading-tight">
                        {stage.nameKm}
                      </p>
                      <p className="text-xs font-mono font-medium text-slate-400 mt-1.5 leading-none">
                        {stage.dateRange}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    )}

      {/* Selected Stage Detail Drawer if clicked */}
      {activeDetailStage && (
        <div className="mt-3 p-4 bg-white border border-slate-200 rounded-2xl shadow-xs flex items-start justify-between gap-4 animate-in fade-in-50">
          <div className="flex items-start gap-3.5">
            <div className="p-2 bg-gradient-to-br from-emerald-50/50 to-amber-50/50 rounded-xl border border-slate-200/80 shadow-2xs shrink-0 flex items-center justify-center">
              <activeDetailStage.illustration className="w-11 h-11 object-contain drop-shadow-sm" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-slate-900">
                  {language === 'km' ? activeDetailStage.nameKm : activeDetailStage.nameEn}
                </span>
                <span className="text-xs text-slate-500 font-khmer">
                  ({language === 'km' ? activeDetailStage.nameEn : activeDetailStage.nameKm})
                </span>
                <span className="text-xs font-mono font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                  {activeDetailStage.dateRange}
                </span>
                {activeDetailStage.isCustom && (
                  <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full font-khmer">
                    {language === 'km' ? 'ដំណាក់កាលផ្ទាល់ខ្លួន' : 'Custom Stage'}
                  </span>
                )}
                {activeDetailStage.ecTarget && (
                  <span className="bg-slate-100 text-slate-700 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md">
                    EC: {activeDetailStage.ecTarget}
                  </span>
                )}
                {activeDetailStage.phTarget && (
                  <span className="bg-slate-100 text-slate-700 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md">
                    pH: {activeDetailStage.phTarget}
                  </span>
                )}
                {activeDetailStage.isCurrent && (
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {language === 'km' ? 'ដំណាក់កាលបច្ចុប្បន្ន' : 'Current Active Stage'}
                  </span>
                )}
                {activeDetailStage.isCompleted && (
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {language === 'km' ? 'បានបញ្ចប់' : 'Completed'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                {language === 'km' ? activeDetailStage.detailKm : activeDetailStage.detailEn}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedStageKey(null)}
            className="text-xs text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
