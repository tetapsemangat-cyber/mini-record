import { supabase } from '../lib/supabaseClient';
import type { DailyUsageRecord } from '../types';

// Convert database record to app format
const fromDb = (record: any): DailyUsageRecord => ({
  id: record.id,
  person: record.person,
  description: record.description,
  amount: Number(record.amount),
  date: new Date(record.date),
  notes: record.notes || '',
});

// Convert app record to database format
const toDb = (record: Omit<DailyUsageRecord, 'id'>) => ({
  person: record.person,
  description: record.description,
  amount: record.amount,
  date: record.date.toISOString().split('T')[0],
  notes: record.notes || '',
});

// API Service for Daily Usage
export const dailyUsageService = {
  async getAll(): Promise<DailyUsageRecord[]> {
    const { data, error } = await supabase
      .from('daily_usage')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;
    return data.map(fromDb);
  },

  async getByDateRange(startDate: Date, endDate: Date): Promise<DailyUsageRecord[]> {
    const { data, error } = await supabase
      .from('daily_usage')
      .select('*')
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date', { ascending: false });

    if (error) throw error;
    return data.map(fromDb);
  },

  async create(record: Omit<DailyUsageRecord, 'id'>): Promise<DailyUsageRecord> {
    const { data, error } = await supabase
      .from('daily_usage')
      .insert(toDb(record))
      .select()
      .single();

    if (error) throw error;
    return fromDb(data);
  },

  async update(id: string, record: Partial<Omit<DailyUsageRecord, 'id'>>): Promise<DailyUsageRecord> {
    const updateData: any = {};
    if (record.person !== undefined) updateData.person = record.person;
    if (record.description !== undefined) updateData.description = record.description;
    if (record.amount !== undefined) updateData.amount = record.amount;
    if (record.date !== undefined) updateData.date = record.date.toISOString().split('T')[0];
    if (record.notes !== undefined) updateData.notes = record.notes;

    const { data, error } = await supabase
      .from('daily_usage')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return fromDb(data);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('daily_usage')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getSummaryStats(): Promise<{ todayUsage: number; weekUsage: number; monthUsage: number }> {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const { data: todayData, error: todayError } = await supabase
      .from('daily_usage')
      .select('amount')
      .eq('date', today);

    const { data: weekData, error: weekError } = await supabase
      .from('daily_usage')
      .select('amount')
      .gte('date', weekAgo);

    const { data: monthData, error: monthError } = await supabase
      .from('daily_usage')
      .select('amount')
      .gte('date', monthAgo);

    if (todayError) throw todayError;
    if (weekError) throw weekError;
    if (monthError) throw monthError;

    return {
      todayUsage: todayData?.reduce((sum, r) => sum + Number(r.amount), 0) || 0,
      weekUsage: weekData?.reduce((sum, r) => sum + Number(r.amount), 0) || 0,
      monthUsage: monthData?.reduce((sum, r) => sum + Number(r.amount), 0) || 0,
    };
  },
};
