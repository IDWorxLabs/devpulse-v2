import { useMemo } from 'react';
import type { NavigationRouterRecord } from './navigation-router.types';
import { listNavigationRouterRecords } from './navigation-router.service';
import { NAVIGATION_ROUTER_VALIDATION } from './navigation-router.validation';
import './navigation-router.module.css';

export default function NavigationRouterFeature() {
  const records = useMemo(() => listNavigationRouterRecords(), []);
  const headline = useMemo(() => 'Navigation Router module for Custom App.', []);

  return (
    <section
      className="modular-feature"
      data-feature-module="navigation-router"
      data-modular-feature-v1="true"
      data-prompt-terms="navigation router"
    >
      <header className="modular-feature-header">
        <h2>Navigation Router</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <article className="modular-feature-card">
          <h3>Custom App — Navigation Router</h3>
          <p>{headline}</p>
        <button type="button" data-interaction-control="true" className="modular-feature-action">
          Manage Navigation Router
        </button>
          <p data-validation-rules={NAVIGATION_ROUTER_VALIDATION.rules.length}>
            Validation rules: {NAVIGATION_ROUTER_VALIDATION.rules.length}
          </p>
        </article>
        <ul className="modular-feature-records">
          {records.map((record: NavigationRouterRecord) => (
            <li key={record.id}>{record.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
