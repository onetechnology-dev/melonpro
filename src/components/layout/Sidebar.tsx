import React from 'react';
import { 
  LayoutDashboard, 
  CalendarDays, 
  MapPin, 
  BarChart3, 
  FileText, 
  Settings, 
  ClipboardList, 
  CheckSquare, 
  Activity, 
  Scale,
  Boxes,
  Tag,
  ShoppingCart,
  BadgePercent,
  Users,
  Store,
  Building2,
  Wallet,
  Warehouse,
  ReceiptText,
  X,
  Sprout
} from 'lucide-react';
import { useI18n } from '../../locales/i18nContext';
import { useFarm, NavigationTab } from '../../context/FarmContext';
import { useAuth } from '../../context/AuthContext';
import { useMapSettings } from '../../context/MapSettingsContext';
import { MelonLogo, SidebarGreenhouseBanner } from '../common/MelonIllustrations';
import { motion } from 'motion/react';
import { ShieldCheck } from 'lucide-react';

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface NavGroup {
  sectionEn: string;
  sectionKm: string;
  items: {
    id: NavigationTab;
    labelEn: string;
    labelKm: string;
    icon: React.FC<{ className?: string }>;
    badge?: string;
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen = false, onCloseMobile }) => {
  const { t, language } = useI18n();
  const { activeTab, setActiveTab } = useFarm();
  const { canView } = useAuth();
  const { projectName, footTag } = useMapSettings();

  const navGroups: NavGroup[] = [
    {
      sectionEn: 'Agronomy & Production',
      sectionKm: 'កសិកម្ម និងផលិតកម្ម',
      items: [
        { id: 'dashboard', labelEn: 'Dashboard', labelKm: 'ផ្ទាំងគ្រប់គ្រង', icon: LayoutDashboard },
        { id: 'farm_management', labelEn: 'Farm & Plots', labelKm: 'កសិដ្ឋាន & រងដាំ', icon: Warehouse },
        { id: 'crop_management', labelEn: 'Crop Management', labelKm: 'គ្រប់គ្រងដំណាំ', icon: Sprout },
        { id: 'planting', labelEn: 'Planting Plan', labelKm: 'ផែនការដាំ', icon: ClipboardList },
        { id: 'calendar', labelEn: 'Crop Calendar', labelKm: 'ប្រតិទិនដំណាំ', icon: CalendarDays },
        { id: 'field', labelEn: 'Field Map', labelKm: 'ផែនទីចំការ', icon: MapPin },
        { id: 'tasks', labelEn: 'Farm Tasks', labelKm: 'កិច្ចការចំការ', icon: CheckSquare },
        { id: 'monitoring', labelEn: 'Crop Monitoring', labelKm: 'តាមដានដំណាំ', icon: Activity },
        { id: 'harvest', labelEn: 'Harvest & Yield', labelKm: 'ប្រមូលផល', icon: Scale },
      ]
    },
    {
      sectionEn: 'Commercial & ERP',
      sectionKm: 'ពាណិជ្ជកម្ម និងស្តុក',
      items: [
        { id: 'item_management', labelEn: 'Item Management', labelKm: 'គ្រប់គ្រងមុខទំនិញ', icon: Tag },
        { id: 'stock', labelEn: 'Stock Inventory', labelKm: 'ស្តុកទំនិញ', icon: Boxes },
        { id: 'purchase_stock', labelEn: 'Purchase Stock', labelKm: 'ទិញចូលស្តុក', icon: ShoppingCart },
        { id: 'sale', labelEn: 'Sales & Invoices', labelKm: 'ការលក់', icon: BadgePercent },
        { id: 'farmer', labelEn: 'Farmers & Team', labelKm: 'កសិករ/បុគ្គលិក', icon: Users },
        { id: 'customer', labelEn: 'Customers', labelKm: 'អតិថិជន', icon: Store },
        { id: 'supplier', labelEn: 'Suppliers', labelKm: 'អ្នកផ្គត់ផ្គង់', icon: Building2 },
        { id: 'account', labelEn: 'Accounts & Ledger', labelKm: 'គណនេយ្យ', icon: Wallet },
      ]
    },
    {
      sectionEn: 'Reports & Settings',
      sectionKm: 'របាយការណ៍ និងកំណត់',
      items: [
        { id: 'analytics', labelEn: 'Analytics', labelKm: 'វិភាគទិន្នន័យ', icon: BarChart3 },
        { id: 'records', labelEn: 'Farm Records', labelKm: 'កំណត់ត្រាចំការ', icon: FileText },
        { id: 'project_invoice', labelEn: 'Project Quotation (A4)', labelKm: 'សម្រង់តម្លៃគម្រោង (A4)', icon: ReceiptText },
        { id: 'settings', labelEn: 'Settings', labelKm: 'ការកំណត់', icon: Settings },
        { id: 'user_management', labelEn: 'User Management', labelKm: 'គ្រប់គ្រងអ្នកប្រើប្រាស់', icon: ShieldCheck },
      ]
    }
  ];

  // Filter navigation items by active user's permissions
  const visibleNavGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => canView(item.id)),
    }))
    .filter((group) => group.items.length > 0);

  const handleSelectTab = (tabId: NavigationTab) => {
    setActiveTab(tabId);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        w-60 lg:w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between
        transform transition-transform duration-200 ease-in-out shrink-0
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Top Brand with interactive hover animation */}
        <div className="p-3.5 sm:p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 6 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            >
              <MelonLogo className="w-9 h-9 shrink-0 drop-shadow-sm cursor-pointer" />
            </motion.div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black tracking-tight text-[#164e22] truncate">
                  {projectName}
                </span>
              </div>
              <p className="text-[10px] font-semibold text-slate-500 tracking-wider uppercase mt-0.5 truncate">
                {language === 'km' ? 'កសិកម្មឆ្លាតវៃជាមួយគ្នា' : 'Smart Farming Together'}
              </p>
            </div>
          </div>
          {onCloseMobile && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onCloseMobile}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 md:hidden"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </motion.button>
          )}
        </div>

        {/* Navigation list with grouped sections and compact proportion */}
        <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4">
          {visibleNavGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              <div className="px-2.5 py-1 flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                  {language === 'km' ? group.sectionKm : group.sectionEn}
                </span>
              </div>

              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <motion.button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    whileHover={{ x: 3, scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 20 }}
                    className={`
                      w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-colors group cursor-pointer
                      ${isActive 
                        ? 'bg-[#EAF5EC] text-[#14532D] font-bold shadow-2xs border border-[#C8E6C9]' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-semibold'
                      }
                    `}
                  >
                    <motion.div 
                      className={`p-1 rounded-lg shrink-0 transition-colors ${
                        isActive ? 'text-[#1B5E20] bg-emerald-100/70' : 'text-slate-400 group-hover:text-emerald-700 group-hover:bg-emerald-50'
                      }`}
                      whileHover={{ scale: 1.25, rotate: [0, -8, 8, 0] }}
                      transition={{ duration: 0.25 }}
                    >
                      <Icon className="w-4.5 h-4.5" />
                    </motion.div>
                    <div className="flex flex-col leading-tight overflow-hidden flex-1">
                      <span className="text-[13px] font-semibold truncate">
                        {language === 'km' ? item.labelKm : item.labelEn}
                      </span>
                    </div>
                    {isActive && (
                      <motion.span 
                        layoutId="active-pill"
                        className="w-1.5 h-4 rounded-full bg-emerald-600 shrink-0" 
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Bottom Banner */}
        <div className="p-2.5 pt-0">
          <div className="relative rounded-2xl overflow-hidden shadow-xs border border-emerald-900/10">
            <SidebarGreenhouseBanner className="w-full h-20 object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/90 via-emerald-900/40 to-transparent p-2.5 flex flex-col justify-end text-white">
              <p className="text-[11px] font-extrabold leading-tight tracking-wide truncate">
                {projectName} ERP & Farm Operations
              </p>
              <p className="text-[10px] text-emerald-200/90 font-khmer mt-0.5 font-medium truncate">
                {footTag || (language === 'km' ? 'ដំណោះស្រាយគ្រប់គ្រងកសិដ្ឋានត្រសក់ផ្អែមពេញលេញ' : 'Smart Farming Together')}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

