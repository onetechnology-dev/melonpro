import React from 'react';
import { Farm, Plot } from '../../types/melon';
import { useMapSettings, MapProviderId } from '../../context/MapSettingsContext';
import { LeafletFarmMap } from './LeafletFarmMap';
import { SafeMapErrorBoundary } from '../common/SafeMapErrorBoundary';
import { AlertTriangle } from 'lucide-react';
import L from 'leaflet';

export interface UnifiedFarmMapProps {
  plots: Plot[];
  selectedPlotId: string;
  onSelectPlot: (plotId: string) => void;
  mapType?: 'hybrid' | 'roadmap' | 'satellite' | 'terrain';
  resetTrigger?: number;
  className?: string;
  compact?: boolean;
  overrideProvider?: MapProviderId;
  onGoogleMapReady?: (map: google.maps.Map) => void;
  onLeafletMapReady?: (map: L.Map) => void;
  activeFarm?: Farm | null;
  activeFarmId?: string;
}

export const UnifiedFarmMap: React.FC<UnifiedFarmMapProps> = ({
  plots,
  selectedPlotId,
  onSelectPlot,
  mapType = 'hybrid',
  resetTrigger = 0,
  className = 'w-full h-full min-h-[460px]',
  compact = false,
  overrideProvider,
  onLeafletMapReady,
  activeFarm,
  activeFarmId,
}) => {
  const { provider: contextProvider, arcgisApiKey } = useMapSettings();
  const currentProvider: MapProviderId = overrideProvider || contextProvider;

  return (
    <SafeMapErrorBoundary
      fallback={
        <div className={`w-full h-full min-h-[300px] flex flex-col items-center justify-center p-6 bg-slate-900 text-white rounded-xl text-center ${className}`}>
          <AlertTriangle className="w-8 h-8 text-amber-400 mb-2" />
          <h4 className="text-sm font-bold text-white">Map Notice</h4>
          <p className="text-xs text-slate-300 mt-1">
            Unable to load map tiles. Please check your network connection.
          </p>
        </div>
      }
    >
      <LeafletFarmMap
        provider={currentProvider}
        plots={plots}
        selectedPlotId={selectedPlotId}
        onSelectPlot={onSelectPlot}
        mapType={mapType}
        resetTrigger={resetTrigger}
        arcgisApiKey={arcgisApiKey}
        className={className}
        compact={compact}
        onMapReady={onLeafletMapReady}
        activeFarm={activeFarm}
        activeFarmId={activeFarmId}
      />
    </SafeMapErrorBoundary>
  );
};

