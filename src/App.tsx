import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MapSettingsProvider, useMapSettings } from './context/MapSettingsContext';
import { I18nProvider, useI18n } from './locales/i18nContext';
import { FarmProvider, useFarm } from './context/FarmContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/layout/Sidebar';
import { TopNav } from './components/layout/TopNav';
import { LoginFormView } from './components/auth/LoginFormView';
import { UsersManagementView } from './components/users/UsersManagementView';
import { DashboardView } from './components/dashboard/DashboardView';
import { FarmManagementView } from './components/farm/FarmManagementView';
import { CropManagementView } from './components/crop/CropManagementView';
import { PlantingPlanView } from './components/planting/PlantingPlanView';
import { CropCalendarView } from './components/calendar/CropCalendarView';
import { FieldMapView } from './components/field/FieldMapView';
import { TasksView } from './components/tasks/TasksView';
import { CropMonitoringView } from './components/monitoring/CropMonitoringView';
import { HarvestYieldView } from './components/harvest/HarvestYieldView';
import { FarmRecordsView } from './components/records/FarmRecordsView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { SettingsView } from './components/settings/SettingsView';
import { StockView } from './components/stock/StockView';
import { ItemManagementView } from './components/items/ItemManagementView';
import { PurchaseStockView } from './components/stock/PurchaseStockView';
import { SalesView } from './components/sales/SalesView';
import { FarmersView } from './components/crm/FarmersView';
import { CustomersView } from './components/crm/CustomersView';
import { SuppliersView } from './components/crm/SuppliersView';
import { AccountsView } from './components/finance/AccountsView';
import { ProjectInvoiceA4View } from './components/invoice/ProjectInvoiceA4View';
import { TaskModal } from './components/dashboard/TaskModal';
import { FarmTask } from './types/melon';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Plus, 
  CheckSquare, 
  MapPin,
  Lock,
  ShieldAlert
} from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { language } = useI18n();
  const { activeTab, setActiveTab } = useFarm();
  const { isAuthenticated, canView, currentUser } = useAuth();
  const { projectName, footTag } = useMapSettings();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<FarmTask | null>(null);
  const [targetDateForNewTask, setTargetDateForNewTask] = useState<string | undefined>(undefined);

  // If user is not logged in, render the login page with greenhouse background
  if (!isAuthenticated) {
    return <LoginFormView />;
  }

  const handleOpenTaskModal = (task?: FarmTask, dateStr?: string) => {
    setEditingTask(task || null);
    setTargetDateForNewTask(dateStr);
    setTaskModalOpen(true);
  };

  const handleCloseTaskModal = () => {
    setTaskModalOpen(false);
    setEditingTask(null);
    setTargetDateForNewTask(undefined);
  };

  return (
    <div className={`min-h-screen bg-[#F8FAF7] text-slate-800 flex flex-col md:flex-row antialiased ${language === 'km' ? 'font-khmer' : ''}`}>
      {/* Left Sidebar */}
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-6">
        {/* Top Bar */}
        <TopNav onOpenMobileMenu={() => setMobileMenuOpen(true)} />

        {/* Viewport Content */}
        <main className="flex-1 px-3.5 sm:px-5 lg:px-6 py-5 w-full animate-in fade-in-50">
          {/* Permission-based access gate for currently selected tab */}
          {!canView(activeTab) ? (
            <div className="max-w-md mx-auto my-12 bg-white rounded-3xl border border-amber-200/80 p-6 sm:p-8 text-center shadow-xl shadow-amber-900/5 animate-in fade-in-50 zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-4 ring-8 ring-amber-50/50">
                <Lock className="w-8 h-8" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
                {language === 'km' ? 'គ្មានសិទ្ធិចូលមើលមុខងារនេះទេ' : 'Access Restricted'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed">
                {language === 'km'
                  ? `គណនីរបស់អ្នកមានតួនាទី (${currentUser?.role}) មិនត្រូវបានអនុញ្ញាតឱ្យមើលមុខងារនេះឡើយ។ សូមទាក់ទង Admin ឬ Developer ប្រសិនបើអ្នកត្រូវការចូលប្រើ។`
                  : `Your current role (${currentUser?.role}) does not have permission to access this module. Please contact an Administrator or Developer.`}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('dashboard')}
                  className="w-full sm:w-auto px-5 py-2.5 bg-[#164e22] hover:bg-[#123e1b] text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all cursor-pointer"
                >
                  {language === 'km' ? 'ត្រឡប់ទៅផ្ទាំងគ្រប់គ្រង' : 'Return to Dashboard'}
                </button>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardView
                  onSelectTask={(task) => handleOpenTaskModal(task)}
                  onAddTaskOnDate={(dateStr) => handleOpenTaskModal(undefined, dateStr)}
                />
              )}

              {activeTab === 'farm_management' && <FarmManagementView />}

              {activeTab === 'crop_management' && <CropManagementView />}

              {activeTab === 'planting' && <PlantingPlanView />}

              {activeTab === 'calendar' && (
                <CropCalendarView
                  onOpenTaskModal={(task, date) => handleOpenTaskModal(task, date)}
                />
              )}

              {activeTab === 'field' && <FieldMapView />}

              {activeTab === 'tasks' && (
                <TasksView onOpenTaskModal={(task) => handleOpenTaskModal(task)} />
              )}

              {activeTab === 'monitoring' && <CropMonitoringView />}

              {activeTab === 'harvest' && <HarvestYieldView />}

              {/* ERP & Commercial Views */}
              {activeTab === 'item_management' && <ItemManagementView />}

              {activeTab === 'stock' && <StockView />}

              {activeTab === 'purchase_stock' && <PurchaseStockView />}

              {activeTab === 'sale' && <SalesView />}

              {activeTab === 'farmer' && <FarmersView />}

              {activeTab === 'customer' && <CustomersView />}

              {activeTab === 'supplier' && <SuppliersView />}

              {activeTab === 'account' && <AccountsView />}

              {activeTab === 'records' && <FarmRecordsView />}

              {activeTab === 'project_invoice' && <ProjectInvoiceA4View />}

              {activeTab === 'analytics' && <AnalyticsView />}

              {activeTab === 'settings' && <SettingsView />}

              {/* User Management & Dynamic Roles Matrix */}
              {activeTab === 'user_management' && <UsersManagementView />}
            </>
          )}
        </main>

        {/* Foot Tag Footer */}
        <footer className="mt-auto px-3.5 sm:px-5 lg:px-6 pt-6 pb-4 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
          <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
            <span className="font-bold text-emerald-800">{projectName}</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 font-khmer">{footTag}</span>
          </div>
          <p className="text-[10px] text-slate-400">
            {language === 'km' ? 'ប្រព័ន្ធគ្រប់គ្រងចំការឆ្លាតវៃ' : 'Precision Ag & Crop Lifecycle OS'}
          </p>
        </footer>
      </div>

      {/* Task Creation & Editing Modal */}
      <TaskModal
        isOpen={taskModalOpen}
        onClose={handleCloseTaskModal}
        taskToEdit={editingTask}
        initialDate={targetDateForNewTask}
      />

      {/* Mobile Bottom Navigation Bar */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 py-2 px-4 flex items-center justify-around z-40 md:hidden shadow-lg">
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-1 p-1 text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'dashboard' ? 'text-emerald-800' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>{language === 'km' ? 'ផ្ទាំងគ្រប់គ្រង' : 'Dashboard'}</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => setActiveTab('calendar')}
          className={`flex flex-col items-center gap-1 p-1 text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'calendar' ? 'text-emerald-800' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <CalendarDays className="w-5 h-5" />
          <span>{language === 'km' ? 'ប្រតិទិន' : 'Calendar'}</span>
        </motion.button>

        {/* Central Add Task Button */}
        <motion.button
          whileHover={{ scale: 1.15, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          onClick={() => handleOpenTaskModal()}
          className="w-12 h-12 -mt-5 rounded-full bg-[#164e22] text-white flex items-center justify-center shadow-lg hover:bg-[#123e1b] ring-4 ring-[#F8FAF7] cursor-pointer"
          aria-label="Add Task"
        >
          <Plus className="w-6 h-6" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => setActiveTab('field')}
          className={`flex flex-col items-center gap-1 p-1 text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'field' ? 'text-emerald-800' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <MapPin className="w-5 h-5" />
          <span>{language === 'km' ? 'ផែនទី' : 'Field'}</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => setActiveTab('tasks')}
          className={`flex flex-col items-center gap-1 p-1 text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'tasks' ? 'text-emerald-800' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <CheckSquare className="w-5 h-5" />
          <span>{language === 'km' ? 'កិច្ចការ' : 'Tasks'}</span>
        </motion.button>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <MapSettingsProvider>
      <I18nProvider>
        <AuthProvider>
          <FarmProvider>
            <MainAppContent />
          </FarmProvider>
        </AuthProvider>
      </I18nProvider>
    </MapSettingsProvider>
  );
}
