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
  const { plots, addTask, updateTask, deleteTask, taskTypes } = useFarm();

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

  const activeTaskTypes = taskTypes && taskTypes.length > 0 ? taskTypes : [
    { key: 'watering', nameEn: 'Watering & Drip', nameKm: 'ស្រោចទឹក និងទុយោដំណក់' },
    { key: 'fertilizing', nameEn: 'Fertilizing', nameKm: 'ដាក់ជី' },
    { key: 'flowering_pollination', nameEn: 'Flowering & Pollination', nameKm: 'ចេញផ្កា & ការបង្កាត់ផ្កា' },
    { key: 'pest_check', nameEn: 'Pest & Disease Inspection', nameKm: 'ត្រួតពិនិត្យសត្វល្អិត & ជំងឺ' },
    { key: 'harvest_prep', nameEn: 'Harvest Preparation', nameKm: 'រៀបចំប្រមូលផល' },
    { key: 'harvest', nameEn: 'Harvest', nameKm: 'ប្រមូលផល' },
    { key: 'pruning', nameEn: 'Shoot Pruning & Training', nameKm: 'កាត់មែកខ្នែង & ចងខ្សែ' },
    { key: 'vine_maintenance', nameEn: 'Vine Maintenance', nameKm: 'ថែទាំដើមត្រសក់' },
  ];

  const modalElement = (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in-50"
      style={{ zIndex: 99999 }}
    >
      <div 
        className="bg-white rounded-3xl max-w-4xl sm:max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden relative animate-in zoom-in-95"
        style={{ zIndex: 100000 }}
      >
        {/* Header (Large Frozen Top) */}
        <div className="shrink-0 p-5 sm:p-6 px-6 sm:px-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-xs">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {taskToEdit ? (language === 'km' ? 'កែសម្រួលកិច្ចការចំការ' : 'Edit Farm Task') : (language === 'km' ? '+ បន្ថែមកិច្ចការចំការថ្មី' : '+ Add New Farm Task')}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 font-khmer mt-0.5">
                {taskToEdit ? 'កែសម្រួលព័ត៌មានលម្អិតកិច្ចការ និងកាលវិភាគបច្ចេកទេស' : 'បង្កើតកិច្ចការថ្មីបញ្ចូលក្នុងប្រតិទិនចំការ និងចាត់ចែងបុគ្គលិក'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/70 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Container with Scrollable Body and Frozen Footer */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
            {/* Quick status tabs if editing */}
            {taskToEdit && (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70">
                <span className="text-xs font-bold text-slate-500 block mb-2 uppercase tracking-wider">
                  {t('status')} (ស្ថានភាពកិច្ចការ)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['pending', 'in_progress', 'completed', 'skipped'] as const).map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => handleQuickStatusChange(s)}
                      className={`py-2 px-3 rounded-xl text-sm font-bold capitalize transition-all cursor-pointer ${
                        status === s
                          ? s === 'completed'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : s === 'in_progress'
                              ? 'bg-amber-500 text-white shadow-xs'
                              : s === 'skipped'
                                ? 'bg-slate-600 text-white'
                                : 'bg-slate-800 text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {t(s as any)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Title Inputs (English and Khmer) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Task Title (English) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  placeholder="e.g. Hand Pollination & Red Tagging"
                  className="w-full px-4 py-2.5 text-sm sm:text-base font-semibold rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5 font-khmer">
                  ចំណងជើងការងារ (ភាសាខ្មែរ)
                </label>
                <input
                  type="text"
                  value={titleKm}
                  onChange={(e) => setTitleKm(e.target.value)}
                  placeholder="ឧ. ការបង្កាត់លម្អងដោយដៃ & ចងស្លាកកាលបរិច្ឆេទ"
                  className="w-full px-4 py-2.5 text-sm sm:text-base rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 outline-none font-khmer font-semibold transition-all"
                />
              </div>
            </div>

            {/* Task Type & Target Plot */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>{t('taskType')} (ប្រភេទកិច្ចការ) *</span>
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as TaskType)}
                  className="w-full px-4 py-2.5 text-sm sm:text-base font-semibold rounded-xl border border-slate-200 bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 outline-none transition-all cursor-pointer"
                >
                  {activeTaskTypes.map((opt) => (
                    <option key={opt.key} value={opt.key}>
                      {opt.nameEn} · {opt.nameKm}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  {t('selectPlot')} (រងដាំដុះ / កន្លែង) *
                </label>
                <select
                  value={plotId}
                  onChange={(e) => setPlotId(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm sm:text-base font-semibold rounded-xl border border-slate-200 bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 outline-none transition-all cursor-pointer"
                >
                  {plots.map((plot) => (
                    <option key={plot.id} value={plot.id}>
                      {plot.name} ({plot.areaHa} ha · {plot.facilityType === 'open_field' ? 'Open Field' : 'Net House'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date, Time & Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  {t('taskDate')} *
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm sm:text-base font-mono font-semibold rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  {t('taskTime')}
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm sm:text-base font-mono font-semibold rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Priority (កម្រិតអាទិភាព)
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full px-4 py-2.5 text-sm sm:text-base font-bold rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-emerald-500 capitalize transition-all cursor-pointer"
                >
                  <option value="low">🟢 Low (ទាប)</option>
                  <option value="medium">🟡 Medium (មធ្យម)</option>
                  <option value="high">🔴 High (ខ្ពស់ - សំខាន់)</option>
                </select>
              </div>
            </div>

            {/* Worker & Dosage/Volume */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  {t('worker')} (អ្នកទទួលខុសត្រូវ)
                </label>
                <input
                  type="text"
                  value={assignedWorker}
                  onChange={(e) => setAssignedWorker(e.target.value)}
                  placeholder="e.g. Sokha Agronomist, Bopha Farmer"
                  className="w-full px-4 py-2.5 text-sm sm:text-base rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 font-medium transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  {t('dosageVolume')} (កម្រិតប្រើប្រាស់ / បរិមាណ)
                </label>
                <input
                  type="text"
                  value={dosageOrVolume}
                  onChange={(e) => setDosageOrVolume(e.target.value)}
                  placeholder="e.g. 600 Liters (EC 1.8), 25 kg Calcium Nitrate"
                  className="w-full px-4 py-2.5 text-sm sm:text-base rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 font-medium transition-all"
                />
              </div>
            </div>

            {/* Recurring Schedule */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-slate-800 block">
                    {t('recurringTask')}
                  </span>
                  <span className="text-xs text-slate-500 font-khmer mt-0.5 block">
                    {language === 'km' ? 'កំណត់កាលវិភាគស្វ័យប្រវត្តិតាមវដ្តដដែលៗ' : 'Repeat this task automatically on schedule'}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
                />
              </div>

              {isRecurring && (
                <div className="mt-3 pt-3 border-t border-slate-200 flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-700">{t('frequency')}:</span>
                  <select
                    value={recurringFrequency}
                    onChange={(e) => setRecurringFrequency(e.target.value as any)}
                    className="px-3.5 py-1.5 text-sm font-bold rounded-xl border border-slate-200 bg-white outline-none cursor-pointer"
                  >
                    <option value="daily">{t('daily')} (រាល់ថ្ងៃ)</option>
                    <option value="weekly">{t('weekly')} (រៀងរាល់សប្តាហ៍)</option>
                    <option value="biweekly">{t('biweekly')} (រៀងរាល់ ២ សប្តាហ៍ម្តង)</option>
                  </select>
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                {t('notes')} (កំណត់ចំណាំបច្ចេកទេស)
              </label>
              <textarea
                rows={3}
                value={notesEn}
                onChange={(e) => setNotesEn(e.target.value)}
                placeholder="Observation notes, calibration adjustments, agronomic response..."
                className="w-full px-4 py-2.5 text-sm sm:text-base rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none"
              />
            </div>

            {/* Delete confirmation alert */}
            {confirmDelete && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between gap-3 animate-in fade-in-50">
                <div className="flex items-center gap-2.5 text-rose-800 text-sm font-semibold">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>{t('confirmDelete')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold cursor-pointer"
                  >
                    {t('delete')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="px-3.5 py-1.5 bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold cursor-pointer"
                  >
                    {t('cancel')}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Large Frozen Action Buttons Footer */}
          <div className="shrink-0 p-4 sm:p-5 px-6 sm:px-8 border-t border-slate-200/80 bg-slate-50/95 backdrop-blur-xs flex items-center justify-between z-10 shadow-2xs">
            {taskToEdit && !confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-2 text-sm font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{t('delete')}</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-sm sm:text-base font-bold text-slate-600 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                className="px-6 sm:px-7 py-2.5 text-sm sm:text-base font-extrabold text-white bg-[#164e22] hover:bg-[#123e1b] rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>{t('save')}</span>
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
