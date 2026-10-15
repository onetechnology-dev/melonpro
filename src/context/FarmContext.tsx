import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  Farm,
  Plot, 
  CropCycle, 
  CropCycleStatus, 
  FarmTask, 
  MonitoringRecord, 
  HarvestRecord, 
  AIRecommendation, 
  FarmNotification, 
  TaskStatus,
  StockItem,
  PurchaseStockOrder,
  SaleOrder,
  Farmer,
  Customer,
  Supplier,
  FinancialAccount,
  AccountTransaction,
  FacilityShape,
  FacilityType
} from '../types/melon';
import { 
  INITIAL_FARMS,
  INITIAL_PLOTS, 
  INITIAL_CROP_CYCLES, 
  INITIAL_TASKS, 
  INITIAL_MONITORING_RECORDS, 
  INITIAL_HARVEST_RECORDS, 
  INITIAL_AI_RECOMMENDATIONS, 
  INITIAL_NOTIFICATIONS 
} from '../data/initialData';
import {
  INITIAL_STOCK_ITEMS,
  INITIAL_SUPPLIERS,
  INITIAL_CUSTOMERS,
  INITIAL_FARMERS,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_SALES_ORDERS,
  INITIAL_FINANCIAL_ACCOUNTS,
  INITIAL_ACCOUNT_TRANSACTIONS
} from '../data/erpInitialData';
import { CROP_VARIETIES_PRESETS, CropVarietyPreset, VarietyCategory, INITIAL_VARIETY_CATEGORIES } from '../data/cropVarieties';
import { GrowthStagePreset, CustomStagePreset, DEFAULT_GROWTH_STAGES, INITIAL_CUSTOM_STAGE_PRESETS } from '../data/customStagePresets';
import { AgronomicTaskPreset, DEFAULT_AGRONOMIC_TASK_PRESETS, buildTasksFromPresets } from '../data/agronomicTaskPresets';
import { api } from '../services/apiService';

export type NavigationTab = 
  | 'dashboard'
  | 'farm_management'
  | 'crop_management'
  | 'planting'
  | 'calendar'
  | 'field'
  | 'tasks'
  | 'monitoring'
  | 'harvest'
  | 'item_management'
  | 'stock'
  | 'purchase_stock'
  | 'sale'
  | 'farmer'
  | 'customer'
  | 'supplier'
  | 'account'
  | 'records'
  | 'project_invoice'
  | 'analytics'
  | 'settings'
  | 'user_management';

interface FarmContextType {
  // Navigation & Filtering
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  selectedPlotId: string;
  setSelectedPlotId: (plotId: string) => void;
  selectedCycleId: string;
  setSelectedCycleId: (cycleId: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Database Connection Status
  dbConnected: boolean;
  isSyncing: boolean;
  refreshFromDatabase: () => Promise<void>;

  // Data
  farms: Farm[];
  selectedFarmId: string;
  setSelectedFarmId: (farmId: string) => void;
  plots: Plot[];
  currentPlot: Plot | undefined;
  cropCycles: CropCycle[];
  currentCycle: CropCycle | undefined;
  cropVarieties: CropVarietyPreset[];
  varietyCategories: VarietyCategory[];
  growthStages: GrowthStagePreset[];
  customStages: CustomStagePreset[];
  tasks: FarmTask[];
  filteredTasks: FarmTask[];
  taskPresets: AgronomicTaskPreset[];
  monitoringRecords: MonitoringRecord[];
  harvestRecords: HarvestRecord[];
  recommendations: AIRecommendation[];
  notifications: FarmNotification[];
  currentSimulatedDate: string;

  // ERP & Commercial Data
  stockItems: StockItem[];
  purchaseOrders: PurchaseStockOrder[];
  salesOrders: SaleOrder[];
  farmers: Farmer[];
  customers: Customer[];
  suppliers: Supplier[];
  financialAccounts: FinancialAccount[];
  accountTransactions: AccountTransaction[];

  // Actions
  addFarm: (farm: Omit<Farm, 'id'>) => void;
  updateFarm: (farm: Farm) => void;
  deleteFarm: (farmId: string) => void;

  addPlot: (plot: Omit<Plot, 'id'> & { id?: string }) => void;
  updatePlot: (plot: Plot) => void;
  deletePlot: (plotId: string) => void;
  toggleIrrigation: (plotId: string) => void;

  addTask: (task: Omit<FarmTask, 'id'>) => void;
  updateTask: (task: FarmTask) => void;
  deleteTask: (taskId: string) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  rescheduleTask: (taskId: string, newDate: string) => void;
  
  addCropCycle: (cycle: Omit<CropCycle, 'id'>, newPlot?: Omit<Plot, 'id'>) => void;
  updateCropCycle: (cycle: CropCycle) => void;
  deleteCropCycle: (cycleId: string, deleteAssociatedPlot?: boolean) => void;
  deleteAllCropCycles: () => void;
  deleteAllCrops: () => void;
  emptyPlotCrop: (plotId: string) => void;
  setCropBatchStatus: (cycleId: string, status: CropCycleStatus) => void;
  addCrop: (cycle: Omit<CropCycle, 'id'>, newPlot?: Omit<Plot, 'id'>) => void;
  updateCrop: (cycle: CropCycle) => void;
  deleteCrop: (cycleId: string, deleteAssociatedPlot?: boolean) => void;

  addCropVariety: (variety: Omit<CropVarietyPreset, 'id'>) => void;
  updateCropVariety: (variety: CropVarietyPreset) => void;
  deleteCropVariety: (varietyId: string) => void;
  addVarietyCategory: (cat: Omit<VarietyCategory, 'id'>) => void;
  updateVarietyCategory: (cat: VarietyCategory) => void;
  deleteVarietyCategory: (catId: string) => void;

  addGrowthStage: (stage: Omit<GrowthStagePreset, 'id'>) => void;
  updateGrowthStage: (stage: GrowthStagePreset) => void;
  deleteGrowthStage: (id: string) => void;
  resetGrowthStages: () => void;

  addCustomStagePreset: (stage: Omit<CustomStagePreset, 'id'>) => void;
  updateCustomStagePreset: (stage: CustomStagePreset) => void;
  deleteCustomStagePreset: (id: string) => void;
  resetCustomStagePresets: () => void;

  addTaskPreset: (preset: Omit<AgronomicTaskPreset, 'id'>) => void;
  updateTaskPreset: (preset: AgronomicTaskPreset) => void;
  deleteTaskPreset: (id: string) => void;
  resetTaskPresets: () => void;
  generateTasksForActiveCycles: () => { generatedCount: number; cyclesCount: number };

  addMonitoringRecord: (record: Omit<MonitoringRecord, 'id'>) => void;
  updateMonitoringRecord: (record: MonitoringRecord) => void;
  deleteMonitoringRecord: (id: string) => void;
  addHarvestRecord: (record: Omit<HarvestRecord, 'id'>) => void;

  // ERP Actions
  addStockItem: (item: Omit<StockItem, 'id' | 'lastUpdated'>) => void;
  updateStockItem: (item: StockItem) => void;
  adjustStockQuantity: (id: string, delta: number, reason?: string) => void;
  deleteStockItem: (id: string) => void;

  addPurchaseOrder: (order: Omit<PurchaseStockOrder, 'id' | 'poNumber'>) => void;
  updatePurchaseOrderStatus: (
    id: string, 
    orderStatus: 'ordered' | 'received' | 'cancelled', 
    paymentStatus?: 'paid' | 'partial' | 'unpaid'
  ) => void;

  addSaleOrder: (sale: Omit<SaleOrder, 'id' | 'invoiceNumber'>) => void;
  updateSaleStatus: (
    id: string, 
    paymentStatus?: 'paid' | 'partial' | 'unpaid', 
    deliveryStatus?: 'delivered' | 'in_transit' | 'pending'
  ) => void;

  addFarmer: (farmer: Omit<Farmer, 'id' | 'code'>) => void;
  updateFarmer: (farmer: Farmer) => void;
  deleteFarmer: (id: string) => void;

  addCustomer: (customer: Omit<Customer, 'id' | 'code'>) => void;
  updateCustomer: (customer: Customer) => void;
  deleteCustomer: (id: string) => void;

  addSupplier: (supplier: Omit<Supplier, 'id' | 'code'>) => void;
  updateSupplier: (supplier: Supplier) => void;
  deleteSupplier: (id: string) => void;

  addAccountTransaction: (tx: Omit<AccountTransaction, 'id' | 'transactionNumber'>) => void;
  transferFunds: (fromAccountId: string, toAccountId: string, amount: number, note?: string) => void;

  markNotificationAsRead: (notifId: string) => void;
  markAllNotificationsRead: () => void;
  applyRecommendation: (recId: string) => void;

  resetToDefaults: () => void;
}

const getTodayDateString = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const FarmContext = createContext<FarmContextType | undefined>(undefined);

export const FarmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [selectedPlotId, setSelectedPlotId] = useState<string>('plot-a');
  const [selectedCycleId, setSelectedCycleId] = useState<string>('cycle-2025-m2');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const currentSimulatedDate = getTodayDateString();

  const [dbConnected, setDbConnected] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(true);

  // States with fallback to local initial values
  const [farms, setFarms] = useState<Farm[]>(() => {
    const saved = localStorage.getItem('melonpro_farms');
    if (saved) {
      try {
        const parsed: Farm[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Keep only active farm (farm-1)
          const activeOnly = parsed.filter((f) => f.id === 'farm-1');
          if (activeOnly.length > 0) {
            localStorage.setItem('melonpro_farms', JSON.stringify(activeOnly));
            return activeOnly;
          }
        }
      } catch {}
    }
    localStorage.setItem('melonpro_farms', JSON.stringify(INITIAL_FARMS));
    return INITIAL_FARMS;
  });
  const [selectedFarmId, setSelectedFarmId] = useState<string>('farm-1');

  const [plots, setPlots] = useState<Plot[]>(() => {
    const saved = localStorage.getItem('melonpro_plots');
    let parsed: Plot[] = saved ? JSON.parse(saved) : INITIAL_PLOTS;
    // Remove all plots belonging to other farms
    parsed = parsed.filter((p) => !p.farmId || p.farmId === 'farm-1');
    const mapped = parsed.map((p) => {
      const facilityType = (p.facilityType as any) === 'greenhouse' ? 'net_house' : (p.facilityType || 'net_house');
      const facilityTypes = p.facilityTypes && p.facilityTypes.length > 0 
        ? p.facilityTypes.map((t: any) => t === 'greenhouse' ? 'net_house' : t)
        : [facilityType];
      return {
        ...p,
        farmId: 'farm-1',
        facilityType,
        facilityTypes,
      };
    });
    localStorage.setItem('melonpro_plots', JSON.stringify(mapped));
    return mapped;
  });

  const [cropCycles, setCropCycles] = useState<CropCycle[]>(() => {
    const saved = localStorage.getItem('melonpro_cycles');
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const valid = parsed.filter((c: CropCycle) => c.plotId !== 'plot-a' && c.plotId !== 'plot-b' && c.id !== 'cycle-2025-m2');
          return valid;
        }
      } catch {}
    }
    return INITIAL_CROP_CYCLES;
  });

  const [cropVarieties, setCropVarieties] = useState<CropVarietyPreset[]>(() => {
    const saved = localStorage.getItem('melonpro_crop_varieties');
    return saved ? JSON.parse(saved) : CROP_VARIETIES_PRESETS;
  });

  const [varietyCategories, setVarietyCategories] = useState<VarietyCategory[]>(() => {
    const saved = localStorage.getItem('melonpro_variety_categories');
    return saved ? JSON.parse(saved) : INITIAL_VARIETY_CATEGORIES;
  });

  const [growthStages, setGrowthStages] = useState<GrowthStagePreset[]>(() => {
    const saved = localStorage.getItem('melonpro_growth_stages');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 7) return parsed;
      } catch {}
    }
    const legacy = localStorage.getItem('melonpro_custom_stages');
    if (legacy) {
      try {
        const parsed = JSON.parse(legacy);
        if (Array.isArray(parsed) && parsed.length >= 7) return parsed;
      } catch {}
    }
    return DEFAULT_GROWTH_STAGES;
  });

  const [tasks, setTasks] = useState<FarmTask[]>(() => {
    const saved = localStorage.getItem('melonpro_tasks');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const valid = parsed.filter((t: FarmTask) => t.plotId !== 'plot-a' && t.plotId !== 'plot-b' && !t.date?.startsWith('2025'));
          if (valid.length > 0) return valid;
        }
      } catch {}
    }
    return INITIAL_TASKS;
  });

  const [taskPresets, setTaskPresets] = useState<AgronomicTaskPreset[]>(() => {
    const saved = localStorage.getItem('melonpro_task_presets');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return DEFAULT_AGRONOMIC_TASK_PRESETS;
  });

  const [monitoringRecords, setMonitoringRecords] = useState<MonitoringRecord[]>(() => {
    const saved = localStorage.getItem('melonpro_monitoring');
    if (saved) {
      try {
        const parsed: MonitoringRecord[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((m) => {
            const init = INITIAL_MONITORING_RECORDS.find((i) => i.id === m.id);
            if (init) {
              return {
                ...m,
                facilityId: m.facilityId || init.facilityId,
                photoUrl: m.photoUrl || init.photoUrl,
                attachments: (m.attachments && m.attachments.length > 0) ? m.attachments : init.attachments,
                notesEn: m.notesEn || init.notesEn,
                notesKm: m.notesKm || init.notesKm,
              };
            }
            return m;
          });
        }
      } catch {}
    }
    return INITIAL_MONITORING_RECORDS;
  });

  const [harvestRecords, setHarvestRecords] = useState<HarvestRecord[]>(() => {
    const saved = localStorage.getItem('melonpro_harvests');
    return saved ? JSON.parse(saved) : INITIAL_HARVEST_RECORDS;
  });

  const [recommendations, setRecommendations] = useState<AIRecommendation[]>(() => {
    const saved = localStorage.getItem('melonpro_recommendations');
    return saved ? JSON.parse(saved) : INITIAL_AI_RECOMMENDATIONS;
  });

  const [notifications, setNotifications] = useState<FarmNotification[]>(() => {
    const saved = localStorage.getItem('melonpro_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [stockItems, setStockItems] = useState<StockItem[]>(() => {
    const saved = localStorage.getItem('melonpro_stock');
    return saved ? JSON.parse(saved) : INITIAL_STOCK_ITEMS;
  });

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseStockOrder[]>(() => {
    const saved = localStorage.getItem('melonpro_purchases');
    return saved ? JSON.parse(saved) : INITIAL_PURCHASE_ORDERS;
  });

  const [salesOrders, setSalesOrders] = useState<SaleOrder[]>(() => {
    const saved = localStorage.getItem('melonpro_sales');
    return saved ? JSON.parse(saved) : INITIAL_SALES_ORDERS;
  });

  const [farmers, setFarmers] = useState<Farmer[]>(() => {
    const saved = localStorage.getItem('melonpro_farmers');
    return saved ? JSON.parse(saved) : INITIAL_FARMERS;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('melonpro_customers');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem('melonpro_suppliers');
    return saved ? JSON.parse(saved) : INITIAL_SUPPLIERS;
  });

  const [financialAccounts, setFinancialAccounts] = useState<FinancialAccount[]>(() => {
    const saved = localStorage.getItem('melonpro_accounts');
    return saved ? JSON.parse(saved) : INITIAL_FINANCIAL_ACCOUNTS;
  });

  const [accountTransactions, setAccountTransactions] = useState<AccountTransaction[]>(() => {
    const saved = localStorage.getItem('melonpro_transactions');
    return saved ? JSON.parse(saved) : INITIAL_ACCOUNT_TRANSACTIONS;
  });

  // Sync from MariaDB Database on initial mount
  const refreshFromDatabase = useCallback(async () => {
    setIsSyncing(true);
    try {
      const data = await api.fetchAll();
      if (data) {
        if ((data as any).farms?.length) {
          const activeOnly = (data as any).farms.filter((f: any) => f.id === 'farm-1');
          setFarms(activeOnly.length > 0 ? activeOnly : INITIAL_FARMS);
        }
        if (data.plots?.length) {
          const activePlots = data.plots.filter((p: any) => !p.farmId || p.farmId === 'farm-1').map((p: any) => ({
            ...p,
            farmId: p.farmId || 'farm-1',
          }));
          setPlots(activePlots);
        }
        if (Array.isArray(data.cropCycles)) {
          setCropCycles(data.cropCycles);
          localStorage.setItem('melonpro_cycles', JSON.stringify(data.cropCycles));
        }
        if (data.cropVarieties?.length) setCropVarieties(data.cropVarieties);
        if (data.tasks?.length) setTasks(data.tasks);
        if (data.monitoringRecords?.length) setMonitoringRecords(data.monitoringRecords);
        if (data.harvestRecords?.length) setHarvestRecords(data.harvestRecords);
        if (data.recommendations?.length) setRecommendations(data.recommendations);
        if (data.notifications?.length) setNotifications(data.notifications);
        if (data.stockItems?.length) setStockItems(data.stockItems);
        if (data.purchaseOrders?.length) setPurchaseOrders(data.purchaseOrders);
        if (data.salesOrders?.length) setSalesOrders(data.salesOrders);
        if (data.farmers?.length) setFarmers(data.farmers);
        if (data.customers?.length) setCustomers(data.customers);
        if (data.suppliers?.length) setSuppliers(data.suppliers);
        if (data.financialAccounts?.length) setFinancialAccounts(data.financialAccounts);
        if (data.accountTransactions?.length) setAccountTransactions(data.accountTransactions);
        setDbConnected(true);
      }

      // Sync growth stages from farm_settings
      try {
        const settings = await api.getSettings();
        if (settings && Array.isArray((settings as any).growthStages) && (settings as any).growthStages.length > 0) {
          setGrowthStages((settings as any).growthStages);
        } else if (settings && Array.isArray(settings.customStages) && settings.customStages.length >= 7) {
          setGrowthStages(settings.customStages);
        }
      } catch (settingsErr) {
        console.warn('[FarmContext] Could not fetch settings growthStages:', settingsErr);
      }
    } catch (err) {
      console.warn('[FarmContext] Database sync error, using cached state:', err);
      setDbConnected(false);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    refreshFromDatabase();
  }, [refreshFromDatabase]);

  // Keep LocalStorage in sync as offline cache
  useEffect(() => { localStorage.setItem('melonpro_farms', JSON.stringify(farms)); }, [farms]);
  useEffect(() => { localStorage.setItem('melonpro_plots', JSON.stringify(plots)); }, [plots]);
  useEffect(() => { localStorage.setItem('melonpro_cycles', JSON.stringify(cropCycles)); }, [cropCycles]);
  useEffect(() => { localStorage.setItem('melonpro_crop_varieties', JSON.stringify(cropVarieties)); }, [cropVarieties]);
  useEffect(() => { localStorage.setItem('melonpro_variety_categories', JSON.stringify(varietyCategories)); }, [varietyCategories]);
  useEffect(() => { 
    localStorage.setItem('melonpro_growth_stages', JSON.stringify(growthStages));
    localStorage.setItem('melonpro_custom_stages', JSON.stringify(growthStages)); 
  }, [growthStages]);
  useEffect(() => { localStorage.setItem('melonpro_tasks', JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem('melonpro_monitoring', JSON.stringify(monitoringRecords)); }, [monitoringRecords]);
  useEffect(() => { localStorage.setItem('melonpro_harvests', JSON.stringify(harvestRecords)); }, [harvestRecords]);
  useEffect(() => { localStorage.setItem('melonpro_recommendations', JSON.stringify(recommendations)); }, [recommendations]);
  useEffect(() => { localStorage.setItem('melonpro_notifications', JSON.stringify(notifications)); }, [notifications]);
  useEffect(() => { localStorage.setItem('melonpro_stock', JSON.stringify(stockItems)); }, [stockItems]);
  useEffect(() => { localStorage.setItem('melonpro_purchases', JSON.stringify(purchaseOrders)); }, [purchaseOrders]);
  useEffect(() => { localStorage.setItem('melonpro_sales', JSON.stringify(salesOrders)); }, [salesOrders]);
  useEffect(() => { localStorage.setItem('melonpro_farmers', JSON.stringify(farmers)); }, [farmers]);
  useEffect(() => { localStorage.setItem('melonpro_customers', JSON.stringify(customers)); }, [customers]);
  useEffect(() => { localStorage.setItem('melonpro_suppliers', JSON.stringify(suppliers)); }, [suppliers]);
  useEffect(() => { localStorage.setItem('melonpro_accounts', JSON.stringify(financialAccounts)); }, [financialAccounts]);
  useEffect(() => { localStorage.setItem('melonpro_transactions', JSON.stringify(accountTransactions)); }, [accountTransactions]);

  // Derived current plot and cycle
  const currentPlot = selectedPlotId === 'all' 
    ? undefined 
    : (plots.find((p) => p.id === selectedPlotId) || plots[0]);

  const currentCycle = selectedPlotId === 'all'
    ? (cropCycles.find((c) => c.id === selectedCycleId && c.status === 'active') || 
       cropCycles.find((c) => c.status === 'active') || 
       cropCycles.find((c) => c.id === selectedCycleId && c.status === 'planned') || 
       cropCycles.find((c) => c.status === 'planned'))
    : (cropCycles.find((c) => c.plotId === selectedPlotId && c.status === 'active') || 
       cropCycles.find((c) => c.plotId === selectedPlotId && c.status === 'planned') ||
       cropCycles.find((c) => c.plotId === selectedPlotId && c.status === 'completed'));

  // Filtered tasks based on search & plot
  const filteredTasks = tasks.filter((task) => {
    const matchesPlot = selectedPlotId === 'all' || task.plotId === selectedPlotId;
    if (!matchesPlot) return false;
    if (!searchQuery.trim()) return true;

    const q = searchQuery.toLowerCase();
    return (
      task.titleEn.toLowerCase().includes(q) ||
      task.titleKm.toLowerCase().includes(q) ||
      task.assignedWorker.toLowerCase().includes(q) ||
      task.type.toLowerCase().includes(q) ||
      (task.notesEn && task.notesEn.toLowerCase().includes(q))
    );
  });

  // Task actions with MariaDB persistence
  const addTask = (newTaskData: Omit<FarmTask, 'id'>) => {
    const id = `task-${Date.now()}`;
    const task: FarmTask = { ...newTaskData, id };
    setTasks((prev) => [task, ...prev]);
    api.saveTask(task).catch((err) => console.error('Error saving task to DB:', err));
  };

  const updateTask = (updatedTask: FarmTask) => {
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
    api.saveTask(updatedTask).catch((err) => console.error('Error updating task in DB:', err));
  };

  const deleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    api.deleteTask(taskId).catch((err) => console.error('Error deleting task from DB:', err));
  };

  const updateTaskStatus = (taskId: string, status: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const updated = {
          ...t,
          status,
          completedAt: status === 'completed' ? new Date().toISOString() : undefined,
        };
        api.saveTask(updated).catch((err) => console.error('Error updating task status in DB:', err));
        return updated;
      })
    );
  };

  const rescheduleTask = (taskId: string, newDate: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const updated = { ...t, date: newDate };
        api.saveTask(updated).catch((err) => console.error('Error rescheduling task in DB:', err));
        return updated;
      })
    );
  };

  // Plot & Cycle actions with MariaDB persistence
  const addCropCycle = (cycleData: Omit<CropCycle, 'id'>, newPlotData?: Omit<Plot, 'id'>) => {
    let targetPlotId = cycleData.plotId;

    if (newPlotData) {
      const plotId = `plot-${Date.now()}`;
      targetPlotId = plotId;
      const createdPlot: Plot = { ...newPlotData, id: plotId };
      setPlots((prev) => [...prev, createdPlot]);
      api.savePlot(createdPlot).catch((err) => console.error('Error saving plot to DB:', err));
    }

    const cycleId = `cycle-${Date.now()}`;
    const createdCycle: CropCycle = { ...cycleData, id: cycleId, plotId: targetPlotId };
    setCropCycles((prev) => [...prev, createdCycle]);
    setSelectedPlotId(targetPlotId);
    setSelectedCycleId(cycleId);
    api.saveCycle(createdCycle).catch((err) => console.error('Error saving cycle to DB:', err));
  };

  const updateCropCycle = (updatedCycle: CropCycle) => {
    setCropCycles((prev) =>
      prev.map((c) => (c.id === updatedCycle.id ? updatedCycle : c))
    );
    api.saveCycle(updatedCycle).catch((err) => console.error('Error updating cycle in DB:', err));

    // If updated to completed and no other active cycle exists on this plot, clear plot planting data
    if (updatedCycle.status === 'completed' && updatedCycle.plotId) {
      const otherActive = cropCycles.some((c) => c.id !== updatedCycle.id && c.plotId === updatedCycle.plotId && c.status === 'active');
      if (!otherActive) {
        setPlots((prev) =>
          prev.map((p) => {
            if (p.id === updatedCycle.plotId) {
              const updated: Plot = {
                ...p,
                melonVarietyEn: '',
                melonVarietyKm: '',
                sowingDate: '',
                transplantingDate: '',
                expectedHarvestDate: '',
              };
              api.savePlot(updated).catch((err) => console.error('Error saving plot to DB:', err));
              return updated;
            }
            return p;
          })
        );
      }
    } else if (updatedCycle.status === 'active' && updatedCycle.plotId) {
      setPlots((prev) =>
        prev.map((p) => {
          if (p.id === updatedCycle.plotId) {
            const updated: Plot = {
              ...p,
              melonVarietyEn: updatedCycle.variety,
              sowingDate: updatedCycle.sowingDate,
              transplantingDate: updatedCycle.transplantDate,
              expectedHarvestDate: updatedCycle.harvestWindowStart,
            };
            api.savePlot(updated).catch((err) => console.error('Error saving plot to DB:', err));
            return updated;
          }
          return p;
        })
      );
    }
  };

  const emptyPlotCrop = (plotId: string) => {
    // 1. Delete all crop cycles on this plot
    const cyclesToDelete = cropCycles.filter((c) => c.plotId === plotId);
    cyclesToDelete.forEach((c) => {
      api.deleteCycle(c.id).catch((err) => console.error('Error deleting cycle from DB:', err));
    });
    setCropCycles((prev) => {
      const remaining = prev.filter((c) => c.plotId !== plotId);
      localStorage.setItem('melonpro_cycles', JSON.stringify(remaining));
      return remaining;
    });

    // 2. Clear plot's variety and planting dates to empty
    setPlots((prev) => {
      const updatedPlots = prev.map((p) => {
        if (p.id === plotId) {
          const updated: Plot = {
            ...p,
            melonVarietyEn: '',
            melonVarietyKm: '',
            plantCount: 0,
            sowingDate: '',
            transplantingDate: '',
            expectedHarvestDate: '',
          };
          api.savePlot(updated).catch((err) => console.error('Error saving plot to DB:', err));
          return updated;
        }
        return p;
      });
      localStorage.setItem('melonpro_plots', JSON.stringify(updatedPlots));
      return updatedPlots;
    });

    if (selectedPlotId === plotId) {
      setSelectedCycleId('');
    }
  };

  const deleteAllCropCycles = () => {
    // 1. Immediately clear crop cycles in state and localStorage
    setCropCycles([]);
    localStorage.setItem('melonpro_cycles', JSON.stringify([]));

    // 2. Clear all plots to empty (no variety, plantCount 0, no dates) in state and localStorage
    setPlots((prev) => {
      const updatedPlots = prev.map((p) => ({
        ...p,
        melonVarietyEn: '',
        melonVarietyKm: '',
        plantCount: 0,
        sowingDate: '',
        transplantingDate: '',
        expectedHarvestDate: '',
      }));
      localStorage.setItem('melonpro_plots', JSON.stringify(updatedPlots));
      return updatedPlots;
    });

    // 3. Reset selected cycle ID
    setSelectedCycleId('');

    // 4. Atomically delete all crop cycles and reset plot varieties in database
    api.deleteAllCycles().catch((err) => {
      console.error('Error deleting all crop cycles from DB:', err);
    });
  };

  const deleteAllCrops = deleteAllCropCycles;

  const setCropBatchStatus = (cycleId: string, status: CropCycleStatus) => {
    const cycle = cropCycles.find((c) => c.id === cycleId);
    if (!cycle) return;
    updateCropCycle({ ...cycle, status });
  };

  const deleteCropCycle = (cycleId: string, deleteAssociatedPlot = false) => {
    const cycleToDelete = cropCycles.find((c) => c.id === cycleId);
    setCropCycles((prev) => {
      const remaining = prev.filter((c) => c.id !== cycleId);
      localStorage.setItem('melonpro_cycles', JSON.stringify(remaining));
      return remaining;
    });
    api.deleteCycle(cycleId).catch((err) => console.error('Error deleting cycle from DB:', err));

    if (deleteAssociatedPlot && cycleToDelete?.plotId) {
      const otherCyclesUsingPlot = cropCycles.filter(
        (c) => c.id !== cycleId && c.plotId === cycleToDelete.plotId
      );
      if (otherCyclesUsingPlot.length === 0) {
        setPlots((prev) => {
          const remainingPlots = prev.filter((p) => p.id !== cycleToDelete.plotId);
          localStorage.setItem('melonpro_plots', JSON.stringify(remainingPlots));
          return remainingPlots;
        });
        api.deletePlot(cycleToDelete.plotId).catch((err) => console.error('Error deleting plot from DB:', err));
      }
    } else if (cycleToDelete?.plotId) {
      // If plot is kept, ensure its planting data is cleared if no remaining active/planned cycles exist on this plot
      const remainingCyclesOnPlot = cropCycles.filter(
        (c) => c.id !== cycleId && c.plotId === cycleToDelete.plotId && (c.status === 'active' || c.status === 'planned')
      );
      if (remainingCyclesOnPlot.length === 0) {
        setPlots((prev) => {
          const updatedPlots = prev.map((p) => {
            if (p.id === cycleToDelete.plotId) {
              const updated: Plot = {
                ...p,
                melonVarietyEn: '',
                melonVarietyKm: '',
                plantCount: 0,
                sowingDate: '',
                transplantingDate: '',
                expectedHarvestDate: '',
              };
              api.savePlot(updated).catch((err) => console.error('Error updating plot in DB:', err));
              return updated;
            }
            return p;
          });
          localStorage.setItem('melonpro_plots', JSON.stringify(updatedPlots));
          return updatedPlots;
        });
      }
    }

    if (selectedCycleId === cycleId) {
      const remainingCycles = cropCycles.filter((c) => c.id !== cycleId);
      if (remainingCycles.length > 0) {
        setSelectedCycleId(remainingCycles[0].id);
        if (remainingCycles[0].plotId) {
          setSelectedPlotId(remainingCycles[0].plotId);
        }
      } else {
        setSelectedCycleId('');
      }
    }
  };

  const addCrop = addCropCycle;
  const updateCrop = updateCropCycle;
  const deleteCrop = deleteCropCycle;

  const addCropVariety = (varietyData: Omit<CropVarietyPreset, 'id'>) => {
    const newVariety: CropVarietyPreset = {
      ...varietyData,
      id: `variety-${Date.now()}`,
    };
    setCropVarieties((prev) => [newVariety, ...prev]);
    api.saveVariety(newVariety).catch((err) => console.error('Error saving variety to DB:', err));
  };

  const updateCropVariety = (updated: CropVarietyPreset) => {
    setCropVarieties((prev) => {
      const targetId = String(updated.id).trim();
      const exists = prev.some((v) => String(v.id).trim() === targetId);
      if (exists) {
        return prev.map((v) => (String(v.id).trim() === targetId ? updated : v));
      }
      return [updated, ...prev];
    });
    api.saveVariety(updated).catch((err) => console.error('Error updating variety in DB:', err));
  };

  const deleteCropVariety = (varietyId: string) => {
    setCropVarieties((prev) => prev.filter((v) => v.id !== varietyId));
    api.deleteVariety(varietyId).catch((err) => console.error('Error deleting variety from DB:', err));
  };

  const addVarietyCategory = (catData: Omit<VarietyCategory, 'id'>) => {
    const slug = (catData.code || catData.nameEn).toLowerCase().replace(/[^a-z0-9]/g, '_');
    const newCat: VarietyCategory = {
      ...catData,
      id: slug || `cat-${Date.now()}`,
    };
    setVarietyCategories((prev) => [...prev, newCat]);
  };

  const updateVarietyCategory = (updated: VarietyCategory) => {
    setVarietyCategories((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    );
  };

  const deleteVarietyCategory = (catId: string) => {
    setVarietyCategories((prev) => prev.filter((c) => c.id !== catId));
    // Reassign varieties under deleted category to 'specialty'
    setCropVarieties((prev) =>
      prev.map((v) => (v.category === catId ? { ...v, category: 'specialty' } : v))
    );
  };

  const saveGrowthStagesToDb = async (stages: GrowthStagePreset[]) => {
    try {
      await api.updateSettings({ customStages: stages, growthStages: stages } as any);
    } catch (err) {
      console.error('Error saving growth stages to DB:', err);
    }
  };

  const addGrowthStage = (stageData: Omit<GrowthStagePreset, 'id'>) => {
    const newStage: GrowthStagePreset = {
      ...stageData,
      id: `stage-${Date.now()}`,
      key: stageData.key || `stage_${Date.now()}`,
    };
    setGrowthStages((prev) => {
      const updated = [...prev, newStage];
      saveGrowthStagesToDb(updated);
      return updated;
    });
  };

  const updateGrowthStage = (updated: GrowthStagePreset) => {
    setGrowthStages((prev) => {
      const updatedList = prev.map((s) => (s.id === updated.id ? updated : s));
      saveGrowthStagesToDb(updatedList);
      return updatedList;
    });
  };

  const deleteGrowthStage = (id: string) => {
    setGrowthStages((prev) => {
      const updatedList = prev.filter((s) => s.id !== id);
      saveGrowthStagesToDb(updatedList);
      return updatedList;
    });
  };

  const resetGrowthStages = () => {
    setGrowthStages(DEFAULT_GROWTH_STAGES);
    saveGrowthStagesToDb(DEFAULT_GROWTH_STAGES);
  };

  // Backwards compatibility aliases
  const addCustomStagePreset = addGrowthStage;
  const updateCustomStagePreset = updateGrowthStage;
  const deleteCustomStagePreset = deleteGrowthStage;
  const resetCustomStagePresets = resetGrowthStages;

  // --- Agronomic Task Preset Settings Actions ---
  const addTaskPreset = (presetData: Omit<AgronomicTaskPreset, 'id'>) => {
    const newPreset: AgronomicTaskPreset = {
      ...presetData,
      id: `preset-${Date.now()}`,
      order: presetData.order || taskPresets.length + 1,
    };
    setTaskPresets((prev) => {
      const updated = [...prev, newPreset];
      localStorage.setItem('melonpro_task_presets', JSON.stringify(updated));
      return updated;
    });
  };

  const updateTaskPreset = (updated: AgronomicTaskPreset) => {
    setTaskPresets((prev) => {
      const updatedList = prev.map((p) => (p.id === updated.id ? updated : p));
      localStorage.setItem('melonpro_task_presets', JSON.stringify(updatedList));
      return updatedList;
    });
  };

  const deleteTaskPreset = (id: string) => {
    setTaskPresets((prev) => {
      const updatedList = prev.filter((p) => p.id !== id);
      localStorage.setItem('melonpro_task_presets', JSON.stringify(updatedList));
      return updatedList;
    });
  };

  const resetTaskPresets = () => {
    setTaskPresets(DEFAULT_AGRONOMIC_TASK_PRESETS);
    localStorage.setItem('melonpro_task_presets', JSON.stringify(DEFAULT_AGRONOMIC_TASK_PRESETS));
  };

  const generateTasksForActiveCycles = () => {
    const activeCycles = cropCycles.filter((c) => c.status === 'active' || c.status === 'planned');
    let generatedCount = 0;

    activeCycles.forEach((cycle) => {
      const matchedVariety = cropVarieties.find(
        (v) => v.nameEn.toLowerCase() === cycle.variety.toLowerCase()
      );
      const generated = buildTasksFromPresets(
        taskPresets,
        cycle,
        cycle.stages || [],
        {
          assignedWorker: cycle.assignedAgronomist,
          targetBrix: matchedVariety?.targetBrix,
          idealEc: matchedVariety?.idealEc,
          varietyEn: matchedVariety?.nameEn || cycle.variety,
          varietyKm: matchedVariety?.nameKm || cycle.variety,
        }
      );

      generated.forEach((t) => {
        const existing = tasks.some(
          (et) => et.batchId === cycle.id && et.stageKey === t.stageKey && et.type === t.type
        );
        if (!existing) {
          addTask(t);
          generatedCount++;
        }
      });
    });

    return { generatedCount, cyclesCount: activeCycles.length };
  };

  const addFarm = (newFarmData: Omit<Farm, 'id'>) => {
    const id = `farm-${Date.now()}`;
    const newFarm: Farm = {
      ...newFarmData,
      id,
      createdAt: new Date().toISOString(),
    };
    setFarms((prev) => [newFarm, ...prev]);
    setSelectedFarmId(id);
  };

  const updateFarm = (updatedFarm: Farm) => {
    setFarms((prev) => prev.map((f) => (f.id === updatedFarm.id ? updatedFarm : f)));
  };

  const deleteFarm = (farmId: string) => {
    setFarms((prev) => prev.filter((f) => f.id !== farmId));
    if (selectedFarmId === farmId) {
      setSelectedFarmId('farm-1');
    }
  };

  const addPlot = (plotData: Omit<Plot, 'id'> & { id?: string }) => {
    const id = plotData.id || `plot-${Date.now()}`;
    const targetFarmId = plotData.farmId || (selectedFarmId !== 'all' ? selectedFarmId : farms[0]?.id || 'farm-1');
    const facilityType = (plotData.facilityType as any) === 'greenhouse' ? 'net_house' : (plotData.facilityType || 'net_house');
    
    // Automatically synthesize initial facility shape if not provided
    const shapes: FacilityShape[] = plotData.shapes && plotData.shapes.length > 0
      ? plotData.shapes
      : [
          {
            id: `shape-${id}-1`,
            name: facilityType === 'net_house' ? 'Net House 1' : 'Open Field 1',
            facilityType: (facilityType as FacilityType) || 'net_house',
            coords: plotData.polygonCoords || [],
            areaHa: plotData.areaHa || 1.0,
            color: plotData.color || (facilityType === 'net_house' ? '#15803D' : '#D97706'),
          },
        ];

    const facilityTypes: FacilityType[] = Array.from(new Set(shapes.map((s) => s.facilityType)));

    const createdPlot: Plot = {
      ...plotData,
      id,
      farmId: targetFarmId,
      facilityType: facilityTypes[0] || facilityType,
      facilityTypes,
      shapes,
      healthScore: plotData.healthScore ?? 95,
      healthStatus: plotData.healthStatus ?? 'optimal',
      soilMoisture: plotData.soilMoisture ?? 65,
      soilEc: plotData.soilEc ?? 1.8,
      soilPh: plotData.soilPh ?? 6.5,
      ambientTemp: plotData.ambientTemp ?? 32,
      humidity: plotData.humidity ?? 70,
      irrigationStatus: plotData.irrigationStatus ?? 'off',
      nextIrrigationTime: plotData.nextIrrigationTime ?? '18:00',
      qrCodeId: plotData.qrCodeId || `QR-PLOT-${Date.now().toString().slice(-6)}`,
      color: plotData.color || (facilityType === 'net_house' ? '#15803D' : '#D97706'),
    };

    setPlots((prev) => [...prev, createdPlot]);
    setSelectedPlotId(createdPlot.id);
    api.savePlot(createdPlot).catch((err) => console.error('Error saving plot to DB:', err));
  };

  const updatePlot = (updatedPlot: Plot) => {
    let toSave = updatedPlot;
    if (updatedPlot.shapes && updatedPlot.shapes.length > 0) {
      const derivedTypes = Array.from(new Set(updatedPlot.shapes.map((s) => s.facilityType)));
      toSave = {
        ...updatedPlot,
        facilityTypes: derivedTypes,
        facilityType: derivedTypes[0] || updatedPlot.facilityType || 'net_house',
      };
    }
    setPlots((prev) => prev.map((p) => (p.id === toSave.id ? toSave : p)));
    api.savePlot(toSave).catch((err) => console.error('Error updating plot in DB:', err));
  };

  const deletePlot = (plotId: string) => {
    setPlots((prev) => prev.filter((p) => p.id !== plotId));
    setCropCycles((prev) => prev.filter((c) => c.plotId !== plotId));
    api.deletePlot(plotId).catch((err) => console.error('Error deleting plot from DB:', err));
    if (selectedPlotId === plotId) {
      const remaining = plots.filter((p) => p.id !== plotId);
      if (remaining.length > 0) {
        setSelectedPlotId(remaining[0].id);
      }
    }
  };

  const toggleIrrigation = (plotId: string) => {
    setPlots((prev) =>
      prev.map((p) => {
        if (p.id === plotId) {
          const nextStatus: 'on' | 'off' = p.irrigationStatus === 'on' ? 'off' : 'on';
          const updated: Plot = { ...p, irrigationStatus: nextStatus };
          api.savePlot(updated).catch((err) => console.error('Error saving irrigation status:', err));
          return updated;
        }
        return p;
      })
    );
  };

  const addMonitoringRecord = (recordData: Omit<MonitoringRecord, 'id'>) => {
    const id = `mon-${Date.now()}`;
    const newRecord: MonitoringRecord = { ...recordData, id };
    setMonitoringRecords((prev) => [newRecord, ...prev]);
    api.saveMonitoring(newRecord).catch((err) => console.error('Error saving monitoring record to DB:', err));

    setPlots((prev) =>
      prev.map((p) => {
        if (p.id === recordData.plotId) {
          const updated = {
            ...p,
            soilMoisture: recordData.soilMoisture || p.soilMoisture,
            ambientTemp: recordData.temperature || p.ambientTemp,
            humidity: recordData.humidity || p.humidity,
          };
          api.savePlot(updated).catch((err) => console.error('Error saving plot updates to DB:', err));
          return updated;
        }
        return p;
      })
    );
  };

  const updateMonitoringRecord = (record: MonitoringRecord) => {
    setMonitoringRecords((prev) => prev.map((m) => (m.id === record.id ? record : m)));
    api.saveMonitoring(record).catch((err) => console.error('Error updating monitoring record to DB:', err));
  };

  const deleteMonitoringRecord = (id: string) => {
    setMonitoringRecords((prev) => prev.filter((m) => m.id !== id));
    api.deleteMonitoring(id).catch((err) => console.error('Error deleting monitoring record from DB:', err));
  };

  const addHarvestRecord = (recordData: Omit<HarvestRecord, 'id'>) => {
    const id = `hrv-${Date.now()}`;
    const newRecord: HarvestRecord = { ...recordData, id };
    setHarvestRecords((prev) => [newRecord, ...prev]);
    api.saveHarvest(newRecord).catch((err) => console.error('Error saving harvest record to DB:', err));
  };

  const markNotificationAsRead = (notifId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, isRead: true } : n))
    );
    api.markNotificationRead(notifId).catch((err) => console.error('Error updating notification in DB:', err));
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    api.markAllNotificationsRead().catch((err) => console.error('Error updating all notifications in DB:', err));
  };

  const applyRecommendation = (recId: string) => {
    const rec = recommendations.find((r) => r.id === recId);
    if (rec?.suggestedAction?.targetTaskId && rec.suggestedAction.newDate) {
      rescheduleTask(rec.suggestedAction.targetTaskId, rec.suggestedAction.newDate);
    }
    setRecommendations((prev) => prev.filter((r) => r.id !== recId));
  };

  // --- Stock Methods with MariaDB ---
  const addStockItem = (item: Omit<StockItem, 'id' | 'lastUpdated'>) => {
    const newItem: StockItem = {
      ...item,
      id: `stk-${Date.now()}`,
      lastUpdated: getTodayDateString(),
    };
    setStockItems((prev) => [newItem, ...prev]);
    api.saveStockItem(newItem).catch((err) => console.error('Error saving stock item to DB:', err));
  };

  const updateStockItem = (item: StockItem) => {
    const updated = { ...item, lastUpdated: getTodayDateString() };
    setStockItems((prev) => prev.map((s) => s.id === item.id ? updated : s));
    api.saveStockItem(updated).catch((err) => console.error('Error updating stock item in DB:', err));
  };

  const adjustStockQuantity = (id: string, delta: number) => {
    setStockItems((prev) => prev.map((s) => {
      if (s.id !== id) return s;
      const newQty = Math.max(0, s.quantity + delta);
      const newStatus = newQty === 0 ? 'out_of_stock' : (newQty <= s.minThreshold ? 'low_stock' : 'in_stock');
      const updated: StockItem = {
        ...s,
        quantity: newQty,
        status: newStatus,
        lastUpdated: getTodayDateString(),
      };
      api.saveStockItem(updated).catch((err) => console.error('Error adjusting stock item in DB:', err));
      return updated;
    }));
  };

  const deleteStockItem = (id: string) => {
    setStockItems((prev) => prev.filter((s) => s.id !== id));
    api.deleteStockItem(id).catch((err) => console.error('Error deleting stock item from DB:', err));
  };

  // --- Purchase Stock Methods with MariaDB ---
  const addPurchaseOrder = (order: Omit<PurchaseStockOrder, 'id' | 'poNumber'>) => {
    const newId = `po-${Date.now()}`;
    const poNum = `PO-${new Date().getFullYear()}-${String(purchaseOrders.length + 1).padStart(4, '0')}`;
    const newPO: PurchaseStockOrder = {
      ...order,
      id: newId,
      poNumber: poNum,
    };
    setPurchaseOrders((prev) => [newPO, ...prev]);
    api.savePurchaseOrder(newPO).catch((err) => console.error('Error saving purchase order to DB:', err));

    if (order.orderStatus === 'received') {
      order.items.forEach((item) => {
        adjustStockQuantity(item.stockItemId, item.quantity);
      });
    }

    if (order.paidAmount > 0) {
      addAccountTransaction({
        date: order.date,
        type: 'expense',
        category: 'seed_purchase',
        amount: order.paidAmount,
        accountId: 'acc-01',
        accountName: 'ABA Bank - Primary Farm Operating Account',
        referenceId: newId,
        descriptionEn: `Payment for ${poNum} (${order.supplierName})`,
        descriptionKm: `ការទូទាត់សម្រាប់ ${poNum} (${order.supplierName})`,
        recordedBy: 'Procurement',
      });
    }
  };

  const updatePurchaseOrderStatus = (
    id: string, 
    orderStatus: 'ordered' | 'received' | 'cancelled', 
    paymentStatus?: 'paid' | 'partial' | 'unpaid'
  ) => {
    setPurchaseOrders((prev) => prev.map((p) => {
      if (p.id !== id) return p;
      const prevStatus = p.orderStatus;
      if (prevStatus !== 'received' && orderStatus === 'received') {
        p.items.forEach((item) => {
          adjustStockQuantity(item.stockItemId, item.quantity);
        });
      }
      const updated: PurchaseStockOrder = {
        ...p,
        orderStatus,
        paymentStatus: paymentStatus || p.paymentStatus,
      };
      api.savePurchaseOrder(updated).catch((err) => console.error('Error updating purchase order in DB:', err));
      return updated;
    }));
  };

  // --- Sale Order Methods with MariaDB ---
  const addSaleOrder = (sale: Omit<SaleOrder, 'id' | 'invoiceNumber'>) => {
    const newId = `so-${Date.now()}`;
    const invNum = `INV-${new Date().getFullYear()}-${String(salesOrders.length + 1).padStart(4, '0')}`;
    const newSale: SaleOrder = {
      ...sale,
      id: newId,
      invoiceNumber: invNum,
    };
    setSalesOrders((prev) => [newSale, ...prev]);
    api.saveSalesOrder(newSale).catch((err) => console.error('Error saving sales order to DB:', err));

    sale.items.forEach((item) => {
      if (item.stockItemId) {
        adjustStockQuantity(item.stockItemId, -item.quantity);
      }
    });

    if (sale.paidAmount > 0) {
      addAccountTransaction({
        date: sale.date,
        type: 'income',
        category: 'produce_sale',
        amount: sale.paidAmount,
        accountId: 'acc-01',
        accountName: 'ABA Bank - Primary Farm Operating Account',
        referenceId: newId,
        descriptionEn: `Receipt for ${invNum} (${sale.customerName})`,
        descriptionKm: `ប្រាក់ចំណូលពី ${invNum} (${sale.customerName})`,
        recordedBy: 'Sales Dept',
      });
    }
  };

  const updateSaleStatus = (
    id: string, 
    paymentStatus?: 'paid' | 'partial' | 'unpaid', 
    deliveryStatus?: 'delivered' | 'in_transit' | 'pending'
  ) => {
    setSalesOrders((prev) => prev.map((s) => {
      if (s.id !== id) return s;
      const updated: SaleOrder = {
        ...s,
        paymentStatus: paymentStatus || s.paymentStatus,
        deliveryStatus: deliveryStatus || s.deliveryStatus,
      };
      api.saveSalesOrder(updated).catch((err) => console.error('Error updating sales order in DB:', err));
      return updated;
    }));
  };

  // --- Farmers with MariaDB ---
  const addFarmer = (farmer: Omit<Farmer, 'id' | 'code'>) => {
    const newFmr: Farmer = {
      ...farmer,
      id: `fmr-${Date.now()}`,
      code: `FMR-${String(farmers.length + 1).padStart(3, '0')}`,
    };
    setFarmers((prev) => [...prev, newFmr]);
    api.saveFarmer(newFmr).catch((err) => console.error('Error saving farmer to DB:', err));
  };

  const updateFarmer = (farmer: Farmer) => {
    setFarmers((prev) => prev.map((f) => f.id === farmer.id ? farmer : f));
    api.saveFarmer(farmer).catch((err) => console.error('Error updating farmer in DB:', err));
  };

  const deleteFarmer = (id: string) => {
    setFarmers((prev) => prev.filter((f) => f.id !== id));
    api.deleteFarmer(id).catch((err) => console.error('Error deleting farmer from DB:', err));
  };

  // --- Customers with MariaDB ---
  const addCustomer = (customer: Omit<Customer, 'id' | 'code'>) => {
    const newCust: Customer = {
      ...customer,
      id: `cust-${Date.now()}`,
      code: `CUST-${String(customers.length + 1).padStart(3, '0')}`,
    };
    setCustomers((prev) => [...prev, newCust]);
    api.saveCustomer(newCust).catch((err) => console.error('Error saving customer to DB:', err));
  };

  const updateCustomer = (customer: Customer) => {
    setCustomers((prev) => prev.map((c) => c.id === customer.id ? customer : c));
    api.saveCustomer(customer).catch((err) => console.error('Error updating customer in DB:', err));
  };

  const deleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    api.deleteCustomer(id).catch((err) => console.error('Error deleting customer from DB:', err));
  };

  // --- Suppliers with MariaDB ---
  const addSupplier = (supplier: Omit<Supplier, 'id' | 'code'>) => {
    const newSup: Supplier = {
      ...supplier,
      id: `sup-${Date.now()}`,
      code: `SUP-${String(suppliers.length + 1).padStart(3, '0')}`,
    };
    setSuppliers((prev) => [...prev, newSup]);
    api.saveSupplier(newSup).catch((err) => console.error('Error saving supplier to DB:', err));
  };

  const updateSupplier = (supplier: Supplier) => {
    setSuppliers((prev) => prev.map((s) => s.id === supplier.id ? supplier : s));
    api.saveSupplier(supplier).catch((err) => console.error('Error updating supplier in DB:', err));
  };

  const deleteSupplier = (id: string) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
    api.deleteSupplier(id).catch((err) => console.error('Error deleting supplier from DB:', err));
  };

  // --- Financial Accounts & Transactions with MariaDB ---
  const addAccountTransaction = (tx: Omit<AccountTransaction, 'id' | 'transactionNumber'>) => {
    const newTx: AccountTransaction = {
      ...tx,
      id: `txn-${Date.now()}`,
      transactionNumber: `TXN-${new Date().getFullYear()}-${String(accountTransactions.length + 1).padStart(4, '0')}`,
    };
    setAccountTransactions((prev) => [newTx, ...prev]);
    api.saveTransaction(newTx).catch((err) => console.error('Error saving transaction to DB:', err));

    setFinancialAccounts((prev) => prev.map((acc) => {
      if (acc.id !== tx.accountId) return acc;
      const delta = tx.type === 'income' ? tx.amount : -tx.amount;
      const updated = {
        ...acc,
        balance: acc.balance + delta,
      };
      api.updateAccount(updated).catch((err) => console.error('Error updating account balance in DB:', err));
      return updated;
    }));
  };

  const transferFunds = (fromAccountId: string, toAccountId: string, amount: number, note?: string) => {
    if (amount <= 0) return;
    const dateStr = getTodayDateString();
    const fromAcc = financialAccounts.find((a) => a.id === fromAccountId);
    const toAcc = financialAccounts.find((a) => a.id === toAccountId);

    setFinancialAccounts((prev) => prev.map((acc) => {
      if (acc.id === fromAccountId) {
        const u = { ...acc, balance: acc.balance - amount };
        api.updateAccount(u).catch(console.error);
        return u;
      }
      if (acc.id === toAccountId) {
        const u = { ...acc, balance: acc.balance + amount };
        api.updateAccount(u).catch(console.error);
        return u;
      }
      return acc;
    }));

    const transferTx: AccountTransaction = {
      id: `txn-${Date.now()}`,
      transactionNumber: `TXN-${new Date().getFullYear()}-${String(accountTransactions.length + 1).padStart(4, '0')}`,
      date: dateStr,
      type: 'transfer',
      category: 'other',
      amount,
      accountId: fromAccountId,
      accountName: `${fromAcc?.name || 'Account'} ➜ ${toAcc?.name || 'Account'}`,
      descriptionEn: `Internal Fund Transfer ($${amount.toFixed(2)})${note ? `: ${note}` : ''}`,
      descriptionKm: `ផ្ទេរប្រាក់ផ្ទៃក្នុង ($${amount.toFixed(2)})${note ? `: ${note}` : ''}`,
      recordedBy: 'Finance Controller',
    };
    setAccountTransactions((prev) => [transferTx, ...prev]);
    api.saveTransaction(transferTx).catch(console.error);
  };

  const resetToDefaults = async () => {
    localStorage.clear();
    try {
      await api.resetDatabase();
      await refreshFromDatabase();
    } catch {
      setFarms(INITIAL_FARMS);
      setPlots(INITIAL_PLOTS);
      setCropCycles(INITIAL_CROP_CYCLES);
      setTasks(INITIAL_TASKS);
      setMonitoringRecords(INITIAL_MONITORING_RECORDS);
      setHarvestRecords(INITIAL_HARVEST_RECORDS);
      setRecommendations(INITIAL_AI_RECOMMENDATIONS);
      setNotifications(INITIAL_NOTIFICATIONS);
      setStockItems(INITIAL_STOCK_ITEMS);
      setPurchaseOrders(INITIAL_PURCHASE_ORDERS);
      setSalesOrders(INITIAL_SALES_ORDERS);
      setFarmers(INITIAL_FARMERS);
      setCustomers(INITIAL_CUSTOMERS);
      setSuppliers(INITIAL_SUPPLIERS);
      setFinancialAccounts(INITIAL_FINANCIAL_ACCOUNTS);
      setAccountTransactions(INITIAL_ACCOUNT_TRANSACTIONS);
      setGrowthStages(DEFAULT_GROWTH_STAGES);
    }
    setFarms(INITIAL_FARMS);
    setSelectedFarmId('farm-1');
    setSelectedPlotId('plot-a');
    setSelectedCycleId('cycle-2025-m2');
  };

  return (
    <FarmContext.Provider
      value={{
        activeTab,
        setActiveTab,
        selectedPlotId,
        setSelectedPlotId,
        selectedCycleId,
        setSelectedCycleId,
        searchQuery,
        setSearchQuery,
        dbConnected,
        isSyncing,
        refreshFromDatabase,
        farms,
        selectedFarmId,
        setSelectedFarmId,
        addFarm,
        updateFarm,
        deleteFarm,
        addPlot,
        plots,
        currentPlot,
        cropCycles,
        currentCycle,
        cropVarieties,
        varietyCategories,
        growthStages,
        customStages: growthStages,
        tasks,
        filteredTasks,
        taskPresets,
        monitoringRecords,
        harvestRecords,
        recommendations,
        notifications,
        currentSimulatedDate,
        stockItems,
        purchaseOrders,
        salesOrders,
        farmers,
        customers,
        suppliers,
        financialAccounts,
        accountTransactions,
        addTask,
        updateTask,
        deleteTask,
        updateTaskStatus,
        rescheduleTask,
        addCropCycle,
        updateCropCycle,
        deleteCropCycle,
        deleteAllCropCycles,
        deleteAllCrops,
        emptyPlotCrop,
        setCropBatchStatus,
        addCrop,
        updateCrop,
        deleteCrop,
        addCropVariety,
        updateCropVariety,
        deleteCropVariety,
        addVarietyCategory,
        updateVarietyCategory,
        deleteVarietyCategory,
        addGrowthStage,
        updateGrowthStage,
        deleteGrowthStage,
        resetGrowthStages,
        addCustomStagePreset,
        updateCustomStagePreset,
        deleteCustomStagePreset,
        resetCustomStagePresets,
        addTaskPreset,
        updateTaskPreset,
        deleteTaskPreset,
        resetTaskPresets,
        generateTasksForActiveCycles,
        updatePlot,
        deletePlot,
        toggleIrrigation,
        addMonitoringRecord,
        updateMonitoringRecord,
        deleteMonitoringRecord,
        addHarvestRecord,
        addStockItem,
        updateStockItem,
        adjustStockQuantity,
        deleteStockItem,
        addPurchaseOrder,
        updatePurchaseOrderStatus,
        addSaleOrder,
        updateSaleStatus,
        addFarmer,
        updateFarmer,
        deleteFarmer,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        addAccountTransaction,
        transferFunds,
        markNotificationAsRead,
        markAllNotificationsRead,
        applyRecommendation,
        resetToDefaults,
      }}
    >
      {children}
    </FarmContext.Provider>
  );
};

export const useFarm = () => {
  const context = useContext(FarmContext);
  if (!context) {
    throw new Error('useFarm must be used within a FarmProvider');
  }
  return context;
};
