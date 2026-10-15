import React, { useState, useMemo } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  Filter, 
  Download, 
  Printer, 
  QrCode, 
  Barcode, 
  Edit3, 
  Trash2, 
  SlidersHorizontal, 
  Boxes, 
  Tag, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  DollarSign, 
  Sparkles, 
  X, 
  ArrowUpDown, 
  LayoutGrid, 
  List, 
  Eye, 
  Warehouse, 
  Building2, 
  ShieldCheck, 
  Sprout, 
  Flower2, 
  RefreshCw 
} from 'lucide-react';
import { useI18n } from '../../locales/i18nContext';
import { useFarm } from '../../context/FarmContext';
import { StockItem, StockCategory } from '../../types/melon';

export const ItemManagementView: React.FC = () => {
  const { language } = useI18n();
  const { 
    stockItems, 
    addStockItem, 
    updateStockItem, 
    deleteStockItem, 
    adjustStockQuantity, 
    suppliers 
  } = useFarm();

  // Search & Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [sortBy, setSortBy] = useState<'name' | 'sku' | 'quantity' | 'cost' | 'margin'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modals State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [viewingDetailItem, setViewingDetailItem] = useState<StockItem | null>(null);
  const [adjustingItem, setAdjustingItem] = useState<StockItem | null>(null);
  const [adjustDelta, setAdjustDelta] = useState<number>(10);
  const [adjustType, setAdjustType] = useState<'add' | 'remove'>('add');
  const [adjustReason, setAdjustReason] = useState<string>('restock');
  const [showPrintLabelsModal, setShowPrintLabelsModal] = useState(false);
  const [selectedLabelItem, setSelectedLabelItem] = useState<StockItem | null>(null);

  // New Item Form State
  const [formData, setFormData] = useState({
    sku: `SKU-${Date.now().toString().slice(-5)}`,
    barcode: `885${Math.floor(1000000000 + Math.random() * 9000000000)}`,
    nameEn: '',
    nameKm: '',
    category: 'fertilizer' as StockCategory,
    unit: 'bag (25kg)',
    quantity: 10,
    minThreshold: 5,
    maxThreshold: 100,
    unitCost: 25.0,
    sellingPrice: 35.0,
    location: 'Main Warehouse - Bay 1',
    supplierId: '',
    supplierName: '',
    dosageOrUsage: '',
    brand: '',
    notes: '',
    isSaleItem: false,
  });

  const categories: { key: string; labelEn: string; labelKm: string; icon: string }[] = [
    { key: 'all', labelEn: 'All Categories', labelKm: 'គ្រប់ប្រភេទ', icon: '📦' },
    { key: 'seeds', labelEn: 'Seeds & Genetics', labelKm: 'គ្រាប់ពូជ', icon: '🌱' },
    { key: 'fertilizer', labelEn: 'Fertilizers & Nutrients', labelKm: 'ជី និងសារធាតុចិញ្ចឹម', icon: '🧪' },
    { key: 'pesticide', labelEn: 'Bio-Protection', labelKm: 'ថ្នាំការពារជីវសាស្ត្រ', icon: '🛡️' },
    { key: 'growing_media', labelEn: 'Growing Media / Cocopeat', labelKm: 'ស្រទាប់ដាំ / កាកដូង', icon: '🥥' },
    { key: 'tools_irrigation', labelEn: 'Irrigation & Hardware', labelKm: 'ប្រព័ន្ធស្រោចស្រព', icon: '💧' },
    { key: 'packaging', labelEn: 'Boxes & Packaging', labelKm: 'សម្ភារៈវេចខ្ចប់', icon: '🎁' },
    { key: 'harvest_produce', labelEn: 'Harvested Melons', labelKm: 'ផ្លែឪឡឹកប្រមូលផល', icon: '🍈' },
  ];

  // Filtered & Sorted Items
  const filteredItems = useMemo(() => {
    return stockItems
      .filter((item) => {
        const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
        const matchesStatus = 
          selectedStatus === 'all' || 
          (selectedStatus === 'low_stock' && item.quantity <= item.minThreshold && item.quantity > 0) ||
          (selectedStatus === 'out_of_stock' && item.quantity === 0) ||
          (selectedStatus === 'in_stock' && item.quantity > item.minThreshold) ||
          (selectedStatus === 'saleable' && item.isSaleItem);

        const q = searchQuery.toLowerCase().trim();
        const matchesQuery = 
          !q ||
          item.nameEn.toLowerCase().includes(q) ||
          item.nameKm.toLowerCase().includes(q) ||
          item.sku.toLowerCase().includes(q) ||
          (item.barcode && item.barcode.toLowerCase().includes(q)) ||
          item.location.toLowerCase().includes(q) ||
          (item.brand && item.brand.toLowerCase().includes(q)) ||
          (item.supplierName && item.supplierName.toLowerCase().includes(q));

        return matchesCategory && matchesStatus && matchesQuery;
      })
      .sort((a, b) => {
        let valA: string | number = '';
        let valB: string | number = '';

        if (sortBy === 'name') {
          valA = language === 'km' ? a.nameKm : a.nameEn;
          valB = language === 'km' ? b.nameKm : b.nameEn;
        } else if (sortBy === 'sku') {
          valA = a.sku;
          valB = b.sku;
        } else if (sortBy === 'quantity') {
          valA = a.quantity;
          valB = b.quantity;
        } else if (sortBy === 'cost') {
          valA = a.unitCost;
          valB = b.unitCost;
        } else if (sortBy === 'margin') {
          const marginA = a.sellingPrice ? ((a.sellingPrice - a.unitCost) / a.sellingPrice) : 0;
          const marginB = b.sellingPrice ? ((b.sellingPrice - b.unitCost) / b.sellingPrice) : 0;
          valA = marginA;
          valB = marginB;
        }

        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return sortOrder === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
      });
  }, [stockItems, selectedCategory, selectedStatus, searchQuery, sortBy, sortOrder, language]);

  // Aggregate Metrics
  const totalCatalogCount = stockItems.length;
  const totalStockValue = stockItems.reduce((acc, i) => acc + (i.quantity * i.unitCost), 0);
  const lowStockItems = stockItems.filter((i) => i.quantity <= i.minThreshold && i.quantity > 0);
  const outOfStockItems = stockItems.filter((i) => i.quantity === 0);
  const saleableItems = stockItems.filter((i) => i.isSaleItem);

  const averageMargin = useMemo(() => {
    const withSelling = stockItems.filter((i) => i.sellingPrice && i.sellingPrice > i.unitCost);
    if (withSelling.length === 0) return 35;
    const sumMargin = withSelling.reduce((acc, i) => {
      const margin = ((i.sellingPrice! - i.unitCost) / i.sellingPrice!) * 100;
      return acc + margin;
    }, 0);
    return Math.round(sumMargin / withSelling.length);
  }, [stockItems]);

  // Handlers
  const handleOpenAddModal = () => {
    setFormData({
      sku: `SKU-${Date.now().toString().slice(-5)}`,
      barcode: `885${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      nameEn: '',
      nameKm: '',
      category: 'fertilizer',
      unit: 'bag (25kg)',
      quantity: 10,
      minThreshold: 5,
      maxThreshold: 100,
      unitCost: 25.0,
      sellingPrice: 35.0,
      location: 'Main Warehouse - Bay 1',
      supplierId: suppliers[0]?.id || '',
      supplierName: suppliers[0]?.name || '',
      dosageOrUsage: '',
      brand: '',
      notes: '',
      isSaleItem: false,
    });
    setShowAddModal(true);
  };

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nameEn.trim()) return;

    const matchedSupplier = suppliers.find((s) => s.id === formData.supplierId);

    const status: StockItem['status'] = 
      formData.quantity === 0 
        ? 'out_of_stock' 
        : (formData.quantity <= formData.minThreshold ? 'low_stock' : 'in_stock');

    addStockItem({
      ...formData,
      supplierName: matchedSupplier ? matchedSupplier.name : formData.supplierName,
      status,
    });

    setShowAddModal(false);
  };

  const handleOpenEditModal = (item: StockItem) => {
    setEditingItem(item);
  };

  const handleUpdateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const status: StockItem['status'] = 
      editingItem.quantity === 0 
        ? 'out_of_stock' 
        : (editingItem.quantity <= editingItem.minThreshold ? 'low_stock' : 'in_stock');

    updateStockItem({
      ...editingItem,
      status,
    });

    setEditingItem(null);
  };

  const handleConfirmAdjust = () => {
    if (!adjustingItem || adjustDelta <= 0) return;
    const delta = adjustType === 'add' ? adjustDelta : -adjustDelta;
    adjustStockQuantity(adjustingItem.id, delta, adjustReason);
    setAdjustingItem(null);
  };

  const exportCatalogCSV = () => {
    const headers = ['SKU', 'Barcode', 'Name EN', 'Name KM', 'Category', 'Unit', 'Qty On Hand', 'Min Alert', 'Unit Cost (USD)', 'Selling Price (USD)', 'Location', 'Supplier', 'Status'];
    const rows = filteredItems.map((item) => [
      item.sku,
      item.barcode || '',
      `"${item.nameEn.replace(/"/g, '""')}"`,
      `"${item.nameKm.replace(/"/g, '""')}"`,
      item.category,
      item.unit,
      item.quantity,
      item.minThreshold,
      item.unitCost.toFixed(2),
      item.sellingPrice ? item.sellingPrice.toFixed(2) : '',
      `"${item.location.replace(/"/g, '""')}"`,
      `"${(item.supplierName || '').replace(/"/g, '""')}"`,
      item.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MelonPro_Item_Catalog_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header with Breadcrumb & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 mb-1">
            <Tag className="w-4 h-4 text-emerald-700" />
            <span>Master Data Catalog · Item Management</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Item Management</span>
            <span className="text-sm font-normal text-slate-400 font-khmer">/ ការគ្រប់គ្រងមុខទំនិញ</span>
          </h1>
          <p className="text-xs text-slate-500 font-khmer mt-0.5">
            {language === 'km' 
              ? 'គ្រប់គ្រងបញ្ជីមុខទំនិញកសិកម្ម គ្រាប់ពូជ ជី ថ្នាំជីវសាស្ត្រ សម្ភារៈស្រោចស្រព និងផលិតផលផ្លែឪឡឹក' 
              : 'Centralized master catalog for farm inputs, seeds, fertilizers, hardware, packaging, and harvested produce'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={exportCatalogCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors shadow-2xs"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => {
              setSelectedLabelItem(filteredItems[0] || null);
              setShowPrintLabelsModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors shadow-2xs"
            title="Print Barcode Labels"
          >
            <Barcode className="w-4 h-4 text-slate-600" />
            <span>Barcode Labels</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#164e22] hover:bg-[#123e1b] text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add New Item / <span className="font-khmer font-normal">បន្ថែមទំនិញ</span></span>
          </button>
        </div>
      </div>

      {/* 2. Key Metrics Bar (5 Metric Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Total SKUs */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span className="font-semibold text-slate-700">Total Items</span>
            <Boxes className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-900 font-mono tabular-nums">{totalCatalogCount}</span>
            <span className="text-xs text-slate-500 font-khmer">មុខទំនិញ</span>
          </div>
          <span className="text-[10px] text-slate-400 font-khmer mt-1">ក្នុងប្រព័ន្ធទិន្នន័យមេ</span>
        </div>

        {/* Card 2: Inventory Value */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span className="font-semibold text-slate-700">Catalog Value</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono tabular-nums">
              ${totalStockValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
            <span className="text-xs text-slate-500">USD</span>
          </div>
          <span className="text-[10px] text-slate-400 font-khmer mt-1">តម្លៃថ្លៃដើមសរុប</span>
        </div>

        {/* Card 3: Average Profit Margin */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span className="font-semibold text-slate-700">Avg. Margin</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-emerald-700 font-mono tabular-nums">+{averageMargin}%</span>
            <span className="text-xs text-emerald-600">ROI</span>
          </div>
          <span className="text-[10px] text-slate-400 font-khmer mt-1">រឹមប្រាក់ចំណេញលើការលក់</span>
        </div>

        {/* Card 4: Low Stock Alert */}
        <div 
          onClick={() => setSelectedStatus(selectedStatus === 'low_stock' ? 'all' : 'low_stock')}
          className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer shadow-2xs flex flex-col justify-between ${
            selectedStatus === 'low_stock' ? 'border-amber-400 ring-2 ring-amber-100 bg-amber-50/20' : 'border-slate-200/90 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span className="font-semibold text-amber-800">Low Stock Alert</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-amber-600 font-mono tabular-nums">{lowStockItems.length}</span>
            <span className="text-xs font-bold text-amber-700 font-khmer">មុខទំនិញ</span>
          </div>
          <span className="text-[10px] text-amber-600 font-khmer mt-1">ត្រូវការបញ្ជាទិញបន្ថែម</span>
        </div>

        {/* Card 5: Saleable Products */}
        <div 
          onClick={() => setSelectedStatus(selectedStatus === 'saleable' ? 'all' : 'saleable')}
          className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer shadow-2xs flex flex-col justify-between col-span-2 sm:col-span-1 ${
            selectedStatus === 'saleable' ? 'border-emerald-500 ring-2 ring-emerald-100 bg-emerald-50/20' : 'border-slate-200/90 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span className="font-semibold text-slate-700">Commercial Sales</span>
            <Tag className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-900 font-mono tabular-nums">{saleableItems.length}</span>
            <span className="text-xs text-slate-500 font-khmer">ផលិតផល</span>
          </div>
          <span className="text-[10px] text-slate-400 font-khmer mt-1">អាចលក់ជូនអតិថិជនបាន</span>
        </div>
      </div>

      {/* 3. Search, Filter Pills & View Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder={language === 'km' ? 'ស្វែងរកតាម SKU, ឈ្មោះទំនិញ, Barcode, ទីតាំង...' : 'Search by SKU, item name, barcode, brand, shelf...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400 font-khmer"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Controls: Status Filter, Sorting, View Toggle */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Selector */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">All Statuses / គ្រប់ស្ថានភាព</option>
              <option value="in_stock">In Stock / មានក្នុងស្តុក</option>
              <option value="low_stock">Low Stock Alert / ជិតអស់ស្តុក</option>
              <option value="out_of_stock">Out of Stock / អស់ពីស្តុក</option>
              <option value="saleable">Saleable Only / សម្រាប់លក់</option>
            </select>

            {/* Sort Selector */}
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 text-xs">
              <span className="text-slate-400 mr-1.5">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer pr-1"
              >
                <option value="name">Name</option>
                <option value="sku">SKU Code</option>
                <option value="quantity">Stock Qty</option>
                <option value="cost">Unit Cost</option>
                <option value="margin">Profit Margin</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-0.5 text-slate-500 hover:text-slate-800 ml-1 rounded"
                title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/80">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'table' ? 'bg-white text-emerald-800 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Table View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'grid' ? 'bg-white text-emerald-800 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Grid Cards View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Horizontal Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-medium transition-all shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs font-semibold'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/60'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{language === 'km' ? cat.labelKm : cat.labelEn}</span>
                {cat.key !== 'all' && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                    isSelected ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {stockItems.filter((i) => i.category === cat.key).length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Main Item Viewport: Table or Grid */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Item & SKU</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3 text-right">Stock On Hand</th>
                  <th className="py-3 px-3 text-right">Cost Price</th>
                  <th className="py-3 px-3 text-right">Selling Price</th>
                  <th className="py-3 px-3 text-right">Gross Margin</th>
                  <th className="py-3 px-3">Storage Bin</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Boxes className="w-8 h-8 text-slate-300" />
                        <p className="font-semibold text-sm text-slate-600">No items match your criteria</p>
                        <p className="text-xs text-slate-400 font-khmer">ពុំមានមុខទំនិញដែលត្រូវនឹងការស្វែងរកនេះទេ</p>
                        <button
                          onClick={handleOpenAddModal}
                          className="mt-2 px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-bold border border-emerald-200 hover:bg-emerald-100"
                        >
                          + Add New Item
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const isLow = item.quantity <= item.minThreshold && item.quantity > 0;
                    const isOut = item.quantity === 0;
                    const margin = item.sellingPrice ? Math.round(((item.sellingPrice - item.unitCost) / item.sellingPrice) * 100) : null;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors group">
                        {/* Item & SKU */}
                        <td className="py-3 px-4">
                          <div className="flex items-start gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100/80 font-bold text-xs mt-0.5">
                              {item.category === 'seeds' && '🌱'}
                              {item.category === 'fertilizer' && '🧪'}
                              {item.category === 'pesticide' && '🛡️'}
                              {item.category === 'growing_media' && '🥥'}
                              {item.category === 'tools_irrigation' && '💧'}
                              {item.category === 'packaging' && '🎁'}
                              {item.category === 'harvest_produce' && '🍈'}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 group-hover:text-emerald-800 transition-colors flex items-center gap-1.5 flex-wrap">
                                <span>{language === 'km' ? item.nameKm : item.nameEn}</span>
                                {item.isSaleItem && (
                                  <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1 py-0.2 rounded font-mono">
                                    For Sale
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 font-khmer truncate">
                                {language === 'km' ? item.nameEn : item.nameKm}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 text-[10px] font-mono text-slate-400">
                                <span className="bg-slate-100 px-1.5 py-0.2 rounded text-slate-600 font-semibold">{item.sku}</span>
                                {item.barcode && <span>BAR: {item.barcode}</span>}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-3">
                          <span className="text-xs text-slate-600 font-medium capitalize block">
                            {item.category.replace('_', ' ')}
                          </span>
                          {item.brand && (
                            <span className="text-[10px] text-slate-400 block truncate">
                              {item.brand}
                            </span>
                          )}
                        </td>

                        {/* Stock On Hand */}
                        <td className="py-3 px-3 text-right">
                          <div className="font-bold text-sm text-slate-900 font-mono tabular-nums">
                            {item.quantity} <span className="text-xs font-normal text-slate-500">{item.unit}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-khmer">
                            Min: {item.minThreshold} {item.unit}
                          </div>
                        </td>

                        {/* Cost Price */}
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-700 tabular-nums">
                          ${item.unitCost.toFixed(2)}
                        </td>

                        {/* Selling Price */}
                        <td className="py-3 px-3 text-right font-mono tabular-nums">
                          {item.sellingPrice ? (
                            <span className="font-bold text-slate-900">${item.sellingPrice.toFixed(2)}</span>
                          ) : (
                            <span className="text-slate-400 text-xs">—</span>
                          )}
                        </td>

                        {/* Gross Margin */}
                        <td className="py-3 px-3 text-right font-mono tabular-nums">
                          {margin !== null ? (
                            <span className={`font-bold px-1.5 py-0.5 rounded text-[11px] ${
                              margin >= 40 
                                ? 'bg-emerald-50 text-emerald-700' 
                                : margin >= 20 
                                  ? 'bg-amber-50 text-amber-700' 
                                  : 'bg-rose-50 text-rose-700'
                            }`}>
                              +{margin}%
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">—</span>
                          )}
                        </td>

                        {/* Storage Bin */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1 text-slate-600 text-xs truncate max-w-[140px]">
                            <Warehouse className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{item.location}</span>
                          </div>
                          {item.supplierName && (
                            <span className="text-[10px] text-slate-400 block truncate max-w-[140px]">
                              {item.supplierName}
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3 text-center">
                          {isOut ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              Out of Stock
                            </span>
                          ) : isLow ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              Low Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              In Stock
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setViewingDetailItem(item)}
                              className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="View Details & Barcode"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setAdjustingItem(item);
                                setAdjustDelta(10);
                                setAdjustType('add');
                              }}
                              className="p-1.5 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Quick Stock Adjustment"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(item)}
                              className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit Master Item"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to remove item ${item.sku}?`)) {
                                  deleteStockItem(item.id);
                                }
                              }}
                              className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete Item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>Showing {filteredItems.length} of {stockItems.length} master items</span>
            <span className="font-khmer text-slate-400">ទិន្នន័យស្តុកកសិកម្ម MelonPro Master Catalog</span>
          </div>
        </div>
      ) : (
        /* Visual Grid Cards View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map((item) => {
            const isLow = item.quantity <= item.minThreshold && item.quantity > 0;
            const isOut = item.quantity === 0;
            const margin = item.sellingPrice ? Math.round(((item.sellingPrice - item.unitCost) / item.sellingPrice) * 100) : null;

            return (
              <div 
                key={item.id}
                className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top Bar: SKU, Category & Actions */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      {item.sku}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 capitalize">
                      {item.category.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Title En & Km */}
                  <h3 className="font-bold text-sm text-slate-900 group-hover:text-emerald-800 transition-colors leading-snug">
                    {language === 'km' ? item.nameKm : item.nameEn}
                  </h3>
                  <p className="text-xs text-slate-400 font-khmer mt-0.5 line-clamp-1">
                    {language === 'km' ? item.nameEn : item.nameKm}
                  </p>

                  {/* Barcode representation */}
                  {item.barcode && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span className="flex items-center gap-1">
                        <Barcode className="w-3.5 h-3.5 text-slate-500" />
                        {item.barcode}
                      </span>
                      <span className="truncate max-w-[120px]">{item.location}</span>
                    </div>
                  )}

                  {/* Pricing & Margin */}
                  <div className="mt-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-khmer">ថ្លៃដើម (Cost)</span>
                      <span className="font-extrabold text-slate-800 font-mono">${item.unitCost.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-khmer">ថ្លៃលក់ (Price)</span>
                      <span className="font-extrabold text-emerald-700 font-mono">
                        {item.sellingPrice ? `$${item.sellingPrice.toFixed(2)}` : '—'}
                      </span>
                    </div>
                  </div>

                  {/* Stock Bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium text-slate-500">Stock:</span>
                      <span className="font-bold font-mono text-slate-900">
                        {item.quantity} / {item.minThreshold} {item.unit}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          isOut ? 'bg-rose-500 w-0' : isLow ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(10, (item.quantity / (item.minThreshold * 2.5)) * 100))}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setViewingDetailItem(item)}
                    className="flex-1 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold text-center border border-slate-200 transition-colors"
                  >
                    View Specs
                  </button>
                  <button
                    onClick={() => {
                      setAdjustingItem(item);
                      setAdjustDelta(10);
                      setAdjustType('add');
                    }}
                    className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-semibold border border-amber-200 transition-colors"
                    title="Quick Restock"
                  >
                    + Stock
                  </button>
                  <button
                    onClick={() => handleOpenEditModal(item)}
                    className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit Item"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. MODAL: Add New Item Master                             */}
      {/* ========================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full flex flex-col shadow-2xl border border-slate-200 max-h-[90vh] overflow-hidden">
            {/* Frozen Top Header */}
            <div className="shrink-0 p-5 px-6 border-b border-slate-100 flex items-center justify-between bg-white z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
                  <Plus className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Add New Master Item / <span className="font-khmer text-emerald-800">បន្ថែមមុខទំនិញថ្មី</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 font-khmer">បញ្ចូលទំនិញទៅក្នុងប្រព័ន្ធទិន្នន័យមេ</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="flex flex-col flex-1 overflow-hidden">
              {/* Scrollable Form Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Row 1: SKU & Barcode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    SKU Code / <span className="font-khmer font-normal">កូដទំនិញ</span> *
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      required
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono uppercase font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, sku: `SKU-${Date.now().toString().slice(-5)}` })}
                      className="px-2 py-1 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-mono font-semibold"
                    >
                      Gen
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Barcode (EAN / UPC) / <span className="font-khmer font-normal">បាកូដ</span>
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={formData.barcode}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                      className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      placeholder="885..."
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, barcode: `885${Math.floor(1000000000 + Math.random() * 9000000000)}` })}
                      className="px-2 py-1 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-mono font-semibold"
                    >
                      Gen
                    </button>
                  </div>
                </div>
              </div>

              {/* Row 2: Names (En & Km) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Item Name (English) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nameEn}
                    onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    placeholder="e.g. Potassium Sulfate 0-0-50"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Item Name (Khmer) / <span className="font-khmer font-normal">ឈ្មោះជាភាសាខ្មែរ</span>
                  </label>
                  <input
                    type="text"
                    value={formData.nameKm}
                    onChange={(e) => setFormData({ ...formData, nameKm: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-khmer focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    placeholder="ឧទាហរណ៍៖ ជីប៉ូតាស្យូមស៊ុលផាត ០-០-៥០"
                  />
                </div>
              </div>

              {/* Row 3: Category, Brand, Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as StockCategory })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 capitalize"
                  >
                    <option value="seeds">Seeds & Genetics</option>
                    <option value="fertilizer">Fertilizers & Nutrients</option>
                    <option value="pesticide">Bio-Protection</option>
                    <option value="growing_media">Growing Media / Cocopeat</option>
                    <option value="tools_irrigation">Irrigation & Hardware</option>
                    <option value="packaging">Packaging & Boxes</option>
                    <option value="harvest_produce">Harvested Melons</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Brand / Maker</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                    placeholder="e.g. Haifa / Yara / Sakata"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Unit of Measure (UoM) *</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="kg">kg (គីឡូក្រាម)</option>
                    <option value="bag (25kg)">bag 25kg (បាវ)</option>
                    <option value="pail (5kg)">pail 5kg (ធុង)</option>
                    <option value="bottle (1L)">bottle 1L (ដប)</option>
                    <option value="pack (1000 seeds)">pack (កញ្ចប់ ១០០០គ្រាប់)</option>
                    <option value="pcs">pcs (ដុំ / ក្បាល)</option>
                    <option value="slab">slab (បន្ទះដូងដាំ)</option>
                    <option value="box">box (ប្រអប់ / កេស)</option>
                    <option value="roll">roll (ដុំខ្សែ/ទុយោ)</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Financials & Stock Quantities */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Unit Cost ($ USD) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.unitCost}
                    onChange={(e) => setFormData({ ...formData, unitCost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1.5 text-xs font-mono font-bold border border-slate-200 rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Selling Price ($ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1.5 text-xs font-mono font-bold text-emerald-700 border border-slate-200 rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Initial Quantity *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1.5 text-xs font-mono font-bold border border-slate-200 rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Min Alert Level *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.minThreshold}
                    onChange={(e) => setFormData({ ...formData, minThreshold: parseInt(e.target.value) || 1 })}
                    className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-200 rounded-lg bg-white"
                  />
                </div>
              </div>

              {/* Row 5: Storage Location & Preferred Supplier */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Storage Location / <span className="font-khmer font-normal">ទីតាំងឃ្លាំងស្តុក</span>
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                    placeholder="e.g. Main Warehouse - Bay 2"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Preferred Supplier / <span className="font-khmer font-normal">អ្នកផ្គត់ផ្គង់</span>
                  </label>
                  <select
                    value={formData.supplierId}
                    onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="">Select Supplier...</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 6: Dosage / Application Instructions & Sale Flag */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Dosage, Mixing Rate & Agronomy Instructions / <span className="font-khmer font-normal">កម្រិតប្រើប្រាស់</span>
                </label>
                <input
                  type="text"
                  value={formData.dosageOrUsage}
                  onChange={(e) => setFormData({ ...formData, dosageOrUsage: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-khmer"
                  placeholder="ឧទាហរណ៍៖ លាយ ៣ម.ល ក្នុងទឹក ១លីត្រ បាញ់ពេលព្រលឹម"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isSaleItemCheck"
                  checked={formData.isSaleItem}
                  onChange={(e) => setFormData({ ...formData, isSaleItem: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="isSaleItemCheck" className="text-xs font-bold text-slate-800 cursor-pointer">
                  Mark as Available for Commercial Sale / Invoice (អាចលក់ចេញបាន)
                </label>
              </div>
              </div>

              {/* Frozen Action Buttons Footer */}
              <div className="shrink-0 px-6 py-4 border-t border-slate-200/80 bg-slate-50/95 backdrop-blur-xs flex items-center justify-end gap-3 z-10 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#164e22] hover:bg-[#123e1b] text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Save Master Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. MODAL: Edit Item Master                                */}
      {/* ========================================================= */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full flex flex-col shadow-2xl border border-slate-200 max-h-[90vh] overflow-hidden">
            {/* Frozen Top Header */}
            <div className="shrink-0 p-5 px-6 border-b border-slate-100 flex items-center justify-between bg-white z-10">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Edit Master Item / <span className="font-khmer text-blue-700">កែសម្រួលទំនិញ</span>: {editingItem.sku}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateItem} className="flex flex-col flex-1 overflow-hidden">
              {/* Scrollable Form Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Item Name (English) *</label>
                  <input
                    type="text"
                    required
                    value={editingItem.nameEn}
                    onChange={(e) => setEditingItem({ ...editingItem, nameEn: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Item Name (Khmer)</label>
                  <input
                    type="text"
                    value={editingItem.nameKm}
                    onChange={(e) => setEditingItem({ ...editingItem, nameKm: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-khmer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Barcode</label>
                  <input
                    type="text"
                    value={editingItem.barcode || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, barcode: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Brand</label>
                  <input
                    type="text"
                    value={editingItem.brand || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, brand: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={editingItem.category}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value as StockCategory })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="seeds">Seeds & Genetics</option>
                    <option value="fertilizer">Fertilizers & Nutrients</option>
                    <option value="pesticide">Bio-Protection</option>
                    <option value="growing_media">Growing Media / Cocopeat</option>
                    <option value="tools_irrigation">Irrigation & Hardware</option>
                    <option value="packaging">Packaging & Boxes</option>
                    <option value="harvest_produce">Harvested Melons</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Cost Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingItem.unitCost}
                    onChange={(e) => setEditingItem({ ...editingItem, unitCost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1.5 text-xs font-mono font-bold border border-slate-200 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Selling Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingItem.sellingPrice || 0}
                    onChange={(e) => setEditingItem({ ...editingItem, sellingPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1.5 text-xs font-mono font-bold text-emerald-700 border border-slate-200 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Stock On Hand</label>
                  <input
                    type="number"
                    value={editingItem.quantity}
                    onChange={(e) => setEditingItem({ ...editingItem, quantity: parseInt(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1.5 text-xs font-mono font-bold border border-slate-200 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Min Threshold</label>
                  <input
                    type="number"
                    value={editingItem.minThreshold}
                    onChange={(e) => setEditingItem({ ...editingItem, minThreshold: parseInt(e.target.value) || 1 })}
                    className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-200 rounded-lg bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Location</label>
                  <input
                    type="text"
                    value={editingItem.location}
                    onChange={(e) => setEditingItem({ ...editingItem, location: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Dosage / Instructions</label>
                  <input
                    type="text"
                    value={editingItem.dosageOrUsage || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, dosageOrUsage: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-khmer"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editIsSaleItem"
                  checked={!!editingItem.isSaleItem}
                  onChange={(e) => setEditingItem({ ...editingItem, isSaleItem: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="editIsSaleItem" className="text-xs font-bold text-slate-800 cursor-pointer">
                  Available for Commercial Sale & Invoices
                </label>
              </div>
              </div>

              {/* Frozen Action Buttons Footer */}
              <div className="shrink-0 px-6 py-4 border-t border-slate-200/80 bg-slate-50/95 backdrop-blur-xs flex items-center justify-end gap-3 z-10 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Update Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 7. MODAL: View Item Detail & Barcode Specs               */}
      {/* ========================================================= */}
      {viewingDetailItem && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-700" />
                <h3 className="text-base font-bold text-slate-900">
                  Item Specifications & Barcode
                </h3>
              </div>
              <button
                onClick={() => setViewingDetailItem(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-4">
              {/* Printable Barcode Card Simulation */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center flex flex-col items-center justify-center">
                <div className="text-[10px] uppercase tracking-widest font-mono text-slate-400">
                  MelonPro Master Inventory
                </div>
                <div className="font-extrabold text-sm text-slate-900 mt-1">
                  {viewingDetailItem.nameEn}
                </div>
                <div className="text-xs text-slate-500 font-khmer mt-0.5">
                  {viewingDetailItem.nameKm}
                </div>

                {/* Barcode Graphic Lines */}
                <div className="my-3 py-2 px-4 bg-white rounded-lg border border-slate-200 shadow-2xs flex flex-col items-center">
                  <div className="flex items-end gap-[2px] h-12 w-48 justify-center">
                    {[3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5, 8, 9, 7, 9, 3, 2, 3, 8, 4, 6, 2, 6, 4, 3, 3, 8, 3, 2, 7].map((h, i) => (
                      <span 
                        key={i} 
                        className="bg-slate-900 w-[2px] rounded-xs"
                        style={{ height: `${h * 10}%` }}
                      />
                    ))}
                  </div>
                  <div className="text-xs font-mono font-bold tracking-widest text-slate-800 mt-1">
                    {viewingDetailItem.barcode || viewingDetailItem.sku}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono font-bold text-slate-700">
                  <span>SKU: {viewingDetailItem.sku}</span>
                  <span>·</span>
                  <span className="text-emerald-700">
                    {viewingDetailItem.sellingPrice ? `$${viewingDetailItem.sellingPrice.toFixed(2)} USD` : 'Internal Input'}
                  </span>
                </div>
              </div>

              {/* Data Breakdown */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] text-slate-400 block font-khmer">បរិមាណស្តុកបច្ចុប្បន្ន</span>
                  <span className="font-bold text-slate-900 font-mono text-sm">
                    {viewingDetailItem.quantity} {viewingDetailItem.unit}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] text-slate-400 block font-khmer">ទីតាំងឃ្លាំងស្តុក</span>
                  <span className="font-bold text-slate-900 truncate block">
                    {viewingDetailItem.location}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] text-slate-400 block font-khmer">ថ្លៃដើមទិញចូល (Cost)</span>
                  <span className="font-bold text-slate-900 font-mono">
                    ${viewingDetailItem.unitCost.toFixed(2)} / {viewingDetailItem.unit}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] text-slate-400 block font-khmer">រឹមប្រាក់ចំណេញ (Margin)</span>
                  <span className="font-bold text-emerald-700 font-mono">
                    {viewingDetailItem.sellingPrice ? `+${Math.round(((viewingDetailItem.sellingPrice - viewingDetailItem.unitCost) / viewingDetailItem.sellingPrice) * 100)}%` : 'N/A'}
                  </span>
                </div>
              </div>

              {viewingDetailItem.dosageOrUsage && (
                <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 text-xs">
                  <span className="font-bold text-emerald-900 block mb-0.5">Usage & Application Instructions:</span>
                  <p className="text-emerald-800 leading-relaxed font-khmer">
                    {viewingDetailItem.dosageOrUsage}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 shrink-0">
              <button
                onClick={() => {
                  setSelectedLabelItem(viewingDetailItem);
                  setViewingDetailItem(null);
                  setShowPrintLabelsModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Single Tag</span>
              </button>
              <button
                onClick={() => setViewingDetailItem(null)}
                className="px-4 py-1.5 bg-[#164e22] text-white rounded-xl text-xs font-bold hover:bg-[#123e1b]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 8. MODAL: Fast Stock Adjustment                           */}
      {/* ========================================================= */}
      {adjustingItem && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full flex flex-col shadow-2xl border border-slate-200 max-h-[90vh] overflow-hidden">
            <div className="shrink-0 p-5 px-6 border-b border-slate-100 flex items-center justify-between bg-white z-10">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Adjust Stock Quantity
                </h3>
              </div>
              <button
                onClick={() => setAdjustingItem(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div className="font-bold text-slate-900">{adjustingItem.nameEn}</div>
                <div className="text-slate-500 font-khmer mt-0.5">{adjustingItem.nameKm}</div>
                <div className="mt-2 text-xs flex items-center justify-between font-mono">
                  <span className="text-slate-400">Current Balance:</span>
                  <span className="font-extrabold text-slate-800">{adjustingItem.quantity} {adjustingItem.unit}</span>
                </div>
              </div>

              {/* Adjust Type */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustType('add')}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                    adjustType === 'add'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  + Add / Restock (ទិញចូល)
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType('remove')}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                    adjustType === 'remove'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  – Remove / Consume (ដកចេញ)
                </button>
              </div>

              {/* Quantity */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Quantity ({adjustingItem.unit}) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjustDelta}
                  onChange={(e) => setAdjustDelta(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 text-base font-bold font-mono border border-slate-200 rounded-xl"
                />
              </div>

              {/* Reason */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Adjustment Reason *</label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
                >
                  <option value="restock">Direct Restock / Purchase Delivery</option>
                  <option value="cycle_usage">Greenhouse Cycle Usage / Fertigation</option>
                  <option value="inventory_audit">Inventory Audit / Physical Count Variance</option>
                  <option value="damage_waste">Damaged, Spilled or Expired Material</option>
                  <option value="return">Customer Return / Grade Exchange</option>
                </select>
              </div>

              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/60 text-xs flex items-center justify-between font-mono">
                <span className="text-amber-800">New Resulting Balance:</span>
                <span className="font-extrabold text-amber-900 text-sm">
                  {adjustType === 'add' ? adjustingItem.quantity + adjustDelta : Math.max(0, adjustingItem.quantity - adjustDelta)} {adjustingItem.unit}
                </span>
              </div>
            </div>

            <div className="shrink-0 px-6 py-4 border-t border-slate-200/80 bg-slate-50/95 backdrop-blur-xs flex items-center justify-end gap-3 z-10 shadow-2xs">
              <button
                type="button"
                onClick={() => setAdjustingItem(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAdjust}
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                Apply Adjustment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 9. MODAL: Print Barcode & Shelf Price Labels               */}
      {/* ========================================================= */}
      {showPrintLabelsModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-white rounded-2xl max-w-3xl w-full flex flex-col shadow-2xl border border-slate-200 max-h-[90vh] overflow-hidden">
            <div className="shrink-0 p-5 px-6 border-b border-slate-100 flex items-center justify-between bg-white z-10">
              <div className="flex items-center gap-2">
                <Barcode className="w-5 h-5 text-emerald-700" />
                <h3 className="text-base font-bold text-slate-900">
                  Print Item Barcode Labels / <span className="font-khmer text-emerald-800">បោះពុម្ពស្លាកបាកូដ</span>
                </h3>
              </div>
              <button
                onClick={() => setShowPrintLabelsModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <p className="text-xs text-slate-500 font-khmer">
                ជ្រើសរើសមុខទំនិញដើម្បីបោះពុម្ពស្លាកតម្លៃ និងបាកូដសម្រាប់បិទលើកេស ប្រអប់កាដូ ឬធ្នើឃ្លាំងស្តុក៖
              </p>

              {/* Printable Label Grid Preview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-4 bg-slate-100 rounded-2xl border border-slate-200">
                {(selectedLabelItem ? [selectedLabelItem, selectedLabelItem, selectedLabelItem] : filteredItems.slice(0, 6)).map((item, idx) => (
                  <div key={idx} className="bg-white p-3.5 rounded-xl border border-slate-300 shadow-2xs flex flex-col justify-between text-center select-none">
                    <div className="flex items-center justify-between text-[8px] font-bold text-emerald-900 border-b border-slate-100 pb-1 uppercase tracking-wider">
                      <span>MelonPro Smart Farm</span>
                      <span>GAP Cert #882</span>
                    </div>

                    <div className="my-1.5">
                      <div className="font-extrabold text-xs text-slate-900 line-clamp-1">{item.nameEn}</div>
                      <div className="text-[10px] text-slate-500 font-khmer line-clamp-1">{item.nameKm}</div>
                    </div>

                    {/* Barcode line */}
                    <div className="my-1 py-1 bg-slate-50 rounded flex flex-col items-center">
                      <div className="flex items-end gap-[1.5px] h-8 w-32 justify-center">
                        {[2, 1, 3, 2, 4, 2, 1, 3, 4, 1, 2, 4, 1, 3, 2, 4, 1, 2, 3, 1, 4, 2].map((h, i) => (
                          <span key={i} className="bg-slate-900 w-[1.5px]" style={{ height: `${h * 20}%` }} />
                        ))}
                      </div>
                      <span className="text-[9px] font-mono tracking-widest font-bold text-slate-800">
                        {item.barcode || item.sku}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] font-mono font-bold">
                      <span className="text-slate-600">{item.sku}</span>
                      <span className="text-emerald-700">
                        {item.sellingPrice ? `$${item.sellingPrice.toFixed(2)}` : 'INPUT'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="shrink-0 px-6 py-4 border-t border-slate-200/80 bg-slate-50/95 backdrop-blur-xs flex items-center justify-between gap-3 z-10 shadow-2xs">
              <span className="text-xs text-slate-400 font-mono">Standard 3x2 inch Thermal Sticker Sheet</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPrintLabelsModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Close
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-5 py-2 bg-[#164e22] hover:bg-[#123e1b] text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Labels Now</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
