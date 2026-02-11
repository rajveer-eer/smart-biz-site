import { supabase } from './supabaseClient';
import { Product, Transaction, TransactionType } from '../types';

// Map database column names (snake_case) to app types (camelCase)
const mapProductFromDB = (data: any): Product => ({
  id: data.id,
  name: data.name,
  category: data.category,
  stock: data.stock,
  costPrice: data.cost_price,
  sellingPrice: data.selling_price,
  unit: data.unit,
  lowStockThreshold: data.low_stock_threshold
});

const mapTransactionFromDB = (data: any): Transaction => ({
  id: data.id,
  type: data.type as TransactionType,
  amount: data.amount,
  date: data.date,
  description: data.description,
  items: data.items
});

export const dbService = {
  // --- Inventory ---
  async getInventory(): Promise<Product[]> {
    // RLS Policy automatically filters rows where user_id = auth.uid()
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) throw error;
    return data.map(mapProductFromDB);
  },

  async addProduct(product: Product): Promise<Product> {
    // We do NOT send user_id here. 
    // The database is configured to default user_id to auth.uid() automatically.
    const { data, error } = await supabase
      .from('products')
      .insert({
        // id: product.id, // Let Supabase generate ID
        name: product.name,
        category: product.category,
        stock: product.stock,
        cost_price: product.costPrice,
        selling_price: product.sellingPrice,
        unit: product.unit,
        low_stock_threshold: product.lowStockThreshold
      })
      .select()
      .single();

    if (error) throw error;
    return mapProductFromDB(data);
  },

  async updateProduct(product: Product): Promise<void> {
    const { error } = await supabase
      .from('products')
      .update({
        name: product.name,
        category: product.category,
        stock: product.stock,
        cost_price: product.costPrice,
        selling_price: product.sellingPrice,
        unit: product.unit,
        low_stock_threshold: product.lowStockThreshold
      })
      .eq('id', product.id);
      // RLS ensures we can only update our own rows

    if (error) throw error;
  },

  async deleteProduct(id: string): Promise<void> {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
      // RLS ensures we can only delete our own rows

    if (error) throw error;
  },

  // --- Transactions ---
  async getTransactions(): Promise<Transaction[]> {
    // RLS Policy automatically filters rows where user_id = auth.uid()
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;
    return data.map(mapTransactionFromDB);
  },

  async addTransaction(transaction: Transaction): Promise<Transaction> {
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        // id: transaction.id, // Let Supabase generate ID
        // user_id defaults to auth.uid() via SQL
        type: transaction.type,
        amount: transaction.amount,
        date: transaction.date,
        description: transaction.description,
        items: transaction.items // Supabase handles JSONB automatically
      })
      .select()
      .single();

    if (error) throw error;
    return mapTransactionFromDB(data);
  },

  // Special method to handle stock reduction
  async updateStockCount(productId: string, newStock: number) {
    const { error } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', productId);
    
    if (error) throw error;
  }
};