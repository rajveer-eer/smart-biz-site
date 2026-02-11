import React, { useState } from 'react';
import { ShoppingCart, Tag, Plus, Minus, Receipt } from 'lucide-react';
import { Product, Transaction, TransactionType } from '../types';

interface TransactionsProps {
  inventory: Product[];
  onAddTransaction: (transaction: Transaction) => void;
  transactions: Transaction[];
}

export const Transactions: React.FC<TransactionsProps> = ({ inventory, onAddTransaction, transactions }) => {
  const [activeType, setActiveType] = useState<TransactionType>(TransactionType.SALE);
  const [cart, setCart] = useState<{ product: Product; qty: number }[]>([]);
  const [expenseDetails, setExpenseDetails] = useState({ description: '', amount: 0 });

  // Filter products for dropdown
  const [searchTerm, setSearchTerm] = useState('');
  const filteredInventory = inventory.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { product, qty: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateQty = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQty = Math.max(1, item.qty + delta);
        return { ...item, qty: newQty };
      }
      return item;
    }));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.product.sellingPrice * item.qty), 0);

  const handleCheckout = () => {
    if (activeType === TransactionType.SALE) {
      if (cart.length === 0) return;
      const transaction: Transaction = {
        id: crypto.randomUUID(),
        type: TransactionType.SALE,
        amount: cartTotal,
        date: new Date().toISOString(),
        description: 'Sale',
        items: cart.map(item => ({ productId: item.product.id, quantity: item.qty, name: item.product.name }))
      };
      onAddTransaction(transaction);
      setCart([]);
    } else {
      if (!expenseDetails.description || expenseDetails.amount <= 0) return;
      const transaction: Transaction = {
        id: crypto.randomUUID(),
        type: TransactionType.EXPENSE,
        amount: expenseDetails.amount,
        date: new Date().toISOString(),
        description: expenseDetails.description
      };
      onAddTransaction(transaction);
      setExpenseDetails({ description: '', amount: 0 });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
      {/* Input Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">New Transaction</h2>
        
        {/* Toggle */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button 
            onClick={() => setActiveType(TransactionType.SALE)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${activeType === TransactionType.SALE ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
          >
            <ShoppingCart size={18} /> Sale
          </button>
          <button 
             onClick={() => setActiveType(TransactionType.EXPENSE)}
             className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${activeType === TransactionType.EXPENSE ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
          >
            <Tag size={18} /> Expense
          </button>
        </div>

        {activeType === TransactionType.SALE ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-[500px]">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <input 
                type="text" 
                placeholder="Search items to add..." 
                className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none text-slate-900 dark:text-white placeholder-slate-400"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {filteredInventory.map(product => (
                <button 
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="w-full flex justify-between items-center p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700 text-left group"
                >
                  <div>
                    <div className="font-medium text-slate-900 dark:text-white">{product.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{product.stock} {product.unit} available</div>
                  </div>
                  <div className="flex items-center gap-3">
                     <span className="font-semibold text-primary-600 dark:text-primary-400">₹{product.sellingPrice}</span>
                     <div className="w-8 h-8 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                       <Plus size={16} />
                     </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
              <input 
                type="text" 
                placeholder="e.g. Electricity Bill, Rent" 
                className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none text-slate-900 dark:text-white placeholder-slate-400"
                value={expenseDetails.description}
                onChange={e => setExpenseDetails({...expenseDetails, description: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amount (₹)</label>
              <input 
                type="number" 
                placeholder="0.00" 
                className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none text-slate-900 dark:text-white placeholder-slate-400"
                value={expenseDetails.amount || ''}
                onChange={e => setExpenseDetails({...expenseDetails, amount: parseFloat(e.target.value)})}
              />
            </div>
          </div>
        )}
      </div>

      {/* Cart / Summary Section */}
      <div className="flex flex-col h-full space-y-6">
         <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {activeType === TransactionType.SALE ? 'Current Sale' : 'Summary'}
         </h2>

         <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
            {activeType === TransactionType.SALE ? (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                      <ShoppingCart size={48} className="mb-2 opacity-20" />
                      <p>Cart is empty</p>
                    </div>
                  ) : (
                    cart.map(item => (
                      <div key={item.product.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        <div className="flex-1">
                          <p className="font-medium text-slate-900 dark:text-white">{item.product.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">₹{item.product.sellingPrice} x {item.qty}</p>
                        </div>
                        <div className="flex items-center gap-3 text-slate-900 dark:text-white">
                           <button onClick={() => updateQty(item.product.id, -1)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"><Minus size={14} /></button>
                           <span className="font-medium text-sm w-4 text-center">{item.qty}</span>
                           <button onClick={() => updateQty(item.product.id, 1)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"><Plus size={14} /></button>
                           <span className="font-bold w-16 text-right">₹{(item.product.sellingPrice * item.qty).toFixed(2)}</span>
                           <button onClick={() => removeFromCart(item.product.id)} className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 ml-2"><Minus size={16} className="rotate-45" /></button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-slate-500 dark:text-slate-400">Total Amount</span>
                    <span className="text-3xl font-bold text-slate-900 dark:text-white">₹{cartTotal.toFixed(2)}</span>
                  </div>
                  <button 
                    onClick={handleCheckout}
                    disabled={cart.length === 0}
                    className="w-full py-4 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg shadow-lg shadow-primary-500/30 transition-all active:scale-[0.98]"
                  >
                    Complete Sale
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col justify-between p-6">
                 <div className="flex flex-col items-center justify-center flex-1 text-rose-500 dark:text-rose-400">
                    <Receipt size={64} className="mb-4 opacity-20" />
                    <p className="text-xl font-medium">Recording Expense</p>
                    <p className="text-4xl font-bold mt-2">₹{expenseDetails.amount.toFixed(2)}</p>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">{expenseDetails.description || 'No description'}</p>
                 </div>
                 <button 
                    onClick={handleCheckout}
                    disabled={!expenseDetails.description || expenseDetails.amount <= 0}
                    className="w-full py-4 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg shadow-lg shadow-rose-500/30 transition-all active:scale-[0.98]"
                  >
                    Record Expense
                  </button>
              </div>
            )}
         </div>
      </div>
    </div>
  );
};