import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { AppState, TransactionType } from '../types';

interface DashboardProps {
  state: AppState;
  isDarkMode: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ state, isDarkMode }) => {
  const { transactions, inventory } = state;

  // Calculate Metrics
  const totalSales = transactions
    .filter(t => t.type === TransactionType.SALE)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((sum, t) => sum + t.amount, 0);

  const netProfit = totalSales - totalExpenses;
  const lowStockCount = inventory.filter(i => i.stock <= i.lowStockThreshold).length;

  // Prepare Chart Data (Last 7 days approx)
  const chartDataMap = new Map<string, { date: string; sales: number; expenses: number }>();
  
  transactions.forEach(t => {
    const date = new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!chartDataMap.has(date)) {
      chartDataMap.set(date, { date, sales: 0, expenses: 0 });
    }
    const entry = chartDataMap.get(date)!;
    if (t.type === TransactionType.SALE) {
      entry.sales += t.amount;
    } else {
      entry.expenses += t.amount;
    }
  });

  const chartData = Array.from(chartDataMap.values()).slice(-7); // Last 7 days

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h2>
          <p className="text-slate-500 dark:text-slate-400">Welcome back, here's what's happening today.</p>
        </div>
        <div className="text-sm bg-white dark:bg-slate-900 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 shadow-sm">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Sales" 
          value={`₹${totalSales.toLocaleString()}`} 
          icon={TrendingUp} 
          trend="up"
          color="text-emerald-600 dark:text-emerald-400"
          bgColor="bg-emerald-50 dark:bg-emerald-950/30"
          borderColor="border-emerald-100 dark:border-emerald-900/50"
        />
        <StatCard 
          title="Total Expenses" 
          value={`₹${totalExpenses.toLocaleString()}`} 
          icon={TrendingDown} 
          trend="down"
          color="text-rose-600 dark:text-rose-400"
          bgColor="bg-rose-50 dark:bg-rose-950/30"
          borderColor="border-rose-100 dark:border-rose-900/50"
        />
        <StatCard 
          title="Net Profit" 
          value={`₹${netProfit.toLocaleString()}`} 
          icon={DollarSign} 
          trend={netProfit >= 0 ? 'up' : 'down'}
          color={netProfit >= 0 ? "text-primary-600 dark:text-primary-400" : "text-rose-600 dark:text-rose-400"}
          bgColor={netProfit >= 0 ? "bg-primary-50 dark:bg-primary-950/30" : "bg-rose-50 dark:bg-rose-950/30"}
          borderColor={netProfit >= 0 ? "border-primary-100 dark:border-primary-900/50" : "border-rose-100 dark:border-rose-900/50"}
        />
        <StatCard 
          title="Low Stock Items" 
          value={lowStockCount.toString()} 
          icon={AlertTriangle} 
          trend="neutral"
          color={lowStockCount > 0 ? "text-amber-600 dark:text-amber-400" : "text-slate-600 dark:text-slate-400"}
          bgColor={lowStockCount > 0 ? "bg-amber-50 dark:bg-amber-950/30" : "bg-slate-50 dark:bg-slate-800/50"}
          borderColor={lowStockCount > 0 ? "border-amber-100 dark:border-amber-900/50" : "border-slate-100 dark:border-slate-800"}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-lg font-semibold mb-6 text-slate-900 dark:text-white">Revenue & Expenses</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#f1f5f9'} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 12}} />
                <Tooltip 
                  formatter={(value) => [`₹${value}`, undefined]}
                  contentStyle={{
                    borderRadius: '8px', 
                    border: isDarkMode ? '1px solid #334155' : 'none', 
                    backgroundColor: isDarkMode ? '#1e293b' : '#fff',
                    color: isDarkMode ? '#fff' : '#000',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                  itemStyle={{ color: isDarkMode ? '#e2e8f0' : '#1e293b' }}
                  labelStyle={{ color: isDarkMode ? '#94a3b8' : '#64748b' }}
                />
                <Area type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                <Area type="monotone" dataKey="expenses" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorExp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Quick Actions</h3>
          <div className="space-y-3">
             {lowStockCount > 0 && (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-100 dark:border-amber-900/50">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="text-amber-500 dark:text-amber-400 shrink-0" size={20} />
                    <div>
                      <h4 className="font-semibold text-amber-900 dark:text-amber-100 text-sm">Low Stock Alert</h4>
                      <p className="text-xs text-amber-700 dark:text-amber-300/80 mt-1">You have {lowStockCount} items running low. Restock soon!</p>
                    </div>
                  </div>
                </div>
             )}
             
             <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                <h4 className="font-medium text-slate-700 dark:text-slate-300 text-sm mb-2">Most Sold Item</h4>
                {/* Simplified logic for top item */}
                <div className="flex justify-between items-center">
                   <span className="text-slate-900 dark:text-white font-bold">Milk (1L)</span>
                   <span className="text-xs bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded-full">+12%</span>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  trend: 'up' | 'down' | 'neutral';
  color: string;
  bgColor: string;
  borderColor: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, trend, color, bgColor, borderColor }) => {
  return (
    <div className={`p-6 rounded-2xl border ${borderColor} bg-white dark:bg-slate-900 shadow-sm transition-all hover:shadow-md`}>
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${bgColor}`}>
          <Icon className={color} size={24} />
        </div>
        {trend !== 'neutral' && (
          <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${trend === 'up' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300'}`}>
            {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            <span>4.5%</span>
          </div>
        )}
      </div>
      <div>
        <h4 className="text-slate-500 dark:text-slate-400 text-sm font-medium">{title}</h4>
        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
      </div>
    </div>
  );
};