import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Filter, 
  Check, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Droplets, 
  Sprout, 
  Flower2, 
  Bug, 
  Scissors, 
  ShoppingBag,
  User,
  MapPin,
  CheckCircle2
} from 'lucide-react';
import { useI18n } from '../../locales/i18nContext';
import { useFarm } from '../../context/FarmContext';
import { FarmTask, TaskType, TaskStatus } from '../../types/melon';
import { GrowthTimeline } from '../dashboard/GrowthTimeline';

interface CropCalendarViewProps {
  onOpenTaskModal: (task?: FarmTask, date?: string) => void;
}

export const CropCalendarView: React.FC<CropCalendarViewProps> = ({ onOpenTaskModal }) => {
  const { t, language } = useI18n();
  const { tasks, plots, updateTaskStatus, currentSimulatedDate } = useFarm();

  const [activeView, setActiveView] = useState<'month' | 'week' | 'day' | 'timeline'>('month');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [selectedWorkerFilter, setSelectedWorkerFilter] = useState<string>('all');

  // Month navigation (Defaults to April 2025)
  const [currentMonth, setCurrentMonth] = useState<number>(3); // 3 = April
  const [currentYear, setCurrentYear] = useState<number>(2025);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const monthNamesEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const monthNamesKm = [
    'មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា',
    'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'
  ];

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();

  const formatDate = (day: number) => {
    const m = String(currentMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${currentYear}-${m}-${d}`;
  };

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    if (selectedTypeFilter !== 'all' && task.type !== selectedTypeFilter) return false;
    if (selectedStatusFilter !== 'all' && task.status !== selectedStatusFilter) return false;
    if (selectedWorkerFilter !== 'all' && task.assignedWorker !== selectedWorkerFilter) return false;
    return true;
  });

  const getTaskStyle = (type: TaskType) => {
    switch (type) {
      case 'watering':
        return { bg: 'bg-sky-50 text-sky-700 border-sky-200', icon: Droplets, dot: 'bg-sky-500' };
      case 'fertilizing':
        return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: Sprout, dot: 'bg-emerald-500' };
      case 'flowering_pollination':
        return { bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: Flower2, dot: 'bg-yellow-500' };
      case 'pest_check':
        return { bg: 'bg-red-50 text-red-700 border-red-200', icon: Bug, dot: 'bg-red-500' };
      case 'harvest_prep':
        return { bg: 'bg-orange-50 text-orange-700 border-orange-200', icon: Scissors, dot: 'bg-orange-500' };
      case 'harvest':
        return { bg: 'bg-yellow-50 text-yellow-800 border-yellow-200', icon: ShoppingBag, dot: 'bg-amber-500' };
      default:
        return { bg: 'bg-slate-50 text-slate-700 border-slate-200', icon: Sprout, dot: 'bg-slate-500' };
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header & View Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-slate-900">
            Crop Calendar / <span className="font-khmer text-emerald-700">ប្រតិទិនដាំដុះ</span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {language === 'km' 
              ? 'កាលវិភាគការងារស្រោចទឹក ដាក់ជី បង្កាត់ផ្កា និងប្រមូលផលតាមរងដាំ' 
              : 'Interactive schedule for irrigation, fertigation, pollination, pest scouts, and harvests'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Switcher */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-semibold">
            {(['month', 'week', 'day', 'timeline'] as const).map((view) => (
              <button
                key={view}
                onClick={() => setActiveView(view)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                  activeView === view
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t(view as any)}
              </button>
            ))}
          </div>

          <button
            onClick={() => onOpenTaskModal(undefined, currentSimulatedDate)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#164e22] hover:bg-[#123e1b] text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addTask')}</span>
          </button>
        </div>
      </div>

      {/* Melon Crop Calendar Lifecycle Pipeline */}
      <GrowthTimeline showHeader={false} />

      {/* Filters Bar */}
      <div className="bg-white p-3.5 rounded-2xl shadow-xs border border-slate-200/80 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mr-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>{language === 'km' ? 'ចម្រោះ' : 'Filters'}:</span>
          </div>

          {/* Task Type Filter */}
          <select
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value)}
            className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 outline-none"
          >
            <option value="all">All Task Types (គ្រប់ប្រភេទ)</option>
            <option value="watering">Watering & Drip (ស្រោចទឹក)</option>
            <option value="fertilizing">Fertilizing (ដាក់ជី)</option>
            <option value="flowering_pollination">Flowering & Pollination (ចេញផ្កា&បង្កាត់)</option>
            <option value="pest_check">Pest Inspection (ពិនិត្យសត្វល្អិត)</option>
            <option value="harvest_prep">Harvest Prep (រៀបចំប្រមូលផល)</option>
            <option value="harvest">Harvest (ប្រមូលផល)</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 outline-none"
          >
            <option value="all">All Statuses (គ្រប់ស្ថានភាព)</option>
            <option value="pending">Pending (រង់ចាំ)</option>
            <option value="in_progress">In Progress (កំពុងដំណើរការ)</option>
            <option value="completed">Completed (បានបញ្ចប់)</option>
            <option value="skipped">Skipped (រំលង)</option>
          </select>

          {/* Reset Filters */}
          {(selectedTypeFilter !== 'all' || selectedStatusFilter !== 'all') && (
            <button
              onClick={() => {
                setSelectedTypeFilter('all');
                setSelectedStatusFilter('all');
              }}
              className="text-xs text-emerald-700 hover:underline px-2 py-1 font-semibold"
            >
              Reset
            </button>
          )}
        </div>

        {/* Date Navigator */}
        <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
          <button
            onClick={prevMonth}
            className="p-1.5 hover:bg-slate-100 text-slate-600"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-3 py-1 text-xs font-bold text-slate-800 font-mono">
            {language === 'km' ? monthNamesKm[currentMonth] : monthNamesEn[currentMonth]} {currentYear}
          </span>
          <button
            onClick={nextMonth}
            className="p-1.5 hover:bg-slate-100 text-slate-600"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main View Display: Month Grid or Timeline View */}
      {activeView === 'timeline' ? (
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80">
          <h3 className="text-sm font-bold text-slate-800 mb-4">
            Crop-Cycle Chronological Timeline / <span className="font-khmer text-slate-500">កាលប្បវត្តិការងារតាមថ្ងៃ</span>
          </h3>
          <div className="relative pl-6 border-l-2 border-slate-200 space-y-6">
            {filteredTasks
              .sort((a, b) => a.date.localeCompare(b.date))
              .map((task) => {
                const style = getTaskStyle(task.type);
                const Icon = style.icon;
                const plot = plots.find((p) => p.id === task.plotId);
                const isCompleted = task.status === 'completed';

                return (
                  <div key={task.id} className="relative group">
                    {/* Node marker */}
                    <div className={`
                      absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 border-white ring-2 transition-all
                      ${isCompleted ? 'bg-emerald-600 ring-emerald-500' : 'bg-slate-400 ring-slate-300'}
                    `} />

                    <div 
                      onClick={() => onOpenTaskModal(task)}
                      className="p-4 rounded-xl border border-slate-200 hover:border-emerald-300 bg-white hover:bg-slate-50/50 shadow-2xs transition-all cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-2 rounded-lg border ${style.bg}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                              {language === 'km' ? task.titleKm : task.titleEn}
                            </h4>
                            <p className="text-[11px] text-slate-500 font-khmer">
                              {language === 'km' ? task.titleEn : task.titleKm}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-mono font-bold text-slate-800 block">
                            {task.date} · {task.time || '07:00'}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                            isCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {task.status}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 flex-wrap gap-2">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1 text-[11px]">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {plot?.name}
                          </span>
                          <span className="flex items-center gap-1 text-[11px]">
                            <User className="w-3 h-3 text-slate-400" />
                            {task.assignedWorker}
                          </span>
                          {task.dosageOrVolume && (
                            <span className="text-[11px] text-slate-600 font-medium">
                              Qty: {task.dosageOrVolume}
                            </span>
                          )}
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateTaskStatus(task.id, isCompleted ? 'pending' : 'completed');
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                            isCompleted 
                              ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' 
                              : 'bg-emerald-600 text-white hover:bg-emerald-700'
                          }`}
                        >
                          <Check className="w-3 h-3" />
                          <span>{isCompleted ? 'Mark Pending' : 'Complete Task'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      ) : (
        /* Standard Month View */
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80">
          <div className="grid grid-cols-7 gap-1 border-b border-slate-200 pb-2 mb-2 text-center text-xs font-bold text-slate-600">
            <span>Sun (អាទិត្យ)</span>
            <span>Mon (ច័ន្ទ)</span>
            <span>Tue (អង្គារ)</span>
            <span>Wed (ពុធ)</span>
            <span>Thu (ព្រហស្បតិ៍)</span>
            <span>Fri (សុក្រ)</span>
            <span>Sat (សៅរ៍)</span>
          </div>

          <div className="grid grid-cols-7 gap-1 min-h-[500px]">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-slate-50/40 rounded-xl p-1 min-h-[90px]" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = formatDate(day);
              const isToday = dateStr === currentSimulatedDate;
              const dayTasks = filteredTasks.filter((t) => t.date === dateStr);

              return (
                <div
                  key={dateStr}
                  onClick={() => onOpenTaskModal(undefined, dateStr)}
                  className={`
                    group bg-white hover:bg-slate-50 rounded-xl p-2 min-h-[90px] border transition-all cursor-pointer flex flex-col justify-between
                    ${isToday ? 'border-emerald-500 ring-1 ring-emerald-500/20 bg-emerald-50/10' : 'border-slate-100 hover:border-slate-300'}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      isToday ? 'bg-red-500 text-white shadow-xs' : 'text-slate-700'
                    }`}>
                      {day}
                    </span>
                    <span className="text-[10px] text-slate-300 opacity-0 group-hover:opacity-100 text-emerald-600 font-bold">
                      + Add
                    </span>
                  </div>

                  <div className="mt-1 space-y-1 overflow-y-auto max-h-[70px] scrollbar-none">
                    {dayTasks.map((t) => {
                      const style = getTaskStyle(t.type);
                      const Icon = style.icon;
                      const isCompleted = t.status === 'completed';

                      return (
                        <div
                          key={t.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenTaskModal(t);
                          }}
                          className={`
                            px-1.5 py-1 rounded-lg border text-[10px] font-semibold flex items-center gap-1 truncate
                            ${style.bg} ${isCompleted ? 'opacity-65 line-through' : ''}
                          `}
                        >
                          <Icon className="w-3 h-3 shrink-0" />
                          <span className="truncate">
                            {language === 'km' ? t.titleKm : t.titleEn}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
