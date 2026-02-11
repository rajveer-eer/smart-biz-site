import React, { useState, useMemo } from 'react';
import { Calendar, ArrowUpRight, ArrowDownRight, Search, FileText, Download } from 'lucide-react';
import { Transaction, TransactionType, Product } from '../types';

interface SalesHistoryProps {
  transactions: Transaction[];
  inventory: Product[];
}

export const SalesHistory: React.FC<SalesHistoryProps> = ({ transactions, inventory }) => {
  const [filterType, setFilterType] = useState<'ALL' | 'SALE' | 'EXPENSE'>('ALL');
  const [dateRange, setDateRange] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter Logic
  const filteredTransactions = useMemo(() => {
    let data = [...transactions];

    // Filter by Type
    if (filterType !== 'ALL') {
      data = data.filter(t => t.type === filterType);
    }

    // Filter by Date
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    if (dateRange === 'TODAY') {
      data = data.filter(t => new Date(t.date).getTime() >= today);
    } else if (dateRange === 'WEEK') {
      const weekAgo = today - (7 * 24 * 60 * 60 * 1000);
      data = data.filter(t => new Date(t.date).getTime() >= weekAgo);
    } else if (dateRange === 'MONTH') {
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).getTime();
      data = data.filter(t => new Date(t.date).getTime() >= monthAgo);
    }

    // Search
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      data = data.filter(t => 
        t.description.toLowerCase().includes(lower) || 
        t.items?.some(i => i.name.toLowerCase().includes(lower))
      );
    }

    // Sort Descending Date
    return data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filterType, dateRange, searchTerm]);

  // Calculate Totals
  const totalSales = filteredTransactions
    .filter(t => t.type === TransactionType.SALE)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = filteredTransactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((sum, t) => sum + t.amount, 0);

  const netProfit = totalSales - totalExpenses;

  // Helper to format date
  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
  };

  // Handle CSV Download
  const handleDownload = () => {
    const headers = ['Date', 'Type', 'Description', 'Items', 'Amount'];
    const csvRows = [headers.join(',')];

    filteredTransactions.forEach(t => {
      // Format fields for CSV (handle commas and quotes)
      const date = `"${formatDate(t.date)}"`;
      const type = t.type;
      const description = `"${t.description.replace(/"/g, '""')}"`;
      
      let itemsStr = '';
      if (t.items) {
        itemsStr = t.items.map(i => `${i.name} (${i.quantity})`).join('; ');
      }
      const items = `"${itemsStr.replace(/"/g, '""')}"`;
      
      // Use negative amount for expenses to make calculations in Excel easier
      const amount = t.type === TransactionType.EXPENSE ? -t.amount : t.amount;

      csvRows.push([date, type, description, items, amount].join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Transaction History</h2>
          <p className="text-slate-500 dark:text-slate-400">Track your past sales, expenses, and profit.</p>
        </div>
        
        {/* Summary Cards */}
        <div className="flex flex-wrap gap-2 md:gap-4 w-full md:w-auto">
             <div className="bg-white dark:bg-slate-900 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex-1 md:flex-initial">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Sales</p>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">₹{totalSales.toLocaleString()}</p>
             </div>
             <div className="bg-white dark:bg-slate-900 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex-1 md:flex-initial">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Expenses</p>
                <p className="text-lg font-bold text-rose-600 dark:text-rose-400">₹{totalExpenses.toLocaleString()}</p>
             </div>
             <div className="bg-white dark:bg-slate-900 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex-1 md:flex-initial">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Net Profit</p>
                <p className={`text-lg font-bold ${netProfit >= 0 ? 'text-primary-600 dark:text-primary-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    ₹{netProfit.toLocaleString()}
                </p>
             </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={20} />
            <input 
              type="text" 
              placeholder="Search transactions..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 items-center">
             <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium whitespace-nowrap"
                title="Download as CSV"
             >
                <Download size={16} />
                <span className="hidden sm:inline">Export CSV</span>
             </button>

             <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>

             <select 
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-primary-500"
             >
                <option value="ALL">All Time</option>
                <option value="TODAY">Today</option>
                <option value="WEEK">Last 7 Days</option>
                <option value="MONTH">Last 30 Days</option>
             </select>
             <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                <button 
                  onClick={() => setFilterType('ALL')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${filterType === 'ALL' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                >
                    All
                </button>
                <button 
                  onClick={() => setFilterType('SALE')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${filterType === 'SALE' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                >
                    Sales
                </button>
                <button 
                  onClick={() => setFilterType('EXPENSE')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${filterType === 'EXPENSE' ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                >
                    Expenses
                </button>
             </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4 font-medium whitespace-nowrap">Date</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium">Details</th>
                <th className="px-6 py-4 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <FileText size={48} className="text-slate-200 dark:text-slate-700" />
                      <p>No transactions found for this period.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                           <Calendar size={14} />
                           {formatDate(t.date)}
                        </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        t.type === TransactionType.SALE 
                            ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' 
                            : 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'
                      }`}>
                         {t.type === TransactionType.SALE ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                         {t.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                        <div className="text-slate-900 dark:text-white font-medium max-w-xs truncate">
                            {t.description}
                        </div>
                        {t.items && (
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs truncate">
                                {t.items.map(i => `${i.name} x${i.quantity}`).join(', ')}
                            </div>
                        )}
                    </td>
                    <td className={`px-6 py-4 text-right font-bold ${
                        t.type === TransactionType.SALE 
                        ? 'text-emerald-600 dark:text-emerald-400' 
                        : 'text-slate-900 dark:text-white'
                    }`}>
                      {t.type === TransactionType.EXPENSE && '- '}₹{t.amount.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};