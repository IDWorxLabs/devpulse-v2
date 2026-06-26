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
      data-materialization-profile="PROJECT_MANAGEMENT_WEB_V1"
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
          className={`modular-nav-item ${activeModuleId === 'projects' ? 'is-active' : ''}`}
          onClick={() => setActiveModuleId('projects')}
        >
          Projects
        </button>
        <button
          type="button"
          className={`modular-nav-item ${activeModuleId === 'tasks' ? 'is-active' : ''}`}
          onClick={() => setActiveModuleId('tasks')}
        >
          Tasks
        </button>
        <button
          type="button"
          className={`modular-nav-item ${activeModuleId === 'team' ? 'is-active' : ''}`}
          onClick={() => setActiveModuleId('team')}
        >
          Team
        </button>
        <button
          type="button"
          className={`modular-nav-item ${activeModuleId === 'timeline' ? 'is-active' : ''}`}
          onClick={() => setActiveModuleId('timeline')}
        >
          Timeline
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
