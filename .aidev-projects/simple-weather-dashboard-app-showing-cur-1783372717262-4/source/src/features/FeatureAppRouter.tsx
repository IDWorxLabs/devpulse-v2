import { useMemo, useState } from 'react';
import { FEATURE_REGISTRY } from './registry';
import './feature-app-router.css';

/** Modular feature router — renders registry modules dynamically */
export default function FeatureAppRouter() {
  const [activeModuleId, setActiveModuleId] = useState('notes');
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
        <h1>modern</h1>
        <p className="assistive-subtitle">Assistive communication board</p>
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
          className={`modular-nav-item ${activeModuleId === 'notes' ? 'is-active' : ''}`}
          onClick={() => setActiveModuleId('notes')}
        >
          Notes
        </button>
        <button
          type="button"
          className={`modular-nav-item ${activeModuleId === 'appointments' ? 'is-active' : ''}`}
          onClick={() => setActiveModuleId('appointments')}
        >
          Appointments
        </button>
        <button
          type="button"
          className={`modular-nav-item ${activeModuleId === 'calendar' ? 'is-active' : ''}`}
          onClick={() => setActiveModuleId('calendar')}
        >
          Calendar
        </button>
        <button
          type="button"
          className={`modular-nav-item ${activeModuleId === 'availability' ? 'is-active' : ''}`}
          onClick={() => setActiveModuleId('availability')}
        >
          Availability
        </button>
        <button
          type="button"
          className={`modular-nav-item ${activeModuleId === 'reservations' ? 'is-active' : ''}`}
          onClick={() => setActiveModuleId('reservations')}
        >
          Reservations
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
          className={`modular-nav-item ${activeModuleId === 'customers' ? 'is-active' : ''}`}
          onClick={() => setActiveModuleId('customers')}
        >
          Customers
        </button>
        <button
          type="button"
          className={`modular-nav-item ${activeModuleId === 'services' ? 'is-active' : ''}`}
          onClick={() => setActiveModuleId('services')}
        >
          Services
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
          className={`modular-nav-item ${activeModuleId === 'haircut' ? 'is-active' : ''}`}
          onClick={() => setActiveModuleId('haircut')}
        >
          Haircut
        </button>
        <button
          type="button"
          className={`modular-nav-item ${activeModuleId === 'wash' ? 'is-active' : ''}`}
          onClick={() => setActiveModuleId('wash')}
        >
          Wash
        </button>
        <button
          type="button"
          className={`modular-nav-item ${activeModuleId === 'styling' ? 'is-active' : ''}`}
          onClick={() => setActiveModuleId('styling')}
        >
          Styling
        </button>
        <button
          type="button"
          className={`modular-nav-item ${activeModuleId === 'customer' ? 'is-active' : ''}`}
          onClick={() => setActiveModuleId('customer')}
        >
          Customer
        </button>
        <button
          type="button"
          className={`modular-nav-item ${activeModuleId === 'service' ? 'is-active' : ''}`}
          onClick={() => setActiveModuleId('service')}
        >
          Service
        </button>
        <button
          type="button"
          className={`modular-nav-item ${activeModuleId === 'date' ? 'is-active' : ''}`}
          onClick={() => setActiveModuleId('date')}
        >
          Date
        </button>
        <button
          type="button"
          className={`modular-nav-item ${activeModuleId === 'time' ? 'is-active' : ''}`}
          onClick={() => setActiveModuleId('time')}
        >
          Time
        </button>
        <button
          type="button"
          className={`modular-nav-item ${activeModuleId === 'modern' ? 'is-active' : ''}`}
          onClick={() => setActiveModuleId('modern')}
        >
          Modern
        </button>
        <button
          type="button"
          className={`modular-nav-item ${activeModuleId === 'clean' ? 'is-active' : ''}`}
          onClick={() => setActiveModuleId('clean')}
        >
          Clean
        </button>
        <button
          type="button"
          className={`modular-nav-item ${activeModuleId === 'responsive' ? 'is-active' : ''}`}
          onClick={() => setActiveModuleId('responsive')}
        >
          Responsive
        </button>
      </nav>
      <div className="modular-active-feature">
        {ActiveComponent ? <ActiveComponent /> : null}
      </div>
    </div>
  );
}
