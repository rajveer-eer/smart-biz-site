export enum TransactionType {
  SALE = 'SALE',
  EXPENSE = 'EXPENSE'
}

export interface Product {
  id: string;
  name: string;
  category: string;
  stock: number;
  costPrice: number;
  sellingPrice: number;
  unit: string; // e.g., 'pcs', 'kg', 'liter'
  lowStockThreshold: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string; // ISO string
  description: string;
  items?: { productId: string; quantity: number; name: string }[];
}

export interface User {
  name: string;
  shopName: string;
  avatar: string;
}

export interface AppState {
  inventory: Product[];
  transactions: Transaction[];
  user?: User;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}