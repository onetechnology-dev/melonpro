import React, { useState, useEffect } from 'react';
import { 
  X, 
  Tag, 
  Check, 
  Sparkles, 
  AlertCircle,
  HelpCircle,
  Palette
} from 'lucide-react';
import { useI18n } from '../../locales/i18nContext';
import { TaskTypeItem } from '../../types/melon';
import { 
  TASK_TYPE_COLOR_PALETTES, 
  AVAILABLE_TASK_ICONS, 
  getTaskTypeIcon, 
  getColorStyle 
} from '../../data/taskTypePresets';

interface AddEditTaskTypeModalProps {
  isOpen: boolean;
  typeToEdit: TaskTypeItem | null;
  existingKeys: string[];
  onClose: () => void;
  onSave: (data: Omit<TaskTypeItem, 'id'>) => void;
}

export const AddEditTaskTypeModal: React.FC<AddEditTaskTypeModalProps> = ({
  isOpen,
  typeToEdit,
  existingKeys,
  onClose,
  onSave,
}) => {
  const { language } = useI18n();

  const [key, setKey] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [nameKm, setNameKm] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [descriptionKm, setDescriptionKm] = useState('');
  const [color, setColor] = useState('blue');
  const [iconName, setIconName] = useState('Droplets');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeToEdit) {
      setKey(typeToEdit.key);
      setNameEn(typeToEdit.nameEn);
      setNameKm(typeToEdit.nameKm);
      setDescriptionEn(typeToEdit.descriptionEn || '');
      setDescriptionKm(typeToEdit.descriptionKm || '');
      setColor(typeToEdit.color || 'blue');
      setIconName(typeToEdit.iconName || 'Tag');
    } else {
      setKey('');
      setNameEn('');
      setNameKm('');
      setDescriptionEn('');
      setDescriptionKm('');
      setColor('teal');
      setIconName('Sparkles');
    }
    setError(null);
  }, [typeToEdit, isOpen]);

  if (!isOpen) return null;

  const handleNameEnChange = (val: string) => {
    setNameEn(val);
    if (!typeToEdit) {
      // Auto-generate key from English name
      const autoKey = val.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').slice(0, 30);
      setKey(autoKey);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEn.trim()) {
      setError(language === 'km' ? 'សូមបញ្ចូលឈ្មោះកិច្ចការ (ភាសាអង់គ្លេស)' : 'Please enter Task Type Name in English');
      return;
    }

    const cleanKey = (key.trim() || nameEn.toLowerCase().replace(/[^a-z0-9]/g, '_')).replace(/_+/g, '_');
    if (!cleanKey) {
      setError(language === 'km' ? 'សូមបញ្ចូលកូដសម្គាល់កិច្ចការ' : 'Please provide a valid Task Type Key');
      return;
    }

    // Check duplicate key when adding new
    if (!typeToEdit && existingKeys.includes(cleanKey)) {
      setError(language === 'km' ? `កូដ "${cleanKey}" មានរួចហើយ សូមជ្រើសរើសកូដផ្សេង` : `Key "${cleanKey}" already exists. Please use a unique key.`);
      return;
    }

    const style = getColorStyle(color);
    onSave({
      key: cleanKey,
      nameEn: nameEn.trim(),
      nameKm: nameKm.trim() || nameEn.trim(),
      descriptionEn: descriptionEn.trim() || undefined,
      descriptionKm: descriptionKm.trim() || undefined,
      color,
      iconName,
      badgeBg: style.badgeBg,
      badgeText: style.badgeText,
      borderColor: style.borderColor,
      isSystem: typeToEdit ? typeToEdit.isSystem : false,
    });
  };

  const activeStyle = getColorStyle(color);

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in zoom-in-95">
        {/* Large Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-xs ${activeStyle.previewClass}`}>
              {getTaskTypeIcon(iconName, 'w-6 h-6')}
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                {typeToEdit
                  ? (language === 'km' ? 'កែប្រែប្រភេទកិច្ចការ' : 'Edit Task Type')
                  : (language === 'km' ? '+ បន្ថែមប្រភេទកិច្ចការថ្មី' : '+ Add New Task Type')}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 font-khmer mt-0.5">
                {language === 'km'
                  ? 'កំណត់ប្រភេទកិច្ចការ ពណ៌សម្គាល់ រូបតំណាង និងព័ត៌មានលម្អិត'
                  : 'Configure agronomic task categories, visual color badges, and icons used across calendar tasks'}
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-sm font-semibold flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Row 1: Names (English & Khmer) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Task Type Name (English) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={nameEn}
                  onChange={(e) => handleNameEnChange(e.target.value)}
                  placeholder="e.g. Foliar Spraying & Micronutrients"
                  className="w-full px-3.5 py-2.5 text-sm sm:text-base rounded-xl border border-slate-200 bg-white font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  ឈ្មោះប្រភេទកិច្ចការ (ភាសាខ្មែរ)
                </label>
                <input
                  type="text"
                  value={nameKm}
                  onChange={(e) => setNameKm(e.target.value)}
                  placeholder="ឧ. ការបាញ់ថ្នាំលើស្លឹក និងជីបំប៉ន"
                  className="w-full px-3.5 py-2.5 text-sm sm:text-base rounded-xl border border-slate-200 bg-white font-khmer font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>

            {/* Row 2: Unique Identifier Key */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-bold text-slate-700">
                  Unique Key Identifier <span className="text-rose-500">*</span>
                </label>
                <span className="text-xs text-slate-400 font-mono">
                  Used internally & for presets mapping
                </span>
              </div>
              <input
                type="text"
                required
                disabled={!!typeToEdit?.isSystem}
                value={key}
                onChange={(e) => setKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="e.g. foliar_spray"
                className="w-full px-3.5 py-2.5 text-sm sm:text-base font-mono font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
              />
            </div>

            {/* Row 3: Color Palette Picker */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                <Palette className="w-4 h-4 text-emerald-600" />
                <span>Color Theme & Badge Palette</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {Object.values(TASK_TYPE_COLOR_PALETTES).map((pal) => {
                  const isSelected = color === pal.key;
                  return (
                    <button
                      type="button"
                      key={pal.key}
                      onClick={() => setColor(pal.key)}
                      className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer text-left ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full ${pal.previewClass} shrink-0`} />
                      <span className="capitalize truncate text-slate-800">{pal.key}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-700 ml-auto" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Row 4: Icon Selector */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Select Icon
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5 max-h-48 overflow-y-auto p-1 border border-slate-100 rounded-2xl bg-slate-50/50">
                {AVAILABLE_TASK_ICONS.map((icon) => {
                  const isSelected = iconName === icon.name;
                  return (
                    <button
                      type="button"
                      key={icon.name}
                      onClick={() => setIconName(icon.name)}
                      className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'border-emerald-600 bg-white ring-2 ring-emerald-500 text-emerald-800 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                      }`}
                    >
                      <div className="text-slate-700 shrink-0">
                        {getTaskTypeIcon(icon.name, 'w-4 h-4')}
                      </div>
                      <span className="truncate">{icon.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Row 5: Descriptions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Description / SOP Guideline (English)
                </label>
                <textarea
                  rows={2}
                  value={descriptionEn}
                  onChange={(e) => setDescriptionEn(e.target.value)}
                  placeholder="Standard Operating Procedure or purpose of this task type..."
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  ការពិពណ៌នា / គោលការណ៍ណែនាំ (ភាសាខ្មែរ)
                </label>
                <textarea
                  rows={2}
                  value={descriptionKm}
                  onChange={(e) => setDescriptionKm(e.target.value)}
                  placeholder="គោលបំណង ឬរបៀបអនុវត្តការងារនេះក្នុងចំការ..."
                  className="w-full px-3.5 py-2 text-sm font-khmer rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>
            </div>

            {/* Row 6: Live Preview Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-xs font-bold text-slate-400 block mb-2 uppercase tracking-wider">
                Live Badge Preview
              </span>
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs sm:text-sm font-bold ${activeStyle.badgeBg} border ${activeStyle.borderColor}`}>
                  {getTaskTypeIcon(iconName, 'w-4 h-4')}
                  <span>{nameEn.trim() || 'Task Type Preview'}</span>
                  {nameKm.trim() && (
                    <span className="font-khmer font-normal opacity-80">· {nameKm.trim()}</span>
                  )}
                </span>

                <span className="text-xs text-slate-500 font-mono">
                  Key: <code className="bg-white px-2 py-0.5 rounded border border-slate-200 font-bold">{key || 'auto_key'}</code>
                </span>
              </div>
            </div>
          </div>

          {/* Large Frozen Footer */}
          <div className="p-4 sm:p-5 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/80">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              {language === 'km' ? 'បោះបង់' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#164e22] hover:bg-[#123e1b] text-white rounded-xl text-sm sm:text-base font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{language === 'km' ? 'រក្សាទុកប្រភេទកិច្ចការ' : 'Save Task Type'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
