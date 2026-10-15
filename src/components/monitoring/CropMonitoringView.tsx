import React, { useState, useRef, useMemo } from 'react';
import { 
  Activity, 
  Plus, 
  Wifi, 
  ClipboardEdit, 
  Droplets, 
  Thermometer, 
  Star, 
  Bug, 
  Camera, 
  Calendar,
  Image as ImageIcon,
  LayoutGrid,
  List,
  Eye,
  Edit3,
  Trash2,
  UploadCloud,
  FileText,
  X,
  Search,
  Paperclip,
  Check,
  AlertTriangle,
  User,
  ExternalLink,
  ShieldAlert,
  Wind,
  Warehouse,
  Trees,
  MapPin
} from 'lucide-react';
import { useI18n } from '../../locales/i18nContext';
import { useFarm } from '../../context/FarmContext';
import { MonitoringRecord, Plot, FacilityShape } from '../../types/melon';

interface AttachedFileItem {
  name: string;
  size: number;
  type: string;
  url: string;
}

const DEFAULT_STAGE_PHOTOS = [
  'https://images.unsplash.com/photo-1592417817098-8f3d6910985c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?auto=format&fit=crop&w=800&q=80',
];

// Helper to extract facility shapes or synthesize default facility from plot
const getPlotFacilities = (plot: Plot): FacilityShape[] => {
  if (plot.shapes && plot.shapes.length > 0) {
    return plot.shapes.map((s, idx) => {
      const areaM2 = s.areaM2 !== undefined && s.areaM2 > 0 
        ? s.areaM2 
        : (s.areaHa !== undefined && s.areaHa > 0 ? Math.round(s.areaHa * 10000) : 3600);
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

export const CropMonitoringView: React.FC = () => {
  const { t, language } = useI18n();
  const { 
    plots, 
    monitoringRecords, 
    addMonitoringRecord, 
    updateMonitoringRecord, 
    deleteMonitoringRecord 
  } = useFarm();

  // Layout View Mode ('catalog' | 'list')
  const [viewMode, setViewMode] = useState<'catalog' | 'list'>('list');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlotFilter, setSelectedPlotFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'sensor' | 'manual'>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'none' | 'low' | 'medium' | 'high'>('all');

  // Modals state
  const [showLogModal, setShowLogModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MonitoringRecord | null>(null);
  const [viewingRecord, setViewingRecord] = useState<MonitoringRecord | null>(null);
  const [confirmDeleteRecord, setConfirmDeleteRecord] = useState<MonitoringRecord | null>(null);

  // Form states
  const [plotId, setPlotId] = useState(plots[0]?.id || 'plot-a');
  const [facilityId, setFacilityId] = useState<string>('');
  const [source, setSource] = useState<'manual' | 'sensor'>('manual');
  const [soilMoisture, setSoilMoisture] = useState<number | string>(66);
  const [temperature, setTemperature] = useState<number | string>(32.5);
  const [humidity, setHumidity] = useState<number | string>(70);
  const [irrigationVolumeLiters, setIrrigationVolumeLiters] = useState<number | string>(600);
  const [pestObservationEn, setPestObservationEn] = useState('');
  const [pestObservationKm, setPestObservationKm] = useState('');
  const [pestSeverity, setPestSeverity] = useState<'none' | 'low' | 'medium' | 'high'>('none');
  const [attachments, setAttachments] = useState<AttachedFileItem[]>([]);
  const [plantHealthRating, setPlantHealthRating] = useState(5);
  const [notesEn, setNotesEn] = useState('');
  const [recordedBy, setRecordedBy] = useState('Sokha Farmer');
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Derived facilities for currently selected plot in form
  const currentPlot = useMemo(() => {
    return plots.find((p) => p.id === plotId) || plots[0];
  }, [plots, plotId]);

  const currentPlotFacilities = useMemo(() => {
    return currentPlot ? getPlotFacilities(currentPlot) : [];
  }, [currentPlot]);

  const selectedFacility = useMemo(() => {
    return currentPlotFacilities.find((f) => f.id === facilityId) || currentPlotFacilities[0];
  }, [currentPlotFacilities, facilityId]);

  const handlePlotSelectChange = (newPlotId: string) => {
    setPlotId(newPlotId);
    const targetPlot = plots.find((p) => p.id === newPlotId);
    if (targetPlot) {
      const facs = getPlotFacilities(targetPlot);
      const firstFac = facs[0];
      setFacilityId(firstFac?.id || '');
      if (!editingRecord && firstFac) {
        if (firstFac.soilMoisture !== undefined) setSoilMoisture(firstFac.soilMoisture);
        if (firstFac.ambientTemp !== undefined) setTemperature(firstFac.ambientTemp);
      }
    }
  };

  const handleFacilitySelectChange = (newFacilityId: string) => {
    setFacilityId(newFacilityId);
    if (currentPlot) {
      const facs = getPlotFacilities(currentPlot);
      const chosenFac = facs.find((f) => f.id === newFacilityId);
      if (!editingRecord && chosenFac) {
        if (chosenFac.soilMoisture !== undefined) setSoilMoisture(chosenFac.soilMoisture);
        if (chosenFac.ambientTemp !== undefined) setTemperature(chosenFac.ambientTemp);
      }
    }
  };

  // Filtered monitoring records
  const filteredRecords = useMemo(() => {
    return monitoringRecords.filter((rec) => {
      // 1. Plot Filter
      if (selectedPlotFilter !== 'all' && rec.plotId !== selectedPlotFilter) {
        return false;
      }
      // 2. Source Filter
      if (sourceFilter !== 'all' && rec.source !== sourceFilter) {
        return false;
      }
      // 3. Severity Filter
      if (severityFilter !== 'all' && rec.pestSeverity !== severityFilter) {
        return false;
      }
      // 4. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const plot = plots.find((p) => p.id === rec.plotId);
        const facs = plot ? getPlotFacilities(plot) : [];
        const facility = facs.find((f) => f.id === rec.facilityId);
        const matchPlot = plot ? (plot.name.toLowerCase().includes(q) || plot.code.toLowerCase().includes(q)) : false;
        const matchFacility = facility ? facility.name.toLowerCase().includes(q) : false;
        const matchPest = (rec.pestObservationEn?.toLowerCase().includes(q) || rec.pestObservationKm?.toLowerCase().includes(q)) ?? false;
        const matchNotes = (rec.notesEn?.toLowerCase().includes(q) || rec.notesKm?.toLowerCase().includes(q)) ?? false;
        const matchRecorder = rec.recordedBy?.toLowerCase().includes(q) ?? false;
        if (!matchPlot && !matchFacility && !matchPest && !matchNotes && !matchRecorder) return false;
      }
      return true;
    });
  }, [monitoringRecords, selectedPlotFilter, sourceFilter, severityFilter, searchQuery, plots]);

  // Open modal in Create mode
  const handleOpenAddRecord = () => {
    setEditingRecord(null);
    const initialPlot = plots[0];
    const initialPlotId = initialPlot?.id || 'plot-a';
    setPlotId(initialPlotId);
    const facs = initialPlot ? getPlotFacilities(initialPlot) : [];
    const firstFac = facs[0];
    setFacilityId(firstFac?.id || '');
    setSource('manual');
    setSoilMoisture(firstFac?.soilMoisture ?? 66);
    setTemperature(firstFac?.ambientTemp ?? 32.5);
    setHumidity(70);
    setIrrigationVolumeLiters(600);
    setPestObservationEn('');
    setPestObservationKm('');
    setPestSeverity('none');
    setAttachments([]);
    setPlantHealthRating(5);
    setNotesEn('');
    setRecordedBy('Sokha Farmer');
    setShowLogModal(true);
  };

  // Open modal in Edit mode
  const handleOpenEditRecord = (rec: MonitoringRecord) => {
    setEditingRecord(rec);
    setPlotId(rec.plotId);
    const targetPlot = plots.find((p) => p.id === rec.plotId);
    const facs = targetPlot ? getPlotFacilities(targetPlot) : [];
    setFacilityId(rec.facilityId || facs[0]?.id || '');
    setSource(rec.source);
    setSoilMoisture(rec.soilMoisture);
    setTemperature(rec.temperature);
    setHumidity(rec.humidity);
    setIrrigationVolumeLiters(rec.irrigationVolumeLiters ?? 600);
    setPestObservationEn(rec.pestObservationEn || '');
    setPestObservationKm(rec.pestObservationKm || '');
    setPestSeverity(rec.pestSeverity || 'none');

    // Parse existing attachments
    if (rec.attachments && rec.attachments.length > 0) {
      setAttachments(
        rec.attachments.map((url, idx) => ({
          name: `Attachment ${idx + 1}`,
          size: 150000,
          type: url.startsWith('data:image') || url.includes('.jpg') || url.includes('.png') ? 'image/jpeg' : 'application/octet-stream',
          url,
        }))
      );
    } else if (rec.photoUrl) {
      setAttachments([
        {
          name: rec.photoCaption || 'Observation Photo',
          size: 180000,
          type: 'image/jpeg',
          url: rec.photoUrl,
        },
      ]);
    } else {
      setAttachments([]);
    }

    setPlantHealthRating(rec.plantHealthRating || 5);
    setNotesEn(rec.notesEn || '');
    setRecordedBy(rec.recordedBy || 'Sokha Farmer');
    setShowLogModal(true);
  };

  // File Upload Handlers (Drag & Drop or File Input)
  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    Array.from(fileList).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setAttachments((prev) => [
          ...prev,
          {
            name: file.name,
            size: file.size,
            type: file.type || 'image/jpeg',
            url: result,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveAttachment = (indexToRemove: number) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Save Record (Add or Update)
  const handleSaveRecord = (e: React.FormEvent) => {
    e.preventDefault();

    const attachmentUrls = attachments.map((a) => a.url);
    const primaryPhotoUrl = attachmentUrls[0] || (editingRecord?.photoUrl || '');

    if (editingRecord) {
      const updated: MonitoringRecord = {
        ...editingRecord,
        plotId,
        facilityId: facilityId || undefined,
        source,
        recordedBy,
        soilMoisture: Number(soilMoisture),
        temperature: Number(temperature),
        humidity: Number(humidity),
        irrigationVolumeLiters: Number(irrigationVolumeLiters),
        pestObservationEn: pestObservationEn.trim() || 'Routine observation conducted.',
        pestObservationKm: pestObservationKm.trim() || (pestObservationEn.trim() || 'ការត្រួតពិនិត្យជាប្រចាំ។'),
        pestSeverity,
        photoUrl: primaryPhotoUrl,
        photoCaption: attachments[0]?.name || editingRecord.photoCaption,
        attachments: attachmentUrls,
        plantHealthRating,
        notesEn: notesEn.trim(),
        notesKm: language === 'km' ? notesEn.trim() : (editingRecord?.notesKm || notesEn.trim()),
        notes: notesEn.trim(),
      };
      updateMonitoringRecord(updated);
    } else {
      addMonitoringRecord({
        plotId,
        facilityId: facilityId || undefined,
        recordedAt: new Date().toISOString(),
        recordedBy,
        source,
        soilMoisture: Number(soilMoisture),
        temperature: Number(temperature),
        humidity: Number(humidity),
        irrigationVolumeLiters: Number(irrigationVolumeLiters),
        pestObservationEn: pestObservationEn.trim() || 'Routine observation conducted.',
        pestObservationKm: pestObservationKm.trim() || (pestObservationEn.trim() || 'ការត្រួតពិនិត្យជាប្រចាំ។'),
        pestSeverity,
        photoUrl: primaryPhotoUrl,
        photoCaption: attachments[0]?.name || '',
        attachments: attachmentUrls,
        plantHealthRating,
        notesEn: notesEn.trim(),
        notesKm: notesEn.trim(),
        notes: notesEn.trim(),
      });
    }

    setShowLogModal(false);
    setEditingRecord(null);
  };

  // Confirm delete handler
  const handleConfirmDelete = () => {
    if (!confirmDeleteRecord) return;
    deleteMonitoringRecord(confirmDeleteRecord.id);
    if (viewingRecord?.id === confirmDeleteRecord.id) {
      setViewingRecord(null);
    }
    setConfirmDeleteRecord(null);
  };

  // Photo crop diary entries derived dynamically from actual Monitoring Records, Attached Files & Field Notes
  const photoDiaries = useMemo(() => {
    // Sort records descending by date
    const sorted = [...monitoringRecords].sort(
      (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
    );

    // Filter by selected plot if active, otherwise show all
    const filtered = selectedPlotFilter === 'all'
      ? sorted
      : sorted.filter((rec) => rec.plotId === selectedPlotFilter);

    return filtered.map((rec, idx) => {
      const plot = plots.find((p) => p.id === rec.plotId);
      const facs = plot ? getPlotFacilities(plot) : [];
      const facility = facs.find((f) => f.id === rec.facilityId);
      const plotName = plot 
        ? (facility ? `${plot.name} · ${facility.name}` : `${plot.name} (${plot.code})`)
        : 'Plot Zone';

      // Primary photo from Attached Files & Photo Evidence
      const primaryPhoto =
        rec.photoUrl ||
        (rec.attachments && rec.attachments.length > 0 ? rec.attachments[0] : null) ||
        DEFAULT_STAGE_PHOTOS[idx % DEFAULT_STAGE_PHOTOS.length];

      // Formatted date
      const dateFormatted = new Date(rec.recordedAt).toLocaleDateString(
        language === 'km' ? 'km-KH' : 'en-US',
        { year: 'numeric', month: 'short', day: 'numeric' }
      );

      // Field Notes & Observations
      const fieldNotes =
        (language === 'km' ? (rec.notesKm || rec.notesEn) : (rec.notesEn || rec.notesKm)) ||
        rec.notes ||
        rec.pestObservationEn ||
        (language === 'km'
          ? 'បានកត់ត្រាសុខភាពដំណាំ និងការស្រោចស្រពជាប្រចាំ។'
          : 'Routine crop health monitoring observation.');

      // Title & headline
      const titleEn = rec.pestObservationEn && rec.pestSeverity && rec.pestSeverity !== 'none'
        ? `Scouting: ${rec.pestObservationEn}`
        : (rec.notesEn?.split('.')[0] || 'Crop Health & Vegetative Reading');

      const titleKm = rec.pestObservationKm && rec.pestSeverity && rec.pestSeverity !== 'none'
        ? `ការពិនិត្យ: ${rec.pestObservationKm}`
        : (rec.notesKm?.split('។')[0] || 'កំណត់ត្រាសុខភាព និងការលូតលាស់');

      return {
        record: rec,
        titleEn,
        titleKm,
        date: dateFormatted,
        rawDate: rec.recordedAt,
        plotName,
        notes: fieldNotes,
        photoUrl: primaryPhoto,
        attachmentsCount: rec.attachments?.length || (rec.photoUrl ? 1 : 0),
        healthRating: rec.plantHealthRating,
        pestSeverity: rec.pestSeverity,
        pestObservation: language === 'km' ? (rec.pestObservationKm || rec.pestObservationEn) : (rec.pestObservationEn || rec.pestObservationKm),
        recorder: rec.recordedBy,
        source: rec.source,
      };
    });
  }, [monitoringRecords, selectedPlotFilter, plots, language]);

  return (
    <div className="space-y-6 w-full pb-16">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-6 rounded-3xl shadow-xl shadow-emerald-950/20 border border-emerald-800/40 relative overflow-hidden">
        <div className="space-y-1 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold backdrop-blur-xs border border-emerald-500/30">
            <Activity className="w-3.5 h-3.5" />
            <span>Telemetry & Field Scouting</span>
          </div>
          <h1 className="text-xl lg:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <span>Crop Monitoring & Diary</span>
            <span className="text-emerald-400 font-khmer text-lg font-bold">· តាមដានដំណាំ & កំណត់ហេតុរូបភាព</span>
          </h1>
          <p className="text-xs text-emerald-100/80 max-w-xl">
            {language === 'km' 
              ? 'កត់ត្រាសុខភាពដំណាំ សំណើមដី សីតុណ្ហភាព ការសង្កេតសត្វល្អិត និងរូបថតភស្តុតាងជាក់ស្តែង' 
              : 'Log field health observations, IoT sensor telemetry, pest scouting, and photographic growth diary.'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddRecord}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 rounded-2xl text-xs font-extrabold shadow-lg shadow-emerald-950/30 transition-all transform hover:-translate-y-0.5 cursor-pointer self-start sm:self-auto shrink-0 relative z-10"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>{language === 'km' ? 'កត់ត្រាទិន្នន័យថ្មី' : 'Log New Reading'}</span>
        </button>
      </div>

      {/* Distinction Header Banner: Sensor Telemetry vs Manual Scouting */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
              <Wifi className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block">
                {t('sensorTelemetry')}
              </span>
              <span className="text-[11px] text-slate-500">
                Calibrated soil moisture capacitance probes & climate sensors
              </span>
            </div>
          </div>
          <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200">
            LIVE SYNC
          </span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
              <ClipboardEdit className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block">
                {t('manualRecord')}
              </span>
              <span className="text-[11px] text-slate-500">
                Agronomist scouting walk-throughs & sticky trap inspections
              </span>
            </div>
          </div>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            VERIFIED LOGS
          </span>
        </div>
      </div>

      {/* Observation & Telemetry History Section */}
      <div className="space-y-4">
        {/* Filter, Search & Layout View Switcher Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={language === 'km' ? 'ស្វែងរកតាមរងដាំ អ្នកកត់ត្រា សត្វល្អិត ឬកំណត់ចំណាំ...' : 'Search plot, recorder, pest scouting or notes...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 outline-none focus:border-emerald-600 focus:bg-white transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Filters & View Switcher */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Plot Filter */}
            <select
              value={selectedPlotFilter}
              onChange={(e) => setSelectedPlotFilter(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 outline-none focus:border-emerald-600 shadow-2xs cursor-pointer"
            >
              <option value="all">{language === 'km' ? 'គ្រប់រងដាំ (All Plots)' : 'All Plots'}</option>
              {plots.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.code})
                </option>
              ))}
            </select>

            {/* Source Filter */}
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as any)}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 outline-none focus:border-emerald-600 shadow-2xs cursor-pointer"
            >
              <option value="all">{language === 'km' ? 'គ្រប់ប្រភព (All Sources)' : 'All Sources'}</option>
              <option value="sensor">Sensor Telemetry</option>
              <option value="manual">Manual Scouting</option>
            </select>

            {/* Pest Severity Filter */}
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as any)}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 outline-none focus:border-emerald-600 shadow-2xs cursor-pointer"
            >
              <option value="all">{language === 'km' ? 'កម្រិតសត្វល្អិត (Severity: All)' : 'Severity: All'}</option>
              <option value="none">None (គ្មាន)</option>
              <option value="low">Low (ទាប)</option>
              <option value="medium">Medium (មធ្យម)</option>
              <option value="high">High (ខ្ពស់)</option>
            </select>

            {/* View Mode Toggle: Catalog vs List */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode('catalog')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'catalog'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Catalog View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>{language === 'km' ? 'កាតាឡុក' : 'Catalog'}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="List (Table) View"
              >
                <List className="w-3.5 h-3.5" />
                <span>{language === 'km' ? 'បញ្ជី' : 'List'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* --- VIEW MODE 1: CATALOG VIEW (CARDS GRID) --- */}
        {viewMode === 'catalog' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
            {filteredRecords.map((rec) => {
              const plot = plots.find((p) => p.id === rec.plotId);
              const facs = plot ? getPlotFacilities(plot) : [];
              const facility = facs.find((f) => f.id === rec.facilityId) || (rec.facilityId ? undefined : facs[0]);
              const isSensor = rec.source === 'sensor';
              const hasAttachments = (rec.attachments && rec.attachments.length > 0) || !!rec.photoUrl;
              const photoThumbnail = rec.photoUrl || rec.attachments?.[0];

              return (
                <div
                  key={rec.id}
                  className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden flex flex-col justify-between hover:border-emerald-400/80 transition-all duration-200 group"
                >
                  <div>
                    {/* Photo / Visual Banner Header */}
                    {hasAttachments && photoThumbnail ? (
                      <div className="h-44 w-full relative bg-slate-900 overflow-hidden">
                        <img
                          src={photoThumbnail}
                          alt={rec.photoCaption || 'Crop monitoring photo'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        
                        {/* Top Badges */}
                        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider backdrop-blur-md flex items-center gap-1 text-white ${
                            isSensor ? 'bg-sky-600/80' : 'bg-emerald-600/80'
                          }`}>
                            {isSensor ? <Wifi className="w-3 h-3" /> : <ClipboardEdit className="w-3 h-3" />}
                            <span>{rec.source}</span>
                          </span>

                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-black/60 text-white backdrop-blur-md">
                            {new Date(rec.recordedAt).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Bottom Overlay Title */}
                        <div className="absolute bottom-3 left-3 right-3 text-white">
                          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                            <span className="font-mono text-[10px] font-bold text-emerald-300 block">{plot?.code}</span>
                            {facility && (
                              <span className="bg-black/60 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded border border-white/20 inline-flex items-center gap-1">
                                {facility.facilityType === 'open_field' ? <Trees className="w-2.5 h-2.5 text-amber-300" /> : <Warehouse className="w-2.5 h-2.5 text-emerald-300" />}
                                <span>{facility.name}</span>
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-bold truncate drop-shadow-sm">{plot?.name}</h4>
                        </div>
                      </div>
                    ) : (
                      /* Header without Photo */
                      <div className="p-4 border-b border-slate-100 flex items-start justify-between bg-gradient-to-r from-slate-50 to-white">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
                            style={{ backgroundColor: plot?.color || (isSensor ? '#0284C7' : '#15803D') }}
                          />
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono text-[10px] font-bold text-slate-400 block">{plot?.code}</span>
                              {facility && (
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border inline-flex items-center gap-1 ${
                                  facility.facilityType === 'open_field'
                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                }`}>
                                  {facility.facilityType === 'open_field' ? <Trees className="w-2.5 h-2.5 text-amber-600" /> : <Warehouse className="w-2.5 h-2.5 text-emerald-600" />}
                                  <span>{facility.name}</span>
                                </span>
                              )}
                            </div>
                            <h4 className="text-sm font-extrabold text-slate-900">{plot?.name}</h4>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                            isSensor ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {isSensor ? <Wifi className="w-3 h-3" /> : <ClipboardEdit className="w-3 h-3" />}
                            <span>{rec.source}</span>
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono block mt-1">
                            {new Date(rec.recordedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Card Body */}
                    <div className="p-4 space-y-3">
                      {/* Telemetry Sensor Metrics Strip */}
                      <div className="grid grid-cols-3 gap-2 bg-slate-50/80 p-2.5 rounded-2xl border border-slate-100 text-center">
                        <div>
                          <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Moisture</span>
                          <span className="text-xs font-bold text-slate-900 font-mono">{rec.soilMoisture}%</span>
                        </div>
                        <div>
                          <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Temp</span>
                          <span className="text-xs font-bold text-slate-900 font-mono">{rec.temperature}°C</span>
                        </div>
                        <div>
                          <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Humidity</span>
                          <span className="text-xs font-bold text-slate-900 font-mono">{rec.humidity}%</span>
                        </div>
                      </div>

                      {/* Plant Health Rating Stars */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium text-[11px] flex items-center gap-1">
                          <Activity className="w-3 h-3 text-emerald-600" />
                          <span>Health Rating:</span>
                        </span>
                        <div className="flex items-center gap-1">
                          <div className="flex text-amber-400">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3.5 h-3.5 ${star <= rec.plantHealthRating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                              />
                            ))}
                          </div>
                          <span className="font-mono font-bold text-slate-700 text-[11px] ml-0.5">
                            {rec.plantHealthRating}/5
                          </span>
                        </div>
                      </div>

                      {/* Pest Observation & Severity Badge */}
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100/90 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            <Bug className="w-3 h-3 text-amber-600" />
                            <span>Pest Scouting</span>
                          </span>
                          <span className={`px-2 py-0.2 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                            rec.pestSeverity === 'high'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : rec.pestSeverity === 'medium'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : rec.pestSeverity === 'low'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            {rec.pestSeverity || 'none'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-700 line-clamp-2 leading-relaxed">
                          {language === 'km' && rec.pestObservationKm ? rec.pestObservationKm : rec.pestObservationEn}
                        </p>
                      </div>

                      {/* Field Notes Snippet (if any) */}
                      {rec.notesEn && (
                        <p className="text-[10px] text-slate-400 italic line-clamp-1">
                          "{rec.notesEn}"
                        </p>
                      )}

                      {/* Recorder info */}
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>{rec.recordedBy || 'Agronomist'}</span>
                        </span>
                        {hasAttachments && (
                          <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                            <Paperclip className="w-3 h-3" />
                            <span>{rec.attachments?.length || 1} file(s)</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Footer Actions: View / Edit / Delete */}
                  <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setViewingRecord(rec)}
                      className="px-3 py-1.5 bg-white hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{language === 'km' ? 'មើលលម្អិត' : 'View'}</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditRecord(rec)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-colors cursor-pointer"
                        title={language === 'km' ? 'កែប្រែ' : 'Edit Record'}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setConfirmDeleteRecord(rec)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title={language === 'km' ? 'លុបចេញ' : 'Delete Record'}
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
          /* --- VIEW MODE 2: LIST (TABLE) VIEW --- */
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4">{language === 'km' ? 'កាលបរិច្ឆេទ & ម៉ោង' : 'Date & Time'}</th>
                    <th className="py-3.5 px-4">{language === 'km' ? 'រងដាំ' : 'Plot'}</th>
                    <th className="py-3.5 px-4">{language === 'km' ? 'ប្រភព' : 'Source'}</th>
                    <th className="py-3.5 px-4">{language === 'km' ? 'ឧបករណ៍តាមដាន (Moisture · Temp · Humidity)' : 'Telemetry Metrics'}</th>
                    <th className="py-3.5 px-4">{language === 'km' ? 'កម្រិតសុខភាព' : 'Health Rating'}</th>
                    <th className="py-3.5 px-4">{language === 'km' ? 'ការសង្កេតសត្វល្អិត' : 'Pest Observation'}</th>
                    <th className="py-3.5 px-4">{language === 'km' ? 'ឯកសារ/រូបថត' : 'Files / Photo'}</th>
                    <th className="py-3.5 px-4 text-right">{language === 'km' ? 'សកម្មភាព' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRecords.map((rec) => {
                    const plot = plots.find((p) => p.id === rec.plotId);
                    const facs = plot ? getPlotFacilities(plot) : [];
                    const facility = facs.find((f) => f.id === rec.facilityId) || (rec.facilityId ? undefined : facs[0]);
                    const isSensor = rec.source === 'sensor';
                    const hasAttachments = (rec.attachments && rec.attachments.length > 0) || !!rec.photoUrl;

                    return (
                      <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Column 1: Date & Time */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="font-mono font-bold text-slate-800 block text-xs">
                            {new Date(rec.recordedAt).toLocaleDateString()}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">
                            {new Date(rec.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>

                        {/* Column 2: Plot & Specific Facility */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: plot?.color || '#15803D' }}
                            />
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-slate-900 block">{plot?.name}</span>
                                <span className="font-mono text-[10px] text-slate-400 font-bold">({plot?.code})</span>
                              </div>
                              {facility && (
                                <div className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/80 mt-0.5">
                                  {facility.facilityType === 'open_field' ? (
                                    <Trees className="w-2.5 h-2.5 text-amber-600" />
                                  ) : (
                                    <Warehouse className="w-2.5 h-2.5 text-emerald-600" />
                                  )}
                                  <span>{facility.name}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Column 3: Source */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border ${
                            isSensor
                              ? 'bg-sky-50 text-sky-800 border-sky-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}>
                            {isSensor ? <Wifi className="w-3 h-3 text-sky-600" /> : <ClipboardEdit className="w-3 h-3 text-emerald-600" />}
                            <span>{rec.source}</span>
                          </span>
                        </td>

                        {/* Column 4: Telemetry */}
                        <td className="py-3.5 px-4">
                          <div className="font-mono text-[11px] space-x-1.5 whitespace-nowrap">
                            <span className="font-bold text-slate-800">{rec.soilMoisture}% moist</span>
                            <span className="text-slate-300">·</span>
                            <span className="font-bold text-slate-800">{rec.temperature}°C</span>
                            <span className="text-slate-300">·</span>
                            <span className="text-slate-600">{rec.humidity}% hum</span>
                          </div>
                        </td>

                        {/* Column 5: Health Rating */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <div className="flex text-amber-400">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-3.5 h-3.5 ${star <= rec.plantHealthRating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                                />
                              ))}
                            </div>
                            <span className="font-mono font-bold text-slate-700 text-[11px] ml-1">
                              {rec.plantHealthRating}/5
                            </span>
                          </div>
                        </td>

                        {/* Column 6: Pest Observation */}
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider ${
                              rec.pestSeverity === 'high'
                                ? 'bg-red-100 text-red-800'
                                : rec.pestSeverity === 'medium'
                                ? 'bg-amber-100 text-amber-800'
                                : rec.pestSeverity === 'low'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {rec.pestSeverity || 'none'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-700 line-clamp-1">
                            {language === 'km' && rec.pestObservationKm ? rec.pestObservationKm : rec.pestObservationEn}
                          </p>
                        </td>

                        {/* Column 7: Files / Photo */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {hasAttachments ? (
                            <button
                              type="button"
                              onClick={() => setViewingRecord(rec)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200 transition-colors cursor-pointer"
                            >
                              <ImageIcon className="w-3 h-3 text-emerald-600" />
                              <span>{rec.attachments?.length || 1} file(s)</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-mono">—</span>
                          )}
                        </td>

                        {/* Column 8: Actions (View / Edit / Delete) */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setViewingRecord(rec)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                              title="View Details"
                            >
                              <Eye className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{language === 'km' ? 'មើល' : 'View'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenEditRecord(rec)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Edit Record"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setConfirmDeleteRecord(rec)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Record"
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
        )}
      </div>

      {/* Photo Crop Diary Section */}
      <div className="bg-white rounded-3xl p-6 shadow-2xs border border-slate-200/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl shrink-0">
              <Camera className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 flex-wrap">
                <span>Photographic Crop Diary</span>
                <span className="font-khmer text-emerald-700 text-sm font-bold">· កំណត់ហេតុរូបភាពលូតលាស់</span>
              </h3>
              <p className="text-xs text-slate-500">
                {language === 'km'
                  ? 'កំណត់ត្រារូបភាពភស្តុតាង និងកំណត់ចំណាំការសង្កេតជាក់ស្តែងពីការកត់ត្រាទិន្នន័យតាមដាន'
                  : 'Chronological visual records and field notes based on logged readings & photo evidence'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-mono font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200/80">
              {photoDiaries.length} {language === 'km' ? 'កំណត់ត្រា' : 'records'}
            </span>
            <button
              type="button"
              onClick={handleOpenAddRecord}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{language === 'km' ? 'កត់ត្រាថ្មី' : 'Log Reading'}</span>
            </button>
          </div>
        </div>

        {photoDiaries.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 space-y-3">
            <Camera className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-600">
              {language === 'km' ? 'មិនទាន់មានកំណត់ហេតុរូបភាពនៅឡើយទេ' : 'No photo diary records found'}
            </p>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              {language === 'km'
                ? 'ចុចប៊ូតុង "កត់ត្រាថ្មី" ដើម្បីភ្ជាប់រូបភាព និងកត់ចំណាំការសង្កេតផ្ទាល់ដី។'
                : 'Click "Log Reading" to attach photo evidence and record field notes.'}
            </p>
            <button
              type="button"
              onClick={handleOpenAddRecord}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{language === 'km' ? 'កត់ត្រាទិន្នន័យថ្មី' : 'Log New Reading'}</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {photoDiaries.map((entry, idx) => (
              <div
                key={entry.record.id || idx}
                className="rounded-2xl border border-slate-200/90 overflow-hidden bg-white hover:border-emerald-400 hover:shadow-md transition-all flex flex-col justify-between group shadow-2xs"
              >
                {/* Photo Header with Real Image & Overlay Badges */}
                <div
                  onClick={() => setViewingRecord(entry.record)}
                  className="h-44 relative overflow-hidden bg-slate-900 cursor-pointer flex flex-col justify-between p-3 text-white"
                >
                  {entry.photoUrl ? (
                    <img
                      src={entry.photoUrl}
                      alt={language === 'km' ? entry.titleKm : entry.titleEn}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-teal-900 to-slate-900 flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-emerald-300/40" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/50 pointer-events-none" />

                  {/* Top Badges */}
                  <div className="flex justify-between items-start z-10">
                    <span className="text-[10px] font-bold font-mono bg-black/60 px-2 py-0.5 rounded-lg backdrop-blur-xs border border-white/20 text-white shadow-xs">
                      {entry.date}
                    </span>
                    <span className="text-[10px] font-bold bg-emerald-600/90 text-white px-2 py-0.5 rounded-md shadow-xs backdrop-blur-xs border border-emerald-400/30 flex items-center gap-1">
                      <Star className="w-2.5 h-2.5 fill-amber-300 text-amber-300" />
                      <span>{entry.healthRating} ★</span>
                    </span>
                  </div>

                  {/* Bottom Title on Photo */}
                  <div className="z-10 space-y-1">
                    {entry.attachmentsCount > 0 && (
                      <div className="inline-flex items-center gap-1 bg-black/60 backdrop-blur-xs text-[9px] font-mono font-bold text-emerald-300 px-1.5 py-0.5 rounded-md border border-white/10">
                        <Camera className="w-2.5 h-2.5" />
                        <span>{entry.attachmentsCount} {language === 'km' ? 'រូបភាព' : 'photo(s)'}</span>
                      </div>
                    )}
                    <p className="text-xs font-bold leading-snug drop-shadow-sm text-white line-clamp-1" title={language === 'km' ? entry.titleKm : entry.titleEn}>
                      {language === 'km' ? entry.titleKm : entry.titleEn}
                    </p>
                  </div>
                </div>

                {/* Card Body: Field Notes & Observations */}
                <div className="p-3.5 text-xs flex-1 flex flex-col justify-between bg-white space-y-2.5">
                  <div className="space-y-2">
                    {/* Pest Scouting Alert Pill if present */}
                    {entry.pestSeverity && entry.pestSeverity !== 'none' && (
                      <div className="p-2 rounded-xl bg-amber-50/90 border border-amber-200/80 flex items-start gap-1.5 text-[11px]">
                        <Bug className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1 font-bold text-amber-900 uppercase text-[9px]">
                            <span>{language === 'km' ? 'សត្វល្អិត:' : 'Pest:'}</span>
                            <span className={`px-1 rounded text-[8px] font-extrabold ${
                              entry.pestSeverity === 'high' ? 'bg-red-100 text-red-700' :
                              entry.pestSeverity === 'medium' ? 'bg-amber-200 text-amber-900' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {entry.pestSeverity}
                            </span>
                          </div>
                          <p className="text-amber-800 text-[10px] leading-tight line-clamp-1 mt-0.5">
                            {entry.pestObservation}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Field Notes & Observations */}
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                        {language === 'km' ? 'កំណត់ចំណាំ & ការសង្កេតផ្ទាល់ដី' : 'Field Notes & Observations'}
                      </span>
                      <p className="text-slate-700 text-[11px] leading-relaxed line-clamp-3">
                        {entry.notes}
                      </p>
                    </div>
                  </div>

                  {/* Card Footer with Plot, Recorder & Actions */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div className="min-w-0 flex-1 pr-2">
                      <span className="font-bold text-slate-800 text-[11px] block truncate">{entry.plotName}</span>
                      <span className="text-[10px] text-slate-400 block truncate">
                        {entry.recorder}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setViewingRecord(entry.record)}
                        className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                        title={language === 'km' ? 'មើលលម្អិត' : 'View Details'}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEditRecord(entry.record)}
                        className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title={language === 'km' ? 'កែសម្រួល' : 'Edit Reading'}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ==================================================== */}
      {/* MODAL 1: ADD / EDIT LOG READING MODAL                */}
      {/* ==================================================== */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* FROZEN HEADER */}
            <div className="shrink-0 px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white z-10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <Activity className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {editingRecord 
                      ? (language === 'km' ? 'កែប្រែកំណត់ត្រាតាមដាន' : 'Edit Monitoring Reading') 
                      : (language === 'km' ? 'កត់ត្រាទិន្នន័យតាមដានថ្មី' : 'Log New Reading')}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {language === 'km' 
                      ? 'បំពេញទិន្នន័យឧបករណ៍ចាប់សញ្ញា ការសង្កេតសត្វល្អិត និងភ្ជាប់រូបថត' 
                      : 'Record telemetry, scouting observations, pest status, and attach files'}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowLogModal(false)} 
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* FORM WRAPPING SCROLLABLE BODY AND FROZEN FOOTER */}
            <form onSubmit={handleSaveRecord} className="flex flex-col flex-1 min-h-0">
              {/* SCROLLABLE BODY */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {/* 1. Target Plot, Specific Facility & Data Source */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* Target Plot Selection */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{language === 'km' ? 'រងដាំគោលដៅ (Target Plot) *' : 'Target Plot *'}</span>
                    </label>
                    <select
                      value={plotId}
                      onChange={(e) => handlePlotSelectChange(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-emerald-600 font-medium cursor-pointer shadow-2xs"
                      required
                    >
                      {plots.map((p) => {
                        const facs = getPlotFacilities(p);
                        return (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.code}) — {facs.length} {language === 'km' ? 'សំណង់/រោង' : 'Facility(ies)'}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Specific Facility Selection */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <Warehouse className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{language === 'km' ? 'សំណង់/រោងជាក់លាក់ (Specific Facility) *' : 'Specific Facility *'}</span>
                    </label>
                    <select
                      value={facilityId || selectedFacility?.id || ''}
                      onChange={(e) => handleFacilitySelectChange(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-emerald-600 font-medium cursor-pointer shadow-2xs"
                      required
                    >
                      {currentPlotFacilities.map((f) => {
                        const isNet = f.facilityType === 'net_house';
                        return (
                          <option key={f.id} value={f.id}>
                            {f.name} — {isNet ? (language === 'km' ? 'ផ្ទះសំណាញ់' : 'Net House') : (language === 'km' ? 'ចំការវាល' : 'Open Field')} ({f.areaM2?.toLocaleString()} m²)
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Data Source Selection */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{language === 'km' ? 'ប្រភពទិន្នន័យ (Data Source) *' : 'Data Source *'}</span>
                    </label>
                    <select
                      value={source}
                      onChange={(e) => setSource(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-emerald-600 font-medium cursor-pointer shadow-2xs"
                    >
                      <option value="manual">{language === 'km' ? 'ការចុះត្រួតពិនិត្យផ្ទាល់ (Manual Scouting)' : 'Manual Field Scouting'}</option>
                      <option value="sensor">{language === 'km' ? 'ឧបករណ៍ចាប់សញ្ញា IoT (Sensor Telemetry)' : 'IoT Sensor Telemetry'}</option>
                    </select>
                  </div>
                </div>

                {/* Selected Facility Status Banner & Sensor Telemetry Sync */}
                {selectedFacility && (
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-50/90 via-teal-50/60 to-slate-50 border border-emerald-200/80 flex flex-wrap items-center justify-between gap-2.5 shadow-2xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`p-2 rounded-xl text-white shrink-0 ${
                        selectedFacility.facilityType === 'open_field' ? 'bg-amber-600' : 'bg-emerald-600'
                      }`}>
                        {selectedFacility.facilityType === 'open_field' ? (
                          <Trees className="w-4 h-4" />
                        ) : (
                          <Warehouse className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-xs text-slate-900 truncate">
                            {selectedFacility.name}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${
                            selectedFacility.facilityType === 'open_field'
                              ? 'bg-amber-100 text-amber-800 border-amber-200'
                              : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          }`}>
                            {selectedFacility.facilityType === 'open_field'
                              ? (language === 'km' ? 'ចំការវាល (Open Field)' : 'Open Field')
                              : (language === 'km' ? 'ផ្ទះសំណាញ់ (Net House)' : 'Net House')}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono block">
                          {selectedFacility.areaM2?.toLocaleString()} m² · {selectedFacility.plantCount?.toLocaleString()} {language === 'km' ? 'ដើម' : 'plants'}
                        </span>
                      </div>
                    </div>

                    {/* Sensor Readings & Sync Telemetry Button */}
                    <div className="flex items-center gap-2 flex-wrap ml-auto">
                      {(selectedFacility.soilMoisture !== undefined || selectedFacility.ambientTemp !== undefined || selectedFacility.soilEc !== undefined) ? (
                        <div className="flex items-center gap-2 font-mono text-[10px] sm:text-[11px] bg-white px-2.5 py-1 rounded-xl border border-emerald-200 text-slate-700 shadow-2xs">
                          {selectedFacility.soilMoisture !== undefined && (
                            <span className="text-blue-700 font-bold" title="Facility Soil Moisture">💧 {selectedFacility.soilMoisture}%</span>
                          )}
                          {selectedFacility.ambientTemp !== undefined && (
                            <span className="text-amber-700 font-bold" title="Facility Ambient Temp">🌡️ {selectedFacility.ambientTemp}°C</span>
                          )}
                          {selectedFacility.soilEc !== undefined && (
                            <span className="text-emerald-700 font-bold" title="Facility Soil EC">⚡ {selectedFacility.soilEc} EC</span>
                          )}
                          {selectedFacility.soilPh !== undefined && (
                            <span className="text-purple-700 font-bold" title="Facility Soil pH">🧪 {selectedFacility.soilPh} pH</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono">
                          {language === 'km' ? 'គ្មានទិន្នន័យឧបករណ៍ចាប់សញ្ញាផ្ទាល់' : 'No calibrated facility telemetry'}
                        </span>
                      )}
                      {(selectedFacility.soilMoisture !== undefined || selectedFacility.ambientTemp !== undefined) && (
                        <button
                          type="button"
                          onClick={() => {
                            if (selectedFacility.soilMoisture !== undefined) setSoilMoisture(selectedFacility.soilMoisture);
                            if (selectedFacility.ambientTemp !== undefined) setTemperature(selectedFacility.ambientTemp);
                          }}
                          className="px-2.5 py-1 text-[10px] font-bold text-emerald-700 hover:text-emerald-800 bg-white hover:bg-emerald-100/50 rounded-lg border border-emerald-200 transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
                          title={language === 'km' ? 'ទាញទិន្នន័យពីសំណង់នេះ' : 'Sync baseline readings from facility'}
                        >
                          <Droplets className="w-3 h-3 text-blue-500" />
                          <span>{language === 'km' ? 'ភ្ជាប់ទិន្នន័យ' : 'Sync Sensors'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. Telemetry Gauges: Moisture, Temp, Humidity, Irrigation */}
                <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80 space-y-2">
                  <span className="text-[11px] font-bold text-slate-700 block">
                    {language === 'km' ? 'ទិន្នន័យបរិស្ថាន & ស្រោចស្រព' : 'Environmental & Telemetry Readings'}
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Moisture (%)</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="100"
                          value={soilMoisture}
                          onChange={(e) => setSoilMoisture(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-emerald-600 font-mono pr-6"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">%</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Temp (°C)</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          min="-10"
                          max="60"
                          value={temperature}
                          onChange={(e) => setTemperature(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-emerald-600 font-mono pr-6"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">°C</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Humidity (%)</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="1"
                          min="0"
                          max="100"
                          value={humidity}
                          onChange={(e) => setHumidity(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-emerald-600 font-mono pr-6"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">%</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Irrigation (L)</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="10"
                          min="0"
                          value={irrigationVolumeLiters}
                          onChange={(e) => setIrrigationVolumeLiters(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-emerald-600 font-mono pr-6"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">L</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. PEST OBSERVATION (Moved to above Attach File & Plant Health Rating) */}
                <div className="space-y-2 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Bug className="w-3.5 h-3.5 text-amber-600" />
                      <span>{language === 'km' ? 'ការសង្កេតសត្វល្អិត & ជំងឺ (Pest Observation)' : 'Pest & Disease Observation'}</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-sans">
                      {language === 'km' ? 'ជ្រើសកម្រិត និងពិពណ៌នា' : 'Severity level & description'}
                    </span>
                  </div>

                  {/* Pest Severity Selector Pills */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-500">{language === 'km' ? 'កម្រិត:' : 'Severity:'}</span>
                    <div className="flex items-center gap-1.5">
                      {(['none', 'low', 'medium', 'high'] as const).map((sev) => (
                        <button
                          key={sev}
                          type="button"
                          onClick={() => setPestSeverity(sev)}
                          className={`px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                            pestSeverity === sev
                              ? sev === 'high'
                                ? 'bg-red-600 text-white border-red-700 shadow-xs'
                                : sev === 'medium'
                                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                                : sev === 'low'
                                ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                                : 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {sev}
                        </button>
                      ))}
                    </div>
                  </div>

                  <input
                    type="text"
                    value={pestObservationEn}
                    onChange={(e) => setPestObservationEn(e.target.value)}
                    placeholder={language === 'km' ? 'ឧ. មិនមានសត្វល្អិតបង្កគ្រោះថ្នាក់។ បន្ទះអន្ទាក់ស្អិតពណ៌លឿងដំណើរការល្អ។' : 'e.g. Minimal pest activity. Aphid trap count: 2. No powdery mildew observed.'}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                {/* 4. ATTACH FILE FEATURE WITH DRAG & DROP OR UPLOAD (Placed ABOVE Plant Health Rating) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{language === 'km' ? 'ឯកសារភ្ជាប់ & រូបថតភស្តុតាង' : 'Attached Files & Photo Evidence'}</span>
                      <span className="text-[10px] text-slate-400 font-normal font-sans">
                        ({language === 'km' ? 'ស្រេចចិត្ត' : 'Optional'})
                      </span>
                    </label>
                    {attachments.length > 0 && (
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-bold">
                        {attachments.length} {language === 'km' ? 'ឯកសារ' : 'file(s)'}
                      </span>
                    )}
                  </div>

                  {/* Drag and Drop Zone */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      handleFiles(e.dataTransfer.files);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 ${
                      isDragging
                        ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                        : 'border-slate-300 hover:border-emerald-500 bg-slate-50/60 hover:bg-emerald-50/20'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={(e) => handleFiles(e.target.files)}
                      className="hidden"
                    />
                    <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {language === 'km'
                          ? 'ទម្លាក់រូបថត ឬឯកសារនៅទីនេះ ឬចុចដើម្បីជ្រើសរើស'
                          : 'Drag and drop photos or files here, or click to browse'}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Supports JPG, PNG, WebP, PDF documents (Max 10MB)
                      </p>
                    </div>
                  </div>

                  {/* Attached Files List & Previews */}
                  {attachments.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                      {attachments.map((file, idx) => (
                        <div
                          key={idx}
                          className="relative group rounded-xl border border-slate-200 p-2 bg-white flex items-center gap-2 shadow-2xs overflow-hidden"
                        >
                          {file.type.startsWith('image/') || file.url.startsWith('data:image') ? (
                            <img
                              src={file.url}
                              alt={file.name}
                              className="w-10 h-10 rounded-lg object-cover shrink-0 border border-slate-100"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                              <FileText className="w-5 h-5" />
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-bold text-slate-800 truncate" title={file.name}>
                              {file.name}
                            </p>
                            <span className="text-[9px] text-slate-400 font-mono block">
                              {(file.size / 1024).toFixed(0)} KB
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveAttachment(idx);
                            }}
                            className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Remove file"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 5. PLANT HEALTH RATING (1-5 STARS) (Positioned directly BELOW Attach File) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      {language === 'km' ? 'កម្រិតសុខភាពដំណាំ (១-៥ ផ្កាយ) *' : 'Plant Health Rating (1-5 Stars) *'}
                    </label>
                    <span className="text-xs font-bold font-mono text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/80">
                      {plantHealthRating === 5
                        ? '5 Stars · Optimal Health'
                        : plantHealthRating === 4
                        ? '4 Stars · Good Health'
                        : plantHealthRating === 3
                        ? '3 Stars · Fair / Monitor'
                        : plantHealthRating === 2
                        ? '2 Stars · Warning Sign'
                        : '1 Star · Critical Alert'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setPlantHealthRating(star)}
                        className="p-1.5 rounded-xl hover:scale-110 transition-transform cursor-pointer focus:outline-none"
                      >
                        <Star
                          className={`w-7 h-7 ${
                            star <= plantHealthRating
                              ? 'text-amber-400 fill-amber-400 drop-shadow-xs'
                              : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs text-slate-500 font-medium ml-2">
                      {plantHealthRating} / 5 Stars
                    </span>
                  </div>
                </div>

                {/* 6. General Field Notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'km' ? 'កំណត់ចំណាំបន្ថែម (Field Notes / Agronomist Remarks)' : 'Field Notes & Observations'}
                    <span className="text-[10px] text-slate-400 font-normal ml-1 font-sans">
                      ({language === 'km' ? 'ស្រេចចិត្ត' : 'Optional'})
                    </span>
                  </label>
                  <textarea
                    rows={2}
                    value={notesEn}
                    onChange={(e) => setNotesEn(e.target.value)}
                    placeholder={language === 'km' ? 'កំណត់ចំណាំបន្ថែមអំពីការលូតលាស់ មែកខ្នែង ពណ៌ស្លឹក ឬការងារថែទាំ...' : 'Enter details about vine vigour, trellis balance, blossom reception, or foliar health...'}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                {/* 7. Recorded By */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'km' ? 'អ្នកកត់ត្រា (Recorded By) *' : 'Recorded By *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={recordedBy}
                    onChange={(e) => setRecordedBy(e.target.value)}
                    placeholder="e.g. Sokha Farmer / Agronomist"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-emerald-600 font-medium"
                  />
                </div>
              </div>

              {/* FROZEN FOOTER */}
              <div className="shrink-0 px-6 py-3.5 border-t border-slate-100 bg-slate-50/90 flex items-center justify-end gap-2.5 z-10">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200/80 rounded-xl cursor-pointer transition-colors"
                >
                  {language === 'km' ? 'បោះបង់' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {editingRecord 
                      ? (language === 'km' ? 'រក្សាទុកការផ្លាស់ប្តូរ' : 'Save Changes') 
                      : (language === 'km' ? 'កត់ត្រាទិន្នន័យ' : 'Save Entry')}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 2: VIEW MONITORING RECORD DETAIL MODAL         */}
      {/* ==================================================== */}
      {viewingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Header */}
            {(() => {
              const plot = plots.find((p) => p.id === viewingRecord.plotId);
              const facs = plot ? getPlotFacilities(plot) : [];
              const viewingFacility = facs.find((f) => f.id === viewingRecord.facilityId) || (viewingRecord.facilityId ? undefined : facs[0]);
              const isSensor = viewingRecord.source === 'sensor';
              const hasAttachments = (viewingRecord.attachments && viewingRecord.attachments.length > 0) || !!viewingRecord.photoUrl;

              return (
                <>
                  <div className="shrink-0 px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white z-10">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
                        style={{ backgroundColor: plot?.color || '#15803D' }}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-extrabold text-slate-900">{plot?.name}</h3>
                          <span className="font-mono text-xs font-bold text-slate-400">({plot?.code})</span>
                        </div>
                        {viewingFacility && (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                              viewingFacility.facilityType === 'open_field'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}>
                              {viewingFacility.facilityType === 'open_field' ? (
                                <Trees className="w-3 h-3 text-amber-600" />
                              ) : (
                                <Warehouse className="w-3 h-3 text-emerald-600" />
                              )}
                              <span>{viewingFacility.name}</span>
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ({viewingFacility.areaM2?.toLocaleString()} m² · {viewingFacility.plantCount?.toLocaleString()} plants)
                            </span>
                          </div>
                        )}
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {new Date(viewingRecord.recordedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold uppercase tracking-wider border ${
                        isSensor ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {isSensor ? <Wifi className="w-3.5 h-3.5" /> : <ClipboardEdit className="w-3.5 h-3.5" />}
                        <span>{viewingRecord.source}</span>
                      </span>

                      <button
                        type="button"
                        onClick={() => setViewingRecord(null)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {/* Visual Photos / Attached Media */}
                    {hasAttachments && (
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Attached Photos & Visual Documentation</span>
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {(viewingRecord.attachments && viewingRecord.attachments.length > 0 
                            ? viewingRecord.attachments 
                            : [viewingRecord.photoUrl || '']
                          ).map((url, idx) => (
                            <div key={idx} className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 group aspect-video">
                              <img
                                src={url}
                                alt={`Observation photo ${idx + 1}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Telemetry Metrics Grid */}
                    <div className="grid grid-cols-4 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200/80 text-center">
                      <div>
                        <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Moisture</span>
                        <span className="text-sm font-extrabold text-slate-900 font-mono">{viewingRecord.soilMoisture}%</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Temp</span>
                        <span className="text-sm font-extrabold text-slate-900 font-mono">{viewingRecord.temperature}°C</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Humidity</span>
                        <span className="text-sm font-extrabold text-slate-900 font-mono">{viewingRecord.humidity}%</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Irrigation</span>
                        <span className="text-sm font-extrabold text-slate-900 font-mono">{viewingRecord.irrigationVolumeLiters || 600} L</span>
                      </div>
                    </div>

                    {/* Plant Health Rating Card */}
                    <div className="p-3.5 rounded-2xl border border-amber-200/80 bg-amber-50/40 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">Plant Health Assessment</span>
                        <span className="text-[11px] text-slate-500">
                          {viewingRecord.plantHealthRating === 5 ? 'Optimal vegetative vigour' : 'Standard field condition'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="flex text-amber-400">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${star <= viewingRecord.plantHealthRating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                            />
                          ))}
                        </div>
                        <span className="font-mono font-bold text-slate-800 text-xs">
                          {viewingRecord.plantHealthRating}/5
                        </span>
                      </div>
                    </div>

                    {/* Pest Scouting Card */}
                    <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <Bug className="w-3.5 h-3.5 text-amber-600" />
                          <span>Pest Observation & Severity</span>
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          viewingRecord.pestSeverity === 'high'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : viewingRecord.pestSeverity === 'medium'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : viewingRecord.pestSeverity === 'low'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {viewingRecord.pestSeverity || 'none'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed font-medium">
                        {language === 'km' && viewingRecord.pestObservationKm ? viewingRecord.pestObservationKm : viewingRecord.pestObservationEn}
                      </p>
                    </div>

                    {/* Notes & Comments */}
                    {viewingRecord.notesEn && (
                      <div className="p-3.5 rounded-2xl border border-slate-200/80 bg-white space-y-1">
                        <span className="text-xs font-bold text-slate-700 block">Field Remarks / Agronomist Notes</span>
                        <p className="text-xs text-slate-600 leading-relaxed italic">
                          "{viewingRecord.notesEn}"
                        </p>
                      </div>
                    )}

                    {/* Recorder info */}
                    <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                      <span>Logged by: <strong className="text-slate-800">{viewingRecord.recordedBy || 'Agronomist'}</strong></span>
                      <span className="font-mono text-[11px]">ID: {viewingRecord.id}</span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="shrink-0 px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between z-10">
                    <button
                      type="button"
                      onClick={() => setViewingRecord(null)}
                      className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200/80 rounded-xl cursor-pointer"
                    >
                      {language === 'km' ? 'បិទ' : 'Close'}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const target = viewingRecord;
                          setViewingRecord(null);
                          handleOpenEditRecord(target);
                        }}
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{language === 'km' ? 'កែប្រែទិន្នន័យ' : 'Edit Entry'}</span>
                      </button>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 3: CONFIRM DELETE MODAL                        */}
      {/* ==================================================== */}
      {confirmDeleteRecord && (
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
                {(() => {
                  const delPlot = plots.find(p => p.id === confirmDeleteRecord.plotId);
                  const delFac = delPlot ? getPlotFacilities(delPlot).find(f => f.id === confirmDeleteRecord.facilityId) : undefined;
                  const targetLabel = delPlot 
                    ? (delFac ? `${delPlot.name} · ${delFac.name}` : delPlot.name)
                    : (language === 'km' ? 'រងដាំ' : 'plot');

                  return language === 'km' ? (
                    <>
                      តើអ្នកពិតជាចង់លុបកំណត់ត្រាតាមដាននៃ <strong className="text-slate-900 font-bold">{targetLabel}</strong> កាលពី <strong className="text-slate-900 font-bold">{new Date(confirmDeleteRecord.recordedAt).toLocaleDateString()}</strong> មែនទេ? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។
                    </>
                  ) : (
                    <>
                      Are you sure you want to permanently delete this monitoring record for <strong className="text-slate-900 font-bold">{targetLabel}</strong> recorded on <strong className="text-slate-900 font-bold">{new Date(confirmDeleteRecord.recordedAt).toLocaleDateString()}</strong>? This action cannot be undone.
                    </>
                  );
                })()}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteRecord(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                {language === 'km' ? 'បោះបង់' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                {language === 'km' ? 'លុបចេញ' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
