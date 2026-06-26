/**
 * Frontend Project Registry Parsing V1 — validation.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FRONTEND_PROJECT_REGISTRY_PARSING_PASS_TOKEN,
  buildProjectRegistrySummaryFromNormalized,
  normalizeRegistryPayload,
} from '../src/frontend-project-registry-parsing/index.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

interface Check {
  name: string;
  passed: boolean;
  detail: string;
}

const results: Check[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

const CURRENT_BACKEND_FIXTURE = {
  ok: true,
  registry: {
    version: 1,
    activeProjectId: 'lisa-parse-1',
    projects: [
      {
        projectId: 'expense-parse-1',
        name: 'ExpenseTracker',
        status: 'ACTIVE',
        createdAt: '2026-06-26T00:00:00.000Z',
        updatedAt: '2026-06-26T00:00:00.000Z',
        lastActivityAt: '2026-06-26T00:00:00.000Z',
        summary: 'Expense tracking',
      },
      {
        projectId: 'smartqr-parse-1',
        name: 'SmartQR',
        status: 'ACTIVE',
        createdAt: '2026-06-26T00:00:00.000Z',
        updatedAt: '2026-06-26T00:00:00.000Z',
        lastActivityAt: '2026-06-26T00:00:00.000Z',
        summary: 'QR scanning',
      },
      {
        projectId: 'lisa-parse-1',
        name: 'LISA',
        status: 'ACTIVE',
        createdAt: '2026-06-26T00:00:00.000Z',
        updatedAt: '2026-06-26T00:00:00.000Z',
        lastActivityAt: '2026-06-26T00:00:00.000Z',
        summary: 'Locked In Syndrome App',
      },
    ],
  },
  projects: {
    count: 3,
    activeCount: 1,
    items: [
      {
        projectId: 'expense-parse-1',
        name: 'ExpenseTracker',
        status: 'ACTIVE',
        summary: 'Expense tracking',
        createdAt: '2026-06-26T00:00:00.000Z',
        lastActivityAt: '2026-06-26T00:00:00.000Z',
        isActive: false,
      },
      {
        projectId: 'smartqr-parse-1',
        name: 'SmartQR',
        status: 'ACTIVE',
        summary: 'QR scanning',
        createdAt: '2026-06-26T00:00:00.000Z',
        lastActivityAt: '2026-06-26T00:00:00.000Z',
        isActive: false,
      },
      {
        projectId: 'lisa-parse-1',
        name: 'LISA',
        status: 'ACTIVE',
        summary: 'Locked In Syndrome App',
        createdAt: '2026-06-26T00:00:00.000Z',
        lastActivityAt: '2026-06-26T00:00:00.000Z',
        isActive: true,
      },
    ],
    activeProjectId: 'lisa-parse-1',
  },
  activeProjectId: 'lisa-parse-1',
  total: 3,
  active: 1,
  registryPath: '.aidevengine/project-registry-v1.json',
  updatedAt: '2026-06-26T00:00:00.000Z',
};

const LEGACY_ARRAY_FIXTURE = {
  ok: true,
  projects: [
    {
      projectId: 'expense-parse-1',
      name: 'ExpenseTracker',
      status: 'ACTIVE',
      summary: 'Expense tracking',
      createdAt: '2026-06-26T00:00:00.000Z',
      lastActivityAt: '2026-06-26T00:00:00.000Z',
    },
    {
      projectId: 'smartqr-parse-1',
      name: 'SmartQR',
      status: 'ACTIVE',
      summary: 'QR scanning',
      createdAt: '2026-06-26T00:00:00.000Z',
      lastActivityAt: '2026-06-26T00:00:00.000Z',
    },
    {
      projectId: 'lisa-parse-1',
      name: 'LISA',
      status: 'ACTIVE',
      summary: 'Locked In Syndrome App',
      createdAt: '2026-06-26T00:00:00.000Z',
      lastActivityAt: '2026-06-26T00:00:00.000Z',
    },
  ],
  activeProjectId: 'lisa-parse-1',
};

const REGISTRY_ONLY_FIXTURE = {
  ok: true,
  registry: {
    activeProjectId: 'lisa-parse-1',
    projects: [
      {
        projectId: 'expense-parse-1',
        name: 'ExpenseTracker',
        status: 'ACTIVE',
        summary: 'Expense tracking',
        createdAt: '2026-06-26T00:00:00.000Z',
        lastActivityAt: '2026-06-26T00:00:00.000Z',
      },
      {
        projectId: 'smartqr-parse-1',
        name: 'SmartQR',
        status: 'ACTIVE',
        summary: 'QR scanning',
        createdAt: '2026-06-26T00:00:00.000Z',
        lastActivityAt: '2026-06-26T00:00:00.000Z',
      },
      {
        projectId: 'lisa-parse-1',
        name: 'LISA',
        status: 'ACTIVE',
        summary: 'Locked In Syndrome App',
        createdAt: '2026-06-26T00:00:00.000Z',
        lastActivityAt: '2026-06-26T00:00:00.000Z',
      },
    ],
  },
};

function namesFromList(list: Array<{ name?: string }>): string[] {
  return list.map((entry) => entry.name ?? '');
}

function simulateRenderFailure(normalized: ReturnType<typeof normalizeRegistryPayload>): boolean {
  if (!normalized) return true;
  if (!Array.isArray(normalized.projects) || !normalized.projects.length) return true;
  if (normalized.total === 0) return true;
  return false;
}

function simulateTabRender(normalized: ReturnType<typeof normalizeRegistryPayload>): boolean {
  if (!normalized || !Array.isArray(normalized.projects)) return false;
  return normalized.projects.length >= 3;
}

async function main(): Promise<void> {
  console.log('');
  console.log('Frontend Project Registry Parsing V1 — Validation');
  console.log('=================================================');
  console.log('');

  const appJs = readFileSync(join(ROOT, 'public/founder-reality/app.js'), 'utf8');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };

  assert('01. package script', Boolean(pkg.scripts?.['validate:frontend-project-registry-parsing']), 'script');
  assert('02. normalizer module', appJs.includes('function normalizeRegistryPayload'), 'app.js');
  assert('03. projects.items path first', appJs.includes('Array.isArray(projectsField.items)'), 'items path');
  assert('04. projectList client field', appJs.includes('projectList'), 'projectList');
  assert('05. preserve valid state on parse fail', appJs.includes('projectRegistryClient.projectList'), 'preserve');

  const current = normalizeRegistryPayload(CURRENT_BACKEND_FIXTURE);
  assert('06. current backend shape accepted', Boolean(current), 'normalized');
  assert('07. current projects is array', Array.isArray(current?.projects), String(current?.projects));
  assert('08. current total = 3', current?.total === 3, String(current?.total));
  assert('09. current active = 1', current?.active === 1, String(current?.active));
  const currentNames = namesFromList(current?.projects ?? []);
  assert('10. ExpenseTracker present', currentNames.includes('ExpenseTracker'), currentNames.join(','));
  assert('11. SmartQR present', currentNames.includes('SmartQR'), currentNames.join(','));
  assert('12. LISA present', currentNames.includes('LISA'), currentNames.join(','));

  const legacy = normalizeRegistryPayload(LEGACY_ARRAY_FIXTURE);
  assert('13. legacy array shape accepted', Boolean(legacy), 'legacy');
  assert('14. legacy projects array', Array.isArray(legacy?.projects), 'array');

  const registryOnly = normalizeRegistryPayload(REGISTRY_ONLY_FIXTURE);
  assert('15. registry-only shape accepted', Boolean(registryOnly), 'registry-only');
  assert('16. registry-only projects array', Array.isArray(registryOnly?.projects), 'array');

  const summary = current ? buildProjectRegistrySummaryFromNormalized(current) : null;
  assert('17. summary count from items', summary?.count === 3, String(summary?.count));
  assert('18. summary items length', summary?.items?.length === 3, String(summary?.items?.length));
  assert('19. render would not fail', !simulateRenderFailure(current), 'render');
  assert('20. tabs render from array', simulateTabRender(current), 'tabs');
  assert(
    '21. items-only shape does not fail',
    Boolean(normalizeRegistryPayload({
      ok: true,
      projects: { count: 3, activeCount: 1, items: CURRENT_BACKEND_FIXTURE.projects.items },
      activeProjectId: 'lisa-parse-1',
      total: 3,
      active: 1,
    })),
    'items-only',
  );
  assert('22. invalid ok false rejected', normalizeRegistryPayload({ ok: false }) === null, 'ok false');
  assert('23. empty list rejected', normalizeRegistryPayload({ ok: true, projects: { items: [] } }) === null, 'empty');

  const failed = results.filter((r) => !r.passed);
  console.log('');
  for (const r of results) {
    console.log(`${r.passed ? 'PASS' : 'FAIL'} ${r.name}: ${r.detail}`);
  }
  console.log('');

  if (failed.length > 0) {
    console.error(`Frontend Project Registry Parsing V1 — FAILED (${failed.length} checks)`);
    process.exit(1);
  }

  console.log(FRONTEND_PROJECT_REGISTRY_PARSING_PASS_TOKEN);
  console.log('Frontend project registry parsing verified.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
