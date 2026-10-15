import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, Menu, Check, ChevronDown, Sparkles, Sprout, LogOut, ShieldCheck, User, Code2, UserCog, Users2, Building2 } from 'lucide-react';
import { useI18n } from '../../locales/i18nContext';
import { useFarm } from '../../context/FarmContext';
import { useAuth } from '../../context/AuthContext';
import { useMapSettings } from '../../context/MapSettingsContext';
import { AddNewCropModal } from '../common/AddNewCropModal';
import { MelonLogo } from '../common/MelonIllustrations';
import { motion } from 'motion/react';

interface TopNavProps {
  onOpenMobileMenu: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({ onOpenMobileMenu }) => {
  const { language, setLanguage, t } = useI18n();
  const { projectName } = useMapSettings();
  const { 
    farms,
    selectedFarmId,
    setSelectedFarmId,
    plots, 
    selectedPlotId, 
    setSelectedPlotId, 
    searchQuery, 
    setSearchQuery, 
    notifications, 
    markAllNotificationsRead,
    markNotificationAsRead,
    setActiveTab,
    cropCycles
  } = useFarm();
  const { currentUser, logout, switchUser, users, canView } = useAuth();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showFarmSelector, setShowFarmSelector] = useState(false);
  const [showPlotSelector, setShowPlotSelector] = useState(false);
  const [showAddCropModal, setShowAddCropModal] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const farmRef = useRef<HTMLDivElement>(null);
  const plotRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (farmRef.current && !farmRef.current.contains(event.target as Node)) {
        setShowFarmSelector(false);
      }
      if (plotRef.current && !plotRef.current.contains(event.target as Node)) {
        setShowPlotSelector(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentFarm = farms.find((f) => f.id === selectedFarmId);
  const visiblePlots = selectedFarmId === 'all' 
    ? plots 
    : plots.filter((p) => p.farmId === selectedFarmId);
  const currentPlot = plots.find((p) => p.id === selectedPlotId);

  const handleSelectFarm = (farmId: string) => {
    setSelectedFarmId(farmId);
    setShowFarmSelector(false);
    if (farmId !== 'all') {
      const plotsInFarm = plots.filter((p) => p.farmId === farmId);
      const isPlotInFarm = plotsInFarm.some((p) => p.id === selectedPlotId);
      if (!isPlotInFarm && selectedPlotId !== 'all') {
        setSelectedPlotId(plotsInFarm.length > 0 ? plotsInFarm[0].id : 'all');
      }
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-3 sm:px-5 lg:px-6 py-2.5">
      <div className="flex items-center justify-between gap-2.5 sm:gap-3 w-full">
        {/* Left: Mobile menu button, Mobile Brand, Select Farm & ជ្រើសរើសរងដាំ Selectors */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onOpenMobileMenu}
            className="p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 md:hidden cursor-pointer"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </motion.button>

          <div className="flex items-center gap-2 md:hidden">
            <MelonLogo className="w-8 h-8 shrink-0" />
            <span className="font-bold text-base text-[#164e22] tracking-tight">{projectName}</span>
          </div>

          {/* Selector 1: Select Farm Dropdown (Hidden on mobile, moved to Nav menu) */}
          <div className="hidden md:block relative" ref={farmRef}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setShowFarmSelector(!showFarmSelector);
                setShowPlotSelector(false);
              }}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border border-slate-200 bg-slate-50/90 hover:bg-slate-100 text-xs sm:text-sm font-bold text-slate-800 transition-colors shadow-2xs cursor-pointer"
              title={language === 'km' ? 'ជ្រើសរើសកសិដ្ឋាន' : 'Select Farm'}
            >
              <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
              <span className="truncate max-w-[80px] sm:max-w-[130px] md:max-w-[150px]">
                {selectedFarmId === 'all'
                  ? (language === 'km' ? 'គ្រប់កសិដ្ឋាន' : 'All Farms')
                  : (currentFarm ? (language === 'km' && currentFarm.nameKm ? currentFarm.nameKm : currentFarm.name) : (language === 'km' ? 'ជ្រើសរើសកសិដ្ឋាន' : 'Select Farm'))}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </motion.button>

            {showFarmSelector && (
              <div className="absolute left-0 mt-1.5 w-64 sm:w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in-50 zoom-in-95">
                <div className="px-3.5 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {language === 'km' ? 'ជ្រើសរើសកសិដ្ឋាន' : 'Select Farm'}
                </div>
                <button
                  onClick={() => handleSelectFarm('all')}
                  className={`w-full px-3.5 py-2 text-left text-xs sm:text-sm flex items-center justify-between hover:bg-slate-50 cursor-pointer ${
                    selectedFarmId === 'all' ? 'text-emerald-700 font-bold bg-emerald-50/70' : 'text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <div>
                      <p className="font-semibold">{language === 'km' ? '✨ គ្រប់កសិដ្ឋាន (All Farms)' : '✨ All Farms'}</p>
                      <p className="text-[11px] text-slate-400">{farms.length} {language === 'km' ? 'កសិដ្ឋាន' : 'farms'}</p>
                    </div>
                  </div>
                  {selectedFarmId === 'all' && <Check className="w-4 h-4 text-emerald-600" />}
                </button>
                <div className="h-px bg-slate-100 my-1" />
                {farms.map((farm) => {
                  const farmPlotsCount = plots.filter((p) => p.farmId === farm.id).length;
                  const isSelected = selectedFarmId === farm.id;
                  return (
                    <button
                      key={farm.id}
                      onClick={() => handleSelectFarm(farm.id)}
                      className={`w-full px-3.5 py-2 text-left text-xs sm:text-sm flex items-center justify-between hover:bg-slate-50 cursor-pointer ${
                        isSelected ? 'text-emerald-700 font-bold bg-emerald-50/70' : 'text-slate-700'
                      }`}
                    >
                      <div>
                        <p className="font-semibold text-slate-800">
                          {language === 'km' && farm.nameKm ? farm.nameKm : farm.name}
                        </p>
                        <p className="text-[11px] text-slate-500 font-medium">
                          {farm.code} · {farm.totalAreaHa} ha · {farmPlotsCount} {language === 'km' ? 'រងដាំ' : 'plots'}
                        </p>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selector 2: ជ្រើសរើសរងដាំ (Select Plot) Dropdown based on selected farm (Hidden on mobile, moved to Nav menu) */}
          <div className="hidden md:block relative" ref={plotRef}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setShowPlotSelector(!showPlotSelector);
                setShowFarmSelector(false);
              }}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border border-slate-200 bg-slate-50/90 hover:bg-slate-100 text-xs sm:text-sm font-bold text-slate-800 transition-colors shadow-2xs cursor-pointer"
              title={language === 'km' ? 'ជ្រើសរើសរងដាំ (Select Target Plot)' : 'Select Target Plot'}
            >
              {(() => {
                const isAll = selectedPlotId === 'all';
                const hasActive = isAll
                  ? cropCycles.some((c) => c.status === 'active')
                  : cropCycles.some((c) => c.plotId === selectedPlotId && c.status === 'active');
                return (
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${hasActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                );
              })()}
              <span className="truncate max-w-[80px] sm:max-w-[130px] md:max-w-[160px]">
                {selectedPlotId === 'all'
                  ? (language === 'km' ? 'ជ្រើសរើសរងដាំ (All)' : 'Select Target Plot (All)')
                  : (currentPlot ? (language === 'km' ? currentPlot.name.replace('Plot', 'រង') : currentPlot.name) : (language === 'km' ? 'ជ្រើសរើសរងដាំ' : 'Select Target Plot'))}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </motion.button>

            {showPlotSelector && (
              <div className="absolute left-0 mt-1.5 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in-50 zoom-in-95 max-h-[80vh] overflow-y-auto">
                <div className="px-3.5 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>{language === 'km' ? 'ជ្រើសរើសរងដាំ (Select Target Plot)' : 'Select Target Plot'}</span>
                  <span className="text-[10px] text-emerald-700 font-medium">
                    {selectedFarmId === 'all' ? (language === 'km' ? 'គ្រប់កសិដ្ឋាន' : 'All Farms') : (currentFarm?.name || '')}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setSelectedPlotId('all');
                    setShowPlotSelector(false);
                  }}
                  className={`w-full px-3.5 py-2 text-left text-xs sm:text-sm flex items-center justify-between hover:bg-slate-50 cursor-pointer ${
                    selectedPlotId === 'all' ? 'text-emerald-700 font-bold bg-emerald-50/70' : 'text-slate-700'
                  }`}
                >
                  <div>
                    <p className="font-semibold">{language === 'km' ? 'គ្រប់រងដាំ (All Plots)' : 'All Plots'}</p>
                    <p className="text-[11px] text-slate-400">
                      {visiblePlots.length} {language === 'km' ? 'រងដាំក្នុងកសិដ្ឋាននេះ' : 'plots available'}
                    </p>
                  </div>
                  {selectedPlotId === 'all' && <Check className="w-4 h-4 text-emerald-600" />}
                </button>
                <div className="h-px bg-slate-100 my-1" />
                {visiblePlots.length === 0 ? (
                  <div className="px-4 py-3 text-center text-xs text-slate-400">
                    {language === 'km' ? 'គ្មានរងដាំក្នុងកសិដ្ឋាននេះទេ' : 'No plots found for selected farm'}
                  </div>
                ) : (
                  visiblePlots.map((plot) => {
                    const isSelected = selectedPlotId === plot.id;
                    const shapes = plot.shapes || [];
                    const types = shapes.length > 0 
                      ? Array.from(new Set(shapes.map(s => s.facilityType)))
                      : (plot.facilityTypes || [plot.facilityType]);
                    const hasNet = types.includes('net_house');
                    const hasOpen = types.includes('open_field');

                    const pCycles = cropCycles.filter((c) => c.plotId === plot.id);
                    const pActive = pCycles.some((c) => c.status === 'active');
                    const pComp = pCycles.length > 0 && pCycles.every((c) => c.status === 'completed');

                    const m2Val = plot.areaM2 !== undefined && plot.areaM2 > 0
                      ? plot.areaM2
                      : (plot.areaHa === 0.4 ? 400 : Math.round(plot.areaHa * 10000));

                    return (
                      <button
                        key={plot.id}
                        onClick={() => {
                          setSelectedPlotId(plot.id);
                          setShowPlotSelector(false);
                        }}
                        className={`w-full px-3.5 py-2 text-left text-xs sm:text-sm flex items-center justify-between hover:bg-slate-50 cursor-pointer ${
                          isSelected ? 'text-emerald-700 font-bold bg-emerald-50/70' : 'text-slate-700'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-semibold text-slate-800">{plot.name}</p>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                              {plot.code}
                            </span>
                            {pActive ? (
                              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800">
                                {language === 'km' ? 'មានដំណាំ' : 'Planted'}
                              </span>
                            ) : pComp ? (
                              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-slate-100 text-slate-600">
                                {language === 'km' ? 'ប្រមូលផលរួច' : 'Completed'}
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60">
                                {language === 'km' ? 'ទំនេរ' : 'Empty'}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[11px] text-slate-500 font-medium font-mono">
                              {m2Val.toLocaleString()}m² ({plot.areaHa}{language === 'km' ? 'ហិចតា' : 'ha'})
                            </span>
                            <span className="text-[10px] text-slate-300">·</span>
                            <div className="flex items-center gap-1">
                              {hasNet && (
                                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800">
                                  {language === 'km' ? 'ផ្ទះសំណាញ់' : 'Net House'}
                                </span>
                              )}
                              {hasOpen && (
                                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800">
                                  {language === 'km' ? 'ចំការវាល' : 'Open Field'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>

        {/* Center: Global Search Bar (Hidden on mobile, moved above Dashboard on mobile screen) */}
        <div className="hidden md:flex flex-1 max-w-md mx-2 sm:mx-6">
          <div className="relative w-full">
            <Search className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full pl-10 pr-4 py-2 bg-slate-100/90 hover:bg-slate-100 focus:bg-white text-sm font-medium text-slate-900 rounded-full border border-transparent focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all placeholder:text-slate-400 shadow-2xs"
            />
          </div>
        </div>

        {/* Right: Notifications & User profile (Add Crop & Language switch hidden on mobile, moved to Nav menu) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Action: Add New Crop Button with micro-animation (Hidden on mobile) */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddCropModal(true)}
            className="hidden md:flex items-center gap-2 px-3.5 py-2 bg-[#164e22] hover:bg-[#123e1b] text-white rounded-xl text-sm font-bold shadow-xs hover:shadow transition-all cursor-pointer"
            title="Add Planting / ដាំដំណាំថ្មី"
          >
            <motion.div
              whileHover={{ rotate: [0, -12, 12, 0] }}
              transition={{ duration: 0.3 }}
            >
              <Sprout className="w-4 h-4" />
            </motion.div>
            <span>{language === 'km' ? 'ដាំដំណាំថ្មី' : 'Add Planting'}</span>
          </motion.button>

          {/* Language Switch (Hidden on mobile, moved to Nav menu) */}
          <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-full text-sm font-bold border border-slate-200/70">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setLanguage('en')}
              className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                language === 'en'
                  ? 'bg-white text-emerald-800 shadow-xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              English
            </motion.button>
            <span className="text-slate-300 text-xs select-none">|</span>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setLanguage('km')}
              className={`px-3 py-1 rounded-full transition-all font-khmer cursor-pointer ${
                language === 'km'
                  ? 'bg-white text-emerald-800 shadow-xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ខ្មែរ
            </motion.button>
          </div>

          {/* Notifications Bell with badge and gentle wiggle animation */}
          <div className="relative" ref={notifRef}>
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              animate={unreadCount > 0 ? { rotate: [0, -8, 8, -4, 4, 0] } : {}}
              transition={{ repeat: Infinity, repeatDelay: 3.5, duration: 0.5 }}
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              aria-label="View notifications"
            >
              <Bell className="w-5.5 h-5.5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4.5 h-4.5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                  {unreadCount}
                </span>
              )}
            </motion.button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in-50 zoom-in-95">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 px-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-slate-800">{t('notifications')}</span>
                    {unreadCount > 0 && (
                      <span className="bg-red-100 text-red-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsRead}
                      className="text-[11px] font-medium text-emerald-600 hover:text-emerald-700 hover:underline"
                    >
                      {t('markAllRead')}
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 py-1">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => markNotificationAsRead(notif.id)}
                      className={`p-2.5 rounded-xl cursor-pointer transition-colors ${
                        notif.isRead ? 'opacity-70 hover:bg-slate-50' : 'bg-emerald-50/40 hover:bg-emerald-50/70'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold text-slate-900">
                          {language === 'km' ? notif.titleKm : notif.titleEn}
                        </p>
                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                        {language === 'km' ? notif.messageKm : notif.messageEn}
                      </p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {notif.timestamp}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Authenticated User Profile Menu */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-[#164e22] text-white flex items-center justify-center font-bold text-sm shadow-xs ring-2 ring-emerald-500/20 shrink-0">
                {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="hidden lg:block text-left leading-tight">
                <p className="text-xs font-bold text-slate-900 truncate max-w-[220px]">
                  {language === 'km' && currentUser?.nameKm 
                    ? currentUser.nameKm 
                    : currentUser?.name || t('farmerName')}
                  {currentUser?.nameKm && language !== 'km' && ` (${currentUser.nameKm})`}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded ${
                    currentUser?.role === 'developer'
                      ? 'bg-indigo-100 text-indigo-700'
                      : currentUser?.role === 'admin'
                        ? 'bg-blue-100 text-blue-700'
                        : currentUser?.role === 'farmer'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                  }`}>
                    {currentUser?.role || 'User'}
                  </span>
                  {language === 'km' && currentUser?.name && (
                    <span className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]">
                      {currentUser.name}
                    </span>
                  )}
                </div>
              </div>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in-50 zoom-in-95">
                {/* User Card */}
                <div className="p-2.5 border-b border-slate-100 bg-slate-50 rounded-xl mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-[#164e22] text-white flex items-center justify-center font-bold text-base shrink-0 shadow-xs">
                      {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-900 truncate">
                        {currentUser?.name}
                        {currentUser?.nameKm ? ` (${currentUser.nameKm})` : ''}
                      </p>
                      <span className={`inline-block text-[10px] font-mono font-bold uppercase px-1.5 py-0.2 rounded mt-0.5 ${
                        currentUser?.role === 'developer'
                          ? 'bg-indigo-100 text-indigo-700'
                          : currentUser?.role === 'admin'
                            ? 'bg-blue-100 text-blue-700'
                            : currentUser?.role === 'farmer'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                      }`}>
                        {currentUser?.role || 'User'}
                      </span>
                      <p className="text-[10px] text-slate-400 font-mono truncate mt-0.5">{currentUser?.email}</p>
                    </div>
                  </div>
                </div>

                {/* Quick Navigation Links */}
                <div className="space-y-1 py-1 text-xs">
                  {canView('user_management') && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('user_management');
                        setShowProfileMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left rounded-xl hover:bg-slate-50 flex items-center justify-between text-slate-700 hover:text-emerald-800 font-semibold cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>{language === 'km' ? 'គ្រប់គ្រងអ្នកប្រើប្រាស់ & សិទ្ធិ' : 'User Management & Permissions'}</span>
                      </div>
                      <ChevronDown className="w-3.5 h-3.5 -rotate-90 text-slate-400" />
                    </button>
                  )}

                  {canView('settings') && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('settings');
                        setShowProfileMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left rounded-xl hover:bg-slate-50 flex items-center justify-between text-slate-700 hover:text-emerald-800 font-semibold cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-500" />
                        <span>{language === 'km' ? 'ការកំណត់ប្រព័ន្ធ' : 'System Settings'}</span>
                      </div>
                      <ChevronDown className="w-3.5 h-3.5 -rotate-90 text-slate-400" />
                    </button>
                  )}
                </div>

                {/* Quick Switch User */}
                <div className="pt-2 mt-1 border-t border-slate-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1.5">
                    {language === 'km' ? 'ប្តូរគណនីសាកល្បងរហ័ស:' : 'Quick Switch Demo User:'}
                  </p>
                  <div className="grid grid-cols-2 gap-1">
                    {users.slice(0, 4).map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          switchUser(u.id);
                          setShowProfileMenu(false);
                        }}
                        className={`px-2 py-1.5 text-left rounded-lg text-[11px] font-bold transition-all truncate cursor-pointer ${
                          currentUser?.id === u.id
                            ? 'bg-emerald-100 text-emerald-800 font-black'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <span className="capitalize font-black">{u.role}</span>: {u.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Log Out Button */}
                <div className="pt-2 mt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setShowProfileMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left rounded-xl hover:bg-red-50 text-red-600 font-bold flex items-center justify-between text-xs transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <LogOut className="w-4 h-4" />
                      <span>{language === 'km' ? 'ចាកចេញ (Log Out)' : 'Sign Out / Log Out'}</span>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add New Crop Modal */}
      <AddNewCropModal
        isOpen={showAddCropModal}
        onClose={() => setShowAddCropModal(false)}
      />
    </header>
  );
};
