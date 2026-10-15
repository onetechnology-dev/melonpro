import React, { useState, useEffect } from 'react';
import { 
  Maximize2, 
  Droplets, 
  Thermometer, 
  Power, 
  Map as MapIcon, 
  PenTool, 
  Layers,
  Sprout
} from 'lucide-react';
import { useI18n } from '../../locales/i18nContext';
import { useFarm } from '../../context/FarmContext';
import { Plot } from '../../types/melon';
import { PlotShapeEditorModal } from '../field/PlotShapeEditorModal';
import { UnifiedFarmMap } from '../field/UnifiedFarmMap';

const FARM_DEFAULT_CENTER = { lat: 11.4886, lng: 104.8324 };



export const FieldMapCard: React.FC = () => {
  const { language } = useI18n();
  const { plots, selectedPlotId, setSelectedPlotId, setActiveTab, toggleIrrigation } = useFarm();
  
  // Real Google Map is default to display real plots on the Dashboard
  const [mapMode, setMapMode] = useState<'google' | 'visual'>('google');
  const [shapeEditorPlot, setShapeEditorPlot] = useState<Plot | null>(null);

  const activePlot = plots.find((p) => p.id === selectedPlotId) || plots[0];

  return (
    <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 flex flex-col justify-between">
      {/* Top Header: Title, Real Satellite Switcher, Edit Shape & Expand */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MapIcon className="w-4 h-4 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-800">
            Field Map / <span className="font-khmer text-slate-500">ផែនទីចំការ</span>
          </h3>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Real Map Mode Switcher */}
          <div className="bg-slate-100 p-0.5 rounded-lg flex items-center text-[10px] font-bold text-slate-600">
            <button
              onClick={() => setMapMode('google')}
              className={`px-2 py-0.5 rounded-md transition-all ${
                mapMode === 'google' ? 'bg-white text-emerald-800 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Real Map
            </button>
            <button
              onClick={() => setMapMode('visual')}
              className={`px-2 py-0.5 rounded-md transition-all ${
                mapMode === 'visual' ? 'bg-white text-emerald-800 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Diagram
            </button>
          </div>

          <button
            onClick={() => setShapeEditorPlot(activePlot)}
            className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors"
            title="Edit Plot Shape / កែសម្រួលរាងដី"
            aria-label="Edit Plot Shape"
          >
            <PenTool className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setActiveTab('field')}
            className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors"
            title="Open Full Field Map"
            aria-label="Open Full Field Map"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Map Viewport */}
      {mapMode === 'google' ? (
        /* Real Google Satellite Farm View with Real Plots */
        <div className="relative w-full h-52 sm:h-56 rounded-2xl overflow-hidden border border-slate-200/90 bg-slate-900 shadow-inner group">
          <UnifiedFarmMap
            plots={plots}
            selectedPlotId={selectedPlotId}
            onSelectPlot={setSelectedPlotId}
            mapType="hybrid"
            compact={true}
            className="w-full h-full"
          />

          {/* Top-Right Floating White Expand Button matching reference */}
          <button
            onClick={() => setActiveTab('field')}
            className="absolute top-2.5 right-2.5 z-20 w-8 h-8 rounded-xl bg-white shadow-md hover:shadow-lg border border-slate-200/80 flex items-center justify-center text-slate-700 hover:text-emerald-700 hover:scale-105 active:scale-95 transition-all"
            title="Expand Full Field Map"
            aria-label="Expand Full Field Map"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* Quick Plot Selector Pills at Bottom */}
          <div className="absolute bottom-2 left-2 right-2 pointer-events-none flex items-center justify-between gap-1.5 z-10">
            <div className="flex items-center gap-1 pointer-events-auto">
              {plots.map((p) => (
                <button
                  key={`pill-${p.id}`}
                  onClick={() => setSelectedPlotId(p.id)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all shadow-xs backdrop-blur-xs ${
                    selectedPlotId === p.id
                      ? 'bg-slate-950 text-white border border-white ring-1 ring-emerald-400'
                      : 'bg-black/60 text-white/90 hover:bg-black/80 border border-white/20'
                  }`}
                >
                  {p.code}
                </button>
              ))}
            </div>

            <span className="pointer-events-auto text-[9px] bg-black/60 text-white/80 px-2 py-0.5 rounded backdrop-blur-xs">
              Live Satellite
            </span>
          </div>
        </div>
      ) : (
        /* Schematic Dynamic 2x2 Grid View */
        <div className="relative w-full h-52 sm:h-56 rounded-2xl overflow-hidden shadow-inner border border-slate-200/90 select-none bg-slate-900 p-2 grid grid-cols-2 gap-2">
          {plots.slice(0, 4).map((plot) => {
            const isSelected = selectedPlotId === plot.id;
            return (
              <div
                key={`diag-${plot.id}`}
                onClick={() => setSelectedPlotId(plot.id)}
                className={`relative rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center justify-center p-2 text-center group ${
                  isSelected ? 'border-white ring-2 ring-emerald-400 scale-[1.02]' : 'border-white/80 hover:border-white'
                }`}
                style={{ backgroundColor: `${plot.color}cc` }}
              >
                <div className="text-white font-extrabold text-sm sm:text-base drop-shadow-md">
                  {plot.name.split(' ')[0]} {plot.name.split(' ')[1] || ''}
                </div>
                <div className="text-white font-semibold text-xs drop-shadow-sm opacity-95">
                  {plot.areaHa} ha
                </div>
                {isSelected && (
                  <div className="mt-1 inline-flex items-center gap-1 bg-black/80 text-white px-2 py-0.5 rounded-full text-[9px] font-mono border border-white/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{plot.soilMoisture}% moist</span>
                  </div>
                )}
              </div>
            );
          })}

          {/* Top-Right Floating White Expand Button */}
          <button
            onClick={() => setActiveTab('field')}
            className="absolute top-2.5 right-2.5 z-20 w-8 h-8 rounded-xl bg-white shadow-md hover:shadow-lg border border-slate-200/80 flex items-center justify-center text-slate-700 hover:text-emerald-700 hover:scale-105 active:scale-95 transition-all"
            title="Expand Full Field Map"
            aria-label="Expand Full Field Map"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Selected Plot Telemetry Bar at bottom of card */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
            style={{ backgroundColor: activePlot.color || '#15803D' }}
          />
          <div>
            <span className="font-bold text-slate-800">{activePlot.name}</span>
            <span className="text-[11px] text-slate-400 ml-1.5 font-mono">
              ({activePlot.areaHa} ha)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-slate-500 font-mono text-[11px]">
          <span className="flex items-center gap-1 text-sky-600 font-semibold">
            <Droplets className="w-3 h-3" />
            {activePlot.soilMoisture}%
          </span>
          <span className="flex items-center gap-1 text-amber-600 font-semibold">
            <Thermometer className="w-3 h-3" />
            {activePlot.ambientTemp}°C
          </span>
          <button
            onClick={() => toggleIrrigation(activePlot.id)}
            className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-colors ${
              activePlot.irrigationStatus === 'on'
                ? 'bg-sky-500 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {activePlot.irrigationStatus === 'on' ? 'VALVE ON' : 'VALVE OFF'}
          </button>
        </div>
      </div>

      {/* Plot Shape Editor Modal */}
      {shapeEditorPlot && (
        <PlotShapeEditorModal
          plot={shapeEditorPlot}
          isOpen={true}
          onClose={() => setShapeEditorPlot(null)}
        />
      )}
    </div>
  );
};
