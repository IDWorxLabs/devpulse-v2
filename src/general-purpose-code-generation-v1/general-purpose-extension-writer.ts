/**
 * General-Purpose Code Generation V1 — writes GP extension layer into workspaces.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import type { GeneralPurposeAppModel } from './general-purpose-code-generation-v1-types.js';
import { buildExtendedFeatureContracts } from './feature-contract-upgrade.js';

function esc(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"');
}

function buildWorkflowPanel(model: GeneralPurposeAppModel): string {
  const primary = model.workflows[0];
  const steps = primary?.steps ?? model.actions.slice(0, 5);

  return `import { useState } from 'react';

export default function WorkflowPanel() {
  const [activeStep, setActiveStep] = useState(0);
  const steps = ${JSON.stringify(steps)};

  return (
    <section className="gpcg-workflow-panel" data-gpcg="workflow-panel" aria-label="${esc(primary?.label ?? 'Primary Workflow')}">
      <h2>${esc(primary?.label ?? 'Primary Workflow')}</h2>
      <ol className="gpcg-workflow-steps">
        {steps.map((step, index) => (
          <li
            key={step}
            data-gpcg-workflow-step={step}
            className={index === activeStep ? 'gpcg-step-active' : ''}
          >
            <span>{index + 1}</span> {step}
          </li>
        ))}
      </ol>
      <div className="gpcg-workflow-actions">
        <button type="button" onClick={() => setActiveStep((s) => Math.max(0, s - 1))}>Previous step</button>
        <button type="button" onClick={() => setActiveStep((s) => Math.min(steps.length - 1, s + 1))}>Next step</button>
      </div>
    </section>
  );
}
`;
}

function buildRoleSelector(model: GeneralPurposeAppModel): string {
  const roles = model.roles.map((role) => role.label);
  return `import { useState } from 'react';

const ROLES = ${JSON.stringify(roles)};

export default function RoleSelector() {
  const [activeRole, setActiveRole] = useState(ROLES[0] ?? 'User');

  return (
    <nav className="gpcg-role-selector" data-gpcg="role-selector" aria-label="Role context">
      <span className="gpcg-role-label">Role:</span>
      {ROLES.map((role) => (
        <button
          key={role}
          type="button"
          className={activeRole === role ? 'gpcg-role-active' : ''}
          data-gpcg-role={role}
          onClick={() => setActiveRole(role)}
        >
          {role}
        </button>
      ))}
      <div className="gpcg-permission-placeholder" data-gpcg="permission-placeholder">
        Permissions: role-specific navigation and actions enabled
      </div>
    </nav>
  );
}
`;
}

function buildDomainLogicIndicators(model: GeneralPurposeAppModel): string {
  const indicators = [
    { label: 'Booking Conflict Warning', type: 'warning' },
    { label: 'Order Status Timeline', type: 'timeline' },
    { label: 'Ticket Priority Indicator', type: 'badge' },
    { label: 'Course Progress Tracker', type: 'progress' },
    { label: 'Invoice Status Badge', type: 'badge' },
    { label: 'Low Stock Warning', type: 'warning' },
    { label: 'Status Indicator', type: 'badge' },
  ].slice(0, 3);

  const items = indicators
    .map(
      (item) =>
        `      <div className="gpcg-domain-logic-item" data-indicator-type="${item.type}">
        <strong>${item.label}</strong>
        <span>Domain logic placeholder — ${esc(model.appType)}</span>
      </div>`,
    )
    .join('\n');

  return `export default function DomainLogicIndicators() {
  return (
    <aside className="gpcg-domain-logic" data-gpcg="domain-logic" aria-label="Domain logic indicators">
      <h3>Domain Logic</h3>
${items}
    </aside>
  );
}
`;
}

export function writeGeneralPurposeExtensions(input: {
  workspaceDir: string;
  model: GeneralPurposeAppModel;
}): readonly string[] {
  const gpcgDir = join(input.workspaceDir, 'src', 'gpcg');
  mkdirSync(gpcgDir, { recursive: true });

  const manifest = {
    version: 'general-purpose-code-generation-v1',
    strategy: input.model.strategy,
    appType: input.model.appType,
    domain: input.model.domain,
    profile: input.model.profile,
    extendedContracts: buildExtendedFeatureContracts(input.model),
    model: input.model,
  };

  const files: Array<{ relativePath: string; content: string }> = [
    { relativePath: 'src/gpcg/GeneralPurposeManifest.json', content: `${JSON.stringify(manifest, null, 2)}\n` },
    { relativePath: 'src/gpcg/WorkflowPanel.tsx', content: buildWorkflowPanel(input.model) },
    { relativePath: 'src/gpcg/RoleSelector.tsx', content: buildRoleSelector(input.model) },
    { relativePath: 'src/gpcg/DomainLogicIndicators.tsx', content: buildDomainLogicIndicators(input.model) },
    {
      relativePath: 'src/gpcg/gpcg.css',
      content: `.gpcg-workflow-panel,.gpcg-role-selector,.gpcg-domain-logic{margin:1rem;padding:1rem;border:1px solid #ddd;border-radius:8px}
.gpcg-step-active{font-weight:700}
.gpcg-role-active{background:#2563eb;color:#fff}
`,
    },
  ];

  const written: string[] = [];
  for (const file of files) {
    const fullPath = join(input.workspaceDir, file.relativePath);
    writeFileSync(fullPath, file.content, 'utf8');
    written.push(file.relativePath);
  }

  patchAppTsx(input.workspaceDir);
  return written;
}

function patchAppTsx(workspaceDir: string): void {
  const appPath = join(workspaceDir, 'src', 'App.tsx');
  if (!existsSync(appPath)) return;

  let appSource = readFileSync(appPath, 'utf8');
  if (appSource.includes('GeneralPurposeShell')) return;

  if (!appSource.includes("import './gpcg/gpcg.css'")) {
    appSource = appSource.replace(
      "import './App.css';",
      "import './App.css';\nimport './gpcg/gpcg.css';\nimport GeneralPurposeShell from './gpcg/GeneralPurposeShell';",
    );
  }

  appSource = appSource.replace(
    /return <AppShell appName="([^"]+)" \/>;/,
    'return <GeneralPurposeShell appName="$1" />;',
  );

  const shellPath = join(workspaceDir, 'src', 'gpcg', 'GeneralPurposeShell.tsx');
  if (!existsSync(shellPath)) {
    writeFileSync(
      shellPath,
      `import AppShell from '../blueprint/AppShell';
import WorkflowPanel from './WorkflowPanel';
import RoleSelector from './RoleSelector';
import DomainLogicIndicators from './DomainLogicIndicators';

interface GeneralPurposeShellProps {
  appName: string;
}

export default function GeneralPurposeShell({ appName }: GeneralPurposeShellProps) {
  return (
    <div className="gpcg-shell" data-gpcg="general-purpose-shell">
      <RoleSelector />
      <WorkflowPanel />
      <DomainLogicIndicators />
      <AppShell appName={appName} />
    </div>
  );
}
`,
      'utf8',
    );
  }

  writeFileSync(appPath, appSource, 'utf8');
}
