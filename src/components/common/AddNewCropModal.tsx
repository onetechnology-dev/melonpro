import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Sprout, 
  Check, 
  Calendar, 
  MapPin, 
  Layers, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp,
  Percent,
  Wheat,
  Scale,
  Edit3,
  Sliders,
  Warehouse,
  Trees,
  Plus,
  Trash2,
  AlertCircle,
  ChevronDown,
  CheckSquare,
  RotateCcw
} from 'lucide-react';
import { useI18n } from '../../locales/i18nContext';
import { useFarm } from '../../context/FarmContext';
import { Plot, CropCycle, CropCycleStatus, GrowthStage, GrowthStageKey, FarmTask, FacilityShape, FacilityType } from '../../types/melon';
import { CROP_VARIETIES_PRESETS, CropVarietyPreset, getStagesForVariety, calculateChainedStages } from '../../data/cropVarieties';
import { getStageColorTheme } from '../../data/customStagePresets';
import { buildTasksFromPresets, DEFAULT_AGRONOMIC_TASK_PRESETS } from '../../data/agronomicTaskPresets';
import { 
  formatSowingDate, 
  formatPlotCode, 
  formatCultivarName, 
  generateBatchCode, 
  generateBatchName 
} from '../../utils/batchFormat';

export interface PlotFacilityItem extends FacilityShape {
  plotId: string;
  plotName: string;
  plotCode?: string;
  plotColor?: string;
}

interface AddNewCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPlotId?: string;
  cropCycleToEdit?: CropCycle | null;
  initialVarietyPreset?: CropVarietyPreset | null;
}

export const AddNewCropModal: React.FC<AddNewCropModalProps> = ({
  isOpen,
  onClose,
  defaultPlotId,
  cropCycleToEdit,
  initialVarietyPreset,
}) => {
  const { language, t } = useI18n();
  const { 
    plots, 
    cropCycles, 
    addPlot, 
    cropVarieties, 
    customStages, 
    growthStages, 
    updateGrowthStage, 
    addCropCycle, 
    updateCropCycle, 
    addTask, 
    updatePlot, 
    taskPresets,
    setSelectedPlotId, 
    setActiveTab 
  } = useFarm();

  const isEditMode = !!cropCycleToEdit;
  const availableVarieties = cropVarieties && cropVarieties.length > 0 ? cropVarieties : CROP_VARIETIES_PRESETS;

  // Selected Preset
  const [selectedPreset, setSelectedPreset] = useState<CropVarietyPreset>(initialVarietyPreset || availableVarieties[0] || CROP_VARIETIES_PRESETS[0]);

  // Crop & Batch Info
  const [batchName, setBatchName] = useState('Mel 2777-20260920-A01');
  const [batchCode, setBatchCode] = useState('20260920-A01');
  const [isBatchNameManuallyEdited, setIsBatchNameManuallyEdited] = useState(false);
  const [isBatchCodeManuallyEdited, setIsBatchCodeManuallyEdited] = useState(false);
  const [varietyEn, setVarietyEn] = useState(CROP_VARIETIES_PRESETS[0].nameEn);
  const [varietyKm, setVarietyKm] = useState(CROP_VARIETIES_PRESETS[0].nameKm);

  // Plot & Facility Assignment

  const [plotChoice, setPlotChoice] = useState<'existing' | 'new'>('existing');
  const [selectedPlotIds, setSelectedPlotIds] = useState<string[]>([defaultPlotId || plots[0]?.id || 'plot-a']);
  const [assignedPlotId, setAssignedPlotId] = useState<string>(defaultPlotId || plots[0]?.id || 'plot-a');
  const [isPlotDropdownOpen, setIsPlotDropdownOpen] = useState(false);
  const plotDropdownRef = useRef<HTMLDivElement>(null);

  const [assignedFacilityId, setAssignedFacilityId] = useState<string>('');
  const [selectedFacilityIds, setSelectedFacilityIds] = useState<string[]>([]);
  const [facilityTargetPlotId, setFacilityTargetPlotId] = useState<string>(defaultPlotId || plots[0]?.id || 'plot-a');
  const [facilityEditingPlotId, setFacilityEditingPlotId] = useState<string | null>(null);

  // Close plot dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (plotDropdownRef.current && !plotDropdownRef.current.contains(event.target as Node)) {
        setIsPlotDropdownOpen(false);
      }
    };
    if (isPlotDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPlotDropdownOpen]);
  
  // Facilities for "Create New Plot" (supporting multiple Net Houses or Open Fields)
  const [newPlotName, setNewPlotName] = useState('Plot H');
  const [newPlotFacilities, setNewPlotFacilities] = useState<FacilityShape[]>([
    {
      id: `shape-new-nh1`,
      name: 'Net House 1 (40m × 90m)',
      facilityType: 'net_house',
      areaM2: 3600,
      areaHa: 0.36,
      plantCount: 2800,
      color: '#15803D',
      coords: [],
    },
  ]);

  // Facility Sub-Modal State (for Add / Edit Facility)
  const [showFacilityModal, setShowFacilityModal] = useState(false);
  const [facilityModalMode, setFacilityModalMode] = useState<'add' | 'edit'>('add');
  const [facilityTargetScope, setFacilityTargetScope] = useState<'existing' | 'new'>('existing');
  const [facilityEditingId, setFacilityEditingId] = useState<string | null>(null);
  const [facilityForm, setFacilityForm] = useState<{
    name: string;
    facilityType: FacilityType;
    widthM: number | string;
    lengthM: number | string;
    areaM2: number | string;
    plantCount: number | string;
    color: string;
  }>({
    name: '',
    facilityType: 'net_house',
    widthM: 40,
    lengthM: 90,
    areaM2: 3600,
    plantCount: 2800,
    color: '#15803D',
  });

  // Facility Delete Confirmation State
  const [facilityToDelete, setFacilityToDelete] = useState<{
    id: string;
    name: string;
    scope: 'existing' | 'new';
    plotId?: string;
  } | null>(null);

  // Cultivation Medium & Target Yield (Kg)
  const [plantCount, setPlantCount] = useState(2800);
  const [targetYieldKg, setTargetYieldKg] = useState<number>(() => {
    const yieldRate = (initialVarietyPreset || availableVarieties[0])?.expectedYieldKgPerPlant || 1.8;
    return Math.round(2800 * yieldRate);
  });
  const [isYieldManuallyEdited, setIsYieldManuallyEdited] = useState(false);
  const targetYieldTons = Number(((targetYieldKg || 0) / 1000).toFixed(2));

  // Yield per plant from selected variety (defaults to 1.8 kg/plant)
  const yieldPerPlant = selectedPreset?.expectedYieldKgPerPlant || 1.8;
  const calculatedTargetYieldKg = Math.round((Number(plantCount) || 0) * yieldPerPlant);

  // Auto-calculate Target Yield (Kg) = Plant Population × Yield per Plant (From Crop Variety)
  useEffect(() => {
    if (!isYieldManuallyEdited) {
      setTargetYieldKg(calculatedTargetYieldKg);
    }
  }, [calculatedTargetYieldKg, isYieldManuallyEdited]);

  const [assignedAgronomist, setAssignedAgronomist] = useState('Sokha Farmer');
  const [cropStatus, setCropStatus] = useState<CropCycleStatus>('active');

  // Facility helpers for plots
  const getPlotFacilities = (plot: Plot): FacilityShape[] => {
    if (plot.shapes && plot.shapes.length > 0) {
      return plot.shapes;
    }
    const areaM2 = plot.areaM2 || Math.round((plot.areaHa || 1) * 10000);
    return [
      {
        id: `shape-${plot.id}-main`,
        name: `${plot.name} (${plot.facilityType === 'open_field' ? 'Open Field' : 'Net House'})`,
        facilityType: plot.facilityType || 'net_house',
        coords: plot.polygonCoords || [],
        areaM2,
        areaHa: plot.areaHa,
        plantCount: plot.plantCount || 2800,
        color: plot.color || '#15803D',
      },
    ];
  };

  const getPlotTotals = (plot: Plot) => {
    const facilities = getPlotFacilities(plot);
    const totalAreaM2 = facilities.reduce((sum, f) => sum + (f.areaM2 !== undefined ? f.areaM2 : (f.areaHa ? Math.round(f.areaHa * 10000) : 0)), 0);
    const totalPlantCount = facilities.reduce((sum, f) => sum + (f.plantCount || 0), 0);
    const totalAreaHa = Number((totalAreaM2 / 10000).toFixed(2));
    return {
      totalAreaM2: totalAreaM2 > 0 ? totalAreaM2 : (plot.areaM2 || Math.round((plot.areaHa || 1) * 10000)),
      totalAreaHa: totalAreaM2 > 0 ? totalAreaHa : (plot.areaHa || 1),
      totalPlantCount: totalPlantCount > 0 ? totalPlantCount : (plot.plantCount || 0),
    };
  };

  // Selected plots in existing mode
  const selectedPlots = plots.filter((p) => selectedPlotIds.includes(p.id));
  const effectiveSelectedPlots = selectedPlots.length > 0 ? selectedPlots : (plots[0] ? [plots[0]] : []);
  const currentPlot = plots.find((p) => p.id === assignedPlotId) || effectiveSelectedPlots[0] || plots[0];

  // Facilities collected across all selected plots
  const currentPlotFacilities: PlotFacilityItem[] = effectiveSelectedPlots.flatMap((plot) => {
    const facs = getPlotFacilities(plot);
    return facs.map((f) => ({
      ...f,
      plotId: plot.id,
      plotName: plot.name,
      plotCode: plot.code,
      plotColor: plot.color,
    }));
  });

  const selectedFacility = currentPlotFacilities.find((f) => f.id === assignedFacilityId) || currentPlotFacilities[0];

  // Calculated totals for New Plot
  const newPlotTotalAreaM2 = newPlotFacilities.reduce(
    (sum, f) => sum + (f.areaM2 !== undefined ? f.areaM2 : (f.areaHa ? Math.round(f.areaHa * 10000) : 0)),
    0
  );
  const newPlotTotalAreaHa = Number((newPlotTotalAreaM2 / 10000).toFixed(2));
  const newPlotTotalPlantCount = newPlotFacilities.reduce((sum, f) => sum + (f.plantCount || 0), 0);

  // Multi-select Plot Handlers
  const handleTogglePlot = (plotId: string) => {
    setSelectedPlotIds((prev) => {
      let next: string[];
      if (prev.includes(plotId)) {
        if (prev.length <= 1) {
          return prev; // Keep at least one plot selected
        }
        next = prev.filter((id) => id !== plotId);
      } else {
        next = [...prev, plotId];
      }

      if (next.length > 0) {
        setAssignedPlotId(next[0]);
        setFacilityTargetPlotId(next[0]);
      }

      // Compute newly active facilities across next plots
      const nextPlots = plots.filter((p) => next.includes(p.id));
      const nextFacs = nextPlots.flatMap((p) => getPlotFacilities(p));
      const nextFacIds = nextFacs.map((f) => f.id);

      setSelectedFacilityIds((prevFacIds) => {
        let updated = prevFacIds.filter((fid) => nextFacIds.includes(fid));
        // If plotId was newly checked, add its facilities to selection
        if (!prev.includes(plotId)) {
          const addedPlot = plots.find((p) => p.id === plotId);
          if (addedPlot) {
            const addedFacs = getPlotFacilities(addedPlot);
            updated = Array.from(new Set([...updated, ...addedFacs.map((f) => f.id)]));
          }
        }
        const finalIds = updated.length > 0 ? updated : (nextFacIds[0] ? [nextFacIds[0]] : []);

        if (!isEditMode) {
          const sumPlants = nextFacs
            .filter((f) => finalIds.includes(f.id))
            .reduce((sum, f) => sum + (f.plantCount || 0), 0);
          if (sumPlants > 0) {
            setPlantCount(sumPlants);
          }
        }

        if (finalIds.length > 0) {
          setAssignedFacilityId(finalIds[0]);
        }

        return finalIds;
      });

      return next;
    });
  };

  const handleSelectAllPlots = () => {
    const allIds = plots.map((p) => p.id);
    setSelectedPlotIds(allIds);
    if (allIds.length > 0) {
      setAssignedPlotId(allIds[0]);
      setFacilityTargetPlotId(allIds[0]);
    }
    const allFacs = plots.flatMap((p) => getPlotFacilities(p));
    const allFacIds = allFacs.map((f) => f.id);
    setSelectedFacilityIds(allFacIds);
    if (allFacIds.length > 0) setAssignedFacilityId(allFacIds[0]);
    if (!isEditMode) {
      const sumPlants = allFacs.reduce((sum, f) => sum + (f.plantCount || 0), 0);
      if (sumPlants > 0) setPlantCount(sumPlants);
    }
  };

  const handleSelectOnlyPlot = (plotId: string) => {
    setSelectedPlotIds([plotId]);
    setAssignedPlotId(plotId);
    setFacilityTargetPlotId(plotId);
    const targetP = plots.find((p) => p.id === plotId);
    if (targetP) {
      const facs = getPlotFacilities(targetP);
      const facIds = facs.map((f) => f.id);
      setSelectedFacilityIds(facIds);
      if (facIds.length > 0) setAssignedFacilityId(facIds[0]);
      if (!isEditMode) {
        const sumPlants = facs.reduce((sum, f) => sum + (f.plantCount || 0), 0);
        if (sumPlants > 0) setPlantCount(sumPlants);
      }
    }
  };

  const handlePlotChange = (newPlotId: string) => {
    handleSelectOnlyPlot(newPlotId);
  };

  const handleFacilityChange = (newFacilityId: string) => {
    setAssignedFacilityId(newFacilityId);
    setSelectedFacilityIds([newFacilityId]);
    if (!isEditMode) {
      const fac = currentPlotFacilities.find((f) => f.id === newFacilityId);
      if (fac && fac.plantCount) {
        setPlantCount(fac.plantCount);
      }
    }
  };

  const handleToggleFacilitySelection = (facilityId: string) => {
    const activeFacs = plotChoice === 'new' ? newPlotFacilities : currentPlotFacilities;
    setSelectedFacilityIds((prev) => {
      let next: string[];
      if (prev.includes(facilityId)) {
        if (prev.length <= 1) return prev; // Keep at least one facility selected
        next = prev.filter((id) => id !== facilityId);
      } else {
        next = [...prev, facilityId];
      }

      if (!isEditMode) {
        const sumPlants = activeFacs
          .filter((f) => next.includes(f.id))
          .reduce((sum, f) => sum + (f.plantCount || 0), 0);
        if (sumPlants > 0) {
          setPlantCount(sumPlants);
        }
      }

      if (next.length > 0) {
        setAssignedFacilityId(next[0]);
      }
      return next;
    });
  };

  const handleSelectOnlyFacility = (facilityId: string) => {
    setSelectedFacilityIds([facilityId]);
    setAssignedFacilityId(facilityId);
    const activeFacs = plotChoice === 'new' ? newPlotFacilities : currentPlotFacilities;
    const fac = activeFacs.find((f) => f.id === facilityId);
    if (fac && fac.plantCount && !isEditMode) {
      setPlantCount(fac.plantCount);
    }
  };

  const handleSelectAllFacilities = (scope: 'existing' | 'new', specificPlotId?: string) => {
    if (scope === 'new') {
      const allIds = newPlotFacilities.map((f) => f.id);
      setSelectedFacilityIds(allIds);
      if (allIds.length > 0) setAssignedFacilityId(allIds[0]);
      if (!isEditMode) {
        const sumPlants = newPlotFacilities.reduce((sum, f) => sum + (f.plantCount || 0), 0);
        if (sumPlants > 0) setPlantCount(sumPlants);
      }
    } else if (specificPlotId) {
      const plotFacs = currentPlotFacilities.filter((f) => f.plotId === specificPlotId);
      const plotFacIds = plotFacs.map((f) => f.id);
      const combined = Array.from(new Set([...selectedFacilityIds, ...plotFacIds]));
      setSelectedFacilityIds(combined);
      if (!isEditMode) {
        const sumPlants = currentPlotFacilities
          .filter((f) => combined.includes(f.id))
          .reduce((sum, f) => sum + (f.plantCount || 0), 0);
        if (sumPlants > 0) setPlantCount(sumPlants);
      }
    } else {
      const allIds = currentPlotFacilities.map((f) => f.id);
      setSelectedFacilityIds(allIds);
      if (allIds.length > 0) setAssignedFacilityId(allIds[0]);
      if (!isEditMode) {
        const sumPlants = currentPlotFacilities.reduce((sum, f) => sum + (f.plantCount || 0), 0);
        if (sumPlants > 0) setPlantCount(sumPlants);
      }
    }
  };

  // Facility Actions: Add, Edit, Delete
  const handleOpenAddFacility = (scope: 'existing' | 'new', targetPlotId?: string) => {
    const effectivePlotId = targetPlotId || facilityTargetPlotId || selectedPlotIds[0] || plots[0]?.id;
    setFacilityTargetPlotId(effectivePlotId);
    const targetPlot = plots.find((p) => p.id === effectivePlotId);
    const targetFacilities = scope === 'existing'
      ? (targetPlot ? getPlotFacilities(targetPlot) : currentPlotFacilities)
      : newPlotFacilities;
    const nextNum = targetFacilities.length + 1;
    const defaultType: FacilityType = 'net_house';
    const defaultWidth = 40;
    const defaultLength = 90;
    const defaultArea = defaultWidth * defaultLength;
    const defaultPlants = 2800;

    setFacilityTargetScope(scope);
    setFacilityModalMode('add');
    setFacilityEditingId(null);
    setFacilityEditingPlotId(null);
    setFacilityForm({
      name: `Net House ${nextNum} (${defaultWidth}m × ${defaultLength}m)`,
      facilityType: defaultType,
      widthM: defaultWidth,
      lengthM: defaultLength,
      areaM2: defaultArea,
      plantCount: defaultPlants,
      color: '#15803D',
    });
    setShowFacilityModal(true);
  };

  const handleOpenEditFacility = (facility: FacilityShape, scope: 'existing' | 'new', plotId?: string) => {
    setFacilityTargetScope(scope);
    setFacilityModalMode('edit');
    setFacilityEditingId(facility.id);
    setFacilityEditingPlotId(plotId || (facility as any).plotId || facilityTargetPlotId || currentPlot?.id);

    let widthVal: number | string = 40;
    let lengthVal: number | string = 90;
    if (facility.name) {
      const match = facility.name.match(/(\d+(?:\.\d+)?)\s*m\s*[×x*X]\s*(\d+(?:\.\d+)?)\s*m/i);
      if (match) {
        widthVal = Number(match[1]);
        lengthVal = Number(match[2]);
      }
    }

    const areaM2 = facility.areaM2 !== undefined ? facility.areaM2 : (facility.areaHa ? Math.round(facility.areaHa * 10000) : 3600);
    const plantCount = facility.plantCount !== undefined ? facility.plantCount : 2800;

    setFacilityForm({
      name: facility.name,
      facilityType: facility.facilityType,
      widthM: widthVal,
      lengthM: lengthVal,
      areaM2,
      plantCount,
      color: facility.color || (facility.facilityType === 'open_field' ? '#D97706' : '#15803D'),
    });
    setShowFacilityModal(true);
  };

  const handleFacilityWidthChange = (val: string) => {
    const w = val === '' ? '' : Math.max(0, Number(val));
    const l = Number(facilityForm.lengthM) || 0;
    const newArea = typeof w === 'number' && l > 0 ? Math.round(w * l) : (typeof w === 'number' && w > 0 ? w : '');
    setFacilityForm((prev) => ({
      ...prev,
      widthM: val,
      areaM2: newArea,
    }));
  };

  const handleFacilityLengthChange = (val: string) => {
    const l = val === '' ? '' : Math.max(0, Number(val));
    const w = Number(facilityForm.widthM) || 0;
    const newArea = typeof l === 'number' && w > 0 ? Math.round(w * l) : (typeof l === 'number' && l > 0 ? l : '');
    setFacilityForm((prev) => ({
      ...prev,
      lengthM: val,
      areaM2: newArea,
    }));
  };

  const handleSaveFacility = (e: React.FormEvent) => {
    e.preventDefault();
    const inputAreaM2 = Number(facilityForm.areaM2) || 0;
    const inputAreaHa = Number((inputAreaM2 / 10000).toFixed(4));
    const inputPlantCount = Number(facilityForm.plantCount) || 0;
    const finalName = facilityForm.name.trim() || (facilityForm.facilityType === 'net_house' ? 'Net House' : 'Open Field');

    if (facilityTargetScope === 'new') {
      if (facilityModalMode === 'add') {
        const newShape: FacilityShape = {
          id: `shape-new-${Date.now()}`,
          name: finalName,
          facilityType: facilityForm.facilityType,
          areaM2: inputAreaM2,
          areaHa: inputAreaHa,
          plantCount: inputPlantCount,
          color: facilityForm.color,
          coords: [],
        };
        setNewPlotFacilities((prev) => [...prev, newShape]);
        setSelectedFacilityIds((prev) => [...prev, newShape.id]);
        setAssignedFacilityId(newShape.id);
      } else if (facilityEditingId) {
        setNewPlotFacilities((prev) =>
          prev.map((f) =>
            f.id === facilityEditingId
              ? {
                  ...f,
                  name: finalName,
                  facilityType: facilityForm.facilityType,
                  areaM2: inputAreaM2,
                  areaHa: inputAreaHa,
                  plantCount: inputPlantCount,
                  color: facilityForm.color,
                }
              : f
          )
        );
      }
    } else {
      const targetPlotId = facilityModalMode === 'edit'
        ? (facilityEditingPlotId || facilityTargetPlotId || selectedPlotIds[0] || plots[0]?.id)
        : (facilityTargetPlotId || selectedPlotIds[0] || plots[0]?.id);
      const targetPlot = plots.find((p) => p.id === targetPlotId) || currentPlot;
      if (!targetPlot) return;
      const existingShapes = getPlotFacilities(targetPlot);
      let updatedShapes: FacilityShape[];

      if (facilityModalMode === 'add') {
        const newShape: FacilityShape = {
          id: `shape-${targetPlot.id}-${Date.now()}`,
          name: finalName,
          facilityType: facilityForm.facilityType,
          areaM2: inputAreaM2,
          areaHa: inputAreaHa,
          plantCount: inputPlantCount,
          color: facilityForm.color,
          coords: [],
        };
        updatedShapes = [...existingShapes, newShape];
        setSelectedFacilityIds((prev) => [...prev, newShape.id]);
        setAssignedFacilityId(newShape.id);
        if (!selectedPlotIds.includes(targetPlot.id)) {
          setSelectedPlotIds((prev) => [...prev, targetPlot.id]);
        }
      } else if (facilityEditingId) {
        updatedShapes = existingShapes.map((f) =>
          f.id === facilityEditingId
            ? {
                ...f,
                name: finalName,
                facilityType: facilityForm.facilityType,
                areaM2: inputAreaM2,
                areaHa: inputAreaHa,
                plantCount: inputPlantCount,
                color: facilityForm.color,
              }
            : f
        );
      } else {
        return;
      }

      const totalAreaM2 = updatedShapes.reduce((sum, s) => sum + (s.areaM2 || 0), 0);
      const totalAreaHa = Number((totalAreaM2 / 10000).toFixed(2));
      const totalPlants = updatedShapes.reduce((sum, s) => sum + (s.plantCount || 0), 0);
      const derivedTypes = Array.from(new Set(updatedShapes.map((s) => s.facilityType)));

      updatePlot({
        ...targetPlot,
        shapes: updatedShapes,
        areaM2: totalAreaM2,
        areaHa: totalAreaHa,
        plantCount: totalPlants,
        facilityTypes: derivedTypes,
        facilityType: derivedTypes[0] || targetPlot.facilityType || 'net_house',
      });
    }

    setShowFacilityModal(false);
  };

  const handleConfirmDeleteFacility = () => {
    if (!facilityToDelete) return;
    const { id, scope, plotId } = facilityToDelete;

    if (scope === 'new') {
      if (newPlotFacilities.length <= 1) {
        alert(language === 'km' 
          ? 'រងដាំត្រូវតែមានយ៉ាងហោចណាស់ ១ សំណង់!' 
          : 'A plot must have at least one facility (Net House or Open Field)!');
        setFacilityToDelete(null);
        return;
      }
      const remaining = newPlotFacilities.filter((f) => f.id !== id);
      setNewPlotFacilities(remaining);
      setSelectedFacilityIds((prev) => {
        const filtered = prev.filter((fid) => fid !== id);
        return filtered.length > 0 ? filtered : [remaining[0]?.id].filter(Boolean);
      });
    } else {
      const targetPlot = plots.find((p) => p.id === (plotId || facilityTargetPlotId)) || currentPlot;
      if (!targetPlot) return;
      const existingShapes = getPlotFacilities(targetPlot);
      if (existingShapes.length <= 1) {
        alert(language === 'km' 
          ? 'រងដាំត្រូវតែមានយ៉ាងហោចណាស់ ១ សំណង់!' 
          : 'A plot must have at least one facility (Net House or Open Field)!');
        setFacilityToDelete(null);
        return;
      }
      const remainingShapes = existingShapes.filter((f) => f.id !== id);
      const totalAreaM2 = remainingShapes.reduce((sum, s) => sum + (s.areaM2 || 0), 0);
      const totalAreaHa = Number((totalAreaM2 / 10000).toFixed(2));
      const totalPlants = remainingShapes.reduce((sum, s) => sum + (s.plantCount || 0), 0);
      const derivedTypes = Array.from(new Set(remainingShapes.map((s) => s.facilityType)));

      updatePlot({
        ...targetPlot,
        shapes: remainingShapes,
        areaM2: totalAreaM2,
        areaHa: totalAreaHa,
        plantCount: totalPlants,
        facilityTypes: derivedTypes,
        facilityType: derivedTypes[0] || 'net_house',
      });

      setSelectedFacilityIds((prev) => {
        const filtered = prev.filter((fid) => fid !== id);
        return filtered.length > 0 ? filtered : [remainingShapes[0]?.id].filter(Boolean);
      });
      if (assignedFacilityId === id) {
        setAssignedFacilityId(remainingShapes[0]?.id || '');
      }
    }

    setFacilityToDelete(null);
  };

  // Date Helpers
  const getTodayDateString = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const calculateDateOffset = (baseDateStr: string, offsetDays: number) => {
    if (!baseDateStr) return '';
    const parts = baseDateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      d.setDate(d.getDate() + Number(offsetDays || 0));
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dt = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${dt}`;
    }
    const d = new Date(baseDateStr);
    if (isNaN(d.getTime())) return '';
    d.setDate(d.getDate() + Number(offsetDays || 0));
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dt = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dt}`;
  };

  // Dates: Default sowingDate to current date, and auto-calculate transplantDate based on seedling stage duration
  const [sowingDate, setSowingDate] = useState(() => getTodayDateString());
  const [transplantDate, setTransplantDate] = useState(() => calculateDateOffset(getTodayDateString(), 7));

  // Refs for tracking sowingDate and modal session to avoid dependency loops and unwanted resets
  const sowingDateRef = useRef(sowingDate);
  useEffect(() => {
    sowingDateRef.current = sowingDate;
  }, [sowingDate]);

  const initializedSessionRef = useRef<string | null>(null);

  // Stage Durations
  const [seedlingDays, setSeedlingDays] = useState(7);
  const [transplantDays, setTransplantDays] = useState(7);
  const [vineGrowthDays, setVineGrowthDays] = useState(20);
  const [floweringDays, setFloweringDays] = useState(12);
  const [pollinationDays, setPollinationDays] = useState(14);
  const [fruitDevDays, setFruitDevDays] = useState(20);
  const [harvestDays, setHarvestDays] = useState(10);

  // 7 Growth Stages Custom Label Names (Seedling, Transplant, Vine Grow, Flowering, Pollinate, Fruit Dev, Harvest)
  const [stageLabelSeedling, setStageLabelSeedling] = useState('Seedling');
  const [stageLabelTransplant, setStageLabelTransplant] = useState('Transplant');
  const [stageLabelVineGrow, setStageLabelVineGrow] = useState('Vine Grow');
  const [stageLabelFlowering, setStageLabelFlowering] = useState('Flowering');
  const [stageLabelPollinate, setStageLabelPollinate] = useState('Pollinate');
  const [stageLabelFruitDev, setStageLabelFruitDev] = useState('Fruit Dev');
  const [stageLabelHarvest, setStageLabelHarvest] = useState('Harvest');

  const [stageLabelSeedlingKm, setStageLabelSeedlingKm] = useState('កូនដុះពន្លក');
  const [stageLabelTransplantKm, setStageLabelTransplantKm] = useState('ប្តូរនៃកូនដាំ');
  const [stageLabelVineGrowKm, setStageLabelVineGrowKm] = useState('ការលូតលាស់រុក្ខជាតិ');
  const [stageLabelFloweringKm, setStageLabelFloweringKm] = useState('ចេញផ្កា');
  const [stageLabelPollinateKm, setStageLabelPollinateKm] = useState('ការបង្កាត់លម្អង');
  const [stageLabelFruitDevKm, setStageLabelFruitDevKm] = useState('ការលូតលាស់ផ្លែ');
  const [stageLabelHarvestKm, setStageLabelHarvestKm] = useState('ប្រមូលផល');

  // Growth Stages Settings Controls
  const [showGrowthStagesSettings, setShowGrowthStagesSettings] = useState(false);
  const [isInlineEditingLabels, setIsInlineEditingLabels] = useState(false);
  const [syncWithGlobalStages, setSyncWithGlobalStages] = useState(false);
  const [durationsAppliedNotice, setDurationsAppliedNotice] = useState<string | null>(null);

  // Applies all 7 Custom Stage Durations (and optionally custom stage labels) based on the specified Master Crop Variety
  const handleApplyVarietyDurations = useCallback((preset: CropVarietyPreset, preserveCustomLabels = false) => {
    // Helper to extract stage duration from preset.stages[key].targetDays or direct property
    const getStageDays = (key: string, directProp: number | undefined, fallback: number) => {
      if (preset.stages && preset.stages.length > 0) {
        const found = preset.stages.find(
          (s) => s.key === key || (key === 'transplanting' && s.key === 'transplant')
        );
        if (found && typeof found.targetDays === 'number' && found.targetDays > 0) {
          return found.targetDays;
        }
      }
      if (typeof directProp === 'number' && directProp > 0) {
        return directProp;
      }
      return fallback;
    };

    const sDays = getStageDays('seedling', preset.seedlingDays, 7);
    const tDays = getStageDays('transplanting', preset.transplantDays, 7);
    const vDays = getStageDays('vine_growth', preset.vineGrowthDays, 20);
    const flDays = getStageDays('flowering', preset.floweringDays, 12);
    const pDays = getStageDays('pollination', preset.pollinationDays, 14);
    const frDays = getStageDays('fruit_development', preset.fruitDevDays, 20);
    const hDays = getStageDays('harvest', preset.harvestDays, 10);

    setSeedlingDays(sDays);
    setTransplantDays(tDays);
    setVineGrowthDays(vDays);
    setFloweringDays(flDays);
    setPollinationDays(pDays);
    setFruitDevDays(frDays);
    setHarvestDays(hDays);

    // Apply stage label names from variety stages config if available, unless preservation requested
    if (!preserveCustomLabels) {
      if (preset.stages && preset.stages.length > 0) {
        const sSeed = preset.stages.find((s) => s.key === 'seedling');
        const sTrans = preset.stages.find((s) => s.key === 'transplanting' || s.key === 'transplant');
        const sVine = preset.stages.find((s) => s.key === 'vine_growth');
        const sFlow = preset.stages.find((s) => s.key === 'flowering');
        const sPoll = preset.stages.find((s) => s.key === 'pollination');
        const sFruit = preset.stages.find((s) => s.key === 'fruit_development');
        const sHarv = preset.stages.find((s) => s.key === 'harvest');

        if (sSeed?.nameEn) setStageLabelSeedling(sSeed.nameEn);
        if (sSeed?.nameKm) setStageLabelSeedlingKm(sSeed.nameKm);
        if (sTrans?.nameEn) setStageLabelTransplant(sTrans.nameEn);
        if (sTrans?.nameKm) setStageLabelTransplantKm(sTrans.nameKm);
        if (sVine?.nameEn) setStageLabelVineGrow(sVine.nameEn);
        if (sVine?.nameKm) setStageLabelVineGrowKm(sVine.nameKm);
        if (sFlow?.nameEn) setStageLabelFlowering(sFlow.nameEn);
        if (sFlow?.nameKm) setStageLabelFloweringKm(sFlow.nameKm);
        if (sPoll?.nameEn) setStageLabelPollinate(sPoll.nameEn);
        if (sPoll?.nameKm) setStageLabelPollinateKm(sPoll.nameKm);
        if (sFruit?.nameEn) setStageLabelFruitDev(sFruit.nameEn);
        if (sFruit?.nameKm) setStageLabelFruitDevKm(sFruit.nameKm);
        if (sHarv?.nameEn) setStageLabelHarvest(sHarv.nameEn);
        if (sHarv?.nameKm) setStageLabelHarvestKm(sHarv.nameKm);
      } else if (growthStages && growthStages.length > 0) {
        const gsSeed = growthStages.find((s) => s.key === 'seedling');
        const gsTrans = growthStages.find((s) => s.key === 'transplanting');
        const gsVine = growthStages.find((s) => s.key === 'vine_growth');
        const gsFlow = growthStages.find((s) => s.key === 'flowering');
        const gsPoll = growthStages.find((s) => s.key === 'pollination');
        const gsFruit = growthStages.find((s) => s.key === 'fruit_development');
        const gsHarv = growthStages.find((s) => s.key === 'harvest');

        if (gsSeed?.nameEn) setStageLabelSeedling(gsSeed.nameEn);
        if (gsSeed?.nameKm) setStageLabelSeedlingKm(gsSeed.nameKm);
        if (gsTrans?.nameEn) setStageLabelTransplant(gsTrans.nameEn);
        if (gsTrans?.nameKm) setStageLabelTransplantKm(gsTrans.nameKm);
        if (gsVine?.nameEn) setStageLabelVineGrow(gsVine.nameEn);
        if (gsVine?.nameKm) setStageLabelVineGrowKm(gsVine.nameKm);
        if (gsFlow?.nameEn) setStageLabelFlowering(gsFlow.nameEn);
        if (gsFlow?.nameKm) setStageLabelFloweringKm(gsFlow.nameKm);
        if (gsPoll?.nameEn) setStageLabelPollinate(gsPoll.nameEn);
        if (gsPoll?.nameKm) setStageLabelPollinateKm(gsPoll.nameKm);
        if (gsFruit?.nameEn) setStageLabelFruitDev(gsFruit.nameEn);
        if (gsFruit?.nameKm) setStageLabelFruitDevKm(gsFruit.nameKm);
        if (gsHarv?.nameEn) setStageLabelHarvest(gsHarv.nameEn);
        if (gsHarv?.nameKm) setStageLabelHarvestKm(gsHarv.nameKm);
      }
    }

    // Auto-calculate transplanting date based on variety's seedlingDays
    const currentBase = sowingDateRef.current;
    if (currentBase) {
      setTransplantDate(calculateDateOffset(currentBase, sDays));
    }
  }, [growthStages]);

  const handleResetStageLabels = () => {
    handleApplyVarietyDurations(selectedPreset);
  };

  const handleApplyGrowthStagesSettings = () => {
    if (syncWithGlobalStages && growthStages && updateGrowthStage) {
      const updates = [
        { key: 'seedling', nameEn: stageLabelSeedling, nameKm: stageLabelSeedlingKm, defaultDays: seedlingDays },
        { key: 'transplanting', nameEn: stageLabelTransplant, nameKm: stageLabelTransplantKm, defaultDays: transplantDays },
        { key: 'vine_growth', nameEn: stageLabelVineGrow, nameKm: stageLabelVineGrowKm, defaultDays: vineGrowthDays },
        { key: 'flowering', nameEn: stageLabelFlowering, nameKm: stageLabelFloweringKm, defaultDays: floweringDays },
        { key: 'pollination', nameEn: stageLabelPollinate, nameKm: stageLabelPollinateKm, defaultDays: pollinationDays },
        { key: 'fruit_development', nameEn: stageLabelFruitDev, nameKm: stageLabelFruitDevKm, defaultDays: fruitDevDays },
        { key: 'harvest', nameEn: stageLabelHarvest, nameKm: stageLabelHarvestKm, defaultDays: harvestDays },
      ];

      updates.forEach((u) => {
        const found = growthStages.find((s) => s.key === u.key);
        if (found) {
          updateGrowthStage({
            ...found,
            nameEn: u.nameEn,
            nameKm: u.nameKm,
            defaultDays: u.defaultDays,
          });
        }
      });
    }
    setShowGrowthStagesSettings(false);
  };

  // Automation
  const [autoCreateTasks, setAutoCreateTasks] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);

  // Handlers for bidirectional date & duration syncing
  const handleSowingDateChange = (newSowingDate: string) => {
    setSowingDate(newSowingDate);
    if (newSowingDate) {
      // Auto calculate Transplanting Date = sowingDate + seedlingDays
      setTransplantDate(calculateDateOffset(newSowingDate, seedlingDays));
      if (!isEditMode) {
        const targetPlotName = plotChoice === 'new' ? newPlotName : (currentPlot?.name || 'Plot A');
        const targetFacName = plotChoice === 'new' ? (newPlotFacilities[0]?.name || 'Net House 1') : (selectedFacility?.name || 'Net House 1');
        if (!isBatchNameManuallyEdited) {
          setBatchName(generateBatchName(varietyEn, newSowingDate, targetPlotName, targetFacName));
        }
        if (!isBatchCodeManuallyEdited) {
          setBatchCode(generateBatchCode(newSowingDate, targetPlotName, targetFacName));
        }
      }
    }
  };

  const handleSeedlingDaysChange = (newDays: number) => {
    const valid = Math.max(1, newDays);
    setSeedlingDays(valid);
    // Auto calculate Transplanting Date base on Custom Stage Durations (Seedling Days)
    if (sowingDate) {
      setTransplantDate(calculateDateOffset(sowingDate, valid));
    }
  };

  const handleTransplantDateChange = (newTransplantDate: string) => {
    setTransplantDate(newTransplantDate);
    if (sowingDate && newTransplantDate) {
      const s = new Date(sowingDate).getTime();
      const t = new Date(newTransplantDate).getTime();
      const diffDays = Math.round((t - s) / (1000 * 60 * 60 * 24));
      if (diffDays > 0) {
        setSeedlingDays(diffDays);
      }
    }
  };

  // Populate data when in edit mode or set default today's date for new crop
  useEffect(() => {
    if (!isOpen) {
      initializedSessionRef.current = null;
      return;
    }

    const sessionKey = cropCycleToEdit ? `edit-${cropCycleToEdit.id}` : 'new';
    if (initializedSessionRef.current === sessionKey) {
      return;
    }
    initializedSessionRef.current = sessionKey;

    if (cropCycleToEdit) {
      setBatchName(cropCycleToEdit.name);
      setBatchCode(cropCycleToEdit.batchNumber);
      setIsBatchNameManuallyEdited(true);
      setIsBatchCodeManuallyEdited(true);
      setVarietyEn(cropCycleToEdit.variety);
      setSelectedPlotIds([cropCycleToEdit.plotId]);
      setAssignedPlotId(cropCycleToEdit.plotId);
      setFacilityTargetPlotId(cropCycleToEdit.plotId);
      setAssignedFacilityId(cropCycleToEdit.facilityId || '');
      if (cropCycleToEdit.facilityId) {
        setSelectedFacilityIds([cropCycleToEdit.facilityId]);
      } else {
        const targetP = plots.find((p) => p.id === cropCycleToEdit.plotId);
        const facs = targetP ? getPlotFacilities(targetP) : [];
        if (facs.length > 0) {
          setAssignedFacilityId(facs[0].id);
          setSelectedFacilityIds([facs[0].id]);
        }
      }
      setPlotChoice('existing');
      setNewPlotName(`Plot ${String.fromCharCode(65 + plots.length)}`);
      setSowingDate(cropCycleToEdit.sowingDate);
      setTransplantDate(cropCycleToEdit.transplantDate);
      if (cropCycleToEdit.status) setCropStatus(cropCycleToEdit.status);
      if (cropCycleToEdit.assignedAgronomist) setAssignedAgronomist(cropCycleToEdit.assignedAgronomist);
      if (cropCycleToEdit.plantCount) setPlantCount(cropCycleToEdit.plantCount);

      // Match preset if possible
      const matched = availableVarieties.find((p) => p.nameEn.toLowerCase() === cropCycleToEdit.variety.toLowerCase());
      if (matched) {
        setSelectedPreset(matched);
        setVarietyKm(matched.nameKm);
      }

      if (cropCycleToEdit.targetYieldKg) {
        setTargetYieldKg(cropCycleToEdit.targetYieldKg);
        setIsYieldManuallyEdited(true);
      } else if (cropCycleToEdit.targetYieldTons) {
        setTargetYieldKg(Math.round(cropCycleToEdit.targetYieldTons * 1000));
        setIsYieldManuallyEdited(true);
      } else {
        const yieldRate = matched?.expectedYieldKgPerPlant || 1.8;
        setTargetYieldKg(Math.round((cropCycleToEdit.plantCount || 2800) * yieldRate));
        setIsYieldManuallyEdited(false);
      }

      // Read stage durations and custom stage label names if available
      if (cropCycleToEdit.stages && cropCycleToEdit.stages.length >= 7) {
        const s0 = cropCycleToEdit.stages[0];
        const s1 = cropCycleToEdit.stages[1];
        const s2 = cropCycleToEdit.stages[2];
        const s3 = cropCycleToEdit.stages[3];
        const s4 = cropCycleToEdit.stages[4];
        const s5 = cropCycleToEdit.stages[5];
        const s6 = cropCycleToEdit.stages[6];

        const sDays = s0?.targetDays || 7;
        setSeedlingDays(sDays);
        setTransplantDays(s1?.targetDays || 7);
        setVineGrowthDays(s2?.targetDays || 20);
        setFloweringDays(s3?.targetDays || 12);
        setPollinationDays(s4?.targetDays || 14);
        setFruitDevDays(s5?.targetDays || 20);
        setHarvestDays(s6?.targetDays || 10);

        if (s0?.nameEn) setStageLabelSeedling(s0.nameEn);
        if (s0?.nameKm) setStageLabelSeedlingKm(s0.nameKm);
        if (s1?.nameEn) setStageLabelTransplant(s1.nameEn);
        if (s1?.nameKm) setStageLabelTransplantKm(s1.nameKm);
        if (s2?.nameEn) setStageLabelVineGrow(s2.nameEn);
        if (s2?.nameKm) setStageLabelVineGrowKm(s2.nameKm);
        if (s3?.nameEn) setStageLabelFlowering(s3.nameEn);
        if (s3?.nameKm) setStageLabelFloweringKm(s3.nameKm);
        if (s4?.nameEn) setStageLabelPollinate(s4.nameEn);
        if (s4?.nameKm) setStageLabelPollinateKm(s4.nameKm);
        if (s5?.nameEn) setStageLabelFruitDev(s5.nameEn);
        if (s5?.nameKm) setStageLabelFruitDevKm(s5.nameKm);
        if (s6?.nameEn) setStageLabelHarvest(s6.nameEn);
        if (s6?.nameKm) setStageLabelHarvestKm(s6.nameKm);
      } else {
        // Fall back to Master Crop Variety stage durations
        handleApplyVarietyDurations(matched || availableVarieties[0] || CROP_VARIETIES_PRESETS[0]);
      }
    } else {
      // Default new crop batch: Show current date on Sowing Date & auto-calculate Transplanting Date
      const today = getTodayDateString();
      const defaultPreset = initialVarietyPreset || availableVarieties[0] || CROP_VARIETIES_PRESETS[0];
      setSelectedPreset(defaultPreset);
      setVarietyEn(defaultPreset.nameEn);
      setVarietyKm(defaultPreset.nameKm);
      const targetPlot = plots.find((p) => p.id === (defaultPlotId || plots[0]?.id)) || plots[0];
      const initialPlotId = targetPlot?.id || 'plot-a';
      const initialPlotName = targetPlot?.name || 'Plot A';
      setSelectedPlotIds([initialPlotId]);
      setAssignedPlotId(initialPlotId);
      setFacilityTargetPlotId(initialPlotId);
      let primaryFacName = 'Net House 1';
      if (targetPlot) {
        const facs = getPlotFacilities(targetPlot);
        if (facs.length > 0) {
          setAssignedFacilityId(facs[0].id);
          setSelectedFacilityIds([facs[0].id]);
          if (facs[0].plantCount) setPlantCount(facs[0].plantCount);
          primaryFacName = facs[0].name;
        }
      }
      setBatchName(generateBatchName(defaultPreset.nameEn, today, initialPlotName, primaryFacName, 0));
      setBatchCode(generateBatchCode(today, initialPlotName, primaryFacName, 0));
      setIsBatchNameManuallyEdited(false);
      setIsBatchCodeManuallyEdited(false);
      setNewPlotFacilities([
        {
          id: `shape-new-nh1`,
          name: 'Net House 1 (40m × 90m)',
          facilityType: 'net_house',
          areaM2: 3600,
          areaHa: 0.36,
          plantCount: 2800,
          color: '#15803D',
          coords: [],
        },
      ]);
      setPlotChoice('existing');
      setSowingDate(today);

      // Apply all 7 Custom Stage Durations and labels based on the selected Master Crop Variety
      handleApplyVarietyDurations(defaultPreset);
    }
  }, [cropCycleToEdit, defaultPlotId, plots, isOpen, initialVarietyPreset, availableVarieties, growthStages, handleApplyVarietyDurations]);

  // Reactive auto-sync for Batch Name and Batch Code according to format
  useEffect(() => {
    if (isEditMode) return;
    const targetPlotName = plotChoice === 'new' 
      ? newPlotName 
      : (currentPlot?.name || 'Plot A');
    const targetFacName = plotChoice === 'new'
      ? (newPlotFacilities[0]?.name || 'Net House 1')
      : (selectedFacility?.name || 'Net House 1');

    if (!isBatchNameManuallyEdited) {
      setBatchName(generateBatchName(varietyEn, sowingDate, targetPlotName, targetFacName));
    }
    if (!isBatchCodeManuallyEdited) {
      setBatchCode(generateBatchCode(sowingDate, targetPlotName, targetFacName));
    }
  }, [
    isEditMode,
    varietyEn,
    sowingDate,
    plotChoice,
    newPlotName,
    newPlotFacilities,
    currentPlot?.name,
    selectedFacility?.name,
    isBatchNameManuallyEdited,
    isBatchCodeManuallyEdited,
  ]);

  if (!isOpen) return null;

  const totalDays = seedlingDays + transplantDays + vineGrowthDays + floweringDays + pollinationDays + fruitDevDays + harvestDays;

  const getHarvestStartDate = () => {
    if (!sowingDate) return '';
    return calculateDateOffset(sowingDate, totalDays - harvestDays);
  };

  const getHarvestEndDate = () => {
    if (!sowingDate) return '';
    return calculateDateOffset(sowingDate, totalDays);
  };

  // Helper to calculate difference in days between sowing date and today
  const getSowingDateOffset = () => {
    if (!sowingDate) return null;
    const today = new Date(getTodayDateString()).getTime();
    const sowing = new Date(sowingDate).getTime();
    return Math.round((today - sowing) / (1000 * 60 * 60 * 24));
  };

  // Dynamically resolve stages status and currentStageKey relative to today's date (supports back dates)
  const resolveStageProgression = (chainedStages: GrowthStage[], referenceDateStr: string = getTodayDateString()) => {
    const todayTs = new Date(referenceDateStr).setHours(0, 0, 0, 0);
    let currentKey: GrowthStageKey = chainedStages[0]?.key || 'seedling';
    let foundCurrent = false;

    const resolved = chainedStages.map((stg) => {
      const startTs = new Date(stg.startDate).setHours(0, 0, 0, 0);
      const endTs = new Date(stg.endDate).setHours(23, 59, 59, 999);

      if (todayTs > endTs) {
        // Stage has already passed in the past
        return {
          ...stg,
          status: 'completed' as const,
          progress: 100,
        };
      } else if (todayTs >= startTs && todayTs <= endTs && !foundCurrent) {
        // Active stage currently underway
        foundCurrent = true;
        currentKey = stg.key;
        const totalDuration = Math.max(1, endTs - startTs);
        const elapsed = Math.max(0, todayTs - startTs);
        const progressPct = Math.min(100, Math.max(10, Math.round((elapsed / totalDuration) * 100)));
        return {
          ...stg,
          status: 'current' as const,
          progress: progressPct,
        };
      } else {
        // Stage is in the future
        return {
          ...stg,
          status: 'upcoming' as const,
          progress: 0,
        };
      }
    });

    if (!foundCurrent && chainedStages.length > 0) {
      const firstStartTs = new Date(chainedStages[0].startDate).setHours(0, 0, 0, 0);
      if (todayTs < firstStartTs) {
        currentKey = chainedStages[0].key;
        resolved[0] = { ...resolved[0], status: 'upcoming', progress: 0 };
      } else {
        currentKey = chainedStages[chainedStages.length - 1].key;
        resolved[resolved.length - 1] = {
          ...resolved[resolved.length - 1],
          status: 'completed',
          progress: 100,
        };
      }
    }

    return { stages: resolved, currentStageKey: currentKey };
  };

  const handleSelectPreset = (preset: CropVarietyPreset) => {
    setSelectedPreset(preset);
    setVarietyEn(preset.nameEn);
    setVarietyKm(preset.nameKm);
    if (!isEditMode) {
      const targetPlotName = plotChoice === 'new' ? newPlotName : (currentPlot?.name || 'Plot A');
      const targetFacName = plotChoice === 'new' ? (newPlotFacilities[0]?.name || 'Net House 1') : (selectedFacility?.name || 'Net House 1');
      if (!isBatchNameManuallyEdited) {
        setBatchName(generateBatchName(preset.nameEn, sowingDate, targetPlotName, targetFacName));
      }
      if (!isBatchCodeManuallyEdited) {
        setBatchCode(generateBatchCode(sowingDate, targetPlotName, targetFacName));
      }
    }
    const pYield = preset.expectedYieldKgPerPlant || 1.8;
    setTargetYieldKg(Math.round((Number(plantCount) || 0) * pYield));
    setIsYieldManuallyEdited(false);

    // Apply custom stage durations from selected variety
    handleApplyVarietyDurations(preset);
  };

  const createAgronomicTasks = (cycleId: string, plotId: string, stagesList: GrowthStage[]) => {
    const mockCycle: CropCycle = {
      id: cycleId,
      name: batchName,
      batchNumber: batchCode,
      plotId,
      variety: varietyEn,
      sowingDate,
      transplantDate,
      harvestWindowStart: getHarvestStartDate(),
      harvestWindowEnd: getHarvestEndDate(),
      stages: stagesList,
      status: 'active',
      assignedAgronomist,
    };

    const tasksToCreate = buildTasksFromPresets(
      taskPresets && taskPresets.length > 0 ? taskPresets : DEFAULT_AGRONOMIC_TASK_PRESETS,
      mockCycle,
      stagesList,
      {
        assignedWorker: assignedAgronomist,
        targetBrix: selectedPreset.targetBrix,
        idealEc: selectedPreset.idealEc,
        varietyEn,
        varietyKm,
      }
    );

    tasksToCreate.forEach((t) => addTask(t));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const harvestStart = getHarvestStartDate();
    const harvestEnd = getHarvestEndDate();

    // 1. Build Stages (Standard Botanical Stages with customized label names)
    const baseStages = [
      { id: `stg-${Date.now()}-1`, key: 'seedling' as GrowthStageKey, nameEn: stageLabelSeedling.trim() || 'Seedling', nameKm: stageLabelSeedlingKm.trim() || 'កូនដុះពន្លក', startDate: '', endDate: '', targetDays: seedlingDays, status: 'upcoming' as const, progress: 0 },
      { id: `stg-${Date.now()}-2`, key: 'transplanting' as GrowthStageKey, nameEn: stageLabelTransplant.trim() || 'Transplant', nameKm: stageLabelTransplantKm.trim() || 'ប្តូរនៃកូនដាំ', startDate: '', endDate: '', targetDays: transplantDays, status: 'upcoming' as const, progress: 0 },
      { id: `stg-${Date.now()}-3`, key: 'vine_growth' as GrowthStageKey, nameEn: stageLabelVineGrow.trim() || 'Vine Grow', nameKm: stageLabelVineGrowKm.trim() || 'ការលូតលាស់រុក្ខជាតិ', startDate: '', endDate: '', targetDays: vineGrowthDays, status: 'upcoming' as const, progress: 0 },
      { id: `stg-${Date.now()}-4`, key: 'flowering' as GrowthStageKey, nameEn: stageLabelFlowering.trim() || 'Flowering', nameKm: stageLabelFloweringKm.trim() || 'ចេញផ្កា', startDate: '', endDate: '', targetDays: floweringDays, status: 'upcoming' as const, progress: 0 },
      { id: `stg-${Date.now()}-5`, key: 'pollination' as GrowthStageKey, nameEn: stageLabelPollinate.trim() || 'Pollinate', nameKm: stageLabelPollinateKm.trim() || 'ការបង្កាត់លម្អង', startDate: '', endDate: '', targetDays: pollinationDays, status: 'upcoming' as const, progress: 0 },
      { id: `stg-${Date.now()}-6`, key: 'fruit_development' as GrowthStageKey, nameEn: stageLabelFruitDev.trim() || 'Fruit Dev', nameKm: stageLabelFruitDevKm.trim() || 'ការលូតលាស់ផ្លែ', startDate: '', endDate: '', targetDays: fruitDevDays, status: 'upcoming' as const, progress: 0 },
    ];

    const harvestStage: GrowthStage = {
      id: `stg-${Date.now()}-7`,
      key: 'harvest',
      nameEn: stageLabelHarvest.trim() || 'Harvest',
      nameKm: stageLabelHarvestKm.trim() || 'ប្រមូលផល',
      startDate: '',
      endDate: '',
      targetDays: harvestDays,
      status: 'upcoming',
      progress: 0
    };

    const rawStages: GrowthStage[] = [...baseStages, harvestStage];
    const chainedStages = calculateChainedStages(rawStages, sowingDate);

    // Dynamically resolve each stage's status & progress based on sowingDate vs today
    const { stages: autoStages, currentStageKey: autoStageKey } = resolveStageProgression(chainedStages);
    let stages = autoStages;
    let effectiveCurrentStageKey = autoStageKey;

    // If in edit mode and stages already existed, preserve user-modified progress if sowingDate hasn't changed
    if (isEditMode && cropCycleToEdit?.stages && cropCycleToEdit.sowingDate === sowingDate) {
      stages = stages.map((newS) => {
        const prev = cropCycleToEdit.stages.find((os) => os.key === newS.key);
        if (prev) {
          return {
            ...newS,
            status: prev.status,
            progress: prev.progress,
          };
        }
        return newS;
      });
      if (cropCycleToEdit.currentStageKey) {
        effectiveCurrentStageKey = cropCycleToEdit.currentStageKey;
      }
    }

    const numPlantCount = Number(plantCount) || 0;

    // Determine targeted facilities for this planting
    const activeFacilities: (FacilityShape | PlotFacilityItem)[] = plotChoice === 'new'
      ? newPlotFacilities
      : currentPlotFacilities;

    const targetedFacilities = activeFacilities.filter((f) => selectedFacilityIds.includes(f.id));
    const facilitiesToPlant = targetedFacilities.length > 0
      ? targetedFacilities
      : (activeFacilities.length > 0 ? [activeFacilities[0]] : []);

    // -------------------------------------------------------------
    // BRANCH A: CREATE NEW PLOT
    // -------------------------------------------------------------
    if (plotChoice === 'new') {
      const newPlotId = `plot-${Date.now()}`;
      const totalNewAreaM2 = newPlotTotalAreaM2 || 3600;
      const totalNewAreaHa = newPlotTotalAreaHa || 0.36;
      const totalNewPlantCount = newPlotTotalPlantCount || numPlantCount || 2800;
      const derivedFacilityTypes = Array.from(new Set(newPlotFacilities.map((f) => f.facilityType)));

      const createdPlot: Plot = {
        id: newPlotId,
        name: newPlotName,
        code: `${(newPlotFacilities[0]?.facilityType || 'net_house') === 'open_field' ? 'OF' : 'NH'}-0${plots.length + 1}`,
        areaM2: totalNewAreaM2,
        areaHa: totalNewAreaHa,
        facilityType: newPlotFacilities[0]?.facilityType || 'net_house',
        facilityTypes: derivedFacilityTypes.length > 0 ? derivedFacilityTypes : ['net_house'],
        shapes: newPlotFacilities,
        melonVarietyEn: varietyEn,
        melonVarietyKm: varietyKm,
        melonType: selectedPreset.category as any,
        plantCount: totalNewPlantCount,
        sowingDate,
        transplantingDate: transplantDate,
        expectedHarvestDate: harvestEnd,
        currentStage: effectiveCurrentStageKey,
        healthScore: 98,
        healthStatus: 'optimal',
        soilMoisture: 70,
        soilEc: selectedPreset.idealEc,
        soilPh: selectedPreset.idealPh,
        ambientTemp: 32,
        humidity: 68,
        irrigationStatus: 'scheduled',
        nextIrrigationTime: '17:00',
        qrCodeId: `QR-${batchCode}`,
        color: selectedPreset.color,
        center: { lat: 11.4886 + (plots.length * 0.001), lng: 104.8324 + (plots.length * 0.001) },
      };

      addPlot(createdPlot);

      if (isEditMode && cropCycleToEdit) {
        // Update cropCycleToEdit for primary facility
        const primaryFac = facilitiesToPlant[0] || newPlotFacilities[0];
        const primaryPlants = facilitiesToPlant.length === 1 ? numPlantCount : (primaryFac.plantCount || Math.round(numPlantCount / facilitiesToPlant.length));
        const cycleYieldKg = Math.round(targetYieldKg / facilitiesToPlant.length);
        const cycleYieldTons = Math.round((cycleYieldKg / 1000) * 10) / 10;
        const updatedCycle: CropCycle = {
          ...cropCycleToEdit,
          name: facilitiesToPlant.length > 1 ? generateBatchName(varietyEn, sowingDate, newPlotName, primaryFac.name, 0) : batchName,
          batchNumber: facilitiesToPlant.length > 1 ? generateBatchCode(sowingDate, newPlotName, primaryFac.name, 0) : batchCode,
          plotId: newPlotId,
          facilityId: primaryFac.id,
          facilityName: primaryFac.name,
          facilityType: primaryFac.facilityType,
          areaM2: primaryFac.areaM2,
          plantCount: primaryPlants,
          variety: varietyEn,
          sowingDate,
          transplantDate,
          harvestWindowStart: harvestStart,
          harvestWindowEnd: harvestEnd,
          status: cropStatus,
          stages,
          targetYieldKg: cycleYieldKg,
          targetYieldTons: cycleYieldTons,
          assignedAgronomist,
          currentStageKey: effectiveCurrentStageKey,
        };
        updateCropCycle(updatedCycle);

        // Additional cycles if multiple facilities selected
        for (let i = 1; i < facilitiesToPlant.length; i++) {
          const extraFac = facilitiesToPlant[i];
          const extraPlants = extraFac.plantCount || Math.round(numPlantCount / facilitiesToPlant.length);
          const extraCycleId = `cycle-${Date.now()}-${i}`;
          const extraCycle: CropCycle = {
            id: extraCycleId,
            name: generateBatchName(varietyEn, sowingDate, newPlotName, extraFac.name, i),
            batchNumber: generateBatchCode(sowingDate, newPlotName, extraFac.name, i),
            plotId: newPlotId,
            facilityId: extraFac.id,
            facilityName: extraFac.name,
            facilityType: extraFac.facilityType,
            areaM2: extraFac.areaM2,
            plantCount: extraPlants,
            variety: varietyEn,
            sowingDate,
            transplantDate,
            harvestWindowStart: harvestStart,
            harvestWindowEnd: harvestEnd,
            status: cropStatus,
            stages,
            targetYieldKg: cycleYieldKg,
            targetYieldTons: cycleYieldTons,
            assignedAgronomist,
            currentStageKey: effectiveCurrentStageKey,
          };
          addCropCycle(extraCycle);
        }

        // Update previous plot if this cycle was moved out of it
        if (cropCycleToEdit.plotId && cropCycleToEdit.plotId !== newPlotId) {
          const oldPlot = plots.find((p) => p.id === cropCycleToEdit.plotId);
          if (oldPlot) {
            const remainingCycles = cropCycles.filter(
              (c) => c.plotId === oldPlot.id && c.id !== cropCycleToEdit.id
            );
            const remainingPlantCount = remainingCycles.reduce((sum, c) => sum + (c.plantCount || 0), 0);
            const remainingVarieties = Array.from(new Set(remainingCycles.map((c) => c.variety).filter(Boolean)));
            const updatedOldShapes = (oldPlot.shapes || []).map((sh) => {
              if (sh.id === cropCycleToEdit.facilityId) {
                const remainingForFac = remainingCycles
                  .filter((c) => c.facilityId === sh.id)
                  .reduce((sum, c) => sum + (c.plantCount || 0), 0);
                return { ...sh, plantCount: remainingForFac };
              }
              return sh;
            });
            updatePlot({
              ...oldPlot,
              plantCount: remainingPlantCount,
              melonVarietyEn: remainingVarieties.join(', ') || undefined,
              shapes: updatedOldShapes,
            });
          }
        }
      } else {
        // Add new crop cycles across all facilities to plant
        facilitiesToPlant.forEach((fac, idx) => {
          const cyclePlants = facilitiesToPlant.length === 1 ? numPlantCount : (fac.plantCount || Math.round(numPlantCount / facilitiesToPlant.length));
          const cycleId = idx === 0 ? `cycle-${Date.now()}` : `cycle-${Date.now()}-${idx}`;
          const facBatchNumber = facilitiesToPlant.length === 1 && isBatchCodeManuallyEdited
            ? batchCode
            : generateBatchCode(sowingDate, newPlotName, fac.name, idx);
          const facBatchName = facilitiesToPlant.length === 1 && isBatchNameManuallyEdited
            ? batchName
            : generateBatchName(varietyEn, sowingDate, newPlotName, fac.name, idx);

          const cycleData: CropCycle = {
            id: cycleId,
            name: facBatchName,
            batchNumber: facBatchNumber,
            plotId: newPlotId,
            facilityId: fac.id,
            facilityName: fac.name,
            facilityType: fac.facilityType,
            areaM2: fac.areaM2,
            plantCount: cyclePlants,
            variety: varietyEn,
            sowingDate,
            transplantDate,
            harvestWindowStart: harvestStart,
            harvestWindowEnd: harvestEnd,
            status: cropStatus,
            currentStageKey: effectiveCurrentStageKey,
            stages,
            targetYieldKg: Math.round(targetYieldKg / facilitiesToPlant.length),
            targetYieldTons: Math.round(((targetYieldKg / facilitiesToPlant.length) / 1000) * 10) / 10,
            assignedAgronomist,
          };
          addCropCycle(cycleData);

          if (autoCreateTasks) {
            createAgronomicTasks(cycleId, newPlotId, stages);
          }
        });
      }

      setIsSuccess(true);
      return;
    }

    // -------------------------------------------------------------
    // BRANCH B: PLANT IN EXISTING PLOT
    // -------------------------------------------------------------
      // -------------------------------------------------------------
      // BRANCH B: PLANT IN EXISTING PLOT(S)
      // -------------------------------------------------------------
      if (isEditMode && cropCycleToEdit) {
        const primaryFac = facilitiesToPlant[0] || currentPlotFacilities[0];
        const primaryPlotId = (primaryFac as PlotFacilityItem)?.plotId || assignedPlotId;
        const primaryPlot = plots.find((p) => p.id === primaryPlotId);
        const primaryPlants = facilitiesToPlant.length === 1
          ? numPlantCount
          : (primaryFac?.plantCount || Math.round(numPlantCount / facilitiesToPlant.length));

        const cycleYieldKg = Math.round(targetYieldKg / facilitiesToPlant.length);
        const cycleYieldTons = Math.round((cycleYieldKg / 1000) * 10) / 10;
        const updatedCycle: CropCycle = {
          ...cropCycleToEdit,
          name: facilitiesToPlant.length > 1 ? generateBatchName(varietyEn, sowingDate, primaryPlot?.name, primaryFac?.name, 0) : batchName,
          batchNumber: facilitiesToPlant.length > 1 ? generateBatchCode(sowingDate, primaryPlot?.name, primaryFac?.name, 0) : batchCode,
          plotId: primaryPlotId,
          facilityId: primaryFac?.id,
          facilityName: primaryFac?.name,
          facilityType: primaryFac?.facilityType,
          areaM2: primaryFac?.areaM2,
          plantCount: primaryPlants,
          variety: varietyEn,
          sowingDate,
          transplantDate,
          harvestWindowStart: harvestStart,
          harvestWindowEnd: harvestEnd,
          status: cropStatus,
          stages,
          targetYieldKg: cycleYieldKg,
          targetYieldTons: cycleYieldTons,
          assignedAgronomist,
          currentStageKey: effectiveCurrentStageKey,
        };
        updateCropCycle(updatedCycle);

        // If user selected multiple facilities in existing plot(s), create additional cycles for others
        for (let i = 1; i < facilitiesToPlant.length; i++) {
          const fac = facilitiesToPlant[i];
          const facPlotId = (fac as PlotFacilityItem)?.plotId || assignedPlotId;
          const facPlot = plots.find((p) => p.id === facPlotId);
          const extraPlants = fac.plantCount || Math.round(numPlantCount / facilitiesToPlant.length);
          const extraCycleId = `cycle-${Date.now()}-${i}`;
          const extraCycle: CropCycle = {
            id: extraCycleId,
            name: generateBatchName(varietyEn, sowingDate, facPlot?.name, fac.name, i),
            batchNumber: generateBatchCode(sowingDate, facPlot?.name, fac.name, i),
            plotId: facPlotId,
            facilityId: fac.id,
            facilityName: fac.name,
            facilityType: fac.facilityType,
            areaM2: fac.areaM2,
            plantCount: extraPlants,
            variety: varietyEn,
            sowingDate,
            transplantDate,
            harvestWindowStart: harvestStart,
            harvestWindowEnd: harvestEnd,
            status: cropStatus,
            stages,
            targetYieldKg: cycleYieldKg,
            targetYieldTons: cycleYieldTons,
            assignedAgronomist,
            currentStageKey: effectiveCurrentStageKey,
          };
          addCropCycle(extraCycle);
          if (autoCreateTasks) {
            createAgronomicTasks(extraCycleId, facPlotId, stages);
          }
        }

        // If moved from another plot, update old plot
        if (cropCycleToEdit.plotId && !effectiveSelectedPlots.some((p) => p.id === cropCycleToEdit.plotId)) {
          const oldPlot = plots.find((p) => p.id === cropCycleToEdit.plotId);
          if (oldPlot) {
            const remainingCycles = cropCycles.filter(
              (c) => c.plotId === oldPlot.id && c.id !== cropCycleToEdit.id
            );
            const remainingPlantCount = remainingCycles.reduce((sum, c) => sum + (c.plantCount || 0), 0);
            const remainingVarieties = Array.from(new Set(remainingCycles.map((c) => c.variety).filter(Boolean)));
            const updatedOldShapes = (oldPlot.shapes || []).map((sh) => {
              if (sh.id === cropCycleToEdit.facilityId) {
                const remainingForFac = remainingCycles
                  .filter((c) => c.facilityId === sh.id)
                  .reduce((sum, c) => sum + (c.plantCount || 0), 0);
                return { ...sh, plantCount: remainingForFac };
              }
              return sh;
            });
            updatePlot({
              ...oldPlot,
              plantCount: remainingPlantCount,
              melonVarietyEn: remainingVarieties.join(', ') || undefined,
              shapes: updatedOldShapes,
            });
          }
        }

        // Update all targeted plots metadata
        effectiveSelectedPlots.forEach((targetPlot) => {
          const otherCyclesInPlot = cropCycles.filter(
            (c) => c.plotId === targetPlot.id && c.id !== cropCycleToEdit.id
          );
          const updatedShapes = (targetPlot.shapes || []).map((sh) => {
            const otherInFac = otherCyclesInPlot
              .filter((c) => c.facilityId === sh.id)
              .reduce((sum, c) => sum + (c.plantCount || 0), 0);
            const matchingNew = facilitiesToPlant.find((f) => f.id === sh.id && ((f as PlotFacilityItem)?.plotId === targetPlot.id || !((f as PlotFacilityItem)?.plotId)));
            const newlyAllocated = matchingNew
              ? (facilitiesToPlant.length === 1 ? numPlantCount : (matchingNew.plantCount || Math.round(numPlantCount / facilitiesToPlant.length)))
              : 0;
            return { ...sh, plantCount: otherInFac + newlyAllocated };
          });

          const totalPlantsInPlot = updatedShapes.reduce((sum, s) => sum + (s.plantCount || 0), 0);
          const allVarieties = Array.from(new Set([...otherCyclesInPlot.map((c) => c.variety).filter(Boolean), varietyEn]));

          updatePlot({
            ...targetPlot,
            melonVarietyEn: allVarieties.join(', '),
            plantCount: totalPlantsInPlot,
            shapes: updatedShapes.length > 0 ? updatedShapes : targetPlot.shapes,
            sowingDate,
            transplantingDate: transplantDate,
            expectedHarvestDate: harvestEnd,
            currentStage: effectiveCurrentStageKey,
          });
        });
      } else {
        // Add new crop cycles in existing plot(s) across all facilities to plant
        facilitiesToPlant.forEach((fac, idx) => {
          const facPlotId = (fac as PlotFacilityItem)?.plotId || assignedPlotId;
          const facPlot = plots.find((p) => p.id === facPlotId) || plots[0];
          const cyclePlants = facilitiesToPlant.length === 1 ? numPlantCount : (fac.plantCount || Math.round(numPlantCount / facilitiesToPlant.length));
          const cycleId = idx === 0 ? `cycle-${Date.now()}` : `cycle-${Date.now()}-${idx}`;
          const facBatchNumber = facilitiesToPlant.length === 1 && isBatchCodeManuallyEdited
            ? batchCode
            : generateBatchCode(sowingDate, facPlot?.name, fac.name, idx);
          const facBatchName = facilitiesToPlant.length === 1 && isBatchNameManuallyEdited
            ? batchName
            : generateBatchName(varietyEn, sowingDate, facPlot?.name, fac.name, idx);

          const cycleData: CropCycle = {
            id: cycleId,
            name: facBatchName,
            batchNumber: facBatchNumber,
            plotId: facPlotId,
            facilityId: fac.id,
            facilityName: fac.name,
            facilityType: fac.facilityType,
            areaM2: fac.areaM2,
            plantCount: cyclePlants,
            variety: varietyEn,
            sowingDate,
            transplantDate,
            harvestWindowStart: harvestStart,
            harvestWindowEnd: harvestEnd,
            status: cropStatus,
            currentStageKey: effectiveCurrentStageKey,
            stages,
            targetYieldKg: Math.round(targetYieldKg / facilitiesToPlant.length),
            targetYieldTons: Math.round(((targetYieldKg / facilitiesToPlant.length) / 1000) * 10) / 10,
            assignedAgronomist,
          };
          addCropCycle(cycleData);

          if (autoCreateTasks) {
            createAgronomicTasks(cycleId, facPlotId, stages);
          }
        });

        // Update all targeted plots metadata
        effectiveSelectedPlots.forEach((targetPlot) => {
          const existingCyclesInPlot = cropCycles.filter((c) => c.plotId === targetPlot.id);
          const updatedShapes = (targetPlot.shapes || []).map((sh) => {
            const otherInFac = existingCyclesInPlot
              .filter((c) => c.facilityId === sh.id)
              .reduce((sum, c) => sum + (c.plantCount || 0), 0);
            const matchingNew = facilitiesToPlant.find((f) => f.id === sh.id && ((f as PlotFacilityItem)?.plotId === targetPlot.id || !((f as PlotFacilityItem)?.plotId)));
            const newlyAllocated = matchingNew
              ? (facilitiesToPlant.length === 1 ? numPlantCount : (matchingNew.plantCount || Math.round(numPlantCount / facilitiesToPlant.length)))
              : 0;
            return { ...sh, plantCount: otherInFac + newlyAllocated };
          });

          const totalPlantsInPlot = updatedShapes.reduce((sum, s) => sum + (s.plantCount || 0), 0);
          const allVarieties = Array.from(new Set([...existingCyclesInPlot.map((c) => c.variety).filter(Boolean), varietyEn]));

          updatePlot({
            ...targetPlot,
            melonVarietyEn: allVarieties.join(', '),
            melonVarietyKm: targetPlot.melonVarietyKm ? `${targetPlot.melonVarietyKm}, ${varietyKm}` : varietyKm,
            melonType: selectedPreset.category as any,
            plantCount: totalPlantsInPlot,
            shapes: updatedShapes.length > 0 ? updatedShapes : targetPlot.shapes,
            sowingDate: sowingDate,
            transplantingDate: transplantDate,
            expectedHarvestDate: harvestEnd,
            currentStage: effectiveCurrentStageKey,
          });
        });
      }

    setIsSuccess(true);
  };

  const handleFinishAndNavigate = (targetTab: 'dashboard' | 'field' | 'planting') => {
    setIsSuccess(false);
    onClose();
    setActiveTab(targetTab);
  };

  const modalElement = (
    <div 
      className="fixed inset-0 z-[99999] bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in-50"
      style={{ zIndex: 99999 }}
    >
      <div 
        className="bg-white rounded-3xl w-full max-w-4xl lg:max-w-5xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden m-auto relative"
        style={{ zIndex: 100000 }}
      >
        {/* Modal Header */}
        <div className="px-6 sm:px-8 py-4 sm:py-5 border-b border-slate-100 bg-gradient-to-r from-emerald-50/80 via-slate-50 to-white flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shrink-0">
              {isEditMode ? <Edit3 className="w-5.5 h-5.5" /> : <Sprout className="w-5.5 h-5.5" />}
            </div>

            <div className="text-left">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2.5 flex-wrap">
                <span>{isEditMode ? 'Edit Crop & Planting Batch' : 'Add New Crop & Planting Batch'}</span>
                <span className="text-xs px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-khmer font-bold">
                  {isEditMode ? (language === 'km' ? 'កែសម្រួលដំណាំ' : 'Edit Crop') : (language === 'km' ? 'បន្ថែមដំណាំថ្មី' : 'New Crop')}
                </span>
              </h2>

              <p className="text-xs sm:text-sm text-slate-500 font-khmer mt-1">
                {language === 'km' 
                  ? 'កំណត់ពូជត្រសក់ផ្អែម បង្កើតកាលវិភាគលូតលាស់ និងរៀបចំកិច្ចការថែទាំដំណាំ' 
                  : 'Configure melon cultivar, growth schedule, plot allocation, and auto-generated field tasks'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors shrink-0 cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {isSuccess ? (
          /* Centered Success Screen */
          <div className="p-8 sm:p-10 text-center flex flex-col items-center justify-center space-y-5 my-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-lg animate-bounce">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                {isEditMode 
                  ? (language === 'km' ? 'បានកែសម្រួលដំណាំដោយជោគជ័យ!' : 'Crop Batch Updated Successfully!')
                  : (language === 'km' ? 'បានបន្ថែមដំណាំដោយជោគជ័យ!' : 'New Crop Batch Added Successfully!')}
              </h3>
              <p className="text-sm text-slate-600 mt-1.5 max-w-lg mx-auto leading-relaxed">
                <strong className="text-slate-900 font-bold">{batchName}</strong> ({varietyEn}) {language === 'km' ? 'ត្រូវបានកំណត់រួចរាល់ និងបញ្ចូលទៅក្នុងប្រតិទិនការងារ។' : 'has been synchronized with the growth timeline, plot allocation, and farming calendar.'}
              </p>
            </div>

            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 text-left w-full max-w-lg space-y-2.5 text-sm mx-auto">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Cultivar / ពូជ:</span>
                <span className="font-bold text-slate-900">{varietyEn}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Total Cycle / វដ្តសរុប:</span>
                <span className="font-bold text-emerald-800 font-mono">{totalDays} Days ({sowingDate} → {getHarvestEndDate()})</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Target Sweetness / ជាតិផ្អែម:</span>
                <span className="font-bold text-amber-600 font-mono">{selectedPreset.targetBrix}° Brix</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Target Yield / ទិន្នផល:</span>
                <span className="font-bold text-slate-900 font-mono">
                  {targetYieldKg.toLocaleString()} kg
                  <span className="text-xs text-slate-500 font-normal ml-1.5">
                    ({((targetYieldKg || 0) / 1000).toFixed(2)} tons)
                  </span>
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
              <button
                onClick={() => handleFinishAndNavigate('dashboard')}
                className="px-6 py-2.5 bg-[#164e22] hover:bg-[#123e1b] text-white rounded-xl text-sm font-bold shadow-xs transition-colors cursor-pointer"
              >
                {language === 'km' ? 'មើលលើផ្ទាំងគ្រប់គ្រង' : 'View on Dashboard'}
              </button>
              <button
                onClick={() => handleFinishAndNavigate('planting')}
                className="px-6 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 rounded-xl text-sm font-bold shadow-xs transition-colors cursor-pointer"
              >
                {language === 'km' ? 'មើលផែនការដាំដុះ' : 'View Planting Plans'}
              </button>
              <button
                onClick={() => handleFinishAndNavigate('field')}
                className="px-6 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 rounded-xl text-sm font-bold shadow-xs transition-colors cursor-pointer"
              >
                {language === 'km' ? 'មើលលើផែនទី' : 'View on Field Map'}
              </button>
            </div>
          </div>
        ) : (
          /* Form with Frozen Footer & Scrollable Content */
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-7">
              <div className="w-full text-left space-y-6">
                {/* Step 1: Cultivar & Variety Presets */}
                <div>
                  <div className="flex items-center gap-2.5 mb-3.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                      <Sprout className="w-4 h-4" />
                    </div>
                    <span className="text-sm sm:text-base font-extrabold text-slate-900 uppercase tracking-wide">
                      1. Select Cultivar / <span className="font-khmer font-bold">ជ្រើសរើសពូជ</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {availableVarieties.map((preset) => {
                  const isSelected = selectedPreset.id === preset.id;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => handleSelectPreset(preset)}
                      className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between text-left ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/60 shadow-xs ring-1 ring-emerald-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1.5 mb-1">
                          <span className="font-bold text-sm sm:text-base text-slate-900 leading-tight">
                            {preset.nameEn}
                          </span>
                          <span
                            className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs border border-white"
                            style={{ backgroundColor: preset.color }}
                          />
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 font-khmer line-clamp-1">
                          {preset.nameKm}
                        </p>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-mono text-slate-600">
                        <span className="bg-emerald-100/70 text-emerald-800 px-2 py-0.5 rounded-md font-bold">
                          {preset.daysToMaturity}d cycle
                        </span>
                        <span className="bg-amber-100/70 text-amber-800 px-2 py-0.5 rounded-md font-bold">
                          {preset.targetBrix}° Brix
                        </span>
                      </div>

                      <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span className="font-semibold text-emerald-700">7 Stages</span>
                        <span>Seed: {preset.seedlingDays || 7}d · Har: {preset.harvestDays || 10}d</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Batch Information & Plot Allocation */}
            <div className="pt-6 border-t border-slate-200/80">
              <div className="flex items-center justify-between gap-2.5 mb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <span className="text-sm sm:text-base font-extrabold text-slate-900 uppercase tracking-wide">
                    2. Batch Name & Plot Allocation / <span className="font-khmer font-bold">បាច់ដាំ និងទីតាំងរងដាំ</span>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsBatchNameManuallyEdited(false);
                    setIsBatchCodeManuallyEdited(false);
                    const targetPlotName = plotChoice === 'new' ? newPlotName : (currentPlot?.name || 'Plot A');
                    const targetFacName = plotChoice === 'new' ? (newPlotFacilities[0]?.name || 'Net House 1') : (selectedFacility?.name || 'Net House 1');
                    setBatchName(generateBatchName(varietyEn, sowingDate, targetPlotName, targetFacName));
                    setBatchCode(generateBatchCode(sowingDate, targetPlotName, targetFacName));
                  }}
                  className="px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 rounded-lg border border-emerald-200/80 transition-colors flex items-center gap-1.5 shadow-2xs"
                  title="Auto-format according to Cultivar_name-Sowing_Date-plot_namexx"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Auto-Format</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5 text-left">
                    Batch Name / <span className="font-khmer">ឈ្មោះបាច់</span> *
                  </label>
                  <input
                    type="text"
                    required
                    value={batchName}
                    placeholder="Mel 2777-20260920-A01"
                    onChange={(e) => {
                      setBatchName(e.target.value);
                      setIsBatchNameManuallyEdited(true);
                    }}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-left focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 font-medium"
                  />
                  <p className="mt-1 text-[11px] text-slate-500 font-mono">
                    Format: <span className="text-emerald-700 font-semibold">Cultivar_name-Sowing_Date-plot_namexx</span>
                  </p>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5 text-left">
                    Batch Code / <span className="font-khmer">កូដបាច់</span> *
                  </label>
                  <input
                    type="text"
                    required
                    value={batchCode}
                    placeholder="20260920-A01"
                    onChange={(e) => {
                      setBatchCode(e.target.value);
                      setIsBatchCodeManuallyEdited(true);
                    }}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white font-mono text-left focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 font-bold"
                  />
                  <p className="mt-1 text-[11px] text-slate-500 font-mono">
                    Format: <span className="text-emerald-700 font-semibold">sowing_date-plot_namexx</span>
                  </p>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5 text-left">
                    Batch Status / <span className="font-khmer">ស្ថានភាព</span> *
                  </label>
                  <select
                    value={cropStatus}
                    onChange={(e) => setCropStatus(e.target.value as any)}
                    className={`w-full px-3.5 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold ${
                      cropStatus === 'completed'
                        ? 'border-slate-300 bg-slate-50 text-slate-800'
                        : 'border-slate-200 bg-slate-50/50 text-slate-800'
                    }`}
                  >
                    <option value="active">● Active / កំពុងដាំ (Active)</option>
                    <option value="planned">○ Planned / គ្រោងដាំ (Planned)</option>
                    <option value="completed">✓ Completed / បានប្រមូលផល (Completed)</option>
                  </select>
                </div>
              </div>

              {/* Plot Choice: Existing Plot vs New Plot */}
              <div className="mt-4 p-4 sm:p-4.5 rounded-2xl border border-slate-200/80 bg-slate-50/60 space-y-3.5 text-left">
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2.5 text-sm font-bold text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="plotChoice"
                      checked={plotChoice === 'existing'}
                      onChange={() => setPlotChoice('existing')}
                      className="accent-emerald-600 w-4.5 h-4.5"
                    />
                    <span>{language === 'km' ? 'ដាំលើរងដែលមានស្រាប់' : 'Plant in Existing Plot'}</span>
                  </label>

                  <label className="flex items-center gap-2.5 text-sm font-bold text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="plotChoice"
                      checked={plotChoice === 'new'}
                      onChange={() => setPlotChoice('new')}
                      className="accent-emerald-600 w-4.5 h-4.5"
                    />
                    <span>{language === 'km' ? 'បង្កើតរងដាំថ្មី' : 'Create New Plot'}</span>
                  </label>
                </div>

                {plotChoice === 'existing' ? (
                  <div className="space-y-4">
                    {/* 1. Target Plot Selection (Dropdown Multiple Select with Option Checkbox) */}
                    <div className="relative" ref={plotDropdownRef}>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs sm:text-sm font-bold text-slate-700 text-left flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-emerald-700" />
                          <span>{language === 'km' ? 'ជ្រើសរើសរងដាំ (Select Target Plot):' : 'Select Target Plot:'}</span>
                        </label>
                        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full font-mono">
                          {effectiveSelectedPlots.length} {language === 'km' ? 'រងបានជ្រើស' : 'plot(s) selected'}
                        </span>
                      </div>

                      {/* Dropdown Trigger Button */}
                      <button
                        type="button"
                        onClick={() => setIsPlotDropdownOpen((prev) => !prev)}
                        className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border transition-all bg-white font-semibold text-slate-800 outline-none text-left flex items-center justify-between gap-2 cursor-pointer shadow-2xs ${
                          isPlotDropdownOpen
                            ? 'border-emerald-600 ring-2 ring-emerald-500/20'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                            <Layers className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0 flex-1 truncate">
                            {effectiveSelectedPlots.length === 1 ? (
                              <span className="truncate block font-bold text-slate-900">
                                {effectiveSelectedPlots[0].name} ({effectiveSelectedPlots[0].code}) —{' '}
                                <span className="font-mono text-emerald-700 font-semibold">
                                  {getPlotTotals(effectiveSelectedPlots[0]).totalAreaM2.toLocaleString()} m²
                                </span>{' '}
                                · {getPlotFacilities(effectiveSelectedPlots[0]).length}{' '}
                                {language === 'km' ? 'សំណង់' : 'facilities'}
                              </span>
                            ) : (
                              <span className="truncate block font-bold text-slate-900">
                                <span className="text-emerald-800 font-black">
                                  {effectiveSelectedPlots.length} {language === 'km' ? 'រងដាំបានជ្រើស:' : 'Plots Selected:'}{' '}
                                </span>
                                {effectiveSelectedPlots.map((p) => p.name).join(', ')}{' '}
                                <span className="font-mono text-slate-500 font-normal">
                                  ({currentPlotFacilities.length} {language === 'km' ? 'សំណង់សរុប' : 'facilities'})
                                </span>
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            {effectiveSelectedPlots.length}/{plots.length}
                          </span>
                          <ChevronDown
                            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                              isPlotDropdownOpen ? 'rotate-180 text-emerald-700' : ''
                            }`}
                          />
                        </div>
                      </button>

                      {/* Dropdown Menu Popover */}
                      {isPlotDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                          {/* Dropdown Header with Quick Actions */}
                          <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-700 flex items-center gap-1.5">
                              <CheckSquare className="w-3.5 h-3.5 text-emerald-700" />
                              <span>{language === 'km' ? 'ជ្រើសរើសរងដាំ (អាចជ្រើសច្រើន)' : 'Select Target Plots (Multiple)'}</span>
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={handleSelectAllPlots}
                                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer"
                              >
                                {language === 'km' ? 'ជ្រើសទាំងអស់' : 'Select All'}
                              </button>
                              <span className="text-slate-300">|</span>
                              <button
                                type="button"
                                onClick={() => handleSelectOnlyPlot(plots[0]?.id || '')}
                                className="text-[11px] font-medium text-slate-500 hover:text-slate-700 hover:underline cursor-pointer"
                              >
                                {language === 'km' ? 'ជ្រើសរងដំបូង' : 'First Plot'}
                              </button>
                            </div>
                          </div>

                          {/* Options List with Checkboxes */}
                          <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 p-1">
                            {plots.map((p) => {
                              const isChecked = selectedPlotIds.includes(p.id);
                              const pTotals = getPlotTotals(p);
                              const pFacs = getPlotFacilities(p);
                              const netCount = pFacs.filter((f) => f.facilityType === 'net_house').length;
                              const openCount = pFacs.filter((f) => f.facilityType === 'open_field').length;

                              return (
                                <div
                                  key={p.id}
                                  onClick={() => handleTogglePlot(p.id)}
                                  className={`p-2.5 rounded-xl transition-all flex items-center justify-between gap-3 cursor-pointer ${
                                    isChecked
                                      ? 'bg-emerald-50/70 text-slate-900 font-semibold'
                                      : 'hover:bg-slate-50 text-slate-700'
                                  }`}
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {}} // Controlled by row container
                                      className="w-4.5 h-4.5 accent-emerald-600 rounded cursor-pointer shrink-0"
                                    />
                                    <span
                                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs border border-white"
                                      style={{ backgroundColor: p.color || '#15803D' }}
                                    />
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs sm:text-sm font-extrabold text-slate-900">
                                          {p.name}
                                        </span>
                                        <span className="text-[11px] font-mono font-medium text-slate-500">
                                          ({p.code})
                                        </span>
                                      </div>
                                      <div className="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap mt-0.5">
                                        <span className="font-mono">{pTotals.totalAreaM2.toLocaleString()} m² ({p.areaHa}{language === 'km' ? 'ហិចតា' : 'ha'})</span>
                                        <span>·</span>
                                        <span>
                                          {netCount > 0 && `${netCount} Net House${netCount > 1 ? 's' : ''}`}
                                          {netCount > 0 && openCount > 0 && ', '}
                                          {openCount > 0 && `${openCount} Open Field${openCount > 1 ? 's' : ''}`}
                                          {netCount === 0 && openCount === 0 && `${pFacs.length} facilities`}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="text-right shrink-0">
                                    <span className="font-mono text-xs font-bold text-emerald-800 block">
                                      {pTotals.totalPlantCount.toLocaleString()} {language === 'km' ? 'ដើម' : 'plants'}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      {pFacs.length} {language === 'km' ? 'សំណង់' : 'facilities'}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 2. Facilities Based on Selected Plots (Net Houses & Open Fields) */}
                    <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3.5">
                      {/* Facilities Section Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                            <Warehouse className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs sm:text-sm font-extrabold text-slate-900">
                                {effectiveSelectedPlots.length === 1
                                  ? (language === 'km' ? `សំណង់ផ្ទះសំណាញ់ & ចំការវាលក្នុង ${effectiveSelectedPlots[0].name}` : `Net Houses & Open Fields in ${effectiveSelectedPlots[0].name}`)
                                  : (language === 'km' ? `សំណង់ក្នុងរងដែលបានជ្រើស (${effectiveSelectedPlots.length} រង)` : `Net Houses & Open Fields in Selected Plots (${effectiveSelectedPlots.length} Plots)`)}
                              </span>
                              <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                                {currentPlotFacilities.length} {language === 'km' ? 'សំណង់សរុប' : 'facilities'}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500 font-khmer block mt-0.5">
                              {language === 'km'
                                ? 'ជ្រើសរើសសំណង់ដែលត្រូវដាំ (អាចជ្រើសមួយ ឬច្រើនរង/សំណង់) ឬកែប្រែ/លុបសំណង់:'
                                : 'Select facilities for planting (supports multi-plot & multi-facility allocation):'}
                            </span>
                          </div>
                        </div>

                        {/* Top Action Bar */}
                        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                          {currentPlotFacilities.length > 1 && (
                            <div className="flex items-center gap-1.5 text-xs mr-1">
                              <button
                                type="button"
                                onClick={() => handleSelectAllFacilities('existing')}
                                className="text-emerald-700 hover:text-emerald-900 font-bold hover:underline text-[11px] cursor-pointer"
                              >
                                {language === 'km' ? 'ជ្រើសទាំងអស់' : 'Select All'}
                              </button>
                              <span className="text-slate-300">|</span>
                              <button
                                type="button"
                                onClick={() => handleSelectOnlyFacility(currentPlotFacilities[0]?.id || '')}
                                className="text-slate-500 hover:text-slate-700 font-medium hover:underline text-[11px] cursor-pointer"
                              >
                                {language === 'km' ? 'ជ្រើសតែមួយ' : 'Single'}
                              </button>
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenAddFacility('existing', effectiveSelectedPlots[0]?.id)}
                            className="px-3.5 py-1.5 bg-[#164e22] hover:bg-[#123e1b] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>{language === 'km' ? '+ បន្ថែមសំណង់' : '+ Add Facility'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Facilities Display: Grouped by Plot if multiple plots, or direct list if single plot */}
                      {effectiveSelectedPlots.length === 1 ? (
                        /* Single Plot: Direct List */
                        <div className="space-y-2 pt-1">
                          {currentPlotFacilities.map((fac) => {
                            const isSelected = selectedFacilityIds.includes(fac.id);
                            const isNet = fac.facilityType === 'net_house';
                            const areaM2 = fac.areaM2 || Math.round((fac.areaHa || 0.5) * 10000);
                            const plants = fac.plantCount || 0;
                            const facCycles = cropCycles.filter(
                              (c) => c.plotId === fac.plotId && c.facilityId === fac.id && (!isEditMode || c.id !== cropCycleToEdit?.id)
                            );

                            return (
                              <div
                                key={fac.id}
                                onClick={() => handleToggleFacilitySelection(fac.id)}
                                className={`p-3 rounded-xl border-2 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-left cursor-pointer ${
                                  isSelected
                                    ? 'border-emerald-600 bg-emerald-50/70 shadow-xs ring-1 ring-emerald-500/20'
                                    : 'border-slate-200 hover:border-slate-300 bg-white'
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {}} // Controlled by container onClick
                                    className="w-4.5 h-4.5 accent-emerald-600 rounded cursor-pointer shrink-0"
                                  />

                                  <span
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border shrink-0 ${
                                      isNet
                                        ? 'bg-emerald-100/80 text-emerald-800 border-emerald-300'
                                        : 'bg-amber-100/80 text-amber-800 border-amber-300'
                                    }`}
                                  >
                                    {isNet ? (
                                      <Warehouse className="w-3.5 h-3.5 text-emerald-700" />
                                    ) : (
                                      <Trees className="w-3.5 h-3.5 text-amber-700" />
                                    )}
                                    <span>{isNet ? 'Net House' : 'Open Field'}</span>
                                  </span>

                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                                        {fac.name}
                                      </span>
                                      <span
                                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs border border-white"
                                        style={{ backgroundColor: fac.color || (isNet ? '#15803D' : '#D97706') }}
                                      />
                                    </div>
                                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                                      <span className="font-mono font-medium">{areaM2.toLocaleString()} m²</span>
                                      <span>·</span>
                                      <span className="font-mono font-bold text-emerald-700">{plants.toLocaleString()} {language === 'km' ? 'ដើម' : 'plants'}</span>
                                      {facCycles.length > 0 && (
                                        <span className="text-amber-800 bg-amber-100/70 px-1.5 py-0.2 rounded text-[10px] font-semibold">
                                          {facCycles.length} active batch{facCycles.length > 1 ? 'es' : ''}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Card Actions: Edit & Delete buttons */}
                                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenEditFacility(fac, 'existing', fac.plotId);
                                    }}
                                    className="px-2.5 py-1 text-xs font-bold text-slate-600 hover:text-emerald-800 bg-slate-100 hover:bg-emerald-100/70 border border-slate-200 hover:border-emerald-300 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                                    title="Edit facility details / កែប្រែព័ត៌មានសំណង់"
                                  >
                                    <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                                    <span>{language === 'km' ? 'កែប្រែ' : 'Edit'}</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setFacilityToDelete({ id: fac.id, name: fac.name, scope: 'existing', plotId: fac.plotId });
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-lg transition-all cursor-pointer"
                                    title="Delete facility / លុបសំណង់"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        /* Multiple Plots: Grouped by Plot */
                        <div className="space-y-4 pt-1">
                          {effectiveSelectedPlots.map((plot) => {
                            const plotFacs = currentPlotFacilities.filter((f) => f.plotId === plot.id);
                            const plotTotals = getPlotTotals(plot);

                            return (
                              <div
                                key={plot.id}
                                className="rounded-2xl border border-slate-200 bg-slate-50/40 p-3 sm:p-3.5 space-y-2.5"
                              >
                                {/* Plot Section Sub-Header */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/80">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="w-3 h-3 rounded-full shrink-0 shadow-2xs border border-white"
                                      style={{ backgroundColor: plot.color || '#15803D' }}
                                    />
                                    <span className="font-extrabold text-xs sm:text-sm text-slate-900">
                                      {plot.name} ({plot.code})
                                    </span>
                                    <span className="text-[11px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                                      {plotTotals.totalAreaM2.toLocaleString()} m² · {plotFacs.length} {language === 'km' ? 'សំណង់' : 'fac.'}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2 self-start sm:self-auto">
                                    {plotFacs.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => handleSelectAllFacilities('existing', plot.id)}
                                        className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer"
                                      >
                                        {language === 'km' ? `ជ្រើសទាំងអស់ (${plot.name})` : `Select All in ${plot.name}`}
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleOpenAddFacility('existing', plot.id)}
                                      className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                                    >
                                      <Plus className="w-3 h-3 text-emerald-600" />
                                      <span>{language === 'km' ? `+ បន្ថែមសំណង់ក្នុង ${plot.name}` : `+ Add to ${plot.name}`}</span>
                                    </button>
                                  </div>
                                </div>

                                {/* Facilities List inside this Plot */}
                                <div className="space-y-2">
                                  {plotFacs.map((fac) => {
                                    const isSelected = selectedFacilityIds.includes(fac.id);
                                    const isNet = fac.facilityType === 'net_house';
                                    const areaM2 = fac.areaM2 || Math.round((fac.areaHa || 0.5) * 10000);
                                    const plants = fac.plantCount || 0;
                                    const facCycles = cropCycles.filter(
                                      (c) => c.plotId === fac.plotId && c.facilityId === fac.id && (!isEditMode || c.id !== cropCycleToEdit?.id)
                                    );

                                    return (
                                      <div
                                        key={fac.id}
                                        onClick={() => handleToggleFacilitySelection(fac.id)}
                                        className={`p-2.5 sm:p-3 rounded-xl border-2 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-left cursor-pointer ${
                                          isSelected
                                            ? 'border-emerald-600 bg-white shadow-xs ring-1 ring-emerald-500/20'
                                            : 'border-slate-200 hover:border-slate-300 bg-white/70'
                                        }`}
                                      >
                                        <div className="flex items-center gap-3 min-w-0">
                                          <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => {}} // Controlled by container onClick
                                            className="w-4.5 h-4.5 accent-emerald-600 rounded cursor-pointer shrink-0"
                                          />

                                          <span
                                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border shrink-0 ${
                                              isNet
                                                ? 'bg-emerald-100/80 text-emerald-800 border-emerald-300'
                                                : 'bg-amber-100/80 text-amber-800 border-amber-300'
                                            }`}
                                          >
                                            {isNet ? (
                                              <Warehouse className="w-3.5 h-3.5 text-emerald-700" />
                                            ) : (
                                              <Trees className="w-3.5 h-3.5 text-amber-700" />
                                            )}
                                            <span>{isNet ? 'Net House' : 'Open Field'}</span>
                                          </span>

                                          <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                              <span className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                                                {fac.name}
                                              </span>
                                              <span
                                                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs border border-white"
                                                style={{ backgroundColor: fac.color || (isNet ? '#15803D' : '#D97706') }}
                                              />
                                            </div>
                                            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                                              <span className="font-mono font-medium">{areaM2.toLocaleString()} m²</span>
                                              <span>·</span>
                                              <span className="font-mono font-bold text-emerald-700">{plants.toLocaleString()} {language === 'km' ? 'ដើម' : 'plants'}</span>
                                              {facCycles.length > 0 && (
                                                <span className="text-amber-800 bg-amber-100/70 px-1.5 py-0.2 rounded text-[10px] font-semibold">
                                                  {facCycles.length} active batch{facCycles.length > 1 ? 'es' : ''}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        </div>

                                        {/* Card Actions: Edit & Delete buttons */}
                                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleOpenEditFacility(fac, 'existing', fac.plotId);
                                            }}
                                            className="px-2.5 py-1 text-xs font-bold text-slate-600 hover:text-emerald-800 bg-slate-100 hover:bg-emerald-100/70 border border-slate-200 hover:border-emerald-300 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                                            title="Edit facility details / កែប្រែព័ត៌មានសំណង់"
                                          >
                                            <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                                            <span>{language === 'km' ? 'កែប្រែ' : 'Edit'}</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setFacilityToDelete({ id: fac.id, name: fac.name, scope: 'existing', plotId: fac.plotId });
                                            }}
                                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-lg transition-all cursor-pointer"
                                            title="Delete facility / លុបសំណង់"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Multi-facility Selection Summary */}
                      {selectedFacilityIds.length > 0 && (
                        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/90 text-xs flex flex-wrap items-center justify-between gap-2 font-semibold text-emerald-950">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                            <span>
                              {language === 'km' 
                                ? `បានជ្រើស ${selectedFacilityIds.length} សំណង់ក្នុង ${effectiveSelectedPlots.filter(p => getPlotFacilities(p).some(f => selectedFacilityIds.includes(f.id))).length} រងសម្រាប់ដាំដុះ ${selectedFacilityIds.length > 1 ? '(គាំទ្រការបែងចែកដាំច្រើនសំណង់/រង)' : ''}` 
                                : `Planting allocated to ${selectedFacilityIds.length} facility${selectedFacilityIds.length > 1 ? 'ies' : ''} across ${effectiveSelectedPlots.filter(p => getPlotFacilities(p).some(f => selectedFacilityIds.includes(f.id))).length} plot(s)`}
                            </span>
                          </span>
                          <span className="font-mono text-emerald-800 bg-white px-2 py-0.5 rounded-md border border-emerald-300">
                            {currentPlotFacilities.filter(f => selectedFacilityIds.includes(f.id)).reduce((sum, f) => sum + (f.plantCount || 0), 0).toLocaleString()} plants capacity
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Existing active plantings in selected plots */}
                    {(() => {
                      const otherActiveCycles = cropCycles.filter(
                        (c) => selectedPlotIds.includes(c.plotId) && (!isEditMode || c.id !== cropCycleToEdit?.id)
                      );
                      if (otherActiveCycles.length === 0) return null;
                      const existingPlantsSum = otherActiveCycles.reduce((sum, c) => sum + (c.plantCount || 0), 0);
                      const combinedTotalPlants = existingPlantsSum + (Number(plantCount) || 0);

                      return (
                        <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/90 text-xs space-y-2">
                          <div className="flex items-center justify-between font-bold text-emerald-950">
                            <span className="flex items-center gap-1.5">
                              <Sprout className="w-4 h-4 text-emerald-700 shrink-0" />
                              <span>
                                {language === 'km' 
                                  ? `ដំណាំដែលមានស្រាប់ក្នុងរងដែលបានជ្រើស (${otherActiveCycles.length} បាច់ដាំ)` 
                                  : `Existing Active Plantings in Selected Plot(s) (${otherActiveCycles.length} batch${otherActiveCycles.length > 1 ? 'es' : ''})`}
                              </span>
                            </span>
                            <span className="font-mono text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-md text-[11px] font-bold border border-emerald-300">
                              {existingPlantsSum.toLocaleString()} existing plants
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                            {otherActiveCycles.map((c) => {
                              const parentPlot = plots.find((p) => p.id === c.plotId);
                              return (
                                <span
                                  key={c.id}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-emerald-200 text-slate-700 text-[11px] font-medium shadow-2xs"
                                >
                                  <span className="font-bold text-emerald-800">{c.batchNumber}</span>
                                  {parentPlot && <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono">[{parentPlot.name}]</span>}
                                  <span>· {c.variety}</span>
                                  <span className="font-mono text-slate-500">({(c.plantCount || 0).toLocaleString()} plants)</span>
                                </span>
                              );
                            })}
                          </div>

                          <div className="pt-1.5 border-t border-emerald-200/70 flex items-center justify-between text-[11px] text-emerald-800 font-semibold">
                            <span>
                              {language === 'km'
                                ? '✓ គាំទ្រការដាំដំណាំច្រើនក្នុងរងតែមួយ (ដំណាំដែលមានស្រាប់ត្រូវបានរក្សាទុក)'
                                : '✓ Multiple plantings supported: Existing batches remain active without overwrite'}
                            </span>
                            <span className="font-mono font-bold text-slate-800">
                              Total: {combinedTotalPlants.toLocaleString()} plants
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  /* ========================================================= */
                  /* CREATE NEW PLOT SECTION (WITH MULTIPLE FACILITIES)         */
                  /* ========================================================= */
                  <div className="space-y-4 pt-1 text-left">
                    {/* Plot Name & Computed Totals */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1 text-left">
                          {language === 'km' ? 'ឈ្មោះរងដាំថ្មី (Plot Name) *' : 'New Plot Name *'}
                        </label>
                        <input
                          type="text"
                          required
                          value={newPlotName}
                          onChange={(e) => setNewPlotName(e.target.value)}
                          placeholder="Plot H"
                          className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <span className="block text-xs font-bold text-slate-700 mb-1 text-left">
                          {language === 'km' ? 'ផ្ទៃដីសរុបនៃរង (Total Area)' : 'Total Plot Area'}
                        </span>
                        <div className="px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-slate-900 flex items-center justify-between">
                          <span>{newPlotTotalAreaM2.toLocaleString()} m²</span>
                          <span className="text-[11px] text-slate-500 font-normal">≈ {newPlotTotalAreaHa} ha</span>
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          {language === 'km' ? 'គណនាស្វ័យប្រវត្តពីសំណង់ទាំងអស់' : 'Auto-summed from all facilities'}
                        </span>
                      </div>

                      <div>
                        <span className="block text-xs font-bold text-slate-700 mb-1 text-left">
                          {language === 'km' ? 'សមត្ថភាពដើមដាំសរុប (Capacity)' : 'Total Plant Population'}
                        </span>
                        <div className="px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-emerald-800 flex items-center justify-between">
                          <span>{newPlotTotalPlantCount.toLocaleString()} {language === 'km' ? 'ដើម' : 'plants'}</span>
                          <span className="text-[11px] text-emerald-700 font-normal">{newPlotFacilities.length} {language === 'km' ? 'សំណង់' : 'fac.'}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          {language === 'km' ? 'បូកបញ្ចូលពីសំណង់ទាំងអស់' : 'Sum of facility populations'}
                        </span>
                      </div>
                    </div>

                    {/* Facilities in New Plot with + Add Facility Button */}
                    <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                            <Warehouse className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs sm:text-sm font-extrabold text-slate-900">
                                {language === 'km' ? 'សំណង់ផ្ទះសំណាញ់ & ចំការវាលក្នុងរងថ្មី' : 'Facilities in New Plot (Net Houses & Open Fields)'}
                              </span>
                              <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                                {newPlotFacilities.length} {language === 'km' ? 'សំណង់' : 'facilities'}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500 font-khmer block mt-0.5">
                              {language === 'km' ? 'កំណត់សំណង់សម្រាប់រងថ្មីនេះ និងជ្រើសរើសសំណង់ដែលត្រូវដាំ:' : 'Define facilities for this new plot and choose which to plant in:'}
                            </span>
                          </div>
                        </div>

                        {/* + Add Facility Button */}
                        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                          {newPlotFacilities.length > 1 && (
                            <div className="flex items-center gap-1.5 text-xs mr-1">
                              <button
                                type="button"
                                onClick={() => handleSelectAllFacilities('new')}
                                className="text-emerald-700 hover:text-emerald-900 font-bold hover:underline text-[11px] cursor-pointer"
                              >
                                {language === 'km' ? 'ជ្រើសទាំងអស់' : 'Select All'}
                              </button>
                              <span className="text-slate-300">|</span>
                              <button
                                type="button"
                                onClick={() => handleSelectOnlyFacility(newPlotFacilities[0]?.id || '')}
                                className="text-slate-500 hover:text-slate-700 font-medium hover:underline text-[11px] cursor-pointer"
                              >
                                {language === 'km' ? 'ជ្រើសតែមួយ' : 'Single'}
                              </button>
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenAddFacility('new')}
                            className="px-3.5 py-1.5 bg-[#164e22] hover:bg-[#123e1b] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>{language === 'km' ? '+ បន្ថែមសំណង់' : '+ Add Facility'}</span>
                          </button>
                        </div>
                      </div>

                      {/* New Plot Facilities Cards List */}
                      <div className="space-y-2 pt-1">
                        {newPlotFacilities.map((fac) => {
                          const isSelected = selectedFacilityIds.includes(fac.id);
                          const isNet = fac.facilityType === 'net_house';
                          const areaM2 = fac.areaM2 || Math.round((fac.areaHa || 0.5) * 10000);
                          const plants = fac.plantCount || 0;

                          return (
                            <div
                              key={fac.id}
                              onClick={() => handleToggleFacilitySelection(fac.id)}
                              className={`p-3 rounded-xl border-2 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-left cursor-pointer ${
                                isSelected
                                  ? 'border-emerald-600 bg-emerald-50/70 shadow-xs ring-1 ring-emerald-500/20'
                                  : 'border-slate-200 hover:border-slate-300 bg-white'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {}} // Controlled by container onClick
                                  className="w-4.5 h-4.5 accent-emerald-600 rounded cursor-pointer shrink-0"
                                />

                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border shrink-0 ${
                                    isNet
                                      ? 'bg-emerald-100/80 text-emerald-800 border-emerald-300'
                                      : 'bg-amber-100/80 text-amber-800 border-amber-300'
                                  }`}
                                >
                                  {isNet ? (
                                    <Warehouse className="w-3.5 h-3.5 text-emerald-700" />
                                  ) : (
                                    <Trees className="w-3.5 h-3.5 text-amber-700" />
                                  )}
                                  <span>{isNet ? 'Net House' : 'Open Field'}</span>
                                </span>

                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                                      {fac.name}
                                    </span>
                                    <span
                                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs border border-white"
                                      style={{ backgroundColor: fac.color || (isNet ? '#15803D' : '#D97706') }}
                                    />
                                  </div>
                                  <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                                    <span className="font-mono font-medium">{areaM2.toLocaleString()} m²</span>
                                    <span>·</span>
                                    <span className="font-mono font-bold text-emerald-700">{plants.toLocaleString()} {language === 'km' ? 'ដើម' : 'plants'}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Card Actions: Edit & Delete buttons */}
                              <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenEditFacility(fac, 'new');
                                  }}
                                  className="px-2.5 py-1 text-xs font-bold text-slate-600 hover:text-emerald-800 bg-slate-100 hover:bg-emerald-100/70 border border-slate-200 hover:border-emerald-300 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                                  title="Edit facility details / កែប្រែព័ត៌មានសំណង់"
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                                  <span>{language === 'km' ? 'កែប្រែ' : 'Edit'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFacilityToDelete({ id: fac.id, name: fac.name, scope: 'new' });
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-lg transition-all cursor-pointer"
                                  title="Delete facility / លុបសំណង់"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Multi-facility Selection Summary */}
                      {selectedFacilityIds.length > 0 && (
                        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/90 text-xs flex flex-wrap items-center justify-between gap-2 font-semibold text-emerald-950">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                            <span>
                              {language === 'km' 
                                ? `បានជ្រើស ${selectedFacilityIds.length} សំណង់សម្រាប់ដាំដុះក្នុងរងថ្មី` 
                                : `Planting allocated to ${selectedFacilityIds.length} facility${selectedFacilityIds.length > 1 ? 'ies' : ''} in new plot`}
                            </span>
                          </span>
                          <span className="font-mono text-emerald-800 bg-white px-2 py-0.5 rounded-md border border-emerald-300">
                            {newPlotFacilities.filter(f => selectedFacilityIds.includes(f.id)).reduce((sum, f) => sum + (f.plantCount || 0), 0).toLocaleString()} plants total
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Step 3: Dates & Growth Timeline Schedule */}
            <div className="pt-6 border-t border-slate-200/80">
              <div className="flex items-center gap-2.5 mb-3.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <span className="text-sm sm:text-base font-extrabold text-slate-900 uppercase tracking-wide">
                  3. Sowing Date & Stage Durations / <span className="font-khmer font-bold">កាលវិភាគដំណាក់កាល</span>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5 gap-2 flex-wrap">
                    <label className="block text-xs sm:text-sm font-bold text-slate-700 text-left">
                      Sowing Date / <span className="font-khmer">ថ្ងៃសាបគ្រាប់</span> *
                    </label>
                    <div className="flex items-center gap-1.5">
                      {/* Back-date offset badge */}
                      {(() => {
                        const offset = getSowingDateOffset();
                        if (offset === null || offset === 0) {
                          return (
                            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5 text-emerald-700" />
                              <span>{language === 'km' ? 'ថ្ងៃនេះ' : 'Today'}</span>
                            </span>
                          );
                        }
                        if (offset > 0) {
                          return (
                            <span className="text-[11px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <span>🕒</span>
                              <span>{language === 'km' ? `ថយក្រោយ ${offset} ថ្ងៃ` : `Back-dated ${offset}d ago`}</span>
                            </span>
                          );
                        }
                        return (
                          <span className="text-[11px] font-bold text-blue-800 bg-blue-100 border border-blue-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <span>📅</span>
                            <span>{language === 'km' ? `ទៅមុខ ${Math.abs(offset)} ថ្ងៃ` : `+${Math.abs(offset)}d future`}</span>
                          </span>
                        );
                      })()}
                      <button
                        type="button"
                        onClick={() => handleSowingDateChange(getTodayDateString())}
                        className="text-xs font-bold text-emerald-800 bg-emerald-100/80 hover:bg-emerald-200/80 border border-emerald-300 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        title="Set to today's date / កំណត់ជាថ្ងៃនេះ"
                      >
                        <Sparkles className="w-3 h-3 text-emerald-700" />
                        <span>{language === 'km' ? 'ថ្ងៃនេះ' : 'Today'}</span>
                      </button>
                    </div>
                  </div>
                  <input
                    type="date"
                    required
                    value={sowingDate}
                    onChange={(e) => handleSowingDateChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm sm:text-base rounded-xl border border-slate-200 bg-white font-mono text-left focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 font-semibold"
                  />
                  {/* Quick back-date pill presets */}
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <span className="text-[11px] text-slate-400 font-semibold">
                      {language === 'km' ? 'ជ្រើសរើសរហ័ស:' : 'Quick Back-Dates:'}
                    </span>
                    {[-7, -14, -21, -30].map((days) => {
                      const targetDate = calculateDateOffset(getTodayDateString(), days);
                      const isSelected = sowingDate === targetDate;
                      return (
                        <button
                          key={days}
                          type="button"
                          onClick={() => handleSowingDateChange(targetDate)}
                          className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                          }`}
                          title={`Select past date: ${Math.abs(days)} days ago (${targetDate})`}
                        >
                          {days}d ({Math.abs(days) >= 30 ? (language === 'km' ? '១ខែមុន' : '1mo') : `${Math.abs(days)}d`})
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5 font-khmer">
                    {language === 'km' 
                      ? 'កាលបរិច្ឆេទចាប់ផ្តើមសាបគ្រាប់ (អាចជ្រើសរើសថ្ងៃថយក្រោយ ឬថ្ងៃនេះ)' 
                      : 'Base date for seedling emergence (supports back/past dates and today)'}
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs sm:text-sm font-bold text-slate-700 text-left">
                      Transplanting Date / <span className="font-khmer">ថ្ងៃប្តូរកូនដាំ</span> *
                    </label>
                    <span 
                      className="text-xs font-mono text-emerald-800 bg-emerald-100/80 border border-emerald-300 px-2.5 py-1 rounded-lg font-bold"
                      title="Auto-calculated from Sowing Date + Seedling stage days"
                    >
                      +{seedlingDays}d ({language === 'km' ? 'ស្វ័យប្រវត្តិ' : 'Auto'})
                    </span>
                  </div>
                  <input
                    type="date"
                    required
                    value={transplantDate}
                    onChange={(e) => handleTransplantDateChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm sm:text-base rounded-xl border border-slate-200 bg-white font-mono text-left focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 font-semibold"
                  />
                  <p className="text-xs text-emerald-700 font-medium mt-1.5 flex items-center gap-1 font-khmer">
                    <span>{language === 'km' ? `គណនាស្វ័យប្រវត្តិ: ${sowingDate} + ${seedlingDays} ថ្ងៃកូនដុះ` : `Auto: Sowing (${sowingDate}) + ${seedlingDays}d seedling`}</span>
                  </p>
                </div>
              </div>

              {/* Stage Days Micro Inputs & Growth Stages Settings */}
              <div className="p-4 sm:p-4.5 bg-slate-50/80 rounded-2xl border border-slate-200/90 text-left">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs sm:text-sm font-bold text-slate-800">
                      Custom Stage Durations ({totalDays} Days Total):
                    </span>

                    {/* Badge: Master Variety indicator */}
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100/90 text-emerald-800 border border-emerald-300/80 text-[11px] font-bold font-mono">
                      <Sprout className="w-3 h-3 text-emerald-700" />
                      <span className="truncate max-w-[130px] sm:max-w-[170px]">
                        {selectedPreset.nameEn.split('(')[0].trim()} ({selectedPreset.daysToMaturity}d)
                      </span>
                    </span>

                    {/* Apply from Variety Button */}
                    <button
                      type="button"
                      onClick={() => {
                        handleApplyVarietyDurations(selectedPreset);
                        setDurationsAppliedNotice(selectedPreset.nameEn);
                        setTimeout(() => setDurationsAppliedNotice(null), 3000);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs hover:shadow cursor-pointer"
                      title={language === 'km' 
                        ? `អនុវត្តកាលវិភាគលូតលាស់ពីពូជ ${selectedPreset.nameKm || selectedPreset.nameEn}` 
                        : `Apply Custom Stage Durations from ${selectedPreset.nameEn}`}
                    >
                      <RotateCcw className="w-3 h-3 text-white" />
                      <span>{language === 'km' ? 'កំណត់តាមពូជ' : 'Apply Variety Durations'}</span>
                    </button>

                    {/* Notice if applied */}
                    {durationsAppliedNotice && (
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md animate-in fade-in flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-700" />
                        <span>{language === 'km' ? 'បានអនុវត្តតាមពូជ!' : 'Applied from Variety!'}</span>
                      </span>
                    )}

                    {/* Growth Stages Settings Button */}
                    <button
                      type="button"
                      onClick={() => setShowGrowthStagesSettings(true)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-bold transition-all shadow-2xs hover:shadow cursor-pointer"
                      title={language === 'km' ? 'កំណត់ឈ្មោះ និងការកំណត់ដំណាក់កាលលូតលាស់ទាំង ៧' : 'Growth Stages Settings: Edit 7 stage label names'}
                    >
                      <Sliders className="w-3.5 h-3.5 text-purple-600" />
                      <span>{language === 'km' ? 'កំណត់ដំណាក់កាល' : 'Growth Stages Settings'}</span>
                    </button>

                    {/* Quick Inline Edit Toggle */}
                    <button
                      type="button"
                      onClick={() => setIsInlineEditingLabels(!isInlineEditingLabels)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        isInlineEditingLabels
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                          : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200 shadow-2xs'
                      }`}
                      title={language === 'km' ? 'កែប្រែឈ្មោះផ្ទាល់លើប្រអប់' : 'Toggle inline editing for 7 stage labels'}
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>{isInlineEditingLabels ? (language === 'km' ? 'រួចរាល់' : 'Done Editing') : (language === 'km' ? 'កែឈ្មោះ' : 'Edit Labels')}</span>
                    </button>
                  </div>

                  <span className="text-xs font-mono text-emerald-800 font-bold bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300 self-start sm:self-auto">
                    Harvest: {getHarvestStartDate()} → {getHarvestEndDate()}
                  </span>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 text-center">
                  {/* 1. Seedling */}
                  <div className="bg-emerald-100/70 p-2 sm:p-2.5 rounded-2xl border border-emerald-300 shadow-2xs flex flex-col justify-between">
                    {isInlineEditingLabels ? (
                      <input
                        type="text"
                        value={stageLabelSeedling}
                        onChange={(e) => setStageLabelSeedling(e.target.value)}
                        className="w-full text-center text-xs font-extrabold text-emerald-950 bg-white border border-emerald-400 rounded-lg py-0.5 px-1 focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-1"
                        placeholder="Seedling"
                        title="Edit Seedling label name"
                      />
                    ) : (
                      <div
                        onClick={() => setIsInlineEditingLabels(true)}
                        className="group/lbl cursor-pointer flex items-center justify-center gap-0.5 mb-1"
                        title="Click to edit label name"
                      >
                        <span className="text-xs sm:text-sm text-emerald-900 font-extrabold block truncate" title="Controls Transplanting Date">
                          {language === 'km' && stageLabelSeedlingKm ? stageLabelSeedlingKm : stageLabelSeedling} ⚡
                        </span>
                        <Edit3 className="w-2.5 h-2.5 text-emerald-700 opacity-0 group-hover/lbl:opacity-100 transition-opacity" />
                      </div>
                    )}
                    <input
                      type="number"
                      min="1"
                      value={seedlingDays}
                      onChange={(e) => handleSeedlingDaysChange(parseInt(e.target.value) || 1)}
                      className="w-full text-center text-sm sm:text-base py-1.5 sm:py-2 rounded-xl border border-emerald-300 font-mono bg-white font-bold text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* 2. Transplant */}
                  <div className="bg-white p-2 sm:p-2.5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
                    {isInlineEditingLabels ? (
                      <input
                        type="text"
                        value={stageLabelTransplant}
                        onChange={(e) => setStageLabelTransplant(e.target.value)}
                        className="w-full text-center text-xs font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded-lg py-0.5 px-1 focus:outline-none focus:ring-2 focus:ring-purple-500 mb-1"
                        placeholder="Transplant"
                        title="Edit Transplant label name"
                      />
                    ) : (
                      <div
                        onClick={() => setIsInlineEditingLabels(true)}
                        className="group/lbl cursor-pointer flex items-center justify-center gap-0.5 mb-1"
                        title="Click to edit label name"
                      >
                        <span className="text-xs sm:text-sm text-slate-600 font-bold block truncate">
                          {language === 'km' && stageLabelTransplantKm ? stageLabelTransplantKm : stageLabelTransplant}
                        </span>
                        <Edit3 className="w-2.5 h-2.5 text-slate-400 opacity-0 group-hover/lbl:opacity-100 transition-opacity" />
                      </div>
                    )}
                    <input
                      type="number"
                      min="1"
                      value={transplantDays}
                      onChange={(e) => setTransplantDays(parseInt(e.target.value) || 1)}
                      className="w-full text-center text-sm sm:text-base py-1.5 sm:py-2 rounded-xl border border-slate-200 font-mono bg-slate-50/50 hover:bg-white focus:bg-white font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* 3. Vine Grow */}
                  <div className="bg-white p-2 sm:p-2.5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
                    {isInlineEditingLabels ? (
                      <input
                        type="text"
                        value={stageLabelVineGrow}
                        onChange={(e) => setStageLabelVineGrow(e.target.value)}
                        className="w-full text-center text-xs font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded-lg py-0.5 px-1 focus:outline-none focus:ring-2 focus:ring-purple-500 mb-1"
                        placeholder="Vine Grow"
                        title="Edit Vine Grow label name"
                      />
                    ) : (
                      <div
                        onClick={() => setIsInlineEditingLabels(true)}
                        className="group/lbl cursor-pointer flex items-center justify-center gap-0.5 mb-1"
                        title="Click to edit label name"
                      >
                        <span className="text-xs sm:text-sm text-slate-600 font-bold block truncate">
                          {language === 'km' && stageLabelVineGrowKm ? stageLabelVineGrowKm : stageLabelVineGrow}
                        </span>
                        <Edit3 className="w-2.5 h-2.5 text-slate-400 opacity-0 group-hover/lbl:opacity-100 transition-opacity" />
                      </div>
                    )}
                    <input
                      type="number"
                      min="1"
                      value={vineGrowthDays}
                      onChange={(e) => setVineGrowthDays(parseInt(e.target.value) || 1)}
                      className="w-full text-center text-sm sm:text-base py-1.5 sm:py-2 rounded-xl border border-slate-200 font-mono bg-slate-50/50 hover:bg-white focus:bg-white font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* 4. Flowering */}
                  <div className="bg-white p-2 sm:p-2.5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
                    {isInlineEditingLabels ? (
                      <input
                        type="text"
                        value={stageLabelFlowering}
                        onChange={(e) => setStageLabelFlowering(e.target.value)}
                        className="w-full text-center text-xs font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded-lg py-0.5 px-1 focus:outline-none focus:ring-2 focus:ring-purple-500 mb-1"
                        placeholder="Flowering"
                        title="Edit Flowering label name"
                      />
                    ) : (
                      <div
                        onClick={() => setIsInlineEditingLabels(true)}
                        className="group/lbl cursor-pointer flex items-center justify-center gap-0.5 mb-1"
                        title="Click to edit label name"
                      >
                        <span className="text-xs sm:text-sm text-slate-600 font-bold block truncate">
                          {language === 'km' && stageLabelFloweringKm ? stageLabelFloweringKm : stageLabelFlowering}
                        </span>
                        <Edit3 className="w-2.5 h-2.5 text-slate-400 opacity-0 group-hover/lbl:opacity-100 transition-opacity" />
                      </div>
                    )}
                    <input
                      type="number"
                      min="1"
                      value={floweringDays}
                      onChange={(e) => setFloweringDays(parseInt(e.target.value) || 1)}
                      className="w-full text-center text-sm sm:text-base py-1.5 sm:py-2 rounded-xl border border-slate-200 font-mono bg-slate-50/50 hover:bg-white focus:bg-white font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* 5. Pollinate */}
                  <div className="bg-white p-2 sm:p-2.5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
                    {isInlineEditingLabels ? (
                      <input
                        type="text"
                        value={stageLabelPollinate}
                        onChange={(e) => setStageLabelPollinate(e.target.value)}
                        className="w-full text-center text-xs font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded-lg py-0.5 px-1 focus:outline-none focus:ring-2 focus:ring-purple-500 mb-1"
                        placeholder="Pollinate"
                        title="Edit Pollinate label name"
                      />
                    ) : (
                      <div
                        onClick={() => setIsInlineEditingLabels(true)}
                        className="group/lbl cursor-pointer flex items-center justify-center gap-0.5 mb-1"
                        title="Click to edit label name"
                      >
                        <span className="text-xs sm:text-sm text-slate-600 font-bold block truncate">
                          {language === 'km' && stageLabelPollinateKm ? stageLabelPollinateKm : stageLabelPollinate}
                        </span>
                        <Edit3 className="w-2.5 h-2.5 text-slate-400 opacity-0 group-hover/lbl:opacity-100 transition-opacity" />
                      </div>
                    )}
                    <input
                      type="number"
                      min="1"
                      value={pollinationDays}
                      onChange={(e) => setPollinationDays(parseInt(e.target.value) || 1)}
                      className="w-full text-center text-sm sm:text-base py-1.5 sm:py-2 rounded-xl border border-slate-200 font-mono bg-slate-50/50 hover:bg-white focus:bg-white font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* 6. Fruit Dev */}
                  <div className="bg-white p-2 sm:p-2.5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
                    {isInlineEditingLabels ? (
                      <input
                        type="text"
                        value={stageLabelFruitDev}
                        onChange={(e) => setStageLabelFruitDev(e.target.value)}
                        className="w-full text-center text-xs font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded-lg py-0.5 px-1 focus:outline-none focus:ring-2 focus:ring-purple-500 mb-1"
                        placeholder="Fruit Dev"
                        title="Edit Fruit Dev label name"
                      />
                    ) : (
                      <div
                        onClick={() => setIsInlineEditingLabels(true)}
                        className="group/lbl cursor-pointer flex items-center justify-center gap-0.5 mb-1"
                        title="Click to edit label name"
                      >
                        <span className="text-xs sm:text-sm text-slate-600 font-bold block truncate">
                          {language === 'km' && stageLabelFruitDevKm ? stageLabelFruitDevKm : stageLabelFruitDev}
                        </span>
                        <Edit3 className="w-2.5 h-2.5 text-slate-400 opacity-0 group-hover/lbl:opacity-100 transition-opacity" />
                      </div>
                    )}
                    <input
                      type="number"
                      min="1"
                      value={fruitDevDays}
                      onChange={(e) => setFruitDevDays(parseInt(e.target.value) || 1)}
                      className="w-full text-center text-sm sm:text-base py-1.5 sm:py-2 rounded-xl border border-slate-200 font-mono bg-slate-50/50 hover:bg-white focus:bg-white font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* 7. Harvest */}
                  <div className="bg-white p-2 sm:p-2.5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
                    {isInlineEditingLabels ? (
                      <input
                        type="text"
                        value={stageLabelHarvest}
                        onChange={(e) => setStageLabelHarvest(e.target.value)}
                        className="w-full text-center text-xs font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded-lg py-0.5 px-1 focus:outline-none focus:ring-2 focus:ring-purple-500 mb-1"
                        placeholder="Harvest"
                        title="Edit Harvest label name"
                      />
                    ) : (
                      <div
                        onClick={() => setIsInlineEditingLabels(true)}
                        className="group/lbl cursor-pointer flex items-center justify-center gap-0.5 mb-1"
                        title="Click to edit label name"
                      >
                        <span className="text-xs sm:text-sm text-slate-600 font-bold block truncate">
                          {language === 'km' && stageLabelHarvestKm ? stageLabelHarvestKm : stageLabelHarvest}
                        </span>
                        <Edit3 className="w-2.5 h-2.5 text-slate-400 opacity-0 group-hover/lbl:opacity-100 transition-opacity" />
                      </div>
                    )}
                    <input
                      type="number"
                      min="1"
                      value={harvestDays}
                      onChange={(e) => setHarvestDays(parseInt(e.target.value) || 1)}
                      className="w-full text-center text-sm sm:text-base py-1.5 sm:py-2 rounded-xl border border-slate-200 font-mono bg-slate-50/50 hover:bg-white focus:bg-white font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4: Density & Target Yield */}
            <div className="pt-6 border-t border-slate-200/80">
              <div className="flex items-center gap-2.5 mb-3.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <Scale className="w-4 h-4" />
                </div>
                <span className="text-sm sm:text-base font-extrabold text-slate-900 uppercase tracking-wide">
                  4. Plant Density & Target Yield / <span className="font-khmer font-bold">ដង់ស៊ីតេ និងទិន្នផល</span>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5 text-left">
                    {language === 'km' ? 'ចំនួនដើមដាំ (Plant Population)' : 'Plant Population'} / <span className="font-khmer">ចំនួនដើម</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={plantCount}
                      onChange={(e) => setPlantCount(e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full px-3.5 py-2.5 text-sm sm:text-base rounded-xl border border-slate-200 font-mono text-left font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 pr-16"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      {language === 'km' ? 'ដើម' : 'plants'}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs sm:text-sm font-bold text-slate-700 text-left">
                      Target Yield (Kg) / <span className="font-khmer">ទិន្នផល</span>
                    </label>
                    <span className="text-[11px] font-mono text-slate-400">
                      ≈ {((targetYieldKg || 0) / 1000).toFixed(2)} tons
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={targetYieldKg}
                      onChange={(e) => {
                        setIsYieldManuallyEdited(true);
                        setTargetYieldKg(e.target.value === '' ? 0 : Math.max(0, parseFloat(e.target.value) || 0));
                      }}
                      className="w-full px-3.5 py-2.5 text-sm sm:text-base rounded-xl border border-slate-200 font-mono text-left font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      kg
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5 text-left">
                    Agronomist in Charge
                  </label>
                  <input
                    type="text"
                    value={assignedAgronomist}
                    onChange={(e) => setAssignedAgronomist(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm sm:text-base rounded-xl border border-slate-200 text-left font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Formula calculation box: Plant Population × Yield per Plant (From Crop Variety) = Target Yield (Kg) / ទិន្នផល */}
              <div className="mt-3.5 p-3 sm:p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 flex flex-wrap items-center justify-between gap-2.5 text-xs text-left">
                <div className="flex items-center gap-2 flex-wrap text-emerald-950 font-medium">
                  <span className="font-bold text-emerald-800 uppercase tracking-wide text-[11px] flex items-center gap-1">
                    <Scale className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{language === 'km' ? 'រូបមន្តគណនាទិន្នផល:' : 'Formula:'}</span>
                  </span>
                  <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-emerald-200 text-emerald-900 font-bold shadow-2xs font-mono text-xs">
                    <span>{plantCount.toLocaleString()}</span>
                    <span className="text-[10px] text-slate-500 font-sans font-medium">{language === 'km' ? 'ដើម' : 'plants'}</span>
                  </div>
                  <span className="text-emerald-700 font-bold text-sm">×</span>
                  <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-emerald-200 text-emerald-900 font-bold shadow-2xs font-mono text-xs" title={`${selectedPreset?.nameEn || varietyEn}: ${yieldPerPlant} kg/plant`}>
                    <span>{yieldPerPlant}</span>
                    <span className="text-[10px] text-slate-500 font-sans font-medium">kg/{language === 'km' ? 'ដើម' : 'plant'}</span>
                    <span className="text-[10px] text-emerald-700 font-sans font-bold">({selectedPreset?.nameEn || varietyEn})</span>
                  </div>
                  <span className="text-emerald-700 font-bold text-sm">=</span>
                  <div className="flex items-center gap-1.5 bg-[#164e22] text-white px-3 py-1 rounded-xl font-mono text-xs font-black shadow-2xs">
                    <span>{calculatedTargetYieldKg.toLocaleString()} kg</span>
                  </div>
                  <span className="text-slate-500 text-[11px] font-mono">
                    ({(calculatedTargetYieldKg / 1000).toFixed(2)} tons)
                  </span>
                </div>

                {isYieldManuallyEdited && targetYieldKg !== calculatedTargetYieldKg && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsYieldManuallyEdited(false);
                      setTargetYieldKg(calculatedTargetYieldKg);
                    }}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-900 underline flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{language === 'km' ? 'អនុវត្តរូបមន្តឡើងវិញ' : 'Apply Formula'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Automated Task Checkbox */}
            {!isEditMode && (
              <div className="p-3.5 sm:p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 flex items-center justify-between gap-3 text-left">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoCreateTasks}
                    onChange={(e) => setAutoCreateTasks(e.target.checked)}
                    className="accent-emerald-600 w-5 h-5 rounded shrink-0 cursor-pointer"
                  />
                  <span className="text-xs sm:text-sm font-bold text-emerald-950 font-khmer">
                    {language === 'km' 
                      ? 'បង្កើតកាលវិភាគកិច្ចការស្វ័យប្រវត្ត (ស្រោចទឹក បង្កាត់លម្អង កាត់មែក យោងផ្លែ វាស់ Brix)'
                      : 'Auto-generate 6 key melon agronomic tasks in farm calendar'}
                  </span>
                </label>
                <Sparkles className="w-5 h-5 text-emerald-700 shrink-0" />
              </div>
            )}
              </div>
            </div>

            {/* Frozen Footer Action Bar */}
            <div className="shrink-0 px-6 sm:px-8 py-4 border-t border-slate-200/90 bg-slate-50/95 backdrop-blur-xs flex items-center justify-end gap-3.5 z-10 shadow-2xs">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 sm:py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-sm font-bold text-slate-700 transition-colors cursor-pointer"
              >
                {language === 'km' ? 'បោះបង់' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-7 py-2.5 sm:py-3 rounded-xl bg-[#164e22] hover:bg-[#123e1b] text-white text-sm sm:text-base font-bold shadow-md transition-colors flex items-center gap-2.5 cursor-pointer"
              >
                {isEditMode ? <Edit3 className="w-4.5 h-4.5" /> : <Sprout className="w-4.5 h-4.5" />}
                <span>
                  {isEditMode 
                    ? (language === 'km' ? 'រក្សាទុកការកែប្រែ' : 'Save Changes')
                    : (language === 'km' ? 'បង្កើតដំណាំថ្មី' : 'Create & Register Crop')}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  // Sub-modal for Add / Edit Facility (Net House or Open Field)
  const facilityModalElement = showFacilityModal ? (
    <div
      className="fixed inset-0 z-[100050] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in-50"
      style={{ zIndex: 100050 }}
      onClick={() => setShowFacilityModal(false)}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] m-auto relative animate-in zoom-in-95 duration-150"
        style={{ zIndex: 100051 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-emerald-800 to-[#164e22] text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/20">
              {facilityForm.facilityType === 'open_field' ? (
                <Trees className="w-5 h-5 text-amber-300" />
              ) : (
                <Warehouse className="w-5 h-5 text-emerald-300" />
              )}
            </div>
            <div className="text-left">
              <h3 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>
                  {facilityModalMode === 'add'
                    ? (language === 'km' ? 'បន្ថែមសំណង់ថ្មី' : 'Add Facility')
                    : (language === 'km' ? 'កែប្រែសំណង់' : 'Edit Facility')}
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-emerald-100 font-khmer">
                  {facilityForm.facilityType === 'net_house'
                    ? (language === 'km' ? 'ផ្ទះសំណាញ់' : 'Net House')
                    : (language === 'km' ? 'ចំការបើកចំហ' : 'Open Field')}
                </span>
              </h3>
              <p className="text-xs text-emerald-100/90 font-khmer mt-0.5">
                {facilityTargetScope === 'new'
                  ? (language === 'km' ? 'កំណត់សំណង់សម្រាប់រងថ្មី' : 'Configure facility for the new plot')
                  : (language === 'km'
                      ? `កំណត់សំណង់សម្រាប់រង ${plots.find((p) => p.id === (facilityModalMode === 'edit' ? facilityEditingPlotId : facilityTargetPlotId))?.name || currentPlot?.name || ''}`
                      : `Configure facility for plot ${plots.find((p) => p.id === (facilityModalMode === 'edit' ? facilityEditingPlotId : facilityTargetPlotId))?.name || currentPlot?.name || ''}`)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowFacilityModal(false)}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSaveFacility} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-5 sm:p-6 space-y-4.5 overflow-y-auto flex-1 text-left">
            {/* Target Plot Selector (when multiple plots are selected in add mode) */}
            {facilityTargetScope === 'existing' && effectiveSelectedPlots.length > 1 && facilityModalMode === 'add' && (
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{language === 'km' ? 'រងដាំគោលដៅ (Target Plot)' : 'Target Plot for Facility'}</span>
                </label>
                <select
                  value={facilityTargetPlotId}
                  onChange={(e) => setFacilityTargetPlotId(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                >
                  {effectiveSelectedPlots.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Facility Type Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                1. {language === 'km' ? 'ប្រភេទសំណង់ (Facility Type)' : 'Facility Type'} / <span className="font-khmer">ប្រភេទ</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const nextColor = facilityForm.color === '#D97706' ? '#15803D' : facilityForm.color;
                    let nextName = facilityForm.name;
                    if (nextName.startsWith('Open Field') || nextName === '') {
                      nextName = nextName.replace('Open Field', 'Net House');
                    }
                    setFacilityForm((prev) => ({
                      ...prev,
                      facilityType: 'net_house',
                      color: nextColor,
                      name: nextName || 'Net House',
                    }));
                  }}
                  className={`p-3.5 rounded-2xl border-2 transition-all flex items-start gap-3 text-left cursor-pointer ${
                    facilityForm.facilityType === 'net_house'
                      ? 'border-emerald-600 bg-emerald-50/80 shadow-xs ring-2 ring-emerald-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    facilityForm.facilityType === 'net_house' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    <Warehouse className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900 block">
                      Net House
                    </span>
                    <span className="text-[11px] text-slate-500 font-khmer block mt-0.5">
                      {language === 'km' ? 'ផ្ទះសំណាញ់បិទជិត' : 'Greenhouse / Climate control'}
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const nextColor = facilityForm.color === '#15803D' ? '#D97706' : facilityForm.color;
                    let nextName = facilityForm.name;
                    if (nextName.startsWith('Net House') || nextName === '') {
                      nextName = nextName.replace('Net House', 'Open Field');
                    }
                    setFacilityForm((prev) => ({
                      ...prev,
                      facilityType: 'open_field',
                      color: nextColor,
                      name: nextName || 'Open Field',
                    }));
                  }}
                  className={`p-3.5 rounded-2xl border-2 transition-all flex items-start gap-3 text-left cursor-pointer ${
                    facilityForm.facilityType === 'open_field'
                      ? 'border-amber-600 bg-amber-50/80 shadow-xs ring-2 ring-amber-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    facilityForm.facilityType === 'open_field' ? 'bg-amber-600 text-white shadow-xs' : 'bg-amber-100 text-amber-800'
                  }`}>
                    <Trees className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-extrabold text-slate-900 block">
                      Open Field
                    </span>
                    <span className="text-[11px] text-slate-500 font-khmer block mt-0.5">
                      {language === 'km' ? 'ដីចំការវាលក្រៅអគារ' : 'Outdoor cultivation'}
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Facility Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                2. {language === 'km' ? 'ឈ្មោះសំណង់ / ស្លាកសម្គាល់' : 'Facility Name / Identifier'}
              </label>
              <input
                type="text"
                required
                value={facilityForm.name}
                onChange={(e) => setFacilityForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Net House 1 (40m × 90m) or Zone A"
                className="w-full px-3.5 py-2.5 text-sm sm:text-base rounded-xl border border-slate-200 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>

            {/* Dimensions & Area */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  3. {language === 'km' ? 'ទំហំ និង ផ្ទៃក្រឡា' : 'Dimensions & Area'}
                </label>
                <span className="text-[11px] font-mono text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  ≈ {(Number(facilityForm.areaM2 || 0) / 10000).toFixed(4)} ha
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <span className="block text-[11px] font-bold text-slate-500 mb-1">
                    {language === 'km' ? 'ទទឹង (m)' : 'Width (m)'}
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={facilityForm.widthM}
                    onChange={(e) => handleFacilityWidthChange(e.target.value)}
                    placeholder="40"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 font-mono text-center font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>

                <div>
                  <span className="block text-[11px] font-bold text-slate-500 mb-1">
                    {language === 'km' ? 'បណ្តោយ (m)' : 'Length (m)'}
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={facilityForm.lengthM}
                    onChange={(e) => handleFacilityLengthChange(e.target.value)}
                    placeholder="90"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 font-mono text-center font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>

                <div>
                  <span className="block text-[11px] font-bold text-slate-500 mb-1">
                    {language === 'km' ? 'ផ្ទៃសរុប (m²)' : 'Area (m²)'}
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={facilityForm.areaM2}
                    onChange={(e) =>
                      setFacilityForm((prev) => ({
                        ...prev,
                        areaM2: e.target.value === '' ? '' : Math.max(0, Number(e.target.value)),
                      }))
                    }
                    placeholder="3600"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-emerald-300 font-mono text-center font-bold text-emerald-900 bg-emerald-50/50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {language === 'km' ? 'ទទឹង × បណ្តោយ = ផ្ទៃក្រឡា m² (អាចកែប្រែដោយផ្ទាល់បាន)' : 'Width × Length automatically updates Area m² (or override directly).'}
              </p>
            </div>

            {/* Plant Population Capacity */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  4. {language === 'km' ? 'សមត្ថភាពដើមដាំ (Plant Population)' : 'Plant Population Capacity'}
                </label>
                <div className="flex items-center gap-1">
                  {[2400, 2800, 3200].map((presetVal) => (
                    <button
                      key={presetVal}
                      type="button"
                      onClick={() => setFacilityForm((prev) => ({ ...prev, plantCount: presetVal }))}
                      className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 text-slate-600 transition-colors cursor-pointer"
                    >
                      {presetVal}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={facilityForm.plantCount}
                  onChange={(e) =>
                    setFacilityForm((prev) => ({
                      ...prev,
                      plantCount: e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0),
                    }))
                  }
                  placeholder="2800"
                  className="w-full px-3.5 py-2.5 text-sm sm:text-base rounded-xl border border-slate-200 font-mono text-left font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-16 bg-white"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  {language === 'km' ? 'ដើម' : 'plants'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {language === 'km'
                  ? 'ស្តង់ដារផ្ទះសំណាញ់ ៤០ម × ៩០ម គឺ ២,៨០០ ដើម (~០.៧៨ ដើម/m²)'
                  : 'Typical 40m × 90m net house accommodates ~2,800 melon plants.'}
              </p>
            </div>

            {/* Color Accent */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                5. {language === 'km' ? 'ពណ៌សម្គាល់លើប្លង់ (Color Accent)' : 'Color Accent'}
              </label>
              <div className="flex items-center gap-2.5 flex-wrap">
                {[
                  { hex: '#15803D', label: 'Dark Green' },
                  { hex: '#059669', label: 'Emerald' },
                  { hex: '#10B981', label: 'Mint' },
                  { hex: '#D97706', label: 'Amber' },
                  { hex: '#EA580C', label: 'Orange' },
                  { hex: '#2563EB', label: 'Blue' },
                  { hex: '#7C3AED', label: 'Purple' },
                  { hex: '#0F766E', label: 'Teal' },
                ].map((c) => {
                  const isSelected = facilityForm.color.toLowerCase() === c.hex.toLowerCase();
                  return (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setFacilityForm((prev) => ({ ...prev, color: c.hex }))}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                        isSelected ? 'ring-2 ring-offset-2 ring-slate-800 scale-110 shadow-sm' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.label}
                    >
                      {isSelected && <Check className="w-4 h-4 text-white drop-shadow-xs" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setShowFacilityModal(false)}
              className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs sm:text-sm font-bold text-slate-700 transition-colors cursor-pointer"
            >
              {language === 'km' ? 'បោះបង់' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#164e22] hover:bg-[#123e1b] text-white text-xs sm:text-sm font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>
                {facilityModalMode === 'add'
                  ? (language === 'km' ? 'បន្ថែមសំណង់' : 'Add Facility')
                  : (language === 'km' ? 'រក្សាទុកសំណង់' : 'Save Facility')}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  ) : null;

  // Sub-modal for Delete Confirmation
  const facilityDeleteConfirmElement = facilityToDelete ? (
    <div
      className="fixed inset-0 z-[100060] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in-50"
      style={{ zIndex: 100060 }}
      onClick={() => setFacilityToDelete(null)}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 p-6 text-center space-y-4 m-auto relative animate-in zoom-in-95 duration-150"
        style={{ zIndex: 100061 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto ring-8 ring-rose-50 shadow-xs">
          <Trash2 className="w-7 h-7" />
        </div>

        <div>
          <h3 className="text-lg font-black text-slate-900">
            {language === 'km' ? 'លុបសំណង់នេះ?' : 'Delete Facility?'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 font-khmer mt-2 leading-relaxed">
            {language === 'km' ? (
              <>តើអ្នកប្រាកដជាចង់លុបសំណង់ <strong className="text-slate-900">"{facilityToDelete.name}"</strong> នេះចេញមែនទេ?</>
            ) : (
              <>Are you sure you want to delete <strong className="text-slate-900">"{facilityToDelete.name}"</strong>? This will remove it from the plot definition.</>
            )}
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => setFacilityToDelete(null)}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs sm:text-sm font-bold text-slate-700 transition-colors cursor-pointer"
          >
            {language === 'km' ? 'បោះបង់' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleConfirmDeleteFacility}
            className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>{language === 'km' ? 'បាទ/ចាស លុប' : 'Yes, Delete'}</span>
          </button>
        </div>
      </div>
    </div>
  ) : null;

  // Sub-modal for Growth Stages Settings (Edit label names of existing 7 growth stages)
  const growthStagesSettingsModalElement = showGrowthStagesSettings ? (
    <div
      className="fixed inset-0 z-[100060] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in-50"
      style={{ zIndex: 100060 }}
      onClick={() => setShowGrowthStagesSettings(false)}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] m-auto relative animate-in zoom-in-95 duration-150"
        style={{ zIndex: 100061 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-purple-800 to-indigo-900 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/20">
              <Sliders className="w-5 h-5 text-purple-200" />
            </div>
            <div className="text-left">
              <h3 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>Growth Stages Settings</span>
                <span className="text-xs font-normal text-purple-200 font-khmer">/ ការកំណត់ឈ្មោះដំណាក់កាល</span>
              </h3>
              <p className="text-xs text-purple-200 font-khmer mt-0.5">
                {language === 'km'
                  ? 'កែប្រែឈ្មោះស្លាកនៃ ៧ ដំណាក់កាលលូតលាស់ (Seedling, Transplant, Vine Grow, Flowering, Pollinate, Fruit Dev, Harvest)'
                  : 'Customize label names and target days for the 7 core growth stages'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowGrowthStagesSettings(false)}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-left">
          <div className="p-3 bg-purple-50/70 border border-purple-200/80 rounded-2xl flex items-center justify-between gap-3 text-xs text-purple-900">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
              <span>
                {language === 'km'
                  ? 'ឈ្មោះដែលបានកែប្រែ នឹងបង្ហាញលើកាលវិភាគលូតលាស់ កិច្ចការប្រចាំថ្ងៃ និងរបាយការណ៍។'
                  : 'Custom stage labels will appear on timelines, daily agronomic tasks, and batch reports.'}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  handleApplyVarietyDurations(selectedPreset);
                  setDurationsAppliedNotice(selectedPreset.nameEn);
                  setTimeout(() => setDurationsAppliedNotice(null), 3000);
                }}
                className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 rounded-lg text-xs font-bold transition-all shadow-2xs shrink-0 flex items-center gap-1 cursor-pointer"
                title={language === 'km' 
                  ? `កំណត់ឡើងវិញតាមពូជ ${selectedPreset.nameKm || selectedPreset.nameEn}` 
                  : `Reset to Master Variety (${selectedPreset.nameEn})`}
              >
                <RotateCcw className="w-3 h-3 text-emerald-700" />
                <span>{language === 'km' ? `តាមពូជ (${selectedPreset.nameKm.split(' ')[0] || selectedPreset.nameEn.split(' ')[0]})` : `Reset to ${selectedPreset.nameEn.split(' ')[0]}`}</span>
              </button>
              <button
                type="button"
                onClick={handleResetStageLabels}
                className="px-2.5 py-1 bg-white hover:bg-purple-100 text-purple-800 border border-purple-300 rounded-lg text-xs font-bold transition-all shadow-2xs shrink-0 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3 text-purple-600" />
                <span>{language === 'km' ? 'កំណត់ឈ្មោះដើម' : 'Reset Defaults'}</span>
              </button>
            </div>
          </div>

          {/* 7 Stages Configuration List */}
          <div className="space-y-3">
            {[
              {
                id: 1,
                key: 'seedling',
                badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
                defaultEn: 'Seedling',
                valEn: stageLabelSeedling,
                setEn: setStageLabelSeedling,
                valKm: stageLabelSeedlingKm,
                setKm: setStageLabelSeedlingKm,
                days: seedlingDays,
                setDays: handleSeedlingDaysChange,
                iconSuffix: '⚡',
              },
              {
                id: 2,
                key: 'transplanting',
                badgeBg: 'bg-teal-100 text-teal-800 border-teal-300',
                defaultEn: 'Transplant',
                valEn: stageLabelTransplant,
                setEn: setStageLabelTransplant,
                valKm: stageLabelTransplantKm,
                setKm: setStageLabelTransplantKm,
                days: transplantDays,
                setDays: setTransplantDays,
              },
              {
                id: 3,
                key: 'vine_growth',
                badgeBg: 'bg-sky-100 text-sky-800 border-sky-300',
                defaultEn: 'Vine Grow',
                valEn: stageLabelVineGrow,
                setEn: setStageLabelVineGrow,
                valKm: stageLabelVineGrowKm,
                setKm: setStageLabelVineGrowKm,
                days: vineGrowthDays,
                setDays: setVineGrowthDays,
              },
              {
                id: 4,
                key: 'flowering',
                badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-300',
                defaultEn: 'Flowering',
                valEn: stageLabelFlowering,
                setEn: setStageLabelFlowering,
                valKm: stageLabelFloweringKm,
                setKm: setStageLabelFloweringKm,
                days: floweringDays,
                setDays: setFloweringDays,
              },
              {
                id: 5,
                key: 'pollination',
                badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
                defaultEn: 'Pollinate',
                valEn: stageLabelPollinate,
                setEn: setStageLabelPollinate,
                valKm: stageLabelPollinateKm,
                setKm: setStageLabelPollinateKm,
                days: pollinationDays,
                setDays: setPollinationDays,
              },
              {
                id: 6,
                key: 'fruit_development',
                badgeBg: 'bg-purple-100 text-purple-800 border-purple-300',
                defaultEn: 'Fruit Dev',
                valEn: stageLabelFruitDev,
                setEn: setStageLabelFruitDev,
                valKm: stageLabelFruitDevKm,
                setKm: setStageLabelFruitDevKm,
                days: fruitDevDays,
                setDays: setFruitDevDays,
              },
              {
                id: 7,
                key: 'harvest',
                badgeBg: 'bg-rose-100 text-rose-800 border-rose-300',
                defaultEn: 'Harvest',
                valEn: stageLabelHarvest,
                setEn: setStageLabelHarvest,
                valKm: stageLabelHarvestKm,
                setKm: setStageLabelHarvestKm,
                days: harvestDays,
                setDays: setHarvestDays,
              },
            ].map((stg) => (
              <div
                key={stg.id}
                className="p-3 bg-white border border-slate-200/90 rounded-2xl shadow-2xs hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-[130px]">
                  <div className={`w-7 h-7 rounded-lg ${stg.badgeBg} border flex items-center justify-center font-bold text-xs shrink-0`}>
                    {stg.id}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      {stg.defaultEn} {stg.iconSuffix || ''}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      #{stg.key.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                      Label Name (EN) / ឈ្មោះអង់គ្លេស
                    </label>
                    <input
                      type="text"
                      value={stg.valEn}
                      onChange={(e) => stg.setEn(e.target.value)}
                      placeholder={stg.defaultEn}
                      className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5 font-khmer">
                      ឈ្មោះជាភាសាខ្មែរ (KM)
                    </label>
                    <input
                      type="text"
                      value={stg.valKm}
                      onChange={(e) => stg.setKm(e.target.value)}
                      placeholder="ឈ្មោះជាភាសាខ្មែរ"
                      className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-khmer font-bold text-slate-800"
                    />
                  </div>
                </div>

                <div className="w-full sm:w-20 shrink-0">
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5 text-center">
                    Days / ថ្ងៃ
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={stg.days}
                    onChange={(e) => stg.setDays(parseInt(e.target.value) || 1)}
                    className="w-full text-center px-2 py-1.5 text-xs font-mono font-bold rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Sync Checkbox */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={syncWithGlobalStages}
                onChange={(e) => setSyncWithGlobalStages(e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300"
              />
              <span>
                {language === 'km' 
                  ? 'រក្សាទុកឈ្មោះថ្មីនេះជាស្តង់ដារកសិដ្ឋាន (Farm-wide Master Settings)' 
                  : 'Also update Master Growth Stages settings across the farm'}
              </span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200/90 bg-slate-50/95 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={() => setShowGrowthStagesSettings(false)}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
          >
            {language === 'km' ? 'បោះបង់' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleApplyGrowthStagesSettings}
            className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{language === 'km' ? 'អនុវត្តការកំណត់' : 'Apply Settings'}</span>
          </button>
        </div>
      </div>
    </div>
  ) : null;

  const content = (
    <>
      {modalElement}
      {facilityModalElement}
      {facilityDeleteConfirmElement}
      {growthStagesSettingsModalElement}
    </>
  );

  return typeof document !== 'undefined'
    ? createPortal(content, document.body)
    : content;
};
