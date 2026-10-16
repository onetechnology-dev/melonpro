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
import { FacilityShape } from '../../types/melon';
import { GreenhouseModeCard } from './GreenhouseModeCard';

export const StatusGridCards: React.FC = () => {
  const { language } = useI18n();
  const { 
    plots, 
    selectedPlotId, 
    setSelectedPlotId, 
    currentPlot, 
    cropCycles, 
    customStages,
    selectedFacilityId,
    setSelectedFacilityId 
  } = useFarm();

  // Extract facilities based on the current plot (or all plots if all is selected)
  // ONLY include facilities that currently have active crop planting
  const availableFacilities = React.useMemo(() => {
    const targetPlots = selectedPlotId === 'all' 
      ? plots 
      : (currentPlot ? [currentPlot] : plots);

    const list: {
      shape: FacilityShape;
      plotId: string;
      plotName: string;
      plotCode: string;
    }[] = [];

    targetPlots.forEach((p) => {
      // Find all active crop cycles for this plot
      const plotActiveCycles = cropCycles.filter(
        (c) => c.plotId === p.id && c.status === 'active'
      );

      // If plot has no active crop cycles at all, it has no active facility plantings
      if (plotActiveCycles.length === 0) {
        return;
      }

      const shapes = p.shapes && p.shapes.length > 0
        ? p.shapes
        : [
            {
              id: `shape-${p.id}-default`,
              name: p.name,
              facilityType: p.facilityType || 'net_house',
              coords: p.polygonCoords || [],
              areaM2: p.areaM2 || (p.areaHa === 0.4 ? 400 : Math.round((p.areaHa || 0) * 10000)),
              areaHa: p.areaHa || 0.04,
              plantCount: p.plantCount || 0,
            } as FacilityShape,
          ];

      shapes.forEach((s) => {
        // Check if facility s has active crop planting:
        // 1. Direct facilityId match
        const matchingCyclesById = plotActiveCycles.filter(
          (c) => c.facilityId && c.facilityId === s.id
        );

        // 2. Direct facilityName match
        const sNameLower = s.name.trim().toLowerCase();
        const matchingCyclesByName = plotActiveCycles.filter(
          (c) => c.facilityName && c.facilityName.trim().toLowerCase() === sNameLower
        );

        // 3. Batch number or cycle name reference (e.g. "-A01" matches "CKL-A01")
        const sAlphanumeric = s.name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const matchingCyclesByRef = plotActiveCycles.filter((c) => {
          const bNum = (c.batchNumber || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
          const cName = (c.name || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
          return sAlphanumeric && (bNum.includes(sAlphanumeric) || cName.includes(sAlphanumeric));
        });

        const hasDirectCycle = matchingCyclesById.length > 0 || matchingCyclesByName.length > 0 || matchingCyclesByRef.length > 0;

        // Determine active planting status:
        // - Directly associated with an active cycle
        // - Or has plants (> 0) while plot has active cycles
        // - Or single facility plot with active cycles
        const hasActivePlanting = hasDirectCycle ||
          (s.plantCount !== undefined && s.plantCount > 0) ||
          (shapes.length === 1 && plotActiveCycles.length > 0);

        if (hasActivePlanting) {
          list.push({
            shape: s,
            plotId: p.id,
            plotName: p.name,
            plotCode: p.code,
          });
        }
      });
    });

    return list;
  }, [selectedPlotId, currentPlot, plots, cropCycles]);

  // Auto-reset selectedFacilityId if current selection is not among active facilities
  React.useEffect(() => {
    if (selectedFacilityId !== 'all') {
      const exists = availableFacilities.some((f) => f.shape.id === selectedFacilityId);
      if (!exists) {
        setSelectedFacilityId('all');
      }
    }
  }, [selectedFacilityId, availableFacilities, setSelectedFacilityId]);

  const netHouseFacilities = React.useMemo(() => 
    availableFacilities.filter((f) => f.shape.facilityType === 'net_house'),
    [availableFacilities]
  );

  const openFieldFacilities = React.useMemo(() => 
    availableFacilities.filter((f) => f.shape.facilityType === 'open_field'),
    [availableFacilities]
  );

  const otherFacilities = React.useMemo(() => 
    availableFacilities.filter((f) => f.shape.facilityType !== 'net_house' && f.shape.facilityType !== 'open_field'),
    [availableFacilities]
  );

  const activeFacilityItem = React.useMemo(() => {
    if (selectedFacilityId === 'all') return null;
    return availableFacilities.find((f) => f.shape.id === selectedFacilityId) || null;
  }, [selectedFacilityId, availableFacilities]);

  const isAllPlots = selectedPlotId === 'all';
  const relevantCycles = React.useMemo(() => {
    if (isAllPlots) return cropCycles;
    if (!currentPlot) return [];
    return cropCycles.filter((c) => c.plotId === currentPlot.id);
  }, [isAllPlots, cropCycles, currentPlot]);

  const activeCycles = React.useMemo(() => relevantCycles.filter((c) => c.status === 'active'), [relevantCycles]);
  const completedCycles = React.useMemo(() => relevantCycles.filter((c) => c.status === 'completed'), [relevantCycles]);

  // When a specific facility is selected, resolve active cycle for that specific facility
  const facilityActiveCycles = React.useMemo(() => {
    if (!activeFacilityItem) return activeCycles;
    const facId = activeFacilityItem.shape.id;
    const facName = activeFacilityItem.shape.name.toLowerCase();
    const facCode = activeFacilityItem.shape.name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

    const filtered = activeCycles.filter((c) => {
      if (c.facilityId && c.facilityId === facId) return true;
      if (c.facilityName && c.facilityName.toLowerCase() === facName) return true;
      const bNum = (c.batchNumber || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const cName = (c.name || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      return facCode && (bNum.includes(facCode) || cName.includes(facCode));
    });

    return filtered.length > 0 ? filtered : activeCycles;
  }, [activeFacilityItem, activeCycles]);

  const hasActiveCrop = activeCycles.length > 0 && availableFacilities.length > 0;
  const isCropCompleted = !hasActiveCrop && relevantCycles.length > 0 && relevantCycles.every((c) => c.status === 'completed');
  const isCropEmpty = relevantCycles.length === 0;

  const currentCycle = (activeFacilityItem ? facilityActiveCycles[0] : activeCycles[0]) || (isCropCompleted ? completedCycles[0] : null);

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

  const { areaM2Display, areaHaDisplay, activeFacilityBadge } = React.useMemo(() => {
    if (activeFacilityItem) {
      const s = activeFacilityItem.shape;
      const ha = s.areaHa ?? 0;
      const m2 = s.areaM2 !== undefined && s.areaM2 > 0
        ? s.areaM2
        : (ha === 0.04 || ha === 0.4 ? 400 : Math.round(ha * 10000));

      const badge = s.facilityType === 'net_house'
        ? (language === 'km' ? 'ផ្ទះសំណាញ់' : 'Net House')
        : (language === 'km' ? 'ចំការវាល' : 'Open Field');

      return {
        areaM2Display: m2 > 0 ? m2.toLocaleString() : '—',
        areaHaDisplay: ha > 0 ? String(Number(ha.toFixed(2))) : '—',
        activeFacilityBadge: badge,
      };
    }

    if (availableFacilities.length === 0) {
      return {
        areaM2Display: '—',
        areaHaDisplay: '—',
        activeFacilityBadge: language === 'km' ? 'គ្មានដាំដុះ' : 'No Active Crop',
      };
    }

    // When 'all' active facilities in the current plot (or all plots) are selected:
    const totalM2 = availableFacilities.reduce((sum, f) => {
      const s = f.shape;
      const m2 = s.areaM2 !== undefined && s.areaM2 > 0
        ? s.areaM2
        : (s.areaHa === 0.04 || s.areaHa === 0.4 ? 400 : Math.round((s.areaHa || 0) * 10000));
      return sum + m2;
    }, 0);

    const totalHa = availableFacilities.reduce((sum, f) => sum + (f.shape.areaHa || 0), 0);
    const badge = `${availableFacilities.length} ${language === 'km' ? 'រោងសកម្ម' : 'Active Fac.'}`;

    return {
      areaM2Display: totalM2 > 0 ? totalM2.toLocaleString() : '—',
      areaHaDisplay: totalHa > 0 ? String(Number(totalHa.toFixed(2))) : '—',
      activeFacilityBadge: badge,
    };
  }, [activeFacilityItem, availableFacilities, language]);

  const { estimatedYieldKg, estimatedYieldTons, yieldContextText } = React.useMemo(() => {
    if (!hasActiveCrop) {
      return { estimatedYieldKg: 0, estimatedYieldTons: 0, yieldContextText: '' };
    }

    let totalKg = 0;
    const cyclesToSum = activeFacilityItem ? facilityActiveCycles : activeCycles;
    cyclesToSum.forEach((c) => {
      if (c.targetYieldKg && c.targetYieldKg > 0) {
        totalKg += c.targetYieldKg;
      } else if (c.targetYieldTons && c.targetYieldTons > 0) {
        totalKg += Math.round(c.targetYieldTons * 1000);
      } else {
        const plants = c.plantCount || (activeFacilityItem?.shape.plantCount) || 2800;
        totalKg += Math.round(plants * 1.8);
      }
    });

    const tons = Number((totalKg / 1000).toFixed(2));
    const isSinglePlot = !isAllPlots && currentPlot;

    const contextText = activeFacilityItem
      ? (language === 'km'
          ? `ផ្អែកលើ ${activeFacilityItem.shape.name} (${activeFacilityItem.plotName})`
          : `Target yield for ${activeFacilityItem.shape.name} (${activeFacilityItem.plotName})`)
      : isSinglePlot
      ? (language === 'km'
          ? `ផ្អែកលើដំណាំដាំ ${currentPlot?.name || 'រងនេះ'} (${availableFacilities.length} រោងសកម្ម)`
          : `Target yield for ${currentPlot?.name || 'this plot'} (${availableFacilities.length} active fac.)`)
      : (language === 'km'
          ? `សរុបទិន្នផលដំណាំដាំ (${availableFacilities.length} រោងសកម្ម)`
          : `Total Target Yield across ${availableFacilities.length} active facilities`);

    return { estimatedYieldKg: totalKg, estimatedYieldTons: tons, yieldContextText: contextText };
  }, [hasActiveCrop, activeCycles, facilityActiveCycles, activeFacilityItem, isAllPlots, currentPlot, availableFacilities.length, language]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-12 gap-3.5 items-stretch">
      {/* 1. Facility Selector Card based on each Plot */}
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
              {language === 'km' ? 'ជ្រើសរើស Facility' : 'Select Facility'}
            </span>
            <span className="text-xs text-slate-400 font-khmer block truncate">
              {currentPlot 
                ? (language === 'km' ? `រោងសកម្មក្នុង ${currentPlot.name}` : `Active in ${currentPlot.name}`) 
                : (language === 'km' ? 'គ្រប់រោងដាំដុះសកម្ម' : 'All Active Facilities')}
            </span>
            <div className="relative mt-1">
              <select
                value={selectedFacilityId}
                onChange={(e) => setSelectedFacilityId(e.target.value)}
                disabled={availableFacilities.length === 0}
                className="w-full appearance-none bg-slate-50 border border-slate-200/80 hover:border-slate-300 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg px-2 py-1 font-bold text-xs text-slate-900 focus:outline-none pr-6 cursor-pointer truncate transition-colors"
              >
                {availableFacilities.length === 0 ? (
                  <option value="none">
                    {language === 'km' ? '🚫 គ្មានរោងដាំដុះសកម្ម' : '🚫 No Active Facilities'}
                  </option>
                ) : (
                  <>
                    <option value="all">
                      {language === 'km' 
                        ? `✨ ជ្រើសរើសទាំងអស់ (${availableFacilities.length} រោងសកម្ម)` 
                        : `✨ Select All (${availableFacilities.length} Active ${availableFacilities.length > 1 ? 'Facilities' : 'Facility'})`}
                    </option>

                    {netHouseFacilities.length > 0 && (
                      <optgroup label={language === 'km' ? '🏠 ផ្ទះសំណាញ់ (Net Houses)' : '🏠 Net Houses'}>
                        {netHouseFacilities.map(({ shape, plotName }) => (
                          <option key={shape.id} value={shape.id}>
                            {shape.name} · {shape.areaM2 ? `${shape.areaM2.toLocaleString()}m²` : `${shape.areaHa}ha`}
                            {shape.plantCount ? ` (${shape.plantCount.toLocaleString()} ដើម)` : ''}
                            {selectedPlotId === 'all' ? ` [${plotName}]` : ''}
                          </option>
                        ))}
                      </optgroup>
                    )}

                    {openFieldFacilities.length > 0 && (
                      <optgroup label={language === 'km' ? '🌱 ចំការវាល (Open Fields)' : '🌱 Open Fields'}>
                        {openFieldFacilities.map(({ shape, plotName }) => (
                          <option key={shape.id} value={shape.id}>
                            {shape.name} · {shape.areaM2 ? `${shape.areaM2.toLocaleString()}m²` : `${shape.areaHa}ha`}
                            {shape.plantCount ? ` (${shape.plantCount.toLocaleString()} ដើម)` : ''}
                            {selectedPlotId === 'all' ? ` [${plotName}]` : ''}
                          </option>
                        ))}
                      </optgroup>
                    )}

                    {otherFacilities.length > 0 && (
                      <optgroup label={language === 'km' ? 'កន្លែងផ្សេងទៀត (Other Facilities)' : 'Other Facilities'}>
                        {otherFacilities.map(({ shape, plotName }) => (
                          <option key={shape.id} value={shape.id}>
                            {shape.name}
                            {selectedPlotId === 'all' ? ` [${plotName}]` : ''}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </>
                )}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight">
              {areaM2Display}m²
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-500 font-mono">
              ({areaHaDisplay}{language === 'km' ? 'ហិចតា' : 'ha'})
            </span>
          </div>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0">
            {activeFacilityBadge}
          </span>
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
