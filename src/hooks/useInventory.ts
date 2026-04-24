import { useState, useEffect, useCallback } from 'react';
import type { InventoryItem, InventoryFormData, DateFilterConfig } from '../types';
import { inventoryService } from '../services/inventoryService';

const getStatus = (quantity: number): 'available' | 'low' | 'out' => {
  if (quantity === 0) return 'out';
  if (quantity < 10) return 'low';
  return 'available';
};

export const resolveDateRange = (config: DateFilterConfig): { start: Date; end: Date } | null => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  switch (config.filterType) {
    case 'today':
      return { start: today, end: new Date(today.getTime() + 86400000 - 1) };
    case 'thisMonth': {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
      return { start, end };
    }
    case 'custom': {
      if (config.filterMonth) {
        const [year, month] = config.filterMonth.split('-').map(Number);
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0, 23, 59, 59, 999);
        return { start, end };
      }
      if (config.filterStartDate && config.filterEndDate) {
        return {
          start: new Date(config.filterStartDate),
          end: new Date(config.filterEndDate + 'T23:59:59.999'),
        };
      }
      return null;
    }
    default:
      return null;
  }
};

export const useInventory = (filterConfig: DateFilterConfig) => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filterKey = JSON.stringify(filterConfig);

  const fetchData = useCallback(async (config: DateFilterConfig) => {
    setLoading(true);
    setError(null);
    try {
      const range = resolveDateRange(config);
      const data = range
        ? await inventoryService.getByDateRange(range.start, range.end)
        : await inventoryService.getAll();
      setItems(data);
    } catch (err) {
      console.error('Error loading items:', err);
      setError(err instanceof Error ? err.message : 'Failed to load items');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(filterConfig);
  }, [filterKey, fetchData]);

  const createItem = async (formData: InventoryFormData) => {
    setLoading(true);
    setError(null);
    try {
      await inventoryService.create({
        name: formData.name,
        quantity: formData.quantity,
        price: formData.price,
        status: getStatus(formData.quantity),
      });
      await fetchData(filterConfig);
    } catch (err) {
      console.error('Error creating item:', err);
      setError(err instanceof Error ? err.message : 'Failed to create item');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateItem = async (id: string, formData: Partial<InventoryFormData>) => {
    setLoading(true);
    setError(null);
    try {
      const updateData: Partial<InventoryItem> = {};
      if (formData.name !== undefined) updateData.name = formData.name;
      if (formData.quantity !== undefined) {
        updateData.quantity = formData.quantity;
        updateData.status = getStatus(formData.quantity);
      }
      if (formData.price !== undefined) updateData.price = formData.price;

      await inventoryService.update(id, updateData);
      await fetchData(filterConfig);
    } catch (err) {
      console.error('Error updating item:', err);
      setError(err instanceof Error ? err.message : 'Failed to update item');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await inventoryService.delete(id);
      await fetchData(filterConfig);
    } catch (err) {
      console.error('Error deleting item:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete item');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getTotalValue = () => {
    return items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  };

  return {
    items,
    loading,
    error,
    createItem,
    updateItem,
    deleteItem,
    getTotalValue,
  };
};
