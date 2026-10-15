import React, { useState } from 'react';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ArrowLeftRight, 
  Plus, 
  Search, 
  Filter, 
  DollarSign, 
  CreditCard, 
  TrendingUp, 
  TrendingDown, 
  X,
  FileSpreadsheet,
  Building2,
  Calendar
} from 'lucide-react';
import { useI18n } from '../../locales/i18nContext';
import { useFarm } from '../../context/FarmContext';
import { FinancialAccount, AccountTransaction } from '../../types/melon';

export const AccountsView: React.FC = () => {
  const { language } = useI18n();
  const { financialAccounts, accountTransactions, addAccountTransaction, transferFunds } = useFarm();

  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [search, setSearch] = useState('');
  const [showAddTxModal, setShowAddTxModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);

  // New Transaction Form state
  const [txData, setTxData] = useState<{
    date: string;
    type: 'income' | 'expense';
    category: any;
    amount: number;
    accountId: string;
    descriptionEn: string;
    descriptionKm: string;
  }>({
    date: new Date().toISOString().split('T')[0],
    type: 'expense',
    category: 'utilities_electricity',
    amount: 150,
    accountId: financialAccounts[0]?.id || '',
    descriptionEn: '',
    descriptionKm: '',
  });

  // Transfer Form state
  const [transferData, setTransferData] = useState({
    fromAccountId: financialAccounts[0]?.id || '',
    toAccountId: financialAccounts[1]?.id || '',
    amount: 500,
    note: 'Weekly petty cash replenishment',
  });

  const filteredTransactions = accountTransactions.filter((tx) => {
    const matchesType = typeFilter === 'all' || tx.type === typeFilter;
    const q = search.toLowerCase();
    const matchesSearch = 
      tx.transactionNumber.toLowerCase().includes(q) ||
      tx.descriptionEn.toLowerCase().includes(q) ||
      tx.descriptionKm.toLowerCase().includes(q) ||
      tx.accountName.toLowerCase().includes(q);
    return matchesType && matchesSearch;
  });

  // Financial KPI totals
  const totalLiquidCash = financialAccounts
    .filter(a => a.type === 'bank' || a.type === 'cash')
    .reduce((sum, a) => sum + a.balance, 0);

  const totalIncome = accountTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = accountTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netProfit = totalIncome - totalExpense;

  const handleCreateTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (txData.amount <= 0 || !txData.descriptionEn) return;

    const acc = financialAccounts.find(a => a.id === txData.accountId);
    addAccountTransaction({
      ...txData,
      accountName: acc?.name || 'Operating Account',
      recordedBy: 'Finance Controller',
    });

    setShowAddTxModal(false);
    setTxData({
      date: new Date().toISOString().split('T')[0],
      type: 'expense',
      category: 'utilities_electricity',
      amount: 150,
      accountId: financialAccounts[0]?.id || '',
      descriptionEn: '',
      descriptionKm: '',
    });
  };

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (transferData.fromAccountId === transferData.toAccountId || transferData.amount <= 0) return;

    transferFunds(
      transferData.fromAccountId,
      transferData.toAccountId,
      transferData.amount,
      transferData.note
    );

    setShowTransferModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-slate-900">
            Accounting & Financial Ledger / <span className="font-khmer text-emerald-700">គណនេយ្យ និងលំហូរសាច់ប្រាក់</span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {language === 'km' 
              ? 'គ្រប់គ្រងគណនីធនាគារ លុយសុទ្ធក្នុងបេឡា ប្រាក់ចំណូលពីការលក់ និងការចំណាយលើចំការ' 
              : 'Bank accounts, farm cash safe, general ledger, income from melon sales, and farm expenses'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTransferModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <ArrowLeftRight className="w-4 h-4 text-slate-500" />
            <span>Transfer Funds</span>
          </button>

          <button
            onClick={() => setShowAddTxModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#164e22] hover:bg-[#123e1b] text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'km' ? 'កត់ត្រាចំណូល/ចំណាយ' : '+ Record Transaction'}</span>
          </button>
        </div>
      </div>

      {/* Account Balances Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {financialAccounts.map((acc) => {
          const isBank = acc.type === 'bank';
          const isCash = acc.type === 'cash';
          const isReceivable = acc.type === 'receivable';
          const isPayable = acc.type === 'payable';

          return (
            <div key={acc.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    isBank ? 'bg-blue-50 text-blue-700' :
                    isCash ? 'bg-emerald-50 text-emerald-700' :
                    isReceivable ? 'bg-amber-50 text-amber-700' :
                    'bg-red-50 text-red-700'
                  }`}>
                    {acc.type}
                  </span>
                  <span className="text-[11px] font-mono font-semibold text-slate-400">{acc.currency}</span>
                </div>
                <h3 className="font-bold text-xs text-slate-900 mt-2 truncate" title={acc.name}>
                  {acc.name}
                </h3>
                {acc.accountNumber && (
                  <p className="text-[11px] font-mono text-slate-400 mt-0.5">{acc.accountNumber}</p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Balance:</span>
                <span className={`text-lg font-bold font-mono ${
                  isPayable ? 'text-red-600' : 'text-slate-900'
                }`}>
                  ${acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* P&L Performance Banner */}
      <div className="bg-linear-to-r from-[#164e22] to-[#2563eb] rounded-2xl p-5 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center md:text-left">
          <p className="text-xs uppercase font-bold tracking-wider text-emerald-200">
            Current Farm Profit & Loss Summary (P&L)
          </p>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-extrabold tracking-tight">
              ${netProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-2xs">
              {netProfit >= 0 ? '+ Net Operating Profit' : '- Net Loss'}
            </span>
          </div>
          <p className="text-xs text-emerald-100 font-khmer">
            ប្រាក់ចំណេញសុទ្ធពីការលក់ត្រសក់ ដកថ្លៃជី គ្រាប់ពូជ និងប្រាក់ខែកសិករ
          </p>
        </div>

        <div className="flex items-center gap-6 bg-white/10 px-5 py-3 rounded-xl backdrop-blur-2xs border border-white/20 text-center">
          <div>
            <span className="text-[11px] text-emerald-200 block">Total Inflows (Revenue)</span>
            <span className="text-base font-bold text-white flex items-center justify-center gap-1">
              <TrendingUp className="w-4 h-4 text-emerald-300" />
              ${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="w-px h-8 bg-white/20" />
          <div>
            <span className="text-[11px] text-red-200 block">Total Outflows (Expenses)</span>
            <span className="text-base font-bold text-white flex items-center justify-center gap-1">
              <TrendingDown className="w-4 h-4 text-red-300" />
              ${totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 w-full md:w-auto">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              typeFilter === 'all' ? 'bg-[#164e22] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Transactions ({accountTransactions.length})
          </button>
          <button
            onClick={() => setTypeFilter('income')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              typeFilter === 'income' ? 'bg-[#164e22] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Incomes (+Revenue)
          </button>
          <button
            onClick={() => setTypeFilter('expense')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              typeFilter === 'expense' ? 'bg-[#164e22] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Expenses (-Costs)
          </button>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tx number or notes..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 focus:bg-white text-xs border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Tx Number</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Description / ការពិពណ៌នា</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Account</th>
                <th className="py-3 px-4 text-center">Type</th>
                <th className="py-3 px-4 text-right">Amount ($)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.map((tx) => {
                const isInc = tx.type === 'income';
                const isExp = tx.type === 'expense';
                return (
                  <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                      {tx.transactionNumber}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {tx.date}
                    </td>
                    <td className="py-3.5 px-4 max-w-sm">
                      <p className="font-semibold text-slate-900">{tx.descriptionEn}</p>
                      <p className="text-[11px] text-slate-500 font-khmer mt-0.5">{tx.descriptionKm}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-semibold uppercase">
                        {tx.category.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {tx.accountName}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isInc ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        isExp ? 'bg-red-50 text-red-700 border border-red-200' :
                        'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {isInc ? <ArrowDownLeft className="w-3 h-3" /> : isExp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowLeftRight className="w-3 h-3" />}
                        {tx.type.toUpperCase()}
                      </span>
                    </td>
                    <td className={`py-3.5 px-4 text-right font-mono font-bold text-sm ${
                      isInc ? 'text-emerald-700' : isExp ? 'text-red-600' : 'text-blue-700'
                    }`}>
                      {isInc ? '+' : isExp ? '-' : ''}${tx.amount.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Transaction Modal */}
      {showAddTxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full flex flex-col shadow-2xl border border-slate-200 max-h-[90vh] overflow-hidden">
            <div className="shrink-0 p-5 px-6 border-b border-slate-100 flex items-center justify-between bg-white z-10">
              <h3 className="font-bold text-base text-slate-900">
                Record Financial Transaction / <span className="font-khmer text-emerald-700 text-sm">កត់ត្រាចំណូល/ចំណាយ</span>
              </h3>
              <button onClick={() => setShowAddTxModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTx} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Transaction Type *</label>
                    <select
                      value={txData.type}
                      onChange={(e) => setTxData({ ...txData, type: e.target.value as any })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="expense">Expense (Outflow)</option>
                      <option value="income">Income (Revenue / Inflow)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Date *</label>
                    <input
                      type="date"
                      required
                      value={txData.date}
                      onChange={(e) => setTxData({ ...txData, date: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Amount ($ USD) *</label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      required
                      value={txData.amount}
                      onChange={(e) => setTxData({ ...txData, amount: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none font-bold font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Account *</label>
                    <select
                      value={txData.accountId}
                      onChange={(e) => setTxData({ ...txData, accountId: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none"
                    >
                      {financialAccounts.map(a => (
                        <option key={a.id} value={a.id}>{a.name} (${a.balance.toFixed(2)})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category *</label>
                  <select
                    value={txData.category}
                    onChange={(e) => setTxData({ ...txData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="produce_sale">Produce Sale Revenue</option>
                    <option value="seed_purchase">Seed & Nursery Purchase</option>
                    <option value="fertilizer_purchase">Fertilizer & Chemicals</option>
                    <option value="labor_salary">Labor & Agronomist Wages</option>
                    <option value="utilities_electricity">EDC Electricity & Water Pump</option>
                    <option value="packaging_supplies">Packaging Boxes & Crates</option>
                    <option value="equipment_maintenance">Irrigation & Generator Repairs</option>
                    <option value="other">General Farm Operations</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Description (English) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Monthly maintenance of deep well solar pumps"
                    value={txData.descriptionEn}
                    onChange={(e) => setTxData({ ...txData, descriptionEn: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Description (Khmer / ភាសាខ្មែរ)</label>
                  <input
                    type="text"
                    placeholder="e.g. ថ្លៃជួសជុលម៉ូទ័របូមទឹកសូឡា"
                    value={txData.descriptionKm}
                    onChange={(e) => setTxData({ ...txData, descriptionKm: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none font-khmer"
                  />
                </div>
              </div>

              <div className="shrink-0 px-6 py-4 border-t border-slate-200/80 bg-slate-50/95 backdrop-blur-xs flex items-center justify-end gap-3 z-10 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setShowAddTxModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#164e22] hover:bg-[#123e1b] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                >
                  Save Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Funds Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full flex flex-col shadow-2xl border border-slate-200 max-h-[90vh] overflow-hidden">
            <div className="shrink-0 p-5 px-6 border-b border-slate-100 flex items-center justify-between bg-white z-10">
              <h3 className="font-bold text-base text-slate-900">
                Transfer Between Accounts
              </h3>
              <button onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteTransfer} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Source Account (From) *</label>
                  <select
                    value={transferData.fromAccountId}
                    onChange={(e) => setTransferData({ ...transferData, fromAccountId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none"
                  >
                    {financialAccounts.map(a => (
                      <option key={a.id} value={a.id}>{a.name} (${a.balance.toFixed(2)})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Destination Account (To) *</label>
                  <select
                    value={transferData.toAccountId}
                    onChange={(e) => setTransferData({ ...transferData, toAccountId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none"
                  >
                    {financialAccounts.map(a => (
                      <option key={a.id} value={a.id}>{a.name} (${a.balance.toFixed(2)})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Transfer Amount ($ USD) *</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    required
                    value={transferData.amount}
                    onChange={(e) => setTransferData({ ...transferData, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none font-bold font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Note / Reference</label>
                  <input
                    type="text"
                    value={transferData.note}
                    onChange={(e) => setTransferData({ ...transferData, note: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="shrink-0 px-6 py-4 border-t border-slate-200/80 bg-slate-50/95 backdrop-blur-xs flex items-center justify-end gap-3 z-10 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#164e22] hover:bg-[#123e1b] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                >
                  Transfer Funds
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
