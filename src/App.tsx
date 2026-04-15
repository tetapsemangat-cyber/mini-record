import { useState } from 'react';
import { Sidebar } from './components';
import { Inventory, DailyUsage, SettlementMatrix } from './pages';
import { useInventory, useDailyUsage, useSettlement } from './hooks';
import type { SettlementItem } from './types';
import './App.scss';

function App() {
  const [currentView, setCurrentView] = useState<'inventory' | 'daily-usage' | 'settlement'>('inventory');

  const {
    items,
    loading: inventoryLoading,
    createItem,
    updateItem,
    deleteItem,
  } = useInventory();

  const {
    records,
    loading: expenseLoading,
    createRecord,
    updateRecord,
    deleteRecord,
  } = useDailyUsage();

  const {
    settlements,
    loading: settlementLoading,
    createSettlement,
    updateSettlement,
  } = useSettlement();

  const handleCreateSettlement = (settlement: Omit<SettlementItem, 'id' | 'date' | 'status'>) => {
    createSettlement({
      title: settlement.title,
      amount: settlement.amount,
      payer: settlement.payer,
      debtors: settlement.debtors,
      reference: settlement.reference,
    });
  };

  const handleUpdateSettlement = (id: string, updates: Partial<Omit<SettlementItem, 'id' | 'date' | 'status'>>) => {
    updateSettlement(id, updates);
  };

  return (
    <div className="dashboard">
      <div className="dashboard__container">
        <aside className="dashboard__sidebar">
          <Sidebar currentView={currentView} onViewChange={setCurrentView} />
        </aside>

        <main className="dashboard__main">
          <header className="dashboard__header">
            <h1 className="dashboard__title">
              {currentView === 'inventory' && 'Inventory Management'}
              {currentView === 'daily-usage' && 'Expense Tracker'}
              {currentView === 'settlement' && 'Settlement Matrix'}
            </h1>
          </header>

          {currentView === 'inventory' && (
            <Inventory
              items={items}
              onCreateItem={createItem}
              onUpdateItem={updateItem}
              onDeleteItem={deleteItem}
              loading={inventoryLoading}
            />
          )}

          {currentView === 'daily-usage' && (
            <DailyUsage
              records={records}
              onCreateRecord={createRecord}
              onUpdateRecord={updateRecord}
              onDeleteRecord={deleteRecord}
              loading={expenseLoading}
            />
          )}

          {currentView === 'settlement' && (
            <SettlementMatrix
              settlements={settlements}
              onCreateSettlement={handleCreateSettlement}
              onUpdateSettlement={handleUpdateSettlement}
              loading={settlementLoading}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
