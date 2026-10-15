import React from 'react';
import { Search, X } from 'lucide-react';
import { useFarm } from '../../context/FarmContext';
import { useI18n } from '../../locales/i18nContext';
import { GrowthTimeline } from './GrowthTimeline';
import { DashboardCalendar } from './DashboardCalendar';
import { WeatherCard } from './WeatherCard';
import { FieldMapCard } from './FieldMapCard';
import { StatusGridCards } from './StatusGridCards';
import { TodayTasksCard } from './TodayTasksCard';
import { YieldAndAICards } from './YieldAndAICards';
import { FarmTask } from '../../types/melon';

interface DashboardViewProps {
  onSelectTask: (task: FarmTask) => void;
  onAddTaskOnDate: (dateStr: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onSelectTask,
  onAddTaskOnDate,
}) => {
  const { searchQuery, setSearchQuery } = useFarm();
  const { t } = useI18n();

  const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Mobile Search Input - positioned directly above Dashboard */}
      <div className="md:hidden">
        <div className="relative w-full">
          <Search className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full pl-10 pr-9 py-2.5 bg-white text-sm font-medium text-slate-900 rounded-2xl border border-slate-200/90 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 shadow-xs placeholder:text-slate-400 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 1. Growth Timeline at top */}
      <GrowthTimeline />

      {/* 2. Key Farm Status Cards (Full width 5-column responsive grid) */}
      <StatusGridCards />

      {/* 3. Operational Section: Crop Calendar on left, Controls & Telemetry on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Interactive Crop Calendar (~58% on desktop) */}
        <div className="lg:col-span-7 flex flex-col h-full">
          <DashboardCalendar
            onSelectTask={onSelectTask}
            onAddTaskOnDate={onAddTaskOnDate}
          />
        </div>

        {/* Right Column: Today's Tasks, Weather, and Field Map (~42% on desktop) */}
        <div className="lg:col-span-5 space-y-4">
          <TodayTasksCard 
            onAddTask={() => onAddTaskOnDate(getTodayStr())}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <WeatherCard />
            <FieldMapCard />
          </div>
        </div>
      </div>

      {/* 4. Bottom Row: Yield Forecast & AI Recommendations */}
      <YieldAndAICards />
    </div>
  );
};

