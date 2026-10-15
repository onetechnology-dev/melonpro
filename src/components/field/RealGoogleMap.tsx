import React, { useState } from 'react';
import { Plot } from '../../types/melon';
import { useMapSettings } from '../../context/MapSettingsContext';
import { UnifiedFarmMap } from './UnifiedFarmMap';

export const FARM_CENTER = { lat: 11.4886, lng: 104.8324 };

interface RealGoogleMapProps {
  plots: Plot[];
  selectedPlotId: string;
  onSelectPlot: (plotId: string) => void;
  className?: string;
  compact?: boolean;
}

export const RealGoogleMap: React.FC<RealGoogleMapProps> = ({
  plots,
  selectedPlotId,
  onSelectPlot,
  className = "w-full h-full min-h-[300px]",
  compact = false,
}) => {
  const { provider } = useMapSettings();
  const [mapType, setMapType] = useState<'hybrid' | 'roadmap' | 'satellite' | 'terrain'>('hybrid');

  return (
    <div className={`relative overflow-hidden rounded-xl bg-slate-900 ${className}`}>
      <UnifiedFarmMap
        plots={plots}
        selectedPlotId={selectedPlotId}
        onSelectPlot={onSelectPlot}
        mapType={mapType}
        compact={compact}
        className="w-full h-full"
      />

      {/* Floating Controls Bar */}
      <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5 pointer-events-auto">
        <div className="flex items-center bg-black/75 backdrop-blur-md rounded-lg p-0.5 border border-white/20 text-[10px] text-white font-medium shadow-md">
          <button
            type="button"
            onClick={() => setMapType('hybrid')}
            className={`px-2 py-1 rounded-md transition-all ${
              mapType === 'hybrid' ? 'bg-emerald-600 text-white font-bold shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            Satellite
          </button>
          <button
            type="button"
            onClick={() => setMapType('roadmap')}
            className={`px-2 py-1 rounded-md transition-all ${
              mapType === 'roadmap' ? 'bg-emerald-600 text-white font-bold shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            Roadmap
          </button>
        </div>
      </div>

      {/* Active Plot Quick-Select Buttons at Bottom */}
      <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10 flex items-center justify-between gap-1 pointer-events-none">
        <div className="flex items-center gap-1.5 pointer-events-auto flex-wrap">
          {plots.map((plot) => {
            const isSelected = selectedPlotId === plot.id;
            return (
              <button
                key={plot.id}
                onClick={() => onSelectPlot(plot.id)}
                className={`
                  px-2.5 py-1 rounded-lg backdrop-blur-md text-xs font-bold transition-all text-left shadow-sm border
                  ${isSelected 
                    ? 'bg-black/90 text-white ring-2 ring-white/60 scale-105' 
                    : 'bg-black/60 text-slate-200 hover:bg-black/80 hover:text-white border-white/30'
                  }
                `}
                style={{ borderLeftColor: plot.color || '#164e22', borderLeftWidth: '3.5px' }}
              >
                <span className="block leading-tight">{plot.name.split(' ')[0]} {plot.name.split(' ')[1]}</span>
                <span className="text-[10px] text-slate-300 font-mono block leading-none">{plot.areaHa} ha</span>
              </button>
            );
          })}
        </div>

        {!compact && (
          <div className="bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] text-slate-300 font-mono border border-white/20 hidden md:block">
            {provider.toUpperCase()} · GPS: {FARM_CENTER.lat.toFixed(4)}°N, {FARM_CENTER.lng.toFixed(4)}°E
          </div>
        )}
      </div>
    </div>
  );
};
