import { supabase } from '../lib/supabaseClient';
import type { SettlementItem, DebtorOwe } from '../types';

export interface CreateSettlementInput {
  title: string;
  date: Date;
  amount: number;
  reference?: string;
  payer: string;
  debtors: DebtorOwe[];
}

const fromDb = (record: any): SettlementItem => ({
  id: record.id,
  title: record.title,
  date: new Date(record.date),
  amount: Number(record.amount),
  status: record.status,
  reference: record.reference,
  payer: record.payer,
  debtors: record.debtors || [],
});

// API Service for Settlement Matrix
export const settlementService = {
  async getAll(): Promise<SettlementItem[]> {
    const { data, error } = await supabase
      .from('settlements')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;
    return data.map(fromDb);
  },

  async getById(id: string): Promise<SettlementItem> {
    const { data, error } = await supabase
      .from('settlements')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return fromDb(data);
  },

  async create(item: Omit<SettlementItem, 'id'>): Promise<SettlementItem> {
    const { data, error } = await supabase
      .from('settlements')
      .insert({
        title: item.title,
        date: item.date.toISOString().split('T')[0],
        amount: item.amount,
        status: item.status,
        reference: item.reference || '',
        payer: item.payer,
        debtors: item.debtors,
      })
      .select()
      .single();

    if (error) throw error;
    return fromDb(data);
  },

  async updateStatus(id: string, status: 'pending' | 'completed'): Promise<SettlementItem> {
    const { data, error } = await supabase
      .from('settlements')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return fromDb(data);
  },

  async update(
    id: string,
    updates: Partial<Omit<SettlementItem, 'id' | 'date'>>
  ): Promise<SettlementItem> {
    const updateData: any = {};
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.amount !== undefined) updateData.amount = updates.amount;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.reference !== undefined) updateData.reference = updates.reference;
    if (updates.payer !== undefined) updateData.payer = updates.payer;
    if (updates.debtors !== undefined) updateData.debtors = updates.debtors;

    const { data, error } = await supabase
      .from('settlements')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return fromDb(data);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('settlements')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getTotalByStatus(status?: 'pending' | 'completed'): Promise<number> {
    let query = supabase.from('settlements').select('amount');

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
  },

  // Get net balance for a person (what they're owed minus what they owe)
  getNetBalance(person: string, settlements: SettlementItem[]): number {
    let owed = 0;
    let owes = 0;

    settlements.forEach((item) => {
      if (item.status !== 'pending') return;

      if (item.payer === person) {
        // This person paid, others owe them
        item.debtors.forEach((debtor) => {
          owed += debtor.amount;
        });
      }

      // Check if this person is a debtor
      item.debtors.forEach((debtor) => {
        if (debtor.person === person) {
          owes += debtor.amount;
        }
      });
    });

    return owed - owes;
  },

  // Get all debts for a specific person
  getPersonDebts(person: string, settlements: SettlementItem[]): { owes: Record<string, number>; owedBy: Record<string, number> } {
    const owes: Record<string, number> = {};
    const owedBy: Record<string, number> = {};

    settlements.forEach((item) => {
      if (item.status !== 'pending') return;

      // If person is the payer, track who owes them
      if (item.payer === person) {
        item.debtors.forEach((debtor) => {
          owedBy[debtor.person] = (owedBy[debtor.person] || 0) + debtor.amount;
        });
      }

      // If person is a debtor, track what they owe
      item.debtors.forEach((debtor) => {
        if (debtor.person === person) {
          owes[item.payer] = (owes[item.payer] || 0) + debtor.amount;
        }
      });
    });

    return { owes, owedBy };
  },
};
