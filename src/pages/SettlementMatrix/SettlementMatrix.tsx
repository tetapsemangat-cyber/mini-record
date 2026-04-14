import React, { useMemo, useState } from 'react';
import type { SettlementItem } from '../../types';
import './SettlementMatrix.scss';

export interface SettlementMatrixProps {
  settlements: SettlementItem[];
  onCreateSettlement?: (settlement: Omit<SettlementItem, 'id' | 'date' | 'status'>) => void;
  onUpdateSettlement?: (id: string, updates: Partial<Omit<SettlementItem, 'id' | 'date' | 'status'>>) => void;
  onUpdateStatus?: (id: string, status: 'pending' | 'completed') => void;
  loading?: boolean;
}

interface NewDebtor {
  person: string;
  amount: string;
}

export const SettlementMatrix: React.FC<SettlementMatrixProps> = ({
  settlements,
  onCreateSettlement,
  onUpdateSettlement,
  onUpdateStatus,
  loading = false,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingSettlement, setEditingSettlement] = useState<SettlementItem | null>(null);
  const [title, setTitle] = useState('');
  const [payer, setPayer] = useState('');
  const [amount, setAmount] = useState('');
  const [debtors, setDebtors] = useState<NewDebtor[]>([]);

  // Extract all unique people (payers and debtors)
  const { allPeople, matrixData } = useMemo(() => {
    const peopleSet = new Set<string>();
    const matrix: Record<string, Record<string, number>> = {};

    settlements.forEach((item) => {
      const payer = item.payer;
      peopleSet.add(payer);

      if (!matrix[payer]) {
        matrix[payer] = {};
      }

      item.debtors.forEach((debtor) => {
        // Skip if debtor is the same as payer
        if (debtor.person === payer) return;

        peopleSet.add(debtor.person);
        if (!matrix[payer][debtor.person]) {
          matrix[payer][debtor.person] = 0;
        }
        matrix[payer][debtor.person] += debtor.amount;
      });
    });

    const allPeople = Array.from(peopleSet).sort();
    return { allPeople, matrixData: matrix };
  }, [settlements]);

  // Calculate totals for each person
  useMemo(() => {
    const totals: Record<string, { get: number; give: number }> = {};
    const netAmounts: Record<string, number> = {};

    allPeople.forEach((person) => {
      totals[person] = { get: 0, give: 0 };
      netAmounts[person] = 0;
    });

    Object.entries(matrixData).forEach(([payer, debtors]) => {
      Object.entries(debtors).forEach(([debtor, amount]) => {
        // Skip if payer and debtor are the same
        if (payer === debtor) return;

        totals[payer].get += amount;
        totals[debtor].give += amount;
      });
    });

    Object.entries(totals).forEach(([person, { get, give }]) => {
      netAmounts[person] = get - give;
    });
  }, [matrixData, allPeople]);

  // Build who to who list (exclude same person)
  const whoToWho = useMemo(() => {
    const list: Array<{ from: string; to: string; amount: number }> = [];

    Object.entries(matrixData).forEach(([to, froms]) => {
      Object.entries(froms).forEach(([from, amount]) => {
        // Skip if payer and debtor are the same person
        if (amount > 0 && from !== to) {
          list.push({ from, to, amount });
        }
      });
    });

    return list;
  }, [matrixData]);

  const totalAmount = settlements.reduce((sum, item) => sum + item.amount, 0);

  // Form handlers
  const resetForm = () => {
    setTitle('');
    setPayer('');
    setAmount('');
    setDebtors([]);
  };

  const openAddModal = () => {
    setEditingSettlement(null);
    resetForm();
    setShowForm(true);
  };

  const openEditModal = (settlement: SettlementItem) => {
    setEditingSettlement(settlement);
    setTitle(settlement.title);
    setPayer(settlement.payer);
    setAmount(settlement.amount.toString());
    setDebtors(settlement.debtors.map(d => ({ person: d.person, amount: d.amount.toString() })));
    setShowForm(true);
  };

  const handleAddDebtor = () => {
    setDebtors([...debtors, { person: '', amount: '' }]);
  };

  const handleRemoveDebtor = (index: number) => {
    setDebtors(debtors.filter((_, i) => i !== index));
  };

  const handleDebtorChange = (index: number, field: 'person' | 'amount', value: string) => {
    const newDebtors = [...debtors];
    newDebtors[index][field] = value;
    setDebtors(newDebtors);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !payer || !amount || debtors.length === 0) {
      alert('Please fill all fields');
      return;
    }

    const totalDebtorsAmount = debtors.reduce((sum, d) => sum + parseFloat(d.amount || '0'), 0);
    if (Math.abs(totalDebtorsAmount - parseFloat(amount)) > 0.01) {
      alert(`Debtor amounts (${totalDebtorsAmount.toLocaleString('id-ID')}) must equal total amount (${parseFloat(amount).toLocaleString('id-ID')})`);
      return;
    }

    const settlementData = {
      title,
      amount: parseFloat(amount),
      payer,
      debtors: debtors.map(d => ({ person: d.person, amount: parseFloat(d.amount) })),
      reference: '',
    };

    if (editingSettlement && onUpdateSettlement) {
      onUpdateSettlement(editingSettlement.id, settlementData);
    } else if (onCreateSettlement) {
      onCreateSettlement(settlementData);
    }

    resetForm();
    setShowForm(false);
    setEditingSettlement(null);
  };

  return (
    <div className="settlement-matrix">
      <div className="settlement-matrix__card">
        <div className="settlement-matrix__header">
          <div>
            <h2 className="settlement-matrix__title">Settlement Matrix</h2>
            <p className="settlement-matrix__subtitle">Who owes whom</p>
          </div>
          <button
            className="settlement-matrix__add-btn"
            onClick={showForm ? () => { setShowForm(false); setEditingSettlement(null); resetForm(); } : openAddModal}
          >
            {showForm ? 'Cancel' : '+ Add Settlement'}
          </button>
        </div>

        {/* Add/Edit Settlement Form */}
        {showForm && (
          <form className="settlement-matrix__form" onSubmit={handleSubmit}>
            <h3 className="settlement-matrix__form-title">
              {editingSettlement ? 'Edit Settlement' : 'Add New Settlement'}
            </h3>

            <div className="settlement-matrix__form-row">
              <label className="settlement-matrix__form-label">Title</label>
              <input
                type="text"
                className="settlement-matrix__form-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Team Lunch"
                required
              />
            </div>

            <div className="settlement-matrix__form-row">
              <label className="settlement-matrix__form-label">Who Paid?</label>
              <input
                type="text"
                className="settlement-matrix__form-input"
                value={payer}
                onChange={(e) => setPayer(e.target.value)}
                placeholder="Enter name"
                required
              />
            </div>

            <div className="settlement-matrix__form-row">
              <label className="settlement-matrix__form-label">Total Amount</label>
              <input
                type="number"
                step="0.01"
                className="settlement-matrix__form-input"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="000"
                required
              />
            </div>

            <div className="settlement-matrix__form-debtors">
              <div className="settlement-matrix__form-debtors-header">
                <label className="settlement-matrix__form-label">Who Owes?</label>
                <button type="button" className="settlement-matrix__form-add-debtor" onClick={handleAddDebtor}>
                  + Add Person
                </button>
              </div>
              {debtors.map((debtor, idx) => (
                <div key={idx} className="settlement-matrix__form-debtor-row">
                  <input
                    type="text"
                    className="settlement-matrix__form-input settlement-matrix__form-input--small"
                    value={debtor.person}
                    onChange={(e) => handleDebtorChange(idx, 'person', e.target.value)}
                    placeholder="Name"
                    required
                  />
                  <input
                    type="number"
                    step="0.01"
                    className="settlement-matrix__form-input settlement-matrix__form-input--small"
                    value={debtor.amount}
                    onChange={(e) => handleDebtorChange(idx, 'amount', e.target.value)}
                    placeholder="Amount"
                    required
                  />
                  <button
                    type="button"
                    className="settlement-matrix__form-remove"
                    onClick={() => handleRemoveDebtor(idx)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="settlement-matrix__form-actions">
              <button type="submit" className="settlement-matrix__form-submit" disabled={loading}>
                {loading ? 'Saving...' : editingSettlement ? 'Update' : 'Save Settlement'}
              </button>
            </div>
          </form>
        )}

        {/* Settlements List */}
        <div className="settlement-matrix__list">
          <h3 className="settlement-matrix__list-title">Settlements</h3>
          {settlements.length === 0 ? (
            <p className="settlement-matrix__empty">No settlements yet</p>
          ) : (
            <div className="settlement-matrix__list-items">
              {settlements.map((settlement) => (
                <div key={settlement.id} className="settlement-matrix__list-item">
                  <div className="settlement-matrix__list-item-info">
                    <h4 className="settlement-matrix__list-item-title">{settlement.title}</h4>
                    <p className="settlement-matrix__list-item-details">
                      {settlement.payer} paid {settlement.amount.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div className="settlement-matrix__list-item-actions">
                    <button
                      className="settlement-matrix__action-btn settlement-matrix__action-btn--edit"
                      onClick={() => openEditModal(settlement)}
                      disabled={loading}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Matrix Table */}
        <div className="settlement-matrix__table-container">
          <table className="settlement-matrix__table">
            <thead>
              <tr>
                <th className="settlement-matrix__th settlement-matrix__th--row-header">Paid / Owed</th>
                {allPeople.map((person) => (
                  <th key={person} className="settlement-matrix__th">
                    {person}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allPeople.map((payer) => (
                <tr key={payer}>
                  <td className="settlement-matrix__td settlement-matrix__td--row-header">{payer}</td>
                  {allPeople.map((debtor) => {
                    const amt = matrixData[payer]?.[debtor] || 0;
                    return (
                      <td key={debtor} className="settlement-matrix__td">
                        {amt > 0 ? `${amt.toLocaleString('id-ID')}` : '-'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Who To Who Section */}
        <div className="settlement-matrix__summary">
          <h3 className="settlement-matrix__summary-title">Who To Who</h3>
          {whoToWho.length === 0 ? (
            <p className="settlement-matrix__empty">No settlements</p>
          ) : (
            <div className="settlement-matrix__whoto-list">
              {whoToWho.map((item, idx) => (
                <div key={idx} className="settlement-matrix__whoto-item">
                  <span className="settlement-matrix__whoto-from">{item.from}</span>
                  <span className="settlement-matrix__whoto-arrow">→</span>
                  <span className="settlement-matrix__whoto-to">{item.to}</span>
                  <span className="settlement-matrix__whoto-amount">{item.amount.toLocaleString('id-ID')}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="settlement-matrix__totals">
          <div className="settlement-matrix__total">
            <span className="settlement-matrix__total-label">Total:</span>
            <span className="settlement-matrix__total-value">{totalAmount.toLocaleString('id-ID')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
