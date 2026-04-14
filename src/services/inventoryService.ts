import { supabase } from '../lib/supabaseClient';
import type { InventoryItem } from '../types';

const fromDb = (record: any): InventoryItem => ({
  id: record.id,
  name: record.name,
  quantity: Number(record.quantity),
  price: Number(record.price),
  status: record.status,
  lastUpdated: new Date(record.last_updated),
});

const toDb = (item: Omit<InventoryItem, 'id' | 'lastUpdated'>) => ({
  name: item.name,
  quantity: item.quantity,
  price: item.price,
  status: item.status,
});

// API Service for Inventory
export const inventoryService = {
  async getAll(): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .order('last_updated', { ascending: false });

    if (error) throw error;
    return data.map(fromDb);
  },

  async getById(id: string): Promise<InventoryItem> {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return fromDb(data);
  },

  async create(item: Omit<InventoryItem, 'id' | 'lastUpdated'>): Promise<InventoryItem> {
    const { data, error } = await supabase
      .from('inventory')
      .insert({ ...toDb(item), last_updated: new Date().toISOString() })
      .select()
      .single();

    if (error) throw error;
    return fromDb(data);
  },

  async update(id: string, item: Partial<InventoryItem>): Promise<InventoryItem> {
    const updateData: any = { last_updated: new Date().toISOString() };
    if (item.name !== undefined) updateData.name = item.name;
    if (item.quantity !== undefined) updateData.quantity = item.quantity;
    if (item.price !== undefined) updateData.price = item.price;
    if (item.status !== undefined) updateData.status = item.status;

    const { data, error } = await supabase
      .from('inventory')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return fromDb(data);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('inventory')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
