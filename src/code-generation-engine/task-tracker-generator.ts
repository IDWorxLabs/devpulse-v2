/**
 * Task Tracker app source generator — Code Generation Engine V1.
 */

import type { GeneratedWorkspaceFile } from './code-generation-engine-types.js';

export function buildTaskTrackerPackageJson(contractId: string): string {
  return (
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
    ) + '\n'
  );
}

export function buildTaskTrackerAppTsx(): string {
  return `import { useMemo, useState, type FormEvent, type KeyboardEvent } from 'react';
import './App.css';

type TaskFilter = 'all' | 'active' | 'completed';

interface Task {
  id: string;
  text: string;
  completed: boolean;
}

function createTaskId(): string {
  return \`task-\${Date.now()}-\${Math.random().toString(36).slice(2, 8)}\`;
}

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [input, setInput] = useState('');
  const [filter, setFilter] = useState<TaskFilter>('all');

  const activeCount = useMemo(() => tasks.filter((task) => !task.completed).length, [tasks]);

  const filteredTasks = useMemo(() => {
    if (filter === 'active') return tasks.filter((task) => !task.completed);
    if (filter === 'completed') return tasks.filter((task) => task.completed);
    return tasks;
  }, [tasks, filter]);

  function handleAddTask(event?: FormEvent) {
    event?.preventDefault();
    const text = input.trim();
    if (!text) return;
    setTasks((current) => [...current, { id: createTaskId(), text, completed: false }]);
    setInput('');
  }

  function handleToggleComplete(taskId: string) {
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task,
      ),
    );
  }

  function handleDeleteTask(taskId: string) {
    setTasks((current) => current.filter((task) => task.id !== taskId));
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') handleAddTask();
  }

  return (
    <div className="task-tracker-app">
      <header className="task-tracker-header">
        <h1>Task Tracker</h1>
        <p className="task-tracker-subtitle">Add, complete, delete, and filter your tasks</p>
      </header>

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
                <span className="task-text">{task.text}</span>
              </label>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => handleDeleteTask(task.id)}
                aria-label={\`Delete "\${task.text}"\`}
                data-testid="delete-task-button"
              >
                Delete
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
`;
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

export function buildTaskTrackerAppCss(): string {
  return `:root {
  color-scheme: light;
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  line-height: 1.5;
  font-weight: 400;
  color: #0f172a;
  background: linear-gradient(160deg, #eef2ff 0%, #f8fafc 45%, #ecfeff 100%);
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
}

#root {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  padding: 2rem 1rem;
}

.task-tracker-app {
  width: min(640px, 100%);
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 20px;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.12);
  padding: 1.75rem;
  backdrop-filter: blur(8px);
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
`;
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
  return `export { default as TaskTrackerApp } from '../App';\n`;
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
}): GeneratedWorkspaceFile[] {
  return [
    { relativePath: 'package.json', content: buildTaskTrackerPackageJson(input.contractId) },
    { relativePath: 'index.html', content: buildTaskTrackerIndexHtml() },
    { relativePath: 'vite.config.ts', content: buildTaskTrackerViteConfig() },
    { relativePath: 'tsconfig.json', content: buildTaskTrackerTsConfig() },
    { relativePath: 'tsconfig.node.json', content: buildTaskTrackerTsConfigNode() },
    { relativePath: 'src/vite-env.d.ts', content: buildTaskTrackerViteEnvDts() },
    { relativePath: 'src/main.tsx', content: buildTaskTrackerMainTsx() },
    { relativePath: 'src/App.tsx', content: buildTaskTrackerAppTsx() },
    { relativePath: 'src/App.css', content: buildTaskTrackerAppCss() },
    { relativePath: 'src/screens/index.ts', content: buildTaskTrackerScreensIndex() },
    {
      relativePath: 'build-manifest.json',
      content: buildTaskTrackerBuildManifest(input),
    },
  ];
}

export function isTaskTrackerAppSource(source: string): boolean {
  if (/return null\s*;/.test(source)) return false;
  return (
    /handleAddTask|add task/i.test(source) &&
    /handleToggleComplete|complete-toggle/i.test(source) &&
    /handleDeleteTask|delete-task-button/i.test(source) &&
    /filter.*all.*active.*completed|TaskFilter/i.test(source) &&
    /activeCount|active-count/i.test(source) &&
    /createRoot/.test(source) === false
  );
}

export function isTaskTrackerMountEntry(source: string): boolean {
  return /createRoot\s*\(/.test(source) && /getElementById\s*\(\s*['"]root['"]\s*\)/.test(source);
}
