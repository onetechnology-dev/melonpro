import React, { useState } from 'react';
import { 
  Building2, 
  Store, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  DollarSign, 
  Clock, 
  X,
  CreditCard,
  Edit2,
  Trash2
} from 'lucide-react';
import { useI18n } from '../../locales/i18nContext';
import { useFarm } from '../../context/FarmContext';
import { Customer } from '../../types/melon';

export const CustomersView: React.FC = () => {
  const { language } = useI18n();
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useFarm();

  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form state
  const [formData, setFormData] = useState<{
    name: string;
    companyName: string;
    type: 'supermarket' | 'wholesale' | 'retailer' | 'exporter' | 'direct';
    phone: string;
    email: string;
    address: string;
    city: string;
    paymentTerms: string;
    creditLimit?: number;
  }>({
    name: '',
    companyName: '',
    type: 'supermarket',
    phone: '+855 ',
    email: '',
    address: '',
    city: 'Phnom Penh',
    paymentTerms: 'Net 15 Days',
    creditLimit: 5000,
  });

  const filteredCustomers = customers.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.companyName && c.companyName.toLowerCase().includes(q)) ||
      c.phone.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q)
    );
  });

  const totalPurchasedAll = customers.reduce((sum, c) => sum + c.totalPurchased, 0);
  const totalReceivables = customers.reduce((sum, c) => sum + c.balanceDue, 0);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    if (editingCustomer) {
      updateCustomer({
        ...editingCustomer,
        ...formData,
      });
      setEditingCustomer(null);
    } else {
      addCustomer({
        ...formData,
        totalPurchased: 0,
        balanceDue: 0,
        status: 'active',
      });
    }

    setShowAddModal(false);
    setFormData({
      name: '',
      companyName: '',
      type: 'supermarket',
      phone: '+855 ',
      email: '',
      address: '',
      city: 'Phnom Penh',
      paymentTerms: 'Net 15 Days',
      creditLimit: 5000,
    });
  };

  const handleEdit = (c: Customer) => {
    setEditingCustomer(c);
    setFormData({
      name: c.name,
      companyName: c.companyName || '',
      type: c.type,
      phone: c.phone,
      email: c.email,
      address: c.address,
      city: c.city,
      paymentTerms: c.paymentTerms,
    });
    setShowAddModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-slate-900">
            Customers & Buyers / <span className="font-khmer text-emerald-700">អតិថិជន និងអ្នកទិញ</span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {language === 'km' 
              ? 'គ្រប់គ្រងទំនាក់ទំនងជាមួយផ្សារទំនើប អ្នកទិញដុំ និងហាងផ្លែឈើលំដាប់ខ្ពស់' 
              : 'Commercial buyer accounts, supermarket chains, wholesale fruit traders, and retail boutiques'}
          </p>
        </div>

        <button
          onClick={() => {
            setEditingCustomer(null);
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#164e22] hover:bg-[#123e1b] text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'km' ? 'បន្ថែមអតិថិជនថ្មី' : '+ Add Customer'}</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {language === 'km' ? 'អតិថិជនសរុប' : 'Total Buyers'}
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{customers.length} partners</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Supermarkets & wholesalers</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Store className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {language === 'km' ? 'ការទិញសរុប' : 'Total Volume Bought'}
            </p>
            <p className="text-2xl font-bold text-emerald-800 mt-1">${totalPurchasedAll.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Cumulative commercial sales</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {language === 'km' ? 'ប្រាក់ជំពាក់សរុប' : 'Total Outstanding'}
            </p>
            <p className="text-2xl font-bold text-amber-600 mt-1">${totalReceivables.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p className="text-[11px] text-amber-600 font-medium mt-0.5">Accounts receivable</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {language === 'km' ? 'លក្ខខណ្ឌទូទាត់' : 'Primary Terms'}
            </p>
            <p className="text-xl font-bold text-slate-900 mt-1">Net 15 / COD</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Commercial contracts</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
            <CreditCard className="w-6 h-6" />
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
            placeholder="Search customer by name or company..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 focus:bg-white text-xs border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCustomers.map((cust) => (
          <div key={cust.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-blue-700 to-indigo-800 text-white flex items-center justify-center font-bold text-base shadow-sm">
                    {cust.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-slate-900">{cust.name}</h3>
                      <span className="font-mono text-[10px] text-slate-400 font-semibold">{cust.code}</span>
                    </div>
                    {cust.companyName && (
                      <p className="text-xs text-slate-500 mt-0.5">{cust.companyName}</p>
                    )}
                    <span className="inline-block mt-1 px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[10px] font-bold uppercase">
                      {cust.type}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(cust)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                    title="Edit Customer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteCustomer(cust.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                    title="Delete Customer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Details & Address */}
              <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1.5">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Phone:</span>
                  </span>
                  <span className="font-semibold text-slate-800 font-mono">{cust.phone}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-red-500" />
                    <span>Address:</span>
                  </span>
                  <span className="font-medium text-slate-800 truncate max-w-[220px]">{cust.address}, {cust.city}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-purple-500" />
                    <span>Payment Terms:</span>
                  </span>
                  <span className="font-semibold text-slate-800">{cust.paymentTerms}</span>
                </div>
              </div>
            </div>

            {/* Financial Status Footer */}
            <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block">Total Purchased</span>
                <span className="font-bold text-slate-900">${cust.totalPurchased.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Outstanding Due</span>
                <span className={`font-bold ${cust.balanceDue > 0 ? 'text-amber-600' : 'text-emerald-700'}`}>
                  ${cust.balanceDue.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full flex flex-col shadow-2xl border border-slate-200 max-h-[90vh] overflow-hidden">
            <div className="shrink-0 p-5 px-6 border-b border-slate-100 flex items-center justify-between bg-white z-10">
              <h3 className="font-bold text-base text-slate-900">
                {editingCustomer ? 'Edit Customer' : 'Add New Commercial Buyer'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Customer / Brand Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. AEON Supermarket"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Company Registered Name</label>
                    <input
                      type="text"
                      placeholder="e.g. AEON (Cambodia) Co., Ltd."
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Buyer Type *</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="supermarket">Supermarket Chain</option>
                      <option value="wholesale">Wholesale Fruit Trader</option>
                      <option value="retailer">Retail Fruit Boutique</option>
                      <option value="exporter">Export Distributor</option>
                      <option value="direct">Direct Consumer</option>
                    </select>
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

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">Street Address</label>
                    <input
                      type="text"
                      placeholder="e.g. #132, Street Samdach Sothearos"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">City / Province</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Terms</label>
                  <select
                    value={formData.paymentTerms}
                    onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="Cash on Delivery (COD)">Cash on Delivery (COD)</option>
                    <option value="Net 7 Days">Net 7 Days</option>
                    <option value="Net 15 Days">Net 15 Days</option>
                    <option value="Net 30 Days">Net 30 Days</option>
                    <option value="Advance Payment">Advance Payment</option>
                  </select>
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
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
