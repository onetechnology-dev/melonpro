import React, { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import { Farm, Plot } from '../../types/melon';
import { calculatePolygonCenter } from '../../utils/geoUtils';

// Fix default Leaflet icon assets if standard markers are ever used
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const FARM_DEFAULT_CENTER = { lat: 11.4886, lng: 104.8324 };

interface LeafletFarmMapProps {
  provider: 'google' | 'osm' | 'arcgis';
  plots: Plot[];
  selectedPlotId: string;
  onSelectPlot: (plotId: string) => void;
  mapType?: 'hybrid' | 'roadmap' | 'satellite' | 'terrain';
  resetTrigger?: number;
  arcgisApiKey?: string;
  className?: string;
  compact?: boolean;
  onMapReady?: (map: L.Map) => void;
  activeFarm?: Farm | null;
  activeFarmId?: string;
}

export const LeafletFarmMap: React.FC<LeafletFarmMapProps> = ({
  provider,
  plots,
  selectedPlotId,
  onSelectPlot,
  mapType = 'hybrid',
  resetTrigger = 0,
  arcgisApiKey = '',
  className = 'w-full h-full min-h-[460px]',
  compact = false,
  onMapReady,
  activeFarm,
  activeFarmId,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const plotsLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const isFirstRender = useRef(true);

  // Initialize Map
  useEffect(() => {
    if (!containerRef.current) return;

    // Remove any existing instance
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(containerRef.current, {
      center: [FARM_DEFAULT_CENTER.lat, FARM_DEFAULT_CENTER.lng],
      zoom: compact ? 16 : 17,
      zoomControl: false, // We provide custom zoom controls
      attributionControl: !compact,
    });

    mapInstanceRef.current = map;

    const tileLayers = L.layerGroup().addTo(map);
    tileLayerGroupRef.current = tileLayers;

    const plotLayers = L.layerGroup().addTo(map);
    plotsLayerGroupRef.current = plotLayers;

    if (onMapReady) {
      onMapReady(map);
    }

    // Invalidate size after layout settles
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [provider]);

  // Update Basemap Tiles when provider or mapType changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const tileGroup = tileLayerGroupRef.current;
    if (!map || !tileGroup) return;

    tileGroup.clearLayers();

    const tokenQuery = arcgisApiKey ? `?token=${encodeURIComponent(arcgisApiKey)}` : '';

    if (provider === 'google') {
      if (mapType === 'roadmap') {
        // Standard Google Roadmap
        L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
          maxZoom: 20,
          subdomains: ['0', '1', '2', '3'],
          attribution: '&copy; Google Maps',
        }).addTo(tileGroup);
      } else if (mapType === 'terrain') {
        // Google Shaded Relief Terrain
        L.tileLayer('https://mt{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}', {
          maxZoom: 20,
          subdomains: ['0', '1', '2', '3'],
          attribution: '&copy; Google Maps',
        }).addTo(tileGroup);
      } else if (mapType === 'satellite') {
        // Google Pure Satellite Imagery
        L.tileLayer('https://mt{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
          maxZoom: 20,
          subdomains: ['0', '1', '2', '3'],
          attribution: '&copy; Google Maps Satellite',
        }).addTo(tileGroup);
      } else {
        // Google Hybrid (Satellite + Roads & Place Labels)
        L.tileLayer('https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
          maxZoom: 20,
          subdomains: ['0', '1', '2', '3'],
          attribution: '&copy; Google Maps Satellite',
        }).addTo(tileGroup);
      }
    } else if (provider === 'osm') {
      if (mapType === 'roadmap') {
        // Standard OpenStreetMap
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(tileGroup);
      } else if (mapType === 'terrain') {
        // OpenTopoMap
        L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
          maxZoom: 17,
          subdomains: 'abc',
          attribution: 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap',
        }).addTo(tileGroup);
      } else {
        // Satellite / Hybrid (Esri World Imagery + OpenStreetMap overlay)
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          maxZoom: 19,
          attribution: 'Tiles &copy; Esri, Maxar, Earthstar Geographics &copy; OpenStreetMap',
        }).addTo(tileGroup);

        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
          maxZoom: 19,
        }).addTo(tileGroup);
      }
    } else if (provider === 'arcgis') {
      if (mapType === 'roadmap') {
        // ArcGIS World Street Map
        L.tileLayer(`https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}${tokenQuery}`, {
          maxZoom: 19,
          attribution: 'Tiles &copy; Esri &mdash; Street Map Basemap',
        }).addTo(tileGroup);
      } else if (mapType === 'terrain') {
        // ArcGIS World Topo Map
        L.tileLayer(`https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}${tokenQuery}`, {
          maxZoom: 19,
          attribution: 'Tiles &copy; Esri &mdash; World Topographic Basemap',
        }).addTo(tileGroup);
      } else {
        // ArcGIS World Imagery + Reference Boundaries (Hybrid)
        L.tileLayer(`https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}${tokenQuery}`, {
          maxZoom: 19,
          attribution: 'Tiles &copy; Esri &mdash; High-Resolution World Imagery',
        }).addTo(tileGroup);

        L.tileLayer(`https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}${tokenQuery}`, {
          maxZoom: 19,
        }).addTo(tileGroup);
      }
    }
  }, [provider, mapType, arcgisApiKey]);

  // Update Plots Polygons & Facility Shapes Markers
  useEffect(() => {
    const plotGroup = plotsLayerGroupRef.current;
    if (!plotGroup) return;

    plotGroup.clearLayers();

    plots.forEach((plot) => {
      const isSelected = selectedPlotId === plot.id;

      // Determine facility shapes on the map
      const shapes = plot.shapes && plot.shapes.length > 0
        ? plot.shapes
        : (plot.polygonCoords && plot.polygonCoords.length >= 3
            ? [{
                id: `shape-${plot.id}-default`,
                name: plot.name,
                facilityType: plot.facilityType || 'net_house',
                coords: plot.polygonCoords,
                areaHa: plot.areaHa,
                color: plot.color || (plot.facilityType === 'open_field' ? '#D97706' : '#15803D'),
              }]
            : []);

      shapes.forEach((shape, idx) => {
        if (!shape.coords || shape.coords.length < 3) return;

        const isNetHouse = shape.facilityType === 'net_house';
        const defaultColor = isNetHouse ? '#15803D' : '#D97706';
        const shapeColor = shape.color || defaultColor;

        const latLngs = shape.coords.map((c) => [c.lat, c.lng] as [number, number]);
        const polygon = L.polygon(latLngs, {
          color: isSelected ? '#FFFFFF' : (isNetHouse ? '#34D399' : '#FBBF24'),
          weight: isSelected ? 3.5 : 2,
          opacity: 1.0,
          fillColor: shapeColor,
          fillOpacity: isSelected ? 0.82 : 0.65,
          dashArray: isNetHouse ? undefined : '5, 4',
        });

        polygon.on('click', () => {
          onSelectPlot(plot.id);
        });

        polygon.addTo(plotGroup);

        // Centered badge for each facility shape on map
        const shapeCenter = calculatePolygonCenter(shape.coords);
        const facilityBadgeHtml = `
          <div class="custom-plot-label select-none cursor-pointer text-center" style="transform: translate(-50%, -50%);">
            <div style="color: #ffffff; font-weight: 800; font-size: 13px; text-shadow: 0 2px 4px rgba(0,0,0,0.95), 0 0 8px rgba(0,0,0,0.8); line-height: 1.2;">
              ${plot.name} ${shapes.length > 1 ? `(${isNetHouse ? 'Net House' : 'Open Field'})` : ''}
            </div>
            <div style="display: inline-flex; align-items: center; gap: 4px; margin-top: 2px; padding: 1px 6px; border-radius: 9999px; background: ${isNetHouse ? 'rgba(21, 128, 61, 0.92)' : 'rgba(217, 119, 6, 0.92)'}; color: #ffffff; font-size: 10px; font-weight: 700; text-shadow: 0 1px 2px rgba(0,0,0,0.8);">
              <span>${isNetHouse ? '🏠 ផ្ទះសំណាញ់' : '🌾 ចំការវាល'}</span>
              ${shape.areaM2 ? `<span>· ${shape.areaM2.toLocaleString()} m²</span>` : (shape.areaHa ? `<span>· ${Math.round(shape.areaHa * 10000).toLocaleString()} m²</span>` : (plot.areaM2 ? `<span>· ${plot.areaM2.toLocaleString()} m²</span>` : `<span>· ${Math.round((plot.areaHa || 1) * 10000).toLocaleString()} m²</span>`))}
            </div>
            ${isSelected && idx === 0 ? `
              <div style="margin-top: 4px; display: inline-flex; align-items: center; gap: 5px; padding: 2px 8px; border-radius: 9999px; background: rgba(2, 6, 23, 0.92); color: #ffffff; border: 1px solid rgba(255, 255, 255, 0.6); font-size: 10px; font-family: monospace; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.4); white-space: nowrap;">
                <span style="width: 6px; height: 6px; border-radius: 9999px; background: #34d399;"></span>
                <span>${plot.soilMoisture}% moisture · ${plot.ambientTemp}°C</span>
              </div>
            ` : ''}
          </div>
        `;

        const divIcon = L.divIcon({
          className: 'leaflet-plot-custom-marker',
          html: facilityBadgeHtml,
          iconSize: [160, 55],
          iconAnchor: [80, 27],
        });

        const marker = L.marker([shapeCenter.lat, shapeCenter.lng], {
          icon: divIcon,
          zIndexOffset: isSelected ? 1000 : 100,
        });

        marker.on('click', () => {
          onSelectPlot(plot.id);
        });

        marker.addTo(plotGroup);
      });
    });
  }, [plots, selectedPlotId, onSelectPlot]);

  // Helper to fit map to current plots or active farm
  const fitMapToCurrentView = useCallback((animate = true) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // 1. If plots have coordinates, calculate bounds
    const allCoords: [number, number][] = [];
    plots.forEach((p) => {
      if (p.polygonCoords && p.polygonCoords.length > 0) {
        p.polygonCoords.forEach((c) => allCoords.push([c.lat, c.lng]));
      }
      if (p.shapes && p.shapes.length > 0) {
        p.shapes.forEach((s) => {
          if (s.coords && s.coords.length > 0) {
            s.coords.forEach((c) => allCoords.push([c.lat, c.lng]));
          }
        });
      }
    });

    if (allCoords.length >= 3) {
      const bounds = L.latLngBounds(allCoords);
      if (bounds.isValid()) {
        map.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 18,
          animate,
        });
        return;
      }
    }

    // 2. If activeFarm center exists, center on active farm
    if (activeFarm?.center) {
      map.setView([activeFarm.center.lat, activeFarm.center.lng], 16, { animate });
      return;
    }

    // 3. Fallback to first plot center
    if (plots[0]?.center) {
      map.setView([plots[0].center.lat, plots[0].center.lng], 16, { animate });
      return;
    }

    // 4. Default fallback center
    map.setView([FARM_DEFAULT_CENTER.lat, FARM_DEFAULT_CENTER.lng], compact ? 15 : 16, { animate });
  }, [plots, activeFarm, compact]);

  // Reactive effect when activeFarm, activeFarmId, or plots change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.invalidateSize();
    fitMapToCurrentView(!isFirstRender.current);
    if (isFirstRender.current) {
      isFirstRender.current = false;
    }
  }, [activeFarm, activeFarmId, plots, fitMapToCurrentView]);

  // Pan to selected plot center when selection explicitly changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedPlotId) return;

    const activePlot = plots.find((p) => p.id === selectedPlotId);
    if (activePlot?.center) {
      map.panTo([activePlot.center.lat, activePlot.center.lng], {
        animate: true,
        duration: 0.6,
      });
    }
  }, [selectedPlotId, plots]);

  // Recenter trigger
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || resetTrigger === 0) return;

    fitMapToCurrentView(true);
  }, [resetTrigger, fitMapToCurrentView]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{ zIndex: 0 }}
    />
  );
};
