/**
 * Universal Prompt-to-App Materialization V1 — profile-specific domain UI generator.
 */

import type { ProfileFeatureDefinition } from './profile-feature-map.js';

function esc(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/`/g, '\\`');
}

export function profileDomainCopy(profile: ProfileFeatureDefinition['profile'], appTitle: string): Record<string, string> {
  switch (profile) {
    case 'EXPENSE_TRACKER_WEB_V1':
    case 'FINANCE_TRACKER_WEB_V1':
      return {
        headline: `${appTitle} — track income, expenses, categories, and reports`,
        dashboard: 'Balance overview with income vs expenses cards and monthly budget progress.',
        income: 'Record income entries and review incoming cash flow.',
        expenses: 'Add expenses, attach categories, and monitor spending.',
        categories: 'Manage expense and income categories.',
        reports: 'Generate spending and income reports.',
        charts: 'Visualize trends with charts and analytics.',
        'csv-export': 'Export transactions to CSV for accounting.',
        persistence: 'Demo data persists in local storage for preview testing.',
      };
    case 'CRM_WEB_V1':
      return {
        headline: `${appTitle} — customers, leads, pipeline, deals, and contacts`,
        dashboard: 'Pipeline snapshot with open deals and lead activity.',
        customers: 'Manage customer accounts and contact details.',
        leads: 'Track inbound leads and qualification status.',
        pipeline: 'Move opportunities through pipeline stages.',
        deals: 'Review deal value, stage, and close dates.',
        contacts: 'Search contacts and communication history.',
        'follow-ups': 'Schedule and track follow-up tasks with contacts and leads.',
        reports: 'Sales performance and conversion reports.',
      };
    case 'QR_APP':
      return {
        headline: `${appTitle} — generate, scan, and manage QR codes`,
        dashboard: 'Recent QR activity and quick generate actions.',
        generator: 'Create QR codes from text or URLs.',
        scanner: 'Scan QR codes with camera or manual input.',
        'code-history': 'Review previously generated and scanned codes.',
        analytics: 'QR usage analytics and scan trends.',
        settings: 'Configure QR size, format, and defaults.',
        generate: 'Create QR codes from text or URLs.',
        scan: 'Scan QR codes with camera or manual input.',
        history: 'Review previously generated and scanned codes.',
      };
    case 'INVENTORY_WEB_V1':
      return {
        headline: `${appTitle} — inventory, stock, products, and suppliers`,
        dashboard: 'Stock health overview and low-inventory alerts.',
        products: 'Manage product catalog and SKUs.',
        stock: 'Adjust stock counts and movement history.',
        suppliers: 'Maintain supplier contacts and lead times.',
        reorder: 'Reorder suggestions based on stock thresholds.',
        reports: 'Inventory valuation and movement reports.',
        inventory: 'Track inventory levels across locations.',
      };
    case 'BOOKING_WEB_V1':
      return {
        headline: `${appTitle} — appointments, calendar, and availability`,
        dashboard: 'Upcoming bookings and availability summary.',
        appointments: 'Create and manage customer appointments.',
        calendar: 'Calendar view of scheduled sessions.',
        customers: 'Customer booking profiles and history.',
        availability: 'Configure bookable time slots.',
        reports: 'Booking volume and utilization reports.',
      };
    case 'TASK_TRACKER_WEB_V1':
      return {
        headline: `${appTitle} — tasks, projects, labels, and calendar views`,
        dashboard: 'Active tasks, due soon items, and completion rate.',
        tasks: 'Create tasks, mark complete, and filter by status.',
        projects: 'Organize tasks into projects and milestones.',
        labels: 'Tag and filter tasks with labels.',
        calendar: 'View tasks and due dates on a calendar timeline.',
        reports: 'Productivity and completion reports.',
        settings: 'Configure task defaults, labels, and notifications.',
        filters: 'Filter active, completed, and overdue tasks.',
      };
    case 'ASSISTIVE_COMMUNICATION_APP_V1':
      return {
        headline: `${appTitle} — assistive communication with gaze, blink, and speech output`,
        'onboarding-calibration': 'Calibrate gaze and blink input sensitivity.',
        'eye-tracking-board': 'Eye-tracking communication board with large accessible tiles.',
        'blink-input-engine': 'Blink detection and simulation controls.',
        'gaze-keyboard': 'Gaze-based keyboard for message composition.',
        'text-to-speech': 'Convert composed messages to speech output.',
        'quick-phrases': 'Save and select quick phrases.',
        'caregiver-dashboard': 'Caregiver monitoring and assistance dashboard.',
        'communication-history': 'Review and filter past messages.',
        'accessibility-settings': 'Adjust contrast, dwell time, and accessibility preferences.',
        'emergency-speech': 'One-tap emergency speech phrase.',
      };
    case 'HABIT_TRACKER_WEB_V1':
    case 'GENERIC_CUSTOM_APP_V1':
      return {
        headline: `${appTitle} — habits, streaks, and daily routines`,
        dashboard: 'Today\'s routines and current streak summary.',
        habits: 'Track daily habits and completion check-ins.',
        streaks: 'View streak counts and consistency trends.',
        routines: 'Plan morning and evening routines.',
        goals: 'Set and track habit goals and milestones.',
        analytics: 'Weekly habit analytics and completion trends.',
        'daily-routines': 'Plan morning and evening routines.',
        reports: 'Weekly habit completion reports.',
        records: 'Log daily routine entries and notes.',
        settings: 'Configure reminders and routine templates.',
      };
    default:
      return {
        headline: `${appTitle} dashboard`,
        dashboard: 'Overview of your application data.',
        reports: 'Reports and insights for your workspace.',
      };
  }
}

export function resolveDomainCopy(
  definition: ProfileFeatureDefinition,
  appTitle: string,
): Record<string, string> {
  if (definition.customDomainCopy && Object.keys(definition.customDomainCopy).length > 0) {
    return definition.customDomainCopy;
  }
  return profileDomainCopy(definition.profile, appTitle);
}

export function buildFeatureRegistryTs(modules: string[]): string {
  return `/** Feature module registry — generated by Universal Prompt-to-App Materialization V1 */
export const FEATURE_MODULES = ${JSON.stringify(modules, null, 2)} as const;
export type FeatureModuleId = (typeof FEATURE_MODULES)[number];
`;
}

export function buildFeatureRoutesTs(routes: string[]): string {
  return `/** Route/view registry — generated by Universal Prompt-to-App Materialization V1 */
export const APP_ROUTES = ${JSON.stringify(routes, null, 2)} as const;
export type AppRoutePath = (typeof APP_ROUTES)[number];
`;
}

export function buildDomainAppFeatureTsx(
  appTitle: string,
  definition: ProfileFeatureDefinition,
): string {
  const copy = profileDomainCopy(definition.profile, appTitle);
  const tabs = definition.featureModules.filter((m) => m !== 'auth' && m !== 'persistence');
  const safeTitle = esc(appTitle);

  const tabPanels = tabs
    .map((tab) => {
      const label = tab.replace(/-/g, ' ');
      const description = copy[tab] ?? `${label} workspace for ${safeTitle}.`;
      return `      {activeTab === '${tab}' ? (
        <section className="domain-panel" data-feature-module="${tab}">
          <h2>${label.charAt(0).toUpperCase()}${label.slice(1)}</h2>
          <p>${esc(description)}</p>
          <div className="domain-cards">
            <article className="domain-card"><h3>${safeTitle}</h3><p>${esc(description)}</p></article>
            <article className="domain-card"><h3>Demo data</h3><p>Sample ${label} records loaded for Live Preview.</p></article>
          </div>
        </section>
      ) : null}`;
    })
    .join('\n');

  const tabButtons = tabs
    .map(
      (tab) =>
        `        <button type="button" className={\`domain-tab \${activeTab === '${tab}' ? 'is-active' : ''}\`} onClick={() => setActiveTab('${tab}')}>${tab.replace(/-/g, ' ')}</button>`,
    )
    .join('\n');

  return `import { useMemo, useState } from 'react';
import './domain-app-feature.css';

const APP_TITLE = '${safeTitle}';

export default function DomainAppFeature() {
  const [activeTab, setActiveTab] = useState('${tabs[0] ?? 'dashboard'}');
  const headline = useMemo(() => '${esc(copy.headline ?? `${safeTitle} workspace`)}', []);

  return (
    <div className="domain-app-feature" data-materialization-profile="${definition.profile}">
      <header className="domain-header">
        <h1>{APP_TITLE}</h1>
        <p className="domain-headline">{headline}</p>
      </header>
      <nav className="domain-tabs" aria-label="Feature modules">
${tabButtons}
      </nav>
      <div className="domain-panels">
${tabPanels}
      </div>
    </div>
  );
}
`;
}

export function buildDomainAppFeatureCss(): string {
  return `.domain-app-feature { width: 100%; max-width: 960px; margin: 0 auto; }
.domain-header h1 { margin: 0 0 0.35rem; font-size: 1.75rem; }
.domain-headline { margin: 0 0 1rem; color: #64748b; }
.domain-tabs { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; }
.domain-tab { border: 1px solid #cbd5e1; background: #fff; border-radius: 999px; padding: 0.4rem 0.85rem; cursor: pointer; text-transform: capitalize; }
.domain-tab.is-active { background: #2563eb; color: #fff; border-color: transparent; }
.domain-panel h2 { text-transform: capitalize; margin-top: 0; }
.domain-cards { display: grid; gap: 0.75rem; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
.domain-card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 1rem; background: #fff; }
`;
}

export function buildDemoDataTs(appTitle: string, definition: ProfileFeatureDefinition): string {
  return `/** Demo data — generated for ${appTitle} (${definition.profile}) */
export const DEMO_APP_TITLE = ${JSON.stringify(appTitle)};
export const DEMO_FEATURE_MODULES = ${JSON.stringify(definition.featureModules)} as const;
`;
}
