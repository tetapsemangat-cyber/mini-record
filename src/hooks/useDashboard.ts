import { useState } from 'react';
import type { DashboardView } from '../types';

export const useDashboard = () => {
  const [currentView, setCurrentView] = useState<DashboardView['currentView']>('inventory');

  return {
    currentView,
    setCurrentView,
  };
};
