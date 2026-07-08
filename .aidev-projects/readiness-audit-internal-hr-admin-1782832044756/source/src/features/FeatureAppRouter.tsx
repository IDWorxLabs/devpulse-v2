import { useMemo, useState } from 'react';
import { FEATURE_REGISTRY } from './registry';
import './feature-app-router.css';

/** Modular feature router — renders registry modules dynamically */
export default function FeatureAppRouter() {
  const [activeModuleId, setActiveModuleId] = useState('navigation-router');
  const activeEntry = useMemo(
    () => FEATURE_REGISTRY.find((entry) => entry.id === activeModuleId) ?? FEATURE_REGISTRY[0],
    [activeModuleId],
  );
  const ActiveComponent = activeEntry?.component;

  return (
    <div
      className="feature-app-router"
      data-modular-feature-router="v1"
      data-materialization-profile="CRM_WEB_V1"
    >
      <nav className="modular-nav" aria-label="Feature modules">
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
          className={`modular-nav-item ${activeModuleId === 'customers' ? 'is-active' : ''}`}
          onClick={() => setActiveModuleId('customers')}
        >
          Customers
        </button>
        <button
          type="button"
          className={`modular-nav-item ${activeModuleId === 'pipeline' ? 'is-active' : ''}`}
          onClick={() => setActiveModuleId('pipeline')}
        >
          Pipeline
        </button>
        <button
          type="button"
          className={`modular-nav-item ${activeModuleId === 'contacts' ? 'is-active' : ''}`}
          onClick={() => setActiveModuleId('contacts')}
        >
          Contacts
        </button>
        <button
          type="button"
          className={`modular-nav-item ${activeModuleId === 'follow-ups' ? 'is-active' : ''}`}
          onClick={() => setActiveModuleId('follow-ups')}
        >
          Follow Ups
        </button>
        <button
          type="button"
          className={`modular-nav-item ${activeModuleId === 'reports' ? 'is-active' : ''}`}
          onClick={() => setActiveModuleId('reports')}
        >
          Reports
        </button>
      </nav>
      <div className="modular-active-feature">
        {ActiveComponent ? <ActiveComponent /> : null}
      </div>
    </div>
  );
}
