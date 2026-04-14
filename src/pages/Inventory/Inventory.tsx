import React, { useState } from 'react';
import type { InventoryItem, InventoryFormData } from '../../types';
import './Inventory.scss';

export interface InventoryProps {
  items: InventoryItem[];
  onCreateItem: (data: InventoryFormData) => Promise<void>;
  onUpdateItem: (id: string, data: Partial<InventoryFormData>) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
  loading?: boolean;
}

export const Inventory: React.FC<InventoryProps> = ({
  items,
  onCreateItem,
  onUpdateItem,
  onDeleteItem,
  loading = false,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState<InventoryFormData>({
    name: '',
    quantity: 0,
    price: 0,
  });

  const totalValue = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
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
        await onUpdateItem(editingItem.id, formData);
      } else {
        await onCreateItem(formData);
      }
      setShowModal(false);
    } catch (error) {
      console.error('Error saving item:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      await onDeleteItem(id);
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

        <div className="inventory__summary">
          <div className="inventory__summary-item">
            <span className="inventory__summary-label">Total Items:</span>
            <span className="inventory__summary-value">{items.length}</span>
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
            {items.map((item) => (
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
            ))}
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
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>

              <div className="inventory__form-group">
                <label className="inventory__label">Quantity</label>
                <input
                  type="number"
                  className="inventory__input"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })
                  }
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
