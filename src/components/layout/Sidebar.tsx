import React, { useState } from 'react';
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
  Sprout,
  ChevronDown,
  Check
} from 'lucide-react';
import { useI18n } from '../../locales/i18nContext';
import { useFarm, NavigationTab } from '../../context/FarmContext';
import { useAuth } from '../../context/AuthContext';
import { useMapSettings } from '../../context/MapSettingsContext';
import { AddNewCropModal } from '../common/AddNewCropModal';
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
  const { t, language, setLanguage } = useI18n();
  const { 
    activeTab, 
    setActiveTab,
    farms,
    selectedFarmId,
    setSelectedFarmId,
    plots,
    selectedPlotId,
    setSelectedPlotId,
    cropCycles
  } = useFarm();
  const { canView } = useAuth();
  const { projectName, footTag } = useMapSettings();

  const [showAddCropModal, setShowAddCropModal] = useState(false);
  const [showMobileFarmDropdown, setShowMobileFarmDropdown] = useState(false);
  const [showMobilePlotDropdown, setShowMobilePlotDropdown] = useState(false);

  const currentFarm = farms.find((f) => f.id === selectedFarmId);
  const visiblePlots = selectedFarmId === 'all' 
    ? plots 
    : plots.filter((p) => p.farmId === selectedFarmId);
  const currentPlot = plots.find((p) => p.id === selectedPlotId);

  const handleSelectFarm = (farmId: string) => {
    setSelectedFarmId(farmId);
    setShowMobileFarmDropdown(false);
    if (farmId !== 'all') {
      const plotsInFarm = plots.filter((p) => p.farmId === farmId);
      const isPlotInFarm = plotsInFarm.some((p) => p.id === selectedPlotId);
      if (!isPlotInFarm && selectedPlotId !== 'all') {
        setSelectedPlotId(plotsInFarm.length > 0 ? plotsInFarm[0].id : 'all');
      }
    }
  };

  const isAllPlots = selectedPlotId === 'all';
  const hasActiveCrop = isAllPlots
    ? cropCycles.some((c) => c.status === 'active')
    : cropCycles.some((c) => c.plotId === selectedPlotId && c.status === 'active');

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
        w-72 sm:w-80 md:w-60 lg:w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between
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
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 md:hidden cursor-pointer"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </motion.button>
          )}
        </div>

        {/* Mobile Nav Menu: Action Buttons moved from header (md:hidden) */}
        <div className="md:hidden px-3 pt-3 pb-3 border-b border-slate-100 space-y-2.5 bg-slate-50/60">
          {/* 1. Add Planting Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setShowAddCropModal(true);
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-[#164e22] hover:bg-[#123e1b] text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs hover:shadow transition-all cursor-pointer"
            title="Add Planting / ដាំដំណាំថ្មី"
          >
            <Sprout className="w-4 h-4 text-emerald-300" />
            <span>{language === 'km' ? 'ដាំដំណាំថ្មី (Add Planting)' : 'Add Planting'}</span>
          </motion.button>

          {/* 2. Select Farm Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowMobileFarmDropdown(!showMobileFarmDropdown);
                setShowMobilePlotDropdown(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-800 transition-colors shadow-2xs cursor-pointer"
            >
              <div className="flex items-center gap-2 truncate">
                <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">
                  {selectedFarmId === 'all'
                    ? (language === 'km' ? 'គ្រប់កសិដ្ឋាន' : 'All Farms')
                    : (currentFarm ? (language === 'km' && currentFarm.nameKm ? currentFarm.nameKm : currentFarm.name) : (language === 'km' ? 'ជ្រើសរើសកសិដ្ឋាន' : 'Select Farm'))}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
            </button>

            {showMobileFarmDropdown && (
              <div className="mt-1 w-full bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-30 max-h-48 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => handleSelectFarm('all')}
                  className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between hover:bg-slate-50 cursor-pointer ${
                    selectedFarmId === 'all' ? 'text-emerald-700 font-bold bg-emerald-50/70' : 'text-slate-700'
                  }`}
                >
                  <span className="font-semibold">{language === 'km' ? '✨ គ្រប់កសិដ្ឋាន (All Farms)' : '✨ All Farms'}</span>
                  {selectedFarmId === 'all' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                </button>
                {farms.map((farm) => {
                  const isSelected = selectedFarmId === farm.id;
                  return (
                    <button
                      key={farm.id}
                      type="button"
                      onClick={() => handleSelectFarm(farm.id)}
                      className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between hover:bg-slate-50 cursor-pointer ${
                        isSelected ? 'text-emerald-700 font-bold bg-emerald-50/70' : 'text-slate-700'
                      }`}
                    >
                      <span className="font-semibold truncate">
                        {language === 'km' && farm.nameKm ? farm.nameKm : farm.name}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. Select Target Plot Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowMobilePlotDropdown(!showMobilePlotDropdown);
                setShowMobileFarmDropdown(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-800 transition-colors shadow-2xs cursor-pointer"
            >
              <div className="flex items-center gap-2 truncate">
                <span className={`w-2 h-2 rounded-full shrink-0 ${hasActiveCrop ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                <span className="truncate">
                  {selectedPlotId === 'all'
                    ? (language === 'km' ? 'គ្រប់រងដាំ (All Plots)' : 'All Plots')
                    : (currentPlot ? (language === 'km' ? currentPlot.name.replace('Plot', 'រង') : currentPlot.name) : (language === 'km' ? 'ជ្រើសរើសរងដាំ' : 'Select Plot'))}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
            </button>

            {showMobilePlotDropdown && (
              <div className="mt-1 w-full bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-30 max-h-48 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPlotId('all');
                    setShowMobilePlotDropdown(false);
                  }}
                  className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between hover:bg-slate-50 cursor-pointer ${
                    selectedPlotId === 'all' ? 'text-emerald-700 font-bold bg-emerald-50/70' : 'text-slate-700'
                  }`}
                >
                  <span className="font-semibold">{language === 'km' ? 'គ្រប់រងដាំ (All Plots)' : 'All Plots'}</span>
                  {selectedPlotId === 'all' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                </button>
                {visiblePlots.map((plot) => {
                  const isSelected = selectedPlotId === plot.id;
                  return (
                    <button
                      key={plot.id}
                      type="button"
                      onClick={() => {
                        setSelectedPlotId(plot.id);
                        setShowMobilePlotDropdown(false);
                      }}
                      className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between hover:bg-slate-50 cursor-pointer ${
                        isSelected ? 'text-emerald-700 font-bold bg-emerald-50/70' : 'text-slate-700'
                      }`}
                    >
                      <span className="font-semibold truncate">{plot.name} ({plot.code})</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. Language Switcher (English | ខ្មែរ) */}
          <div className="flex items-center bg-slate-200/70 p-1 rounded-xl text-xs font-bold border border-slate-200/80">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`flex-1 py-1 rounded-lg transition-all text-center cursor-pointer ${
                language === 'en'
                  ? 'bg-white text-emerald-800 shadow-xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              English
            </button>
            <span className="text-slate-300 text-xs px-0.5 select-none">|</span>
            <button
              type="button"
              onClick={() => setLanguage('km')}
              className={`flex-1 py-1 rounded-lg transition-all font-khmer text-center cursor-pointer ${
                language === 'km'
                  ? 'bg-white text-emerald-800 shadow-xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ខ្មែរ
            </button>
          </div>
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

      {/* Add New Crop Modal for Mobile Nav Menu */}
      <AddNewCropModal
        isOpen={showAddCropModal}
        onClose={() => setShowAddCropModal(false)}
      />
    </>
  );
};

