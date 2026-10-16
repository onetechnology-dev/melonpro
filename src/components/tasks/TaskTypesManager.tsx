import React, { useState } from 'react';
import { 
  Tag, 
  Plus, 
  RotateCcw, 
  Search, 
  X, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  LayoutGrid, 
  List,
  Sparkles,
  Layers,
  CalendarCheck2,
  Calendar
} from 'lucide-react';
import { useI18n } from '../../locales/i18nContext';
import { useFarm } from '../../context/FarmContext';
import { TaskTypeItem } from '../../types/melon';
import { getTaskTypeIcon, getColorStyle } from '../../data/taskTypePresets';
import { AddEditTaskTypeModal } from './AddEditTaskTypeModal';

interface TaskTypesManagerProps {
  onOpenAddModal?: () => void;
}

export const TaskTypesManager: React.FC<TaskTypesManagerProps> = () => {
  const { language } = useI18n();
  const { 
    taskTypes, 
    addTaskType, 
    updateTaskType, 
    deleteTaskType, 
    resetTaskTypes,
    tasks,
    taskPresets
  } = useFarm();

  const [searchQuery, setSearchQuery] = useState('');
  const [viewLayout, setViewLayout] = useState<'catalog' | 'list'>('catalog');
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingType, setEditingType] = useState<TaskTypeItem | null>(null);
  const [typeToDelete, setTypeToDelete] = useState<TaskTypeItem | null>(null);

  // Filter task types based on search
  const filteredTypes = taskTypes.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchEn = t.nameEn.toLowerCase().includes(q);
    const matchKm = t.nameKm.toLowerCase().includes(q);
    const matchKey = t.key.toLowerCase().includes(q);
    const matchDesc = (t.descriptionEn || '').toLowerCase().includes(q) || (t.descriptionKm || '').toLowerCase().includes(q);
    return matchEn || matchKm || matchKey || matchDesc;
  });

  const getTaskCountForType = (typeKey: string) => {
    return tasks.filter((t) => t.type === typeKey).length;
  };

  const getPresetCountForType = (typeKey: string) => {
    return taskPresets.filter((p) => p.type === typeKey).length;
  };

  const handleOpenAdd = () => {
    setEditingType(null);
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (item: TaskTypeItem) => {
    setEditingType(item);
    setIsAddEditOpen(true);
  };

  const handleSave = (data: Omit<TaskTypeItem, 'id'>) => {
    if (editingType) {
      updateTaskType({
        ...editingType,
        ...data,
      });
    } else {
      addTaskType(data);
    }
    setIsAddEditOpen(false);
    setEditingType(null);
  };

  const handleConfirmDelete = () => {
    if (typeToDelete) {
      deleteTaskType(typeToDelete.id);
      setTypeToDelete(null);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in">
      {/* 1. Header Banner & Actions */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-xs border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center shadow-xs">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Task Types Management
                </h2>
                <span className="text-slate-300">•</span>
                <span className="font-khmer font-bold text-teal-800 text-lg">
                  គ្រប់គ្រងប្រភេទកិច្ចការ
                </span>
                <span className="px-2.5 py-0.5 bg-teal-100 text-teal-800 text-xs font-bold rounded-full">
                  {taskTypes.length} Types
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {language === 'km'
                  ? 'បង្កើត កែសម្រួល ឬលុបប្រភេទកិច្ចការចំការ ព្រមទាំងកំណត់រូបតំណាង និងពណ៌សម្គាល់សម្រាប់ប្រតិទិនការងារ និង SOP'
                  : 'Add, edit, or customize agronomic task categories, badges, and visual icons across calendar tasks and presets'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#164e22] hover:bg-[#123e1b] text-white rounded-xl text-sm sm:text-base font-bold shadow-xs hover:shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'km' ? '+ បន្ថែមប្រភេទកិច្ចការថ្មី' : '+ Add Task Type'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (window.confirm(language === 'km'
                ? 'តើអ្នកពិតជាចង់កំណត់ប្រភេទកិច្ចការឡើងវិញទៅតាមលំនាំដើមមែនទេ?'
                : 'Reset task types to factory default presets?')) {
                resetTaskTypes();
              }
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
            title="Restore default 8 task types"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            <span>{language === 'km' ? 'កំណត់ឡើងវិញ' : 'Reset'}</span>
          </button>
        </div>
      </div>

      {/* 2. Filter & View Switcher Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl shadow-xs border border-slate-200/80">
        {/* Search Input */}
        <div className="relative flex-1 sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'km' ? 'ស្វែងរកប្រភេទកិច្ចការ...' : 'Search task types / SOP guidelines...'}
            className="w-full pl-10 pr-9 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* View Switcher: Catalog vs List */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold hidden sm:inline">
            {filteredTypes.length} {language === 'km' ? 'ប្រភេទ' : 'categories'}
          </span>

          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80 shrink-0">
            <button
              type="button"
              onClick={() => setViewLayout('catalog')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewLayout === 'catalog'
                  ? 'bg-white text-emerald-950 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-emerald-700" />
              <span>{language === 'km' ? 'កាតាឡុក' : 'Catalog'}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewLayout('list')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewLayout === 'list'
                  ? 'bg-white text-emerald-950 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <List className="w-3.5 h-3.5 text-emerald-700" />
              <span>{language === 'km' ? 'បញ្ជី' : 'List'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Task Types Content: Catalog vs List */}
      {filteredTypes.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Tag className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-700">No Task Types Found</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
            No categories match your search. Click "+ Add Task Type" to create a new agronomic activity.
          </p>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="mt-4 px-5 py-2.5 bg-[#164e22] hover:bg-[#123e1b] text-white rounded-xl text-sm font-bold shadow-xs cursor-pointer inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task Type</span>
          </button>
        </div>
      ) : viewLayout === 'catalog' ? (
        /* --- CATALOG VIEW (CARDS GRID) --- */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
          {filteredTypes.map((item) => {
            const taskCount = getTaskCountForType(item.key);
            const presetCount = getPresetCountForType(item.key);
            const colorPal = getColorStyle(item.color || 'blue');

            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl border border-slate-200 hover:border-emerald-400 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group"
              >
                {/* Accent top line */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 ${colorPal.accentBar}`} />

                <div>
                  {/* Top Bar with Badge & System Tag */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold ${item.badgeBg || colorPal.badgeBg} border ${item.borderColor || colorPal.borderColor}`}>
                      {getTaskTypeIcon(item.iconName, 'w-4 h-4')}
                      <span>{item.nameEn}</span>
                    </span>

                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      item.isSystem ? 'bg-slate-100 text-slate-600' : 'bg-teal-50 text-teal-700 border border-teal-200'
                    }`}>
                      {item.isSystem ? 'Standard' : 'Custom'}
                    </span>
                  </div>

                  {/* Title & Key */}
                  <div className="mb-2.5">
                    <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                      {item.nameEn}
                    </h3>
                    {item.nameKm && (
                      <p className="text-sm font-khmer text-emerald-800 font-semibold mt-0.5">
                        {item.nameKm}
                      </p>
                    )}
                  </div>

                  {/* Identifier Key */}
                  <div className="mb-3">
                    <span className="text-xs text-slate-400 font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                      key: <strong className="text-slate-700">{item.key}</strong>
                    </span>
                  </div>

                  {/* Description / SOP guideline */}
                  {(item.descriptionEn || item.descriptionKm) && (
                    <div className="text-xs text-slate-600 bg-slate-50/70 p-3 rounded-2xl border border-slate-100 mb-3.5 leading-relaxed line-clamp-3">
                      {language === 'km' ? item.descriptionKm || item.descriptionEn : item.descriptionEn || item.descriptionKm}
                    </div>
                  )}

                  {/* Usage Statistics */}
                  <div className="flex items-center gap-2 flex-wrap mb-2 text-xs">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 font-semibold">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{taskCount} calendar tasks</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 font-semibold">
                      <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                      <span>{presetCount} SOP presets</span>
                    </span>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-3 h-3 rounded-full ${colorPal.dotBg}`} />
                    <span className="text-xs font-semibold text-slate-500 capitalize">{item.color}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer"
                      title="Edit Task Type"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setTypeToDelete(item)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      title="Delete Task Type"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* --- LIST VIEW (TABLE) --- */
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50/90 text-slate-600 font-bold border-b border-slate-200 text-xs uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-12 text-center">#</th>
                  <th className="py-3.5 px-4">Task Type & Badge</th>
                  <th className="py-3.5 px-4">Unique Key</th>
                  <th className="py-3.5 px-4">SOP Description</th>
                  <th className="py-3.5 px-3 text-center">Calendar Tasks</th>
                  <th className="py-3.5 px-3 text-center">SOP Presets</th>
                  <th className="py-3.5 px-3 text-center">Origin</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTypes.map((item, idx) => {
                  const taskCount = getTaskCountForType(item.key);
                  const presetCount = getPresetCountForType(item.key);
                  const colorPal = getColorStyle(item.color || 'blue');

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold ${item.badgeBg || colorPal.badgeBg} border ${item.borderColor || colorPal.borderColor}`}>
                            {getTaskTypeIcon(item.iconName, 'w-4 h-4')}
                            <span>{item.nameEn}</span>
                          </span>
                        </div>
                        {item.nameKm && (
                          <div className="text-xs font-khmer text-emerald-800 font-semibold mt-0.5 ml-1">
                            {item.nameKm}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-700">
                        <code>{item.key}</code>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500 max-w-xs truncate">
                        {language === 'km' ? item.descriptionKm || item.descriptionEn : item.descriptionEn || item.descriptionKm || '—'}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-lg text-xs">
                          {taskCount}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-lg text-xs">
                          {presetCount}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          item.isSystem ? 'bg-slate-100 text-slate-600' : 'bg-teal-50 text-teal-700'
                        }`}>
                          {item.isSystem ? 'Standard' : 'Custom'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Task Type"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setTypeToDelete(item)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Task Type"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Large Add / Edit Task Type Modal */}
      <AddEditTaskTypeModal
        isOpen={isAddEditOpen}
        typeToEdit={editingType}
        existingKeys={taskTypes.map((t) => t.key)}
        onClose={() => {
          setIsAddEditOpen(false);
          setEditingType(null);
        }}
        onSave={handleSave}
      />

      {/* 5. Delete Confirmation Dialog */}
      {typeToDelete && (
        <div className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 text-center animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              {language === 'km' ? 'លុបប្រភេទកិច្ចការ?' : 'Delete Task Type?'}
            </h3>
            <p className="text-sm text-slate-500 mt-1.5">
              {language === 'km'
                ? `តើអ្នកប្រាកដជាចង់លុប "${typeToDelete.nameKm || typeToDelete.nameEn}" (${typeToDelete.key})?`
                : `Are you sure you want to delete "${typeToDelete.nameEn}" (${typeToDelete.key})?`}
            </p>

            {(getTaskCountForType(typeToDelete.key) > 0 || getPresetCountForType(typeToDelete.key) > 0) && (
              <div className="my-3 p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 text-left">
                ⚠️ <strong>Note:</strong> This category is used by {getTaskCountForType(typeToDelete.key)} calendar task(s) and {getPresetCountForType(typeToDelete.key)} preset(s). Existing tasks will preserve their data.
              </div>
            )}

            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setTypeToDelete(null)}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                {language === 'km' ? 'បោះបង់' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold shadow-xs transition-colors cursor-pointer"
              >
                {language === 'km' ? 'លុបចេញ' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
