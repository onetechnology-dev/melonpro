import React, { useState } from 'react';
import { 
  Sprout, 
  Calendar, 
  Plus, 
  Layers, 
  Clock, 
  Users, 
  CheckCircle2, 
  ChevronRight, 
  ArrowRight,
  Sparkles,
  Info,
  Edit3
} from 'lucide-react';
import { useI18n } from '../../locales/i18nContext';
import { useFarm } from '../../context/FarmContext';
import { GrowthStageKey, Plot, CropCycle } from '../../types/melon';
import { AddNewCropModal } from '../common/AddNewCropModal';

export const PlantingPlanView: React.FC = () => {
  const { t, language } = useI18n();
  const { plots, cropCycles, setActiveTab, setSelectedPlotId } = useFarm();

  const [showAddCropModal, setShowAddCropModal] = useState(false);
  const [editingCropCycle, setEditingCropCycle] = useState<CropCycle | null>(null);

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-slate-900">
            Planting Plans / <span className="font-khmer text-emerald-700">ផែនការដាំដុះ & ដំណាំ</span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {language === 'km' 
              ? 'គ្រប់គ្រងវដ្តដាំដុះ ពូជត្រសក់ផ្អែម និងកាលវិភាគលូតលាស់តាមរងដាំ' 
              : 'Configure crop cycles, melon cultivars, and stage schedules across plots'}
          </p>
        </div>

        <button
          onClick={() => {
            setEditingCropCycle(null);
            setShowAddCropModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-[#164e22] hover:bg-[#123e1b] text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all"
        >
          <Sprout className="w-4 h-4" />
          <span>{language === 'km' ? '+ បន្ថែមដំណាំថ្មី' : 'Add Planting'}</span>
        </button>
      </div>

      {/* Active & Planned Crop Cycles Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {cropCycles.map((cycle) => {
          const associatedPlot = plots.find((p) => p.id === cycle.plotId);
          return (
            <div
              key={cycle.id}
              className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 hover:border-emerald-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 uppercase">
                      {cycle.batchNumber}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1.5">
                      {cycle.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      {associatedPlot ? associatedPlot.name : 'Unassigned Plot'}
                      {cycle.facilityName ? ` · ${cycle.facilityName}` : ''} · {cycle.variety}
                    </p>
                  </div>

                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                    cycle.status === 'active' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {cycle.status}
                  </span>
                </div>

                {/* Sowing to Harvest Window */}
                <div className="grid grid-cols-3 gap-2 mt-4 p-3 bg-slate-50 rounded-xl text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">{t('sowingDate')}</span>
                    <span className="font-bold text-slate-800 font-mono">{cycle.sowingDate}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">{t('transplantingDate')}</span>
                    <span className="font-bold text-slate-800 font-mono">{cycle.transplantDate}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">{t('harvestWindow')}</span>
                    <span className="font-bold text-emerald-700 font-mono">{cycle.harvestWindowStart}</span>
                  </div>
                </div>

                {/* Stages Micro Progress Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1.5">
                    <span>{language === 'km' ? 'វឌ្ឍនភាពដំណាក់កាល' : 'Growth Stages Progress'}</span>
                    <span>{cycle.stages.filter(s => s.status === 'completed').length} / {cycle.stages.length} {language === 'km' ? 'បានបញ្ចប់' : 'Completed'}</span>
                  </div>
                  <div className="flex gap-1">
                    {cycle.stages.map((stage) => (
                      <div
                        key={stage.id}
                        title={`${stage.nameEn} (${stage.startDate} - ${stage.endDate})`}
                        className={`h-2 flex-1 rounded-full transition-all ${
                          stage.status === 'completed'
                            ? 'bg-emerald-500'
                            : stage.status === 'current'
                              ? 'bg-amber-500 animate-pulse'
                              : 'bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium font-mono">
                  {(cycle.plantCount || associatedPlot?.plantCount) ? `${(cycle.plantCount || associatedPlot?.plantCount || 0).toLocaleString()} plants` : ''}
                  {(cycle.areaM2 || associatedPlot?.areaM2) ? ` · ${(cycle.areaM2 || associatedPlot?.areaM2 || 0).toLocaleString()} m²` : (associatedPlot ? ` · ${associatedPlot.areaHa} ha` : '')}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingCropCycle(cycle);
                      setShowAddCropModal(true);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                    <span>{language === 'km' ? 'កែសម្រួល' : 'Edit'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedPlotId(cycle.plotId);
                      setActiveTab('dashboard');
                    }}
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
                  >
                    <span>{language === 'km' ? 'មើលលើផ្ទាំងគ្រប់គ្រង' : 'Dashboard'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Guided Add / Edit Crop Modal */}
      <AddNewCropModal
        isOpen={showAddCropModal}
        onClose={() => {
          setShowAddCropModal(false);
          setEditingCropCycle(null);
        }}
        cropCycleToEdit={editingCropCycle}
      />
    </div>
  );
};
