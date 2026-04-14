import { useState, useEffect } from 'react';
import type { InventoryItem, InventoryFormData } from '../types';
import { inventoryService } from '../services/inventoryService';

const getStatus = (quantity: number): 'available' | 'low' | 'out' => {
  if (quantity === 0) return 'out';
  if (quantity < 10) return 'low';
  return 'available';
};

export const useInventory = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load from Supabase on mount
  useEffect(() => {
    const loadItems = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await inventoryService.getAll();
        setItems(data);
      } catch (err) {
        console.error('Error loading items:', err);
        setError(err instanceof Error ? err.message : 'Failed to load items');
      } finally {
        setLoading(false);
      }
    };
    loadItems();
  }, []);

  const createItem = async (formData: InventoryFormData) => {
    setLoading(true);
    setError(null);
    try {
      const newItem = await inventoryService.create({
        name: formData.name,
        quantity: formData.quantity,
        price: formData.price,
        status: getStatus(formData.quantity),
      });
      setItems((prev) => [...prev, newItem]);
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

      const updated = await inventoryService.update(id, updateData);
      setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
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
      setItems((prev) => prev.filter((item) => item.id !== id));
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

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await inventoryService.getAll();
      setItems(data);
    } catch (err) {
      console.error('Error fetching items:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch items');
    } finally {
      setLoading(false);
    }
  };

  return {
    items,
    loading,
    error,
    fetchItems,
    createItem,
    updateItem,
    deleteItem,
    getTotalValue,
  };
};
