import React, { useState, useEffect } from 'react';
import { 
  Map as MapIcon, 
  List, 
  Droplets, 
  Thermometer, 
  Activity, 
  QrCode, 
  Power, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  Sprout,
  Layers,
  Compass,
  Plus,
  Minus,
  Maximize2,
  Sparkles,
  Info,
  PenTool
} from 'lucide-react';
import { useI18n } from '../../locales/i18nContext';
import { useFarm } from '../../context/FarmContext';
import { useMapSettings } from '../../context/MapSettingsContext';
import { UnifiedFarmMap } from './UnifiedFarmMap';
import { SafeMapErrorBoundary } from '../common/SafeMapErrorBoundary';
import { Plot } from '../../types/melon';
import { QRCodeModal } from '../common/QRCodeModal';
import { PlotShapeEditorModal } from './PlotShapeEditorModal';
import { AddNewCropModal } from '../common/AddNewCropModal';
import L from 'leaflet';

export const FieldMapView: React.FC = () => {
  const { t, language } = useI18n();
  const { plots, selectedPlotId, setSelectedPlotId, toggleIrrigation, setActiveTab } = useFarm();
  const { provider, setMapProvider } = useMapSettings();

  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [mapType, setMapType] = useState<'hybrid' | 'roadmap' | 'satellite' | 'terrain'>('hybrid');
  const [resetTrigger, setResetTrigger] = useState(0);
  const [googleMapInstance, setGoogleMapInstance] = useState<google.maps.Map | null>(null);
  const [leafletInstance, setLeafletInstance] = useState<L.Map | null>(null);
  const [qrModalPlot, setQrModalPlot] = useState<Plot | null>(null);
  const [shapeEditorPlot, setShapeEditorPlot] = useState<Plot | null>(null);
  const [showAddCropModal, setShowAddCropModal] = useState(false);

  const activePlot = plots.find((p) => p.id === selectedPlotId) || plots[0];

  const handleZoomIn = () => {
    if (leafletInstance) {
      leafletInstance.zoomIn();
    } else if (googleMapInstance) {
      googleMapInstance.setZoom((googleMapInstance.getZoom() || 17) + 1);
    }
  };

  const handleZoomOut = () => {
    if (leafletInstance) {
      leafletInstance.zoomOut();
    } else if (googleMapInstance) {
      googleMapInstance.setZoom((googleMapInstance.getZoom() || 17) - 1);
    }
  };

  const handleResetFarmView = () => {
    setResetTrigger((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-slate-900">
            Field Map & Plots / <span className="font-khmer text-emerald-700">ផែនទីចំការ & រងដាំ</span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {language === 'km' 
              ? 'ផែនទីផ្កាយរណបពិតប្រាកដ បង្ហាញព្រំប្រទល់រងដាំ ផ្ទះសំណាញ់ និងស្ថានភាពស្រោចទឹក' 
              : 'Real high-resolution satellite imagery with plot boundaries, greenhouse telemetry, and valve controls'}
          </p>
        </div>

        {/* Action Buttons: Add Crop, Add/Edit Shape & View Mode Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowAddCropModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#164e22] hover:bg-[#123e1b] text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Sprout className="w-3.5 h-3.5" />
            <span>{language === 'km' ? 'ដាំដំណាំថ្មី' : '+ Plant Crop'}</span>
          </button>

          <button
            onClick={() => setShapeEditorPlot(activePlot)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <PenTool className="w-3.5 h-3.5 text-emerald-700" />
            <span>{language === 'km' ? 'កែសម្រួលរាង' : 'Edit Shape'}</span>
          </button>

          <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-semibold">
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'map' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5 text-emerald-700" />
              <span>
                {provider === 'google' 
                  ? (language === 'km' ? 'ផែនទី Google' : 'Google Map')
                  : provider === 'osm'
                    ? (language === 'km' ? 'ផែនទី OSM' : 'OpenStreetMap')
                    : (language === 'km' ? 'ផែនទី ArcGIS' : 'ArcGIS Online')}
              </span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'list' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>{language === 'km' ? 'បញ្ជីរងដាំ' : 'Plot List'}</span>
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'map' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Interactive Multi-Provider Field Map Canvas */}
          <div className="lg:col-span-8 bg-slate-900 rounded-2xl overflow-hidden shadow-xs border border-slate-200 relative min-h-[460px] md:min-h-[560px] flex flex-col">
            {/* Top Interactive Controls Bar */}
            <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
              
              <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
                {/* Provider Quick Switcher */}
                <div className="bg-white/95 backdrop-blur-md p-1 rounded-xl shadow-md border border-slate-200/80 flex items-center text-xs font-semibold text-slate-700">
                  <button
                    onClick={() => setMapProvider('google')}
                    className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                      provider === 'google' ? 'bg-emerald-800 text-white font-bold shadow-xs' : 'hover:bg-slate-100 text-slate-700'
                    }`}
                    title="Google Maps Platform"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    <span>Google</span>
                  </button>
                  <button
                    onClick={() => setMapProvider('osm')}
                    className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                      provider === 'osm' ? 'bg-teal-700 text-white font-bold shadow-xs' : 'hover:bg-slate-100 text-slate-700'
                    }`}
                    title="OpenStreetMap (100% Free)"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    <span>OSM</span>
                  </button>
                  <button
                    onClick={() => setMapProvider('arcgis')}
                    className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                      provider === 'arcgis' ? 'bg-blue-700 text-white font-bold shadow-xs' : 'hover:bg-slate-100 text-slate-700'
                    }`}
                    title="ArcGIS Online by Esri"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    <span>ArcGIS</span>
                  </button>
                </div>

                {/* Map Type Switcher */}
                <div className="bg-white/95 backdrop-blur-md p-1 rounded-xl shadow-md border border-slate-200/80 flex items-center text-xs font-semibold text-slate-700">
                  <button
                    onClick={() => setMapType('hybrid')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      mapType === 'hybrid' ? 'bg-slate-900 text-white font-bold shadow-xs' : 'hover:bg-slate-100'
                    }`}
                  >
                    {language === 'km' ? 'ផ្កាយរណប' : 'Satellite / Hybrid'}
                  </button>
                  <button
                    onClick={() => setMapType('roadmap')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      mapType === 'roadmap' ? 'bg-slate-900 text-white font-bold shadow-xs' : 'hover:bg-slate-100'
                    }`}
                  >
                    {language === 'km' ? 'ផែនទីធម្មតា' : 'Roadmap'}
                  </button>
                  <button
                    onClick={() => setMapType('terrain')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      mapType === 'terrain' ? 'bg-slate-900 text-white font-bold shadow-xs' : 'hover:bg-slate-100'
                    }`}
                  >
                    {language === 'km' ? 'ដីធ្លី' : 'Terrain'}
                  </button>
                </div>
              </div>

              {/* Zoom & Recenter Controls */}
              <div className="pointer-events-auto flex items-center gap-1.5">
                <button
                  onClick={handleResetFarmView}
                  className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-slate-200/80 text-xs font-bold text-slate-700 hover:text-emerald-800 hover:bg-white transition-all flex items-center gap-1.5"
                  title="Recenter on Melon Farm"
                >
                  <Compass className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{language === 'km' ? 'ចំការទាំងមូល' : 'Recenter Farm'}</span>
                </button>

                <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-md border border-slate-200/80 flex items-center p-0.5">
                  <button
                    onClick={handleZoomIn}
                    className="p-1.5 text-slate-600 hover:text-emerald-800 hover:bg-slate-100 rounded-lg transition-all"
                    title="Zoom in"
                    aria-label="Zoom in"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <div className="w-[1px] h-3.5 bg-slate-200" />
                  <button
                    onClick={handleZoomOut}
                    className="p-1.5 text-slate-600 hover:text-emerald-800 hover:bg-slate-100 rounded-lg transition-all"
                    title="Zoom out"
                    aria-label="Zoom out"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Dynamic Multi-Provider Map Canvas */}
            <div className="w-full h-full flex-1 relative min-h-[460px]">
              <SafeMapErrorBoundary>
                <UnifiedFarmMap
                  plots={plots}
                  selectedPlotId={selectedPlotId}
                  onSelectPlot={setSelectedPlotId}
                  mapType={mapType}
                  resetTrigger={resetTrigger}
                  onGoogleMapReady={(m) => setGoogleMapInstance(m)}
                  onLeafletMapReady={(m) => setLeafletInstance(m)}
                  className="w-full h-full min-h-[460px]"
                />
              </SafeMapErrorBoundary>

              {/* Bottom Map Legend */}
              <div className="absolute bottom-3 left-3 right-3 z-10 bg-black/80 backdrop-blur-md rounded-xl p-2.5 flex flex-wrap items-center justify-between text-xs text-white shadow-lg pointer-events-none">
                <div className="flex flex-wrap items-center gap-4 pointer-events-auto">
                  {plots.map((p) => (
                    <button
                      key={`legend-${p.id}`}
                      onClick={() => setSelectedPlotId(p.id)}
                      className={`flex items-center gap-1.5 hover:text-emerald-300 transition-colors ${
                        selectedPlotId === p.id ? 'font-bold text-emerald-300 underline' : 'text-slate-200'
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: p.color || '#10b981' }}
                      />
                      <span>
                        {p.name} ({p.currentStage.replace('_', ' ')})
                      </span>
                    </button>
                  ))}
                </div>
                <span className="text-slate-400 text-[11px] hidden sm:inline">
                  {language === 'km' ? 'ចុចលើរងដាំដើម្បីមើលព័ត៌មានលម្អិត' : 'Click any boundary or pin to inspect'}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Selected Plot Inspector Card */}
          <div className="lg:col-span-4 bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                    {activePlot.code} · {activePlot.facilityType === 'net_house' ? (language === 'km' ? 'ផ្ទះសំណាញ់' : 'Net House') : (language === 'km' ? 'ចំការវាល' : 'Open Field')}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                    {activePlot.name}
                  </h3>
                  <p className="text-xs text-emerald-800 font-semibold font-khmer">
                    {language === 'km' ? activePlot.melonVarietyKm : activePlot.melonVarietyEn}
                  </p>
                </div>

                <button
                  onClick={() => setQrModalPlot(activePlot)}
                  className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-xl transition-colors"
                  title="View Plot QR Code"
                >
                  <QrCode className="w-5 h-5" />
                </button>
              </div>

              {/* Status metrics grid */}
              <div className="grid grid-cols-2 gap-2.5 mt-5">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 mb-0.5">
                    <Droplets className="w-3.5 h-3.5 text-sky-500" />
                    <span>Soil Moisture</span>
                  </div>
                  <span className="text-lg font-extrabold text-slate-900 font-mono">
                    {activePlot.soilMoisture}%
                  </span>
                  <span className="block text-[10px] text-emerald-600 font-bold">Optimal</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 mb-0.5">
                    <Thermometer className="w-3.5 h-3.5 text-amber-500" />
                    <span>Temperature</span>
                  </div>
                  <span className="text-lg font-extrabold text-slate-900 font-mono">
                    {activePlot.ambientTemp}°C
                  </span>
                  <span className="block text-[10px] text-slate-400">Humidity: {activePlot.humidity}%</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 mb-0.5">
                    <Activity className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Health Score</span>
                  </div>
                  <span className="text-lg font-extrabold text-emerald-700 font-mono">
                    {activePlot.healthScore}/100
                  </span>
                  <span className="block text-[10px] text-slate-400">EC {activePlot.soilEc} · pH {activePlot.soilPh}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 mb-0.5">
                    <Sprout className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Current Stage</span>
                  </div>
                  <span className="text-xs font-bold text-slate-800 capitalize block truncate">
                    {activePlot.currentStage.replace('_', ' ')}
                  </span>
                  <span className="block text-[10px] text-slate-400">{activePlot.plantCount} plants</span>
                </div>
              </div>

              {/* Drip Irrigation Control */}
              <div className="mt-4 p-3.5 bg-sky-50/60 rounded-xl border border-sky-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Drip Irrigation Valve</span>
                  <span className="text-[10px] text-slate-500">
                    Next cycle at {activePlot.nextIrrigationTime}
                  </span>
                </div>
                <button
                  onClick={() => toggleIrrigation(activePlot.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activePlot.irrigationStatus === 'on'
                      ? 'bg-sky-600 text-white shadow-xs hover:bg-sky-700'
                      : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{activePlot.irrigationStatus === 'on' ? 'VALVE ON' : 'TURN ON'}</span>
                </button>
              </div>

              {/* Plot Boundary Shape Geometry Card */}
              <div className="mt-4 p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <PenTool className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Plot Boundary Shape</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                    {activePlot.polygonCoords ? `${activePlot.polygonCoords.length} corners · ${activePlot.areaHa} ha` : 'No custom shape'}
                  </span>
                </div>
                <button
                  onClick={() => setShapeEditorPlot(activePlot)}
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-emerald-800 border border-slate-200 rounded-lg text-xs font-bold transition-colors shadow-xs"
                >
                  {language === 'km' ? 'កែសម្រួលរាង' : 'Edit Shape'}
                </button>
              </div>

              {/* GPS Coordinates info */}
              {activePlot.center && (
                <div className="mt-4 p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 text-xs text-slate-600 flex items-center justify-between">
                  <span className="font-mono text-[11px] text-slate-500">
                    GPS: {activePlot.center.lat.toFixed(4)}°N, {activePlot.center.lng.toFixed(4)}°E
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-semibold">
                    Live Geofenced
                  </span>
                </div>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-between items-center">
              <button
                onClick={() => setShowAddCropModal(true)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800"
              >
                <Sprout className="w-3.5 h-3.5" />
                <span>{language === 'km' ? 'ដាំដំណាំថ្មីលើរងនេះ' : '+ Plant Crop Here'}</span>
              </button>

              <button
                onClick={() => {
                  setSelectedPlotId(activePlot.id);
                  setActiveTab('dashboard');
                }}
                className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-800"
              >
                <span>Filter Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
          <div className="divide-y divide-slate-100">
            {plots.map((plot) => (
              <div
                key={plot.id}
                className="p-5 hover:bg-slate-50/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div 
                    className="w-12 h-12 rounded-xl text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0"
                    style={{ backgroundColor: plot.color || '#164e22' }}
                  >
                    {plot.code}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{plot.name}</h3>
                    <p className="text-xs text-slate-500">
                      {language === 'km' ? plot.melonVarietyKm : plot.melonVarietyEn} · {plot.areaHa} ha ({plot.plantCount} plants)
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Droplets className="w-3 h-3 text-sky-500" />
                        Moisture: {plot.soilMoisture}%
                      </span>
                      <span className="flex items-center gap-1">
                        <Thermometer className="w-3 h-3 text-amber-500" />
                        Temp: {plot.ambientTemp}°C
                      </span>
                      <span className="text-emerald-700 font-semibold capitalize">
                        Stage: {plot.currentStage.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShapeEditorPlot(plot)}
                    className="px-3 py-2 border border-slate-200 rounded-xl text-slate-700 hover:text-emerald-700 hover:bg-slate-100 text-xs font-bold transition-colors flex items-center gap-1"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>{language === 'km' ? 'រាងដី' : 'Shape'}</span>
                  </button>
                  <button
                    onClick={() => setQrModalPlot(plot)}
                    className="p-2 border border-slate-200 rounded-xl text-slate-600 hover:text-emerald-700 hover:bg-slate-100 transition-colors"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedPlotId(plot.id);
                      setViewMode('map');
                    }}
                    className="px-3.5 py-2 bg-[#164e22] text-white rounded-xl text-xs font-semibold hover:bg-[#123e1b] transition-colors"
                  >
                    View on Real Map
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      <QRCodeModal
        plot={qrModalPlot}
        isOpen={!!qrModalPlot}
        onClose={() => setQrModalPlot(null)}
      />

      {/* Plot Shape & Boundary Editor Modal */}
      {shapeEditorPlot && (
        <PlotShapeEditorModal
          plot={shapeEditorPlot}
          isOpen={true}
          onClose={() => setShapeEditorPlot(null)}
        />
      )}

      {/* Add New Crop Modal */}
      <AddNewCropModal
        isOpen={showAddCropModal}
        onClose={() => setShowAddCropModal(false)}
        defaultPlotId={activePlot?.id}
      />
    </div>
  );
};
