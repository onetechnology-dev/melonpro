import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ArrowRight,
  Droplets,
  Sprout,
  Flower2,
  Bug,
  Scissors,
  ShoppingBag,
  Calendar as CalendarIcon
} from 'lucide-react';
import { useI18n } from '../../locales/i18nContext';
import { useFarm } from '../../context/FarmContext';

interface CropCalendarCardProps {
  onOpenCalendarTab?: () => void;
}

export const CropCalendarCard: React.FC<CropCalendarCardProps> = ({ onOpenCalendarTab }) => {
  const { language } = useI18n();
  const { setActiveTab } = useFarm();

  const [selectedDay, setSelectedDay] = useState<number>(5);

  const daysOfWeek = ['អា', 'ច', 'អ', 'ព', 'ព្រ', 'សុ', 'ស'];

  // Calendar dates for October 2026:
  // Starts on Thursday (Oct 1 = Thursday, index 4)
  // Previous month dates: 27, 28, 29, 30
  // Month dates: 1 to 31
  const calendarCells = [
    { day: 27, isCurrentMonth: false, hasEvent: false },
    { day: 28, isCurrentMonth: false, hasEvent: false },
    { day: 29, isCurrentMonth: false, hasEvent: false },
    { day: 30, isCurrentMonth: false, hasEvent: false },
    { day: 1, isCurrentMonth: true, hasEvent: true },
    { day: 2, isCurrentMonth: true, hasEvent: false },
    { day: 3, isCurrentMonth: true, hasEvent: true },

    { day: 4, isCurrentMonth: true, hasEvent: false },
    { day: 5, isCurrentMonth: true, hasEvent: true, isSelected: true },
    { day: 6, isCurrentMonth: true, hasEvent: false },
    { day: 7, isCurrentMonth: true, hasEvent: false },
    { day: 8, isCurrentMonth: true, hasEvent: true },
    { day: 9, isCurrentMonth: true, hasEvent: false },
    { day: 10, isCurrentMonth: true, hasEvent: false },

    { day: 11, isCurrentMonth: true, hasEvent: false },
    { day: 12, isCurrentMonth: true, hasEvent: true },
    { day: 13, isCurrentMonth: true, hasEvent: false },
    { day: 14, isCurrentMonth: true, hasEvent: false },
    { day: 15, isCurrentMonth: true, hasEvent: true },
    { day: 16, isCurrentMonth: true, hasEvent: false },
    { day: 17, isCurrentMonth: true, hasEvent: false },

    { day: 18, isCurrentMonth: true, hasEvent: false },
    { day: 19, isCurrentMonth: true, hasEvent: true },
    { day: 20, isCurrentMonth: true, hasEvent: false },
    { day: 21, isCurrentMonth: true, hasEvent: false },
    { day: 22, isCurrentMonth: true, hasEvent: true },
    { day: 23, isCurrentMonth: true, hasEvent: false },
    { day: 24, isCurrentMonth: true, hasEvent: false },

    { day: 25, isCurrentMonth: true, hasEvent: false },
    { day: 26, isCurrentMonth: true, hasEvent: false },
    { day: 27, isCurrentMonth: true, hasEvent: true },
    { day: 28, isCurrentMonth: true, hasEvent: false },
    { day: 29, isCurrentMonth: true, hasEvent: false },
    { day: 30, isCurrentMonth: true, hasEvent: true },
    { day: 31, isCurrentMonth: true, hasEvent: false },
  ];

  const upcomingEvents = [
    { title: 'ស្រោចទឹក', count: '1 កិច្ចការ', date: 'Oct 1', icon: Droplets, color: 'text-sky-500' },
    { title: 'ដាក់ជី', count: '1 កិច្ចការ', date: 'Oct 3', icon: Sprout, color: 'text-emerald-600' },
    { title: 'បង្កាត់ផ្កា', count: '2 កិច្ចការ', date: 'Oct 12', icon: Flower2, color: 'text-amber-500' },
    { title: 'ពិនិត្យសត្វល្អិត', count: '1 កិច្ចការ', date: 'Oct 5', icon: Bug, color: 'text-red-500' },
    { title: 'ត្រៀមប្រមូលផល', count: '1 កិច្ចការ', date: 'Oct 27', icon: Scissors, color: 'text-purple-500' },
    { title: 'ប្រមូលផល', count: '1 កិច្ចការ', date: 'Oct 30', icon: ShoppingBag, color: 'text-amber-600' },
    { title: 'កាត់ទងដើម', count: '2 កិច្ចការ', date: 'Oct 19', icon: Scissors, color: 'text-emerald-700' },
    { title: 'ថែទាំដើម', count: '2 កិច្ចការ', date: 'Oct 8', icon: Sprout, color: 'text-emerald-500' },
  ];

  return (
    <div className="bg-white rounded-2xl p-5 shadow-2xs border border-slate-200/90 flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
        <h3 className="font-bold text-sm text-slate-900">
          Crop Calendar / <span className="font-khmer text-slate-600 font-semibold">ប្រតិទិនដំណាំ</span>
        </h3>
        <button
          onClick={() => {
            if (onOpenCalendarTab) onOpenCalendarTab();
            else setActiveTab('calendar');
          }}
          className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 font-khmer transition-colors cursor-pointer"
        >
          <span>មើលប្រតិទិន</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Two Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
        {/* Left: Mini Calendar (~55%) */}
        <div className="md:col-span-6 lg:col-span-7 pr-0 md:pr-3 border-b md:border-b-0 md:border-r border-slate-100 pb-3 md:pb-0">
          {/* Month Navigator */}
          <div className="flex items-center justify-between mb-3 px-1">
            <button className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-xs text-slate-800">
              October 2026
            </span>
            <button className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday Headers in Khmer */}
          <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-400 font-khmer mb-1.5">
            {daysOfWeek.map((d, i) => (
              <span key={i} className="py-0.5">{d}</span>
            ))}
          </div>

          {/* Calendar Day Grid */}
          <div className="grid grid-cols-7 text-center text-xs gap-y-1">
            {calendarCells.map((cell, idx) => {
              const isSelected = selectedDay === cell.day && cell.isCurrentMonth;
              return (
                <div 
                  key={idx} 
                  onClick={() => cell.isCurrentMonth && setSelectedDay(cell.day)}
                  className="flex flex-col items-center justify-center p-0.5 cursor-pointer"
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                    isSelected 
                      ? 'bg-[#164e22] text-white shadow-xs font-bold' 
                      : cell.isCurrentMonth 
                      ? 'text-slate-800 hover:bg-slate-100' 
                      : 'text-slate-300'
                  }`}>
                    {cell.day}
                  </span>
                  {/* Event indicator dot */}
                  {cell.hasEvent && (
                    <span className={`w-1 h-1 rounded-full mt-0.5 ${
                      isSelected ? 'bg-amber-400' : 'bg-emerald-500'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Milestone Tasks List (~45%) */}
        <div className="md:col-span-6 lg:col-span-5 space-y-1.5 max-h-[220px] overflow-y-auto scrollbar-none pr-1">
          {upcomingEvents.map((evt, idx) => {
            const Icon = evt.icon;
            return (
              <div 
                key={idx} 
                className="flex items-center justify-between p-1.5 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className={`p-1 rounded-lg bg-slate-50 ${evt.color}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 font-khmer leading-none">{evt.title}</p>
                    <p className="text-[10px] text-slate-400 font-khmer mt-0.5">{evt.count}</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-medium text-slate-500">
                  {evt.date}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
