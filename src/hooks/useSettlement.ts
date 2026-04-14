import { useState, useEffect } from 'react';
import type { SettlementItem, DebtorOwe } from '../types';
import { settlementService } from '../services/settlementService';

export interface CreateSettlementFormData {
  title: string;
  amount: number;
  payer: string;
  debtors: DebtorOwe[];
  reference?: string;
}

export const useSettlement = () => {
  const [settlements, setSettlements] = useState<SettlementItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load from Supabase on mount
  useEffect(() => {
    const loadSettlements = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await settlementService.getAll();
        setSettlements(data);
      } catch (err) {
        console.error('Error loading settlements:', err);
        setError(err instanceof Error ? err.message : 'Failed to load settlements');
      } finally {
        setLoading(false);
      }
    };
    loadSettlements();
  }, []);

  const createSettlement = async (formData: CreateSettlementFormData) => {
    setLoading(true);
    setError(null);
    try {
      const newSettlement = await settlementService.create({
        title: formData.title,
        amount: formData.amount,
        date: new Date(),
        status: 'pending',
        reference: formData.reference || '',
        payer: formData.payer,
        debtors: formData.debtors,
      });
      setSettlements((prev) => [...prev, newSettlement]);
    } catch (err) {
      console.error('Error creating settlement:', err);
      setError(err instanceof Error ? err.message : 'Failed to create settlement');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: 'pending' | 'completed') => {
    setLoading(true);
    setError(null);
    try {
      const updated = await settlementService.updateStatus(id, status);
      setSettlements((prev) => prev.map((s) => (s.id === id ? updated : s)));
    } catch (err) {
      console.error('Error updating settlement status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update status');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateSettlement = async (
    id: string,
    updates: Partial<Omit<SettlementItem, 'id' | 'date'>>
  ) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await settlementService.update(id, updates);
      setSettlements((prev) => prev.map((s) => (s.id === id ? updated : s)));
    } catch (err) {
      console.error('Error updating settlement:', err);
      setError(err instanceof Error ? err.message : 'Failed to update settlement');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteSettlement = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await settlementService.delete(id);
      setSettlements((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error('Error deleting settlement:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete settlement');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getPendingTotal = () => {
    return settlements
      .filter((s) => s.status === 'pending')
      .reduce((sum, s) => sum + s.amount, 0);
  };

  const getTotal = () => {
    return settlements.reduce((sum, s) => sum + s.amount, 0);
  };

  const getNetBalance = (person: string) => {
    return settlementService.getNetBalance(person, settlements);
  };

  const getPersonDebts = (person: string) => {
    return settlementService.getPersonDebts(person, settlements);
  };

  return {
    settlements,
    loading,
    error,
    createSettlement,
    updateStatus,
    updateSettlement,
    deleteSettlement,
    getPendingTotal,
    getTotal,
    getNetBalance,
    getPersonDebts,
  };
};
