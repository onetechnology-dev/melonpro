import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Check, 
  MapPin, 
  Layers, 
  Maximize2, 
  RotateCcw, 
  RotateCw,
  Trash2, 
  Plus, 
  Compass, 
  PenTool, 
  Sliders, 
  Sparkles,
  Info,
  Move,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Search,
  Crosshair,
  Edit3,
  Save,
  Navigation,
  RefreshCw,
  Ruler,
  Warehouse,
  Trees
} from 'lucide-react';
import L from 'leaflet';
import { SafeMapErrorBoundary } from '../common/SafeMapErrorBoundary';
import { useMapSettings } from '../../context/MapSettingsContext';
import { Plot, GeoCoordinate, FacilityShape, FacilityType } from '../../types/melon';
import { useI18n } from '../../locales/i18nContext';
import { useFarm } from '../../context/FarmContext';
import { 
  calculatePolygonAreaHa, 
  calculatePolygonAreaM2, 
  calculatePolygonPerimeterM, 
  calculatePolygonCenter,
  calculateHaversineDistanceM,
  rotatePolygon,
  translatePolygonMeters,
  coordsToMeterOffsets,
  generateShapeFromOffsets,
  formatMeterDistance,
  createRectangleOffsets,
  adjustPolygonSideLength,
  setPolygonRectangleDimensions,
  ShapePreset,
  DEFAULT_SHAPE_PRESETS
} from '../../utils/geoUtils';

interface PlotShapeEditorModalProps {
  plot: Plot | null;
  isOpen: boolean;
  onClose: () => void;
  initialShapeId?: string;
}

const COLOR_PALETTE = [
  { name: 'Red (Plot A)', hex: '#B91C1C' },
  { name: 'Green (Plot B)', hex: '#15803D' },
  { name: 'Emerald', hex: '#059669' },
  { name: 'Slate (Plot C)', hex: '#334155' },
  { name: 'Gold (Plot D)', hex: '#CA8A04' },
  { name: 'Blue', hex: '#0284C7' },
  { name: 'Purple', hex: '#7C3AED' },
  { name: 'Amber', hex: '#D97706' },
  { name: 'Teal', hex: '#0D9488' },
];

const AGRICULTURAL_HUBS = [
  { name: 'Kandal Stung', province: 'Kandal', lat: 11.3854, lng: 104.9122 },
  { name: 'Chbar Mon', province: 'Kampong Speu', lat: 11.4533, lng: 104.5208 },
  { name: 'Bati District', province: 'Takeo', lat: 11.2389, lng: 104.8324 },
  { name: 'Prasat Bakong', province: 'Siem Reap', lat: 13.3671, lng: 103.8448 },
  { name: 'Banan', province: 'Battambang', lat: 13.0957, lng: 103.2022 },
  { name: 'Kang Meas', province: 'Kampong Cham', lat: 11.9934, lng: 105.4635 },
  { name: 'Dangkao Suburb', province: 'Phnom Penh', lat: 11.4886, lng: 104.8324 },
  { name: 'Samlot / Pailin', province: 'Battambang', lat: 12.9314, lng: 102.8428 },
];

/**
 * Parses user input into a valid latitude & longitude pair.
 * Supports:
 * - Direct decimal: "12.9313667,102.8427579" or "12.9313667, 102.8427579"
 * - Space/semicolon/slash separated: "12.9313667 102.8427579" or "12.9313667; 102.8427579"
 * - Labeled: "Lat: 12.9313667, Lng: 102.8427579"
 * - Hemispheric: "12.9313667N, 102.8427579E"
 * - DMS degrees-minutes-seconds: 12°55'52.9"N 102°50'33.9"E
 * - Auto-swaps if user accidentally wrote [longitude, latitude] e.g. "102.8427579, 12.9313667"
 */
export function parseCoordinatesFromText(text: string): { lat: number; lng: number } | null {
  if (!text || typeof text !== 'string') return null;
  const raw = text.trim();

  // 1. Check for DMS (Degrees Minutes Seconds) format: e.g. 12°55'52.9"N 102°50'33.9"E
  const dmsRegex = /(\d+)[°d\s]+(\d+)[′'m\s]+([\d.]+)[″"s\s]*([NSEW])/gi;
  const dmsMatches = [...raw.matchAll(dmsRegex)];
  if (dmsMatches.length === 2) {
    const toDecimal = (d: string, m: string, s: string, dir: string) => {
      let dec = parseFloat(d) + parseFloat(m) / 60 + parseFloat(s) / 3600;
      if (dir.toUpperCase() === 'S' || dir.toUpperCase() === 'W') dec = -dec;
      return dec;
    };
    const part1 = toDecimal(dmsMatches[0][1], dmsMatches[0][2], dmsMatches[0][3], dmsMatches[0][4]);
    const part2 = toDecimal(dmsMatches[1][1], dmsMatches[1][2], dmsMatches[1][3], dmsMatches[1][4]);
    const dir1 = dmsMatches[0][4].toUpperCase();
    if (dir1 === 'N' || dir1 === 'S') {
      return { lat: part1, lng: part2 };
    } else {
      return { lat: part2, lng: part1 };
    }
  }

  // 2. Check for labeled or decimal format with optional N/S/E/W:
  // e.g. "12.9313667,102.8427579", "12.9313667N, 102.8427579E", "Lat: 12.9313667, Lon: 102.8427579"
  const cleaned = raw.replace(/lat(?:itude)?[:\s]*/i, '').replace(/l(?:ng|on|ongitude)?[:\s]*/i, '');
  const hemiRegex = /([+-]?\d+(?:\.\d+)?)\s*([NSEW])?[\s,;/|]+([+-]?\d+(?:\.\d+)?)\s*([NSEW])?/i;
  const hemiMatch = cleaned.match(hemiRegex);
  if (hemiMatch) {
    let val1 = parseFloat(hemiMatch[1]);
    const dir1 = hemiMatch[2]?.toUpperCase();
    let val2 = parseFloat(hemiMatch[3]);
    const dir2 = hemiMatch[4]?.toUpperCase();

    if (dir1 === 'S') val1 = -Math.abs(val1);
    if (dir1 === 'W') val1 = -Math.abs(val1);
    if (dir2 === 'S') val2 = -Math.abs(val2);
    if (dir2 === 'W') val2 = -Math.abs(val2);

    if ((dir1 === 'E' || dir1 === 'W') && (dir2 === 'N' || dir2 === 'S')) {
      const lat = val2;
      const lng = val1;
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { lat, lng };
      }
    } else {
      let lat = val1;
      let lng = val2;
      // Auto-correct if user passed lng, lat (e.g. 102.8427579, 12.9313667)
      if (Math.abs(lat) > 90 && Math.abs(lng) <= 90) {
        const temp = lat;
        lat = lng;
        lng = temp;
      }
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { lat, lng };
      }
    }
  }

  // 3. Fallback: match any two floating-point numbers in the input
  const numberMatches = raw.match(/[-+]?\d+(?:\.\d+)?/g);
  if (numberMatches && numberMatches.length === 2) {
    let lat = parseFloat(numberMatches[0]);
    let lng = parseFloat(numberMatches[1]);
    if (!isNaN(lat) && !isNaN(lng)) {
      if (Math.abs(lat) > 90 && Math.abs(lng) <= 90) {
        const temp = lat;
        lat = lng;
        lng = temp;
      }
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { lat, lng };
      }
    }
  }

  return null;
}

// Leaflet Shape Editor Canvas (supports Google Satellite, ArcGIS & OpenStreetMap)
const LeafletShapeEditor: React.FC<{
  provider: 'google' | 'osm' | 'arcgis';
  arcgisApiKey?: string;
  center: GeoCoordinate;
  targetPan: GeoCoordinate | null;
  onPanHandled: () => void;
  onClickMap: (coord: GeoCoordinate) => void;
  onCoordsChange: (coords: GeoCoordinate[]) => void;
  coords: GeoCoordinate[];
  selectedColor: string;
  otherPlots: Plot[];
  searchPin: { lat: number; lng: number; displayName: string } | null;
  activeTab: 'presets' | 'draw' | 'adjust' | 'coords';
  onClosePolygonDrawing?: () => void;
  allPlotShapes?: FacilityShape[];
  activeShapeIndex?: number;
  onSelectShape?: (idx: number) => void;
}> = ({
  provider,
  arcgisApiKey = '',
  center,
  targetPan,
  onPanHandled,
  onClickMap,
  onCoordsChange,
  coords,
  selectedColor,
  otherPlots,
  searchPin,
  activeTab,
  onClosePolygonDrawing,
  allPlotShapes = [],
  activeShapeIndex = 0,
  onSelectShape,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const vectorLayerRef = useRef<L.LayerGroup | null>(null);
  const rubberbandLayerRef = useRef<L.LayerGroup | null>(null);
  const coordsRef = useRef(coords);
  coordsRef.current = coords;
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;
  const isDraggingShapeRef = useRef(false);

  // Initialize Map
  useEffect(() => {
    if (!containerRef.current) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = L.map(containerRef.current, {
      center: [center.lat, center.lng],
      zoom: 17,
      zoomControl: false,
      attributionControl: false,
    });
    mapRef.current = map;

    // Basemap Layer
    if (provider === 'google') {
      L.tileLayer('https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['0', '1', '2', '3'],
        attribution: '&copy; Google Maps Satellite',
      }).addTo(map);
    } else if (provider === 'arcgis') {
      const tokenQuery = arcgisApiKey ? `?token=${encodeURIComponent(arcgisApiKey)}` : '';
      L.tileLayer(
        `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}${tokenQuery}`,
        { maxZoom: 19 }
      ).addTo(map);

      L.tileLayer(
        `https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}${tokenQuery}`,
        { maxZoom: 19 }
      ).addTo(map);
    } else {
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);
    }

    const vectorGroup = L.layerGroup().addTo(map);
    vectorLayerRef.current = vectorGroup;

    const rubberbandGroup = L.layerGroup().addTo(map);
    rubberbandLayerRef.current = rubberbandGroup;

    map.on('click', (e: L.LeafletMouseEvent) => {
      if (isDraggingShapeRef.current) return;
      onClickMap({
        lat: Number(e.latlng.lat.toFixed(6)),
        lng: Number(e.latlng.lng.toFixed(6)),
      });
    });

    // Real-time guideline / rubberband while drawing
    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      if (activeTabRef.current !== 'draw') {
        rubberbandGroup.clearLayers();
        return;
      }

      const curCoords = coordsRef.current;
      if (curCoords.length === 0) {
        rubberbandGroup.clearLayers();
        return;
      }

      rubberbandGroup.clearLayers();
      const last = curCoords[curCoords.length - 1];
      const curMouse = { lat: e.latlng.lat, lng: e.latlng.lng };
      const dist = calculateHaversineDistanceM(last, curMouse);
      const distText = formatMeterDistance(dist);

      // Rubberband polyline from last point to mouse
      L.polyline([[last.lat, last.lng], [e.latlng.lat, e.latlng.lng]], {
        color: '#10b981',
        weight: 2,
        dashArray: '6, 6',
        opacity: 0.9,
      }).addTo(rubberbandGroup);

      // Distance badge at midpoint of rubberband
      const midLat = (last.lat + e.latlng.lat) / 2;
      const midLng = (last.lng + e.latlng.lng) / 2;
      const distBadge = L.divIcon({
        className: 'rubberband-dist-badge',
        html: `<div style="transform: translate(-50%, -50%);" class="px-2 py-0.5 rounded-full bg-slate-950/90 text-emerald-300 border border-emerald-400 shadow-md text-[10px] font-mono font-bold whitespace-nowrap pointer-events-none select-none">📏 ${distText}</div>`,
        iconSize: [60, 20],
        iconAnchor: [30, 10],
      });
      L.marker([midLat, midLng], { icon: distBadge, interactive: false }).addTo(rubberbandGroup);

      // If at least 2 points, also show preview closing line back to point 0
      if (curCoords.length >= 2) {
        L.polyline([[e.latlng.lat, e.latlng.lng], [curCoords[0].lat, curCoords[0].lng]], {
          color: '#6ee7b7',
          weight: 1.5,
          dashArray: '4, 4',
          opacity: 0.5,
        }).addTo(rubberbandGroup);
      }
    });

    map.on('mouseout', () => {
      rubberbandGroup.clearLayers();
    });

    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      clearTimeout(timer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [provider, arcgisApiKey]);

  // Handle Target Pan
  useEffect(() => {
    if (!mapRef.current || !targetPan) return;
    mapRef.current.panTo([targetPan.lat, targetPan.lng]);
    mapRef.current.setZoom(17);
    onPanHandled();
  }, [targetPan, onPanHandled]);

  // Update Cursor based on mode
  useEffect(() => {
    if (!containerRef.current) return;
    if (activeTab === 'draw') {
      containerRef.current.style.cursor = 'crosshair';
    } else {
      containerRef.current.style.cursor = 'default';
    }
  }, [activeTab]);

  // Render Polygons, Markers & Side Length Badges
  useEffect(() => {
    const map = mapRef.current;
    const group = vectorLayerRef.current;
    if (!map || !group) return;

    group.clearLayers();

    // 1. Other background plots
    otherPlots.forEach((p) => {
      const pShapes = p.shapes && p.shapes.length > 0
        ? p.shapes
        : (p.polygonCoords ? [{ coords: p.polygonCoords, color: p.color, facilityType: p.facilityType }] : []);
      pShapes.forEach((s) => {
        if (s.coords && s.coords.length >= 3) {
          const latlngs = s.coords.map((c) => [c.lat, c.lng] as [number, number]);
          L.polygon(latlngs, {
            color: '#ffffff',
            weight: 1.5,
            opacity: 0.5,
            fillColor: s.color || (s.facilityType === 'open_field' ? '#D97706' : '#15803D'),
            fillOpacity: 0.22,
            interactive: false,
          }).addTo(group);
        }
      });
    });

    // 1b. Inactive shapes belonging to currently edited plot
    if (allPlotShapes && allPlotShapes.length > 0) {
      allPlotShapes.forEach((shape, idx) => {
        if (idx === activeShapeIndex) return;
        if (!shape.coords || shape.coords.length < 3) return;

        const isNet = shape.facilityType === 'net_house';
        const shapeColor = shape.color || (isNet ? '#15803D' : '#D97706');
        const latlngs = shape.coords.map((c) => [c.lat, c.lng] as [number, number]);

        const poly = L.polygon(latlngs, {
          color: isNet ? '#34D399' : '#FBBF24',
          weight: 2,
          opacity: 0.9,
          fillColor: shapeColor,
          fillOpacity: 0.45,
          dashArray: isNet ? undefined : '5, 4',
        }).addTo(group);

        poly.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          if (onSelectShape) onSelectShape(idx);
        });

        const shapeCenter = calculatePolygonCenter(shape.coords);
        const badgeIcon = L.divIcon({
          className: 'facility-shape-sub-label',
          html: `<div style="transform: translate(-50%, -50%);" class="px-2 py-0.5 rounded-full ${isNet ? 'bg-emerald-900/90 text-emerald-200 border-emerald-400' : 'bg-amber-900/90 text-amber-200 border-amber-400'} border shadow-md text-[10px] font-bold whitespace-nowrap cursor-pointer select-none">${isNet ? '🏠' : '🌾'} ${shape.name}</div>`,
          iconSize: [120, 24],
          iconAnchor: [60, 12],
        });
        const badgeMarker = L.marker([shapeCenter.lat, shapeCenter.lng], { icon: badgeIcon }).addTo(group);
        badgeMarker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          if (onSelectShape) onSelectShape(idx);
        });
      });
    }

    // 2. Active Plot Polygon (>= 3 points) OR Polyline (2 points)
    if (coords.length >= 3) {
      const latlngs = coords.map((c) => [c.lat, c.lng] as [number, number]);
      const polygon = L.polygon(latlngs, {
        color: '#ffffff',
        weight: 3,
        opacity: 1,
        fillColor: selectedColor,
        fillOpacity: 0.72,
        interactive: true,
        className: 'cursor-grab active:cursor-grabbing',
      }).addTo(group);

      // REALTIME SHAPE MOVEMENT WHEN HOLDING LEFT-CLICK ON SHAPE AND MOVING
      polygon.on('mousedown', (e: L.LeafletMouseEvent) => {
        if (e.originalEvent.button !== 0) return; // Left mouse button only
        L.DomEvent.stopPropagation(e);
        isDraggingShapeRef.current = true;
        map.dragging.disable();

        if (containerRef.current) {
          containerRef.current.style.cursor = 'grabbing';
        }

        const startMouse = e.latlng;
        const initialCoords = [...coordsRef.current];

        const onMouseMove = (moveEvt: L.LeafletMouseEvent) => {
          const deltaLat = moveEvt.latlng.lat - startMouse.lat;
          const deltaLng = moveEvt.latlng.lng - startMouse.lng;
          const movedCoords = initialCoords.map((c) => ({
            lat: Number((c.lat + deltaLat).toFixed(6)),
            lng: Number((c.lng + deltaLng).toFixed(6)),
          }));
          onCoordsChange(movedCoords);
        };

        const onMouseUp = () => {
          isDraggingShapeRef.current = false;
          map.dragging.enable();
          if (containerRef.current) {
            containerRef.current.style.cursor = activeTabRef.current === 'draw' ? 'crosshair' : 'default';
          }
          map.off('mousemove', onMouseMove);
          map.off('mouseup', onMouseUp);
          window.removeEventListener('mouseup', onWindowMouseUp);
        };

        const onWindowMouseUp = () => {
          onMouseUp();
        };

        map.on('mousemove', onMouseMove);
        map.on('mouseup', onMouseUp);
        window.addEventListener('mouseup', onWindowMouseUp, { once: true });
      });
    } else if (coords.length === 2) {
      const latlngs = coords.map((c) => [c.lat, c.lng] as [number, number]);
      L.polyline(latlngs, {
        color: '#ffffff',
        weight: 3,
        opacity: 1,
      }).addTo(group);
    }

    // 3. Side Length Labels (Format: "40m" on each side)
    if (coords.length >= 2) {
      const segmentCount = coords.length === 2 ? 1 : coords.length;
      for (let i = 0; i < segmentCount; i++) {
        const p1 = coords[i];
        const p2 = coords[(i + 1) % coords.length];
        const distM = calculateHaversineDistanceM(p1, p2);
        const distText = formatMeterDistance(distM);

        const midLat = (p1.lat + p2.lat) / 2;
        const midLng = (p1.lng + p2.lng) / 2;

        const badgeIcon = L.divIcon({
          className: 'edge-length-badge',
          html: `<div style="transform: translate(-50%, -50%);" class="px-2 py-0.5 rounded-md bg-slate-950/85 text-emerald-300 border border-emerald-400/50 shadow-md text-[11px] font-mono font-bold whitespace-nowrap select-none pointer-events-none flex items-center gap-1 backdrop-blur-2xs">📏 ${distText}</div>`,
          iconSize: [60, 20],
          iconAnchor: [30, 10],
        });
        L.marker([midLat, midLng], { icon: badgeIcon, interactive: false }).addTo(group);
      }
    }

    // 4. Corner Vertex Pins (Disappeared numbers 1,2,3,4 - replaced by clean draggable handles)
    coords.forEach((c, idx) => {
      // Sleek anchor handle without point numbers
      const isFirstInDraw = activeTab === 'draw' && idx === 0 && coords.length >= 3;
      const html = isFirstInDraw
        ? `<div style="transform: translate(-50%, -50%);" class="w-5 h-5 rounded-full bg-emerald-500 border-2 border-white shadow-lg flex items-center justify-center cursor-pointer animate-pulse" title="Click to close & finish polygon"><div class="w-2 h-2 rounded-full bg-white"></div></div>`
        : `<div style="transform: translate(-50%, -50%);" class="w-4 h-4 rounded-full bg-white border-2 border-slate-900 shadow-md hover:scale-130 transition-transform flex items-center justify-center cursor-move"><div class="w-1.5 h-1.5 rounded-full bg-emerald-600"></div></div>`;

      const icon = L.divIcon({
        className: 'custom-vertex-pin',
        html,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      const marker = L.marker([c.lat, c.lng], {
        icon,
        draggable: true,
      }).addTo(group);

      if (isFirstInDraw) {
        marker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          onClosePolygonDrawing?.();
        });
      }

      // Drag vertex to adjust sides visually in real-time
      marker.on('dragstart', () => {
        map.dragging.disable();
      });

      marker.on('drag', (evt: L.LeafletEvent) => {
        const m = evt.target as L.Marker;
        const newLatLng = m.getLatLng();
        const updated = [...coordsRef.current];
        updated[idx] = {
          lat: Number(newLatLng.lat.toFixed(6)),
          lng: Number(newLatLng.lng.toFixed(6)),
        };
        onCoordsChange(updated);
      });

      marker.on('dragend', () => {
        map.dragging.enable();
      });
    });

    // 5. Searched Location Pin
    if (searchPin) {
      const pinLabel = searchPin.displayName ? searchPin.displayName.split(',')[0] : 'Searched Location';
      const html = `<div style="transform: translate(-50%, -100%);" class="flex flex-col items-center animate-bounce"><div class="px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded-md shadow-md whitespace-nowrap mb-0.5 max-w-[220px] truncate">📍 ${pinLabel}</div><div class="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow-lg"></div></div>`;
      const icon = L.divIcon({
        className: 'custom-search-pin',
        html,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
      });
      L.marker([searchPin.lat, searchPin.lng], { icon, interactive: false }).addTo(group);
    }
  }, [coords, selectedColor, otherPlots, searchPin, activeTab, onCoordsChange, onClosePolygonDrawing, allPlotShapes, activeShapeIndex, onSelectShape]);

  return <div ref={containerRef} className="w-full h-full" style={{ minHeight: '360px' }} />;
};

export const PlotShapeEditorModal: React.FC<PlotShapeEditorModalProps> = ({
  plot,
  isOpen,
  onClose,
  initialShapeId,
}) => {
  const { language } = useI18n();
  const { plots, updatePlot, deletePlot, setSelectedPlotId } = useFarm();

  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(plot);
  const [shapesList, setShapesList] = useState<FacilityShape[]>([]);
  const [activeShapeIndex, setActiveShapeIndex] = useState<number>(0);
  const [coords, setCoords] = useState<GeoCoordinate[]>([]);
  const [baseCoords, setBaseCoords] = useState<GeoCoordinate[]>([]);
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [moveStepMeters, setMoveStepMeters] = useState<number>(3);
  const [selectedColor, setSelectedColor] = useState<string>('#15803D');
  const [activeTab, setActiveTab] = useState<'presets' | 'draw' | 'adjust' | 'coords'>('presets');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Helper to extract or synthesize facility shapes from plot
  const initShapesFromPlot = (p: Plot): FacilityShape[] => {
    if (p.shapes && p.shapes.length > 0) {
      return p.shapes.map((s, idx) => ({
        ...s,
        id: s.id || `shape-${p.id}-${idx}`,
        name: s.name || `Facility ${idx + 1}`,
        facilityType: s.facilityType || 'net_house',
        coords: s.coords ? [...s.coords] : [],
        color: s.color || (s.facilityType === 'open_field' ? '#D97706' : '#15803D'),
        areaHa: s.areaHa || (s.coords && s.coords.length >= 3 ? calculatePolygonAreaHa(s.coords) : 0),
      }));
    }
    const initialCoords = p.polygonCoords ? [...p.polygonCoords] : [];
    const isNet = (p.facilityType as any) !== 'open_field';
    return [
      {
        id: `shape-${p.id}-1`,
        name: isNet ? 'Net House 1' : 'Open Field 1',
        facilityType: isNet ? 'net_house' : 'open_field',
        coords: initialCoords,
        color: p.color || (isNet ? '#15803D' : '#D97706'),
        areaHa: p.areaHa || (initialCoords.length >= 3 ? calculatePolygonAreaHa(initialCoords) : 1.0),
      },
    ];
  };

  // Side adjustment and dimension states
  const [sideInputs, setSideInputs] = useState<Record<number, number>>({});
  const [exactWidthInput, setExactWidthInput] = useState<number>(40);
  const [exactLengthInput, setExactLengthInput] = useState<number>(90);

  // Preset CRUD states
  const [presets, setPresets] = useState<ShapePreset[]>(() => {
    try {
      const saved = localStorage.getItem('melonpro_plot_shape_presets_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load presets from storage', e);
    }
    return DEFAULT_SHAPE_PRESETS;
  });

  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [isAddPresetModalOpen, setIsAddPresetModalOpen] = useState(false);
  const [newPresetSource, setNewPresetSource] = useState<'current' | 'dimensions'>('dimensions');
  const [newPresetWidth, setNewPresetWidth] = useState<number>(40);
  const [newPresetLength, setNewPresetLength] = useState<number>(90);
  const [newPresetCategory, setNewPresetCategory] = useState<'net_house' | 'open_field'>('net_house');
  const [presetFacilityFilter, setPresetFacilityFilter] = useState<'all' | 'net_house' | 'open_field'>('all');
  const [newPresetNameEn, setNewPresetNameEn] = useState('');
  const [newPresetNameKm, setNewPresetNameKm] = useState('');
  const [newPresetDescEn, setNewPresetDescEn] = useState('');
  const [newPresetDescKm, setNewPresetDescKm] = useState('');
  const [editingPreset, setEditingPreset] = useState<ShapePreset | null>(null);

  // Address Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchStatus, setSearchStatus] = useState<string | null>(null);
  const [searchPin, setSearchPin] = useState<{ lat: number; lng: number; displayName: string } | null>(null);
  const [targetPan, setTargetPan] = useState<GeoCoordinate | null>(null);

  // Click & Hold Movement Timers
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sync when plot prop or initialShapeId changes, or modal opens
  useEffect(() => {
    if (plot && isOpen) {
      setSelectedPlot(plot);
      const shapes = initShapesFromPlot(plot);
      setShapesList(shapes);
      let targetIndex = 0;
      if (initialShapeId) {
        const foundIdx = shapes.findIndex((s) => s.id === initialShapeId);
        if (foundIdx >= 0) {
          targetIndex = foundIdx;
        }
      }
      setActiveShapeIndex(targetIndex);
      const targetCoords = shapes[targetIndex]?.coords || [];
      setCoords(targetCoords);
      setBaseCoords(targetCoords);
      setRotationAngle(0);
      setSelectedColor(shapes[targetIndex]?.color || (shapes[targetIndex]?.facilityType === 'open_field' ? '#D97706' : '#15803D'));
      if (targetCoords.length >= 3) {
        setTargetPan(calculatePolygonCenter(targetCoords));
      } else if (plot.center) {
        setTargetPan(plot.center);
      }
      setSearchPin(null);
      setSearchStatus(null);
      setShowDeleteConfirm(false);
    }
  }, [plot, isOpen, initialShapeId]);

  // Synchronize active shape coords and color into shapesList
  useEffect(() => {
    setShapesList((prev) => {
      if (!prev[activeShapeIndex]) return prev;
      const cur = prev[activeShapeIndex];
      if (cur.coords === coords && cur.color === selectedColor) return prev;
      const copy = [...prev];
      copy[activeShapeIndex] = {
        ...cur,
        coords,
        areaHa: coords.length >= 3 ? calculatePolygonAreaHa(coords) : cur.areaHa,
        color: selectedColor,
      };
      return copy;
    });
  }, [coords, selectedColor, activeShapeIndex]);

  // Persist presets to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('melonpro_plot_shape_presets_v2', JSON.stringify(presets));
    } catch (e) {
      console.error('Failed to save presets to storage', e);
    }
  }, [presets]);

  // Cleanup movement timers
  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    };
  }, []);

  const { provider: globalProvider, arcgisApiKey } = useMapSettings();
  const [editorProvider, setEditorProvider] = useState<'google' | 'arcgis' | 'osm'>(() => {
    return globalProvider;
  });

  useEffect(() => {
    setEditorProvider(globalProvider);
  }, [globalProvider]);

  const currentCenter = selectedPlot?.center || { lat: 11.4886, lng: 104.8324 };
  const calculatedAreaM2 = calculatePolygonAreaM2(coords);
  const calculatedAreaHa = calculatePolygonAreaHa(coords);
  const calculatedPerimeterM = calculatePolygonPerimeterM(coords);

  const handleSelectPlotChange = (plotId: string) => {
    const found = plots.find((p) => p.id === plotId);
    if (found) {
      setSelectedPlot(found);
      const shapes = initShapesFromPlot(found);
      setShapesList(shapes);
      setActiveShapeIndex(0);
      const nextCoords = shapes[0]?.coords || [];
      setCoords(nextCoords);
      setBaseCoords(nextCoords);
      setRotationAngle(0);
      setSelectedColor(shapes[0]?.color || (shapes[0]?.facilityType === 'open_field' ? '#D97706' : '#15803D'));
      setTargetPan(found.center || currentCenter);
      setShowDeleteConfirm(false);
    }
  };

  // Facility Shape Switching & Management Handlers
  const handleSelectActiveShape = (idx: number) => {
    if (idx >= 0 && idx < shapesList.length) {
      setActiveShapeIndex(idx);
      const target = shapesList[idx];
      const targetCoords = target.coords ? [...target.coords] : [];
      setCoords(targetCoords);
      setBaseCoords(targetCoords);
      setRotationAngle(0);
      setSelectedColor(target.color || (target.facilityType === 'open_field' ? '#D97706' : '#15803D'));
      if (targetCoords.length >= 3) {
        setTargetPan(calculatePolygonCenter(targetCoords));
      }
    }
  };

  const handleToggleActiveShapeFacilityType = (newType: FacilityType) => {
    const isNet = newType === 'net_house';
    const defaultColor = isNet ? '#15803D' : '#D97706';
    setSelectedColor(defaultColor);
    setShapesList((prev) => {
      const copy = [...prev];
      if (copy[activeShapeIndex]) {
        const cur = copy[activeShapeIndex];
        copy[activeShapeIndex] = {
          ...cur,
          facilityType: newType,
          name: cur.name.startsWith('Net House') || cur.name.startsWith('Open Field') || cur.name.startsWith('Facility')
            ? `${isNet ? 'Net House' : 'Open Field'} ${activeShapeIndex + 1}`
            : cur.name,
          color: defaultColor,
        };
      }
      return copy;
    });
  };

  const handleAddFacilityShape = (type: FacilityType) => {
    const isNet = type === 'net_house';
    const newIdx = shapesList.length + 1;
    const curCenter = coords.length >= 3
      ? calculatePolygonCenter(coords)
      : (selectedPlot?.center || { lat: 11.4886, lng: 104.8324 });

    const offsetEastM = (shapesList.length % 2 === 0 ? 55 : -55);
    const offsetNorthM = (shapesList.length > 1 ? 40 : -40);
    const shiftedCenter = translatePolygonMeters([curCenter], offsetEastM, offsetNorthM)[0];
    const rectOffsets = createRectangleOffsets(isNet ? 30 : 50, isNet ? 80 : 100);
    const newCoords = generateShapeFromOffsets(shiftedCenter, rectOffsets);

    const newShape: FacilityShape = {
      id: `shape-${selectedPlot?.id || 'plot'}-${Date.now()}`,
      name: `${isNet ? 'Net House' : 'Open Field'} ${newIdx}`,
      facilityType: type,
      coords: newCoords,
      color: isNet ? '#15803D' : '#D97706',
      areaHa: calculatePolygonAreaHa(newCoords),
    };

    const nextList = [...shapesList, newShape];
    setShapesList(nextList);
    setActiveShapeIndex(nextList.length - 1);
    setCoords(newCoords);
    setBaseCoords(newCoords);
    setSelectedColor(newShape.color || (isNet ? '#15803D' : '#D97706'));
    setRotationAngle(0);
    setTargetPan(shiftedCenter);
  };

  const handleDeleteActiveShape = () => {
    if (shapesList.length <= 1) {
      alert(language === 'km' 
        ? 'រងដាំត្រូវតែមានយ៉ាងហោចណាស់ ១ សំណង់!' 
        : 'A plot must have at least one facility shape!');
      return;
    }
    const filtered = shapesList.filter((_, idx) => idx !== activeShapeIndex);
    const nextIdx = Math.max(0, activeShapeIndex - 1);
    setShapesList(filtered);
    setActiveShapeIndex(nextIdx);
    const target = filtered[nextIdx];
    if (target) {
      const targetCoords = target.coords ? [...target.coords] : [];
      setCoords(targetCoords);
      setBaseCoords(targetCoords);
      setSelectedColor(target.color || (target.facilityType === 'open_field' ? '#D97706' : '#15803D'));
      setRotationAngle(0);
    }
  };

  // --- Real-time Movement (Click & Hold) ---
  const moveShape = (deltaEastM: number, deltaNorthM: number) => {
    setCoords((prev) => {
      if (prev.length === 0) return prev;
      return translatePolygonMeters(prev, deltaEastM, deltaNorthM);
    });
    setBaseCoords((prev) => {
      if (prev.length === 0) return prev;
      return translatePolygonMeters(prev, deltaEastM, deltaNorthM);
    });
  };

  const stopHolding = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
  };

  const startHolding = (deltaEastM: number, deltaNorthM: number) => {
    // Immediate step
    moveShape(deltaEastM, deltaNorthM);
    stopHolding();

    // After 180ms hold delay, trigger continuous moves every 40ms
    holdTimerRef.current = setTimeout(() => {
      holdIntervalRef.current = setInterval(() => {
        moveShape(deltaEastM, deltaNorthM);
      }, 40);
    }, 180);
  };

  // --- Real-time Rotation Slider ---
  const handleRotationChange = (newAngle: number) => {
    setRotationAngle(newAngle);
    if (baseCoords.length < 3) return;
    const center = calculatePolygonCenter(baseCoords);
    const rotated = rotatePolygon(baseCoords, newAngle, center);
    setCoords(rotated);
  };

  const handleResetRotation = () => {
    setRotationAngle(0);
    setCoords([...baseCoords]);
  };

  // Automatically calculate detected rectangle dimensions if 4 corners
  useEffect(() => {
    if (coords.length === 4) {
      const d0 = calculateHaversineDistanceM(coords[0], coords[1]);
      const d1 = calculateHaversineDistanceM(coords[1], coords[2]);
      const d2 = calculateHaversineDistanceM(coords[2], coords[3]);
      const d3 = calculateHaversineDistanceM(coords[3], coords[0]);
      const avgW = Math.round((d0 + d2) / 2);
      const avgL = Math.round((d1 + d3) / 2);
      if (avgW > 0) setExactWidthInput(avgW);
      if (avgL > 0) setExactLengthInput(avgL);
    }
  }, [coords]);

  const handleCoordsChange = (newCoords: GeoCoordinate[]) => {
    setCoords(newCoords);
    setBaseCoords(newCoords);
  };

  const handleAdjustSide = (sideIndex: number, targetM: number) => {
    if (coords.length < 2 || targetM <= 0) return;
    const updated = adjustPolygonSideLength(coords, sideIndex, targetM);
    setCoords(updated);
    setBaseCoords(updated);
  };

  const handleSetExactRectangle = (widthM: number, lengthM: number) => {
    if (widthM <= 0 || lengthM <= 0) return;
    const center = coords.length > 0 ? calculatePolygonCenter(coords) : currentCenter;
    const updated = setPolygonRectangleDimensions(center, widthM, lengthM, rotationAngle);
    setCoords(updated);
    setBaseCoords(updated);
  };

  const handleClosePolygonDrawing = () => {
    if (coords.length >= 3) {
      setActiveTab('adjust');
    }
  };

  // --- Presets Actions ---
  const handleApplyPreset = (preset: ShapePreset) => {
    const center = coords.length > 0 ? calculatePolygonCenter(coords) : currentCenter;
    const newShape = generateShapeFromOffsets(center, preset.offsets);
    setBaseCoords(newShape);
    setRotationAngle(0);
    setCoords(newShape);
    setActivePresetId(preset.id);

    // Synchronize active facility shape's facility type to match preset category
    const presetCat = preset.category;
    if (presetCat === 'open_field' || presetCat === 'field') {
      handleToggleActiveShapeFacilityType('open_field');
    } else if (presetCat === 'net_house' || presetCat === 'greenhouse' || presetCat === 'facility') {
      handleToggleActiveShapeFacilityType('net_house');
    }
  };

  const handleOpenAddPreset = () => {
    setNewPresetNameEn('');
    setNewPresetNameKm('');
    const curFacilityType = shapesList[activeShapeIndex]?.facilityType || 'net_house';
    const isNet = curFacilityType === 'net_house';
    setNewPresetCategory(isNet ? 'net_house' : 'open_field');

    if (coords.length >= 3) {
      setNewPresetSource('current');
      setNewPresetDescEn(`${coords.length}-point ${isNet ? 'net house' : 'open field'} custom polygon`);
      setNewPresetDescKm(`រាងពហុកោណ ${coords.length} ជ្រុង សម្រាប់${isNet ? 'ផ្ទះសំណាញ់' : 'ចំការវាល'}`);
    } else {
      setNewPresetSource('dimensions');
      setNewPresetDescEn(`${newPresetWidth}m × ${newPresetLength}m ${isNet ? 'net house' : 'open field'}`);
      setNewPresetDescKm(`${isNet ? 'ផ្ទះសំណាញ់' : 'ចំការវាល'}ទំហំ ${newPresetWidth}ម × ${newPresetLength}ម`);
    }
    setNewPresetWidth(exactWidthInput || 40);
    setNewPresetLength(exactLengthInput || 90);
    setIsAddPresetModalOpen(true);
  };

  const handleSaveNewPreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetNameEn.trim()) return;

    let offsets: { dx: number; dy: number }[] = [];
    if (newPresetSource === 'dimensions' || coords.length < 3) {
      offsets = createRectangleOffsets(newPresetWidth, newPresetLength);
    } else {
      const center = calculatePolygonCenter(coords);
      offsets = coordsToMeterOffsets(coords, center);
    }

    const newPreset: ShapePreset = {
      id: `preset-custom-${Date.now()}`,
      nameEn: newPresetNameEn.trim(),
      nameKm: newPresetNameKm.trim() || newPresetNameEn.trim(),
      descriptionEn: newPresetDescEn.trim() || (newPresetSource === 'dimensions' ? `${newPresetWidth}m × ${newPresetLength}m rectangle` : `${coords.length}-point custom polygon`),
      descriptionKm: newPresetDescKm.trim() || (newPresetSource === 'dimensions' ? `រាងបួនជ្រុង ${newPresetWidth}ម × ${newPresetLength}ម` : `${coords.length} ជ្រុង ទំហំផ្ទាល់ខ្លួន`),
      category: newPresetCategory,
      isCustom: true,
      offsets,
    };

    setPresets((prev) => [newPreset, ...prev]);
    setActivePresetId(newPreset.id);
    handleApplyPreset(newPreset);
    setIsAddPresetModalOpen(false);
  };

  const handleUpdatePreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPreset) return;

    setPresets((prev) =>
      prev.map((p) => (p.id === editingPreset.id ? editingPreset : p))
    );
    setEditingPreset(null);
  };

  const handleDeletePreset = (id: string, name: string) => {
    const confirmMsg = language === 'km'
      ? `តើអ្នកចង់លុបរាងគំរូ "${name}" មែនទេ?`
      : `Are you sure you want to delete preset "${name}"?`;
    if (window.confirm(confirmMsg)) {
      setPresets((prev) => prev.filter((p) => p.id !== id));
      if (activePresetId === id) setActivePresetId(null);
    }
  };

  const handleResetDefaultPresets = () => {
    const confirmMsg = language === 'km'
      ? 'តើអ្នកចង់កំណត់រាងគំរូទៅទម្រង់ដើមវិញទេ?'
      : 'Reset all presets to default templates?';
    if (window.confirm(confirmMsg)) {
      setPresets(DEFAULT_SHAPE_PRESETS);
      localStorage.setItem('melonpro_plot_shape_presets_v2', JSON.stringify(DEFAULT_SHAPE_PRESETS));
    }
  };

  // --- Address Search ---
  const handleSearchAddress = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    setIsSearching(true);
    setSearchStatus(null);

    // 0. Check if query is Latitude and Longitude coordinates (e.g. 12.9313667,102.8427579)
    const coordMatch = parseCoordinatesFromText(query);
    if (coordMatch) {
      const { lat, lng } = coordMatch;
      const formatted = `${lat.toFixed(7)}, ${lng.toFixed(7)}`;
      const point = { lat, lng };

      setSearchPin({
        lat,
        lng,
        displayName: `${formatted} (GPS Coordinates)`,
      });
      setTargetPan(point);
      setSearchStatus(`${formatted} — ${language === 'km' ? 'កូអរដោនេ GPS' : 'GPS Coordinates'}`);
      setIsSearching(false);

      // Asynchronously enrich with reverse geocoding if available
      try {
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=15`, {
          headers: { 'Accept-Language': language === 'km' ? 'km,en' : 'en' },
        })
          .then((r) => r.json())
          .then((rev) => {
            if (rev && rev.display_name) {
              const placeName = rev.display_name.split(',').slice(0, 3).join(', ');
              setSearchStatus(`${formatted} (${placeName})`);
              setSearchPin({
                lat,
                lng,
                displayName: `${placeName} (${lat.toFixed(6)}, ${lng.toFixed(6)})`,
              });
            }
          })
          .catch(() => {});
      } catch (_) {}

      return;
    }

    // 1. Check local agricultural hubs first
    const localMatch = AGRICULTURAL_HUBS.find((hub) =>
      hub.name.toLowerCase().includes(query.toLowerCase()) ||
      hub.province.toLowerCase().includes(query.toLowerCase())
    );

    if (localMatch) {
      const point = { lat: localMatch.lat, lng: localMatch.lng };
      setSearchPin({
        lat: point.lat,
        lng: point.lng,
        displayName: `${localMatch.name}, ${localMatch.province}, Cambodia`,
      });
      setTargetPan(point);
      setSearchStatus(`${localMatch.name}, ${localMatch.province}`);
      setIsSearching(false);
      return;
    }

    // 2. Query OpenStreetMap Nominatim Geocoding API
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query + ' Cambodia'
        )}&limit=3`
      );
      const data = await res.json();

      if (Array.isArray(data) && data.length > 0) {
        const top = data[0];
        const lat = parseFloat(top.lat);
        const lng = parseFloat(top.lon);
        const point = { lat, lng };

        setSearchPin({
          lat,
          lng,
          displayName: top.display_name,
        });
        setTargetPan(point);
        setSearchStatus(top.display_name.split(',').slice(0, 3).join(', '));
      } else {
        // Fallback search without country lock
        const resGlobal = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            query
          )}&limit=1`
        );
        const dataGlobal = await resGlobal.json();
        if (Array.isArray(dataGlobal) && dataGlobal.length > 0) {
          const top = dataGlobal[0];
          const lat = parseFloat(top.lat);
          const lng = parseFloat(top.lon);
          const point = { lat, lng };

          setSearchPin({
            lat,
            lng,
            displayName: top.display_name,
          });
          setTargetPan(point);
          setSearchStatus(top.display_name.split(',').slice(0, 3).join(', '));
        } else {
          setSearchStatus(language === 'km' ? 'រកមិនឃើញអាសយដ្ឋាននេះទេ' : 'Address not found');
        }
      }
    } catch (err) {
      console.error('Geocoding error:', err);
      setSearchStatus(language === 'km' ? 'បញ្ហាក្នុងការស្វែងរក' : 'Search request failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSnapShapeToLocation = (targetLoc: GeoCoordinate) => {
    if (coords.length === 0) {
      // If no coords, generate standard greenhouse at that target
      const standardPreset = presets[0] || DEFAULT_SHAPE_PRESETS[0];
      handleApplyPreset(standardPreset);
      setTargetPan(targetLoc);
      return;
    }

    const curCenter = calculatePolygonCenter(coords);
    const deltaLat = targetLoc.lat - curCenter.lat;
    const deltaLng = targetLoc.lng - curCenter.lng;

    const shifted = coords.map((c) => ({
      lat: Number((c.lat + deltaLat).toFixed(6)),
      lng: Number((c.lng + deltaLng).toFixed(6)),
    }));
    const shiftedBase = baseCoords.map((c) => ({
      lat: Number((c.lat + deltaLat).toFixed(6)),
      lng: Number((c.lng + deltaLng).toFixed(6)),
    }));

    setCoords(shifted);
    setBaseCoords(shiftedBase);
    setTargetPan(targetLoc);
  };

  // --- Map Click Drawing Mode ---
  const handleMapClick = (newCoord: GeoCoordinate) => {
    if (activeTab === 'draw') {
      const next = [...coords, newCoord];
      setCoords(next);
      setBaseCoords(next);
      setRotationAngle(0);
    }
  };

  const handleRemoveLastPoint = () => {
    const next = coords.slice(0, -1);
    setCoords(next);
    setBaseCoords(next);
    setRotationAngle(0);
  };

  const handleClearPoints = () => {
    setCoords([]);
    setBaseCoords([]);
    setRotationAngle(0);
    setActivePresetId(null);
  };

  const handleConfirmDeletePlot = () => {
    if (!selectedPlot) return;
    deletePlot(selectedPlot.id);
    setShowDeleteConfirm(false);
    onClose();
  };

  // --- Save to Farm Context ---
  const handleSaveShape = () => {
    if (!selectedPlot) return;
    if (coords.length < 3) {
      alert(language === 'km' 
        ? 'សូមបញ្ចូលយ៉ាងហោចណាស់ ៣ ចំណុចដើម្បីបង្កើតរាងរងដាំ!' 
        : 'Please provide at least 3 corner points to form a polygon shape!');
      return;
    }

    // Finalize all shapes in shapesList with the latest coords & area for activeShapeIndex
    const finalizedShapes: FacilityShape[] = shapesList.map((s, idx) => {
      if (idx === activeShapeIndex) {
        const sM2 = calculatedAreaM2 > 0 ? calculatedAreaM2 : (s.areaM2 || (calculatedAreaHa > 0 ? Math.round(calculatedAreaHa * 10000) : 3600));
        return {
          ...s,
          coords: coords,
          areaHa: calculatedAreaHa > 0 ? calculatedAreaHa : s.areaHa,
          areaM2: sM2,
          plantCount: s.plantCount !== undefined ? s.plantCount : Math.round(sM2 * 0.75),
          color: selectedColor,
        };
      }
      const sM2 = s.areaM2 || (s.areaHa ? Math.round(s.areaHa * 10000) : 3600);
      return {
        ...s,
        areaM2: sM2,
        plantCount: s.plantCount !== undefined ? s.plantCount : Math.round(sM2 * 0.75),
      };
    });

    const derivedTypes: FacilityType[] = Array.from(new Set(finalizedShapes.map((s) => s.facilityType)));
    const totalAreaM2 = Math.round(finalizedShapes.reduce((sum, s) => sum + (s.areaM2 || 0), 0));
    const totalAreaHa = Number((totalAreaM2 / 10000).toFixed(2));
    const totalPlantCount = finalizedShapes.reduce((sum, s) => sum + (s.plantCount || 0), 0);
    const primaryShape = finalizedShapes[0];

    const updated: Plot = {
      ...selectedPlot,
      shapes: finalizedShapes,
      facilityTypes: derivedTypes.length > 0 ? derivedTypes : ['net_house'],
      facilityType: derivedTypes[0] || 'net_house',
      polygonCoords: primaryShape ? primaryShape.coords : coords,
      center: primaryShape?.coords && primaryShape.coords.length >= 3 ? calculatePolygonCenter(primaryShape.coords) : calculatePolygonCenter(coords),
      areaHa: totalAreaHa > 0 ? totalAreaHa : selectedPlot.areaHa,
      areaM2: totalAreaM2 > 0 ? totalAreaM2 : (selectedPlot.areaM2 || Math.round(selectedPlot.areaHa * 10000)),
      plantCount: totalPlantCount > 0 ? totalPlantCount : selectedPlot.plantCount,
      color: primaryShape?.color || selectedColor,
    };

    updatePlot(updated);
    setSelectedPlotId(updated.id);
    setSavedSuccess(true);

    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  if (!isOpen || !selectedPlot) return null;

  const modalElement = (
    <div 
      className="fixed inset-0 z-[99999] bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in-50"
      style={{ zIndex: 99999 }}
    >
      <div 
        className="bg-white rounded-2xl w-full max-w-6xl xl:max-w-7xl max-h-[95vh] h-[93vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden relative"
        style={{ zIndex: 100000 }}
      >
        {/* Header with Plot Switcher & Large Title */}
        <div className="shrink-0 px-5 py-3.5 border-b border-slate-200/90 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-xs shrink-0"
              style={{ backgroundColor: selectedColor }}
            >
              <PenTool className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span>Plot Shape & Boundary Editor</span>
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold border border-emerald-200">
                  {selectedPlot.code}
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded-md">
                  <Maximize2 className="w-3 h-3 text-slate-600" /> Widescreen Editor
                </span>
              </div>
              <p className="text-xs text-slate-500 font-khmer mt-0.5">
                {language === 'km' 
                  ? 'កំណត់ និងគូសរាងព្រំប្រទល់រងដាំលើផែនទីផ្កាយរណប គ្រប់គ្រងរាងគំរូ និងបង្វិលរំកិលតាមពេលវេលាជាក់ស្តែង' 
                  : 'Design plot boundaries on satellite map with real-time translation, rotation & custom presets'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Plot Switcher */}
            <div className="flex items-center gap-2">
              <span className="hidden md:inline text-xs font-bold text-slate-600">
                {language === 'km' ? 'ជ្រើសរើសរង:' : 'Target Plot:'}
              </span>
              <select
                value={selectedPlot.id}
                onChange={(e) => handleSelectPlotChange(e.target.value)}
                className="text-xs font-bold bg-white border border-slate-300 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 shadow-2xs"
              >
                {plots.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.areaHa} ha)
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors"
              title="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Body (2 Columns: Map Column 7-8 cols / Presets Sidebar 4-5 cols) */}
        <div className="flex-1 min-h-0 overflow-hidden grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          
          {/* LEFT COLUMN: Map Viewport with Address Search & Realtime Controls (lg:col-span-8) */}
          <div className="lg:col-span-8 p-3 sm:p-4 flex flex-col gap-3 min-h-0 h-full overflow-y-auto">
            
            {/* FEATURE 4: Search Address Toolbar */}
            <div className="bg-slate-50/90 rounded-xl p-2.5 border border-slate-200/90 shadow-2xs space-y-2 shrink-0">
              <form onSubmit={handleSearchAddress} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={language === 'km' 
                      ? 'ស្វែងរកអាសយដ្ឋាន ឬកូអរដោនេ GPS (ឧ. 12.9313667,102.8427579 ឬ Kandal Stung)...' 
                      : 'Search farm address or Lat, Lng coordinates (e.g. 12.9313667,102.8427579 or Kandal Stung)...'}
                    className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 placeholder-slate-400 shadow-inner"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => { setSearchQuery(''); setSearchStatus(null); }}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSearching || !searchQuery.trim()}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 shrink-0"
                >
                  {isSearching ? (
                    <span className="inline-block animate-spin">⏳</span>
                  ) : (
                    <Navigation className="w-3.5 h-3.5" />
                  )}
                  <span>{language === 'km' ? 'ស្វែងរក' : 'Search Address'}</span>
                </button>
              </form>

              {/* Quick Cambodia Hub Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-[11px] text-slate-600">
                <span className="font-semibold text-slate-400 shrink-0 text-[10px] uppercase tracking-wider">
                  {language === 'km' ? 'តំបន់កសិកម្ម:' : 'Agri Hubs:'}
                </span>
                {/* 1-Click GPS Coordinate Sample */}
                <button
                  type="button"
                  onClick={() => {
                    const sampleCoord = '12.9313667, 102.8427579';
                    setSearchQuery(sampleCoord);
                    const point = { lat: 12.9313667, lng: 102.8427579 };
                    setSearchPin({
                      lat: point.lat,
                      lng: point.lng,
                      displayName: `GPS: ${sampleCoord}`,
                    });
                    setTargetPan(point);
                    setSearchStatus(`${sampleCoord} — GPS Coordinates`);
                  }}
                  className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition-colors shrink-0 font-mono text-[10px] font-bold"
                  title="Click to search GPS Coordinates 12.9313667, 102.8427579"
                >
                  🌐 12.9313, 102.8427
                </button>
                {AGRICULTURAL_HUBS.map((hub) => (
                  <button
                    key={hub.name}
                    type="button"
                    onClick={() => {
                      setSearchQuery(hub.name);
                      setSearchPin({
                        lat: hub.lat,
                        lng: hub.lng,
                        displayName: `${hub.name}, ${hub.province}`,
                      });
                      setTargetPan({ lat: hub.lat, lng: hub.lng });
                      setSearchStatus(`${hub.name}, ${hub.province}`);
                    }}
                    className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors shrink-0 font-medium text-[10px]"
                  >
                    📍 {hub.name}
                  </button>
                ))}
              </div>

              {/* Search Result Banner with Snap Shape Action */}
              {searchStatus && (
                <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-200 text-xs animate-in fade-in">
                  <div className="flex items-center gap-1.5 text-emerald-900 truncate">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="font-bold truncate">{searchStatus}</span>
                  </div>
                  {searchPin && (
                    <button
                      type="button"
                      onClick={() => handleSnapShapeToLocation(searchPin)}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[11px] font-bold shadow-2xs transition-colors shrink-0 flex items-center gap-1"
                    >
                      <Crosshair className="w-3 h-3" />
                      <span>{language === 'km' ? 'ដាក់រាងរងដាំនៅទីនេះ' : 'Snap Shape Here'}</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Satellite Map Canvas */}
            <div className="relative w-full flex-1 min-h-[360px] sm:min-h-[420px] rounded-xl overflow-hidden border border-slate-200 bg-slate-950 shadow-inner">
              <LeafletShapeEditor
                provider={editorProvider}
                arcgisApiKey={arcgisApiKey}
                center={currentCenter}
                targetPan={targetPan}
                onPanHandled={() => setTargetPan(null)}
                onClickMap={handleMapClick}
                onCoordsChange={handleCoordsChange}
                coords={coords}
                selectedColor={selectedColor}
                otherPlots={plots.filter((p) => p.id !== selectedPlot.id)}
                searchPin={searchPin}
                activeTab={activeTab}
                onClosePolygonDrawing={handleClosePolygonDrawing}
                allPlotShapes={shapesList}
                activeShapeIndex={activeShapeIndex}
                onSelectShape={handleSelectActiveShape}
              />

              {/* Map Floating Badges & Engine Switcher */}
              <div className="absolute top-2.5 left-2.5 right-2.5 pointer-events-none flex items-center justify-between gap-2 z-[1000]">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="bg-black/85 backdrop-blur-xs text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-md flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full ring-2 ring-white/50 animate-pulse" style={{ backgroundColor: selectedColor }}></span>
                    <span className="font-bold text-emerald-300">
                      {shapesList[activeShapeIndex]?.facilityType === 'open_field' ? '🌾' : '🏠'} {shapesList[activeShapeIndex]?.name || `Facility ${activeShapeIndex + 1}`}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-200">
                      {activeTab === 'draw'
                        ? (language === 'km' 
                            ? `ចុចលើផែនទី (${coords.length} ចំណុច) - ចុចលើចំណុចបៃតងដំបូងដើម្បីបញ្ចប់` 
                            : `Click map (${coords.length} placed) - Click green 1st point to close`)
                        : activeTab === 'adjust'
                        ? (language === 'km'
                            ? 'អូសចំណុច ឬចុចសង្កត់លើរាងដើម្បីរំកិល'
                            : 'Drag corner anchors or hold left-click on shape to move')
                        : (language === 'km' 
                            ? 'រាងគំរូសកម្ម — ចុចសង្កត់លើរាងដើម្បីរំកិល' 
                            : 'Preset active — Hold left-click on shape to move or rotate')}
                    </span>
                  </span>
                </div>

                <div className="flex items-center gap-1.5 pointer-events-auto">
                  {/* Provider Switcher */}
                  <div className="flex items-center bg-black/80 backdrop-blur-md rounded-lg p-0.5 border border-white/20 shadow-md">
                    <button
                      type="button"
                      onClick={() => setEditorProvider('google')}
                      className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                        editorProvider === 'google'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      Google
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditorProvider('arcgis')}
                      className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                        editorProvider === 'arcgis'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      ArcGIS Satellite
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditorProvider('osm')}
                      className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                        editorProvider === 'osm'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      OSM
                    </button>
                  </div>

                  <span className="bg-black/80 backdrop-blur-xs text-emerald-300 px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold shadow-md">
                    {coords.length} corners
                  </span>
                  {rotationAngle !== 0 && (
                    <span className="bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold shadow-md">
                      🔄 {rotationAngle}°
                    </span>
                  )}
                </div>
              </div>

              {/* Reset view / Center to shape overlay button */}
              <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    if (coords.length > 0) {
                      setTargetPan(calculatePolygonCenter(coords));
                    } else {
                      setTargetPan(currentCenter);
                    }
                  }}
                  className="px-2.5 py-1.5 bg-black/80 hover:bg-black text-white text-[11px] font-semibold rounded-lg shadow-md transition-all flex items-center gap-1 backdrop-blur-xs border border-white/20"
                  title="Pan map to shape center"
                >
                  <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Center View</span>
                </button>
              </div>
            </div>

            {/* FEATURE 3: Move Preset (Realtime Click & Hold) & Rotate Slide Bar Controller */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/90 shadow-2xs space-y-3 shrink-0">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                
                {/* 3A: Realtime Move Controller with Click & Hold */}
                <div className="md:col-span-5 flex items-center gap-3 bg-white p-2.5 rounded-xl border border-slate-200">
                  {/* D-Pad Buttons */}
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={coords.length === 0}
                      onMouseDown={() => startHolding(0, moveStepMeters)}
                      onMouseUp={stopHolding}
                      onMouseLeave={stopHolding}
                      onTouchStart={() => startHolding(0, moveStepMeters)}
                      onTouchEnd={stopHolding}
                      className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-emerald-100 active:bg-emerald-600 active:text-white border border-slate-300 text-slate-700 flex items-center justify-center transition-all disabled:opacity-40 shadow-2xs"
                      title="Hold to move North"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={coords.length === 0}
                        onMouseDown={() => startHolding(-moveStepMeters, 0)}
                        onMouseUp={stopHolding}
                        onMouseLeave={stopHolding}
                        onTouchStart={() => startHolding(-moveStepMeters, 0)}
                        onTouchEnd={stopHolding}
                        className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-emerald-100 active:bg-emerald-600 active:text-white border border-slate-300 text-slate-700 flex items-center justify-center transition-all disabled:opacity-40 shadow-2xs"
                        title="Hold to move West"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </button>

                      <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold">
                        <Move className="w-3.5 h-3.5" />
                      </div>

                      <button
                        type="button"
                        disabled={coords.length === 0}
                        onMouseDown={() => startHolding(moveStepMeters, 0)}
                        onMouseUp={stopHolding}
                        onMouseLeave={stopHolding}
                        onTouchStart={() => startHolding(moveStepMeters, 0)}
                        onTouchEnd={stopHolding}
                        className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-emerald-100 active:bg-emerald-600 active:text-white border border-slate-300 text-slate-700 flex items-center justify-center transition-all disabled:opacity-40 shadow-2xs"
                        title="Hold to move East"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      disabled={coords.length === 0}
                      onMouseDown={() => startHolding(0, -moveStepMeters)}
                      onMouseUp={stopHolding}
                      onMouseLeave={stopHolding}
                      onTouchStart={() => startHolding(0, -moveStepMeters)}
                      onTouchEnd={stopHolding}
                      className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-emerald-100 active:bg-emerald-600 active:text-white border border-slate-300 text-slate-700 flex items-center justify-center transition-all disabled:opacity-40 shadow-2xs"
                      title="Hold to move South"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Move Instructions & Step Size */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-800">
                        {language === 'km' ? 'រំកិលរាង (ចុចសង្កត់)' : 'Move Preset (Hold)'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-khmer mt-0.5 leading-tight">
                      {language === 'km' 
                        ? 'ចុចសង្កត់លើព្រួញដើម្បីរំកិលរាងលើផែនទីភ្លាមៗ' 
                        : 'Click & hold arrow to glide preset across map in real-time'}
                    </p>
                    
                    <div className="flex items-center gap-1 mt-1.5">
                      <span className="text-[10px] font-semibold text-slate-400">Step:</span>
                      {[1, 3, 10].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setMoveStepMeters(s)}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-colors ${
                            moveStepMeters === s
                              ? 'bg-emerald-700 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {s}m
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3B: Rotate Slide Bar with Number ° Clockwise */}
                <div className="md:col-span-7 bg-white p-2.5 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Compass className="w-4 h-4 text-emerald-700" />
                      <span className="text-xs font-bold text-slate-800">
                        {language === 'km' ? 'បង្វិលតាមទ្រនិចនាឡិកា' : 'Rotate Clockwise'}
                      </span>
                    </div>

                    {/* Numeric readout badge */}
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {rotationAngle}° Clockwise
                      </span>
                      <button
                        type="button"
                        onClick={handleResetRotation}
                        disabled={rotationAngle === 0}
                        className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 disabled:opacity-30 transition-colors"
                        title="Reset Rotation to 0°"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Range Slider */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-400">0°</span>
                    <input
                      type="range"
                      min={0}
                      max={360}
                      step={1}
                      value={rotationAngle}
                      onChange={(e) => handleRotationChange(Number(e.target.value))}
                      disabled={coords.length < 3}
                      className="flex-1 accent-emerald-600 cursor-pointer disabled:opacity-40 h-2 bg-slate-200 rounded-lg"
                    />
                    <span className="text-[10px] font-mono text-slate-400">360°</span>
                  </div>

                  {/* Quick Degree Buttons */}
                  <div className="flex items-center justify-between gap-1 pt-0.5">
                    {[0, 45, 90, 135, 180, 270].map((deg) => (
                      <button
                        key={deg}
                        type="button"
                        onClick={() => handleRotationChange(deg)}
                        disabled={coords.length < 3}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                          rotationAngle === deg
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-40'
                        }`}
                      >
                        {deg}°
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Action Tools & Live Metrics Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200/80 text-xs">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleRemoveLastPoint}
                    disabled={coords.length === 0}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-colors flex items-center gap-1 font-semibold text-[11px]"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>{language === 'km' ? 'ថយក្រោយ' : 'Undo Point'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleClearPoints}
                    disabled={coords.length === 0}
                    className="px-2.5 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-40 transition-colors flex items-center gap-1 font-semibold text-[11px] cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>{language === 'km' ? 'សម្អាតទាំងអស់' : 'Clear All'}</span>
                  </button>

                  {/* Delete Plot Button (placed immediately after Clear All) */}
                  {!showDeleteConfirm ? (
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={!selectedPlot}
                      className="px-2.5 py-1.5 rounded-lg border border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:border-rose-400 disabled:opacity-40 transition-colors flex items-center gap-1 font-semibold text-[11px] shadow-2xs cursor-pointer"
                      title={language === 'km' ? 'លុបរងដាំនេះចេញពីចំការ' : 'Delete this plot from farm'}
                    >
                      <Trash2 className="w-3 h-3 text-rose-600" />
                      <span>{language === 'km' ? 'លុបរងដាំ' : 'Delete Plot'}</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1 bg-rose-50 border border-rose-300 rounded-lg p-0.5 animate-in fade-in-50">
                      <span className="text-[10px] font-bold text-rose-800 px-1 font-khmer">
                        {language === 'km' ? `លុប ${selectedPlot?.name}?` : `Delete ${selectedPlot?.name}?`}
                      </span>
                      <button
                        type="button"
                        onClick={handleConfirmDeletePlot}
                        className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold shadow-2xs transition-colors flex items-center gap-0.5 cursor-pointer"
                      >
                        <Check className="w-2.5 h-2.5" />
                        <span>{language === 'km' ? 'លុប' : 'Yes'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[10px] font-semibold transition-colors cursor-pointer"
                      >
                        <X className="w-2.5 h-2.5" />
                        <span>{language === 'km' ? 'បោះបង់' : 'Cancel'}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Metrics */}
                <div className="flex items-center gap-3 text-slate-700 font-mono text-xs">
                  <span className="font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded">
                    {calculatedAreaHa} ha
                  </span>
                  <span className="text-slate-400">·</span>
                  <span className="text-slate-600 font-medium">
                    {calculatedAreaM2.toLocaleString()} m²
                  </span>
                  <span className="text-slate-400">·</span>
                  <span className="text-slate-600 font-medium">
                    {calculatedPerimeterM} m perimeter
                  </span>
                </div>
              </div>

            </div>

          </div>

          {/* RIGHT COLUMN: Presets Management & Shape Customization (lg:col-span-4) */}
          <div className="lg:col-span-4 p-3 sm:p-4 flex flex-col justify-between space-y-4 min-h-0 h-full overflow-y-auto bg-slate-50/40">
            <div className="space-y-4">
              
              {/* Tab Navigation: Presets / Draw / Adjust / Coordinates */}
              <div className="bg-slate-200/70 p-1 rounded-xl flex items-center text-xs font-semibold gap-0.5">
                <button
                  type="button"
                  onClick={() => setActiveTab('presets')}
                  className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
                    activeTab === 'presets' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{language === 'km' ? 'រាងគំរូ' : 'Presets'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('draw')}
                  className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
                    activeTab === 'draw' ? 'bg-white text-emerald-800 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <PenTool className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{language === 'km' ? 'គូសចំណុច' : 'Draw'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('adjust')}
                  className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
                    activeTab === 'adjust' ? 'bg-white text-emerald-800 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{language === 'km' ? 'កែជ្រុង' : 'Adjust'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('coords')}
                  className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
                    activeTab === 'coords' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{language === 'km' ? 'កូអរដោនេ' : 'Coords'}</span>
                </button>
              </div>

              {/* TAB 1: PRESETS MANAGEMENT (Add, Edit, Delete Presets) with Facilities directly Above */}
              {activeTab === 'presets' && (
                <div className="space-y-3.5">
                  {/* COMBINED PART 1: Facilities on Plot (Moved to above Shape Presets Library) */}
                  <div className="bg-white rounded-2xl p-3 border border-slate-200/90 shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-emerald-700" />
                        <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">
                          {language === 'km' ? 'សំណង់លើរងដាំ (Facilities)' : 'Plot Facilities'}
                        </span>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                          {shapesList.length}
                        </span>
                      </div>

                      {/* Add Facility Shape Buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleAddFacilityShape('net_house')}
                          className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[10px] font-bold transition-colors flex items-center gap-0.5 cursor-pointer"
                          title="Add another Net House structure to this plot"
                        >
                          <Plus className="w-3 h-3 text-emerald-700" />
                          <span>🏠 {language === 'km' ? 'ផ្ទះសំណាញ់' : 'Net House'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddFacilityShape('open_field')}
                          className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-[10px] font-bold transition-colors flex items-center gap-0.5 cursor-pointer"
                          title="Add another Open Field parcel to this plot"
                        >
                          <Plus className="w-3 h-3 text-amber-700" />
                          <span>🌾 {language === 'km' ? 'ចំការវាល' : 'Open Field'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Facility Shape Selection Cards */}
                    <div className="grid grid-cols-2 gap-1.5 max-h-[130px] overflow-y-auto pr-0.5">
                      {shapesList.map((shape, idx) => {
                        const isActive = idx === activeShapeIndex;
                        const isNet = shape.facilityType === 'net_house';
                        return (
                          <button
                            key={shape.id || idx}
                            type="button"
                            onClick={() => handleSelectActiveShape(idx)}
                            className={`p-2 rounded-xl text-left transition-all border flex items-center justify-between gap-1 cursor-pointer ${
                              isActive
                                ? isNet
                                  ? 'bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-400/50 shadow-2xs'
                                  : 'bg-amber-50/90 border-amber-500 ring-2 ring-amber-400/50 shadow-2xs'
                                : 'bg-slate-50/70 border-slate-200 hover:bg-white hover:border-slate-300 text-slate-700'
                            }`}
                          >
                            <div className="min-w-0 flex items-center gap-1.5 truncate">
                              <span className="text-xs shrink-0">{isNet ? '🏠' : '🌾'}</span>
                              <div className="truncate">
                                <div className="text-xs font-bold text-slate-900 truncate">
                                  {shape.name}
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono">
                                  {shape.areaHa ? `${shape.areaHa.toFixed(2)} ha` : '0 ha'}
                                </div>
                              </div>
                            </div>
                            {isActive && (
                              <Check className={`w-3.5 h-3.5 shrink-0 ${isNet ? 'text-emerald-700' : 'text-amber-700'}`} />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Active Facility Controls: Type Switcher + Delete */}
                    {shapesList[activeShapeIndex] && (
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
                            {language === 'km' ? 'ប្រភេទ:' : 'Type:'}
                          </span>
                          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                            <button
                              type="button"
                              onClick={() => handleToggleActiveShapeFacilityType('net_house')}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                shapesList[activeShapeIndex].facilityType === 'net_house'
                                  ? 'bg-emerald-700 text-white shadow-2xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              <Warehouse className="w-3 h-3" />
                              <span>{language === 'km' ? 'ផ្ទះសំណាញ់' : 'Net House'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleActiveShapeFacilityType('open_field')}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                shapesList[activeShapeIndex].facilityType === 'open_field'
                                  ? 'bg-amber-700 text-white shadow-2xs'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              <Trees className="w-3 h-3" />
                              <span>{language === 'km' ? 'ចំការវាល' : 'Open Field'}</span>
                            </button>
                          </div>
                        </div>

                        {shapesList.length > 1 && (
                          <button
                            type="button"
                            onClick={handleDeleteActiveShape}
                            className="p-1 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors shrink-0 cursor-pointer"
                            title={language === 'km' ? 'លុបរាងសំណង់នេះ' : 'Delete active facility shape'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* COMBINED PART 2: Shape Presets Library (Below Facilities) */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                          {language === 'km' ? 'បណ្ណាល័យរាងគំរូ' : 'Shape Presets Library'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {language === 'km'
                            ? `ដាក់លើ ${shapesList[activeShapeIndex]?.name || 'សំណង់'}`
                            : `Apply to ${shapesList[activeShapeIndex]?.name || 'facility'}`}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={handleResetDefaultPresets}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                          title={language === 'km' ? 'កំណត់រាងគំរូដើមឡើងវិញ' : 'Restore Default Presets'}
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={handleOpenAddPreset}
                          className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{language === 'km' ? 'បន្ថែមរាងគំរូ' : 'Add Preset'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Facility Type Filter Pills */}
                    <div className="flex items-center gap-1 text-xs">
                      <button
                        type="button"
                        onClick={() => setPresetFacilityFilter('all')}
                        className={`px-2 py-0.5 rounded-lg font-bold text-[10px] transition-colors cursor-pointer ${
                          presetFacilityFilter === 'all'
                            ? 'bg-slate-800 text-white shadow-2xs'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {language === 'km' ? 'ទាំងអស់' : 'All'} ({presets.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setPresetFacilityFilter('net_house')}
                        className={`px-2 py-0.5 rounded-lg font-bold text-[10px] transition-colors flex items-center gap-0.5 cursor-pointer ${
                          presetFacilityFilter === 'net_house'
                            ? 'bg-emerald-700 text-white shadow-2xs'
                            : 'bg-white border border-slate-200 text-emerald-800 hover:bg-emerald-50'
                        }`}
                      >
                        <span>🏠</span>
                        <span>{language === 'km' ? 'ផ្ទះសំណាញ់' : 'Net House'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPresetFacilityFilter('open_field')}
                        className={`px-2 py-0.5 rounded-lg font-bold text-[10px] transition-colors flex items-center gap-0.5 cursor-pointer ${
                          presetFacilityFilter === 'open_field'
                            ? 'bg-amber-700 text-white shadow-2xs'
                            : 'bg-white border border-slate-200 text-amber-800 hover:bg-amber-50'
                        }`}
                      >
                        <span>🌾</span>
                        <span>{language === 'km' ? 'ចំការវាល' : 'Open Field'}</span>
                      </button>
                    </div>

                    {/* Presets List with Edit & Delete on ALL Presets */}
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {presets
                        .filter((preset) => {
                          if (presetFacilityFilter === 'all') return true;
                          const isNet = preset.category !== 'open_field' && preset.category !== 'field';
                          return presetFacilityFilter === 'net_house' ? isNet : !isNet;
                        })
                        .map((preset) => {
                          const isActive = activePresetId === preset.id;
                          const isNet = preset.category !== 'open_field' && preset.category !== 'field';
                          return (
                            <div
                              key={preset.id}
                              className={`p-2.5 rounded-xl border transition-all ${
                                isActive
                                  ? 'border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-400'
                                  : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-slate-50/80'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-xs font-bold text-slate-900 truncate">
                                      {language === 'km' ? preset.nameKm : preset.nameEn}
                                    </span>
                                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold border ${
                                      isNet
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                        : 'bg-amber-50 text-amber-800 border-amber-200'
                                    }`}>
                                      {isNet ? '🏠 Net House' : '🌾 Open Field'}
                                    </span>
                                    {preset.isCustom && (
                                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 font-bold">
                                        Custom
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                                    {language === 'km' ? preset.descriptionKm : preset.descriptionEn}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-slate-400">
                                    <span>{preset.offsets.length} vertices</span>
                                  </div>
                                </div>

                                {/* Preset Item Actions: Edit & Delete Available on ALL Presets */}
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => setEditingPreset(preset)}
                                    className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                                    title={language === 'km' ? 'កែប្រែរាងគំរូ' : 'Edit Preset'}
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeletePreset(preset.id, preset.nameEn)}
                                    className="p-1 rounded-md text-red-400 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                                    title={language === 'km' ? 'លុបរាងគំរូ' : 'Delete Preset'}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleApplyPreset(preset)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                      isActive
                                        ? 'bg-emerald-600 text-white shadow-2xs'
                                        : 'bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700'
                                    }`}
                                  >
                                    {isActive && <Check className="w-3 h-3" />}
                                    <span>{isActive ? (language === 'km' ? 'បានជ្រើស' : 'Applied') : (language === 'km' ? 'ជ្រើសរើស' : 'Apply')}</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>

                  </div>
                </div>
              )}

              {/* TAB 2: DRAW POINTS VIEW */}
              {activeTab === 'draw' && (
                <div className="space-y-3">
                  <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200 text-xs text-slate-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-emerald-950">
                        <PenTool className="w-4 h-4 text-emerald-700" />
                        <span>{language === 'km' ? 'គូសចំណុចព្រំប្រទល់ផ្ទាល់លើផែនទី' : 'Realtime Boundary Drawing'}</span>
                      </div>
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        {coords.length} {language === 'km' ? 'ចំណុច' : 'points'}
                      </span>
                    </div>

                    <p className="text-[11px] leading-relaxed text-slate-600 font-khmer">
                      {language === 'km'
                        ? '១. ចុចលើផែនទីដើម្បីកំណត់ចំណុចជ្រុង។ ខ្សែនិងប្រវែង (ម) នឹងបង្ហាញក្នុងពេលជាក់ស្តែង (Realtime)។\n២. បង្កើតយ៉ាងតិច ៣ ចំណុច រួចចុចលើចំណុចបៃតងដំបូង ឬប៊ូតុងខាងក្រោមដើម្បីបញ្ចប់។\n៣. បន្ទាប់ពីគូសរួច អ្នកអាចកែប្រែប្រវែងជ្រុងនីមួយៗ (Adjust Sides) ឬចុចសង្កត់លើរាងដើម្បីរំកិលបានភ្លាមៗ។'
                        : '1. Click anywhere on the map to place corner vertices. Live guidelines and meter distance will appear in real-time.\n2. Add at least 3 points, then click the glowing green 1st vertex or button below to close polygon.\n3. After drawing, switch to Adjust Sides to tune each side manually or drag the shape across the map.'}
                    </p>

                    <div className="flex items-center gap-2 pt-1">
                      {coords.length >= 3 && (
                        <button
                          type="button"
                          onClick={() => setActiveTab('adjust')}
                          className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          <span>{language === 'km' ? 'បញ្ចប់ & កែប្រែប្រវែងជ្រុង' : 'Finish & Adjust Sides'}</span>
                        </button>
                      )}
                      {coords.length >= 3 && (
                        <button
                          type="button"
                          onClick={handleOpenAddPreset}
                          className="py-2 px-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1"
                          title="Save as Preset"
                        >
                          <Save className="w-3.5 h-3.5 text-emerald-700" />
                          <span>{language === 'km' ? 'រក្សាទុក' : 'Save'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {coords.length >= 2 && (
                    <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        {language === 'km' ? 'ប្រវែងជ្រុងបច្ចុប្បន្ន' : 'Current Side Measurements'}
                      </span>
                      <div className="space-y-1">
                        {Array.from({ length: coords.length === 2 ? 1 : coords.length }).map((_, i) => {
                          const p1 = coords[i];
                          const p2 = coords[(i + 1) % coords.length];
                          const distM = calculateHaversineDistanceM(p1, p2);
                          return (
                            <div key={i} className="flex items-center justify-between text-xs py-1 px-2 bg-slate-50 rounded-lg font-mono">
                              <span className="font-semibold text-slate-700">{language === 'km' ? `ជ្រុងទី ${i + 1}` : `Side ${i + 1}`}</span>
                              <span className="font-bold text-emerald-800">📏 {formatMeterDistance(distM)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: ADJUST SIDES MANUALLY (FEATURE: Adjust Manually Each Side After Draw) */}
              {activeTab === 'adjust' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        {language === 'km' ? 'កែសម្រួលប្រវែងជ្រុងនីមួយៗ' : 'Adjust Sides Manually'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {coords.length >= 2 
                          ? `${coords.length >= 3 ? coords.length : 1} ${language === 'km' ? 'ជ្រុងសរុប' : 'sides on shape'}` 
                          : (language === 'km' ? 'ត្រូវការយ៉ាងហោច ២ ចំណុច' : 'Requires at least 2 points')}
                      </span>
                    </div>
                  </div>

                  {coords.length < 2 ? (
                    <div className="p-4 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-500">
                      {language === 'km'
                        ? 'សូមគូសចំណុចលើផែនទី ឬជ្រើសរើសរាងគំរូជាមុនសិន ដើម្បីកែប្រែប្រវែងជ្រុង។'
                        : 'Please draw points or apply a shape preset first to adjust side lengths.'}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Interactive Drag Guidance Banner */}
                      <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-900 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold">
                          <Move className="w-3.5 h-3.5 text-emerald-700" />
                          <span>{language === 'km' ? 'រំកិលរាងផ្ទាល់លើផែនទី (Realtime Drag)' : 'Live Map Movement & Dragging'}</span>
                        </div>
                        <p className="text-[10px] text-emerald-800 leading-tight">
                          {language === 'km'
                            ? '• ចុចសង្កត់កណ្ដុរឆ្វេងលើរាង ហើយរំកិលដើម្បីផ្លាស់ទីរាងភ្លាមៗ\n• អូសចំណុចជ្រុងនីមួយៗលើផែនទីដើម្បីកែប្រែជ្រុងតាមចិត្ត'
                            : '• Hold left-click on the shape and drag to move it across the map in real-time.\n• Drag any corner anchor dot on the map to resize boundaries visually.'}
                        </p>
                      </div>

                      {/* 4-Corner Exact Rectangle Dimension Tool (for greenhouse quads) */}
                      {coords.length === 4 && (
                        <div className="p-3 bg-white rounded-xl border border-emerald-300 shadow-2xs space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                              <Maximize2 className="w-3.5 h-3.5 text-emerald-700" />
                              <span>{language === 'km' ? 'ទំហំផ្ទះសំណាញ់ស្តង់ដារ' : 'Exact Rectangle Dimensions'}</span>
                            </span>
                            <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                              4 Corners
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <label className="text-[10px] font-bold text-slate-600 block mb-1">
                                {language === 'km' ? 'ទទឹង (Width m)' : 'Width (m)'}
                              </label>
                              <input
                                type="number"
                                min={1}
                                step={1}
                                value={exactWidthInput}
                                onChange={(e) => setExactWidthInput(Number(e.target.value) || 0)}
                                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-800"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-600 block mb-1">
                                {language === 'km' ? 'បណ្តោយ (Length m)' : 'Length (m)'}
                              </label>
                              <input
                                type="number"
                                min={1}
                                step={1}
                                value={exactLengthInput}
                                onChange={(e) => setExactLengthInput(Number(e.target.value) || 0)}
                                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-800"
                              />
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleSetExactRectangle(exactWidthInput, exactLengthInput)}
                            className="w-full py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-2xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>
                              {language === 'km' 
                                ? `កំណត់ទំហំ ${exactWidthInput}ម × ${exactLengthInput}ម` 
                                : `Apply ${exactWidthInput}m × ${exactLengthInput}m`}
                            </span>
                          </button>
                        </div>
                      )}

                      {/* Individual Side Adjustments */}
                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                        {Array.from({ length: coords.length === 2 ? 1 : coords.length }).map((_, i) => {
                          const p1 = coords[i];
                          const p2 = coords[(i + 1) % coords.length];
                          const distM = calculateHaversineDistanceM(p1, p2);
                          const formatted = formatMeterDistance(distM);
                          const currentSideVal = sideInputs[i] !== undefined ? sideInputs[i] : Math.round(distM);

                          return (
                            <div
                              key={i}
                              className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-1.5 shadow-2xs"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-800">
                                  {language === 'km' ? `ជ្រុងទី ${i + 1}` : `Side ${i + 1}`}
                                </span>
                                <span className="text-xs font-mono font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                  📏 {formatted}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  min={1}
                                  step={0.5}
                                  value={currentSideVal}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    setSideInputs((prev) => ({ ...prev, [i]: isNaN(val) ? 0 : val }));
                                  }}
                                  className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800"
                                />
                                <span className="text-[10px] text-slate-400 font-mono">m</span>

                                <div className="flex items-center gap-1 ml-auto">
                                  <button
                                    type="button"
                                    onClick={() => handleAdjustSide(i, Math.max(1, Math.round(distM) - 5))}
                                    className="px-1.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-mono font-bold cursor-pointer"
                                    title="-5 meters"
                                  >
                                    -5m
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleAdjustSide(i, Math.max(1, Math.round(distM) - 1))}
                                    className="px-1.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-mono font-bold cursor-pointer"
                                    title="-1 meter"
                                  >
                                    -1m
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleAdjustSide(i, Math.round(distM) + 1)}
                                    className="px-1.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-mono font-bold cursor-pointer"
                                    title="+1 meter"
                                  >
                                    +1m
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleAdjustSide(i, Math.round(distM) + 5)}
                                    className="px-1.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-mono font-bold cursor-pointer"
                                    title="+5 meters"
                                  >
                                    +5m
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleAdjustSide(i, currentSideVal)}
                                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold cursor-pointer"
                                  >
                                    {language === 'km' ? 'អនុវត្ត' : 'Set'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                    </div>
                  )}

                </div>
              )}

              {/* TAB 4: COORDINATES GPS LIST */}
              {activeTab === 'coords' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      GPS Vertices ({coords.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const jsonStr = JSON.stringify(coords, null, 2);
                        navigator.clipboard.writeText(jsonStr);
                        alert('Coordinates copied to clipboard!');
                      }}
                      disabled={coords.length === 0}
                      className="text-[11px] font-bold text-emerald-700 hover:underline disabled:opacity-40"
                    >
                      Copy JSON
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {coords.map((c, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 text-xs font-mono"
                      >
                        <span className="font-bold text-slate-700">#{i + 1}</span>
                        <span className="text-slate-600">
                          {c.lat.toFixed(6)}, {c.lng.toFixed(6)}
                        </span>
                      </div>
                    ))}
                    {coords.length === 0 && (
                      <p className="text-xs text-slate-400 text-center py-6">
                        No points plotted yet. Apply a preset or switch to Draw Points mode.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Shape Color Picker */}
              <div className="space-y-2 pt-2 border-t border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  {language === 'km' ? 'ពណ៌សម្គាល់រងដាំ' : 'Plot Fill Color'}
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {COLOR_PALETTE.map((col) => (
                    <button
                      key={col.hex}
                      type="button"
                      onClick={() => setSelectedColor(col.hex)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                        selectedColor === col.hex ? 'ring-2 ring-slate-900 scale-110 shadow-sm' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: col.hex }}
                      title={col.name}
                    >
                      {selectedColor === col.hex && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Quick Summary Card */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1.5 shadow-2xs">
              <span className="font-bold text-slate-800 block">
                {language === 'km' ? 'ព័ត៌មានរងដាំបច្ចុប្បន្ន' : 'Plot Summary'}
              </span>
              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <div>
                  <span className="text-slate-400 text-[10px] block">Calculated Area:</span>
                  <span className="font-mono font-bold text-emerald-800 text-sm">
                    {calculatedAreaM2.toLocaleString()} m² <span className="text-xs font-normal text-slate-500 font-sans">({calculatedAreaHa} ha)</span>
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Perimeter:</span>
                  <span className="font-mono font-bold text-slate-800 text-sm">
                    {calculatedPerimeterM} m
                  </span>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Frozen Modal Footer */}
        <div className="shrink-0 px-6 py-3.5 border-t border-slate-200/80 bg-slate-50/95 backdrop-blur-xs flex items-center justify-between gap-3 z-10 shadow-2xs">
          <div className="hidden sm:flex items-center gap-3 text-xs font-mono text-slate-500">
            <span className="flex items-center gap-1.5 text-slate-700 font-sans font-bold">
              <span>🏠 {shapesList.filter(s => s.facilityType === 'net_house').length} {language === 'km' ? 'ផ្ទះសំណាញ់' : 'Net'}</span>
              <span>·</span>
              <span>🌾 {shapesList.filter(s => s.facilityType === 'open_field').length} {language === 'km' ? 'ចំការវាល' : 'Open'}</span>
            </span>
            <span>|</span>
            <span>Active: <strong className="text-slate-800">{coords.length} pts</strong></span>
            <span>·</span>
            <span>Rotation: <strong className="text-slate-800">{rotationAngle}°</strong></span>
            <span>·</span>
            <span>Total Area: <strong className="text-emerald-800">{shapesList.reduce((sum, s, idx) => sum + (idx === activeShapeIndex && calculatedAreaM2 > 0 ? calculatedAreaM2 : (s.areaM2 || (s.areaHa ? Math.round(s.areaHa * 10000) : 0))), 0).toLocaleString()} m²</strong></span>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {language === 'km' ? 'បោះបង់' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleSaveShape}
              className="px-5 py-2 rounded-xl bg-[#164e22] hover:bg-[#123e1b] text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>{language === 'km' ? 'បានរក្សាទុក!' : 'Saved!'}</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{language === 'km' ? 'រក្សាទុករូបរាងសំណង់ & ព្រំប្រទល់' : 'Save Facility Shapes & Boundaries'}</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* SUB-MODAL: Add New Preset */}
      {isAddPresetModalOpen && (
        <div className="fixed inset-0 z-[100002] bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-5 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-700" />
                <span>{language === 'km' ? 'បន្ថែមរាងគំរូថ្មី' : 'Add New Shape Preset'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddPresetModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewPreset} className="space-y-3 text-xs">
              {/* Preset Geometry Source Selection */}
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="font-bold text-slate-700 block text-[11px]">
                  {language === 'km' ? 'ប្រភពរាងគំរូ (Geometry Source)' : 'Preset Geometry Source'}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <label className={`p-2 rounded-lg border text-center cursor-pointer transition-all ${
                    newPresetSource === 'dimensions'
                      ? 'border-emerald-500 bg-emerald-50/70 font-bold text-emerald-900'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}>
                    <input
                      type="radio"
                      name="presetSource"
                      className="sr-only"
                      checked={newPresetSource === 'dimensions'}
                      onChange={() => setNewPresetSource('dimensions')}
                    />
                    <span>{language === 'km' ? '📏 បញ្ចូលទំហំ (ម)' : '📏 Set Dimensions (m)'}</span>
                  </label>

                  <label className={`p-2 rounded-lg border text-center transition-all ${
                    coords.length >= 3
                      ? newPresetSource === 'current'
                        ? 'border-emerald-500 bg-emerald-50/70 font-bold text-emerald-900 cursor-pointer'
                        : 'border-slate-200 bg-white text-slate-600 cursor-pointer'
                      : 'opacity-40 border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}>
                    <input
                      type="radio"
                      name="presetSource"
                      className="sr-only"
                      disabled={coords.length < 3}
                      checked={newPresetSource === 'current'}
                      onChange={() => setNewPresetSource('current')}
                    />
                    <span>{language === 'km' ? '🗺️ យករាងលើផែនទី' : '🗺️ From Map Shape'}</span>
                  </label>
                </div>

                {newPresetSource === 'dimensions' ? (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                        {language === 'km' ? 'ទទឹង (Width m)' : 'Width (m)'}
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={newPresetWidth}
                        onChange={(e) => setNewPresetWidth(Number(e.target.value) || 1)}
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                        {language === 'km' ? 'បណ្តោយ (Length m)' : 'Length (m)'}
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={newPresetLength}
                        onChange={(e) => setNewPresetLength(Number(e.target.value) || 1)}
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded font-mono font-bold"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-1.5 bg-emerald-100/60 rounded text-[10px] text-emerald-900 font-mono">
                    {coords.length} vertices · {calculatedAreaHa} ha · {calculatedPerimeterM} m
                  </div>
                )}
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Preset Name (English) *
                </label>
                <input
                  type="text"
                  required
                  value={newPresetNameEn}
                  onChange={(e) => setNewPresetNameEn(e.target.value)}
                  placeholder="e.g. Standard Quad Tunnel (40m × 90m)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Preset Name (Khmer)
                </label>
                <input
                  type="text"
                  value={newPresetNameKm}
                  onChange={(e) => setNewPresetNameKm(e.target.value)}
                  placeholder="ឧ. ផ្ទះសំណាញ់ស្តង់ដារ ៤០ម × ៩០ម"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {language === 'km' ? 'ប្រភេទសំណង់ (Facility Type) *' : 'Facility Type *'}
                  </label>
                  <select
                    value={newPresetCategory === 'open_field' ? 'open_field' : 'net_house'}
                    onChange={(e) => setNewPresetCategory(e.target.value as 'net_house' | 'open_field')}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="net_house">🏠 {language === 'km' ? 'ផ្ទះសំណាញ់ (Net House)' : 'Net House'}</option>
                    <option value="open_field">🌾 {language === 'km' ? 'ចំការវាល (Open Field)' : 'Open Field'}</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {language === 'km' ? 'ការពិពណ៌នា' : 'Description'}
                  </label>
                  <input
                    type="text"
                    value={newPresetDescEn}
                    onChange={(e) => setNewPresetDescEn(e.target.value)}
                    placeholder="e.g. High-tunnel unit"
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddPresetModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Save Preset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-MODAL: Edit Preset */}
      {editingPreset && (
        <div className="fixed inset-0 z-[100002] bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-5 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-emerald-700" />
                <span>{language === 'km' ? 'កែប្រែរាងគំរូ' : 'Edit Shape Preset'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingPreset(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdatePreset} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Preset Name (English) *
                </label>
                <input
                  type="text"
                  required
                  value={editingPreset.nameEn}
                  onChange={(e) => setEditingPreset({ ...editingPreset, nameEn: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Preset Name (Khmer)
                </label>
                <input
                  type="text"
                  value={editingPreset.nameKm}
                  onChange={(e) => setEditingPreset({ ...editingPreset, nameKm: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {language === 'km' ? 'ប្រភេទសំណង់ (Facility Type) *' : 'Facility Type *'}
                  </label>
                  <select
                    value={editingPreset.category === 'open_field' || editingPreset.category === 'field' ? 'open_field' : 'net_house'}
                    onChange={(e) => setEditingPreset({ ...editingPreset, category: (e.target.value === 'open_field' ? 'open_field' : 'net_house') as any })}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="net_house">🏠 {language === 'km' ? 'ផ្ទះសំណាញ់ (Net House)' : 'Net House'}</option>
                    <option value="open_field">🌾 {language === 'km' ? 'ចំការវាល (Open Field)' : 'Open Field'}</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {language === 'km' ? 'ការពិពណ៌នា' : 'Description'}
                  </label>
                  <input
                    type="text"
                    value={editingPreset.descriptionEn || ''}
                    onChange={(e) => setEditingPreset({ ...editingPreset, descriptionEn: e.target.value })}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Option to overwrite geometry with current canvas */}
              {coords.length >= 3 && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const center = calculatePolygonCenter(coords);
                      const offsets = coordsToMeterOffsets(coords, center);
                      setEditingPreset({
                        ...editingPreset,
                        offsets,
                      });
                      alert(language === 'km' ? 'បានធ្វើបច្ចុប្បន្នភាពរាងតាមផ្ទាំងផែនទី!' : 'Preset geometry updated to current canvas polygon!');
                    }}
                    className="w-full py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold border border-slate-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{language === 'km' ? 'ធ្វើបច្ចុប្បន្នភាពរាងតាមផែនទីបច្ចុប្បន្ន' : 'Update Geometry to Current Canvas Shape'}</span>
                  </button>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingPreset(null)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Update Preset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalElement, document.body)
    : modalElement;
};
