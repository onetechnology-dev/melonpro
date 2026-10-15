import { 
  Farm,
  Plot, 
  CropCycle, 
  FarmTask, 
  MonitoringRecord, 
  HarvestRecord, 
  AIRecommendation, 
  FarmNotification, 
  StockItem, 
  PurchaseStockOrder, 
  SaleOrder, 
  Farmer, 
  Customer, 
  Supplier, 
  FinancialAccount, 
  AccountTransaction 
} from '../types/melon';
import { CropVarietyPreset } from '../data/cropVarieties';

const API_BASE = '/api';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`API Error [${response.status}] ${endpoint}: ${errorBody}`);
  }

  return response.json();
}

export interface SyncAllResponse {
  success: boolean;
  data: {
    plots: Plot[];
    cropCycles: CropCycle[];
    cropVarieties: CropVarietyPreset[];
    tasks: FarmTask[];
    monitoringRecords: MonitoringRecord[];
    harvestRecords: HarvestRecord[];
    recommendations: AIRecommendation[];
    notifications: FarmNotification[];
    stockItems: StockItem[];
    purchaseOrders: PurchaseStockOrder[];
    salesOrders: SaleOrder[];
    farmers: Farmer[];
    customers: Customer[];
    suppliers: Supplier[];
    financialAccounts: FinancialAccount[];
    accountTransactions: AccountTransaction[];
    farmSettings: any;
  };
}

export const api = {
  // Check backend & database health
  async checkHealth() {
    return request<{ status: string; database: string; tablesCount: number }>('/health');
  },

  // Full sync from MariaDB database
  async fetchAll(): Promise<SyncAllResponse['data']> {
    const res = await request<SyncAllResponse>('/sync/all');
    return res.data;
  },

  // Reset database to default seeds
  async resetDatabase() {
    return request<{ success: boolean; message: string }>('/reset', { method: 'POST' });
  },

  // Farms
  async getFarms(): Promise<Farm[]> {
    return request<Farm[]>('/farms');
  },
  async saveFarm(farm: Farm): Promise<Farm> {
    const res = await request<{ success: boolean; farm: Farm }>('/farms', {
      method: 'POST',
      body: JSON.stringify(farm)
    });
    return res.farm || farm;
  },
  async deleteFarm(id: string): Promise<void> {
    await request(`/farms/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  // Plots
  async getPlots(): Promise<Plot[]> {
    return request<Plot[]>('/plots');
  },
  async savePlot(plot: Plot): Promise<Plot> {
    const res = await request<{ success: boolean; plot: Plot }>('/plots', {
      method: 'POST',
      body: JSON.stringify(plot)
    });
    return res.plot || plot;
  },
  async deletePlot(id: string): Promise<void> {
    await request(`/plots/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  // Crop Cycles
  async getCycles(): Promise<CropCycle[]> {
    return request<CropCycle[]>('/crop-cycles');
  },
  async saveCycle(cycle: CropCycle): Promise<CropCycle> {
    const res = await request<{ success: boolean; cycle: CropCycle }>('/crop-cycles', {
      method: 'POST',
      body: JSON.stringify(cycle)
    });
    return res.cycle || cycle;
  },
  async deleteCycle(id: string): Promise<void> {
    await request(`/crop-cycles/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },
  async deleteAllCycles(): Promise<void> {
    await request('/crop-cycles', { method: 'DELETE' });
  },

  // Crop Varieties
  async getVarieties(): Promise<CropVarietyPreset[]> {
    return request<CropVarietyPreset[]>('/crop-varieties');
  },
  async saveVariety(variety: CropVarietyPreset): Promise<CropVarietyPreset> {
    const res = await request<{ success: boolean; variety: CropVarietyPreset }>('/crop-varieties', {
      method: 'POST',
      body: JSON.stringify(variety)
    });
    return res.variety || variety;
  },
  async deleteVariety(id: string): Promise<void> {
    await request(`/crop-varieties/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  // Tasks
  async getTasks(): Promise<FarmTask[]> {
    return request<FarmTask[]>('/tasks');
  },
  async saveTask(task: FarmTask): Promise<FarmTask> {
    const res = await request<{ success: boolean; task: FarmTask }>('/tasks', {
      method: 'POST',
      body: JSON.stringify(task)
    });
    return res.task || task;
  },
  async deleteTask(id: string): Promise<void> {
    await request(`/tasks/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  // Monitoring
  async getMonitoring(): Promise<MonitoringRecord[]> {
    return request<MonitoringRecord[]>('/monitoring');
  },
  async saveMonitoring(record: MonitoringRecord): Promise<MonitoringRecord> {
    const res = await request<{ success: boolean; record: MonitoringRecord }>('/monitoring', {
      method: 'POST',
      body: JSON.stringify(record)
    });
    return res.record || record;
  },
  async deleteMonitoring(id: string): Promise<void> {
    await request(`/monitoring/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  // Harvests
  async getHarvests(): Promise<HarvestRecord[]> {
    return request<HarvestRecord[]>('/harvests');
  },
  async saveHarvest(record: HarvestRecord): Promise<HarvestRecord> {
    const res = await request<{ success: boolean; record: HarvestRecord }>('/harvests', {
      method: 'POST',
      body: JSON.stringify(record)
    });
    return res.record || record;
  },
  async deleteHarvest(id: string): Promise<void> {
    await request(`/harvests/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  // Notifications
  async getNotifications(): Promise<FarmNotification[]> {
    return request<FarmNotification[]>('/notifications');
  },
  async markNotificationRead(id: string): Promise<void> {
    await request(`/notifications/${encodeURIComponent(id)}/read`, { method: 'PUT' });
  },
  async markAllNotificationsRead(): Promise<void> {
    await request('/notifications/read-all', { method: 'PUT' });
  },

  // Stock Items (ERP)
  async getStockItems(): Promise<StockItem[]> {
    return request<StockItem[]>('/stock-items');
  },
  async saveStockItem(item: StockItem): Promise<StockItem> {
    const res = await request<{ success: boolean; item: StockItem }>('/stock-items', {
      method: 'POST',
      body: JSON.stringify(item)
    });
    return res.item || item;
  },
  async deleteStockItem(id: string): Promise<void> {
    await request(`/stock-items/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  // Purchase Orders (ERP)
  async getPurchaseOrders(): Promise<PurchaseStockOrder[]> {
    return request<PurchaseStockOrder[]>('/purchase-orders');
  },
  async savePurchaseOrder(order: PurchaseStockOrder): Promise<PurchaseStockOrder> {
    const res = await request<{ success: boolean; order: PurchaseStockOrder }>('/purchase-orders', {
      method: 'POST',
      body: JSON.stringify(order)
    });
    return res.order || order;
  },

  // Sales Orders (ERP)
  async getSalesOrders(): Promise<SaleOrder[]> {
    return request<SaleOrder[]>('/sales-orders');
  },
  async saveSalesOrder(order: SaleOrder): Promise<SaleOrder> {
    const res = await request<{ success: boolean; order: SaleOrder }>('/sales-orders', {
      method: 'POST',
      body: JSON.stringify(order)
    });
    return res.order || order;
  },

  // Farmers (CRM)
  async getFarmers(): Promise<Farmer[]> {
    return request<Farmer[]>('/farmers');
  },
  async saveFarmer(farmer: Farmer): Promise<Farmer> {
    const res = await request<{ success: boolean; farmer: Farmer }>('/farmers', {
      method: 'POST',
      body: JSON.stringify(farmer)
    });
    return res.farmer || farmer;
  },
  async deleteFarmer(id: string): Promise<void> {
    await request(`/farmers/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  // Customers (CRM)
  async getCustomers(): Promise<Customer[]> {
    return request<Customer[]>('/customers');
  },
  async saveCustomer(customer: Customer): Promise<Customer> {
    const res = await request<{ success: boolean; customer: Customer }>('/customers', {
      method: 'POST',
      body: JSON.stringify(customer)
    });
    return res.customer || customer;
  },
  async deleteCustomer(id: string): Promise<void> {
    await request(`/customers/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  // Suppliers (CRM)
  async getSuppliers(): Promise<Supplier[]> {
    return request<Supplier[]>('/suppliers');
  },
  async saveSupplier(supplier: Supplier): Promise<Supplier> {
    const res = await request<{ success: boolean; supplier: Supplier }>('/suppliers', {
      method: 'POST',
      body: JSON.stringify(supplier)
    });
    return res.supplier || supplier;
  },
  async deleteSupplier(id: string): Promise<void> {
    await request(`/suppliers/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  // Financial Accounts
  async getAccounts(): Promise<FinancialAccount[]> {
    return request<FinancialAccount[]>('/financial-accounts');
  },
  async updateAccount(account: FinancialAccount): Promise<void> {
    await request(`/financial-accounts/${encodeURIComponent(account.id)}`, {
      method: 'PUT',
      body: JSON.stringify(account)
    });
  },

  // Account Transactions
  async getTransactions(): Promise<AccountTransaction[]> {
    return request<AccountTransaction[]>('/account-transactions');
  },
  async saveTransaction(tx: AccountTransaction): Promise<AccountTransaction> {
    const res = await request<{ success: boolean; transaction: AccountTransaction }>('/account-transactions', {
      method: 'POST',
      body: JSON.stringify(tx)
    });
    return res.transaction || tx;
  },

  // Farm & Map Settings
  async getSettings(): Promise<any> {
    return request<any>('/settings');
  },
  async updateSettings(settings: any): Promise<void> {
    await request('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  },
  async uploadLoginBackground(imageBase64: string, extension: string = 'jpg'): Promise<{ success: boolean; url: string }> {
    return request<{ success: boolean; url: string }>('/settings/upload-bg', {
      method: 'POST',
      body: JSON.stringify({ imageBase64, extension })
    });
  }
};
