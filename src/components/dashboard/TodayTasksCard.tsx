import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Plus, CheckSquare, Square, CheckCircle2 } from 'lucide-react';
import { useI18n } from '../../locales/i18nContext';
import { useFarm } from '../../context/FarmContext';

interface TodayTasksCardProps {
  onAddTask?: () => void;
  onViewAllTasks?: () => void;
}

export const TodayTasksCard: React.FC<TodayTasksCardProps> = ({ onAddTask, onViewAllTasks }) => {
  const { language } = useI18n();
  const { setActiveTab, tasks, updateTaskStatus, currentPlot, selectedPlotId, cropCycles } = useFarm();
  const [localChecked, setLocalChecked] = useState(false);

  const isAllPlots = selectedPlotId === 'all';
  const relevantCycles = useMemo(() => {
    if (isAllPlots) return cropCycles;
    if (!currentPlot) return [];
    return cropCycles.filter((c) => c.plotId === currentPlot.id);
  }, [isAllPlots, cropCycles, currentPlot]);

  const activeCycles = useMemo(() => relevantCycles.filter((c) => c.status === 'active'), [relevantCycles]);
  const hasActiveCrop = activeCycles.length > 0;
  const isCropCompleted = !hasActiveCrop && relevantCycles.length > 0 && relevantCycles.every((c) => c.status === 'completed');

  // Relevant tasks filtered specifically for the current plot / planted crop
  const relevantTasks = useMemo(() => {
    if (!hasActiveCrop) {
      return [];
    }
    if (!isAllPlots && currentPlot) {
      return tasks.filter((t) => t.plotId === currentPlot.id);
    }
    const activePlotIds = new Set(activeCycles.map((c) => c.plotId));
    return tasks.filter((t) => activePlotIds.has(t.plotId));
  }, [hasActiveCrop, isAllPlots, currentPlot, tasks, activeCycles]);

  // Today's date YYYY-MM-DD
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  // Priority order:
  // 1. Pending task scheduled for today
  // 2. Any task scheduled for today
  // 3. Next pending task for the planted crop
  // 4. Fallback to first relevant task
  const todayPendingTask = relevantTasks.find((t) => t.date === todayStr && t.status !== 'completed');
  const todayTask = relevantTasks.find((t) => t.date === todayStr);
  const nextPendingTask = relevantTasks.find((t) => t.status !== 'completed');
  const primaryTask = hasActiveCrop 
    ? (todayPendingTask || todayTask || nextPendingTask || relevantTasks[0] || null)
    : null;

  const isCompleted = primaryTask ? primaryTask.status === 'completed' : localChecked;

  const handleToggle = () => {
    if (primaryTask) {
      updateTaskStatus(primaryTask.id, primaryTask.status === 'completed' ? 'pending' : 'completed');
    } else {
      setLocalChecked(!localChecked);
    }
  };

  const completedCount = relevantTasks.filter((t) => t.status === 'completed').length;
  const totalCount = relevantTasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-2xs border border-slate-200/90 flex flex-col justify-between h-full hover:shadow-xs transition-shadow">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
          <h3 className="font-extrabold text-base text-slate-900">
            Today's Tasks / <span className="font-khmer text-slate-600 font-bold">ការងារប្រចាំថ្ងៃ</span>
          </h3>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (onViewAllTasks) onViewAllTasks();
              else setActiveTab('tasks');
            }}
            className="text-xs sm:text-sm font-bold text-emerald-700 hover:text-emerald-800 font-khmer transition-colors cursor-pointer"
          >
            {language === 'km' ? 'មើលទាំងអស់' : 'View All'}
          </motion.button>
        </div>

        {/* Date line + Add Button */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs sm:text-sm font-semibold text-slate-500 font-mono">
            {new Date().toLocaleDateString(language === 'km' ? 'km-KH' : 'en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </span>
          <motion.button
            whileHover={{ scale: 1.2, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            onClick={onAddTask}
            className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
            title="Add Task"
          >
            <Plus className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Primary Task Item */}
        {hasActiveCrop && primaryTask ? (
          <motion.div 
            whileHover={{ scale: 1.01, x: 2 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            onClick={handleToggle}
            className="p-3.5 rounded-xl border border-amber-200/80 bg-amber-50/40 hover:bg-amber-50/70 transition-colors cursor-pointer flex items-start gap-3"
          >
            <motion.div 
              whileHover={{ scale: 1.2 }}
              className="mt-0.5 text-amber-600 shrink-0"
            >
              {isCompleted ? (
                <CheckSquare className="w-5 h-5 text-emerald-600" />
              ) : (
                <div className="w-5 h-5 rounded border-2 border-amber-500 bg-white" />
              )}
            </motion.div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-1.5">
                <h4 className={`text-sm sm:text-base font-bold text-slate-900 font-khmer leading-snug ${
                  isCompleted ? 'line-through text-slate-400' : ''
                }`}>
                  {language === 'km' ? primaryTask.titleKm : primaryTask.titleEn}
                </h4>
                <span className="text-xs font-bold text-amber-800 font-khmer shrink-0 px-2 py-0.5 bg-amber-100 rounded-md">
                  {primaryTask.priority === 'high' 
                    ? (language === 'km' ? 'ខ្ពស់' : 'High') 
                    : (language === 'km' ? 'មធ្យម' : 'Medium')}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1 truncate">
                {language === 'km' ? (primaryTask.notesKm || primaryTask.titleEn) : (primaryTask.notesEn || primaryTask.titleKm)}
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 flex flex-col items-center justify-center text-center py-5">
            <CheckCircle2 className="w-6 h-6 text-slate-300 mb-1.5" />
            <h4 className="text-xs sm:text-sm font-bold text-slate-500 font-khmer">
              {isCropCompleted
                ? (language === 'km' ? 'វដ្តដំណាំបានប្រមូលផលរួចរាល់ · គ្មានការងារត្រូវធ្វើ' : 'Crop harvest completed · No tasks scheduled')
                : (language === 'km' ? 'គ្មានដំណាំដាំដុះ · គ្មានការងារត្រូវធ្វើ' : 'No crop planted · No tasks scheduled')}
            </h4>
            <p className="text-xs text-slate-400 font-mono mt-1">—</p>
          </div>
        )}
      </div>

      {/* Progress Footer */}
      <div className="pt-4 border-t border-slate-100 mt-4">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1.5">
          <span className="font-khmer">
            {hasActiveCrop && totalCount > 0 ? (
              `${completedCount} / ${totalCount} ${language === 'km' ? 'រួចរាល់' : 'Completed'}`
            ) : (
              language === 'km' ? 'គ្មានការងារ' : 'No tasks'
            )}
          </span>
          <span className="font-mono text-xs text-slate-400">
            {hasActiveCrop && totalCount > 0 ? `${progressPercent}%` : '—'}
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div 
            className="bg-emerald-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${hasActiveCrop && totalCount > 0 ? progressPercent : 0}%` }}
          />
        </div>
      </div>
    </div>
  );
};
