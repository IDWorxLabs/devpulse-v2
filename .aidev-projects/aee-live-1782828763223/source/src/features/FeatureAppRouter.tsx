import { useMemo, useState } from 'react';
import { FEATURE_REGISTRY } from './registry';
import './feature-app-router.css';

/** Modular feature router — renders registry modules dynamically */
export default function FeatureAppRouter() {
  const [activeModuleId, setActiveModuleId] = useState('onboarding-calibration');
  const activeEntry = useMemo(
    () => FEATURE_REGISTRY.find((entry) => entry.id === activeModuleId) ?? FEATURE_REGISTRY[0],
    [activeModuleId],
  );
  const ActiveComponent = activeEntry?.component;

  return (
    <div
      className="feature-app-router android-phone-preview"
      data-modular-feature-router="v1"
      data-materialization-profile="GENERIC_CUSTOM_APP_V1"
      data-android-phone-preview="true"
    >
      <header className="assistive-app-header" data-communication-board="true">
        <h1>LISA</h1>
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
          className={`modular-nav-item ${activeModuleId === 'onboarding-calibration' ? 'is-active' : ''}`}
          onClick={() => setActiveModuleId('onboarding-calibration')}
        >
          Onboarding Calibration
        </button>
        <button
          type="button"
          className={`modular-nav-item ${activeModuleId === 'eye-tracking-board' ? 'is-active' : ''}`}
          onClick={() => setActiveModuleId('eye-tracking-board')}
        >
          Eye Tracking Board
        </button>
        <button
          type="button"
          className={`modular-nav-item ${activeModuleId === 'blink-input-engine' ? 'is-active' : ''}`}
          onClick={() => setActiveModuleId('blink-input-engine')}
        >
          Blink Input Engine
        </button>
        <button
          type="button"
          className={`modular-nav-item ${activeModuleId === 'gaze-keyboard' ? 'is-active' : ''}`}
          onClick={() => setActiveModuleId('gaze-keyboard')}
        >
          Gaze Keyboard
        </button>
        <button
          type="button"
          className={`modular-nav-item ${activeModuleId === 'text-to-speech' ? 'is-active' : ''}`}
          onClick={() => setActiveModuleId('text-to-speech')}
        >
          Text To Speech
        </button>
        <button
          type="button"
          className={`modular-nav-item ${activeModuleId === 'quick-phrases' ? 'is-active' : ''}`}
          onClick={() => setActiveModuleId('quick-phrases')}
        >
          Quick Phrases
        </button>
        <button
          type="button"
          className={`modular-nav-item ${activeModuleId === 'caregiver-dashboard' ? 'is-active' : ''}`}
          onClick={() => setActiveModuleId('caregiver-dashboard')}
        >
          Caregiver Dashboard
        </button>
        <button
          type="button"
          className={`modular-nav-item ${activeModuleId === 'communication-history' ? 'is-active' : ''}`}
          onClick={() => setActiveModuleId('communication-history')}
        >
          Communication History
        </button>
        <button
          type="button"
          className={`modular-nav-item ${activeModuleId === 'accessibility-settings' ? 'is-active' : ''}`}
          onClick={() => setActiveModuleId('accessibility-settings')}
        >
          Accessibility Settings
        </button>
        <button
          type="button"
          className={`modular-nav-item ${activeModuleId === 'emergency-speech' ? 'is-active' : ''}`}
          onClick={() => setActiveModuleId('emergency-speech')}
        >
          Emergency Speech
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
          className={`modular-nav-item ${activeModuleId === 'accessibility-layer' ? 'is-active' : ''}`}
          onClick={() => setActiveModuleId('accessibility-layer')}
        >
          Accessibility Layer
        </button>
        <button
          type="button"
          className={`modular-nav-item ${activeModuleId === 'filter-ui' ? 'is-active' : ''}`}
          onClick={() => setActiveModuleId('filter-ui')}
        >
          Filter Ui
        </button>
      </nav>
      <div className="modular-active-feature">
        {ActiveComponent ? <ActiveComponent /> : null}
      </div>
    </div>
  );
}
