import React from 'react';
import './Sidebar.scss';

export interface SidebarProps {
  currentView: string;
  onViewChange: (view: 'inventory' | 'daily-usage' | 'settlement') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
  const menuItems = [
    { id: 'inventory', label: 'Inventory', icon: '📦' },
    { id: 'daily-usage', label: 'Daily Usage', icon: '📝' },
    { id: 'settlement', label: 'Settlement Matrix', icon: '💰' },
  ] as const;

  return (
    <aside className="sidebar">
      <div className="sidebar__logo">MiniRecord</div>
      <nav>
        <ul className="sidebar__nav">
          {menuItems.map((item) => (
            <li key={item.id} className="sidebar__nav-item">
              <button
                className={`sidebar__link ${currentView === item.id ? 'sidebar__link--active' : ''}`}
                onClick={() => onViewChange(item.id)}
              >
                <span className="sidebar__link-icon">{item.icon}</span>
                <span className="sidebar__link-text">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};
