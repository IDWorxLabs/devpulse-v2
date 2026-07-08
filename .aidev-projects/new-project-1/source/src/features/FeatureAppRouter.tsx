import { useMemo, useState } from 'react';
import { FEATURE_REGISTRY } from './registry';
import './feature-app-router.css';

/** Modular feature router — renders registry modules dynamically */
export default function FeatureAppRouter() {
  const [activeModuleId, setActiveModuleId] = useState('csv-export');
  const activeEntry = useMemo(
    () => FEATURE_REGISTRY.find((entry) => entry.id === activeModuleId) ?? FEATURE_REGISTRY[0],
    [activeModuleId],
  );
  const ActiveComponent = activeEntry?.component;

  return (
    <div
      className="feature-app-router android-phone-preview"
      data-modular-feature-router="v1"
      data-materialization-profile="EXPENSE_TRACKER_WEB_V1"
      data-android-phone-preview="true"
    >
      <nav className="modular-nav" aria-label="Feature modules">
        <button
          type="button"
          className={`modular-nav-item ${activeModuleId === 'csv-export' ? 'is-active' : ''}`}
          onClick={() => setActiveModuleId('csv-export')}
        >
          Csv Export
        </button>
        <button
          type="button"
          className={`modular-nav-item ${activeModuleId === 'navigation-router' ? 'is-active' : ''}`}
          onClick={() => setActiveModuleId('navigation-router')}
        >
          Navigation Router
        </button>
        <button
          type="button"
          className={`modular-nav-item ${activeModuleId === 'dashboard' ? 'is-active' : ''}`}
          onClick={() => setActiveModuleId('dashboard')}
        >
          Dashboard
        </button>
        <button
          type="button"
          className={`modular-nav-item ${activeModuleId === 'settings' ? 'is-active' : ''}`}
          onClick={() => setActiveModuleId('settings')}
        >
          Settings
        </button>
        <button
          type="button"
          className={`modular-nav-item ${activeModuleId === 'expenses' ? 'is-active' : ''}`}
          onClick={() => setActiveModuleId('expenses')}
        >
          Expenses
        </button>
        <button
          type="button"
          className={`modular-nav-item ${activeModuleId === 'income' ? 'is-active' : ''}`}
          onClick={() => setActiveModuleId('income')}
        >
          Income
        </button>
        <button
          type="button"
          className={`modular-nav-item ${activeModuleId === 'categories' ? 'is-active' : ''}`}
          onClick={() => setActiveModuleId('categories')}
        >
          Categories
        </button>
        <button
          type="button"
          className={`modular-nav-item ${activeModuleId === 'reports' ? 'is-active' : ''}`}
          onClick={() => setActiveModuleId('reports')}
        >
          Reports
        </button>
        <button
          type="button"
          className={`modular-nav-item ${activeModuleId === 'charts' ? 'is-active' : ''}`}
          onClick={() => setActiveModuleId('charts')}
        >
          Charts
        </button>
      </nav>
      <div className="modular-active-feature">
        {ActiveComponent ? <ActiveComponent /> : null}
      </div>
    </div>
  );
}
