import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Droplets, 
  Sprout, 
  Flower2, 
  Bug, 
  Scissors, 
  ShoppingBag, 
  Check, 
  Clock,
  Calendar as CalendarIcon
} from 'lucide-react';
import { useI18n } from '../../locales/i18nContext';
import { useFarm } from '../../context/FarmContext';
import { FarmTask, TaskType } from '../../types/melon';

interface DashboardCalendarProps {
  onSelectTask: (task: FarmTask) => void;
  onAddTaskOnDate: (dateStr: string) => void;
}

export const DashboardCalendar: React.FC<DashboardCalendarProps> = ({
  onSelectTask,
  onAddTaskOnDate,
}) => {
  const { language, t } = useI18n();
  const { filteredTasks } = useFarm();

  const getTodayDateString = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const todayStr = getTodayDateString();
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState<number>(() => now.getMonth());
  const [currentYear, setCurrentYear] = useState<number>(() => now.getFullYear());
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day'>('month');

  // Month navigation
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

  const goToToday = () => {
    const d = new Date();
    setCurrentMonth(d.getMonth());
    setCurrentYear(d.getFullYear());
  };

  const monthNamesEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const monthNamesKm = [
    'មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា',
    'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'
  ];

  const daysOfWeek = [
    { key: 'sun', en: 'Sun', km: 'អាទិត្យ', isWeekend: true },
    { key: 'mon', en: 'Mon', km: 'ច័ន្ទ', isWeekend: false },
    { key: 'tue', en: 'Tue', km: 'អង្គារ', isWeekend: false },
    { key: 'wed', en: 'Wed', km: 'ពុធ', isWeekend: false },
    { key: 'thu', en: 'Thu', km: 'ព្រហស្បតិ៍', isWeekend: false },
    { key: 'fri', en: 'Fri', km: 'សុក្រ', isWeekend: false },
    { key: 'sat', en: 'Sat', km: 'សៅរ៍', isWeekend: false },
  ];

  // Generate days for April 2025
  // April 1, 2025 is a Tuesday (day index 2)
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  // Helper to format date string YYYY-MM-DD
  const formatDateString = (day: number) => {
    const m = String(currentMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${currentYear}-${m}-${d}`;
  };

  // Task type styling matching reference screenshot
  const getTaskStyle = (type: TaskType) => {
    switch (type) {
      case 'watering':
        return {
          bg: 'bg-[#E1F0FA] text-[#0284C7] border-[#BAE6FD]',
          icon: Droplets,
          dot: 'bg-sky-500',
        };
      case 'fertilizing':
        return {
          bg: 'bg-[#DCFCE7] text-[#16A34A] border-[#BBF7D0]',
          icon: Sprout,
          dot: 'bg-emerald-500',
        };
      case 'flowering_pollination':
        return {
          bg: 'bg-[#FEF9C3] text-[#CA8A04] border-[#FEF08A]',
          icon: Flower2,
          dot: 'bg-yellow-500',
        };
      case 'pest_check':
        return {
          bg: 'bg-[#FEE2E2] text-[#DC2626] border-[#FECACA]',
          icon: Bug,
          dot: 'bg-red-500',
        };
      case 'harvest_prep':
        return {
          bg: 'bg-[#FFEDD5] text-[#EA580C] border-[#FED7AA]',
          icon: Scissors,
          dot: 'bg-orange-500',
        };
      case 'harvest':
        return {
          bg: 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]',
          icon: ShoppingBag,
          dot: 'bg-amber-500',
        };
      case 'vine_maintenance':
      default:
        return {
          bg: 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]',
          icon: Sprout,
          dot: 'bg-teal-500',
        };
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 flex flex-col justify-between">
      {/* Top Controls: < Month Year > and View Selector */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2.5">
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50 shadow-2xs">
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={prevMonth}
              className="p-2 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </motion.button>
            <span className="px-3.5 py-1 text-base sm:text-lg font-black text-slate-900 select-none">
              {language === 'km' ? monthNamesKm[currentMonth] : monthNamesEn[currentMonth]} {currentYear}
            </span>
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={nextMonth}
              className="p-2 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={goToToday}
            className="px-3 py-1.5 text-xs sm:text-sm font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="Jump to current date / ទៅកាន់ថ្ងៃនេះ"
          >
            <CalendarIcon className="w-4 h-4 text-emerald-600" />
            <span>{language === 'km' ? 'ថ្ងៃនេះ' : 'Today'}</span>
          </motion.button>
        </div>

        {/* View Switcher: Month / Week / Day */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs sm:text-sm font-bold">
            {(['month', 'week', 'day'] as const).map((view) => (
              <motion.button
                key={view}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setCalendarView(view)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all cursor-pointer ${
                  calendarView === view
                    ? 'bg-white text-slate-900 shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900 font-semibold'
                }`}
              >
                {t(view as any)}
              </motion.button>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onAddTaskOnDate(todayStr)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#164e22] hover:bg-[#123e1b] text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t('addTask')}</span>
          </motion.button>
        </div>
      </div>

      {/* Weekday Table Headers */}
      <div className="grid grid-cols-7 gap-1 border-b border-slate-200/80 pb-2 mb-1 text-center">
        {daysOfWeek.map((d) => (
          <div key={d.key} className="py-1">
            <span className={`text-xs sm:text-sm font-black block ${d.isWeekend ? 'text-red-500' : 'text-slate-800'}`}>
              {language === 'km' ? d.km : d.en}
            </span>
            <span className="text-xs text-slate-400 font-khmer font-medium">
              {language === 'km' ? d.en : d.km}
            </span>
          </div>
        ))}
      </div>

      {/* Calendar Grid for Month View */}
      <div className="grid grid-cols-7 gap-1 flex-1 min-h-[380px]">
        {/* Leading empty cells */}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="bg-slate-50/30 rounded-xl p-1 min-h-[70px] border border-transparent" />
        ))}

        {/* Days of month */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = formatDateString(day);
          const isToday = dateStr === todayStr;
          const dayTasks = filteredTasks.filter((t) => t.date === dateStr);

          return (
            <div
              key={dateStr}
              onClick={() => onAddTaskOnDate(dateStr)}
              className={`
                group relative bg-white hover:bg-slate-50/80 rounded-xl p-1.5 min-h-[74px] 
                border transition-all flex flex-col justify-between cursor-pointer
                ${isToday 
                  ? 'border-emerald-500/60 ring-1 ring-emerald-500/30 bg-emerald-50/10' 
                  : 'border-slate-100 hover:border-slate-300'
                }
              `}
            >
              {/* Day Number Header */}
              <div className="flex items-center justify-between">
                <span
                  className={`
                    w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs sm:text-sm font-black
                    ${isToday 
                      ? 'bg-red-500 text-white shadow-xs' 
                      : 'text-slate-800 group-hover:text-slate-900'
                    }
                  `}
                >
                  {day}
                </span>

                <span className="text-xs text-slate-400 group-hover:text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                  +
                </span>
              </div>

              {/* Tasks Chips inside this day */}
              <div className="mt-1 space-y-1 overflow-y-auto max-h-[62px] scrollbar-none">
                {dayTasks.map((task) => {
                  const style = getTaskStyle(task.type);
                  const Icon = style.icon;
                  const isCompleted = task.status === 'completed';

                  return (
                    <motion.div
                      key={task.id}
                      whileHover={{ scale: 1.04, y: -1 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTask(task);
                      }}
                      className={`
                        px-2 py-0.5 rounded-lg border text-xs font-bold leading-tight
                        flex items-center gap-1 cursor-pointer transition-transform
                        ${style.bg} ${isCompleted ? 'opacity-70' : ''}
                      `}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">
                        {language === 'km' ? task.titleKm : task.titleEn}
                      </span>
                      {isCompleted && <Check className="w-3 h-3 ml-auto text-emerald-600 shrink-0" />}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Task Type Legend matching reference screenshot */}
      <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2 text-xs sm:text-sm font-medium">
        <div className="flex items-center gap-4 sm:gap-5 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-sky-500" />
            <span className="text-slate-700 font-semibold">
              {language === 'km' ? 'ស្រោចទឹក' : 'Watering'} / <span className="text-slate-500 font-khmer">{language === 'km' ? 'Watering' : 'ស្រោចទឹក'}</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-slate-700 font-semibold">
              {language === 'km' ? 'ដាក់ជី' : 'Fertilizing'} / <span className="text-slate-500 font-khmer">{language === 'km' ? 'Fertilizing' : 'ដាក់ជី'}</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-slate-700 font-semibold">
              {language === 'km' ? 'ចេញផ្កា' : 'Flowering'} / <span className="text-slate-500 font-khmer">{language === 'km' ? 'Flowering' : 'ចេញផ្កា'}</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-slate-700 font-semibold">
              {language === 'km' ? 'ត្រួតពិនិត្យសត្វល្អិត' : 'Pest Check'} / <span className="text-slate-500 font-khmer">{language === 'km' ? 'Pest Check' : 'ត្រួតពិនិត្យសត្វល្អិត'}</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-slate-700 font-semibold">
              {language === 'km' ? 'ប្រមូលផល' : 'Harvest'} / <span className="text-slate-400 font-khmer">{language === 'km' ? 'Harvest' : 'ប្រមូលផល'}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
