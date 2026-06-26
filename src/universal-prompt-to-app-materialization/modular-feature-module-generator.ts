/**
 * Modular Feature Materialization V1 — per-module file generation.
 */

import type { GeneratedWorkspaceFile } from '../code-generation-engine/code-generation-engine-types.js';
import type { ProfileFeatureDefinition } from './profile-feature-map.js';
import { resolveDomainCopy } from './profile-feature-ui-generator.js';

export interface GeneratedFeatureModuleManifestEntry {
  readOnly: true;
  id: string;
  name: string;
  route: string;
  files: string[];
  componentPath: string;
  servicePath: string;
  typesPath: string;
  validationPath: string;
  sourceLines: number;
  promptTerms: string[];
  contractId: string;
  status: 'generated';
}

const INFRASTRUCTURE_MODULES = new Set(['persistence']);

function esc(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/`/g, '\\`');
}

export function moduleIdToPascalCase(moduleId: string): string {
  return moduleId
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

export function moduleIdToDisplayName(moduleId: string): string {
  return moduleId
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function resolveModuleRoute(
  moduleId: string,
  featureModules: string[],
  routes: string[],
): string {
  const index = featureModules.indexOf(moduleId);
  if (index >= 0 && routes[index]) return routes[index]!;
  if (moduleId === 'auth') return '/';
  return `/${moduleId}`;
}

export function materializableFeatureModules(definition: ProfileFeatureDefinition): string[] {
  return definition.featureModules.filter((moduleId) => !INFRASTRUCTURE_MODULES.has(moduleId));
}

function modulePromptTerms(
  moduleId: string,
  definition: ProfileFeatureDefinition,
): string[] {
  const base = [moduleId.replace(/-/g, ' ')];
  for (const term of definition.requiredUiTerms) {
    const normalized = term.toLowerCase();
    if (
      moduleId.includes(normalized) ||
      normalized.includes(moduleId.replace(/-/g, '')) ||
      normalized.includes(moduleId.split('-')[0] ?? '')
    ) {
      base.push(term);
    }
  }
  return [...new Set(base)].slice(0, 6);
}

function buildFeatureComponentTsx(
  moduleId: string,
  appTitle: string,
  definition: ProfileFeatureDefinition,
): string {
  const pascal = moduleIdToPascalCase(moduleId);
  const displayName = moduleIdToDisplayName(moduleId);
  const copy = resolveDomainCopy(definition, appTitle);
  const description = copy[moduleId] ?? `${displayName} module for ${appTitle}.`;
  const terms = modulePromptTerms(moduleId, definition);
  const interactionControl = isInformationalFeatureModule(moduleId)
    ? ''
    : `
        <button type="button" data-interaction-control="true" className="modular-feature-action">
          Manage ${displayName}
        </button>`;

  return `import { useMemo } from 'react';
import type { ${pascal}Record } from './${moduleId}.types';
import { list${pascal}Records } from './${moduleId}.service';
import { ${moduleId.replace(/-/g, '_').toUpperCase()}_VALIDATION } from './${moduleId}.validation';
import './${moduleId}.module.css';

export default function ${pascal}Feature() {
  const records = useMemo(() => list${pascal}Records(), []);
  const headline = useMemo(() => '${esc(description)}', []);

  return (
    <section
      className="modular-feature"
      data-feature-module="${moduleId}"
      data-modular-feature-v1="true"
      data-prompt-terms="${esc(terms.join(','))}"
    >
      <header className="modular-feature-header">
        <h2>${displayName}</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <article className="modular-feature-card">
          <h3>${esc(appTitle)} — ${displayName}</h3>
          <p>{headline}</p>${interactionControl}
          <p data-validation-rules={${moduleId.replace(/-/g, '_').toUpperCase()}_VALIDATION.rules.length}>
            Validation rules: {${moduleId.replace(/-/g, '_').toUpperCase()}_VALIDATION.rules.length}
          </p>
        </article>
        <ul className="modular-feature-records">
          {records.map((record: ${pascal}Record) => (
            <li key={record.id}>{record.label}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
`;
}

function buildFeatureTypesTs(moduleId: string, appTitle: string): string {
  const pascal = moduleIdToPascalCase(moduleId);
  return `/** Types for ${moduleId} feature module — ${appTitle} */
export interface ${pascal}Record {
  id: string;
  label: string;
  createdAt: string;
}

export interface ${pascal}FormState {
  label: string;
}
`;
}

function buildFeatureServiceTs(moduleId: string, appTitle: string): string {
  const pascal = moduleIdToPascalCase(moduleId);
  const displayName = moduleIdToDisplayName(moduleId);
  return `/** Service adapter for ${moduleId} — ${appTitle} */
import type { ${pascal}Record } from './${moduleId}.types';

const DEMO_${moduleId.replace(/-/g, '_').toUpperCase()}_RECORDS: ${pascal}Record[] = [
  { id: '${moduleId}-1', label: 'Sample ${displayName} record', createdAt: new Date().toISOString() },
  { id: '${moduleId}-2', label: '${displayName} preview entry', createdAt: new Date().toISOString() },
];

export function list${pascal}Records(): ${pascal}Record[] {
  return DEMO_${moduleId.replace(/-/g, '_').toUpperCase()}_RECORDS;
}
`;
}

function buildFeatureValidationTs(moduleId: string, appTitle: string): string {
  const pascal = moduleIdToPascalCase(moduleId);
  const displayName = moduleIdToDisplayName(moduleId);
  const interactionMode = isInformationalFeatureModule(moduleId) ? 'informational' : 'interactive';
  return `/** Validation metadata for ${moduleId} — ${appTitle} */
export const ${moduleId.replace(/-/g, '_').toUpperCase()}_VALIDATION = {
  moduleId: '${moduleId}',
  contractId: 'feature-${moduleId}',
  displayName: '${displayName}',
  interactionMode: '${interactionMode}',
  rules: [
    { field: 'label', rule: 'required', message: '${displayName} label is required' },
    { field: 'label', rule: 'minLength', value: 2, message: '${displayName} label must be at least 2 characters' },
  ],
} as const;

export type ${pascal}ValidationRule = (typeof ${moduleId.replace(/-/g, '_').toUpperCase()}_VALIDATION.rules)[number];
`;
}

function isInformationalFeatureModule(moduleId: string): boolean {
  return new Set(['dashboard', 'reports', 'charts', 'analytics', 'code-history', 'history']).has(moduleId);
}

function buildFeatureModuleCss(moduleId: string): string {
  return `.modular-feature[data-feature-module="${moduleId}"] { width: 100%; }
.modular-feature-header h2 { margin: 0 0 0.35rem; text-transform: capitalize; }
.modular-feature-header p { margin: 0 0 1rem; color: #64748b; }
.modular-feature-body { display: grid; gap: 0.75rem; }
.modular-feature-card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 1rem; background: #fff; }
.modular-feature-records { margin: 0; padding-left: 1.25rem; }
`;
}

function buildFeatureIndexTs(moduleId: string): string {
  const pascal = moduleIdToPascalCase(moduleId);
  return `export { default } from './${pascal}Feature';
export * from './${moduleId}.types';
export * from './${moduleId}.service';
export * from './${moduleId}.validation';
`;
}

export function buildModularFeatureModuleFiles(
  moduleId: string,
  appTitle: string,
  definition: ProfileFeatureDefinition,
): { files: GeneratedWorkspaceFile[]; manifestEntry: GeneratedFeatureModuleManifestEntry } {
  const pascal = moduleIdToPascalCase(moduleId);
  const folder = `src/features/${moduleId}`;
  const componentPath = `${folder}/${pascal}Feature.tsx`;
  const typesPath = `${folder}/${moduleId}.types.ts`;
  const servicePath = `${folder}/${moduleId}.service.ts`;
  const validationPath = `${folder}/${moduleId}.validation.ts`;
  const cssPath = `${folder}/${moduleId}.module.css`;
  const indexPath = `${folder}/index.ts`;

  const componentContent = buildFeatureComponentTsx(moduleId, appTitle, definition);
  const files: GeneratedWorkspaceFile[] = [
    { relativePath: componentPath, content: componentContent },
    { relativePath: typesPath, content: buildFeatureTypesTs(moduleId, appTitle) },
    { relativePath: servicePath, content: buildFeatureServiceTs(moduleId, appTitle) },
    { relativePath: validationPath, content: buildFeatureValidationTs(moduleId, appTitle) },
    { relativePath: cssPath, content: buildFeatureModuleCss(moduleId) },
    { relativePath: indexPath, content: buildFeatureIndexTs(moduleId) },
  ];

  const sourceLines = files.reduce((sum, file) => sum + file.content.split('\n').length, 0);

  return {
    files,
    manifestEntry: {
      readOnly: true,
      id: moduleId,
      name: moduleIdToDisplayName(moduleId),
      route: resolveModuleRoute(moduleId, definition.featureModules, definition.routes),
      files: files.map((file) => file.relativePath),
      componentPath,
      servicePath,
      typesPath,
      validationPath,
      sourceLines,
      promptTerms: modulePromptTerms(moduleId, definition),
      contractId: `feature-${moduleId}`,
      status: 'generated',
    },
  };
}

export function buildAllModularFeatureModuleFiles(
  appTitle: string,
  definition: ProfileFeatureDefinition,
): { files: GeneratedWorkspaceFile[]; manifestEntries: GeneratedFeatureModuleManifestEntry[] } {
  const modules = materializableFeatureModules(definition);
  const files: GeneratedWorkspaceFile[] = [];
  const manifestEntries: GeneratedFeatureModuleManifestEntry[] = [];

  for (const moduleId of modules) {
    const built = buildModularFeatureModuleFiles(moduleId, appTitle, definition);
    files.push(...built.files);
    manifestEntries.push(built.manifestEntry);
  }

  return { files, manifestEntries };
}

export function buildModularFeatureRegistryTs(
  entries: GeneratedFeatureModuleManifestEntry[],
): string {
  const imports = entries
    .map((entry) => `import ${moduleIdToPascalCase(entry.id)}Feature from './${entry.id}';`)
    .join('\n');

  const registryBody = entries
    .map(
      (entry) => `  {
    id: '${entry.id}',
    name: '${entry.name}',
    route: '${entry.route}',
    component: ${moduleIdToPascalCase(entry.id)}Feature,
    sourcePath: '${entry.componentPath}',
    contractId: '${entry.contractId}',
    promptTerms: ${JSON.stringify(entry.promptTerms)},
    status: 'generated' as const,
  }`,
    )
    .join(',\n');

  return `/** Feature module registry — Modular Feature Materialization V1 */
${imports}

export const FEATURE_REGISTRY = [
${registryBody}
] as const;

export type FeatureRegistryEntry = (typeof FEATURE_REGISTRY)[number];
export type FeatureModuleId = FeatureRegistryEntry['id'];

export const FEATURE_MODULE_IDS = FEATURE_REGISTRY.map((entry) => entry.id);
`;
}

export function buildModularFeatureRoutesTs(): string {
  return `/** Route registry — Modular Feature Materialization V1 */
import { FEATURE_REGISTRY } from './registry';

export const APP_ROUTES = FEATURE_REGISTRY.map((entry) => ({
  path: entry.route,
  moduleId: entry.id,
  name: entry.name,
  component: entry.component,
  sourcePath: entry.sourcePath,
})) as const;

export type AppRouteEntry = (typeof APP_ROUTES)[number];
export type AppRoutePath = AppRouteEntry['path'];
`;
}

export function buildFeatureAppRouterTsx(definition: ProfileFeatureDefinition): string {
  const navModules = materializableFeatureModules(definition).filter(
    (moduleId) => moduleId !== 'auth',
  );
  const defaultModule = navModules[0] ?? 'dashboard';
  const copy = definition.customDomainCopy ?? {};
  const appTitle = copy.headline?.split(' — ')[0] ?? 'Custom App';
  const androidPreview = definition.androidPhonePreviewRequired === true;
  const isAssistiveApp = definition.profile === 'GENERIC_CUSTOM_APP_V1' && Boolean(definition.customDomainCopy);

  const navButtons = navModules
    .map(
      (moduleId) =>
        `        <button
          type="button"
          className={\`modular-nav-item \${activeModuleId === '${moduleId}' ? 'is-active' : ''}\`}
          onClick={() => setActiveModuleId('${moduleId}')}
        >
          ${moduleIdToDisplayName(moduleId)}
        </button>`,
    )
    .join('\n');

  const assistiveHeader = isAssistiveApp
    ? `
      <header className="assistive-app-header" data-communication-board="true">
        <h1>${esc(appTitle)}</h1>
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
      </header>`
    : '';

  const routerClass = androidPreview
    ? 'feature-app-router android-phone-preview'
    : 'feature-app-router';

  return `import { useMemo, useState } from 'react';
import { FEATURE_REGISTRY } from './registry';
import './feature-app-router.css';

/** Modular feature router — renders registry modules dynamically */
export default function FeatureAppRouter() {
  const [activeModuleId, setActiveModuleId] = useState('${defaultModule}');
  const activeEntry = useMemo(
    () => FEATURE_REGISTRY.find((entry) => entry.id === activeModuleId) ?? FEATURE_REGISTRY[0],
    [activeModuleId],
  );
  const ActiveComponent = activeEntry?.component;

  return (
    <div
      className="${routerClass}"
      data-modular-feature-router="v1"
      data-materialization-profile="${definition.profile}"${androidPreview ? '\n      data-android-phone-preview="true"' : ''}
    >${assistiveHeader}
      <nav className="modular-nav" aria-label="Feature modules">
${navButtons}
      </nav>
      <div className="modular-active-feature">
        {ActiveComponent ? <ActiveComponent /> : null}
      </div>
    </div>
  );
}
`;
}

export function buildFeatureAppRouterCss(definition?: ProfileFeatureDefinition): string {
  const phoneCss = definition?.androidPhonePreviewRequired
    ? `
.android-phone-preview {
  max-width: 420px;
  min-height: 720px;
  margin: 0 auto;
  border: 12px solid #1e293b;
  border-radius: 28px;
  padding: 1rem;
  background: #f8fafc;
  box-shadow: 0 12px 40px rgba(15, 23, 42, 0.25);
}
.assistive-app-header { margin-bottom: 1rem; }
.assistive-app-header h1 { font-size: 1.35rem; margin: 0 0 0.25rem; }
.assistive-subtitle { margin: 0 0 0.75rem; color: #475569; font-weight: 600; }
.assistive-status-row { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.75rem; font-size: 0.9rem; }
.assistive-controls { display: flex; gap: 0.5rem; margin-bottom: 0.75rem; }
.assistive-speak-btn, .assistive-emergency-btn {
  flex: 1;
  min-height: 48px;
  font-size: 1rem;
  border-radius: 12px;
  border: none;
  cursor: pointer;
}
.assistive-speak-btn { background: #2563eb; color: #fff; }
.assistive-emergency-btn { background: #dc2626; color: #fff; font-weight: 700; }
.assistive-safety-note { font-size: 0.85rem; color: #64748b; margin: 0; }
.modular-nav-item { min-height: 44px; font-size: 0.95rem; }
`
    : '';
  return `.feature-app-router { width: 100%; max-width: 960px; margin: 0 auto; }
.modular-nav { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; }
.modular-nav-item { border: 1px solid #cbd5e1; background: #fff; border-radius: 999px; padding: 0.4rem 0.85rem; cursor: pointer; }
.modular-nav-item.is-active { background: #2563eb; color: #fff; border-color: transparent; }
.modular-active-feature { min-height: 240px; }
${phoneCss}`;
}
