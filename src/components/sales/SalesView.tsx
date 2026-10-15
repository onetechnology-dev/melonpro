import React, { useState } from 'react';
import { 
  BadgePercent, 
  Truck, 
  Plus, 
  Search, 
  FileText, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Printer, 
  X, 
  Scale, 
  Building2, 
  Share2,
  Trash2,
  ReceiptText
} from 'lucide-react';
import { useI18n } from '../../locales/i18nContext';
import { useFarm } from '../../context/FarmContext';
import { SaleOrder, SaleOrderItem } from '../../types/melon';

export const SalesView: React.FC = () => {
  const { language } = useI18n();
  const { salesOrders, customers, stockItems, plots, addSaleOrder, updateSaleStatus, setActiveTab } = useFarm();

  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'partial' | 'unpaid'>('all');
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState<SaleOrder | null>(null);

  // Form state
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'partial' | 'unpaid'>('paid');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer' | 'credit'>('bank_transfer');
  const [selectedPlotId, setSelectedPlotId] = useState(plots[0]?.id || 'plot-a');
  const [saleItems, setSaleItems] = useState<SaleOrderItem[]>([
    {
      stockItemId: 'stk-prod-01',
      productName: 'Japanese Musk Melon (Grade A)',
      grade: 'Grade A',
      unit: 'kg',
      quantity: 150,
      unitPrice: 5.5,
      total: 150 * 5.5,
    }
  ]);
  const [notes, setNotes] = useState('');

  const totalAmount = saleItems.reduce((sum, item) => sum + item.total, 0);

  const filteredSales = salesOrders.filter((s) => {
    const matchesStatus = statusFilter === 'all' || s.paymentStatus === statusFilter;
    const query = search.toLowerCase();
    const matchesSearch = 
      s.invoiceNumber.toLowerCase().includes(query) ||
      s.customerName.toLowerCase().includes(query) ||
      s.items.some(i => i.productName.toLowerCase().includes(query));
    return matchesStatus && matchesSearch;
  });

  const totalRevenue = salesOrders.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalPaidRevenue = salesOrders.reduce((sum, s) => sum + s.paidAmount, 0);
  const outstandingReceivable = totalRevenue - totalPaidRevenue;
  const totalKgSold = salesOrders.reduce((sum, s) => {
    return sum + s.items.filter(i => i.unit === 'kg').reduce((sub, i) => sub + i.quantity, 0);
  }, 0);

  const handleAddItem = () => {
    setSaleItems([
      ...saleItems,
      {
        productName: 'Golden Emerald Cantaloupe (Grade B)',
        grade: 'Grade B',
        unit: 'kg',
        quantity: 100,
        unitPrice: 3.8,
        total: 380,
      }
    ]);
  };

  const handleUpdateItem = (index: number, field: keyof SaleOrderItem, value: any) => {
    const updated = [...saleItems];
    const item = { ...updated[index], [field]: value };
    if (field === 'quantity' || field === 'unitPrice') {
      item.total = item.quantity * item.unitPrice;
    }
    updated[index] = item;
    setSaleItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    if (saleItems.length <= 1) return;
    setSaleItems(saleItems.filter((_, i) => i !== index));
  };

  const handleCreateSale = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find(c => c.id === selectedCustomerId);
    if (!cust) return;

    addSaleOrder({
      customerId: cust.id,
      customerName: cust.name,
      date: invoiceDate,
      items: saleItems,
      totalAmount,
      paidAmount: paymentStatus === 'paid' ? totalAmount : (paymentStatus === 'partial' ? totalAmount * 0.5 : 0),
      paymentStatus,
      deliveryStatus: 'delivered',
      paymentMethod,
      plotOriginId: selectedPlotId,
      notes,
    });

    setShowCreateModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-slate-900">
            Sales & Commercial Invoices / <span className="font-khmer text-emerald-700">ការលក់ និងវិក្កយបត្រ</span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {language === 'km' 
              ? 'ចេញវិក្កយបត្រលក់ផ្លែត្រសក់ តាមដានចំណូល និងការទូទាត់ពីផ្សារទំនើប និងអ្នកទិញដុំ' 
              : 'Record commercial melon fruit sales, manage buyer invoices, and track revenue collections'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('project_invoice')}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#164e22] border border-emerald-200 rounded-xl text-xs font-bold transition-all shadow-2xs"
            title="View Project Deliverables Quotation (A4)"
          >
            <ReceiptText className="w-3.5 h-3.5 text-emerald-700" />
            <span>Project Quotation (A4)</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#164e22] hover:bg-[#123e1b] text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'km' ? 'ចេញវិក្កយបត្រលក់ថ្មី' : '+ New Sales Invoice'}</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {language === 'km' ? 'ចំណូលលក់សរុប' : 'Total Gross Sales'}
            </p>
            <p className="text-2xl font-bold text-emerald-800 mt-1">${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{salesOrders.length} commercial orders</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {language === 'km' ? 'ទម្ងន់លក់សរុប' : 'Total Produce Sold'}
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{totalKgSold.toLocaleString()} kg</p>
            <p className="text-[11px] text-emerald-600 font-medium mt-0.5">High-sweetness melons</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <Scale className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {language === 'km' ? 'ប្រាក់ទូទាត់រួច' : 'Cash & Bank Collected'}
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1">${totalPaidRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Deposited to accounts</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {language === 'km' ? 'ប្រាក់រង់ចាំទូទាត់' : 'Accounts Receivable'}
            </p>
            <p className="text-2xl font-bold text-amber-600 mt-1">${outstandingReceivable.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p className="text-[11px] text-amber-600 font-medium mt-0.5">Pending client settlement</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 w-full md:w-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              statusFilter === 'all' ? 'bg-[#164e22] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Sales ({salesOrders.length})
          </button>
          <button
            onClick={() => setStatusFilter('paid')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              statusFilter === 'paid' ? 'bg-[#164e22] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Fully Paid
          </button>
          <button
            onClick={() => setStatusFilter('partial')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              statusFilter === 'partial' ? 'bg-[#164e22] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Partial / Pending
          </button>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice or customer..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 focus:bg-white text-xs border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Items Summary</th>
                <th className="py-3 px-4 text-right">Total ($)</th>
                <th className="py-3 px-4 text-right">Paid ($)</th>
                <th className="py-3 px-4 text-center">Payment</th>
                <th className="py-3 px-4 text-center">Fulfillment</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                    {s.invoiceNumber}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    {s.date}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    {s.customerName}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                    {s.items.map(i => `${i.productName} (${i.quantity} ${i.unit})`).join(', ')}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-emerald-800">
                    ${s.totalAmount.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-semibold text-slate-700">
                    ${s.paidAmount.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      s.paymentStatus === 'paid' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : s.paymentStatus === 'partial' 
                        ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {s.paymentStatus.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-[10px] font-semibold">
                      {s.deliveryStatus.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setSelectedInvoiceForPrint(s)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs transition-colors"
                        title="View & Print Official Receipt"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      {s.paymentStatus !== 'paid' && (
                        <button
                          onClick={() => updateSaleStatus(s.id, 'paid')}
                          className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg text-[10px] font-bold transition-colors"
                          title="Mark Invoice as Paid"
                        >
                          Mark Paid
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Print Commercial Invoice / Receipt Modal */}
      {selectedInvoiceForPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <span className="font-bold text-sm">Commercial Invoice Preview: {selectedInvoiceForPrint.invoiceNumber}</span>
              <button onClick={() => setSelectedInvoiceForPrint(null)} className="text-white/70 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs font-sans">
              {/* Receipt Header */}
              <div className="border-b border-slate-200 pb-4 flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-bold text-[#164e22]">MELONPRO SMART FARM</h2>
                  <p className="text-[11px] text-slate-500 font-khmer">ចំការត្រសក់ផ្អែមខ្នាតស្តង់ដារបច្ចេកវិទ្យាខ្ពស់</p>
                  <p className="text-slate-600 mt-1">Greenhouse Lot #4, Kandal Province, Cambodia</p>
                  <p className="text-slate-600">Tel: +855 12 998 765 | Web: melonpro.kh</p>
                </div>
                <div className="text-right">
                  <span className="text-xs px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg uppercase">
                    OFFICIAL INVOICE
                  </span>
                  <p className="font-mono font-bold text-slate-800 mt-1">{selectedInvoiceForPrint.invoiceNumber}</p>
                  <p className="text-slate-500">{selectedInvoiceForPrint.date}</p>
                </div>
              </div>

              {/* Bill To */}
              <div className="p-3 bg-slate-50 rounded-xl flex justify-between">
                <div>
                  <span className="text-slate-400 uppercase text-[10px] block font-bold">Billed To:</span>
                  <p className="font-bold text-slate-800 text-sm">{selectedInvoiceForPrint.customerName}</p>
                  <p className="text-slate-500">Commercial Wholesale & Retail Division</p>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 uppercase text-[10px] block font-bold">Payment Method:</span>
                  <p className="font-bold text-slate-800">{selectedInvoiceForPrint.paymentMethod.replace('_', ' ').toUpperCase()}</p>
                  <p className="text-emerald-700 font-bold">Status: {selectedInvoiceForPrint.paymentStatus.toUpperCase()}</p>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-300 text-slate-500 text-[10px] uppercase font-bold">
                    <th className="py-2">Description</th>
                    <th className="py-2">Grade</th>
                    <th className="py-2 text-right">Qty</th>
                    <th className="py-2 text-right">Price</th>
                    <th className="py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedInvoiceForPrint.items.map((item, idx) => (
                    <tr key={idx} className="py-2">
                      <td className="py-2 font-medium text-slate-800">{item.productName}</td>
                      <td className="py-2 text-slate-600">{item.grade || 'Standard'}</td>
                      <td className="py-2 text-right">{item.quantity} {item.unit}</td>
                      <td className="py-2 text-right">${item.unitPrice.toFixed(2)}</td>
                      <td className="py-2 text-right font-bold text-slate-900">${item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="border-t-2 border-slate-200 pt-3 space-y-1.5 text-right">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-semibold">${selectedInvoiceForPrint.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Amount Paid:</span>
                  <span className="font-semibold">${selectedInvoiceForPrint.paidAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-emerald-800 border-t border-slate-200 pt-1.5">
                  <span>Total Due:</span>
                  <span>${(selectedInvoiceForPrint.totalAmount - selectedInvoiceForPrint.paidAmount).toFixed(2)}</span>
                </div>
              </div>

              {selectedInvoiceForPrint.notes && (
                <div className="p-3 bg-amber-50 rounded-xl text-[11px] text-amber-800">
                  <strong>Notes:</strong> {selectedInvoiceForPrint.notes}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 shrink-0">
              <button
                onClick={() => setSelectedInvoiceForPrint(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-[#164e22] hover:bg-[#123e1b] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" /> Print Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Sales Order Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl max-w-4xl w-full flex flex-col shadow-2xl border border-slate-200 max-h-[90vh] overflow-hidden">
            <div className="shrink-0 p-5 px-6 border-b border-slate-100 flex items-center justify-between bg-white z-10">
              <h3 className="font-bold text-base text-slate-900">
                New Melon Sales Order / <span className="font-khmer text-emerald-700 text-sm">ចេញវិក្កយបត្រលក់ផ្លែត្រសក់</span>
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSale} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Customer / Buyer *</label>
                    <select
                      value={selectedCustomerId}
                      onChange={(e) => setSelectedCustomerId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none"
                    >
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Sale Date *</label>
                    <input
                      type="date"
                      required
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Items Section */}
                <div className="space-y-2 border border-slate-200 p-3 rounded-xl bg-slate-50">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">Produce Line Items</span>
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="text-xs text-emerald-700 font-bold hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Another Product
                    </button>
                  </div>

                  {saleItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 bg-white p-2.5 rounded-lg border border-slate-200 items-center">
                      <div className="col-span-5">
                        <label className="text-[10px] text-slate-400 block mb-0.5">Product & Grade</label>
                        <input
                          type="text"
                          value={item.productName}
                          onChange={(e) => handleUpdateItem(index, 'productName', e.target.value)}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="text-[10px] text-slate-400 block mb-0.5">Quantity ({item.unit})</label>
                        <input
                          type="number"
                          min="1"
                          step="any"
                          value={item.quantity}
                          onChange={(e) => handleUpdateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-bold"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="text-[10px] text-slate-400 block mb-0.5">Price / Unit ($)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => handleUpdateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs"
                        />
                      </div>

                      <div className="col-span-2 text-right">
                        <label className="text-[10px] text-slate-400 block mb-0.5">Total</label>
                        <span className="font-bold text-slate-900">${item.total.toFixed(2)}</span>
                      </div>

                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="text-slate-400 hover:text-red-600 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="flex justify-between items-center pt-2 px-1 text-sm font-bold text-slate-900">
                    <span>Invoice Total:</span>
                    <span className="text-emerald-800 text-base">${totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Harvest Origin (Greenhouse Plot)</label>
                    <select
                      value={selectedPlotId}
                      onChange={(e) => setSelectedPlotId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none"
                    >
                      {plots.map(p => (
                        <option key={p.id} value={p.id}>{p.name} - {p.melonVarietyEn}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Payment Status</label>
                    <select
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="paid">Paid in Full</option>
                      <option value="partial">Partial Deposit</option>
                      <option value="unpaid">Unpaid (Net 15 / Invoiced)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Delivery / Packing Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Delivey by refrigerated van, foam netting on each melon"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="shrink-0 px-6 py-4 border-t border-slate-200/80 bg-slate-50/95 backdrop-blur-xs flex items-center justify-end gap-3 z-10 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#164e22] hover:bg-[#123e1b] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                >
                  Issue Invoice & Complete Sale
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
