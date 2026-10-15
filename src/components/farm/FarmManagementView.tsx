import React, { useState, useMemo } from 'react';
import { 
  Warehouse, 
  MapPin, 
  Plus, 
  Edit3, 
  Trash2, 
  Compass, 
  Check, 
  Droplets, 
  Thermometer, 
  Sprout, 
  Trees, 
  Layers, 
  Building2, 
  Phone, 
  User, 
  ChevronRight, 
  Search, 
  Filter, 
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Info,
  Activity,
  CheckCircle2,
  X,
  LayoutGrid,
  List,
  Zap,
  Gauge
} from 'lucide-react';
import { useI18n } from '../../locales/i18nContext';
import { useFarm } from '../../context/FarmContext';
import { Farm, Plot, FacilityType, FacilityShape } from '../../types/melon';
import { UnifiedFarmMap } from '../field/UnifiedFarmMap';
import { PlotShapeEditorModal } from '../field/PlotShapeEditorModal';
import { SafeMapErrorBoundary } from '../common/SafeMapErrorBoundary';
import { calculateHaversineDistanceM } from '../../utils/geoUtils';

export const FarmManagementView: React.FC = () => {
  const { t, language } = useI18n();
  const { 
    farms, 
    selectedFarmId, 
    setSelectedFarmId, 
    addFarm, 
    updateFarm, 
    deleteFarm,
    plots, 
    addPlot, 
    updatePlot, 
    deletePlot, 
    selectedPlotId, 
    setSelectedPlotId,
    toggleIrrigation
  } = useFarm();

  // Tab State
  const [activeSubTab, setActiveSubTab] = useState<'plots' | 'farms' | 'map'>('plots');

  // View Layout ('catalog' | 'list') and Scope ('plots' | 'facilities')
  const [viewLayout, setViewLayout] = useState<'catalog' | 'list'>('list');
  const [viewScope, setViewScope] = useState<'plots' | 'facilities'>('plots');

  // Filters & Search
  const [facilityFilter, setFacilityFilter] = useState<'all' | 'net_house' | 'open_field' | 'both'>('all');
  const [plotSearchQuery, setPlotSearchQuery] = useState('');

  // Modals State
  const [farmModalOpen, setFarmModalOpen] = useState(false);
  const [editingFarm, setEditingFarm] = useState<Farm | null>(null);

  const [plotModalOpen, setPlotModalOpen] = useState(false);
  const [editingPlot, setEditingPlot] = useState<Plot | null>(null);

  const [shapeEditorOpen, setShapeEditorOpen] = useState(false);
  const [shapeEditorPlot, setShapeEditorPlot] = useState<Plot | null>(null);
  const [shapeEditorFacilityId, setShapeEditorFacilityId] = useState<string | undefined>(undefined);

  const [confirmDelete, setConfirmDelete] = useState<{
    type: 'farm' | 'plot' | 'facility';
    id: string;
    name: string;
    plotId?: string;
    plotName?: string;
  } | null>(null);

  // Map Reset / Recenter Trigger for Spatial GIS Map
  const [mapResetTrigger, setMapResetTrigger] = useState(0);

  // Facility Modal State (Add/Edit Net House or Open Field)
  const [facilityModalOpen, setFacilityModalOpen] = useState(false);
  const [facilityModalMode, setFacilityModalMode] = useState<'add' | 'edit'>('add');
  const [facilityModalPlotId, setFacilityModalPlotId] = useState<string>('');
  const [editingFacility, setEditingFacility] = useState<FacilityShape | null>(null);
  const [facilityForm, setFacilityForm] = useState<{
    name: string;
    facilityType: FacilityType;
    areaM2: number | string;
    widthM: number | string;
    lengthM: number | string;
    plantCount: number | string;
    color: string;
    soilMoisture: number | string;
    ambientTemp: number | string;
    soilEc: number | string;
    soilPh: number | string;
    irrigationStatus: 'on' | 'off' | 'scheduled';
  }>({
    name: '',
    facilityType: 'net_house' as FacilityType,
    areaM2: 3600,
    widthM: 40,
    lengthM: 90,
    plantCount: 2800,
    color: '#15803D',
    soilMoisture: 68,
    ambientTemp: 29.5,
    soilEc: 1.8,
    soilPh: 6.2,
    irrigationStatus: 'off',
  });

  // Farm Form State
  const [farmForm, setFarmForm] = useState({
    name: '',
    nameKm: '',
    code: '',
    location: '',
    leadAgronomist: '',
    contactPhone: '',
    totalAreaHa: 2.5,
    description: '',
    descriptionKm: '',
  });

  // Plot Form State (Facility types are defined by map shapes, melon variety belongs to crop cycles)
  const [plotForm, setPlotForm] = useState({
    farmId: '',
    name: '',
    code: '',
    areaHa: 1.0,
    plantCount: 2500,
    color: '#15803D',
  });

  // Helper to extract or synthesize facility shapes from plot with areaM2 and plantCount
  const getPlotFacilities = (plot: Plot): FacilityShape[] => {
    if (plot.shapes && plot.shapes.length > 0) {
      return plot.shapes.map((s, idx) => {
        const areaM2 = s.areaM2 !== undefined && s.areaM2 > 0 ? s.areaM2 : (s.areaHa !== undefined && s.areaHa > 0 ? Math.round(s.areaHa * 10000) : 3600);
        const areaHa = s.areaHa !== undefined && s.areaHa > 0 ? s.areaHa : Number((areaM2 / 10000).toFixed(2));
        const plantCount = s.plantCount !== undefined ? s.plantCount : Math.round(areaM2 * 0.75);
        return {
          ...s,
          id: s.id || `shape-${plot.id}-${idx}`,
          name: s.name || (s.facilityType === 'open_field' ? `Open Field ${idx + 1}` : `Net House ${idx + 1}`),
          facilityType: s.facilityType || 'net_house',
          coords: s.coords || [],
          areaM2,
          areaHa,
          plantCount,
          color: s.color || (s.facilityType === 'open_field' ? '#D97706' : '#15803D'),
        };
      });
    }
    const isNet = (plot.facilityType as any) !== 'open_field';
    const plotAreaM2 = plot.areaM2 !== undefined && plot.areaM2 > 0 ? plot.areaM2 : Math.round((plot.areaHa || 1.0) * 10000);
    const plotPlantCount = plot.plantCount !== undefined && plot.plantCount > 0 ? plot.plantCount : Math.round(plotAreaM2 * 0.75);
    return [
      {
        id: `shape-${plot.id}-1`,
        name: isNet ? 'Net House 1' : 'Open Field 1',
        facilityType: isNet ? 'net_house' : 'open_field',
        coords: plot.polygonCoords || [],
        color: plot.color || (isNet ? '#15803D' : '#D97706'),
        areaM2: plotAreaM2,
        areaHa: plot.areaHa || Number((plotAreaM2 / 10000).toFixed(2)),
        plantCount: plotPlantCount,
      },
    ];
  };

  // Helper to calculate total Area in m² and total Plant Population for a plot from all its facilities
  const getPlotTotals = (plot: Plot) => {
    const facilities = getPlotFacilities(plot);
    const totalAreaM2 = facilities.reduce((sum, f) => sum + (f.areaM2 !== undefined ? f.areaM2 : (f.areaHa ? Math.round(f.areaHa * 10000) : 0)), 0);
    const totalPlantCount = facilities.reduce((sum, f) => sum + (f.plantCount || 0), 0);
    const totalAreaHa = Number((totalAreaM2 / 10000).toFixed(2));
    return {
      totalAreaM2: totalAreaM2 > 0 ? totalAreaM2 : (plot.areaM2 || Math.round((plot.areaHa || 1) * 10000)),
      totalAreaHa: totalAreaM2 > 0 ? totalAreaHa : (plot.areaHa || 1),
      totalPlantCount: totalPlantCount > 0 ? totalPlantCount : (plot.plantCount || 0),
      facilitiesCount: facilities.length,
    };
  };

  // Filtered Plots
  const filteredPlots = useMemo(() => {
    return plots.filter((plot) => {
      // 1. Filter by Farm
      if (selectedFarmId !== 'all' && plot.farmId && plot.farmId !== selectedFarmId) {
        return false;
      }

      // 2. Filter by Facility Type
      const shapes = getPlotFacilities(plot);
      const hasNet = shapes.some((s) => s.facilityType === 'net_house');
      const hasOpen = shapes.some((s) => s.facilityType === 'open_field');

      if (facilityFilter === 'net_house' && !hasNet) return false;
      if (facilityFilter === 'open_field' && !hasOpen) return false;
      if (facilityFilter === 'both' && (!hasNet || !hasOpen)) return false;

      // 3. Search query
      if (plotSearchQuery.trim()) {
        const q = plotSearchQuery.toLowerCase();
        const matchName = plot.name.toLowerCase().includes(q);
        const matchCode = plot.code.toLowerCase().includes(q);
        const matchVariety = (plot.melonVarietyEn?.toLowerCase().includes(q) || plot.melonVarietyKm?.toLowerCase().includes(q)) ?? false;
        const matchFacilities = shapes.some((s) => s.name.toLowerCase().includes(q));
        if (!matchName && !matchCode && !matchVariety && !matchFacilities) return false;
      }

      return true;
    });
  }, [plots, selectedFarmId, facilityFilter, plotSearchQuery]);

  // Helper to format facility dimensions into standard string e.g. "10mx40m", "40mx90m"
  const formatFacilityDimensions = (facility: FacilityShape): string => {
    // 1. Check if name contains explicit dimension like "40m × 90m" or "10mx40m"
    if (facility.name) {
      const nameMatch = facility.name.match(/(\d+(?:\.\d+)?)\s*m\s*[×x*X]\s*(\d+(?:\.\d+)?)\s*m/i);
      if (nameMatch) {
        return `${Math.round(Number(nameMatch[1]))}mx${Math.round(Number(nameMatch[2]))}m`;
      }
    }

    // 2. Check if polygon coordinates form a rectangle with measurable sides
    if (facility.coords && facility.coords.length >= 4) {
      const d01 = calculateHaversineDistanceM(facility.coords[0], facility.coords[1]);
      const d12 = calculateHaversineDistanceM(facility.coords[1], facility.coords[2]);
      if (d01 >= 2 && d12 >= 2) {
        const w = Math.round(Math.min(d01, d12));
        const l = Math.round(Math.max(d01, d12));
        const calcArea = w * l;
        const targetArea = facility.areaM2 || Math.round((facility.areaHa || 0.04) * 10000);
        if (Math.abs(calcArea - targetArea) <= targetArea * 0.35) {
          return `${w}mx${l}m`;
        }
      }
    }

    // 3. Match standard benchmarks
    const area = facility.areaM2 !== undefined && facility.areaM2 > 0
      ? facility.areaM2
      : Math.round((facility.areaHa || 0.04) * 10000);

    const benchmarkMap: Record<number, string> = {
      400: '10mx40m',
      600: '15mx40m',
      800: '20mx40m',
      1000: '20mx50m',
      1200: '20mx60m',
      1500: '25mx60m',
      1600: '20mx80m',
      2000: '25mx80m',
      2400: '30mx80m',
      2800: '35mx80m',
      3000: '30mx100m',
      3200: '40mx80m',
      3600: '40mx90m',
      4000: '40mx100m',
      4500: '45mx100m',
      4800: '60mx80m',
      5000: '50mx100m',
      6000: '60mx100m',
      7200: '60mx120m',
      8000: '80mx100m',
      9000: '90mx100m',
      10000: '100mx100m',
      12000: '100mx120m',
    };

    if (benchmarkMap[area]) {
      return benchmarkMap[area];
    }

    // 4. Divisor search for optimal agricultural aspect ratio
    const candidateWidths = [10, 8, 12, 15, 16, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100];
    let bestW = 10;
    let bestL = 40;
    let bestRatioDiff = 999;
    const targetRatio = facility.facilityType === 'open_field' ? 1.8 : 2.5;

    for (const w of candidateWidths) {
      if (area % w === 0) {
        const l = area / w;
        if (l >= w) {
          const ratio = l / w;
          const diff = Math.abs(ratio - targetRatio);
          if (diff < bestRatioDiff) {
            bestRatioDiff = diff;
            bestW = w;
            bestL = l;
          }
        }
      }
    }

    if (bestRatioDiff < 999) {
      return `${bestW}mx${bestL}m`;
    }

    // 5. Fallback approximation
    const approxW = Math.max(5, Math.round(Math.sqrt(area / targetRatio)));
    const approxL = Math.round(area / approxW);
    return `${approxW}mx${approxL}m`;
  };

  // Helper to reliably find farm based on plot
  const getFarmForPlot = (plot: Plot): Farm => {
    if (plot.farmId) {
      const targetId = plot.farmId.toLowerCase();
      const matched = farms.find((f) => f.id === plot.farmId || f.code === plot.farmId || f.name.toLowerCase() === targetId);
      if (matched) return matched;
    }
    if (selectedFarmId !== 'all') {
      const selected = farms.find((f) => f.id === selectedFarmId);
      if (selected) return selected;
    }
    return farms[0] || {
      id: 'farm-1',
      name: 'Battambang Central Smart Farm',
      nameKm: 'កសិដ្ឋានបាត់ដំបងកណ្តាល',
      code: 'FARM-BTB-01',
      location: 'Battambang Province, Cambodia',
      totalAreaHa: 3.6,
    };
  };

  // Aggregated flat facilities list for All Facilities catalog/list view
  const allFlatFacilities = useMemo(() => {
    const items: { facility: FacilityShape; plot: Plot; farm: Farm }[] = [];
    filteredPlots.forEach((plot) => {
      const farm = getFarmForPlot(plot);
      const shapes = getPlotFacilities(plot);
      shapes.forEach((facility) => {
        if (facilityFilter === 'net_house' && facility.facilityType !== 'net_house') return;
        if (facilityFilter === 'open_field' && facility.facilityType !== 'open_field') return;
        if (facilityFilter === 'both' && (!shapes.some((s) => s.facilityType === 'net_house') || !shapes.some((s) => s.facilityType === 'open_field'))) return;

        if (plotSearchQuery.trim()) {
          const q = plotSearchQuery.toLowerCase();
          const matchFacility = facility.name.toLowerCase().includes(q);
          const matchPlot = plot.name.toLowerCase().includes(q) || plot.code.toLowerCase().includes(q);
          const matchFarm = (farm.name?.toLowerCase().includes(q) || farm.nameKm?.toLowerCase().includes(q)) ?? false;
          if (!matchFacility && !matchPlot && !matchFarm) return;
        }

        items.push({ facility, plot, farm });
      });
    });
    return items;
  }, [filteredPlots, farms, selectedFarmId, facilityFilter, plotSearchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const totalFarmsCount = farms.length;
    const totalFarmAreaHa = farms.reduce((sum, f) => sum + (f.totalAreaHa || 0), 0);
    const totalFarmAreaM2 = Math.round(totalFarmAreaHa * 10000);
    const totalPlotsCount = plots.length;

    let totalPlotAreaM2 = 0;
    let totalPlotPlantCount = 0;
    let netHouseCount = 0;
    let netHouseAreaM2 = 0;
    let openFieldCount = 0;
    let openFieldAreaM2 = 0;
    let hybridCount = 0;

    plots.forEach((p) => {
      const shapes = getPlotFacilities(p);
      const hasNet = shapes.some((s) => s.facilityType === 'net_house');
      const hasOpen = shapes.some((s) => s.facilityType === 'open_field');

      shapes.forEach((s) => {
        const sM2 = s.areaM2 || (s.areaHa ? Math.round(s.areaHa * 10000) : 3600);
        const sPlants = s.plantCount || 0;
        totalPlotAreaM2 += sM2;
        totalPlotPlantCount += sPlants;

        if (s.facilityType === 'net_house') {
          netHouseCount++;
          netHouseAreaM2 += sM2;
        } else {
          openFieldCount++;
          openFieldAreaM2 += sM2;
        }
      });

      if (hasNet && hasOpen) {
        hybridCount++;
      }
    });

    return {
      totalFarmsCount,
      totalFarmAreaHa,
      totalFarmAreaM2,
      totalPlotsCount,
      totalPlotAreaM2,
      totalPlotAreaHa: Number((totalPlotAreaM2 / 10000).toFixed(2)),
      totalPlotPlantCount,
      netHouseCount,
      netHouseAreaM2,
      netHouseAreaHa: Number((netHouseAreaM2 / 10000).toFixed(2)),
      openFieldCount,
      openFieldAreaM2,
      openFieldAreaHa: Number((openFieldAreaM2 / 10000).toFixed(2)),
      hybridCount,
    };
  }, [farms, plots]);

  // Farm Actions
  const handleOpenAddFarm = () => {
    setEditingFarm(null);
    setFarmForm({
      name: '',
      nameKm: '',
      code: `FARM-0${farms.length + 1}`,
      location: 'Cambodia',
      leadAgronomist: 'Sokha Farmer',
      contactPhone: '+855 12 345 678',
      totalAreaHa: 3.0,
      description: '',
      descriptionKm: '',
    });
    setFarmModalOpen(true);
  };

  const handleOpenEditFarm = (farm: Farm) => {
    setEditingFarm(farm);
    setFarmForm({
      name: farm.name,
      nameKm: farm.nameKm || '',
      code: farm.code,
      location: farm.location,
      leadAgronomist: farm.leadAgronomist || '',
      contactPhone: farm.contactPhone || '',
      totalAreaHa: farm.totalAreaHa,
      description: farm.description || '',
      descriptionKm: farm.descriptionKm || '',
    });
    setFarmModalOpen(true);
  };

  const handleSaveFarm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmForm.name.trim() || !farmForm.code.trim()) return;

    if (editingFarm) {
      updateFarm({
        ...editingFarm,
        name: farmForm.name.trim(),
        nameKm: farmForm.nameKm.trim(),
        code: farmForm.code.trim(),
        location: farmForm.location.trim(),
        leadAgronomist: farmForm.leadAgronomist.trim(),
        contactPhone: farmForm.contactPhone.trim(),
        totalAreaHa: Number(farmForm.totalAreaHa) || 1,
        description: farmForm.description.trim(),
        descriptionKm: farmForm.descriptionKm.trim(),
      });
    } else {
      addFarm({
        name: farmForm.name.trim(),
        nameKm: farmForm.nameKm.trim(),
        code: farmForm.code.trim(),
        location: farmForm.location.trim(),
        leadAgronomist: farmForm.leadAgronomist.trim(),
        contactPhone: farmForm.contactPhone.trim(),
        totalAreaHa: Number(farmForm.totalAreaHa) || 1,
        description: farmForm.description.trim(),
        descriptionKm: farmForm.descriptionKm.trim(),
      });
    }
    setFarmModalOpen(false);
  };

  // Plot Actions
  const handleOpenAddPlot = () => {
    setEditingPlot(null);
    const defaultFarm = selectedFarmId !== 'all' ? selectedFarmId : (farms[0]?.id || 'farm-1');
    setPlotForm({
      farmId: defaultFarm,
      name: `Plot ${String.fromCharCode(65 + plots.length)}`,
      code: `PL-0${plots.length + 1}`,
      areaHa: 1.0,
      plantCount: 2800,
      color: '#15803D',
    });
    setPlotModalOpen(true);
  };

  const handleOpenEditPlot = (plot: Plot) => {
    setEditingPlot(plot);
    setPlotForm({
      farmId: plot.farmId || farms[0]?.id || 'farm-1',
      name: plot.name,
      code: plot.code,
      areaHa: plot.areaHa,
      plantCount: plot.plantCount,
      color: plot.color || '#15803D',
    });
    setPlotModalOpen(true);
  };

  const handleSavePlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plotForm.name.trim() || !plotForm.code.trim()) return;

    if (editingPlot) {
      // Preserve shapes and derive facilityTypes from map shapes
      const existingShapes = editingPlot.shapes || [];
      const derivedTypes = existingShapes.length > 0
        ? Array.from(new Set(existingShapes.map((s) => s.facilityType)))
        : (editingPlot.facilityTypes && editingPlot.facilityTypes.length > 0 ? editingPlot.facilityTypes : [editingPlot.facilityType || 'net_house']);

      const totalAreaM2 = existingShapes.length > 0
        ? existingShapes.reduce((sum, s) => sum + (s.areaM2 || (s.areaHa ? Math.round(s.areaHa * 10000) : 0)), 0)
        : Math.round((Number(plotForm.areaHa) || 1) * 10000);
      const totalAreaHa = Number((totalAreaM2 / 10000).toFixed(2));
      const totalPlantCount = existingShapes.length > 0
        ? existingShapes.reduce((sum, s) => sum + (s.plantCount || 0), 0)
        : (Number(plotForm.plantCount) || 1000);

      updatePlot({
        ...editingPlot,
        farmId: plotForm.farmId,
        name: plotForm.name.trim(),
        code: plotForm.code.trim(),
        areaHa: totalAreaHa > 0 ? totalAreaHa : 0.5,
        areaM2: totalAreaM2,
        facilityType: derivedTypes[0] || 'net_house',
        facilityTypes: derivedTypes,
        plantCount: totalPlantCount,
        color: plotForm.color,
      });
    } else {
      const initAreaM2 = Math.round((Number(plotForm.areaHa) || 1) * 10000);
      const initPlants = Number(plotForm.plantCount) || 2800;
      addPlot({
        farmId: plotForm.farmId,
        name: plotForm.name.trim(),
        code: plotForm.code.trim(),
        areaHa: Number(plotForm.areaHa) || 1.0,
        areaM2: initAreaM2,
        facilityType: 'net_house',
        facilityTypes: ['net_house'],
        shapes: [
          {
            id: `shape-new-${Date.now()}`,
            name: `${plotForm.name.trim()} (Net House 1)`,
            facilityType: 'net_house',
            coords: [],
            areaM2: initAreaM2,
            areaHa: Number(plotForm.areaHa) || 1.0,
            plantCount: initPlants,
            color: plotForm.color,
          }
        ],
        plantCount: initPlants,
        sowingDate: '2025-04-01',
        transplantingDate: '2025-04-10',
        expectedHarvestDate: '2025-06-20',
        currentStage: 'transplanting',
        healthScore: 95,
        healthStatus: 'optimal',
        soilMoisture: 65,
        soilEc: 1.8,
        soilPh: 6.5,
        ambientTemp: 32,
        humidity: 70,
        irrigationStatus: 'off',
        nextIrrigationTime: '18:00',
        qrCodeId: `QR-${plotForm.code.toUpperCase()}-${Date.now().toString().slice(-4)}`,
        color: plotForm.color,
      });
    }
    setPlotModalOpen(false);
  };

  const handleOpenShapeEditor = (plot: Plot, facilityId?: string) => {
    setSelectedPlotId(plot.id);
    setShapeEditorPlot(plot);
    setShapeEditorFacilityId(facilityId);
    setShapeEditorOpen(true);
  };

  const handleDeleteConfirmed = () => {
    if (!confirmDelete) return;
    if (confirmDelete.type === 'farm') {
      deleteFarm(confirmDelete.id);
    } else if (confirmDelete.type === 'plot') {
      deletePlot(confirmDelete.id);
    } else if (confirmDelete.type === 'facility' && confirmDelete.plotId) {
      const targetPlot = plots.find((p) => p.id === confirmDelete.plotId);
      if (targetPlot) {
        const existingShapes = getPlotFacilities(targetPlot);
        const updatedShapes = existingShapes.filter((s) => s.id !== confirmDelete.id);
        const derivedTypes = updatedShapes.length > 0 
          ? Array.from(new Set(updatedShapes.map((s) => s.facilityType)))
          : ['net_house' as FacilityType];

        const totalAreaM2 = updatedShapes.reduce((sum, s) => sum + (s.areaM2 || (s.areaHa ? Math.round(s.areaHa * 10000) : 0)), 0);
        const totalAreaHa = Number((totalAreaM2 / 10000).toFixed(2));
        const totalPlantCount = updatedShapes.reduce((sum, s) => sum + (s.plantCount || 0), 0);

        const updatedPlot: Plot = {
          ...targetPlot,
          shapes: updatedShapes,
          facilityTypes: derivedTypes,
          facilityType: derivedTypes[0] || 'net_house',
          areaM2: totalAreaM2,
          areaHa: totalAreaHa > 0 ? totalAreaHa : targetPlot.areaHa,
          plantCount: totalPlantCount,
        };

        updatePlot(updatedPlot);
      }
    }
    setConfirmDelete(null);
  };

  // Facility Width & Length Change Handlers (auto-calculates Area = Width * Length)
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

  // Facility Actions (Add, Edit, Delete Net House or Open Field)
  const handleOpenAddFacility = (plotId?: string, defaultType: FacilityType = 'net_house') => {
    const targetPlotId = plotId || (filteredPlots[0]?.id || plots[0]?.id || '');
    const targetPlot = plots.find((p) => p.id === targetPlotId);
    const existingShapes = targetPlot ? getPlotFacilities(targetPlot) : [];
    const countOfType = existingShapes.filter((s) => s.facilityType === defaultType).length + 1;
    const defaultName = defaultType === 'net_house' ? `Net House ${countOfType}` : `Open Field ${countOfType}`;
    const defaultWidth = 10;
    const defaultLength = 40;
    const defaultAreaM2 = defaultWidth * defaultLength;
    const defaultPlants = 768;

    setFacilityModalPlotId(targetPlotId);
    setEditingFacility(null);
    setFacilityModalMode('add');
    setFacilityForm({
      name: defaultName,
      facilityType: defaultType,
      areaM2: defaultAreaM2,
      widthM: defaultWidth,
      lengthM: defaultLength,
      plantCount: defaultPlants,
      color: defaultType === 'net_house' ? '#15803D' : '#D97706',
      soilMoisture: targetPlot?.soilMoisture ?? 68,
      ambientTemp: targetPlot?.ambientTemp ?? 29.5,
      soilEc: targetPlot?.soilEc ?? 1.8,
      soilPh: targetPlot?.soilPh ?? 6.2,
      irrigationStatus: targetPlot?.irrigationStatus ?? 'off',
    });
    setFacilityModalOpen(true);
  };

  const handleOpenEditFacility = (plotId: string, facility: FacilityShape) => {
    const targetPlot = plots.find((p) => p.id === plotId);
    const areaM2 = facility.areaM2 !== undefined && facility.areaM2 > 0
      ? facility.areaM2
      : (facility.areaHa ? Math.round(facility.areaHa * 10000) : 400);
    const plantCount = facility.plantCount !== undefined ? facility.plantCount : '';

    // Extract width and length from facility
    let widthVal: number | string = '';
    let lengthVal: number | string = '';

    if (facility.name) {
      const match = facility.name.match(/(\d+(?:\.\d+)?)\s*m\s*[×x*X]\s*(\d+(?:\.\d+)?)\s*m/i);
      if (match) {
        widthVal = Math.round(Number(match[1]));
        lengthVal = Math.round(Number(match[2]));
      }
    }

    if (!widthVal || !lengthVal) {
      const dimStr = formatFacilityDimensions(facility);
      const match = dimStr.match(/(\d+(?:\.\d+)?)\s*mx\s*(\d+(?:\.\d+)?)\s*m/i);
      if (match) {
        widthVal = Math.round(Number(match[1]));
        lengthVal = Math.round(Number(match[2]));
      }
    }

    if (!widthVal || !lengthVal) {
      const numArea = typeof areaM2 === 'number' ? areaM2 : Number(areaM2) || 400;
      if (numArea === 400) {
        widthVal = 10;
        lengthVal = 40;
      } else if (numArea === 3600) {
        widthVal = 40;
        lengthVal = 90;
      } else {
        widthVal = 10;
        lengthVal = Math.round(numArea / 10) || 40;
      }
    }

    setFacilityModalPlotId(plotId);
    setEditingFacility(facility);
    setFacilityModalMode('edit');
    setFacilityForm({
      name: facility.name,
      facilityType: facility.facilityType,
      areaM2,
      widthM: widthVal || 10,
      lengthM: lengthVal || 40,
      plantCount,
      color: facility.color || (facility.facilityType === 'open_field' ? '#D97706' : '#15803D'),
      soilMoisture: facility.soilMoisture !== undefined ? facility.soilMoisture : (targetPlot?.soilMoisture ?? 68),
      ambientTemp: facility.ambientTemp !== undefined ? facility.ambientTemp : (targetPlot?.ambientTemp ?? 29.5),
      soilEc: facility.soilEc !== undefined ? facility.soilEc : (targetPlot?.soilEc ?? 1.8),
      soilPh: facility.soilPh !== undefined ? facility.soilPh : (targetPlot?.soilPh ?? 6.2),
      irrigationStatus: facility.irrigationStatus || (targetPlot?.irrigationStatus ?? 'off'),
    });
    setFacilityModalOpen(true);
  };

  const handleSaveFacility = (e: React.FormEvent) => {
    e.preventDefault();
    const targetPlot = plots.find((p) => p.id === facilityModalPlotId);
    if (!targetPlot) return;

    const existingShapes = getPlotFacilities(targetPlot);
    const inputAreaM2 =
      facilityForm.areaM2 === '' || isNaN(Number(facilityForm.areaM2))
        ? 0
        : Math.max(0, Math.round(Number(facilityForm.areaM2)));
    const inputAreaHa = inputAreaM2 > 0 ? Number((inputAreaM2 / 10000).toFixed(4)) : 0;
    const inputPlantCount =
      facilityForm.plantCount === '' || isNaN(Number(facilityForm.plantCount))
        ? 0
        : Math.max(0, Math.round(Number(facilityForm.plantCount)));

    const inputMoisture =
      facilityForm.soilMoisture === '' || isNaN(Number(facilityForm.soilMoisture))
        ? (targetPlot.soilMoisture ?? 68)
        : Math.max(0, Math.min(100, Number(facilityForm.soilMoisture)));
    const inputTemp =
      facilityForm.ambientTemp === '' || isNaN(Number(facilityForm.ambientTemp))
        ? (targetPlot.ambientTemp ?? 29.5)
        : Number(facilityForm.ambientTemp);
    const inputEc =
      facilityForm.soilEc === '' || isNaN(Number(facilityForm.soilEc))
        ? (targetPlot.soilEc ?? 1.8)
        : Math.max(0, Number(facilityForm.soilEc));
    const inputPh =
      facilityForm.soilPh === '' || isNaN(Number(facilityForm.soilPh))
        ? (targetPlot.soilPh ?? 6.2)
        : Math.max(0, Math.min(14, Number(facilityForm.soilPh)));
    const inputIrrigation = facilityForm.irrigationStatus || 'off';

    let updatedShapes: FacilityShape[];
    if (facilityModalMode === 'add') {
      const newShape: FacilityShape = {
        id: `shape-${targetPlot.id}-${Date.now()}`,
        name: facilityForm.name.trim() || (facilityForm.facilityType === 'net_house' ? 'Net House' : 'Open Field'),
        facilityType: facilityForm.facilityType,
        coords: [],
        areaM2: inputAreaM2,
        areaHa: inputAreaHa,
        plantCount: inputPlantCount,
        color: facilityForm.color,
        soilMoisture: inputMoisture,
        ambientTemp: inputTemp,
        soilEc: inputEc,
        soilPh: inputPh,
        irrigationStatus: inputIrrigation,
      };
      updatedShapes = [...existingShapes, newShape];
    } else if (editingFacility) {
      updatedShapes = existingShapes.map((s) =>
        s.id === editingFacility.id
          ? {
              ...s,
              name: facilityForm.name.trim() || s.name,
              facilityType: facilityForm.facilityType,
              areaM2: inputAreaM2,
              areaHa: inputAreaHa,
              plantCount: inputPlantCount,
              color: facilityForm.color,
              soilMoisture: inputMoisture,
              ambientTemp: inputTemp,
              soilEc: inputEc,
              soilPh: inputPh,
              irrigationStatus: inputIrrigation,
            }
          : s
      );
    } else {
      return;
    }

    const derivedTypes = Array.from(new Set(updatedShapes.map((s) => s.facilityType)));
    const totalAreaM2 = updatedShapes.reduce((sum, s) => sum + (s.areaM2 !== undefined ? s.areaM2 : (s.areaHa ? Math.round(s.areaHa * 10000) : 0)), 0);
    const totalAreaHa = Number((totalAreaM2 / 10000).toFixed(2));
    const totalPlantCount = updatedShapes.reduce((sum, s) => sum + (s.plantCount || 0), 0);

    const updatedPlot: Plot = {
      ...targetPlot,
      shapes: updatedShapes,
      facilityTypes: derivedTypes,
      facilityType: derivedTypes[0] || targetPlot.facilityType || 'net_house',
      areaM2: totalAreaM2,
      areaHa: totalAreaHa > 0 ? totalAreaHa : targetPlot.areaHa,
      plantCount: totalPlantCount,
    };

    updatePlot(updatedPlot);
    setFacilityModalOpen(false);
  };

  const handleToggleFacilityIrrigation = (plotId: string, facilityId: string) => {
    const targetPlot = plots.find((p) => p.id === plotId);
    if (!targetPlot) return;
    const existingShapes = getPlotFacilities(targetPlot);
    const updatedShapes = existingShapes.map((s) => {
      if (s.id === facilityId) {
        const current = s.irrigationStatus || targetPlot.irrigationStatus || 'off';
        const nextStatus: 'on' | 'off' = current === 'on' ? 'off' : 'on';
        return { ...s, irrigationStatus: nextStatus };
      }
      return s;
    });
    const anyOn = updatedShapes.some((s) => s.irrigationStatus === 'on');
    updatePlot({
      ...targetPlot,
      shapes: updatedShapes,
      irrigationStatus: anyOn ? 'on' : 'off',
    });
  };

  const handleDeleteFacility = (plotId: string, facilityId: string, facilityName: string) => {
    const targetPlot = plots.find((p) => p.id === plotId);
    setConfirmDelete({
      type: 'facility',
      id: facilityId,
      name: facilityName,
      plotId,
      plotName: targetPlot?.name || (language === 'km' ? 'រងដាំ' : 'Plot'),
    });
  };

  return (
    <div className="space-y-6 w-full pb-16">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-6 sm:p-7 rounded-3xl shadow-xl shadow-emerald-950/20 border border-emerald-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-emerald-500/10 to-transparent pointer-events-none" />
        
        <div className="relative z-10 space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold backdrop-blur-md mb-1">
            <Warehouse className="w-3.5 h-3.5" />
            <span>{language === 'km' ? 'ប្រព័ន្ធគ្រប់គ្រងចំការច្រើនកន្លែង & រងដាំ' : 'Multi-Farm & Plot Enterprise Architecture'}</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight">
            Farm & Plot Management / <span className="font-khmer text-emerald-300">គ្រប់គ្រងកសិដ្ឋាន & រងដាំ</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            {language === 'km' 
              ? 'គ្រប់គ្រងកសិដ្ឋានច្រើន រងដាំ ព្រំប្រទល់ផ្កាយរណប និងប្រភេទសំណង់ (ផ្ទះសំណាញ់ Net House & ចំការវាល Open Field)'
              : 'Orchestrate multiple agricultural farms, zoned plots, satellite polygons, and facility architectures (Net house & Open field).'}
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="relative z-10 flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleOpenAddFarm}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs backdrop-blur-md active:scale-95"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>{language === 'km' ? '+ បង្កើតកសិដ្ឋានថ្មី' : '+ New Farm'}</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddPlot}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-md shadow-emerald-900/30 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'km' ? '+ បន្ថែមរងដាំថ្មី' : '+ New Plot'}</span>
          </button>
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Total Farms */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold">{language === 'km' ? 'កសិដ្ឋានទាំងអស់' : 'Total Farms'}</span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{stats.totalFarmsCount}</span>
            <span className="text-xs font-medium text-slate-500">farms</span>
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold mt-1 block font-mono">
            {stats.totalFarmAreaM2.toLocaleString()} m² ({stats.totalFarmAreaHa.toFixed(1)} ha)
          </span>
        </div>

        {/* Total Plots */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold">{language === 'km' ? 'រងដាំសរុប' : 'Total Plots'}</span>
            <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{stats.totalPlotsCount}</span>
            <span className="text-xs font-medium text-slate-500">plots</span>
          </div>
          <span className="text-[11px] text-blue-700 font-semibold mt-1 block font-mono">
            {stats.totalPlotAreaM2.toLocaleString()} m² · {stats.totalPlotPlantCount.toLocaleString()} plants
          </span>
        </div>

        {/* Net House Facilities */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-emerald-200/80 bg-emerald-50/20 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
              <Warehouse className="w-3.5 h-3.5 text-emerald-600" />
              <span>Net House</span>
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
              {language === 'km' ? 'ផ្ទះសំណាញ់' : 'Protected'}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-800">{stats.netHouseCount}</span>
            <span className="text-xs font-medium text-slate-500">facilities</span>
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold mt-1 block font-mono">
            {stats.netHouseAreaM2.toLocaleString()} m² covered
          </span>
        </div>

        {/* Open Field Facilities */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-amber-200/80 bg-amber-50/20 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <Trees className="w-3.5 h-3.5 text-amber-600" />
              <span>Open Field</span>
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
              {language === 'km' ? 'ចំការវាល' : 'Outdoor'}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-800">{stats.openFieldCount}</span>
            <span className="text-xs font-medium text-slate-500">facilities</span>
          </div>
          <span className="text-[11px] text-amber-700 font-semibold mt-1 block font-mono">
            {stats.openFieldAreaM2.toLocaleString()} m² open
          </span>
        </div>

        {/* Hybrid Plots (Multi-Facility) */}
        <div className="col-span-2 lg:col-span-1 bg-white rounded-2xl p-4 sm:p-5 border border-purple-200/80 bg-purple-50/20 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-purple-600" />
              <span>Hybrid Plots</span>
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
              {language === 'km' ? 'ទាំងពីរ' : 'Multi-type'}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-purple-800">{stats.hybridCount}</span>
            <span className="text-xs font-medium text-slate-500">plots</span>
          </div>
          <span className="text-[11px] text-purple-700 font-semibold mt-1 block">
            {language === 'km' ? 'ផ្ទះសំណាញ់ & ចំការវាល' : 'Both facility types'}
          </span>
        </div>
      </div>

      {/* Main Feature Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-2xl w-fit">
          <button
            type="button"
            onClick={() => setActiveSubTab('plots')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'plots'
                ? 'bg-white text-emerald-800 shadow-xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{language === 'km' ? 'រងដាំ & ប្រភេទសំណង់' : 'Plots & Facilities'}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-mono">
              {filteredPlots.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('farms')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'farms'
                ? 'bg-white text-emerald-800 shadow-xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>{language === 'km' ? 'កសិដ្ឋានទាំងអស់' : 'Farms Overview'}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-800 font-mono">
              {farms.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('map')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'map'
                ? 'bg-white text-emerald-800 shadow-xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>{language === 'km' ? 'ផែនទីផ្កាយរណប' : 'Spatial GIS Map'}</span>
          </button>
        </div>

        {/* Farm Selector Pill */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 whitespace-nowrap">
            {language === 'km' ? 'ជ្រើសរើសកសិដ្ឋាន:' : 'Active Farm:'}
          </span>
          <select
            value={selectedFarmId}
            onChange={(e) => setSelectedFarmId(e.target.value)}
            className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-white text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 shadow-2xs"
          >
            <option value="all">
              {language === 'km' ? '✨ កសិដ្ឋានទាំងអស់ (All Farms)' : '✨ All Farms Overview'}
            </option>
            {farms.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* SUB-TAB 1: PLOTS & FACILITIES (CATALOG & LIST VIEWS) */}
      {activeSubTab === 'plots' && (
        <div className="space-y-4">
          {/* Filter, Search, Scope & Layout Toolbar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
            {/* Search Input */}
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={language === 'km' ? 'ស្វែងរកតាមឈ្មោះ កូដ ឬសំណង់...' : 'Search plot or facility name, code...'}
                value={plotSearchQuery}
                onChange={(e) => setPlotSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 outline-none focus:border-emerald-600 focus:bg-white transition-colors"
              />
              {plotSearchQuery && (
                <button
                  type="button"
                  onClick={() => setPlotSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Filter Pills, Scope & View Mode Controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Facility Filter Pills */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setFacilityFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    facilityFilter === 'all'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {language === 'km' ? 'ទាំងអស់' : 'All'}
                </button>

                <button
                  type="button"
                  onClick={() => setFacilityFilter('net_house')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    facilityFilter === 'net_house'
                      ? 'bg-emerald-700 text-white shadow-2xs'
                      : 'text-emerald-800 hover:bg-emerald-50'
                  }`}
                >
                  <Warehouse className="w-3 h-3" />
                  <span>{language === 'km' ? 'ផ្ទះសំណាញ់' : 'Net House'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFacilityFilter('open_field')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    facilityFilter === 'open_field'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'text-amber-800 hover:bg-amber-50'
                  }`}
                >
                  <Trees className="w-3 h-3" />
                  <span>{language === 'km' ? 'ចំការវាល' : 'Open Field'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFacilityFilter('both')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    facilityFilter === 'both'
                      ? 'bg-purple-700 text-white shadow-2xs'
                      : 'text-purple-800 hover:bg-purple-50'
                  }`}
                >
                  <Activity className="w-3 h-3" />
                  <span>{language === 'km' ? 'រួមបញ្ចូល' : 'Hybrid'}</span>
                </button>
              </div>

              {/* View Scope Switcher: Plots vs Facilities */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setViewScope('plots')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    viewScope === 'plots'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{language === 'km' ? 'រងដាំ & សំណង់' : 'Plots & Facilities'}</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700 font-mono">
                    {filteredPlots.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewScope('facilities')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    viewScope === 'facilities'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Warehouse className="w-3.5 h-3.5" />
                  <span>{language === 'km' ? 'សំណង់ទាំងអស់' : 'All Facilities'}</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-mono">
                    {allFlatFacilities.length}
                  </span>
                </button>
              </div>

              {/* View Layout Switcher: Catalog (Cards) vs List (Table) */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setViewLayout('catalog')}
                  title="Catalog View (Cards)"
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    viewLayout === 'catalog'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>{language === 'km' ? 'កាតាឡុក' : 'Catalog'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewLayout('list')}
                  title="List View (Table)"
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    viewLayout === 'list'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>{language === 'km' ? 'បញ្ជី' : 'List'}</span>
                </button>
              </div>

              {/* Quick Add Facility Button */}
              <button
                type="button"
                onClick={() => handleOpenAddFacility()}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-600" />
                <span>{language === 'km' ? '+ សំណង់' : '+ Facility'}</span>
              </button>
            </div>
          </div>

          {/* Empty State */}
          {((viewScope === 'plots' && filteredPlots.length === 0) || (viewScope === 'facilities' && allFlatFacilities.length === 0)) ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-2xs space-y-3">
              <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Warehouse className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                {language === 'km' ? 'មិនមានទិន្នន័យត្រូវនឹងលក្ខខណ្ឌស្វែងរកទេ' : 'No Items Found'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {language === 'km'
                  ? 'សូមសាកល្បងផ្លាស់ប្តូរការច្រោះកសិដ្ឋាន ឬប្រភេទសំណង់ ឬចុចប៊ូតុងខាងក្រោមដើម្បីបង្កើតរងដាំ ឬសំណង់ថ្មី។'
                  : 'Try modifying your farm filter or add a new plot or facility.'}
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleOpenAddPlot}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                >
                  {language === 'km' ? '+ បង្កើតរងដាំថ្មី' : '+ New Plot'}
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenAddFacility()}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  {language === 'km' ? '+ បន្ថែមសំណង់' : '+ Add Facility'}
                </button>
              </div>
            </div>
          ) : viewScope === 'plots' ? (
            /* ========================================================= */
            /* VIEW SCOPE: PLOTS & FACILITIES                            */
            /* ========================================================= */
            viewLayout === 'catalog' ? (
              /* --- A1. PLOTS CATALOG (CARDS) VIEW --- */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPlots.map((plot) => {
                  const assignedFarm = farms.find((f) => f.id === plot.farmId);
                  const plotFacilities = getPlotFacilities(plot);
                  const plotTotals = getPlotTotals(plot);
                  const isSelected = plot.id === selectedPlotId;

                  return (
                    <div
                      key={plot.id}
                      className={`bg-white rounded-3xl p-5 border transition-all duration-200 relative flex flex-col justify-between shadow-2xs hover:shadow-md ${
                        isSelected
                          ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                          : 'border-slate-200/80 hover:border-slate-300'
                      }`}
                    >
                      <div>
                        {/* Plot Card Top Header */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                                {plot.code}
                              </span>
                              {assignedFarm && (
                                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 truncate max-w-[140px]">
                                  {assignedFarm.name}
                                </span>
                              )}
                            </div>
                            <h3 className="text-base font-bold text-slate-900 mt-1">
                              {plot.name}
                            </h3>
                          </div>

                          {/* Color Badge / Irrigation Quick Toggle */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => toggleIrrigation(plot.id)}
                              title={plot.irrigationStatus === 'on' ? 'Irrigation Active' : 'Irrigation Off'}
                              className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                                plot.irrigationStatus === 'on'
                                  ? 'bg-cyan-500 text-white animate-pulse'
                                  : 'bg-slate-100 text-slate-400 hover:text-slate-600'
                              }`}
                            >
                              <Droplets className="w-3.5 h-3.5" />
                            </button>
                            <div
                              className="w-4 h-4 rounded-full border border-white shadow-2xs"
                              style={{ backgroundColor: plot.color || '#15803D' }}
                              title="Plot Map Color"
                            />
                          </div>
                        </div>

                        {/* General Plot Info: Total Area in m² & Plant Population from Facilities */}
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 mb-3 flex-wrap">
                          <span className="font-bold text-slate-900 font-mono">{plotTotals.totalAreaM2.toLocaleString()} m²</span>
                          <span className="text-[11px] text-slate-400">({plotTotals.totalAreaHa} ha)</span>
                          <span>·</span>
                          <span className="font-bold text-emerald-700 font-mono">{plotTotals.totalPlantCount.toLocaleString()} {language === 'km' ? 'ដើម' : 'plants'}</span>
                          <span>·</span>
                          <span className="capitalize font-semibold text-slate-700">
                            {plot.currentStage.replace('_', ' ')}
                          </span>
                        </div>

                        {/* ================================================== */}
                        {/* FACILITIES SECTION WITH ADD / EDIT / DELETE ACTION */}
                        {/* ================================================== */}
                        <div className="bg-slate-50/70 p-3 rounded-2xl border border-slate-100 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                              <Warehouse className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{language === 'km' ? 'សំណង់ក្នុងឡូត៍ (Facilities)' : 'Facilities'}</span>
                              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-mono font-bold">
                                {plotFacilities.length}
                              </span>
                            </span>

                            {/* Quick Add Facility buttons */}
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenAddFacility(plot.id, 'net_house')}
                                title="Add Net House to this plot"
                                className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-colors flex items-center gap-0.5 cursor-pointer"
                              >
                                <Plus className="w-2.5 h-2.5" />
                                <span>Net House</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenAddFacility(plot.id, 'open_field')}
                                title="Add Open Field to this plot"
                                className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors flex items-center gap-0.5 cursor-pointer"
                              >
                                <Plus className="w-2.5 h-2.5" />
                                <span>Open Field</span>
                              </button>
                            </div>
                          </div>

                          {/* Facilities chips */}
                          <div className="flex flex-wrap gap-1.5">
                            {plotFacilities.map((shape) => {
                              const isNet = shape.facilityType === 'net_house';
                              const shapeAreaM2 = shape.areaM2 || Math.round((shape.areaHa || 0.5) * 10000);
                              const shapePlants = shape.plantCount || 0;
                              return (
                                <div
                                  key={shape.id}
                                  className={`group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border shadow-2xs transition-all ${
                                    isNet
                                      ? 'bg-emerald-50 text-emerald-900 border-emerald-200/90'
                                      : 'bg-amber-50 text-amber-900 border-amber-200/90'
                                  }`}
                                >
                                  {isNet ? (
                                    <Warehouse className="w-3 h-3 text-emerald-600 shrink-0" />
                                  ) : (
                                    <Trees className="w-3 h-3 text-amber-600 shrink-0" />
                                  )}
                                  <span className="truncate max-w-[120px]">{shape.name}</span>
                                  <span className="text-[10px] opacity-75 font-mono">
                                    ({shapeAreaM2.toLocaleString()} m² · {shapePlants.toLocaleString()} {language === 'km' ? 'ដើម' : 'plants'})
                                  </span>

                                  {/* Edit & Delete Mini-buttons */}
                                  <div className="flex items-center gap-0.5 ml-0.5">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenEditFacility(plot.id, shape);
                                      }}
                                      title="Edit Facility"
                                      className="p-0.5 text-slate-400 hover:text-slate-800 hover:bg-white/80 rounded transition-colors"
                                    >
                                      <Edit3 className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteFacility(plot.id, shape.id, shape.name);
                                      }}
                                      title="Delete Facility"
                                      className="p-0.5 text-slate-400 hover:text-red-600 hover:bg-white/80 rounded transition-colors"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Telemetry micro-bar */}
                        <div className="grid grid-cols-4 gap-1.5 bg-slate-50 p-2 rounded-xl mt-3 text-center border border-slate-100">
                          <div>
                            <span className="block text-[9px] text-slate-400">Moisture</span>
                            <span className="text-xs font-bold text-slate-800">{plot.soilMoisture}%</span>
                          </div>
                          <div>
                            <span className="block text-[9px] text-slate-400">Temp</span>
                            <span className="text-xs font-bold text-slate-800">{plot.ambientTemp}°C</span>
                          </div>
                          <div>
                            <span className="block text-[9px] text-slate-400">EC</span>
                            <span className="text-xs font-bold text-slate-800">{plot.soilEc}</span>
                          </div>
                          <div>
                            <span className="block text-[9px] text-slate-400">pH</span>
                            <span className="text-xs font-bold text-slate-800">{plot.soilPh}</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => handleOpenShapeEditor(plot)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                        >
                          <Compass className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{language === 'km' ? 'ព្រំប្រទល់' : 'Boundary'}</span>
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditPlot(plot)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit Plot"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDelete({ type: 'plot', id: plot.id, name: plot.name })}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Plot"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* --- A2. PLOTS LIST (TABLE) VIEW WITH DEDICATED FACILITIES COLUMN --- */
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-3.5 px-4">{language === 'km' ? 'រងដាំ & កសិដ្ឋាន' : 'Plot & Farm'}</th>
                        {/* ========================================================================= */}
                        {/* FACILITIES (NET HOUSE / OPEN FIELD)                                       */}
                        {/* ========================================================================= */}
                        <th className="py-3.5 px-4 min-w-[260px]">
                          <span className="text-emerald-900 font-extrabold flex items-center gap-1">
                            <Warehouse className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{language === 'km' ? 'ប្រភេទសំណង់ (Net House / Open Field)' : 'Facilities (Net House / Open Field)'}</span>
                          </span>
                        </th>
                        <th className="py-3.5 px-4">{language === 'km' ? 'ផ្ទៃដីសរុប (m²) & ចំនួនដើមដាំ' : 'Total Area (m²) & Plant Population'}</th>
                        <th className="py-3.5 px-4">{language === 'km' ? 'ដំណាក់កាល' : 'Stage & Crop'}</th>
                        <th className="py-3.5 px-4 text-right">{language === 'km' ? 'សកម្មភាព' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredPlots.map((plot) => {
                        const assignedFarm = farms.find((f) => f.id === plot.farmId);
                        const plotFacilities = getPlotFacilities(plot);
                        const plotTotals = getPlotTotals(plot);
                        const isSelected = plot.id === selectedPlotId;

                        return (
                          <tr
                            key={plot.id}
                            className={`hover:bg-slate-50/80 transition-colors ${
                              isSelected ? 'bg-emerald-50/30' : ''
                            }`}
                          >
                            {/* Column 1: Plot & Farm */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                                  style={{ backgroundColor: plot.color || '#15803D' }}
                                />
                                <div>
                                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                    <span>{plot.name}</span>
                                    <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200">
                                      {plot.code}
                                    </span>
                                  </div>
                                  {assignedFarm && (
                                    <span className="text-[10px] text-emerald-700 font-medium">
                                      {assignedFarm.name}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Column 2: Facilities (Net House / Open Field) */}
                            <td className="py-3.5 px-4">
                              <div className="space-y-1.5">
                                {/* Facility Badges */}
                                <div className="flex flex-wrap items-center gap-1.5">
                                  {plotFacilities.map((shape) => {
                                    const isNet = shape.facilityType === 'net_house';
                                    const shapeAreaM2 = shape.areaM2 || Math.round((shape.areaHa || 0.5) * 10000);
                                    const shapePlants = shape.plantCount || 0;
                                    return (
                                      <div
                                        key={shape.id}
                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border shadow-2xs transition-all ${
                                          isNet
                                            ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                                            : 'bg-amber-50 text-amber-900 border-amber-200'
                                        }`}
                                      >
                                        {isNet ? (
                                          <Warehouse className="w-3 h-3 text-emerald-600 shrink-0" />
                                        ) : (
                                          <Trees className="w-3 h-3 text-amber-600 shrink-0" />
                                        )}
                                        <span className="font-semibold">{shape.name}</span>
                                        <span className="text-[10px] opacity-75 font-mono">
                                          ({shapeAreaM2.toLocaleString()} m² · {shapePlants.toLocaleString()} {language === 'km' ? 'ដើម' : 'plants'})
                                        </span>

                                        {/* Action buttons inside the badge */}
                                        <div className="flex items-center gap-0.5 ml-0.5">
                                          <button
                                            type="button"
                                            onClick={() => handleOpenEditFacility(plot.id, shape)}
                                            title="Edit Facility"
                                            className="p-0.5 text-slate-400 hover:text-slate-800 hover:bg-white/80 rounded transition-colors cursor-pointer"
                                          >
                                            <Edit3 className="w-3 h-3" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteFacility(plot.id, shape.id, shape.name)}
                                            title="Delete Facility"
                                            className="p-0.5 text-slate-400 hover:text-red-600 hover:bg-white/80 rounded transition-colors cursor-pointer"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Quick Add Shortcut Buttons right in this column */}
                                <div className="flex items-center gap-1.5 pt-0.5">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenAddFacility(plot.id, 'net_house')}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-100/70 hover:bg-emerald-200 text-emerald-800 transition-colors cursor-pointer"
                                  >
                                    <Plus className="w-2.5 h-2.5" />
                                    <span>+ Net House</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenAddFacility(plot.id, 'open_field')}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-100/70 hover:bg-amber-200 text-amber-800 transition-colors cursor-pointer"
                                  >
                                    <Plus className="w-2.5 h-2.5" />
                                    <span>+ Open Field</span>
                                  </button>
                                </div>
                              </div>
                            </td>

                            {/* Column 3: Total Area (m²) & Plant Population */}
                            <td className="py-3.5 px-4 font-mono">
                              <div className="font-bold text-slate-900 text-xs">
                                {plotTotals.totalAreaM2.toLocaleString()} m²
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {plotTotals.totalAreaHa} ha · <span className="font-semibold text-emerald-700">{plotTotals.totalPlantCount.toLocaleString()} {language === 'km' ? 'ដើម' : 'plants'}</span>
                              </div>
                            </td>

                            {/* Column 4: Crop Stage */}
                            <td className="py-3.5 px-4">
                              <span className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-700 capitalize">
                                {plot.currentStage.replace('_', ' ')}
                              </span>
                              {(plot.melonVarietyKm || plot.melonVarietyEn) && (
                                <div className="text-[10px] text-slate-400 font-khmer mt-0.5">
                                  {language === 'km' ? plot.melonVarietyKm : plot.melonVarietyEn}
                                </div>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenShapeEditor(plot)}
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                                  title="GIS Boundary Editor"
                                >
                                  <Compass className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>GIS</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditPlot(plot)}
                                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                  title="Edit Plot"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDelete({ type: 'plot', id: plot.id, name: plot.name })}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                  title="Delete Plot"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          ) : (
            /* ========================================================= */
            /* VIEW SCOPE: ALL FACILITIES (CATALOG & LIST VIEWS)         */
            /* ========================================================= */
            viewLayout === 'catalog' ? (
              /* --- B1. ALL FACILITIES CATALOG (CARDS) VIEW --- */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allFlatFacilities.map(({ facility, plot, farm }) => {
                  const isNet = facility.facilityType === 'net_house';
                  const hasBoundary = facility.coords && facility.coords.length >= 3;

                  return (
                    <div
                      key={facility.id}
                      className={`bg-white rounded-3xl p-5 border transition-all flex flex-col justify-between shadow-2xs hover:shadow-md ${
                        isNet
                          ? 'border-emerald-200/90 hover:border-emerald-400'
                          : 'border-amber-200/90 hover:border-amber-400'
                      }`}
                    >
                      <div>
                        {/* Top Header */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`p-2 rounded-xl ${isNet ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                              {isNet ? <Warehouse className="w-4 h-4" /> : <Trees className="w-4 h-4" />}
                            </div>
                            <div>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isNet ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}>
                                {isNet ? (language === 'km' ? 'ផ្ទះសំណាញ់ (Net House)' : 'Net House') : (language === 'km' ? 'ចំការវាល (Open Field)' : 'Open Field')}
                              </span>
                              <h3 className="text-base font-bold text-slate-900 mt-1">
                                {facility.name}
                              </h3>
                            </div>
                          </div>

                          <div
                            className="w-4 h-4 rounded-full border border-white shadow-2xs shrink-0"
                            style={{ backgroundColor: facility.color || (isNet ? '#15803D' : '#D97706') }}
                            title="Facility Color"
                          />
                        </div>

                        {/* Parent Plot & Farm badges */}
                        <div className="space-y-1.5 text-xs text-slate-600 mt-3 pt-3 border-t border-slate-100">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 font-semibold">{language === 'km' ? 'រងដាំមេ:' : 'Parent Plot:'}</span>
                            <span className="font-bold text-slate-800 flex items-center gap-1">
                              <Layers className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{plot.name} ({plot.code})</span>
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 font-semibold">{language === 'km' ? 'កសិដ្ឋាន:' : 'Farm:'}</span>
                            <span className="font-semibold text-slate-700 truncate max-w-[170px] flex items-center gap-1">
                              <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>{farm ? (language === 'km' && farm.nameKm ? farm.nameKm : farm.name) : 'Battambang Central Smart Farm'}</span>
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 font-semibold">{language === 'km' ? 'ផ្ទៃដី:' : 'Area:'}</span>
                            <span className="font-mono font-bold text-slate-900">
                              {(facility.areaM2 || Math.round((facility.areaHa || 0.5) * 10000)).toLocaleString()} m²
                              <span className="text-slate-400 font-normal text-[10px] ml-1">({formatFacilityDimensions(facility)})</span>
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 font-semibold">{language === 'km' ? 'ចំនួនដើមដាំ:' : 'Plant Population:'}</span>
                            <span className="font-mono font-bold text-emerald-700">
                              {(facility.plantCount || 0).toLocaleString()} {language === 'km' ? 'ដើម' : 'plants'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 font-semibold">{language === 'km' ? 'ស្ថានភាពព្រំប្រទល់:' : 'GIS Map Status:'}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              hasBoundary
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                              {hasBoundary
                                ? `✓ ${facility.coords.length} points`
                                : (language === 'km' ? 'មិនទាន់គូរ' : 'Pending Draw')}
                            </span>
                          </div>
                        </div>

                        {/* Telemetry micro-bar & Irrigation Quick Toggle */}
                        {(() => {
                          const fMoisture = facility.soilMoisture ?? plot.soilMoisture ?? 68;
                          const fTemp = facility.ambientTemp ?? plot.ambientTemp ?? 29.5;
                          const fEc = facility.soilEc ?? plot.soilEc ?? 1.8;
                          const fPh = facility.soilPh ?? plot.soilPh ?? 6.2;
                          const fIrrig = facility.irrigationStatus ?? plot.irrigationStatus ?? 'off';
                          const isIrrigOn = fIrrig === 'on';

                          return (
                            <div className="mt-3 pt-3 border-t border-slate-100">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                                  <Activity className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>{language === 'km' ? 'ឧបករណ៍ & ស្រោចស្រព' : 'Sensors & Irrigation'}</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleToggleFacilityIrrigation(plot.id, facility.id)}
                                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                    isIrrigOn
                                      ? 'bg-cyan-500 text-white animate-pulse shadow-xs'
                                      : 'bg-slate-100 text-slate-500 hover:text-slate-700 hover:bg-slate-200'
                                  }`}
                                  title={isIrrigOn ? 'Irrigation Active - Click to Stop' : 'Irrigation Inactive - Click to Start'}
                                >
                                  <Droplets className="w-3 h-3" />
                                  <span>{isIrrigOn ? 'ON' : 'OFF'}</span>
                                </button>
                              </div>

                              <div className="grid grid-cols-4 gap-1.5 bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
                                <div>
                                  <span className="block text-[9px] text-slate-400">Moisture</span>
                                  <span className="text-xs font-bold text-slate-800 font-mono">{fMoisture}%</span>
                                </div>
                                <div>
                                  <span className="block text-[9px] text-slate-400">Temp</span>
                                  <span className="text-xs font-bold text-slate-800 font-mono">{fTemp}°C</span>
                                </div>
                                <div>
                                  <span className="block text-[9px] text-slate-400">EC</span>
                                  <span className="text-xs font-bold text-slate-800 font-mono">{fEc}</span>
                                </div>
                                <div>
                                  <span className="block text-[9px] text-slate-400">pH</span>
                                  <span className="text-xs font-bold text-slate-800 font-mono">{fPh}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Footer Actions */}
                      <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => handleOpenShapeEditor(plot, facility.id)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Compass className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{language === 'km' ? 'កែព្រំប្រទល់' : 'Map Shape'}</span>
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditFacility(plot.id, facility)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit Facility"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteFacility(plot.id, facility.id, facility.name)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Facility"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* --- B2. ALL FACILITIES LIST (TABLE) VIEW --- */
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-3.5 px-4">{language === 'km' ? 'ឈ្មោះសំណង់' : 'Facility Name'}</th>
                        <th className="py-3.5 px-4">{language === 'km' ? 'ប្រភេទសំណង់' : 'Facility Type'}</th>
                        <th className="py-3.5 px-4">{language === 'km' ? 'រងដាំមេ' : 'Parent Plot'}</th>
                        <th className="py-3.5 px-4">{language === 'km' ? 'កសិដ្ឋាន' : 'Farm'}</th>
                        <th className="py-3.5 px-4">{language === 'km' ? 'ផ្ទៃដី (m²)' : 'Area (m²)'}</th>
                        <th className="py-3.5 px-4">{language === 'km' ? 'ចំនួនដើមដាំ' : 'Plant Population'}</th>
                        <th className="py-3.5 px-4">{language === 'km' ? 'ឧបករណ៍តាមដាន & ស្រោចស្រព' : 'Sensors & Irrigation'}</th>
                        <th className="py-3.5 px-4 text-right">{language === 'km' ? 'សកម្មភាព' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {allFlatFacilities.map(({ facility, plot, farm }) => {
                        const isNet = facility.facilityType === 'net_house';
                        const hasBoundary = facility.coords && facility.coords.length >= 3;
                        const facilityAreaM2 = facility.areaM2 || Math.round((facility.areaHa || 0.5) * 10000);
                        const facilityPlants = facility.plantCount || 0;
                        const fMoisture = facility.soilMoisture ?? plot.soilMoisture ?? 68;
                        const fTemp = facility.ambientTemp ?? plot.ambientTemp ?? 29.5;
                        const fEc = facility.soilEc ?? plot.soilEc ?? 1.8;
                        const fPh = facility.soilPh ?? plot.soilPh ?? 6.2;
                        const fIrrig = facility.irrigationStatus ?? plot.irrigationStatus ?? 'off';
                        const isIrrigOn = fIrrig === 'on';

                        return (
                          <tr key={facility.id} className="hover:bg-slate-50/80 transition-colors">
                            {/* Column 1: Facility Name */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                                  style={{ backgroundColor: facility.color || (isNet ? '#15803D' : '#D97706') }}
                                />
                                <span className="font-bold text-slate-900">{facility.name}</span>
                              </div>
                            </td>

                            {/* Column 2: Facility Type Badge */}
                            <td className="py-3.5 px-4">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border ${
                                isNet
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}>
                                {isNet ? <Warehouse className="w-3 h-3 text-emerald-600" /> : <Trees className="w-3 h-3 text-amber-600" />}
                                <span>{isNet ? 'Net House' : 'Open Field'}</span>
                              </span>
                            </td>

                            {/* Column 3: Parent Plot */}
                            <td className="py-3.5 px-4">
                              <span className="font-bold text-slate-800">{plot.name}</span>
                              <span className="font-mono text-[10px] ml-1 text-slate-500 font-bold">({plot.code})</span>
                            </td>

                            {/* Column 4: Farm */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-1.5">
                                <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span className="font-semibold text-slate-800">
                                  {farm ? (language === 'km' && farm.nameKm ? farm.nameKm : farm.name) : 'Battambang Central Smart Farm'}
                                </span>
                              </div>
                            </td>

                            {/* Column 5: Area (m²) */}
                            <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                              <div>{facilityAreaM2.toLocaleString()} m²</div>
                              <span className="text-[10px] text-slate-400 font-normal font-sans block">
                                ({formatFacilityDimensions(facility)})
                              </span>
                            </td>

                            {/* Column 6: Plant Population (NEW COLUMN) */}
                            <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                              {facilityPlants.toLocaleString()}
                              <span className="text-[10px] text-slate-500 font-sans font-normal ml-1">
                                {language === 'km' ? 'ដើម' : 'plants'}
                              </span>
                            </td>

                            {/* Column 7: Sensors & Irrigation */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleToggleFacilityIrrigation(plot.id, facility.id)}
                                  title={isIrrigOn ? 'Irrigation Active - Click to stop' : 'Irrigation Off - Click to start'}
                                  className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    isIrrigOn
                                      ? 'bg-cyan-500 text-white animate-pulse shadow-xs'
                                      : 'bg-slate-100 text-slate-400 hover:text-slate-600'
                                  }`}
                                >
                                  <Droplets className="w-3.5 h-3.5" />
                                </button>
                                <div className="text-[10px] text-slate-500 space-x-1 font-mono">
                                  <span className="font-bold text-slate-800">{fMoisture}%</span>
                                  <span>·</span>
                                  <span className="font-bold text-slate-800">{fTemp}°C</span>
                                  <span>·</span>
                                  <span>EC {fEc}</span>
                                  <span>·</span>
                                  <span>pH {fPh}</span>
                                </div>
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenShapeEditor(plot, facility.id)}
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                                  title="Open on GIS Map"
                                >
                                  <Compass className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Map</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditFacility(plot.id, facility)}
                                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                  title="Edit Facility"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteFacility(plot.id, facility.id, facility.name)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                  title="Delete Facility"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* SUB-TAB 2: FARMS OVERVIEW & SETTINGS */}
      {activeSubTab === 'farms' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Registered Agricultural Farms ({farms.length}) / <span className="font-khmer text-emerald-700">បញ្ជីកសិដ្ឋានទាំងអស់</span>
            </h2>
            <button
              type="button"
              onClick={handleOpenAddFarm}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'km' ? 'បង្កើតកសិដ្ឋានថ្មី' : 'Add Farm'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {farms.map((farm) => {
              const farmPlots = plots.filter((p) => p.farmId === farm.id);
              const isActive = selectedFarmId === farm.id;

              return (
                <div
                  key={farm.id}
                  className={`bg-white rounded-3xl p-5 border transition-all flex flex-col justify-between shadow-2xs ${
                    isActive
                      ? 'border-emerald-600 ring-2 ring-emerald-500/20'
                      : 'border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <div>
                    {/* Top Farm Header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <span className="font-mono text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                          {farm.code}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 mt-1">
                          {farm.name}
                        </h3>
                        {farm.nameKm && (
                          <p className="text-xs font-khmer text-slate-500 mt-0.5">
                            {farm.nameKm}
                          </p>
                        )}
                      </div>

                      <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                        <Building2 className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Location & Agronomist Info */}
                    <div className="space-y-1.5 text-xs text-slate-600 mt-3 pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{farm.location}</span>
                      </div>

                      {farm.leadAgronomist && (
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{farm.leadAgronomist} (Lead Agronomist)</span>
                        </div>
                      )}

                      {farm.contactPhone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{farm.contactPhone}</span>
                        </div>
                      )}
                    </div>

                    {/* Plots inside this Farm */}
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="font-bold text-slate-700">
                          Assigned Plots ({farmPlots.length})
                        </span>
                        <span className="font-semibold text-emerald-700">
                          {farm.totalAreaHa} ha area
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {farmPlots.length === 0 ? (
                          <span className="text-[11px] text-slate-400 italic">No plots created yet</span>
                        ) : (
                          farmPlots.map((p) => {
                            const pTypes = p.facilityTypes && p.facilityTypes.length > 0 ? p.facilityTypes : [p.facilityType];
                            return (
                              <span
                                key={p.id}
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                  pTypes.includes('net_house') && pTypes.includes('open_field')
                                    ? 'bg-purple-50 text-purple-800 border-purple-200'
                                    : pTypes.includes('net_house')
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                      : 'bg-amber-50 text-amber-800 border-amber-200'
                                }`}
                              >
                                {p.code}
                              </span>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-2 mt-5 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFarmId(farm.id);
                        setActiveSubTab('plots');
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isActive ? (language === 'km' ? 'កសិដ្ឋានសកម្ម' : 'Active Farm') : (language === 'km' ? 'ជ្រើសរើស' : 'Select Farm')}</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditFarm(farm)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit Farm"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete({ type: 'farm', id: farm.id, name: farm.name })}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Farm"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: SPATIAL GIS MAP */}
      {activeSubTab === 'map' && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
          {/* Header Row: Title & Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Compass className="w-4 h-4 text-emerald-700" />
                <span>Interactive Enterprise Spatial Map / <span className="font-khmer text-emerald-700">ផែនទីផ្កាយរណបកសិដ្ឋាន</span></span>
              </h3>
              <p className="text-xs text-slate-500">
                {language === 'km'
                  ? 'ផែនទីព្រំប្រទល់ផ្កាយរណបតាមកសិដ្ឋានសកម្ម រួមមានផ្ទះសំណាញ់ និងចំការវាល'
                  : 'Satellite boundary overlays tailored to the Active Farm Selected, with net house and open field facilities.'}
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setMapResetTrigger((prev) => prev + 1)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                title={language === 'km' ? 'តម្រង់ទិដ្ឋភាពទៅកសិដ្ឋានសកម្ម' : 'Fit & Center Active Farm'}
              >
                <Compass className="w-3.5 h-3.5 text-emerald-600" />
                <span>{language === 'km' ? 'តម្រង់ទិដ្ឋភាព' : 'Fit Farm'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const target = filteredPlots.find((p) => p.id === selectedPlotId) || filteredPlots[0] || plots[0];
                  if (target) handleOpenShapeEditor(target);
                }}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <Compass className="w-4 h-4" />
                <span>{language === 'km' ? 'បើកកម្មវិធីកែសម្រួលព្រំប្រទល់' : 'Open Boundary Editor'}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Active Farm Switcher & Summary Banner */}
          {(() => {
            const activeFarmObj = selectedFarmId !== 'all' ? farms.find((f) => f.id === selectedFarmId) || null : null;
            return (
              <div className="bg-gradient-to-r from-slate-50 via-emerald-50/40 to-slate-50 p-4 rounded-2xl border border-slate-200/90 flex flex-col md:flex-row md:items-center justify-between gap-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                        {language === 'km' ? 'កសិដ្ឋានសកម្ម' : 'Active Farm'}
                      </span>
                      {activeFarmObj ? (
                        <span className="font-mono text-[11px] font-bold text-slate-500">
                          {activeFarmObj.code}
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-slate-500">
                          {language === 'km' ? 'កសិដ្ឋានទាំងអស់ (ទិដ្ឋភាពទូទៅ)' : 'All Farms Overview'}
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-extrabold text-slate-900 mt-0.5">
                      {activeFarmObj
                        ? (language === 'km' && activeFarmObj.nameKm ? activeFarmObj.nameKm : activeFarmObj.name)
                        : (language === 'km' ? 'គ្រប់កសិដ្ឋានទាំងអស់ទូទាំងប្រទេស' : 'Enterprise Cross-Farm National View')}
                    </h4>
                    {activeFarmObj && (
                      <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span>📍 {activeFarmObj.location}</span>
                        <span>·</span>
                        <span>📐 {activeFarmObj.totalAreaHa} ha ({(activeFarmObj.totalAreaHa * 10000).toLocaleString()} m²)</span>
                        <span>·</span>
                        <span className="text-emerald-700 font-semibold">{filteredPlots.length} {language === 'km' ? 'រងដាំ' : 'plots'}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Farm Selector Dropdown */}
                <div className="flex items-center gap-2 shrink-0">
                  <label className="text-xs font-bold text-slate-600 whitespace-nowrap">
                    {language === 'km' ? 'ប្តូរកសិដ្ឋាន:' : 'Switch Farm:'}
                  </label>
                  <select
                    value={selectedFarmId}
                    onChange={(e) => {
                      setSelectedFarmId(e.target.value);
                      setMapResetTrigger((prev) => prev + 1);
                    }}
                    className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-white text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 shadow-2xs cursor-pointer"
                  >
                    <option value="all">
                      {language === 'km' ? '✨ កសិដ្ឋានទាំងអស់ (All Farms)' : '✨ All Farms Overview'}
                    </option>
                    {farms.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })()}

          {/* Map Container */}
          <div className="w-full h-[520px] rounded-2xl overflow-hidden border border-slate-200/90 shadow-inner bg-slate-950 relative">
            <SafeMapErrorBoundary
              fallback={
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-white bg-slate-900">
                  <AlertTriangle className="w-8 h-8 text-amber-400 mb-2" />
                  <p className="text-sm font-bold">Map Preview Unavailable</p>
                </div>
              }
            >
              <UnifiedFarmMap
                plots={filteredPlots}
                selectedPlotId={selectedPlotId}
                onSelectPlot={setSelectedPlotId}
                activeFarm={selectedFarmId !== 'all' ? farms.find((f) => f.id === selectedFarmId) || null : null}
                activeFarmId={selectedFarmId}
                resetTrigger={mapResetTrigger}
                className="w-full h-full"
              />
            </SafeMapErrorBoundary>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 1: ADD / EDIT FARM MODAL                       */}
      {/* ==================================================== */}
      {farmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  {editingFarm ? (language === 'km' ? 'កែសម្រួលកសិដ្ឋាន' : 'Edit Farm Profile') : (language === 'km' ? 'បង្កើតកសិដ្ឋានថ្មី' : 'Create New Farm')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setFarmModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveFarm} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Farm Name (English) *
                  </label>
                  <input
                    type="text"
                    required
                    value={farmForm.name}
                    onChange={(e) => setFarmForm({ ...farmForm, name: e.target.value })}
                    placeholder="e.g., Battambang Central Smart Farm"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1 font-khmer">
                    ឈ្មោះកសិដ្ឋាន (ភាសាខ្មែរ)
                  </label>
                  <input
                    type="text"
                    value={farmForm.nameKm}
                    onChange={(e) => setFarmForm({ ...farmForm, nameKm: e.target.value })}
                    placeholder="ឧ. កសិដ្ឋានបាត់ដំបងកណ្តាល"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-emerald-600 font-khmer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Farm Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={farmForm.code}
                    onChange={(e) => setFarmForm({ ...farmForm, code: e.target.value.toUpperCase() })}
                    placeholder="e.g., FARM-BTB-01"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-emerald-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Total Area (ha)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={farmForm.totalAreaHa}
                    onChange={(e) => setFarmForm({ ...farmForm, totalAreaHa: parseFloat(e.target.value) || 1 })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Location / Province *
                  </label>
                  <input
                    type="text"
                    required
                    value={farmForm.location}
                    onChange={(e) => setFarmForm({ ...farmForm, location: e.target.value })}
                    placeholder="e.g., Battambang Province, Cambodia"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Lead Agronomist
                  </label>
                  <input
                    type="text"
                    value={farmForm.leadAgronomist}
                    onChange={(e) => setFarmForm({ ...farmForm, leadAgronomist: e.target.value })}
                    placeholder="e.g., Sokha Farmer"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={farmForm.contactPhone}
                    onChange={(e) => setFarmForm({ ...farmForm, contactPhone: e.target.value })}
                    placeholder="+855 12 345 678"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setFarmModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingFarm ? 'Save Changes' : 'Create Farm'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 2: ADD / EDIT PLOT (WITH FACILITY TYPES)       */}
      {/* ==================================================== */}
      {plotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  {editingPlot ? (language === 'km' ? 'កែសម្រួលរងដាំ' : 'Edit Plot Configuration') : (language === 'km' ? 'បង្កើតរងដាំថ្មី' : 'Add New Plot')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPlotModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePlot} className="space-y-4">
              {/* Farm Assignment */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Assign to Farm *
                </label>
                <select
                  required
                  value={plotForm.farmId}
                  onChange={(e) => setPlotForm({ ...plotForm, farmId: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-emerald-600 font-medium"
                >
                  {farms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.code} - {f.location})
                    </option>
                  ))}
                </select>
              </div>

              {/* Plot Name & Code */}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Plot Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={plotForm.name}
                    onChange={(e) => setPlotForm({ ...plotForm, name: e.target.value })}
                    placeholder="e.g. Plot A (Net House 1)"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Plot Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={plotForm.code}
                    onChange={(e) => setPlotForm({ ...plotForm, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. NH-01 or OF-01"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-emerald-600 font-mono"
                  />
                </div>
              </div>

              {/* Facility Types Information Note */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 shrink-0 mt-0.5">
                  <Warehouse className="w-4 h-4" />
                </div>
                <div className="flex-1 text-xs">
                  <p className="font-bold text-emerald-950">
                    {language === 'km' ? 'ប្រភេទសំណង់ & រូបរាងលើផែនទី' : 'Facility Types on Map'}
                  </p>
                  <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                    {language === 'km'
                      ? 'ប្រភេទសំណង់ (ផ្ទះសំណាញ់ ឬ ចំការវាល) ត្រូវបានកំណត់ដោយផ្ទាល់តាមរយៈរូបរាងនៅលើផែនទី GIS ក្នុងផ្ទាំងកែសម្រួលព្រំប្រទល់។'
                      : 'Each shape on the map represents a facility (Net house or Open field). You can configure multiple facilities for this plot on the map.'}
                  </p>
                  {editingPlot && (
                    <button
                      type="button"
                      onClick={() => {
                        setPlotModalOpen(false);
                        handleOpenShapeEditor(editingPlot);
                      }}
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-800 transition-colors shadow-2xs"
                    >
                      <Compass className="w-3.5 h-3.5" />
                      <span>{language === 'km' ? 'បើកផ្ទាំងកែសម្រួលសំណង់លើផែនទី' : 'Configure Facility Shapes on Map'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Area & Plant Count */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      {language === 'km' ? 'ផ្ទៃដីសរុប (m²) *' : 'Total Area (m²) *'}
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      ≈ {(plotForm.areaHa || 1).toFixed(2)} ha
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={Math.round((plotForm.areaHa || 1) * 10000)}
                      onChange={(e) => {
                        const m2 = Math.max(0, parseInt(e.target.value) || 0);
                        setPlotForm({ ...plotForm, areaHa: Number((m2 / 10000).toFixed(2)) });
                      }}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-emerald-600 font-mono pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono">
                      m²
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'km' ? 'ចំនួនដើមដាំ (Plant Population)' : 'Plant Population'}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={plotForm.plantCount}
                      onChange={(e) => setPlotForm({ ...plotForm, plantCount: parseInt(e.target.value) || 0 })}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-emerald-600 font-mono pr-16"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      {language === 'km' ? 'ដើម' : 'plants'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Color Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Polygon Map Color
                </label>
                <div className="flex items-center gap-2">
                  {['#15803D', '#B91C1C', '#0D9488', '#4F46E5', '#CA8A04', '#D97706', '#334155'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setPlotForm({ ...plotForm, color })}
                      style={{ backgroundColor: color }}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        plotForm.color === color ? 'scale-125 ring-2 ring-slate-900 ring-offset-2' : 'hover:scale-110'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPlotModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!plotForm.name || !plotForm.code}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingPlot ? 'Update Plot' : 'Create Plot'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 3: CONFIRM DELETE MODAL                        */}
      {/* ==================================================== */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                {language === 'km' ? 'បញ្ជាក់ការលុប' : 'Confirm Deletion'}
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {confirmDelete.type === 'facility' ? (
                  language === 'km' ? (
                    <>
                      តើអ្នកពិតជាចង់លុបសំណង់ <strong className="text-slate-900 font-bold">{confirmDelete.name}</strong> ពី <strong className="text-slate-900 font-bold">{confirmDelete.plotName || 'រងដាំ'}</strong> មែនទេ? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។
                    </>
                  ) : (
                    <>
                      Are you sure you want to permanently delete facility <strong className="text-slate-900 font-bold">{confirmDelete.name}</strong> from <strong className="text-slate-900 font-bold">{confirmDelete.plotName || 'plot'}</strong>? This action cannot be undone.
                    </>
                  )
                ) : confirmDelete.type === 'farm' ? (
                  language === 'km' ? (
                    <>
                      តើអ្នកពិតជាចង់លុបកសិដ្ឋាន <strong className="text-slate-900 font-bold">{confirmDelete.name}</strong> មែនទេ?
                    </>
                  ) : (
                    <>
                      Are you sure you want to permanently delete farm <strong className="text-slate-900 font-bold">{confirmDelete.name}</strong>?
                    </>
                  )
                ) : (
                  language === 'km' ? (
                    <>
                      តើអ្នកពិតជាចង់លុបរងដាំ <strong className="text-slate-900 font-bold">{confirmDelete.name}</strong> មែនទេ?
                    </>
                  ) : (
                    <>
                      Are you sure you want to permanently delete plot <strong className="text-slate-900 font-bold">{confirmDelete.name}</strong>?
                    </>
                  )
                )}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                {language === 'km' ? 'បោះបង់' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirmed}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                {language === 'km' ? 'លុបចេញ' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 4: PLOT SHAPE & BOUNDARY GIS EDITOR            */}
      {/* ==================================================== */}
      {shapeEditorOpen && shapeEditorPlot && (
        <PlotShapeEditorModal
          plot={shapeEditorPlot}
          isOpen={shapeEditorOpen}
          initialShapeId={shapeEditorFacilityId}
          onClose={() => {
            setShapeEditorOpen(false);
            setShapeEditorPlot(null);
            setShapeEditorFacilityId(undefined);
          }}
        />
      )}

      {/* ==================================================== */}
      {/* MODAL 5: ADD / EDIT FACILITY (NET HOUSE / OPEN FIELD)*/}
      {/* ==================================================== */}
      {facilityModalOpen && (
        <div className="fixed inset-0 h-full w-full z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-50 overflow-hidden">
          <div 
            className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto"
            style={{ maxHeight: 'min(90vh, calc(100% - 2rem))' }}
          >
            {/* FROZEN HEADER */}
            <div className="shrink-0 px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between bg-white z-20">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl ${facilityForm.facilityType === 'net_house' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                  {facilityForm.facilityType === 'net_house' ? (
                    <Warehouse className="w-5 h-5 text-emerald-700" />
                  ) : (
                    <Trees className="w-5 h-5 text-amber-700" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                    {facilityModalMode === 'edit'
                      ? (language === 'km' ? 'កែសម្រួលសំណង់' : 'Edit Facility')
                      : (language === 'km' ? 'បន្ថែមសំណង់ថ្មី' : 'Add New Facility')}
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-slate-500">
                    {facilityForm.facilityType === 'net_house' ? 'Net House (ផ្ទះសំណាញ់)' : 'Open Field (ចំការវាល)'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFacilityModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* FORM WRAPPING SCROLLABLE BODY AND FROZEN FOOTER */}
            <form onSubmit={handleSaveFacility} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              {/* SCROLLABLE BODY */}
              <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-3.5 sm:py-4 space-y-3.5 sm:space-y-4 overscroll-contain">
                {/* Target Plot Assignment */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'km' ? 'រងដាំគោលដៅ (Target Plot) *' : 'Target Plot *'}
                  </label>
                  <select
                    required
                    value={facilityModalPlotId}
                    disabled={facilityModalMode === 'edit'}
                    onChange={(e) => setFacilityModalPlotId(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white disabled:bg-slate-50 outline-none focus:border-emerald-600 font-medium"
                  >
                    {plots.map((p) => {
                      const f = farms.find((farm) => farm.id === p.farmId);
                      return (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.code}) {f ? `· ${f.name}` : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Facility Type Selector (Net House vs Open Field) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {language === 'km' ? 'ប្រភេទសំណង់ (Facility Type) *' : 'Facility Type *'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFacilityForm({
                          ...facilityForm,
                          facilityType: 'net_house',
                          color: facilityForm.color === '#D97706' ? '#15803D' : facilityForm.color,
                        });
                      }}
                      className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                        facilityForm.facilityType === 'net_house'
                          ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 font-bold'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl shrink-0">
                        <Warehouse className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold leading-tight">Net House</div>
                        <div className="text-[10px] text-emerald-700 font-khmer">ផ្ទះសំណាញ់</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setFacilityForm({
                          ...facilityForm,
                          facilityType: 'open_field',
                          color: facilityForm.color === '#15803D' ? '#D97706' : facilityForm.color,
                        });
                      }}
                      className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                        facilityForm.facilityType === 'open_field'
                          ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20 text-amber-950 font-bold'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div className="p-2 bg-amber-100 text-amber-800 rounded-xl shrink-0">
                        <Trees className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold leading-tight">Open Field</div>
                        <div className="text-[10px] text-amber-700 font-khmer">ចំការវាល</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Facility Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'km' ? 'ឈ្មោះសំណង់ (Facility Name) *' : 'Facility Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={facilityForm.name}
                    onChange={(e) => setFacilityForm({ ...facilityForm, name: e.target.value })}
                    placeholder={facilityForm.facilityType === 'net_house' ? 'e.g. Net House 2 (40m × 90m)' : 'e.g. Open Field Zone B'}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                {/* 3 COLUMNS: Width (m), Length (m), Area (m²) [READ-ONLY] */}
                <div>
                  <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                    {/* Column 1: Width (m) */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-700 truncate" title="Width (m)">
                          {language === 'km' ? 'ទទឹង (m)' : 'Width (m)'}
                        </label>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={facilityForm.widthM}
                          onChange={(e) => handleFacilityWidthChange(e.target.value)}
                          placeholder="10"
                          className="w-full px-2.5 sm:px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 font-mono pr-6 sm:pr-7"
                        />
                        <span className="absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2 text-[10px] sm:text-[11px] font-bold text-slate-400 font-mono pointer-events-none">
                          m
                        </span>
                      </div>
                    </div>

                    {/* Column 2: Length (m) */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-700 truncate" title="Length (m)">
                          {language === 'km' ? 'បណ្តោយ (m)' : 'Length (m)'}
                        </label>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={facilityForm.lengthM}
                          onChange={(e) => handleFacilityLengthChange(e.target.value)}
                          placeholder="40"
                          className="w-full px-2.5 sm:px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 font-mono pr-6 sm:pr-7"
                        />
                        <span className="absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2 text-[10px] sm:text-[11px] font-bold text-slate-400 font-mono pointer-events-none">
                          m
                        </span>
                      </div>
                    </div>

                    {/* Column 3: Area (m²) - Read Only */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-700 truncate" title="Area (m²)">
                          {language === 'km' ? 'ផ្ទៃដី (m²)' : 'Area (m²)'}
                        </label>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          readOnly
                          value={facilityForm.areaM2}
                          placeholder="400"
                          className="w-full px-2.5 sm:px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-100/90 text-slate-800 font-bold font-mono outline-none cursor-not-allowed pr-7 sm:pr-8 select-all"
                          title="Calculated automatically from Width × Length"
                        />
                        <span className="absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2 text-[10px] sm:text-[11px] font-bold text-slate-500 font-mono pointer-events-none">
                          m²
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                    <span>
                      {language === 'km'
                        ? 'គណនាដោយស្វ័យប្រវត្តិ (ទទឹង × បណ្តោយ)'
                        : 'Auto-calculated (Width × Length)'}
                    </span>
                    {Number(facilityForm.areaM2) > 0 && (
                      <span className="font-mono font-semibold text-slate-600">
                        ≈ {((Number(facilityForm.areaM2) || 0) / 10000).toFixed(2)} ha
                      </span>
                    )}
                  </div>
                </div>

                {/* Plant Population (New Column / Input) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      {language === 'km' ? 'ចំនួនដើមដាំ (Plant Population)' : 'Plant Population'}
                      <span className="text-[10px] text-slate-400 font-normal ml-1 font-sans">
                        ({language === 'km' ? 'ស្រេចចិត្ត' : 'Optional'})
                      </span>
                    </label>
                    {Number(facilityForm.areaM2) > 0 && Number(facilityForm.plantCount) > 0 && (
                      <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 font-semibold">
                        {((Number(facilityForm.plantCount) / Number(facilityForm.areaM2)) * 100).toFixed(1)} plants / 100 m²
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={facilityForm.plantCount}
                      onChange={(e) =>
                        setFacilityForm({
                          ...facilityForm,
                          plantCount: e.target.value === '' ? '' : Math.max(0, Number(e.target.value)),
                        })
                      }
                      placeholder="e.g. 2800"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-emerald-600 font-mono pr-16"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      {language === 'km' ? 'ដើម' : 'plants'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {language === 'km'
                      ? 'ចំនួនដើមដាំក្នុងសំណង់នេះ នឹងត្រូវបូកបញ្ចូលជាចំនួនដើមដាំសរុបនៃរងដាំមេដោយស្វ័យប្រវត្តិ។'
                      : 'Plant population for this facility. Automatically applied to the total of the parent plot.'}
                  </p>
                </div>

                {/* Facility Telemetry & Sensors Manual Entry / Edit */}
                <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-xs font-bold text-slate-800">
                        {language === 'km' ? 'ឧបករណ៍តាមដាន & ស្រោចស្រព (Sensors & Irrigation)' : 'Sensors & Irrigation Telemetry'}
                      </span>
                    </div>
                    {/* Quick valve toggle */}
                    <button
                      type="button"
                      onClick={() =>
                        setFacilityForm({
                          ...facilityForm,
                          irrigationStatus: facilityForm.irrigationStatus === 'on' ? 'off' : 'on',
                        })
                      }
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                        facilityForm.irrigationStatus === 'on'
                          ? 'bg-cyan-500 text-white shadow-xs'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Droplets className={`w-3 h-3 ${facilityForm.irrigationStatus === 'on' ? 'animate-pulse' : ''}`} />
                      <span>{facilityForm.irrigationStatus === 'on' ? 'Valve ON' : 'Valve OFF'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {/* Moisture */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                        Moisture (%)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={facilityForm.soilMoisture}
                          onChange={(e) =>
                            setFacilityForm({
                              ...facilityForm,
                              soilMoisture: e.target.value === '' ? '' : Number(e.target.value),
                            })
                          }
                          placeholder="68"
                          className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-mono outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 pr-6"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 font-bold">
                          %
                        </span>
                      </div>
                    </div>

                    {/* Temp */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                        Temp (°C)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          min="-10"
                          max="60"
                          value={facilityForm.ambientTemp}
                          onChange={(e) =>
                            setFacilityForm({
                              ...facilityForm,
                              ambientTemp: e.target.value === '' ? '' : Number(e.target.value),
                            })
                          }
                          placeholder="29.5"
                          className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-mono outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 pr-6"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 font-bold">
                          °C
                        </span>
                      </div>
                    </div>

                    {/* EC */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                        EC (mS/cm)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="10"
                          value={facilityForm.soilEc}
                          onChange={(e) =>
                            setFacilityForm({
                              ...facilityForm,
                              soilEc: e.target.value === '' ? '' : Number(e.target.value),
                            })
                          }
                          placeholder="1.8"
                          className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-mono outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    {/* pH */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                        pH
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="14"
                          value={facilityForm.soilPh}
                          onChange={(e) =>
                            setFacilityForm({
                              ...facilityForm,
                              soilPh: e.target.value === '' ? '' : Number(e.target.value),
                            })
                          }
                          placeholder="6.2"
                          className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-mono outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    {language === 'km'
                      ? 'ទិន្នន័យឧបករណ៍ចាប់សញ្ញាជាក់ស្តែង (Moisture, Temp, EC, pH) សម្រាប់សំណង់នេះ។'
                      : 'Manual calibration or real-time sensor telemetry for this specific facility.'}
                  </p>
                </div>

                {/* Facility Color Swatches */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {language === 'km' ? 'ពណ៌សម្គាល់សំណង់' : 'Facility Indicator Color'}
                  </label>
                  <div className="flex items-center gap-2">
                    {['#15803D', '#D97706', '#0D9488', '#4F46E5', '#B91C1C', '#CA8A04', '#334155'].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFacilityForm({ ...facilityForm, color })}
                        style={{ backgroundColor: color }}
                        className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                          facilityForm.color === color
                            ? 'scale-125 ring-2 ring-slate-900 ring-offset-2'
                            : 'hover:scale-110'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* FROZEN FOOTER */}
              <div className="shrink-0 px-4 sm:px-6 py-3 sm:py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2.5 z-20 sticky bottom-0 shadow-xs">
                <button
                  type="button"
                  onClick={() => setFacilityModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200/80 rounded-xl cursor-pointer transition-colors"
                >
                  {language === 'km' ? 'បោះបង់' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={!facilityForm.name.trim()}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {facilityModalMode === 'edit'
                      ? (language === 'km' ? 'រក្សាទុកការផ្លាស់ប្តូរ' : 'Save Changes')
                      : (language === 'km' ? 'បង្កើតសំណង់' : 'Create Facility')}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
