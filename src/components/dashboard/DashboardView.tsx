import React from 'react';
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
  const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
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

