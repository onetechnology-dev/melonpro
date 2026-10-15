export type Language = 'en' | 'km';

export type StandardGrowthStageKey = 
  | 'seedling'
  | 'transplanting'
  | 'vine_growth'
  | 'flowering'
  | 'pollination'
  | 'fruit_development'
  | 'harvest';

export type GrowthStageKey = StandardGrowthStageKey | (string & {});

export type TaskType = 
  | 'watering'
  | 'fertilizing'
  | 'flowering_pollination'
  | 'pest_check'
  | 'harvest_prep'
  | 'harvest'
  | 'pruning'
  | 'vine_maintenance';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

export interface GrowthStage {
  id: string;
  key: GrowthStageKey;
  nameEn: string;
  nameKm: string;
  startDate: string;
  endDate: string;
  targetDays: number;
  status: 'completed' | 'current' | 'upcoming';
  progress: number; // 0 to 100
  notesEn?: string;
  notesKm?: string;
  isCustom?: boolean;
  category?: 'botanical' | 'agronomic' | 'custom' | string;
  color?: string; // e.g. 'emerald' | 'teal' | 'sky' | 'indigo' | 'amber' | 'purple' | 'rose' | 'orange' | 'cyan'
  ecTarget?: string;
  phTarget?: string;
  irrigationGuidelineEn?: string;
  irrigationGuidelineKm?: string;
  keyPracticesEn?: string[];
  keyPracticesKm?: string[];
}

export interface FarmTask {
  id: string;
  titleEn: string;
  titleKm: string;
  type: TaskType;
  date: string; // YYYY-MM-DD
  time?: string;
  plotId: string;
  batchId: string;
  stageKey: GrowthStageKey;
  status: TaskStatus;
  assignedWorker: string;
  priority: 'low' | 'medium' | 'high';
  dosageOrVolume?: string; // e.g. "500 L", "2.5 kg NPK 15-15-15", "100 ml Bio-Neem"
  notesEn?: string;
  notesKm?: string;
  isRecurring?: boolean;
  recurringFrequency?: 'daily' | 'weekly' | 'biweekly';
  completedAt?: string;
}

export interface AgronomicTaskPreset {
  id: string;
  stageKey: GrowthStageKey;
  titleEn: string;
  titleKm: string;
  type: TaskType;
  time: string; // e.g. "08:00"
  priority: 'low' | 'medium' | 'high';
  dayOffset: number; // 0 = start of stage, 1 = +1 day from stage start, etc.
  dosageOrVolume?: string;
  notesEn?: string;
  notesKm?: string;
  enabled: boolean;
  order: number;
}

export interface GeoCoordinate {
  lat: number;
  lng: number;
}

export type FacilityType = 'net_house' | 'open_field';

export interface FacilityShape {
  id: string;
  name: string; // e.g. "Net House 1", "Open Field Zone A"
  facilityType: FacilityType; // 'net_house' | 'open_field'
  coords: GeoCoordinate[];
  areaHa?: number;
  areaM2?: number; // Area in square meters (m²)
  plantCount?: number; // Plant population for this facility
  color?: string;
  soilMoisture?: number; // % (e.g. 68%)
  ambientTemp?: number; // °C (e.g. 29.5°C)
  soilEc?: number; // mS/cm (e.g. 1.8)
  soilPh?: number; // (e.g. 6.2)
  irrigationStatus?: 'on' | 'off' | 'scheduled';
}

export interface Farm {
  id: string;
  name: string;
  nameKm?: string;
  code: string;
  location: string;
  leadAgronomist?: string;
  contactPhone?: string;
  totalAreaHa: number;
  description?: string;
  descriptionKm?: string;
  center?: GeoCoordinate;
  createdAt?: string;
}

export interface Plot {
  id: string;
  farmId?: string; // Associated farm ID
  name: string; // e.g. "Plot A", "Plot B"
  code: string;
  areaHa: number;
  areaM2?: number; // Area in square meters (m²)
  facilityType: FacilityType; // Primary/dominant facility type on map
  facilityTypes?: FacilityType[]; // All facility types present on map (Net house, Open field)
  shapes?: FacilityShape[]; // Multiple map shapes/facilities (Net house, Open field)
  melonVarietyEn?: string;
  melonVarietyKm?: string;
  melonType?: 'honeydew' | 'crown_melon' | 'cantaloupe' | 'hami';
  plantCount: number;
  sowingDate?: string;
  transplantingDate?: string;
  expectedHarvestDate?: string;
  currentStage: GrowthStageKey;
  healthScore: number; // 0 - 100
  healthStatus: 'optimal' | 'warning' | 'critical';
  soilMoisture: number; // %
  soilEc: number; // mS/cm
  soilPh: number;
  ambientTemp: number; // °C
  humidity: number; // %
  irrigationStatus: 'on' | 'off' | 'scheduled';
  nextIrrigationTime: string;
  qrCodeId: string;
  center?: GeoCoordinate;
  polygonCoords?: GeoCoordinate[];
  color?: string;
}

export type CropCycleStatus = 'active' | 'completed' | 'planned';

export interface CropCycle {
  id: string;
  name: string;
  batchNumber: string;
  plotId: string;
  facilityId?: string; // Specific Net House or Open Field ID
  facilityName?: string; // Facility name e.g. "Net House 1"
  facilityType?: FacilityType; // 'net_house' | 'open_field'
  areaM2?: number; // Area in square meters (m²)
  plantCount?: number; // Plant population
  variety: string;
  sowingDate: string;
  transplantDate: string;
  harvestWindowStart: string;
  harvestWindowEnd: string;
  stages: GrowthStage[];
  status: CropCycleStatus;
  targetYieldTons?: number;
  targetYieldKg?: number;
  assignedAgronomist?: string;
  currentStageKey?: GrowthStageKey;
}

export interface MonitoringRecord {
  id: string;
  plotId: string;
  facilityId?: string; // Specific Net House or Open Field ID
  recordedAt: string; // ISO string
  recordedBy: string;
  source: 'manual' | 'sensor';
  soilMoisture: number;
  temperature: number;
  humidity: number;
  irrigationVolumeLiters?: number;
  plantHealthRating: number; // 1 to 5
  pestObservationEn?: string;
  pestObservationKm?: string;
  pestSeverity: 'none' | 'low' | 'medium' | 'high';
  photoUrl?: string;
  photoCaption?: string;
  attachments?: string[];
  notesEn?: string;
  notesKm?: string;
  notes?: string;
}

export interface HarvestRecord {
  id: string;
  plotId: string;
  batchId: string;
  harvestDate: string;
  totalWeightKg: number;
  fruitCount: number;
  averageWeightKg: number;
  brixSugarDegree: number; // °Bx (e.g. 14.5 - 16.0)
  gradeA_Percent: number; // %
  gradeB_Percent: number; // %
  gradeC_Percent: number; // %
  actualYieldTonsPerHa: number;
  targetYieldTonsPerHa: number;
  recordedBy: string;
  notes?: string;
}

export interface AIRecommendation {
  id: string;
  category: 'irrigation' | 'disease' | 'harvest' | 'fertilizer';
  titleEn: string;
  titleKm: string;
  valueEn: string;
  valueKm: string;
  detailEn: string;
  detailKm: string;
  riskLevel: 'low' | 'medium' | 'high' | 'info';
  supportedByRecords: string[];
  suggestedAction?: {
    actionEn: string;
    actionKm: string;
    targetTaskId?: string;
    newDate?: string;
  };
}

export interface FarmNotification {
  id: string;
  type: 'alert' | 'reminder' | 'weather' | 'harvest';
  titleEn: string;
  titleKm: string;
  messageEn: string;
  messageKm: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
}

// ==========================================
// ERP & Commercial Management Types
// ==========================================

export type StockCategory = 
  | 'seeds' 
  | 'fertilizer' 
  | 'pesticide' 
  | 'packaging' 
  | 'harvest_produce' 
  | 'tools_irrigation'
  | 'growing_media';

export interface StockItem {
  id: string;
  sku: string;
  barcode?: string;
  nameEn: string;
  nameKm: string;
  category: StockCategory;
  unit: string; // e.g. 'kg', 'bag (25kg)', 'pack (1000 seeds)', 'box', 'L', 'roll', 'pcs'
  quantity: number;
  minThreshold: number;
  maxThreshold?: number;
  unitCost: number; // USD
  sellingPrice?: number; // USD (for harvest produce or resale items)
  location: string; // e.g. 'Warehouse A', 'Cold Storage #1', 'Chemical Vault'
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued';
  supplierId?: string;
  supplierName?: string;
  dosageOrUsage?: string; // e.g. "Application: 2g / 1000L water"
  brand?: string;
  notes?: string;
  isSaleItem?: boolean;
  lastUpdated: string;
}

export interface PurchaseOrderItem {
  stockItemId: string;
  name: string;
  category: StockCategory;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

export interface PurchaseStockOrder {
  id: string;
  poNumber: string; // e.g. PO-2025-0104
  supplierId: string;
  supplierName: string;
  date: string;
  expectedDate?: string;
  items: PurchaseOrderItem[];
  totalAmount: number;
  paidAmount: number;
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  orderStatus: 'ordered' | 'received' | 'cancelled';
  paymentMethod: 'cash' | 'bank_transfer' | 'credit';
  notes?: string;
}

export interface SaleOrderItem {
  stockItemId?: string;
  productName: string;
  grade?: 'Grade A' | 'Grade B' | 'Grade C' | 'Premium Gift Box';
  unit: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface SaleOrder {
  id: string;
  invoiceNumber: string; // e.g. INV-2025-0210
  customerId: string;
  customerName: string;
  date: string;
  items: SaleOrderItem[];
  totalAmount: number;
  paidAmount: number;
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  deliveryStatus: 'delivered' | 'in_transit' | 'pending';
  paymentMethod: 'cash' | 'bank_transfer' | 'credit';
  plotOriginId?: string;
  notes?: string;
}

export interface Farmer {
  id: string;
  code: string; // e.g. FMR-001
  nameEn: string;
  nameKm: string;
  role: string;
  phone: string;
  email?: string;
  assignedPlotIds: string[];
  status: 'active' | 'on_leave' | 'inactive';
  monthlySalary: number;
  experienceYears: number;
  joinDate: string;
  specialty: string;
}

export interface Customer {
  id: string;
  code: string; // e.g. CUST-001
  name: string;
  companyName?: string;
  type: 'supermarket' | 'wholesale' | 'retailer' | 'exporter' | 'direct';
  phone: string;
  email: string;
  address: string;
  city: string;
  totalPurchased: number;
  balanceDue: number;
  paymentTerms: string;
  status: 'active' | 'inactive';
}

export interface Supplier {
  id: string;
  code: string; // e.g. SUP-001
  name: string;
  category: 'seeds' | 'fertilizer' | 'irrigation' | 'packaging' | 'general';
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  country: string;
  totalPurchases: number;
  currentPayable: number;
  rating: number; // 1 to 5
}

export interface FinancialAccount {
  id: string;
  name: string;
  type: 'bank' | 'cash' | 'receivable' | 'payable';
  accountNumber?: string;
  institution?: string; // e.g. 'ABA Bank', 'Cash Vault'
  balance: number;
  currency: 'USD' | 'KHR';
}

export interface AccountTransaction {
  id: string;
  transactionNumber: string;
  date: string;
  type: 'income' | 'expense' | 'transfer';
  category: 
    | 'produce_sale' 
    | 'seed_purchase' 
    | 'fertilizer_purchase' 
    | 'labor_salary' 
    | 'utilities_electricity' 
    | 'packaging_supplies' 
    | 'equipment_maintenance' 
    | 'other';
  amount: number;
  accountId: string;
  accountName: string;
  referenceId?: string; // Links to Sale ID or Purchase Stock ID
  descriptionEn: string;
  descriptionKm: string;
  recordedBy: string;
}
