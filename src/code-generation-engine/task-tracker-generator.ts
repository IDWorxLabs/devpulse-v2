/**
 * Task Tracker app source generator — Code Generation Engine V1.
 */

import type { GeneratedWorkspaceFile } from './code-generation-engine-types.js';
import { extractTaskTrackerRequirements } from './task-tracker-detector.js';
import { composeGeneratedAppWorkspaceFiles } from '../universal-app-blueprint/universal-app-blueprint-authority.js';
import { mergePackageJsonWithBlueprint } from '../universal-app-blueprint/universal-app-blueprint-generator.js';
import { UNIVERSAL_APP_BLUEPRINT_VERSION } from '../universal-app-blueprint/universal-app-blueprint-types.js';
import { buildTaskTrackerFeatureContractJson } from '../feature-reality-validation/feature-contract-builder.js';

export function buildTaskTrackerPackageJson(contractId: string): string {
  return mergePackageJsonWithBlueprint(
    JSON.stringify(
      {
        name: contractId,
        version: '0.1.0',
        private: true,
        type: 'module',
        description: `Generated Task Tracker app for ${contractId}`,
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
        devpulseGeneratedApp: 'task-tracker-v1',
        devpulseCodeGenerationEngine: 'v1',
      },
      null,
      2,
    ) + '\n',
  );
}

export function buildTaskTrackerFeatureTsx(): string {
  return `import { useEffect, useMemo, useState, type FormEvent, type KeyboardEvent } from 'react';
import './task-tracker.css';

type TaskFilter = 'all' | 'active' | 'completed';

interface Task {
  id: string;
  text: string;
  completed: boolean;
}

const STORAGE_KEY = 'task-tracker-tasks-v1';

function createTaskId(): string {
  return \`task-\${Date.now()}-\${Math.random().toString(36).slice(2, 8)}\`;
}

function loadStoredTasks(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Task[];
  } catch {
    return [];
  }
}

export default function TaskTrackerFeature() {
  const [tasks, setTasks] = useState<Task[]>(() => loadStoredTasks());
  const [input, setInput] = useState('');
  const [filter, setFilter] = useState<TaskFilter>('all');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const activeCount = useMemo(() => tasks.filter((task) => !task.completed).length, [tasks]);

  const filteredTasks = useMemo(() => {
    if (filter === 'active') return tasks.filter((task) => !task.completed);
    if (filter === 'completed') return tasks.filter((task) => task.completed);
    return tasks;
  }, [tasks, filter]);

  function handleAddTask(event?: FormEvent) {
    event?.preventDefault();
    const text = input.trim();
    if (!text) {
      setFormError('Enter a task before adding.');
      return;
    }
    setFormError(null);
    setTasks((current) => [...current, { id: createTaskId(), text, completed: false }]);
    setInput('');
    setStatusMessage('Task added.');
  }

  function handleToggleComplete(taskId: string) {
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task,
      ),
    );
    setStatusMessage('Task updated.');
  }

  function handleDeleteTask(taskId: string) {
    setTasks((current) => current.filter((task) => task.id !== taskId));
    setStatusMessage('Task deleted.');
  }

  function beginEditTask(task: Task) {
    setEditingTaskId(task.id);
    setEditDraft(task.text);
    setFormError(null);
  }

  function saveTaskEdit(taskId: string) {
    const text = editDraft.trim();
    if (!text) {
      setFormError('Task text cannot be empty.');
      return;
    }
    setFormError(null);
    setTasks((current) => current.map((task) => (task.id === taskId ? { ...task, text } : task)));
    setEditingTaskId(null);
    setEditDraft('');
    setStatusMessage('Task updated.');
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') handleAddTask();
  }

  return (
    <div className="task-tracker-feature">
      <header className="task-tracker-header">
        <h1>Task Tracker</h1>
        <p className="task-tracker-subtitle">Add, complete, delete, and filter your tasks</p>
      </header>

      <p className="task-status-message" aria-live="polite" data-testid="task-status-message">
        {statusMessage ?? ''}
      </p>

      <section className="task-tracker-stats" aria-live="polite">
        <span className="active-count-label">Active tasks</span>
        <strong className="active-count-value" data-testid="active-count">
          {activeCount}
        </strong>
      </section>

      <form className="task-tracker-form" onSubmit={handleAddTask}>
        <input
          className="task-input"
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleInputKeyDown}
          placeholder="Add a new task…"
          aria-label="New task"
          data-testid="task-input"
        />
        <button type="submit" className="btn btn-primary" data-testid="add-task-button">
          Add task
        </button>
      </form>
      {formError && (
        <p className="task-form-error" role="alert" data-testid="task-form-error">
          {formError}
        </p>
      )}

      <div className="task-filter-bar" role="group" aria-label="Filter tasks">
        {(['all', 'active', 'completed'] as TaskFilter[]).map((value) => (
          <button
            key={value}
            type="button"
            className={\`btn btn-filter \${filter === value ? 'is-active' : ''}\`}
            onClick={() => setFilter(value)}
            data-testid={\`filter-\${value}\`}
          >
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </button>
        ))}
      </div>

      <ul className="task-list" data-testid="task-list">
        {filteredTasks.length === 0 ? (
          <li className="task-empty">No tasks in this view.</li>
        ) : (
          filteredTasks.map((task) => (
            <li key={task.id} className={\`task-item \${task.completed ? 'is-completed' : ''}\`}>
              <label className="task-complete-toggle">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => handleToggleComplete(task.id)}
                  aria-label={\`Mark "\${task.text}" complete\`}
                  data-testid="complete-toggle"
                />
                {editingTaskId === task.id ? (
                  <input
                    className="task-input task-edit-input"
                    value={editDraft}
                    onChange={(event) => setEditDraft(event.target.value)}
                    aria-label="Edit task"
                    data-testid="edit-task-input"
                  />
                ) : (
                  <span className="task-text" data-testid="task-text">{task.text}</span>
                )}
              </label>
              <div className="task-item-actions">
                {editingTaskId === task.id ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => saveTaskEdit(task.id)}
                    data-testid="save-task-button"
                  >
                    Save
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-filter"
                    onClick={() => beginEditTask(task)}
                    data-testid="edit-task-button"
                  >
                    Edit
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => handleDeleteTask(task.id)}
                  aria-label={\`Delete "\${task.text}"\`}
                  data-testid="delete-task-button"
                >
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

/** @deprecated Use buildTaskTrackerFeatureTsx — kept for compatibility exports. */
export function buildTaskTrackerAppTsx(): string {
  return buildTaskTrackerFeatureTsx();
}

export function buildTaskTrackerMainTsx(): string {
  return `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './App.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
`;
}

export function buildTaskTrackerFeatureCss(): string {
  return `.task-tracker-feature {
  width: 100%;
}

.task-tracker-header h1 {
  margin: 0 0 0.35rem;
  font-size: 1.75rem;
}

.task-tracker-subtitle {
  margin: 0;
  color: #64748b;
}

.task-tracker-stats {
  margin: 1.25rem 0;
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  padding: 0.85rem 1rem;
  border-radius: 12px;
  background: #eef2ff;
  border: 1px solid #c7d2fe;
}

.active-count-label {
  color: #4338ca;
  font-size: 0.95rem;
}

.active-count-value {
  font-size: 1.5rem;
  color: #312e81;
}

.task-tracker-form {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.task-input {
  flex: 1;
  padding: 0.75rem 0.9rem;
  border-radius: 12px;
  border: 1px solid #cbd5e1;
  font-size: 1rem;
}

.task-input:focus {
  outline: 2px solid #6366f1;
  border-color: #6366f1;
}

.task-filter-bar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.btn {
  border: none;
  border-radius: 999px;
  padding: 0.55rem 1rem;
  font-size: 0.95rem;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.btn:hover {
  transform: translateY(-1px);
}

.btn-primary {
  background: #4f46e5;
  color: white;
  box-shadow: 0 8px 20px rgba(79, 70, 229, 0.25);
}

.btn-filter {
  background: #e2e8f0;
  color: #334155;
}

.btn-filter.is-active {
  background: #312e81;
  color: white;
}

.btn-danger {
  background: #fee2e2;
  color: #b91c1c;
}

.task-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.task-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 0.9rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: white;
}

.task-item.is-completed .task-text {
  text-decoration: line-through;
  color: #94a3b8;
}

.task-complete-toggle {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  flex: 1;
  cursor: pointer;
}

.task-text {
  word-break: break-word;
}

.task-empty {
  text-align: center;
  color: #64748b;
  padding: 1rem;
  border-radius: 12px;
  background: #f8fafc;
}

.task-form-error {
  margin: 0 0 1rem;
  color: #b91c1c;
  font-size: 0.95rem;
}

.task-status-message {
  min-height: 1.25rem;
  margin: 0 0 0.75rem;
  color: #047857;
  font-size: 0.95rem;
}

.task-item-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.task-edit-input {
  min-width: 180px;
}
`;
}

/** @deprecated Use buildTaskTrackerFeatureCss */
export function buildTaskTrackerAppCss(): string {
  return buildTaskTrackerFeatureCss();
}

export function buildTaskTrackerIndexHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Task Tracker</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;
}

export function buildTaskTrackerViteConfig(): string {
  return `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: false,
  },
});
`;
}

export function buildTaskTrackerTsConfig(): string {
  return (
    JSON.stringify(
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
          noUnusedLocals: true,
          noUnusedParameters: true,
          noFallthroughCasesInSwitch: true,
        },
        include: ['src'],
      },
      null,
      2,
    ) + '\n'
  );
}

export function buildTaskTrackerTsConfigNode(): string {
  return (
    JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2022',
          lib: ['ES2023'],
          module: 'ESNext',
          skipLibCheck: true,
          moduleResolution: 'bundler',
        },
        include: ['vite.config.ts'],
      },
      null,
      2,
    ) + '\n'
  );
}

export function buildTaskTrackerViteEnvDts(): string {
  return `/// <reference types="vite/client" />\n`;
}

export function buildTaskTrackerScreensIndex(): string {
  return `export { default as TaskTrackerFeature } from '../features/task-tracker/TaskTrackerFeature';\n`;
}

export function buildTaskTrackerBuildManifest(input: {
  contractId: string;
  ideaId: string;
  buildUnits: string[];
}): string {
  return (
    JSON.stringify(
      {
        manifestId: `${input.contractId}-manifest`,
        contractId: input.contractId,
        ideaId: input.ideaId,
        generatedAt: new Date().toISOString(),
        materializationSource: 'code-generation-engine-v1',
        applicationProfile: 'TASK_TRACKER_WEB_V1',
        universalBlueprintVersion: UNIVERSAL_APP_BLUEPRINT_VERSION,
        universalBlueprintEnabled: true,
        buildUnits: input.buildUnits,
        runtime: 'vite-react',
      },
      null,
      2,
    ) + '\n'
  );
}

export function buildTaskTrackerWorkspaceFiles(input: {
  contractId: string;
  ideaId: string;
  buildUnits: string[];
  rawPrompt: string;
}): GeneratedWorkspaceFile[] {
  const requirements = extractTaskTrackerRequirements(input.rawPrompt);
  const sharedFiles: GeneratedWorkspaceFile[] = [
    { relativePath: 'package.json', content: buildTaskTrackerPackageJson(input.contractId) },
    { relativePath: 'index.html', content: buildTaskTrackerIndexHtml() },
    { relativePath: 'vite.config.ts', content: buildTaskTrackerViteConfig() },
    { relativePath: 'tsconfig.json', content: buildTaskTrackerTsConfig() },
    { relativePath: 'tsconfig.node.json', content: buildTaskTrackerTsConfigNode() },
    { relativePath: 'src/vite-env.d.ts', content: buildTaskTrackerViteEnvDts() },
    { relativePath: 'src/main.tsx', content: buildTaskTrackerMainTsx() },
    { relativePath: 'src/screens/index.ts', content: buildTaskTrackerScreensIndex() },
    {
      relativePath: 'build-manifest.json',
      content: buildTaskTrackerBuildManifest(input),
    },
    {
      relativePath: 'feature-contract.json',
      content: buildTaskTrackerFeatureContractJson({
        contractId: input.contractId,
        requirements,
      }),
    },
  ];

  const featureFiles: GeneratedWorkspaceFile[] = [
    {
      relativePath: 'src/features/task-tracker/TaskTrackerFeature.tsx',
      content: buildTaskTrackerFeatureTsx(),
    },
    {
      relativePath: 'src/features/task-tracker/task-tracker.css',
      content: buildTaskTrackerFeatureCss(),
    },
  ];

  return composeGeneratedAppWorkspaceFiles({
    blueprint: {
      contractId: input.contractId,
      ideaId: input.ideaId,
      buildUnits: input.buildUnits,
      appName: 'Task Tracker',
      tagline: 'Add, complete, delete, and filter your tasks',
      coreFeatureLabel: 'Tasks',
    },
    featureFiles,
    sharedFiles,
  });
}

export const TASK_TRACKER_FEATURE_RELATIVE_PATH = 'src/features/task-tracker/TaskTrackerFeature.tsx';

export function isTaskTrackerFeatureSource(source: string): boolean {
  if (/return null\s*;/.test(source)) return false;
  return (
    /handleAddTask|add task/i.test(source) &&
    /handleToggleComplete|complete-toggle/i.test(source) &&
    /handleDeleteTask|delete-task-button/i.test(source) &&
    /filter.*all.*active.*completed|TaskFilter/i.test(source) &&
    /activeCount|active-count/i.test(source)
  );
}

export function isTaskTrackerAppSource(source: string): boolean {
  if (/data-blueprint-router="universal-v1"/.test(source)) return true;
  if (/TaskTrackerFeature|features\/task-tracker/.test(source)) {
    return isTaskTrackerFeatureSource(source);
  }
  return isTaskTrackerFeatureSource(source);
}

export function isTaskTrackerMountEntry(source: string): boolean {
  return /createRoot\s*\(/.test(source) && /getElementById\s*\(\s*['"]root['"]\s*\)/.test(source);
}
