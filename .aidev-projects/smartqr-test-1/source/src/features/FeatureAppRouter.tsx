import { useMemo, useState } from 'react';
import { FEATURE_REGISTRY } from './registry';
import './feature-app-router.css';

/** Modular feature router — renders registry modules dynamically */
export default function FeatureAppRouter() {
  const [activeModuleId, setActiveModuleId] = useState('dashboard');
  const activeEntry = useMemo(
    () => FEATURE_REGISTRY.find((entry) => entry.id === activeModuleId) ?? FEATURE_REGISTRY[0],
    [activeModuleId],
  );
  const ActiveComponent = activeEntry?.component;

  return (
    <div
      className="feature-app-router"
      data-modular-feature-router="v1"
      data-materialization-profile="QR_APP"
    >
      <nav className="modular-nav" aria-label="Feature modules">
        <button
          type="button"
          className={`modular-nav-item ${activeModuleId === 'dashboard' ? 'is-active' : ''}`}
          onClick={() => setActiveModuleId('dashboard')}
        >
          Dashboard
        </button>
        <button
          type="button"
          className={`modular-nav-item ${activeModuleId === 'generator' ? 'is-active' : ''}`}
          onClick={() => setActiveModuleId('generator')}
        >
          Generator
        </button>
        <button
          type="button"
          className={`modular-nav-item ${activeModuleId === 'scanner' ? 'is-active' : ''}`}
          onClick={() => setActiveModuleId('scanner')}
        >
          Scanner
        </button>
        <button
          type="button"
          className={`modular-nav-item ${activeModuleId === 'code-history' ? 'is-active' : ''}`}
          onClick={() => setActiveModuleId('code-history')}
        >
          Code History
        </button>
        <button
          type="button"
          className={`modular-nav-item ${activeModuleId === 'analytics' ? 'is-active' : ''}`}
          onClick={() => setActiveModuleId('analytics')}
        >
          Analytics
        </button>
        <button
          type="button"
          className={`modular-nav-item ${activeModuleId === 'settings' ? 'is-active' : ''}`}
          onClick={() => setActiveModuleId('settings')}
        >
          Settings
        </button>
      </nav>
      <div className="modular-active-feature">
        {ActiveComponent ? <ActiveComponent /> : null}
      </div>
    </div>
  );
}
