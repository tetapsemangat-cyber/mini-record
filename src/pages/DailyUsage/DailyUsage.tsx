import React, { useState } from 'react';
import { useDailyUsage } from '../../hooks/useDailyUsage';
import type { DailyUsageRecord, ExpenseFormData, DateFilterConfig } from '../../types';
import './DailyUsage.scss';

export const DailyUsage: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DailyUsageRecord | null>(null);
  const [formData, setFormData] = useState<ExpenseFormData>({
    person: '',
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [filterConfig, setFilterConfig] = useState<DateFilterConfig>({
    filterType: 'all',
    filterMonth: new Date().toISOString().slice(0, 7),
    filterStartDate: '',
    filterEndDate: '',
  });

  const {
    records,
    loading,
    createRecord,
    updateRecord,
    deleteRecord,
    getTotalExpenses,
    getExpensesByPerson,
  } = useDailyUsage(filterConfig);

  const expensesByPerson = getExpensesByPerson();
  const totalExpenses = getTotalExpenses();

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
        await updateRecord(editingRecord.id, formData);
      } else {
        await createRecord(formData);
      }
      setShowModal(false);
    } catch (error) {
      console.error('Error saving record:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this record?')) {
      await deleteRecord(id);
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

        {/* Filter Section */}
        <div className="daily-usage__filter">
          <div className="daily-usage__filter-buttons">
            <button
              className={`inventory__button ${filterConfig.filterType === 'all' ? 'inventory__button--primary' : 'inventory__button--secondary'}`}
              onClick={() => setFilterConfig(prev => ({ ...prev, filterType: 'all' }))}
            >
              All Time
            </button>
            <button
              className={`inventory__button ${filterConfig.filterType === 'today' ? 'inventory__button--primary' : 'inventory__button--secondary'}`}
              onClick={() => setFilterConfig(prev => ({ ...prev, filterType: 'today' }))}
            >
              Today
            </button>
            <button
              className={`inventory__button ${filterConfig.filterType === 'thisMonth' ? 'inventory__button--primary' : 'inventory__button--secondary'}`}
              onClick={() => setFilterConfig(prev => ({ ...prev, filterType: 'thisMonth' }))}
            >
              This Month
            </button>
            <button
              className={`inventory__button ${filterConfig.filterType === 'custom' ? 'inventory__button--primary' : 'inventory__button--secondary'}`}
              onClick={() => setFilterConfig(prev => ({ ...prev, filterType: 'custom' }))}
            >
              Custom
            </button>
          </div>

          {filterConfig.filterType === 'custom' && (
            <div className="daily-usage__filter-custom">
              <div className="daily-usage__filter-month">
                <label className="inventory__label">Filter by Month:</label>
                <input
                  type="month"
                  className="inventory__input"
                  value={filterConfig.filterMonth}
                  onChange={(e) => {
                    setFilterConfig(prev => ({
                      ...prev,
                      filterMonth: e.target.value,
                      filterStartDate: '',
                      filterEndDate: '',
                    }));
                  }}
                />
              </div>
              <div className="daily-usage__filter-date-range">
                <div className="daily-usage__filter-date">
                  <label className="inventory__label">From:</label>
                  <input
                    type="date"
                    className="inventory__input"
                    value={filterConfig.filterStartDate}
                    onChange={(e) => {
                      setFilterConfig(prev => ({
                        ...prev,
                        filterStartDate: e.target.value,
                        filterMonth: '',
                      }));
                    }}
                  />
                </div>
                <div className="daily-usage__filter-date">
                  <label className="inventory__label">To:</label>
                  <input
                    type="date"
                    className="inventory__input"
                    value={filterConfig.filterEndDate}
                    onChange={(e) => {
                      setFilterConfig(prev => ({
                        ...prev,
                        filterEndDate: e.target.value,
                        filterMonth: '',
                      }));
                    }}
                  />
                </div>
              </div>
            </div>
          )}
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
                  {filterConfig.filterType === 'all' ? 'No expenses recorded yet' : 'No expenses found for this filter'}
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
                  value={formData.amount === 0 ? '' : formData.amount}
                  onChange={(e) => {
                    const value = e.target.value;
                    const cleaned = value.replace(/^0+(\d)/, '$1').replace(/^0+([^0.])/, '$1');
                    const numValue = parseFloat(cleaned);
                    setFormData({ ...formData, amount: isNaN(numValue) ? 0 : numValue });
                  }}
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
