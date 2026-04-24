import { useState } from 'react';
import { Sidebar } from './components';
import { Inventory, DailyUsage, SettlementMatrix } from './pages';
import './App.scss';

function App() {
  const [currentView, setCurrentView] = useState<'inventory' | 'daily-usage' | 'settlement'>('inventory');

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

          {currentView === 'inventory' && <Inventory />}
          {currentView === 'daily-usage' && <DailyUsage />}
          {currentView === 'settlement' && <SettlementMatrix />}
        </main>
      </div>
    </div>
  );
}

export default App;
