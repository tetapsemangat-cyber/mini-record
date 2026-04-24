import { useState, useEffect, useCallback } from 'react';
import type { DailyUsageRecord, ExpenseFormData, DateFilterConfig } from '../types';
import { dailyUsageService } from '../services/dailyUsageService';
import { resolveDateRange } from './useInventory';

export const useDailyUsage = (filterConfig: DateFilterConfig) => {
  const [records, setRecords] = useState<DailyUsageRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filterKey = JSON.stringify(filterConfig);

  const fetchData = useCallback(async (config: DateFilterConfig) => {
    setLoading(true);
    setError(null);
    try {
      const range = resolveDateRange(config);
      const data = range
        ? await dailyUsageService.getByDateRange(range.start, range.end)
        : await dailyUsageService.getAll();
      setRecords(data);
    } catch (err) {
      console.error('Error loading records:', err);
      setError(err instanceof Error ? err.message : 'Failed to load records');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(filterConfig);
  }, [filterKey, fetchData]);

  const createRecord = async (formData: ExpenseFormData) => {
    setLoading(true);
    setError(null);
    try {
      await dailyUsageService.create({
        person: formData.person,
        description: formData.description,
        amount: formData.amount,
        date: new Date(formData.date),
        notes: formData.notes,
      });
      await fetchData(filterConfig);
    } catch (err) {
      console.error('Error creating record:', err);
      setError(err instanceof Error ? err.message : 'Failed to create record');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateRecord = async (id: string, formData: Partial<ExpenseFormData>) => {
    setLoading(true);
    setError(null);
    try {
      const updateData: Partial<Omit<DailyUsageRecord, 'id'>> = {};
      if (formData.person !== undefined) updateData.person = formData.person;
      if (formData.description !== undefined) updateData.description = formData.description;
      if (formData.amount !== undefined) updateData.amount = formData.amount;
      if (formData.date !== undefined) updateData.date = new Date(formData.date);
      if (formData.notes !== undefined) updateData.notes = formData.notes;

      await dailyUsageService.update(id, updateData);
      await fetchData(filterConfig);
    } catch (err) {
      console.error('Error updating record:', err);
      setError(err instanceof Error ? err.message : 'Failed to update record');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteRecord = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await dailyUsageService.delete(id);
      await fetchData(filterConfig);
    } catch (err) {
      console.error('Error deleting record:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete record');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getTotalExpenses = () => {
    return records.reduce((sum, record) => sum + record.amount, 0);
  };

  const getExpensesByPerson = () => {
    return records.reduce((acc, record) => {
      acc[record.person] = (acc[record.person] || 0) + record.amount;
      return acc;
    }, {} as Record<string, number>);
  };

  const getTodaysTotal = () => {
    const today = new Date().toDateString();
    return records
      .filter((r) => new Date(r.date).toDateString() === today)
      .reduce((sum, r) => sum + r.amount, 0);
  };

  return {
    records,
    loading,
    error,
    createRecord,
    updateRecord,
    deleteRecord,
    getTotalExpenses,
    getExpensesByPerson,
    getTodaysTotal,
  };
};
