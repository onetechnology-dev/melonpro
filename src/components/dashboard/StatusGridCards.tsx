import React from 'react';
import { motion } from 'motion/react';
import { 
  Sprout, 
  Warehouse,
  Flower2, 
  CalendarClock, 
  Scale, 
  ChevronDown 
} from 'lucide-react';
import { useI18n } from '../../locales/i18nContext';
import { useFarm } from '../../context/FarmContext';
import { GreenhouseModeCard } from './GreenhouseModeCard';

export const StatusGridCards: React.FC = () => {
  const { language } = useI18n();
  const { plots, selectedPlotId, setSelectedPlotId, currentPlot, cropCycles, customStages } = useFarm();

  const { netHousePlots, openFieldPlots, otherPlots } = React.useMemo(() => {
    const netHouses: typeof plots = [];
    const openFields: typeof plots = [];
    const others: typeof plots = [];

    plots.forEach((p) => {
      const shapes = p.shapes || [];
      const types = shapes.length > 0
        ? shapes.map((s) => s.facilityType)
        : (p.facilityTypes || [p.facilityType]);

      const isNet = types.includes('net_house') || p.facilityType === 'net_house';
      const isOpen = types.includes('open_field') || p.facilityType === 'open_field';

      if (isNet) {
        netHouses.push(p);
      } else if (isOpen) {
        openFields.push(p);
      } else {
        others.push(p);
      }
    });

    return { netHousePlots: netHouses, openFieldPlots: openFields, otherPlots: others };
  }, [plots]);

  const isAllPlots = selectedPlotId === 'all';
  const relevantCycles = React.useMemo(() => {
    if (isAllPlots) return cropCycles;
    if (!currentPlot) return [];
    return cropCycles.filter((c) => c.plotId === currentPlot.id);
  }, [isAllPlots, cropCycles, currentPlot]);

  const activeCycles = React.useMemo(() => relevantCycles.filter((c) => c.status === 'active'), [relevantCycles]);
  const completedCycles = React.useMemo(() => relevantCycles.filter((c) => c.status === 'completed'), [relevantCycles]);
  const hasActiveCrop = activeCycles.length > 0;
  const isCropCompleted = !hasActiveCrop && relevantCycles.length > 0 && relevantCycles.every((c) => c.status === 'completed');
  const isCropEmpty = relevantCycles.length === 0;

  const currentCycle = activeCycles[0] || (isCropCompleted ? completedCycles[0] : null);

  const currentStageName = React.useMemo(() => {
    if (!hasActiveCrop || !currentCycle) return null;

    // 1. Try finding in currentCycle.stages
    if (currentCycle?.stages && currentCycle.stages.length > 0) {
      const activeStage = currentCycle.stages.find(
        (s) => s.key === currentCycle.currentStageKey || s.key === currentPlot?.currentStage || s.status === 'current'
      );
      if (activeStage) {
        return language === 'km' ? activeStage.nameKm : activeStage.nameEn;
      }
    }

    // 2. Try custom stage presets
    const customMatch = customStages.find((cs) => cs.key === currentPlot?.currentStage);
    if (customMatch) {
      return language === 'km' ? customMatch.nameKm : customMatch.nameEn;
    }

    // 3. Botanical Standard stage dictionary
    const STANDARD_STAGE_NAMES: Record<string, { en: string; km: string }> = {
      seedling: { en: 'Seedling & Germination', km: 'កូនដុះពន្លក & សាបកូន' },
      transplanting: { en: 'Transplanting & Rooting', km: 'ស្ទូងកូនដំណាំ & ចាក់ឫស' },
      vine_growth: { en: 'Vine & Foliage Growth', km: 'ការលូតលាស់ដើម & ស្លឹក' },
      flowering: { en: 'Flowering & Budding', km: 'ចេញផ្កា & ក្តិប' },
      pollination: { en: 'Artificial Pollination', km: 'ការបង្កាត់លម្អងផ្កា' },
      fruit_development: { en: 'Fruit Expansion & Netting', km: 'ពង្រីកផ្លែ & បង្កើតក្រឡា' },
      harvest: { en: 'Ripening & Harvesting', km: 'ទុំ & ប្រមូលផល' },
    };

    const key = currentCycle?.currentStageKey || currentPlot?.currentStage;
    if (key && STANDARD_STAGE_NAMES[key]) {
      const standard = STANDARD_STAGE_NAMES[key];
      return language === 'km' ? standard.km : standard.en;
    }
    return language === 'km' ? 'កូនដុះពន្លក & សាបកូន' : 'Seedling & Germination';
  }, [hasActiveCrop, currentCycle, currentPlot, customStages, language]);

  const { daysToHarvest, harvestDateStr } = React.useMemo(() => {
    if (!hasActiveCrop || !currentCycle) {
      return { daysToHarvest: null, harvestDateStr: '' };
    }
    const harvestDate = currentCycle?.harvestWindowEnd || currentCycle?.harvestWindowStart;
    if (harvestDate) {
      const target = new Date(harvestDate);
      const now = new Date();
      if (!isNaN(target.getTime())) {
        const diffTime = target.getTime() - now.getTime();
        const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        return { daysToHarvest: diffDays, harvestDateStr: harvestDate };
      }
    }
    return { daysToHarvest: null, harvestDateStr: '' };
  }, [hasActiveCrop, currentCycle]);

  const { areaM2Display, areaHaDisplay } = React.useMemo(() => {
    if (isAllPlots) {
      const totalM2 = plots.reduce((sum, p) => {
        const m2 = p.areaM2 !== undefined && p.areaM2 > 0
          ? p.areaM2
          : (p.areaHa === 0.4 ? 400 : Math.round((p.areaHa || 0) * 10000));
        return sum + m2;
      }, 0);
      const totalHa = plots.reduce((sum, p) => sum + (p.areaHa || 0), 0);
      return {
        areaM2Display: totalM2 > 0 ? totalM2.toLocaleString() : '—',
        areaHaDisplay: totalHa > 0 ? String(Number(totalHa.toFixed(2))) : '—',
      };
    }
    if (!currentPlot) {
      return { areaM2Display: '—', areaHaDisplay: '—' };
    }
    const ha = currentPlot.areaHa ?? 0;
    const m2 = currentPlot.areaM2 !== undefined && currentPlot.areaM2 > 0
      ? currentPlot.areaM2
      : (ha === 0.4 ? 400 : Math.round(ha * 10000));

    return {
      areaM2Display: m2 > 0 ? m2.toLocaleString() : '—',
      areaHaDisplay: ha > 0 ? String(Number(ha.toFixed(2))) : '—',
    };
  }, [isAllPlots, plots, currentPlot]);

  const { estimatedYieldKg, estimatedYieldTons, yieldContextText } = React.useMemo(() => {
    if (!hasActiveCrop) {
      return { estimatedYieldKg: 0, estimatedYieldTons: 0, yieldContextText: '' };
    }

    let totalKg = 0;
    activeCycles.forEach((c) => {
      if (c.targetYieldKg && c.targetYieldKg > 0) {
        totalKg += c.targetYieldKg;
      } else if (c.targetYieldTons && c.targetYieldTons > 0) {
        totalKg += Math.round(c.targetYieldTons * 1000);
      } else {
        const plants = c.plantCount || 2800;
        totalKg += Math.round(plants * 1.8);
      }
    });

    const tons = Number((totalKg / 1000).toFixed(2));
    const isSinglePlot = !isAllPlots && currentPlot;

    const contextText = isSinglePlot
      ? (language === 'km'
          ? `ផ្អែកលើដំណាំដាំ ${currentPlot?.name || 'រងនេះ'} (${activeCycles.length} វដ្តសកម្ម)`
          : `Target yield for ${currentPlot?.name || 'this plot'} (${activeCycles.length} active batch)`)
      : (language === 'km'
          ? `សរុបទិន្នផលគោលដៅដំណាំដាំ (${activeCycles.length} វដ្តសកម្ម)`
          : `Total Target Yield across planted crops (${activeCycles.length} active batches)`);

    return { estimatedYieldKg: totalKg, estimatedYieldTons: tons, yieldContextText: contextText };
  }, [hasActiveCrop, activeCycles, isAllPlots, currentPlot, language]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-12 gap-3.5 items-stretch">
      {/* 1. Field Selector Card (Net House & Open Field with Select All) */}
      <div className="lg:col-span-2 bg-white rounded-2xl p-4 shadow-2xs border border-slate-200/90 flex flex-col justify-between hover:shadow-xs transition-shadow">
        <div className="flex items-center gap-2.5">
          <motion.div 
            whileHover={{ scale: 1.2, rotate: 10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 cursor-pointer shadow-2xs ${
              hasActiveCrop ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'
            }`}
          >
            <Warehouse className="w-5 h-5" />
          </motion.div>
          <div className="min-w-0 flex-1">
            <span className="text-sm font-extrabold text-slate-800 block truncate">
              Select Field
            </span>
            <span className="text-xs text-slate-400 font-khmer block truncate">
              {language === 'km' ? 'ជ្រើសរើស Field' : 'Net House & Open Field'}
            </span>
            <div className="relative mt-1">
              <select
                value={selectedPlotId}
                onChange={(e) => setSelectedPlotId(e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200/80 hover:border-slate-300 rounded-lg px-2 py-1 font-bold text-xs text-slate-900 focus:outline-none pr-6 cursor-pointer truncate transition-colors"
              >
                <option value="all">
                  {language === 'km' ? '✨ ជ្រើសរើសទាំងអស់ (Select All)' : '✨ Select All'}
                </option>
                {netHousePlots.length > 0 && (
                  <optgroup label={language === 'km' ? '🏠 ផ្ទះសំណាញ់ (Net House)' : '🏠 Net Houses'}>
                    {netHousePlots.map((p) => {
                      const pCycles = cropCycles.filter((c) => c.plotId === p.id);
                      const pActive = pCycles.some((c) => c.status === 'active');
                      const pComp = pCycles.length > 0 && pCycles.every((c) => c.status === 'completed');
                      const statusTag = pActive
                        ? ''
                        : pComp
                          ? (language === 'km' ? ' (ប្រមូលផលរួច)' : ' (Completed)')
                          : (language === 'km' ? ' (ទំនេរ)' : ' (Empty)');
                      return (
                        <option key={p.id} value={p.id}>
                          {p.name} {p.code ? `(${p.code})` : ''}{statusTag}
                        </option>
                      );
                    })}
                  </optgroup>
                )}
                {openFieldPlots.length > 0 && (
                  <optgroup label={language === 'km' ? '🌱 ចំការវាល (Open Field)' : '🌱 Open Fields'}>
                    {openFieldPlots.map((p) => {
                      const pCycles = cropCycles.filter((c) => c.plotId === p.id);
                      const pActive = pCycles.some((c) => c.status === 'active');
                      const pComp = pCycles.length > 0 && pCycles.every((c) => c.status === 'completed');
                      const statusTag = pActive
                        ? ''
                        : pComp
                          ? (language === 'km' ? ' (ប្រមូលផលរួច)' : ' (Completed)')
                          : (language === 'km' ? ' (ទំនេរ)' : ' (Empty)');
                      return (
                        <option key={p.id} value={p.id}>
                          {p.name} {p.code ? `(${p.code})` : ''}{statusTag}
                        </option>
                      );
                    })}
                  </optgroup>
                )}
                {otherPlots.length > 0 && (
                  <optgroup label={language === 'km' ? 'រងដាំផ្សេងទៀត (Other Fields)' : 'Other Fields'}>
                    {otherPlots.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="mt-2.5 pt-2 border-t border-slate-100">
          {areaM2Display !== '—' ? (
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight">
                {areaM2Display}m²
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-500 font-mono">
                ({areaHaDisplay}{language === 'km' ? 'ហិចតា' : 'ha'})
              </span>
            </div>
          ) : (
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-xl sm:text-2xl font-bold text-slate-300 font-mono tracking-tight">
                —
              </span>
              <span className="text-xs font-semibold text-slate-400 font-khmer">
                {isCropCompleted 
                  ? (language === 'km' ? 'ប្រមូលផលរួចរាល់' : 'Harvest completed')
                  : (language === 'km' ? 'គ្មានដំណាំដាំដុះ' : 'No crop planted')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Current Stage Card */}
      <div className="lg:col-span-2 bg-white rounded-2xl p-4 shadow-2xs border border-slate-200/90 flex flex-col justify-between hover:shadow-xs transition-shadow">
        <div className="flex items-center gap-2.5">
          <motion.div 
            whileHover={{ scale: 1.25, rotate: -15 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 cursor-pointer shadow-2xs ${
              hasActiveCrop ? 'bg-amber-50 text-amber-500' : 'bg-slate-100 text-slate-400'
            }`}
          >
            <Flower2 className="w-5 h-5" />
          </motion.div>
          <div className="leading-tight">
            <span className="text-sm font-extrabold text-slate-800 block">Current Stage</span>
            <span className="text-xs text-slate-400 font-khmer block">ដំណាក់កាលបច្ចុប្បន្ន</span>
          </div>
        </div>

        <div className="mt-2.5 pt-2 border-t border-slate-100">
          {hasActiveCrop && currentStageName ? (
            <span className="text-base sm:text-lg font-black text-slate-900 font-khmer block truncate" title={currentStageName}>
              {currentStageName}
            </span>
          ) : (
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-bold text-slate-300 font-mono">—</span>
              <span className="text-xs font-semibold text-slate-400 font-khmer">
                {isCropCompleted 
                  ? (language === 'km' ? 'ប្រមូលផលរួចរាល់' : 'Completed') 
                  : (language === 'km' ? 'គ្មានដំណាក់កាល' : 'Empty')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 3. Days to Harvest Card */}
      <div className="lg:col-span-2 bg-white rounded-2xl p-4 shadow-2xs border border-slate-200/90 flex flex-col justify-between hover:shadow-xs transition-shadow">
        <div className="flex items-center gap-2.5">
          <motion.div 
            whileHover={{ scale: 1.25, rotate: 12 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border cursor-pointer shadow-2xs ${
              hasActiveCrop ? 'bg-amber-50 text-amber-600 border-amber-200/50' : 'bg-slate-100 text-slate-400 border-slate-200/50'
            }`}
          >
            <CalendarClock className="w-5 h-5" />
          </motion.div>
          <div className="leading-tight">
            <span className="text-sm font-extrabold text-slate-800 block">Days to Harvest</span>
            <span className="text-xs text-slate-400 font-khmer block">ថ្ងៃដល់ការប្រមូលផល</span>
          </div>
        </div>

        <div className="mt-2.5 pt-2 border-t border-slate-100">
          {hasActiveCrop && daysToHarvest !== null ? (
            <>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">{daysToHarvest}</span>
                <span className={`text-sm sm:text-base font-bold text-slate-700 ${language === 'km' ? 'font-khmer' : 'font-sans'}`}>
                  {language === 'km' ? 'ថ្ងៃ' : 'Days'}
                </span>
              </div>
              {harvestDateStr && <p className="text-xs font-semibold text-slate-400 font-mono mt-0.5">{harvestDateStr}</p>}
            </>
          ) : (
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-bold text-slate-300 font-mono">—</span>
              <span className="text-xs font-semibold text-slate-400 font-khmer">
                {isCropCompleted 
                  ? (language === 'km' ? 'ប្រមូលផលរួចរាល់' : 'Harvested') 
                  : (language === 'km' ? 'គ្មានទិន្នន័យ' : 'No data')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 4. Estimated Yield Card */}
      <div className="lg:col-span-2 bg-white rounded-2xl p-4 shadow-2xs border border-slate-200/90 flex flex-col justify-between hover:shadow-xs transition-shadow">
        <div className="flex items-center gap-2.5">
          <motion.div 
            whileHover={{ scale: 1.25, rotate: -10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 cursor-pointer shadow-2xs ${
              hasActiveCrop ? 'bg-orange-50 text-amber-600' : 'bg-slate-100 text-slate-400'
            }`}
          >
            <Scale className="w-5 h-5" />
          </motion.div>
          <div className="leading-tight">
            <span className="text-sm font-extrabold text-slate-800 block">Estimated Yield</span>
            <span className="text-xs text-slate-400 font-khmer block">ទិន្នផលរំពឹងទុក</span>
          </div>
        </div>

        <div className="mt-2.5 pt-2 border-t border-slate-100">
          {hasActiveCrop && estimatedYieldKg > 0 ? (
            <>
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight">
                  {estimatedYieldKg.toLocaleString()}
                </span>
                <span className={`text-xs sm:text-sm font-bold text-slate-600 ${language === 'km' ? 'font-khmer' : 'font-mono'}`}>
                  {language === 'km' ? 'គ.ក្រ' : 'kg'}
                </span>
                <span className="text-xs font-semibold text-slate-400 font-mono">
                  ({estimatedYieldTons} {language === 'km' ? 'តោន' : 'tons'})
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 font-khmer mt-0.5 truncate" title={yieldContextText}>
                {yieldContextText}
              </p>
            </>
          ) : (
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-bold text-slate-300 font-mono">—</span>
              <span className="text-xs font-semibold text-slate-400 font-khmer">
                {isCropCompleted 
                  ? (language === 'km' ? 'ប្រមូលផលរួចរាល់' : 'Harvested') 
                  : (language === 'km' ? 'គ្មានទិន្នន័យទិន្នផល' : 'No estimate')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 5. Greenhouse Mode Card */}
      <div className="sm:col-span-2 md:col-span-4 lg:col-span-4">
        <GreenhouseModeCard />
      </div>
    </div>
  );
};
