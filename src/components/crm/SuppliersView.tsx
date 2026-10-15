import React, { useState } from 'react';
import { 
  Building2, 
  Truck, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  Star, 
  DollarSign, 
  Clock, 
  X,
  Globe,
  Edit2,
  Trash2
} from 'lucide-react';
import { useI18n } from '../../locales/i18nContext';
import { useFarm } from '../../context/FarmContext';
import { Supplier } from '../../types/melon';

export const SuppliersView: React.FC = () => {
  const { language } = useI18n();
  const { suppliers, addSupplier, updateSupplier, deleteSupplier } = useFarm();

  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Form state
  const [formData, setFormData] = useState<{
    name: string;
    category: 'seeds' | 'fertilizer' | 'irrigation' | 'packaging' | 'general';
    contactPerson: string;
    phone: string;
    email: string;
    address: string;
    country: string;
    rating: number;
  }>({
    name: '',
    category: 'fertilizer',
    contactPerson: '',
    phone: '+855 ',
    email: '',
    address: '',
    country: 'Cambodia',
    rating: 5,
  });

  const filteredSuppliers = suppliers.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.contactPerson.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q) ||
      s.country.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q)
    );
  });

  const totalSourced = suppliers.reduce((sum, s) => sum + s.totalPurchases, 0);
  const totalPayables = suppliers.reduce((sum, s) => sum + s.currentPayable, 0);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    if (editingSupplier) {
      updateSupplier({
        ...editingSupplier,
        ...formData,
      });
      setEditingSupplier(null);
    } else {
      addSupplier({
        ...formData,
        totalPurchases: 0,
        currentPayable: 0,
      });
    }

    setShowAddModal(false);
    setFormData({
      name: '',
      category: 'fertilizer',
      contactPerson: '',
      phone: '+855 ',
      email: '',
      address: '',
      country: 'Cambodia',
      rating: 5,
    });
  };

  const handleEdit = (s: Supplier) => {
    setEditingSupplier(s);
    setFormData({
      name: s.name,
      category: s.category,
      contactPerson: s.contactPerson,
      phone: s.phone,
      email: s.email,
      address: s.address,
      country: s.country,
      rating: s.rating,
    });
    setShowAddModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-slate-900">
            Suppliers & Input Vendors / <span className="font-khmer text-emerald-700">អ្នកផ្គត់ផ្គង់</span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {language === 'km' 
              ? 'គ្រប់គ្រងក្រុមហ៊ុនផ្គត់ផ្គង់គ្រាប់ពូជ ជីគីមី ប្រព័ន្ធស្រោចស្រព និងសម្ភារៈវេចខ្ចប់' 
              : 'Certified agricultural seed companies, fertigation nutrient vendors, and packaging suppliers'}
          </p>
        </div>

        <button
          onClick={() => {
            setEditingSupplier(null);
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#164e22] hover:bg-[#123e1b] text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'km' ? 'បន្ថែមអ្នកផ្គត់ផ្គង់ថ្មី' : '+ Add Supplier'}</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {language === 'km' ? 'អ្នកផ្គត់ផ្គង់សរុប' : 'Total Suppliers'}
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{suppliers.length} vendors</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Local & international</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {language === 'km' ? 'តម្លៃទិញសរុប' : 'Total Sourced'}
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1">${totalSourced.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Procurement spend</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {language === 'km' ? 'ប្រាក់ជំពាក់សរុប' : 'Current Payables'}
            </p>
            <p className="text-2xl font-bold text-red-600 mt-1">${totalPayables.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p className="text-[11px] text-red-500 font-medium mt-0.5">Due on vendor invoices</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {language === 'km' ? 'ការវាយតម្លៃជាមធ្យម' : 'Quality Rating'}
            </p>
            <p className="text-2xl font-bold text-amber-500 mt-1 flex items-center gap-1">
              4.8 <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Certified agronomy grade</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Star className="w-6 h-6" />
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
            placeholder="Search supplier or contact person..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 focus:bg-white text-xs border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSuppliers.map((sup) => (
          <div key={sup.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-emerald-800 to-teal-900 text-white flex items-center justify-center font-bold text-base shadow-sm">
                    {sup.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-slate-900">{sup.name}</h3>
                      <span className="font-mono text-[10px] text-slate-400 font-semibold">{sup.code}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Contact: <strong className="text-slate-700">{sup.contactPerson}</strong>
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-bold uppercase">
                        {sup.category}
                      </span>
                      <span className="flex items-center text-amber-500 text-xs font-bold">
                        {sup.rating} ★
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(sup)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                    title="Edit Supplier"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteSupplier(sup.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                    title="Delete Supplier"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Details & Location */}
              <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1.5">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Phone:</span>
                  </span>
                  <span className="font-semibold text-slate-800 font-mono">{sup.phone}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-blue-500" />
                    <span>Country / Origin:</span>
                  </span>
                  <span className="font-medium text-slate-800">{sup.country}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-red-500" />
                    <span>Address:</span>
                  </span>
                  <span className="font-medium text-slate-800 truncate max-w-[220px]">{sup.address}</span>
                </div>
              </div>
            </div>

            {/* Procurement Footer */}
            <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block">Total Purchases</span>
                <span className="font-bold text-slate-900">${sup.totalPurchases.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Current Payable</span>
                <span className={`font-bold ${sup.currentPayable > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                  ${sup.currentPayable.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Supplier Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full flex flex-col shadow-2xl border border-slate-200 max-h-[90vh] overflow-hidden">
            <div className="shrink-0 p-5 px-6 border-b border-slate-100 flex items-center justify-between bg-white z-10">
              <h3 className="font-bold text-base text-slate-900">
                {editingSupplier ? 'Edit Supplier' : 'Add New Agricultural Supplier'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Company / Vendor Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sakata Seed Corporation"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Category *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="seeds">Seeds & Genetics</option>
                      <option value="fertilizer">Fertilizers & Nutrients</option>
                      <option value="irrigation">Irrigation & Automation</option>
                      <option value="packaging">Boxes & Packaging</option>
                      <option value="general">General Agricultural Supplies</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Contact Person *</label>
                    <input
                      type="text"
                      required
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Phone Number *</label>
                    <input
                      type="text"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Country of Origin</label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Office / Warehouse Address</label>
                  <input
                    type="text"
                    placeholder="Street, City, Country"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none"
                  />
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
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
