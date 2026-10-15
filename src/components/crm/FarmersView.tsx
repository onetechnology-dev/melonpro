import React, { useState } from 'react';
import { 
  Users, 
  UserCheck, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  Award, 
  Calendar, 
  DollarSign, 
  X,
  Edit2,
  Trash2
} from 'lucide-react';
import { useI18n } from '../../locales/i18nContext';
import { useFarm } from '../../context/FarmContext';
import { Farmer } from '../../types/melon';

export const FarmersView: React.FC = () => {
  const { language } = useI18n();
  const { farmers, plots, addFarmer, updateFarmer, deleteFarmer } = useFarm();

  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingFarmer, setEditingFarmer] = useState<Farmer | null>(null);

  // Form State
  const [newFarmer, setNewFarmer] = useState<{
    nameEn: string;
    nameKm: string;
    role: string;
    phone: string;
    email: string;
    assignedPlotIds: string[];
    monthlySalary: number;
    experienceYears: number;
    specialty: string;
  }>({
    nameEn: '',
    nameKm: '',
    role: 'Greenhouse Crop Technician',
    phone: '+855 ',
    email: '',
    assignedPlotIds: ['plot-a'],
    monthlySalary: 450,
    experienceYears: 3,
    specialty: 'Melon vine trellising and drip monitoring',
  });

  const filteredFarmers = farmers.filter((f) => {
    const q = search.toLowerCase();
    return (
      f.nameEn.toLowerCase().includes(q) ||
      f.nameKm.toLowerCase().includes(q) ||
      f.role.toLowerCase().includes(q) ||
      f.code.toLowerCase().includes(q) ||
      f.specialty.toLowerCase().includes(q)
    );
  });

  const totalPayroll = farmers.reduce((sum, f) => sum + f.monthlySalary, 0);
  const activeCount = farmers.filter((f) => f.status === 'active').length;

  const handleSaveFarmer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFarmer.nameEn) return;

    if (editingFarmer) {
      updateFarmer({
        ...editingFarmer,
        ...newFarmer,
      });
      setEditingFarmer(null);
    } else {
      addFarmer({
        ...newFarmer,
        status: 'active',
        joinDate: new Date().toISOString().split('T')[0],
      });
    }

    setShowAddModal(false);
    setNewFarmer({
      nameEn: '',
      nameKm: '',
      role: 'Greenhouse Crop Technician',
      phone: '+855 ',
      email: '',
      assignedPlotIds: ['plot-a'],
      monthlySalary: 450,
      experienceYears: 3,
      specialty: 'Melon vine trellising and drip monitoring',
    });
  };

  const handleEdit = (f: Farmer) => {
    setEditingFarmer(f);
    setNewFarmer({
      nameEn: f.nameEn,
      nameKm: f.nameKm,
      role: f.role,
      phone: f.phone,
      email: f.email || '',
      assignedPlotIds: f.assignedPlotIds,
      monthlySalary: f.monthlySalary,
      experienceYears: f.experienceYears,
      specialty: f.specialty,
    });
    setShowAddModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-slate-900">
            Farmers & Field Team / <span className="font-khmer text-emerald-700">កសិករ និងក្រុមការងារចំការ</span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {language === 'km' 
              ? 'គ្រប់គ្រងអ្នកជំនាញកសិកម្ម អ្នកបច្ចេកទេស និងកម្លាំងពលកម្មតាមផ្ទះសំណាញ់' 
              : 'Agronomists, greenhouse technicians, pollination crew, and harvest leads'}
          </p>
        </div>

        <button
          onClick={() => {
            setEditingFarmer(null);
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#164e22] hover:bg-[#123e1b] text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'km' ? 'បន្ថែមសមាជិកក្រុមថ្មី' : '+ Add Farmer / Member'}</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {language === 'km' ? 'បុគ្គលិកសរុប' : 'Total Farm Team'}
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{farmers.length} members</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Full-time & specialist staff</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {language === 'km' ? 'កំពុងបំពេញការងារ' : 'Active On Duty'}
            </p>
            <p className="text-2xl font-bold text-emerald-800 mt-1">{activeCount}</p>
            <p className="text-[11px] text-emerald-600 font-medium mt-0.5">In greenhouses today</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {language === 'km' ? 'ផ្ទះសំណាញ់គ្រប់គ្រង' : 'Greenhouse Coverage'}
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1">100%</p>
            <p className="text-[11px] text-slate-400 mt-0.5">All 4 plots assigned</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <MapPin className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {language === 'km' ? 'ប្រាក់បៀវត្សរ៍ប្រចាំខែ' : 'Monthly Payroll'}
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1">${totalPayroll.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Total labor expense</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search farmer by name, role, or skill..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 focus:bg-white text-xs border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none transition-all"
          />
        </div>
        <span className="text-xs text-slate-500 font-medium hidden sm:inline">
          Showing {filteredFarmers.length} team members
        </span>
      </div>

      {/* Farmers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredFarmers.map((farmer) => (
          <div key={farmer.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-[#164e22] to-[#2e7d32] text-white flex items-center justify-center font-bold text-base shadow-sm">
                    {farmer.nameEn.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-slate-900">{farmer.nameEn}</h3>
                      <span className="font-mono text-[10px] text-slate-400 font-semibold">{farmer.code}</span>
                    </div>
                    <p className="text-xs text-slate-500 font-khmer mt-0.5">{farmer.nameKm}</p>
                    <p className="text-xs font-semibold text-emerald-800 mt-0.5">{farmer.role}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(farmer)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                    title="Edit Member"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteFarmer(farmer.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                    title="Delete Member"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Specialty & Experience */}
              <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1.5">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-500" />
                    <span>Specialty:</span>
                  </span>
                  <span className="font-semibold text-slate-800 text-right">{farmer.specialty}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-500" />
                    <span>Experience:</span>
                  </span>
                  <span className="font-semibold text-slate-800">{farmer.experienceYears} Years in Protected Cultivation</span>
                </div>
              </div>

              {/* Assigned Greenhouses */}
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Assigned Greenhouses:</p>
                <div className="flex flex-wrap gap-1.5">
                  {farmer.assignedPlotIds.map((plotId) => {
                    const plot = plots.find(p => p.id === plotId);
                    return (
                      <span key={plotId} className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold">
                        {plot ? plot.name : plotId}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom Contact & Salary */}
            <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3 text-slate-600">
                <span className="flex items-center gap-1 font-mono">
                  <Phone className="w-3 h-3 text-emerald-600" />
                  {farmer.phone}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Monthly Base</span>
                <span className="font-bold text-slate-900">${farmer.monthlySalary.toFixed(2)}/mo</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Farmer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full flex flex-col shadow-2xl border border-slate-200 max-h-[90vh] overflow-hidden">
            <div className="shrink-0 p-5 px-6 border-b border-slate-100 flex items-center justify-between bg-white z-10">
              <h3 className="font-bold text-base text-slate-900">
                {editingFarmer ? 'Edit Farm Team Member' : 'Add New Farm Team Member'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveFarmer} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Full Name (English) *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sokha Meas"
                      value={newFarmer.nameEn}
                      onChange={(e) => setNewFarmer({ ...newFarmer, nameEn: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Full Name (Khmer / ភាសាខ្មែរ)</label>
                    <input
                      type="text"
                      placeholder="e.g. មាស សុខា"
                      value={newFarmer.nameKm}
                      onChange={(e) => setNewFarmer({ ...newFarmer, nameKm: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none font-khmer"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Role / Job Title *</label>
                    <input
                      type="text"
                      required
                      value={newFarmer.role}
                      onChange={(e) => setNewFarmer({ ...newFarmer, role: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Phone Number *</label>
                    <input
                      type="text"
                      required
                      value={newFarmer.phone}
                      onChange={(e) => setNewFarmer({ ...newFarmer, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Specialty & Agronomy Focus</label>
                  <input
                    type="text"
                    placeholder="e.g. Fertigation dosing, pollination, Trellis training"
                    value={newFarmer.specialty}
                    onChange={(e) => setNewFarmer({ ...newFarmer, specialty: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Monthly Salary ($ USD)</label>
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={newFarmer.monthlySalary}
                      onChange={(e) => setNewFarmer({ ...newFarmer, monthlySalary: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Years of Experience</label>
                    <input
                      type="number"
                      min="0"
                      value={newFarmer.experienceYears}
                      onChange={(e) => setNewFarmer({ ...newFarmer, experienceYears: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assign Greenhouses</label>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {plots.map((p) => {
                      const isChecked = newFarmer.assignedPlotIds.includes(p.id);
                      return (
                        <label key={p.id} className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewFarmer({ ...newFarmer, assignedPlotIds: [...newFarmer.assignedPlotIds, p.id] });
                              } else {
                                setNewFarmer({ ...newFarmer, assignedPlotIds: newFarmer.assignedPlotIds.filter(id => id !== p.id) });
                              }
                            }}
                            className="rounded text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className="font-semibold text-slate-800">{p.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="shrink-0 px-6 py-4 border-t border-slate-200/80 bg-slate-50/95 backdrop-blur-xs flex items-center justify-end gap-3 z-10 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#164e22] hover:bg-[#123e1b] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                >
                  Save Team Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
