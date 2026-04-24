import React, { useState } from 'react';
import { useInventory } from '../../hooks/useInventory';
import type { InventoryItem, InventoryFormData, DateFilterConfig } from '../../types';
import './Inventory.scss';

export const Inventory: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState<InventoryFormData>({
    name: '',
    quantity: 0,
    price: 0,
  });
  const [filterConfig, setFilterConfig] = useState<DateFilterConfig>({
    filterType: 'all',
    filterMonth: new Date().toISOString().slice(0, 7),
    filterStartDate: '',
    filterEndDate: '',
  });

  const {
    items,
    loading,
    createItem,
    updateItem,
    deleteItem,
    getTotalValue,
  } = useInventory(filterConfig);

  const totalValue = getTotalValue();
  const itemTotal = formData.quantity * formData.price;

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({ name: '', quantity: 0, price: 0 });
    setShowModal(true);
  };

  const openEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await updateItem(editingItem.id, formData);
      } else {
        await createItem(formData);
      }
      setShowModal(false);
    } catch (error) {
      console.error('Error saving item:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      await deleteItem(id);
    }
  };

  return (
    <div className="inventory">
      <div className="inventory__card">
        <div className="inventory__header">
          <h2 className="inventory__title">Inventory Management</h2>
          <div className="inventory__actions">
            <button className="inventory__button inventory__button--primary" onClick={openAddModal}>
              + Add Item
            </button>
          </div>
        </div>

        {/* Filter Section */}
        <div className="inventory__filter">
          <div className="inventory__filter-row">
            <div className="inventory__filter-group">
              <label className="inventory__label">Filter by Date:</label>
              <div className="inventory__filter-buttons">
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
            </div>

            {filterConfig.filterType === 'custom' && (
              <div className="inventory__filter-custom-dates">
                <div className="inventory__filter-date-item">
                  <label className="inventory__label">Month:</label>
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
                <div className="inventory__filter-date-item">
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
                <div className="inventory__filter-date-item">
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
            )}
          </div>
        </div>

        <div className="inventory__summary">
          <div className="inventory__summary-item">
            <span className="inventory__summary-label">Showing:</span>
            <span className="inventory__summary-value">{items.length === 0 ? 'No items' : `${items.length} items`}</span>
          </div>
          <div className="inventory__summary-item">
            <span className="inventory__summary-label">Total Value:</span>
            <span className="inventory__summary-value">{totalValue.toLocaleString('id-ID')}</span>
          </div>
        </div>

        <div className="inventory__table-wrapper">
          <table className="inventory__table">
          <thead className="inventory__table-head">
            <tr>
              <th className="inventory__table-header">Item Name</th>
              <th className="inventory__table-header">Price</th>
              <th className="inventory__table-header">Quantity</th>
              <th className="inventory__table-header">Total</th>
              <th className="inventory__table-header">Last Updated</th>
              <th className="inventory__table-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="inventory__empty">
                  {filterConfig.filterType !== 'all' ? 'No items match your filter' : 'No items yet'}
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="inventory__table-row">
                  <td className="inventory__table-cell">{item.name}</td>
                  <td className="inventory__table-cell">{item.price.toLocaleString('id-ID')}</td>
                  <td className="inventory__table-cell">{item.quantity}</td>
                  <td className="inventory__table-cell inventory__table-cell--total">
                    {(item.quantity * item.price).toLocaleString('id-ID')}
                  </td>
                  <td className="inventory__table-cell">
                    {new Date(item.lastUpdated).toLocaleDateString()}
                  </td>
                  <td className="inventory__table-cell">
                    <div className="inventory__action-buttons">
                      <button
                        className="inventory__button inventory__button--edit"
                        onClick={() => openEditModal(item)}
                      >
                        Edit
                      </button>
                      <button
                        className="inventory__button inventory__button--delete"
                        onClick={() => handleDelete(item.id)}
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
                {editingItem ? 'Edit Item' : 'Add New Item'}
              </h3>
              <button
                className="inventory__modal-close"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>

            <form className="inventory__form" onSubmit={handleSubmit}>

              <div className="inventory__form-group">
                <label className="inventory__label">Item Name</label>
                <input
                  type="text"
                  className="inventory__input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="inventory__form-group">
                <label className="inventory__label">Price</label>
                <input
                  type="number"
                  className="inventory__input"
                  value={formData.price === 0 ? '' : formData.price}
                  onChange={(e) => {
                    const value = e.target.value;
                    const cleaned = value.replace(/^0+(\d)/, '$1').replace(/^0+([^0.])/, '$1');
                    const numValue = Number.parseFloat(cleaned);
                    setFormData({ ...formData, price: Number.isNaN(numValue) ? 0 : numValue });
                  }}
                  required
                />
              </div>

              <div className="inventory__form-group">
                <label className="inventory__label">Quantity</label>
                <input
                  type="number"
                  className="inventory__input"
                  value={formData.quantity === 0 ? '' : formData.quantity}
                  onChange={(e) => {
                    const value = e.target.value;
                    const cleaned = value.replace(/^0+(\d)/, '$1').replace(/^0+([^0.])/, '$1');
                    const numValue = Number.parseInt(cleaned);
                    setFormData({ ...formData, quantity: Number.isNaN(numValue) ? 0 : numValue });
                  }}
                  required
                />
              </div>

              {formData.quantity > 0 && formData.price > 0 && (
                <div className="inventory__form-group inventory__form-group--full">
                  <div className="inventory__preview">
                    <span className="inventory__preview-label">Item Total:</span>
                    <span className="inventory__preview-value">{itemTotal.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              )}

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
                  {loading ? 'Saving...' : editingItem ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
