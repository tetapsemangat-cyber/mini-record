// Domain Types
export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  status: 'available' | 'low' | 'out';
  lastUpdated: Date;
}

export interface InventoryFormData {
  name: string;
  quantity: number;
  price: number;
}

export interface DailyUsageRecord {
  id: string;
  person: string;
  description: string;
  amount: number;
  date: Date;
  notes?: string;
}

export interface ExpenseFormData {
  person: string;
  description: string;
  amount: number;
  date: string;
  notes?: string;
}

export interface DebtorOwe {
  person: string;
  amount: number;
}

export interface SettlementItem {
  id: string;
  title: string;
  date: Date;
  amount: number;
  status: 'pending' | 'completed';
  reference?: string;
  payer: string;
  debtors: DebtorOwe[];
}

export type DateFilterType = 'all' | 'today' | 'thisMonth' | 'custom';

export interface DateFilterConfig {
  filterType: DateFilterType;
  filterMonth: string;
  filterStartDate: string;
  filterEndDate: string;
}

export interface DashboardView {
  currentView: 'inventory' | 'daily-usage' | 'settlement';
}

export interface SummaryStats {
  totalItems: number;
  lowStockItems: number;
  todayUsage: number;
  pendingSettlements: number;
  totalExpenses: number;
  expensesByPerson: Record<string, number>;
}
