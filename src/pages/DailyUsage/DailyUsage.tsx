import React, { useState } from 'react';
import type { DailyUsageRecord, ExpenseFormData } from '../../types';
import './DailyUsage.scss';

export interface DailyUsageProps {
  records: DailyUsageRecord[];
  onCreateRecord: (data: ExpenseFormData) => Promise<void>;
  onUpdateRecord: (id: string, data: Partial<ExpenseFormData>) => Promise<void>;
  onDeleteRecord: (id: string) => Promise<void>;
  loading?: boolean;
}

export const DailyUsage: React.FC<DailyUsageProps> = ({
  records,
  onCreateRecord,
  onUpdateRecord,
  onDeleteRecord,
  loading = false,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DailyUsageRecord | null>(null);
  const [formData, setFormData] = useState<ExpenseFormData>({
    person: '',
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const expensesByPerson = records.reduce((acc, record) => {
    acc[record.person] = (acc[record.person] || 0) + record.amount;
    return acc;
  }, {} as Record<string, number>);

  const totalExpenses = records.reduce((sum, record) => sum + record.amount, 0);

  const openAddModal = () => {
    setEditingRecord(null);
    setFormData({
      person: '',
      description: '',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setShowModal(true);
  };

  const openEditModal = (record: DailyUsageRecord) => {
    setEditingRecord(record);
    setFormData({
      person: record.person,
      description: record.description,
      amount: record.amount,
      date: new Date(record.date).toISOString().split('T')[0],
      notes: record.notes,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRecord) {
        await onUpdateRecord(editingRecord.id, formData);
      } else {
        await onCreateRecord(formData);
      }
      setShowModal(false);
    } catch (error) {
      console.error('Error saving record:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this record?')) {
      await onDeleteRecord(id);
    }
  };

  const sortedRecords = [...records].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="daily-usage">
      <div className="daily-usage__card">
        <div className="daily-usage__header">
          <h2 className="daily-usage__title">Expense Tracker</h2>
          <button className="inventory__button inventory__button--primary" onClick={openAddModal}>
            + Add Expense
          </button>
        </div>

        <div className="daily-usage__summary">
          <div className="daily-usage__summary-card">
            <div className="daily-usage__summary-label">Total Expenses</div>
            <div className="daily-usage__summary-value">{totalExpenses.toLocaleString('id-ID')}</div>
          </div>
          {Object.entries(expensesByPerson).map(([person, amount]) => (
            <div key={person} className="daily-usage__summary-card">
              <div className="daily-usage__summary-label">{person}</div>
              <div className="daily-usage__summary-value">{amount.toLocaleString('id-ID')}</div>
            </div>
          ))}
        </div>

        <div className="inventory__table-wrapper">
          <table className="inventory__table">
          <thead className="inventory__table-head">
            <tr>
              <th className="inventory__table-header">Date</th>
              <th className="inventory__table-header">Person</th>
              <th className="inventory__table-header">Description</th>
              <th className="inventory__table-header">Amount</th>
              <th className="inventory__table-header">Notes</th>
              <th className="inventory__table-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedRecords.length === 0 ? (
              <tr>
                <td colSpan={7} className="daily-usage__empty">
                  No expenses recorded yet
                </td>
              </tr>
            ) : (
              sortedRecords.map((record) => (
                <tr key={record.id} className="inventory__table-row">
                  <td className="inventory__table-cell">
                    {new Date(record.date).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </td>
                  <td className="inventory__table-cell">{record.person}</td>
                  <td className="inventory__table-cell">{record.description}</td>
                  <td className="inventory__table-cell inventory__table-cell--amount">
                    {record.amount.toLocaleString('id-ID')}
                  </td>
                  <td className="inventory__table-cell daily-usage__notes">
                    {record.notes || '-'}
                  </td>
                  <td className="inventory__table-cell">
                    <div className="inventory__action-buttons">
                      <button
                        className="inventory__button inventory__button--edit"
                        onClick={() => openEditModal(record)}
                      >
                        Edit
                      </button>
                      <button
                        className="inventory__button inventory__button--delete"
                        onClick={() => handleDelete(record.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {showModal && (
        <div className="inventory__modal-overlay" onClick={() => setShowModal(false)}>
          <div className="inventory__modal" onClick={(e) => e.stopPropagation()}>
            <div className="inventory__modal-header">
              <h3 className="inventory__modal-title">
                {editingRecord ? 'Edit Expense' : 'Add New Expense'}
              </h3>
              <button className="inventory__modal-close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>

            <form className="inventory__form" onSubmit={handleSubmit}>
              <div className="inventory__form-group">
                <label className="inventory__label">Person</label>
                <input
                  type="text"
                  className="inventory__input"
                  placeholder="Who paid?"
                  value={formData.person}
                  onChange={(e) => setFormData({ ...formData, person: e.target.value })}
                  required
                />
              </div>

              <div className="inventory__form-group">
                <label className="inventory__label">Description</label>
                <input
                  type="text"
                  className="inventory__input"
                  placeholder="What was it for?"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

              <div className="inventory__form-group">
                <label className="inventory__label">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="inventory__input"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
                  }
                  required
                />
              </div>

              <div className="inventory__form-group">
                <label className="inventory__label">Date</label>
                <input
                  type="date"
                  className="inventory__input"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              <div className="inventory__form-group inventory__form-group--full">
                <label className="inventory__label">Notes (Optional)</label>
                <input
                  type="text"
                  className="inventory__input"
                  placeholder="Additional notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div className="inventory__modal-actions">
                <button
                  type="button"
                  className="inventory__button inventory__button--secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inventory__button inventory__button--primary"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : editingRecord ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
