/**
 * Universal CRUD app generator — Code Generation Engine V1.
 * Generates profile-aware feature modules from Universal Feature Contracts.
 */

import type { GeneratedWorkspaceFile, GeneratedAppProfile } from './code-generation-engine-types.js';
import { composeGeneratedAppWorkspaceFiles } from '../universal-app-blueprint/universal-app-blueprint-authority.js';
import { mergePackageJsonWithBlueprint } from '../universal-app-blueprint/universal-app-blueprint-generator.js';
import { UNIVERSAL_APP_BLUEPRINT_VERSION } from '../universal-app-blueprint/universal-app-blueprint-types.js';
import {
  buildUniversalFeatureContract,
  buildUniversalFeatureContractJson,
  getPrimaryEntity,
} from '../universal-feature-contract-intelligence/universal-feature-contract-builder.js';
import type { UniversalFeatureContract } from '../universal-feature-contract-intelligence/universal-feature-contract-types.js';

function profileSlug(profile: UniversalFeatureContract['productProfile']): string {
  switch (profile) {
    case 'TASK_TRACKER_WEB_V1':
      return 'task-tracker-v1';
    case 'CRM_WEB_V1':
      return 'crm-v1';
    case 'INVENTORY_WEB_V1':
      return 'inventory-v1';
    case 'SCHOOL_MANAGEMENT_WEB_V1':
      return 'school-management-v1';
    case 'PROJECT_MANAGEMENT_WEB_V1':
      return 'project-management-v1';
    case 'EXPENSE_TRACKER_WEB_V1':
      return 'expense-tracker-v1';
    case 'FINANCE_TRACKER_WEB_V1':
      return 'finance-tracker-v1';
    case 'QR_APP':
      return 'qr-app-v1';
  }
}

export function buildUniversalCrudPackageJson(contractId: string, profile: UniversalFeatureContract['productProfile']): string {
  return mergePackageJsonWithBlueprint(
    JSON.stringify(
      {
        name: contractId,
        version: '0.1.0',
        private: true,
        type: 'module',
        description: `Generated universal app for ${contractId}`,
        scripts: {
          dev: 'vite',
          build: 'vite build',
          preview: 'vite preview',
          verify: 'node verification/run-verify.mjs',
        },
        dependencies: {
          react: '^18.3.1',
          'react-dom': '^18.3.1',
        },
        devDependencies: {
          '@types/react': '^18.3.12',
          '@types/react-dom': '^18.3.1',
          '@vitejs/plugin-react': '^4.3.4',
          typescript: '~5.6.3',
          vite: '^5.4.11',
        },
        devpulseGeneratedApp: profileSlug(profile),
        devpulseCodeGenerationEngine: 'v1',
        devpulseUniversalFeatureContract: 'v1',
      },
      null,
      2,
    ) + '\n',
  );
}

export function buildUniversalFeatureTsx(contract: UniversalFeatureContract): string {
  const primary = getPrimaryEntity(contract);
  const slug = primary.slug;
  const storageKey = primary.storageKey;
  const hasComplete = contract.actions.some((action) => action.verb === 'complete' && action.required);
  const hasTaskFilters =
    contract.productProfile === 'TASK_TRACKER_WEB_V1' &&
    contract.actions.some((action) => action.id.includes('filter') && action.required);
  const hasSearch =
    !hasTaskFilters &&
    contract.actions.some((action) => action.verb === 'search' && action.required);

  return `import { useEffect, useMemo, useState, type FormEvent, type KeyboardEvent } from 'react';
import './universal-feature.css';

type RecordFilter = 'all' | 'active' | 'completed';

interface UniversalRecord {
  id: string;
  text: string;
  completed: boolean;
}

const STORAGE_KEY = '${storageKey}';

function createRecordId(): string {
  return \`record-\${Date.now()}-\${Math.random().toString(36).slice(2, 8)}\`;
}

function loadStoredRecords(): UniversalRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as UniversalRecord[];
  } catch {
    return [];
  }
}

export default function UniversalFeature() {
  const [records, setRecords] = useState<UniversalRecord[]>(() => loadStoredRecords());
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<RecordFilter>('all');
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }, [records]);

  const activeCount = useMemo(() => records.filter((record) => !record.completed).length, [records]);

  const filteredRecords = useMemo(() => {
    let next = records;
    ${hasTaskFilters ? `if (filter === 'active') next = next.filter((record) => !record.completed);
    if (filter === 'completed') next = next.filter((record) => record.completed);` : ''}
    ${hasSearch ? `const query = searchQuery.trim().toLowerCase();
    if (query) next = next.filter((record) => record.text.toLowerCase().includes(query));` : ''}
    return next;
  }, [records${hasTaskFilters ? ', filter' : ''}${hasSearch ? ', searchQuery' : ''}]);

  function handleAddRecord(event?: FormEvent) {
    event?.preventDefault();
    const text = input.trim();
    if (!text) {
      setFormError('Enter a value before adding.');
      return;
    }
    setFormError(null);
    setRecords((current) => [...current, { id: createRecordId(), text, completed: false }]);
    setInput('');
    setStatusMessage('Record added.');
  }

  function handleToggleComplete(recordId: string) {
    setRecords((current) =>
      current.map((record) =>
        record.id === recordId ? { ...record, completed: !record.completed } : record,
      ),
    );
    setStatusMessage('Record updated.');
  }

  function handleDeleteRecord(recordId: string) {
    setRecords((current) => current.filter((record) => record.id !== recordId));
    setStatusMessage('Record deleted.');
  }

  function beginEditRecord(record: UniversalRecord) {
    setEditingRecordId(record.id);
    setEditDraft(record.text);
    setFormError(null);
  }

  function saveRecordEdit(recordId: string) {
    const text = editDraft.trim();
    if (!text) {
      setFormError('Value cannot be empty.');
      return;
    }
    setFormError(null);
    setRecords((current) => current.map((record) => (record.id === recordId ? { ...record, text } : record)));
    setEditingRecordId(null);
    setEditDraft('');
    setStatusMessage('Record updated.');
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') handleAddRecord();
  }

  return (
    <div className="universal-feature">
      <header className="universal-feature-header">
        <h1>${contract.productName}</h1>
        <p className="universal-feature-subtitle">${primary.pluralLabel} management</p>
      </header>

      <form className="universal-feature-form" onSubmit={handleAddRecord}>
        <input
          data-testid="${slug}-input"
          className="universal-feature-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleInputKeyDown}
          placeholder="Add ${primary.label.toLowerCase()}..."
          aria-label="Add ${primary.label.toLowerCase()}"
        />
        <button data-testid="add-${slug}-button" type="submit" className="universal-feature-btn-primary">
          Add ${primary.label}
        </button>
      </form>

      {formError ? (
        <p data-testid="${slug}-form-error" className="universal-feature-form-error" role="alert">
          {formError}
        </p>
      ) : null}

      <p data-testid="${slug}-status-message" className="universal-feature-status-message">
        {statusMessage ?? ''}
      </p>

      ${hasSearch ? `<input
        data-testid="search-${slug}-input"
        className="universal-feature-search"
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        placeholder="Search ${primary.pluralLabel.toLowerCase()}..."
        aria-label="Search ${primary.pluralLabel.toLowerCase()}"
      />` : ''}

      ${hasTaskFilters ? `<div className="universal-feature-filters">
        <button data-testid="filter-active" type="button" onClick={() => setFilter('active')}>Active</button>
        <button data-testid="filter-completed" type="button" onClick={() => setFilter('completed')}>Completed</button>
        <button type="button" onClick={() => setFilter('all')}>All</button>
      </div>` : ''}

      <p data-testid="${slug}-count" className="universal-feature-count">
        Active: {activeCount}
      </p>

      <ul className="universal-feature-list">
        {filteredRecords.length === 0 ? (
          <li className="universal-feature-empty">No ${primary.pluralLabel.toLowerCase()} yet.</li>
        ) : (
          filteredRecords.map((record) => (
            <li key={record.id} className={\`universal-record \${record.completed ? 'is-completed' : ''}\`.trim()}>
              ${hasComplete ? `<label className="universal-record-complete">
                <input
                  data-testid="complete-${slug}-toggle"
                  type="checkbox"
                  checked={record.completed}
                  onChange={() => handleToggleComplete(record.id)}
                />
                {!editingRecordId || editingRecordId !== record.id ? (
                  <span data-testid="${slug}-text" className="universal-record-text">{record.text}</span>
                ) : (
                  <input
                    data-testid="edit-${slug}-input"
                    className="universal-record-edit-input"
                    value={editDraft}
                    onChange={(event) => setEditDraft(event.target.value)}
                  />
                )}
              </label>` : `<div className="universal-record-body">
                {!editingRecordId || editingRecordId !== record.id ? (
                  <span data-testid="${slug}-text" className="universal-record-text">{record.text}</span>
                ) : (
                  <input
                    data-testid="edit-${slug}-input"
                    className="universal-record-edit-input"
                    value={editDraft}
                    onChange={(event) => setEditDraft(event.target.value)}
                  />
                )}
              </div>`}
              <div className="universal-record-actions">
                {editingRecordId === record.id ? (
                  <button data-testid="save-${slug}-button" type="button" onClick={() => saveRecordEdit(record.id)}>
                    Save
                  </button>
                ) : (
                  <button data-testid="edit-${slug}-button" type="button" onClick={() => beginEditRecord(record)}>
                    Edit
                  </button>
                )}
                <button data-testid="delete-${slug}-button" type="button" onClick={() => handleDeleteRecord(record.id)}>
                  Delete
                </button>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
`;
}

export function buildUniversalFeatureCss(): string {
  return `.universal-feature { width: 100%; }
.universal-feature-header h1 { margin: 0 0 0.35rem; font-size: 1.75rem; }
.universal-feature-subtitle { margin: 0; color: #64748b; }
.universal-feature-form { display: flex; gap: 0.75rem; margin: 1.25rem 0 0.75rem; flex-wrap: wrap; }
.universal-feature-input, .universal-feature-search, .universal-record-edit-input {
  flex: 1; min-width: 180px; padding: 0.65rem 0.85rem; border-radius: 10px; border: 1px solid #cbd5e1;
}
.universal-feature-btn-primary {
  padding: 0.65rem 1rem; border: none; border-radius: 10px; background: #2563eb; color: white; cursor: pointer;
}
.universal-feature-filters { display: flex; gap: 0.5rem; margin-bottom: 0.75rem; flex-wrap: wrap; }
.universal-feature-count { color: #334155; margin: 0 0 0.75rem; }
.universal-feature-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.75rem; }
.universal-record {
  display: flex; justify-content: space-between; gap: 0.75rem; align-items: center;
  padding: 0.85rem 1rem; border-radius: 12px; border: 1px solid #e2e8f0; background: white;
}
.universal-record.is-completed .universal-record-text { text-decoration: line-through; color: #94a3b8; }
.universal-record-complete { display: flex; align-items: center; gap: 0.65rem; flex: 1; }
.universal-record-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.universal-feature-form-error { color: #b91c1c; margin: 0 0 0.75rem; }
.universal-feature-status-message { min-height: 1.25rem; color: #047857; margin: 0 0 0.75rem; }
.universal-feature-empty { text-align: center; color: #64748b; padding: 1rem; border-radius: 12px; background: #f8fafc; }
`;
}

function buildSharedRuntimeFiles(contractId: string): GeneratedWorkspaceFile[] {
  return [
    {
      relativePath: 'index.html',
      content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Generated App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
    },
    {
      relativePath: 'vite.config.ts',
      content: `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { host: '127.0.0.1', port: 5173, strictPort: false },
});
`,
    },
    {
      relativePath: 'tsconfig.json',
      content: `${JSON.stringify(
        {
          compilerOptions: {
            target: 'ES2020',
            useDefineForClassFields: true,
            lib: ['ES2020', 'DOM', 'DOM.Iterable'],
            module: 'ESNext',
            skipLibCheck: true,
            moduleResolution: 'bundler',
            allowImportingTsExtensions: true,
            isolatedModules: true,
            moduleDetection: 'force',
            noEmit: true,
            jsx: 'react-jsx',
            strict: true,
          },
          include: ['src'],
        },
        null,
        2,
      )}\n`,
    },
    {
      relativePath: 'tsconfig.node.json',
      content: `${JSON.stringify({ compilerOptions: { target: 'ES2022', module: 'ESNext', skipLibCheck: true, moduleResolution: 'bundler' }, include: ['vite.config.ts'] }, null, 2)}\n`,
    },
    { relativePath: 'src/vite-env.d.ts', content: `/// <reference types="vite/client" />\n` },
    {
      relativePath: 'src/main.tsx',
      content: `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element #root not found');

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
`,
    },
    { relativePath: 'src/screens/index.ts', content: `export { default as UniversalFeature } from '../features/universal/UniversalFeature';\n` },
  ];
}

export function buildUniversalCrudWorkspaceFiles(input: {
  contractId: string;
  ideaId: string;
  buildUnits: string[];
  rawPrompt: string;
  profile?: GeneratedAppProfile;
}): GeneratedWorkspaceFile[] {
  const contract = buildUniversalFeatureContract({
    contractId: input.contractId,
    rawPrompt: input.rawPrompt,
    profile: input.profile,
  });
  const primary = getPrimaryEntity(contract);

  const sharedFiles: GeneratedWorkspaceFile[] = [
    ...buildSharedRuntimeFiles(input.contractId),
    {
      relativePath: 'package.json',
      content: buildUniversalCrudPackageJson(input.contractId, contract.productProfile),
    },
    {
      relativePath: 'build-manifest.json',
      content: `${JSON.stringify(
        {
          manifestId: `${input.contractId}-manifest`,
          contractId: input.contractId,
          ideaId: input.ideaId,
          generatedAt: new Date().toISOString(),
          materializationSource: 'universal-feature-contract-intelligence-v1',
          applicationProfile: contract.productProfile,
          universalBlueprintVersion: UNIVERSAL_APP_BLUEPRINT_VERSION,
          universalBlueprintEnabled: true,
          buildUnits: input.buildUnits,
          runtime: 'vite-react',
        },
        null,
        2,
      )}\n`,
    },
    {
      relativePath: 'universal-feature-contract.json',
      content: buildUniversalFeatureContractJson({
        contractId: input.contractId,
        rawPrompt: input.rawPrompt,
        profile: input.profile,
      }),
    },
    {
      relativePath: 'feature-contract.json',
      content: buildUniversalFeatureContractJson({
        contractId: input.contractId,
        rawPrompt: input.rawPrompt,
        profile: input.profile,
      }),
    },
  ];

  const featureFiles: GeneratedWorkspaceFile[] = [
    {
      relativePath: 'src/features/universal/UniversalFeature.tsx',
      content: buildUniversalFeatureTsx(contract),
    },
    {
      relativePath: 'src/features/universal/universal-feature.css',
      content: buildUniversalFeatureCss(),
    },
  ];

  return composeGeneratedAppWorkspaceFiles({
    blueprint: {
      contractId: input.contractId,
      ideaId: input.ideaId,
      buildUnits: input.buildUnits,
      appName: contract.productName,
      tagline: `${primary.pluralLabel} management powered by AiDevEngine`,
      coreFeatureLabel: primary.navLabel,
      coreFeatureImportPath: '../features/universal/UniversalFeature',
      coreFeatureComponentName: 'UniversalFeature',
    },
    featureFiles,
    sharedFiles,
  });
}

export function resolveUniversalGeneratedAppProfile(rawPrompt: string): UniversalFeatureContract['productProfile'] | null {
  const contract = buildUniversalFeatureContract({
    contractId: 'probe',
    rawPrompt,
  });
  return contract.productProfile;
}
