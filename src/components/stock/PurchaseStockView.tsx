import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Truck, 
  Plus, 
  Search, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  DollarSign, 
  FileText, 
  X,
  Building2,
  Trash2
} from 'lucide-react';
import { useI18n } from '../../locales/i18nContext';
import { useFarm } from '../../context/FarmContext';
import { PurchaseStockOrder, PurchaseOrderItem, StockCategory } from '../../types/melon';

export const PurchaseStockView: React.FC = () => {
  const { language } = useI18n();
  const { purchaseOrders, suppliers, stockItems, addPurchaseOrder, updatePurchaseOrderStatus } = useFarm();

  const [statusFilter, setStatusFilter] = useState<'all' | 'ordered' | 'received'>('all');
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || '');
  const [poDate, setPoDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'partial' | 'unpaid'>('paid');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer' | 'credit'>('bank_transfer');
  const [orderItems, setOrderItems] = useState<PurchaseOrderItem[]>([
    {
      stockItemId: stockItems[0]?.id || '',
      name: stockItems[0]?.nameEn || 'Item',
      category: stockItems[0]?.category || 'fertilizer',
      quantity: 10,
      unit: stockItems[0]?.unit || 'kg',
      unitPrice: stockItems[0]?.unitCost || 25,
      total: (stockItems[0]?.unitCost || 25) * 10,
    }
  ]);
  const [notes, setNotes] = useState('');

  const totalAmount = orderItems.reduce((sum, item) => sum + item.total, 0);

  const filteredOrders = purchaseOrders.filter((po) => {
    const matchesStatus = statusFilter === 'all' || po.orderStatus === statusFilter;
    const query = search.toLowerCase();
    const matchesSearch = 
      po.poNumber.toLowerCase().includes(query) ||
      po.supplierName.toLowerCase().includes(query) ||
      po.items.some(i => i.name.toLowerCase().includes(query));
    return matchesStatus && matchesSearch;
  });

  const totalPurchasesAmount = purchaseOrders.reduce((sum, p) => sum + p.totalAmount, 0);
  const receivedOrdersCount = purchaseOrders.filter((p) => p.orderStatus === 'received').length;
  const pendingOrdersCount = purchaseOrders.filter((p) => p.orderStatus === 'ordered').length;
  const totalPayableUnpaid = purchaseOrders
    .filter((p) => p.paymentStatus !== 'paid')
    .reduce((sum, p) => sum + (p.totalAmount - p.paidAmount), 0);

  const handleAddItemRow = () => {
    const firstStock = stockItems[0];
    setOrderItems([
      ...orderItems,
      {
        stockItemId: firstStock ? firstStock.id : '',
        name: firstStock ? firstStock.nameEn : '',
        category: firstStock ? firstStock.category : 'fertilizer',
        quantity: 5,
        unit: firstStock ? firstStock.unit : 'kg',
        unitPrice: firstStock ? firstStock.unitCost : 10,
        total: (firstStock ? firstStock.unitCost : 10) * 5,
      }
    ]);
  };

  const handleUpdateItemRow = (index: number, field: keyof PurchaseOrderItem, value: any) => {
    const updated = [...orderItems];
    const item = { ...updated[index], [field]: value };
    
    // If stock item changed, update default unit and cost
    if (field === 'stockItemId') {
      const match = stockItems.find(s => s.id === value);
      if (match) {
        item.name = match.nameEn;
        item.category = match.category;
        item.unit = match.unit;
        item.unitPrice = match.unitCost;
      }
    }

    if (field === 'quantity' || field === 'unitPrice' || field === 'stockItemId') {
      item.total = item.quantity * item.unitPrice;
    }

    updated[index] = item;
    setOrderItems(updated);
  };

  const handleRemoveItemRow = (index: number) => {
    if (orderItems.length <= 1) return;
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handleCreatePO = (e: React.FormEvent) => {
    e.preventDefault();
    const supplier = suppliers.find(s => s.id === selectedSupplierId);
    if (!supplier) return;

    addPurchaseOrder({
      supplierId: supplier.id,
      supplierName: supplier.name,
      date: poDate,
      items: orderItems,
      totalAmount,
      paidAmount: paymentStatus === 'paid' ? totalAmount : (paymentStatus === 'partial' ? totalAmount * 0.5 : 0),
      paymentStatus,
      orderStatus: 'received', // Default received for quick replenishment
      paymentMethod,
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
            Purchase Stock & Procurement / <span className="font-khmer text-emerald-700">ទិញចូលស្តុក</span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {language === 'km' 
              ? 'គ្រប់គ្រងការបញ្ជាទិញគ្រាប់ពូជ ជី និងសម្ភារៈកសិកម្មពីអ្នកផ្គត់ផ្គង់' 
              : 'Procurement orders for seeds, fertilizers, chemicals, and packaging from verified suppliers'}
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#164e22] hover:bg-[#123e1b] text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'km' ? 'បង្កើតការបញ្ជាទិញថ្មី' : '+ New Purchase Order'}</span>
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {language === 'km' ? 'តម្លៃទិញសរុប' : 'Total Procurement'}
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1">${totalPurchasesAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{purchaseOrders.length} orders recorded</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <ShoppingCart className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {language === 'km' ? 'បានទទួលរួច' : 'Received Orders'}
            </p>
            <p className="text-2xl font-bold text-emerald-800 mt-1">{receivedOrdersCount}</p>
            <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Stock updated in warehouse</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {language === 'km' ? 'កំពុងដឹកជញ្ជូន' : 'Pending Shipments'}
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{pendingOrdersCount}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Awaiting arrival</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Truck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {language === 'km' ? 'ប្រាក់ជំពាក់អ្នកផ្គត់ផ្គង់' : 'Accounts Payable'}
            </p>
            <p className="text-2xl font-bold text-red-600 mt-1">${totalPayableUnpaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p className="text-[11px] text-red-500 font-medium mt-0.5">Pending payments to suppliers</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 w-full md:w-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              statusFilter === 'all' ? 'bg-[#164e22] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Orders ({purchaseOrders.length})
          </button>
          <button
            onClick={() => setStatusFilter('received')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              statusFilter === 'received' ? 'bg-[#164e22] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Received ({receivedOrdersCount})
          </button>
          <button
            onClick={() => setStatusFilter('ordered')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              statusFilter === 'ordered' ? 'bg-[#164e22] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Pending Delivery ({pendingOrdersCount})
          </button>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search PO # or supplier..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 focus:bg-white text-xs border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {filteredOrders.map((po) => (
          <div key={po.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-xs">
                  PO
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 text-sm">{po.poNumber}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      po.orderStatus === 'received' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {po.orderStatus.toUpperCase()}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      po.paymentStatus === 'paid' 
                        ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                        : po.paymentStatus === 'partial' 
                        ? 'bg-purple-50 text-purple-700 border border-purple-200' 
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      PAYMENT: {po.paymentStatus.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Supplier: <strong className="text-slate-800">{po.supplierName}</strong> · Order Date: {po.date}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-right">
                <div>
                  <p className="text-[11px] text-slate-400">Total Purchase Amount</p>
                  <p className="text-lg font-bold text-emerald-800">${po.totalAmount.toFixed(2)}</p>
                </div>
                {po.orderStatus === 'ordered' && (
                  <button
                    onClick={() => updatePurchaseOrderStatus(po.id, 'received')}
                    className="px-3 py-1.5 bg-[#164e22] hover:bg-[#123e1b] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    Receive Stock
                  </button>
                )}
              </div>
            </div>

            {/* Items inside PO */}
            <div className="pt-3">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Items Procured:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {po.items.map((item, idx) => (
                  <div key={idx} className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-slate-800 truncate max-w-[180px]">{item.name}</p>
                      <p className="text-[10px] text-slate-400">{item.quantity} {item.unit} @ ${item.unitPrice.toFixed(2)}</p>
                    </div>
                    <span className="font-bold text-slate-900">${item.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              {po.notes && (
                <p className="text-[11px] text-slate-500 italic mt-2.5">
                  Note: {po.notes}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create Purchase Order Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl max-w-4xl w-full flex flex-col shadow-2xl border border-slate-200 max-h-[90vh] overflow-hidden">
            <div className="shrink-0 p-5 px-6 border-b border-slate-100 flex items-center justify-between bg-white z-10">
              <h3 className="font-bold text-base text-slate-900">
                New Purchase Stock Order / <span className="font-khmer text-emerald-700 text-sm">បញ្ជាទិញចូលស្តុក</span>
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePO} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Select Supplier *</label>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none"
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.country})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Order Date *</label>
                  <input
                    type="date"
                    required
                    value={poDate}
                    onChange={(e) => setPoDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-2 border border-slate-200 p-3 rounded-xl bg-slate-50">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Order Line Items</span>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-xs text-emerald-700 font-bold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Another Item
                  </button>
                </div>

                {orderItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 bg-white p-2.5 rounded-lg border border-slate-200 items-center">
                    <div className="col-span-5">
                      <label className="text-[10px] text-slate-400 block mb-0.5">Stock Item</label>
                      <select
                        value={item.stockItemId}
                        onChange={(e) => handleUpdateItemRow(index, 'stockItemId', e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs"
                      >
                        {stockItems.map(s => (
                          <option key={s.id} value={s.id}>{s.nameEn} ({s.unit})</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="text-[10px] text-slate-400 block mb-0.5">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        step="any"
                        value={item.quantity}
                        onChange={(e) => handleUpdateItemRow(index, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-bold"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="text-[10px] text-slate-400 block mb-0.5">Price ($)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => handleUpdateItemRow(index, 'unitPrice', parseFloat(e.target.value) || 0)}
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
                        onClick={() => handleRemoveItemRow(index)}
                        className="text-slate-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                <div className="flex justify-between items-center pt-2 px-1 text-sm font-bold text-slate-900">
                  <span>Grand Total:</span>
                  <span className="text-emerald-800 text-base">${totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Status</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="paid">Paid in Full</option>
                    <option value="partial">Partial Deposit (50%)</option>
                    <option value="unpaid">Unpaid (Credit / Net 30)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="bank_transfer">ABA Bank Transfer</option>
                    <option value="cash">Cash on Delivery</option>
                    <option value="credit">Trade Credit / Account</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Procurement Notes / Shipping Ref</label>
                <input
                  type="text"
                  placeholder="e.g. Air freight tracking, batch lot #, delivery instructions"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none"
                />
              </div>
              </div>

              {/* Frozen Action Buttons Footer */}
              <div className="shrink-0 px-6 py-4 border-t border-slate-200/80 bg-slate-50/95 backdrop-blur-xs flex items-center justify-end gap-3 z-10 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#164e22] hover:bg-[#123e1b] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors"
                >
                  Confirm & Receive Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
