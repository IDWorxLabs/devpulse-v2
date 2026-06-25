/**
 * AIDEVENGINE_BUILD_PROOF — task tracker proof scenario (V1.1/V1.2 shared).
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { UvlBehaviourEvidenceItem, UvlBehaviourKey } from './launch-evidence-handoff-types.js';

export const TASK_TRACKER_PRODUCT_REQUEST =
  'I want a simple task tracker app where I can add tasks, mark them complete, delete them, filter by all/active/completed, and see a count of remaining active tasks. It should have a clean modern UI and work in the browser.';

export const TASK_TRACKER_PROOF_SCENARIO_ANSWERS: readonly string[] = [
  'Business: Browser-based task tracker for founders and small teams to capture daily work and reduce dropped tasks.',
  'Users: Individual users and team members who manage personal todo lists in the browser.',
  'Roles: Single end-user role with access to own tasks; no separate admin portal for MVP.',
  'Permissions: Users have full CRUD permissions on tasks they create; filter views for all, active, and completed.',
  'Workflows: Core workflow is add task, mark complete, delete task, filter by all/active/completed, view remaining active count.',
  'Data: Task entity with id, title, completed flag, and createdAt timestamp stored in client state.',
  'Files: No file upload or document storage required for MVP.',
  'Notifications: No email, SMS, or push notifications in MVP.',
  'Integrations: Standalone web app with no third-party integrations.',
  'AI: No AI or recommendation features.',
  'Monetization: Free productivity tool with no billing.',
  'Deployment: Static Vite React SPA for modern browsers; npm build produces dist/index.html.',
];

export function buildEnrichedPrompt(base: string = TASK_TRACKER_PRODUCT_REQUEST): string {
  return [base, '', '--- Proof scenario clarification answers ---', ...TASK_TRACKER_PROOF_SCENARIO_ANSWERS].join(
    '\n',
  );
}

function listSourceFiles(workspaceDir: string, max = 200): string[] {
  if (!existsSync(workspaceDir)) return [];
  const out: string[] = [];
  function walk(current: string, depth: number): void {
    if (out.length >= max || depth > 8) return;
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules') continue;
        walk(full, depth + 1);
      } else if (/\.(tsx?|jsx?|html|css|json)$/i.test(entry.name)) {
        out.push(full);
      }
    }
  }
  walk(workspaceDir, 0);
  return out;
}

export function inspectTaskTrackerBehaviours(
  workspaceDir: string,
): Record<UvlBehaviourKey, UvlBehaviourEvidenceItem> {
  let combined = '';
  for (const file of listSourceFiles(workspaceDir)) {
    try {
      combined += readFileSync(file, 'utf8') + '\n';
    } catch {
      /* skip */
    }
  }
  const lower = combined.toLowerCase();
  const distIndex = join(workspaceDir, 'dist', 'index.html');
  const distExists = existsSync(distIndex);
  let distDetail = distExists ? distIndex.replace(/\\/g, '/') : 'missing dist/index.html';
  if (distExists) {
    const html = readFileSync(distIndex, 'utf8');
    distDetail += html.includes('id="root"') || html.includes("id='root'") ? ' with #root mount' : ' without #root';
  }

  return {
    addTask: {
      readOnly: true,
      behaviour: 'addTask',
      passed: /add.*task|new.*task|createtask|addtask|onadd|handleadd/.test(lower),
      detail: 'pattern in generated sources',
      source: 'generated-source',
    },
    markComplete: {
      readOnly: true,
      behaviour: 'markComplete',
      passed: /complete|toggle|done|checkbox|mark.*complete/.test(lower),
      detail: 'pattern in generated sources',
      source: 'generated-source',
    },
    deleteTask: {
      readOnly: true,
      behaviour: 'deleteTask',
      passed: /delete|remove.*task|ondelete|handledelete/.test(lower),
      detail: 'pattern in generated sources',
      source: 'generated-source',
    },
    filterAllActiveCompleted: {
      readOnly: true,
      behaviour: 'filterAllActiveCompleted',
      passed: /filter|all.*active.*completed|active.*completed|'all'|"all"|'active'|"active"|'completed'|"completed"/.test(
        lower,
      ),
      detail: 'filter controls in generated sources',
      source: 'generated-source',
    },
    activeCountUpdates: {
      readOnly: true,
      behaviour: 'activeCountUpdates',
      passed: /active.*count|remaining|incomplete|pending.*count|activecount/.test(lower),
      detail: 'active count signal in generated sources',
      source: 'generated-source',
    },
    browserBuildArtifactExists: {
      readOnly: true,
      behaviour: 'browserBuildArtifactExists',
      passed: distExists,
      detail: distDetail,
      source: 'build-artifact',
    },
  };
}

export function countWorkspaceSourceFiles(workspaceDir: string): number {
  if (!existsSync(workspaceDir)) return 0;
  let count = 0;
  function walk(dir: string, depth: number): void {
    if (depth > 8) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === 'dist') continue;
        walk(full, depth + 1);
      } else {
        count += 1;
      }
    }
  }
  walk(workspaceDir, 0);
  return count;
}
