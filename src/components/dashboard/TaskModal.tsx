import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Trash2, 
  Check, 
  Clock, 
  Calendar, 
  User, 
  MapPin, 
  Tag, 
  FileText, 
  AlertCircle 
} from 'lucide-react';
import { useI18n } from '../../locales/i18nContext';
import { useFarm } from '../../context/FarmContext';
import { FarmTask, TaskType, TaskStatus, GrowthStageKey } from '../../types/melon';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: FarmTask | null;
  initialDate?: string;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  taskToEdit,
  initialDate,
}) => {
  const { t, language } = useI18n();
  const { plots, addTask, updateTask, deleteTask } = useFarm();

  const [titleEn, setTitleEn] = useState('');
  const [titleKm, setTitleKm] = useState('');
  const [type, setType] = useState<TaskType>('watering');
  const [date, setDate] = useState(initialDate || '2025-04-21');
  const [time, setTime] = useState('07:00');
  const [plotId, setPlotId] = useState(plots[0]?.id || 'plot-a');
  const [stageKey, setStageKey] = useState<GrowthStageKey>('pollination');
  const [status, setStatus] = useState<TaskStatus>('pending');
  const [assignedWorker, setAssignedWorker] = useState('Sokha Farmer');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [dosageOrVolume, setDosageOrVolume] = useState('');
  const [notesEn, setNotesEn] = useState('');
  const [notesKm, setNotesKm] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState<'daily' | 'weekly' | 'biweekly'>('weekly');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (taskToEdit) {
      setTitleEn(taskToEdit.titleEn);
      setTitleKm(taskToEdit.titleKm);
      setType(taskToEdit.type);
      setDate(taskToEdit.date);
      setTime(taskToEdit.time || '07:00');
      setPlotId(taskToEdit.plotId);
      setStageKey(taskToEdit.stageKey);
      setStatus(taskToEdit.status);
      setAssignedWorker(taskToEdit.assignedWorker);
      setPriority(taskToEdit.priority);
      setDosageOrVolume(taskToEdit.dosageOrVolume || '');
      setNotesEn(taskToEdit.notesEn || '');
      setNotesKm(taskToEdit.notesKm || '');
      setIsRecurring(!!taskToEdit.isRecurring);
      setRecurringFrequency(taskToEdit.recurringFrequency || 'weekly');
    } else {
      setTitleEn('');
      setTitleKm('');
      setType('watering');
      setDate(initialDate || '2025-04-21');
      setTime('07:00');
      setPlotId(plots[0]?.id || 'plot-a');
      setStageKey('pollination');
      setStatus('pending');
      setAssignedWorker('Sokha Farmer');
      setPriority('medium');
      setDosageOrVolume('');
      setNotesEn('');
      setNotesKm('');
      setIsRecurring(false);
    }
    setConfirmDelete(false);
  }, [taskToEdit, initialDate, plots]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleEn.trim() && !titleKm.trim()) return;

    const finalTitleEn = titleEn.trim() || titleKm.trim();
    const finalTitleKm = titleKm.trim() || titleEn.trim();

    if (taskToEdit) {
      updateTask({
        ...taskToEdit,
        titleEn: finalTitleEn,
        titleKm: finalTitleKm,
        type,
        date,
        time,
        plotId,
        stageKey,
        status,
        assignedWorker,
        priority,
        dosageOrVolume,
        notesEn,
        notesKm,
        isRecurring,
        recurringFrequency: isRecurring ? recurringFrequency : undefined,
      });
    } else {
      addTask({
        titleEn: finalTitleEn,
        titleKm: finalTitleKm,
        type,
        date,
        time,
        plotId,
        batchId: 'cycle-2025-m2',
        stageKey,
        status,
        assignedWorker,
        priority,
        dosageOrVolume,
        notesEn,
        notesKm,
        isRecurring,
        recurringFrequency: isRecurring ? recurringFrequency : undefined,
      });
    }
    onClose();
  };

  const handleDelete = () => {
    if (taskToEdit) {
      deleteTask(taskToEdit.id);
      onClose();
    }
  };

  const handleQuickStatusChange = (newStatus: TaskStatus) => {
    setStatus(newStatus);
  };

  const taskTypeOptions: { value: TaskType; labelEn: string; labelKm: string }[] = [
    { value: 'watering', labelEn: 'Watering & Drip', labelKm: 'ស្រោចទឹក និងទុយោដំណក់' },
    { value: 'fertilizing', labelEn: 'Fertilizing', labelKm: 'ដាក់ជី' },
    { value: 'flowering_pollination', labelEn: 'Flowering & Pollination', labelKm: 'ចេញផ្កា & ការបង្កាត់ផ្កា' },
    { value: 'pest_check', labelEn: 'Pest & Disease Inspection', labelKm: 'ត្រួតពិនិត្យសត្វល្អិត & ជំងឺ' },
    { value: 'harvest_prep', labelEn: 'Harvest Preparation', labelKm: 'រៀបចំប្រមូលផល' },
    { value: 'harvest', labelEn: 'Harvest', labelKm: 'ប្រមូលផល' },
    { value: 'pruning', labelEn: 'Shoot Pruning & Training', labelKm: 'កាត់មែកខ្នែង & ចងខ្សែ' },
    { value: 'vine_maintenance', labelEn: 'Vine Maintenance', labelKm: 'ថែទាំដើមត្រសក់' },
  ];

  const modalElement = (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-50"
      style={{ zIndex: 99999 }}
    >
      <div 
        className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden relative"
        style={{ zIndex: 100000 }}
      >
        {/* Header (Frozen Top) */}
        <div className="shrink-0 p-4 px-6 border-b border-slate-100 flex items-center justify-between bg-white z-10">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {taskToEdit ? t('editTask') : t('addTask')}
            </h3>
            <p className="text-xs text-slate-500 font-khmer">
              {taskToEdit ? 'កែសម្រួលព័ត៌មានលម្អិតការងារ' : 'បន្ថែមការងារថ្មីក្នុងប្រតិទិនចំការ'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Container with Scrollable Body and Frozen Footer */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Quick status tabs if editing */}
          {taskToEdit && (
            <div className="p-2 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="text-[11px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wider">
                {t('status')}
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {(['pending', 'in_progress', 'completed', 'skipped'] as const).map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => handleQuickStatusChange(s)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold capitalize transition-all ${
                      status === s
                        ? s === 'completed'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : s === 'in_progress'
                            ? 'bg-amber-500 text-white shadow-xs'
                            : s === 'skipped'
                              ? 'bg-slate-600 text-white'
                              : 'bg-slate-800 text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {t(s as any)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Title Inputs (English and Khmer) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Task Title (English) *
              </label>
              <input
                type="text"
                required
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                placeholder="e.g. Hand Pollination & Red Tagging"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 font-khmer">
                ចំណងជើងការងារ (ខ្មែរ)
              </label>
              <input
                type="text"
                value={titleKm}
                onChange={(e) => setTitleKm(e.target.value)}
                placeholder="ឧ. ការបង្កាត់លម្អងដោយដៃ & ចងស្លាក"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none font-khmer"
              />
            </div>
          </div>

          {/* Task Type & Target Plot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('taskType')}
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TaskType)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:border-emerald-500 outline-none"
              >
                {taskTypeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {language === 'km' ? opt.labelKm : opt.labelEn}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('selectPlot')}
              </label>
              <select
                value={plotId}
                onChange={(e) => setPlotId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:border-emerald-500 outline-none"
              >
                {plots.map((plot) => (
                  <option key={plot.id} value={plot.id}>
                    {plot.name} ({plot.areaHa} ha)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date, Time & Worker */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('taskDate')}
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('taskTime')}
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none capitalize"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {/* Worker & Dosage/Volume */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('worker')}
              </label>
              <input
                type="text"
                value={assignedWorker}
                onChange={(e) => setAssignedWorker(e.target.value)}
                placeholder="e.g. Sokha Farmer, Bopha"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('dosageVolume')}
              </label>
              <input
                type="text"
                value={dosageOrVolume}
                onChange={(e) => setDosageOrVolume(e.target.value)}
                placeholder="e.g. 600 Liters, 25 kg NPK"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-none"
              />
            </div>
          </div>

          {/* Recurring Schedule */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  {t('recurringTask')}
                </span>
                <span className="text-[10px] text-slate-500 font-khmer">
                  {language === 'km' ? 'កំណត់កាលវិភាគស្វ័យប្រវត្ត' : 'Repeat this task on schedule'}
                </span>
              </div>
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
              />
            </div>

            {isRecurring && (
              <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center gap-2">
                <span className="text-xs text-slate-600">{t('frequency')}:</span>
                <select
                  value={recurringFrequency}
                  onChange={(e) => setRecurringFrequency(e.target.value as any)}
                  className="px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white outline-none"
                >
                  <option value="daily">{t('daily')}</option>
                  <option value="weekly">{t('weekly')}</option>
                  <option value="biweekly">{t('biweekly')}</option>
                </select>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t('notes')}
            </label>
            <textarea
              rows={2}
              value={notesEn}
              onChange={(e) => setNotesEn(e.target.value)}
              placeholder="Observation notes, calibration adjustments, crop response..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-none resize-none"
            />
          </div>

          {/* Delete confirmation alert */}
          {confirmDelete && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between gap-2 animate-in fade-in-50">
              <div className="flex items-center gap-2 text-red-700 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{t('confirmDelete')}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-2.5 py-1 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700"
                >
                  {t('delete')}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-2.5 py-1 bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          )}

          </div>

          {/* Frozen Action Buttons Footer */}
          <div className="shrink-0 p-4 px-6 border-t border-slate-200/80 bg-slate-50/95 backdrop-blur-xs flex items-center justify-between z-10 shadow-2xs">
            {taskToEdit && !confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-xl transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{t('delete')}</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-[#164e22] hover:bg-[#123e1b] rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                {t('save')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalElement, document.body)
    : modalElement;
};
