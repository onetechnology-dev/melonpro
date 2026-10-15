import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  Search, 
  Calendar, 
  QrCode, 
  CheckCircle2, 
  Filter 
} from 'lucide-react';
import { useI18n } from '../../locales/i18nContext';
import { useFarm } from '../../context/FarmContext';
import { QRCodeModal } from '../common/QRCodeModal';
import { GoogleDocExportModal } from '../common/GoogleDocExportModal';
import { Plot } from '../../types/melon';

export const FarmRecordsView: React.FC = () => {
  const { t, language } = useI18n();
  const { plots, tasks, monitoringRecords, harvestRecords } = useFarm();

  const [activeTab, setActiveTab] = useState<'tasks' | 'monitoring' | 'harvests'>('tasks');
  const [qrPlot, setQrPlot] = useState<Plot | null>(null);
  const [showGoogleDocModal, setShowGoogleDocModal] = useState(false);

  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    if (activeTab === 'tasks') {
      csvContent += 'ID,Date,Title (EN),Title (KM),Type,Plot,Status,Worker\n';
      tasks.forEach((t) => {
        csvContent += `"${t.id}","${t.date}","${t.titleEn}","${t.titleKm}","${t.type}","${t.plotId}","${t.status}","${t.assignedWorker}"\n`;
      });
    } else if (activeTab === 'monitoring') {
      csvContent += 'ID,Date,Plot,Source,Moisture,Temp,Humidity,HealthRating\n';
      monitoringRecords.forEach((m) => {
        csvContent += `"${m.id}","${m.recordedAt}","${m.plotId}","${m.source}","${m.soilMoisture}","${m.temperature}","${m.humidity}","${m.plantHealthRating}"\n`;
      });
    } else {
      csvContent += 'ID,Date,Plot,TotalWeightKg,FruitCount,Brix,YieldTonsPerHa,GradeA\n';
      harvestRecords.forEach((h) => {
        csvContent += `"${h.id}","${h.harvestDate}","${h.plotId}","${h.totalWeightKg}","${h.fruitCount}","${h.brixSugarDegree}","${h.actualYieldTonsPerHa}","${h.gradeA_Percent}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MelonPro_${activeTab}_records.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-slate-900">
            Farm Activity Records / <span className="font-khmer text-emerald-700">កំណត់ត្រាចំការ</span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {language === 'km' 
              ? 'ប្រវត្តិកិច្ចការ របាយការណ៍អធិការកិច្ច និងការនាំចេញទិន្នន័យជាឯកសារ' 
              : 'Exportable logs for organic GAP certification, agronomy auditing, and worker logs'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGoogleDocModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-semibold transition-colors shadow-2xs"
          >
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>Google Docs</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#164e22] hover:bg-[#123e1b] text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white p-3 rounded-2xl shadow-xs border border-slate-200/80 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'tasks' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600'
            }`}
          >
            Task Logs ({tasks.length})
          </button>
          <button
            onClick={() => setActiveTab('monitoring')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'monitoring' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600'
            }`}
          >
            Field Scouts & Sensors ({monitoringRecords.length})
          </button>
          <button
            onClick={() => setActiveTab('harvests')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'harvests' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600'
            }`}
          >
            Harvest Benchmarks ({harvestRecords.length})
          </button>
        </div>

        {/* Quick QR code print for plots */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Print Plot QR:</span>
          {plots.map((p) => (
            <button
              key={p.id}
              onClick={() => setQrPlot(p)}
              className="text-xs font-semibold px-2 py-1 rounded-lg border border-slate-200 hover:border-emerald-500 hover:text-emerald-700 bg-white"
            >
              {p.code}
            </button>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80">
        <div className="overflow-x-auto">
          {activeTab === 'tasks' && (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="pb-2.5 font-bold">Scheduled Date</th>
                  <th className="pb-2.5 font-bold">Activity Name</th>
                  <th className="pb-2.5 font-bold">Plot</th>
                  <th className="pb-2.5 font-bold">Type</th>
                  <th className="pb-2.5 font-bold">Status</th>
                  <th className="pb-2.5 font-bold">Worker</th>
                  <th className="pb-2.5 font-bold">Dosage / Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {tasks.map((t) => {
                  const plot = plots.find((p) => p.id === t.plotId);
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/60">
                      <td className="py-3 text-slate-800 font-bold">{t.date} {t.time}</td>
                      <td className="py-3 font-sans font-semibold text-slate-900">
                        {language === 'km' ? t.titleKm : t.titleEn}
                      </td>
                      <td className="py-3 font-sans text-slate-600">{plot?.name}</td>
                      <td className="py-3 font-sans capitalize text-slate-600">{t.type.replace('_', ' ')}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize font-sans ${
                          t.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3 font-sans text-slate-600">{t.assignedWorker}</td>
                      <td className="py-3 font-sans text-slate-500">{t.dosageOrVolume || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {activeTab === 'monitoring' && (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="pb-2.5 font-bold">Logged Timestamp</th>
                  <th className="pb-2.5 font-bold">Plot</th>
                  <th className="pb-2.5 font-bold">Source</th>
                  <th className="pb-2.5 font-bold">Moisture</th>
                  <th className="pb-2.5 font-bold">Temp</th>
                  <th className="pb-2.5 font-bold">Humidity</th>
                  <th className="pb-2.5 font-bold">Health Rating</th>
                  <th className="pb-2.5 font-bold">Observations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {monitoringRecords.map((m) => {
                  const plot = plots.find((p) => p.id === m.plotId);
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/60">
                      <td className="py-3 text-slate-800 font-bold">{new Date(m.recordedAt).toLocaleString()}</td>
                      <td className="py-3 font-sans text-slate-600">{plot?.name}</td>
                      <td className="py-3 font-sans">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          m.source === 'sensor' ? 'bg-sky-100 text-sky-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {m.source}
                        </span>
                      </td>
                      <td className="py-3 text-slate-800 font-bold">{m.soilMoisture}%</td>
                      <td className="py-3 text-slate-800">{m.temperature}°C</td>
                      <td className="py-3 text-slate-800">{m.humidity}%</td>
                      <td className="py-3 font-bold text-amber-500">{m.plantHealthRating} / 5 ★</td>
                      <td className="py-3 font-sans text-slate-600">{m.pestObservationEn}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {activeTab === 'harvests' && (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="pb-2.5 font-bold">Harvest Date</th>
                  <th className="pb-2.5 font-bold">Plot & Batch</th>
                  <th className="pb-2.5 font-bold">Total Weight (kg)</th>
                  <th className="pb-2.5 font-bold">Fruit Count</th>
                  <th className="pb-2.5 font-bold">Avg Weight</th>
                  <th className="pb-2.5 font-bold">Sugar (°Bx)</th>
                  <th className="pb-2.5 font-bold">Yield (t/ha)</th>
                  <th className="pb-2.5 font-bold">Grade A %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {harvestRecords.map((h) => {
                  const plot = plots.find((p) => p.id === h.plotId);
                  return (
                    <tr key={h.id} className="hover:bg-slate-50/60">
                      <td className="py-3 text-slate-800 font-bold">{h.harvestDate}</td>
                      <td className="py-3 font-sans text-slate-600">{plot?.name} ({h.batchId})</td>
                      <td className="py-3 text-slate-900 font-bold">{h.totalWeightKg.toLocaleString()} kg</td>
                      <td className="py-3 text-slate-700">{h.fruitCount.toLocaleString()}</td>
                      <td className="py-3 text-slate-700">{h.averageWeightKg} kg</td>
                      <td className="py-3 font-bold text-amber-600">{h.brixSugarDegree}° Bx</td>
                      <td className="py-3 font-bold text-emerald-700">{h.actualYieldTonsPerHa} t/ha</td>
                      <td className="py-3 font-bold text-emerald-800">{h.gradeA_Percent}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <QRCodeModal
        plot={qrPlot}
        isOpen={!!qrPlot}
        onClose={() => setQrPlot(null)}
      />

      <GoogleDocExportModal
        isOpen={showGoogleDocModal}
        onClose={() => setShowGoogleDocModal(false)}
      />
    </div>
  );
};
