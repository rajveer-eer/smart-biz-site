import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Inventory } from './components/Inventory';
import { Transactions } from './components/Transactions';
import { AiAdvisor } from './components/AiAdvisor';
import { Login } from './components/Login';
import { SalesHistory } from './components/SalesHistory';
import { AppState, Product, Transaction, TransactionType, User } from './types';
import { dbService } from './services/dbService';
import { supabase } from './services/supabaseClient';
import { authService } from './services/authService';
import { AlertTriangle } from 'lucide-react';

const App: React.FC = () => {
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('smartBizTheme');
    return saved === 'dark';
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [dbError, setDbError] = useState(false);

  // Apply Theme
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('smartBizTheme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('smartBizTheme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  // App State - Initialize empty, will fetch from DB
  const [activeTab, setActiveTab] = useState('dashboard');
  const [state, setState] = useState<AppState>({ 
    inventory: [], 
    transactions: [] 
  });

  const [currentUser, setCurrentUser] = useState<User | undefined>(undefined);

  // Auth Listener
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
           setCurrentUser({
             name: session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'Shop Owner',
             shopName: session.user.user_metadata.shop_name || 'My Shop',
             avatar: "https://img.freepik.com/free-psd/3d-illustration-human-avatar-profile_23-2150671122.jpg?semt=ais_hybrid&w=740&q=80"
           });
        }
      } catch (error) {
        console.error('Error checking auth session:', error);
      } finally {
        setIsAuthChecking(false);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCurrentUser({
             name: session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'Shop Owner',
             shopName: session.user.user_metadata.shop_name || 'My Shop',
             avatar: "https://img.freepik.com/free-psd/3d-illustration-human-avatar-profile_23-2150671122.jpg?semt=ais_hybrid&w=740&q=80"
        });
      } else {
        setCurrentUser(undefined);
        setState({ inventory: [], transactions: [] }); // Clear data on logout
      }
      setIsAuthChecking(false);
    });

    return () => subscription.unsubscribe();
  }, []);


  // Fetch Data from Supabase when User is detected
  useEffect(() => {
    const fetchData = async () => {
      try {
        setDbError(false);
        setIsLoading(true);
        const [inventory, transactions] = await Promise.all([
          dbService.getInventory(),
          dbService.getTransactions()
        ]);
        setState({ inventory, transactions });
      } catch (error: any) {
        console.error("Failed to fetch data:", error);
        // Handle missing table error (Postgres 42P01)
        if (error.code === '42P01' || error.message?.includes('relation "products" does not exist')) {
           setDbError(true);
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUser) {
      fetchData();
    }
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await authService.signOut();
      // State is cleared in onAuthStateChange
      setActiveTab('dashboard');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Actions
  const handleAddProduct = async (product: Product) => {
    try {
      // Optimistic update
      const tempId = product.id || crypto.randomUUID();
      const optimisitcProduct = { ...product, id: tempId };
      setState(prev => ({ ...prev, inventory: [...prev.inventory, optimisitcProduct] }));

      // DB Call
      const newProduct = await dbService.addProduct(product);
      
      // Replace optimistic product with real DB product
      setState(prev => ({
        ...prev,
        inventory: prev.inventory.map(p => p.id === tempId ? newProduct : p)
      }));
    } catch (e) {
      console.error("Error adding product", e);
      const data = await dbService.getInventory();
      setState(prev => ({ ...prev, inventory: data }));
    }
  };

  const handleUpdateProduct = async (product: Product) => {
    try {
      // Optimistic
      setState(prev => ({
        ...prev,
        inventory: prev.inventory.map(p => p.id === product.id ? product : p)
      }));

      // DB Call
      await dbService.updateProduct(product);
    } catch (e) {
      console.error("Error updating product", e);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      // Optimistic
      setState(prev => ({
        ...prev,
        inventory: prev.inventory.filter(p => p.id !== id)
      }));

      // DB Call
      await dbService.deleteProduct(id);
    } catch (e) {
      console.error("Error deleting product", e);
    }
  };

  const handleAddTransaction = async (transaction: Transaction) => {
    try {
      // 1. Calculate new inventory state
      let newInventory = [...state.inventory];
      let stockUpdates: Promise<void>[] = [];

      if (transaction.type === TransactionType.SALE && transaction.items) {
        transaction.items.forEach(item => {
          const productIndex = newInventory.findIndex(p => p.id === item.productId);
          if (productIndex > -1) {
            const currentProduct = newInventory[productIndex];
            const newStock = Math.max(0, currentProduct.stock - item.quantity);
            
            // Update local state copy
            newInventory[productIndex] = {
              ...currentProduct,
              stock: newStock
            };

            // Queue DB stock update
            stockUpdates.push(dbService.updateStockCount(item.productId, newStock));
          }
        });
      }

      // 2. Optimistic Update
      setState(prev => ({
        inventory: newInventory,
        transactions: [transaction, ...prev.transactions]
      }));

      // 3. DB Calls
      const newTx = await dbService.addTransaction(transaction);
      
      // Update stock in DB
      await Promise.all(stockUpdates);

      // 4. Correct the Transaction ID in state
      setState(prev => ({
        ...prev,
        transactions: prev.transactions.map(t => t.id === transaction.id ? newTx : t)
      }));

    } catch (e) {
      console.error("Error adding transaction", e);
      const [inv, txs] = await Promise.all([dbService.getInventory(), dbService.getTransactions()]);
      setState({ inventory: inv, transactions: txs });
    }
  };

  const renderContent = () => {
    if (dbError) {
      return (
          <div className="flex-1 flex items-center justify-center p-4">
             <div className="max-w-lg w-full bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl border border-red-200 dark:border-red-900/50 text-center">
                 <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
                     <AlertTriangle size={32} />
                 </div>
                 <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Database Setup Required</h2>
                 <p className="text-slate-600 dark:text-slate-400 mb-6">
                     It looks like your Supabase database tables haven't been created yet. 
                     Please run the provided SQL setup script in your Supabase SQL Editor.
                 </p>
                 <button onClick={() => window.location.reload()} className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors">
                     I've Run the SQL, Retry
                 </button>
             </div>
          </div>
      );
    }

    if (isLoading && currentUser) {
      return (
        <div className="flex h-full items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard state={state} isDarkMode={isDarkMode} />;
      case 'pos':
        return <Transactions inventory={state.inventory} onAddTransaction={handleAddTransaction} transactions={state.transactions} />;
      case 'history':
        return <SalesHistory transactions={state.transactions} inventory={state.inventory} />;
      case 'inventory':
        return <Inventory products={state.inventory} onAddProduct={handleAddProduct} onUpdateProduct={handleUpdateProduct} onDeleteProduct={handleDeleteProduct} />;
      case 'ai':
        return <AiAdvisor state={state} />;
      default:
        return <Dashboard state={state} isDarkMode={isDarkMode} />;
    }
  };

  if (isAuthChecking) {
     return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
           <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
     );
  }

  if (!currentUser) {
    return <Login />;
  }

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      user={currentUser} 
      onLogout={handleLogout}
      isDarkMode={isDarkMode}
      toggleTheme={toggleTheme}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;