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
      data-materialization-profile="GENERIC_CUSTOM_APP_V1"
    >
      <header className="assistive-app-header" data-communication-board="true">
        <h1>Custom App</h1>
        <p className="assistive-subtitle">Locked In Syndrome App — communication board</p>
        <div className="assistive-status-row">
          <span data-blink-status="ready">Blink: ready</span>
          <span data-gaze-status="tracking">Gaze: tracking</span>
          <span data-speech-status="idle">Speech: idle</span>
        </div>
        <div className="assistive-controls">
          <button type="button" className="assistive-speak-btn" data-text-to-speech="true">Speak</button>
          <button type="button" className="assistive-emergency-btn" data-emergency-speech="true">Emergency speech</button>
        </div>
        <p className="assistive-safety-note">Large accessible tiles for assistive communication. Safety note: emergency speech is always visible.</p>
      </header>
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
      </nav>
      <div className="modular-active-feature">
        {ActiveComponent ? <ActiveComponent /> : null}
      </div>
    </div>
  );
}
