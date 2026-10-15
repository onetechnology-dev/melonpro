import { GeoCoordinate } from '../types/melon';

// Earth radius in meters (WGS84)
const EARTH_RADIUS_M = 6378137;

/**
 * Calculates geodesic area of a polygon in square meters (m²)
 * using the spherical excess algorithm.
 */
export function calculatePolygonAreaM2(coords: GeoCoordinate[]): number {
  if (!coords || coords.length < 3) return 0;

  let total = 0;
  const numCoords = coords.length;

  for (let i = 0; i < numCoords; i++) {
    const j = (i + 1) % numCoords;
    const p1 = coords[i];
    const p2 = coords[j];

    const p1Lat = (p1.lat * Math.PI) / 180;
    const p2Lat = (p2.lat * Math.PI) / 180;
    const p1Lng = (p1.lng * Math.PI) / 180;
    const p2Lng = (p2.lng * Math.PI) / 180;

    total += (p2Lng - p1Lng) * (2 + Math.sin(p1Lat) + Math.sin(p2Lat));
  }

  total = Math.abs((total * EARTH_RADIUS_M * EARTH_RADIUS_M) / 2.0);
  return Math.round(total);
}

/**
 * Converts square meters to hectares (ha)
 */
export function calculatePolygonAreaHa(coords: GeoCoordinate[]): number {
  const m2 = calculatePolygonAreaM2(coords);
  return Number((m2 / 10000).toFixed(2));
}

/**
 * Calculates the perimeter of a polygon in meters (m)
 */
export function calculatePolygonPerimeterM(coords: GeoCoordinate[]): number {
  if (!coords || coords.length < 2) return 0;

  let perimeter = 0;
  for (let i = 0; i < coords.length; i++) {
    const next = coords[(i + 1) % coords.length];
    perimeter += calculateHaversineDistanceM(coords[i], next);
  }
  return Math.round(perimeter);
}

/**
 * Haversine formula to compute distance between two lat/lng points in meters
 */
export function calculateHaversineDistanceM(p1: GeoCoordinate, p2: GeoCoordinate): number {
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1.lat * Math.PI) / 180) *
      Math.cos((p2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_M * c;
}

/**
 * Computes polygon geometric centroid / center
 */
export function calculatePolygonCenter(coords: GeoCoordinate[]): GeoCoordinate {
  if (!coords || coords.length === 0) {
    return { lat: 11.4886, lng: 104.8324 };
  }

  let latSum = 0;
  let lngSum = 0;
  coords.forEach((c) => {
    latSum += c.lat;
    lngSum += c.lng;
  });

  return {
    lat: Number((latSum / coords.length).toFixed(6)),
    lng: Number((lngSum / coords.length).toFixed(6)),
  };
}

/**
 * Generates preset shapes around a center coordinate
 */
export function generatePresetShape(
  center: GeoCoordinate,
  shapeType: 'quad_greenhouse' | 'wide_field' | 'l_shape' | 'hexagon',
  scaleMeters = 50
): GeoCoordinate[] {
  // 1 degree lat is ~111,320m
  // 1 degree lng is ~111,320m * cos(lat)
  const latM = 1 / 111320;
  const lngM = 1 / (111320 * Math.cos((center.lat * Math.PI) / 180));

  const s = scaleMeters;

  switch (shapeType) {
    case 'quad_greenhouse': {
      // 30m x 80m greenhouse
      const halfW = 20 * lngM;
      const halfH = 45 * latM;
      return [
        { lat: center.lat + halfH, lng: center.lng - halfW },
        { lat: center.lat + halfH, lng: center.lng + halfW },
        { lat: center.lat - halfH, lng: center.lng + halfW },
        { lat: center.lat - halfH, lng: center.lng - halfW },
      ];
    }
    case 'wide_field': {
      // 80m x 100m open field
      const halfW = 45 * lngM;
      const halfH = 50 * latM;
      return [
        { lat: center.lat + halfH, lng: center.lng - halfW },
        { lat: center.lat + halfH, lng: center.lng + halfW },
        { lat: center.lat - halfH, lng: center.lng + halfW },
        { lat: center.lat - halfH, lng: center.lng - halfW },
      ];
    }
    case 'l_shape': {
      // L-shaped greenhouse
      return [
        { lat: center.lat + 40 * latM, lng: center.lng - 30 * lngM },
        { lat: center.lat + 40 * latM, lng: center.lng + 10 * lngM },
        { lat: center.lat - 10 * latM, lng: center.lng + 10 * lngM },
        { lat: center.lat - 10 * latM, lng: center.lng + 40 * lngM },
        { lat: center.lat - 40 * latM, lng: center.lng + 40 * lngM },
        { lat: center.lat - 40 * latM, lng: center.lng - 30 * lngM },
      ];
    }
    case 'hexagon': {
      // 6-sided nursery polygon
      const points: GeoCoordinate[] = [];
      for (let i = 0; i < 6; i++) {
        const angle = (i * 60 * Math.PI) / 180;
        points.push({
          lat: center.lat + Math.sin(angle) * s * latM,
          lng: center.lng + Math.cos(angle) * s * lngM,
        });
      }
      return points;
    }
    default:
      return [];
  }
}

export type ShapePresetCategory = 'net_house' | 'open_field' | 'greenhouse' | 'field' | 'facility' | 'custom';

export interface ShapePreset {
  id: string;
  nameEn: string;
  nameKm: string;
  descriptionEn?: string;
  descriptionKm?: string;
  category?: ShapePresetCategory;
  isCustom?: boolean;
  offsets: { dx: number; dy: number }[]; // offsets in meters from center (dx: East, dy: North)
}

/**
 * Rotates a polygon clockwise around its center by a given degree angle.
 */
export function rotatePolygon(
  coords: GeoCoordinate[],
  degreesClockwise: number,
  center?: GeoCoordinate
): GeoCoordinate[] {
  if (!coords || coords.length === 0) return [];
  if (degreesClockwise % 360 === 0) return [...coords];

  const c = center || calculatePolygonCenter(coords);
  const cosLat = Math.cos((c.lat * Math.PI) / 180);
  const rad = (degreesClockwise * Math.PI) / 180;
  const cosTheta = Math.cos(rad);
  const sinTheta = Math.sin(rad);

  return coords.map((p) => {
    // Local meters equivalent
    const x = (p.lng - c.lng) * cosLat;
    const y = p.lat - c.lat;

    // Clockwise rotation:
    // x' = x * cosTheta + y * sinTheta
    // y' = -x * sinTheta + y * cosTheta
    const xRot = x * cosTheta + y * sinTheta;
    const yRot = -x * sinTheta + y * cosTheta;

    return {
      lat: Number((c.lat + yRot).toFixed(6)),
      lng: Number((c.lng + (cosLat !== 0 ? xRot / cosLat : xRot)).toFixed(6)),
    };
  });
}

/**
 * Translates a polygon by metric offsets (East/North in meters)
 */
export function translatePolygonMeters(
  coords: GeoCoordinate[],
  deltaEastM: number,
  deltaNorthM: number
): GeoCoordinate[] {
  if (!coords || coords.length === 0) return [];
  const c = calculatePolygonCenter(coords);
  const cosLat = Math.cos((c.lat * Math.PI) / 180);
  const deltaLat = deltaNorthM / 111320;
  const deltaLng = cosLat !== 0 ? deltaEastM / (111320 * cosLat) : deltaEastM / 111320;

  return coords.map((p) => ({
    lat: Number((p.lat + deltaLat).toFixed(6)),
    lng: Number((p.lng + deltaLng).toFixed(6)),
  }));
}

/**
 * Converts polygon coordinates to meter offsets relative to its centroid
 */
export function coordsToMeterOffsets(
  coords: GeoCoordinate[],
  center?: GeoCoordinate
): { dx: number; dy: number }[] {
  if (!coords || coords.length === 0) return [];
  const c = center || calculatePolygonCenter(coords);
  const cosLat = Math.cos((c.lat * Math.PI) / 180);

  return coords.map((p) => {
    const dy = (p.lat - c.lat) * 111320;
    const dx = (p.lng - c.lng) * 111320 * cosLat;
    return {
      dx: Number(dx.toFixed(2)),
      dy: Number(dy.toFixed(2)),
    };
  });
}

/**
 * Generates polygon coordinates from center and relative meter offsets
 */
export function generateShapeFromOffsets(
  center: GeoCoordinate,
  offsets: { dx: number; dy: number }[]
): GeoCoordinate[] {
  if (!offsets || offsets.length === 0) return [];
  const cosLat = Math.cos((center.lat * Math.PI) / 180);

  return offsets.map((off) => {
    const lat = center.lat + off.dy / 111320;
    const lng = center.lng + (cosLat !== 0 ? off.dx / (111320 * cosLat) : off.dx / 111320);
    return {
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6)),
    };
  });
}

export const DEFAULT_SHAPE_PRESETS: ShapePreset[] = [
  {
    id: 'preset-greenhouse-quad',
    nameEn: 'Net House Quad',
    nameKm: 'ផ្ទះសំណាញ់ខ្នាតស្តង់ដារ',
    descriptionEn: 'Standard 40m × 90m high-tunnel melon net house',
    descriptionKm: 'ផ្ទះសំណាញ់ទំហំ ៤០ម × ៩០ម សម្រាប់ដាំឪឡឹក/ត្រសក់ផ្អែម',
    category: 'net_house',
    offsets: [
      { dx: -20, dy: 45 },
      { dx: 20, dy: 45 },
      { dx: 20, dy: -45 },
      { dx: -20, dy: -45 },
    ],
  },
  {
    id: 'preset-wide-field',
    nameEn: 'Open Field Block',
    nameKm: 'ចំការបើកចំហរាងបួនជ្រុង',
    descriptionEn: 'Spacious 90m × 100m agricultural field parcel (~0.9 ha)',
    descriptionKm: 'ដីចំការបើកចំហទំហំ ៩០ម × ១០០ម (~០.៩ ហិកតា)',
    category: 'open_field',
    offsets: [
      { dx: -45, dy: 50 },
      { dx: 45, dy: 50 },
      { dx: 45, dy: -50 },
      { dx: -45, dy: -50 },
    ],
  },
  {
    id: 'preset-l-shape',
    nameEn: 'L-Shaped Net House',
    nameKm: 'ផ្ទះសំណាញ់រាងអក្សរ L',
    descriptionEn: 'Modern L-configuration nursery & packing net house',
    descriptionKm: 'រោងបណ្តុះកូន និងវេចខ្ចប់រាងអក្សរ L',
    category: 'net_house',
    offsets: [
      { dx: -30, dy: 40 },
      { dx: 10, dy: 40 },
      { dx: 10, dy: -10 },
      { dx: 40, dy: -10 },
      { dx: 40, dy: -40 },
      { dx: -30, dy: -40 },
    ],
  },
  {
    id: 'preset-hexagon',
    nameEn: 'Hexagon Nursery Net House',
    nameKm: 'ផ្ទះសំណាញ់រាងប្រាំមួយជ្រុង',
    descriptionEn: 'Geometric 6-vertex circular net house ring (50m radius)',
    descriptionKm: 'រោងរង្វង់ប្រាំមួយជ្រុង (កាំ ៥០ម)',
    category: 'net_house',
    offsets: [0, 1, 2, 3, 4, 5].map((i) => {
      const angle = (i * 60 * Math.PI) / 180;
      return {
        dx: Number((Math.cos(angle) * 50).toFixed(2)),
        dy: Number((Math.sin(angle) * 50).toFixed(2)),
      };
    }),
  },
  {
    id: 'preset-twin-greenhouse',
    nameEn: 'Twin Net House Block',
    nameKm: 'ផ្ទះសំណាញ់ភ្លោះ',
    descriptionEn: '60m × 80m dual-bay net house unit (~0.48 ha)',
    descriptionKm: 'ផ្ទះសំណាញ់ភ្លោះទំហំ ៦០ម × ៨០ម (~០.៤៨ ហិកតា)',
    category: 'net_house',
    offsets: [
      { dx: -30, dy: 40 },
      { dx: 30, dy: 40 },
      { dx: 30, dy: -40 },
      { dx: -30, dy: -40 },
    ],
  },
  {
    id: 'preset-compact-quad',
    nameEn: 'Compact Melon Tunnel',
    nameKm: 'ផ្ទះសំណាញ់ខ្នាតតូច (15m × 40m)',
    descriptionEn: 'Compact 15m × 40m single-span tunnel (~600 m²)',
    descriptionKm: 'ផ្ទះសំណាញ់ខ្នាតតូចទំហំ ១៥ម × ៤០ម (~៦០០ ម៉ែត្រការ៉េ)',
    category: 'net_house',
    offsets: [
      { dx: -7.5, dy: 20 },
      { dx: 7.5, dy: 20 },
      { dx: 7.5, dy: -20 },
      { dx: -7.5, dy: -20 },
    ],
  },
];

/**
 * Format meter distance (e.g. 40m or 40.5m)
 */
export function formatMeterDistance(distM: number): string {
  if (isNaN(distM) || distM < 0) return '0m';
  if (Math.abs(distM - Math.round(distM)) < 0.1) {
    return `${Math.round(distM)}m`;
  }
  return `${distM.toFixed(1)}m`;
}

/**
 * Creates rectangle offsets for Width and Length in meters (centered at 0,0)
 */
export function createRectangleOffsets(widthM: number, lengthM: number): { dx: number; dy: number }[] {
  const w = Math.max(1, widthM);
  const l = Math.max(1, lengthM);
  return [
    { dx: -w / 2, dy: l / 2 },
    { dx: w / 2, dy: l / 2 },
    { dx: w / 2, dy: -l / 2 },
    { dx: -w / 2, dy: -l / 2 },
  ];
}

/**
 * Adjusts a single polygon side length to target meters by moving the destination vertex along the side vector
 */
export function adjustPolygonSideLength(
  coords: GeoCoordinate[],
  sideIndex: number,
  targetLengthM: number
): GeoCoordinate[] {
  if (!coords || coords.length < 2 || targetLengthM <= 0) return coords;
  const n = coords.length;
  const idxA = sideIndex % n;
  const idxB = (sideIndex + 1) % n;

  const pA = coords[idxA];
  const pB = coords[idxB];
  const currentDist = calculateHaversineDistanceM(pA, pB);
  if (currentDist <= 0.001) return coords;

  const ratio = targetLengthM / currentDist;
  const cosLat = Math.cos((pA.lat * Math.PI) / 180);
  const dx = (pB.lng - pA.lng) * 111320 * cosLat;
  const dy = (pB.lat - pA.lat) * 111320;

  const newDx = dx * ratio;
  const newDy = dy * ratio;

  const newLat = pA.lat + newDy / 111320;
  const newLng = pA.lng + (cosLat !== 0 ? newDx / (111320 * cosLat) : newDx / 111320);

  const updated = [...coords];
  updated[idxB] = {
    lat: Number(newLat.toFixed(6)),
    lng: Number(newLng.toFixed(6)),
  };
  return updated;
}

/**
 * Generates an exact rectangle of specified width and length (meters) around a center, optionally rotated
 */
export function setPolygonRectangleDimensions(
  center: GeoCoordinate,
  widthM: number,
  lengthM: number,
  rotationAngle = 0
): GeoCoordinate[] {
  const offsets = createRectangleOffsets(widthM, lengthM);
  const rect = generateShapeFromOffsets(center, offsets);
  if (rotationAngle !== 0) {
    return rotatePolygon(rect, rotationAngle, center);
  }
  return rect;
}

