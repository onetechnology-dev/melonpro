export type UserRole = 'developer' | 'admin' | 'farmer' | 'team';

export interface FeaturePermission {
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
}

export type PermissionAction = 'view' | 'add' | 'edit' | 'delete';

export interface FeatureDefinition {
  id: string;
  category: 'agronomy' | 'commercial' | 'reports_settings';
  labelEn: string;
  labelKm: string;
  descriptionEn: string;
  descriptionKm: string;
}

export interface AppUser {
  id: string;
  username: string;
  email: string;
  name: string;
  nameKm?: string;
  password?: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  department?: string;
  status: 'active' | 'inactive';
  lastLogin?: string;
  customPermissions?: Record<string, Partial<FeaturePermission>>;
  createdAt?: string;
  updatedAt?: string;
}

export type RolePermissionsMap = Record<UserRole, Record<string, FeaturePermission>>;

// Master list of all features in MelonPro
export const SYSTEM_FEATURES: FeatureDefinition[] = [
  // Agronomy & Production
  {
    id: 'dashboard',
    category: 'agronomy',
    labelEn: 'Dashboard',
    labelKm: 'ផ្ទាំងគ្រប់គ្រង',
    descriptionEn: 'Farm overview, live metrics, weather & today tasks',
    descriptionKm: 'ទិដ្ឋភាពទូទៅនៃចំការ រង្វាស់ផ្ទាល់ និងកិច្ចការប្រចាំថ្ងៃ',
  },
  {
    id: 'farm_management',
    category: 'agronomy',
    labelEn: 'Farm & Plots',
    labelKm: 'កសិដ្ឋាន & រងដាំ',
    descriptionEn: 'Manage multiple farms, plots, boundaries & facility types (Net house, Open field)',
    descriptionKm: 'គ្រប់គ្រងកសិដ្ឋាន រងដាំ ព្រំប្រទល់ និងប្រភេទសំណង់ (ផ្ទះសំណាញ់ ចំការវាល)',
  },
  {
    id: 'crop_management',
    category: 'agronomy',
    labelEn: 'Crop Management',
    labelKm: 'គ្រប់គ្រងដំណាំ',
    descriptionEn: 'Active crop cycles, variety settings & net house stages',
    descriptionKm: 'វដ្តដំណាំសកម្ម កំណត់ពូជ និងដំណាក់កាលលូតលាស់',
  },
  {
    id: 'planting',
    category: 'agronomy',
    labelEn: 'Planting Plan',
    labelKm: 'ផែនការដាំ',
    descriptionEn: 'Sowing schedules, nursery management & plant population',
    descriptionKm: 'កាលវិភាគបណ្តុះកូន ថ្នាលបណ្តុះ និងចំនួនដើមដាំ',
  },
  {
    id: 'calendar',
    category: 'agronomy',
    labelEn: 'Crop Calendar',
    labelKm: 'ប្រតិទិនដំណាំ',
    descriptionEn: 'Interactive botanical timeline & stage-by-stage agronomic log',
    descriptionKm: 'ប្រតិទិនកសិកម្មអន្តរកម្ម និងកត់ត្រាការងារតាមដំណាក់កាល',
  },
  {
    id: 'field',
    category: 'agronomy',
    labelEn: 'Field Map',
    labelKm: 'ផែនទីចំការ',
    descriptionEn: 'Satellite parcel mapping, shape drawing & greenhouse telemetry',
    descriptionKm: 'ផែនទីផ្កាយរណប គូរព្រំប្រទល់រងដាំ និងរង្វាស់សីតុណ្ហភាព/សំណើម',
  },
  {
    id: 'tasks',
    category: 'agronomy',
    labelEn: 'Farm Tasks',
    labelKm: 'កិច្ចការចំការ',
    descriptionEn: 'Task assignment, drip valve control & completion tracking',
    descriptionKm: 'ចាត់ចែងកិច្ចការ បញ្ជាវ៉ានទឹកស្រោច និងតាមដានការងារ',
  },
  {
    id: 'monitoring',
    category: 'agronomy',
    labelEn: 'Crop Monitoring',
    labelKm: 'តាមដានដំណាំ',
    descriptionEn: 'Pest/disease scouting, soil EC/pH & plant growth measurements',
    descriptionKm: 'ពិនិត្យសត្វល្អិត/ជំងឺ វាស់កម្រិត EC/pH ដី និងកម្ពស់ដើម',
  },
  {
    id: 'harvest',
    category: 'agronomy',
    labelEn: 'Harvest & Yield',
    labelKm: 'ប្រមូលផល',
    descriptionEn: 'Harvest logging, Brix grading, melon weight & yield stats',
    descriptionKm: 'កត់ត្រាប្រមូលផល វាស់កម្រិតផ្អែម Brix ទម្ងន់ផ្លែ និងទិន្នផល',
  },

  // Commercial & ERP
  {
    id: 'item_management',
    category: 'commercial',
    labelEn: 'Item Management',
    labelKm: 'គ្រប់គ្រងមុខទំនិញ',
    descriptionEn: 'Master catalog for seeds, fertilizers, packaging & melons',
    descriptionKm: 'កាតាឡុកគ្រាប់ពូជ ជី ថ្នាំ សម្ភារវិចខ្ចប់ និងផ្លែត្រសក់',
  },
  {
    id: 'stock',
    category: 'commercial',
    labelEn: 'Stock Inventory',
    labelKm: 'ស្តុកទំនិញ',
    descriptionEn: 'Warehouse balance, batch tracking & low-stock alerts',
    descriptionKm: 'តុល្យភាពស្តុកឃ្លាំង តាមដានលេខកូដឡូតិ៍ និងដាស់តឿនស្តុកជិតអស់',
  },
  {
    id: 'purchase_stock',
    category: 'commercial',
    labelEn: 'Purchase Stock',
    labelKm: 'ទិញចូលស្តុក',
    descriptionEn: 'Purchase orders, supplier receipts & inventory intake',
    descriptionKm: 'បញ្ជាទិញចូលស្តុក វិក្កយបត្រអ្នកផ្គត់ផ្គង់ និងការទទួលទំនិញ',
  },
  {
    id: 'sale',
    category: 'commercial',
    labelEn: 'Sales & Invoices',
    labelKm: 'ការលក់',
    descriptionEn: 'Wholesale orders, supermarket sales invoices & revenue tracking',
    descriptionKm: 'ការបញ្ជាទិញដុំ វិក្កយបត្រលក់ផ្សារទំនើប និងចំណូល',
  },
  {
    id: 'farmer',
    category: 'commercial',
    labelEn: 'Farmers & Team',
    labelKm: 'កសិករ/បុគ្គលិក',
    descriptionEn: 'Agronomists, field workers, salary tracking & plot assignments',
    descriptionKm: 'អ្នកជំនាញកសិកម្ម បុគ្គលិកចំការ ប្រាក់បៀវត្ស និងការចាត់តាំងរងដាំ',
  },
  {
    id: 'customer',
    category: 'commercial',
    labelEn: 'Customers',
    labelKm: 'អតិថិជន',
    descriptionEn: 'Supermarkets, distributors, wholesale buyers & receivables',
    descriptionKm: 'ផ្សារទំនើប ឈ្មួញកណ្តាល អ្នកទិញដុំ និងតាមដានបំណុលត្រូវប្រមូល',
  },
  {
    id: 'supplier',
    category: 'commercial',
    labelEn: 'Suppliers',
    labelKm: 'អ្នកផ្គត់ផ្គង់',
    descriptionEn: 'Fertilizer companies, seed vendors & trade payables',
    descriptionKm: 'ក្រុមហ៊ុនជី គ្រាប់ពូជ និងតាមដានបំណុលត្រូវសង',
  },
  {
    id: 'account',
    category: 'commercial',
    labelEn: 'Accounts & Ledger',
    labelKm: 'គណនេយ្យ',
    descriptionEn: 'Cash on hand, bank accounts, income & expense ledger',
    descriptionKm: 'សាច់ប្រាក់ក្នុងដៃ គណនីធនាគារ និងសៀវភៅចំណូលចំណាយ',
  },

  // Reports & Settings
  {
    id: 'analytics',
    category: 'reports_settings',
    labelEn: 'Analytics',
    labelKm: 'វិភាគទិន្នន័យ',
    descriptionEn: 'Financial performance, crop profitability & yield forecasts',
    descriptionKm: 'របាយការណ៍ហិរញ្ញវត្ថុ ប្រាក់ចំណេញតាមវដ្តដាំ និងព្យាករទិន្នផល',
  },
  {
    id: 'records',
    category: 'reports_settings',
    labelEn: 'Farm Records',
    labelKm: 'កំណត់ត្រាចំការ',
    descriptionEn: 'CamGAP audit logs, chemical spraying history & compliance',
    descriptionKm: 'កំណត់ត្រាត្រួតពិនិត្យ CamGAP ប្រវត្តិបាញ់ថ្នាំ និងអនុលោមភាព',
  },
  {
    id: 'project_invoice',
    category: 'reports_settings',
    labelEn: 'Project Quotation (A4)',
    labelKm: 'សម្រង់តម្លៃគម្រោង (A4)',
    descriptionEn: 'High-end bilingual A4 engineering proposals, PDF & Google Docs export',
    descriptionKm: 'សម្រង់តម្លៃគម្រោងវិស្វកម្ម A4 ផ្លូវការ នាំចេញ PDF និង Google Docs',
  },
  {
    id: 'settings',
    category: 'reports_settings',
    labelEn: 'Settings',
    labelKm: 'ការកំណត់',
    descriptionEn: 'Farm profile, GIS satellite engines, API tokens & language',
    descriptionKm: 'ប្រវត្តិចំការ ម៉ាស៊ីនផែនទីផ្កាយរណប លេខកូដ API និងភាសា',
  },
  {
    id: 'user_management',
    category: 'reports_settings',
    labelEn: 'User Management',
    labelKm: 'គ្រប់គ្រងអ្នកប្រើប្រាស់',
    descriptionEn: 'Manage user accounts, roles & dynamic feature permissions',
    descriptionKm: 'គ្រប់គ្រងគណនី តួនាទី និងកំណត់សិទ្ធិតាមមុខងារ',
  },
];

/**
 * DEFAULT PERMISSIONS SPECIFICATION AS MANDATED:
 * - Developer: full control all features (view, add, edit, delete: true for all features).
 * - Admin: full control all feature exception Project Quotation(A4) (all true, except project_invoice: all false).
 * - Farmers: (view, add, edit) control all feature exception Project (delete: false, project_invoice: all false).
 * - Team: (view, add, edit) control all feature exception Project (delete: false, project_invoice: all false).
 */
export const DEFAULT_ROLE_PERMISSIONS: RolePermissionsMap = {
  developer: SYSTEM_FEATURES.reduce((acc, feat) => {
    acc[feat.id] = { view: true, add: true, edit: true, delete: true };
    return acc;
  }, {} as Record<string, FeaturePermission>),

  admin: SYSTEM_FEATURES.reduce((acc, feat) => {
    if (feat.id === 'project_invoice') {
      acc[feat.id] = { view: false, add: false, edit: false, delete: false };
    } else {
      acc[feat.id] = { view: true, add: true, edit: true, delete: true };
    }
    return acc;
  }, {} as Record<string, FeaturePermission>),

  farmer: SYSTEM_FEATURES.reduce((acc, feat) => {
    if (feat.id === 'project_invoice' || feat.id === 'user_management') {
      acc[feat.id] = { view: false, add: false, edit: false, delete: false };
    } else if (feat.id === 'settings') {
      acc[feat.id] = { view: true, add: false, edit: false, delete: false };
    } else {
      acc[feat.id] = { view: true, add: true, edit: true, delete: false };
    }
    return acc;
  }, {} as Record<string, FeaturePermission>),

  team: SYSTEM_FEATURES.reduce((acc, feat) => {
    if (feat.id === 'project_invoice' || feat.id === 'user_management') {
      acc[feat.id] = { view: false, add: false, edit: false, delete: false };
    } else if (feat.id === 'settings') {
      acc[feat.id] = { view: true, add: false, edit: false, delete: false };
    } else {
      acc[feat.id] = { view: true, add: true, edit: true, delete: false };
    }
    return acc;
  }, {} as Record<string, FeaturePermission>),
};

// Initial Demo Users with password "123"
export const INITIAL_DEMO_USERS: AppUser[] = [
  {
    id: 'user-dev-01',
    username: 'developer',
    email: 'developer@melonpro.com',
    name: 'Meng Luk',
    nameKm: 'ម៉េង លុក',
    password: '123',
    role: 'developer',
    phone: '+855 12 889 900',
    department: 'Full-Stack Software Engineering',
    status: 'active',
    lastLogin: 'Just now',
    createdAt: '2026-01-01',
  },
  {
    id: 'user-admin-01',
    username: 'admin',
    email: 'admin@melonpro.com',
    name: 'Sokha Chea',
    nameKm: 'ជា សុខា',
    password: '123',
    role: 'admin',
    phone: '+855 77 554 433',
    department: 'Farm Operations & Business Administration',
    status: 'active',
    lastLogin: '10 mins ago',
    createdAt: '2026-01-05',
  },
  {
    id: 'user-farmer-01',
    username: 'farmer',
    email: 'farmer@melonpro.com',
    name: 'Bunthoeun Mean',
    nameKm: 'មាន ប៊ុនធឿន',
    password: '123',
    role: 'farmer',
    phone: '+855 98 443 221',
    department: 'Greenhouse Agronomy & Soil Science',
    status: 'active',
    lastLogin: '25 mins ago',
    createdAt: '2026-01-10',
  },
  {
    id: 'user-team-01',
    username: 'team',
    email: 'team@melonpro.com',
    name: 'Sreymom Pich',
    nameKm: 'ពេជ្រ ស្រីមុំ',
    password: '123',
    role: 'team',
    phone: '+855 86 112 334',
    department: 'Field Drip Irrigation & Crop Maintenance',
    status: 'active',
    lastLogin: '1 hour ago',
    createdAt: '2026-01-15',
  },
];
