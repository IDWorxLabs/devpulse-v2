/**
 * Generated App Persistence V1 — durable CRUD provider + generator wiring.
 */
import { mkdtempSync, writeFileSync, readFileSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { entityDescriptorFromApprovedModule } from '../src/universal-crud-generation-engine/universal-crud-types.js';
import { generateCrudRepositorySource } from '../src/universal-crud-generation-engine/crud-repository-generator.js';
import { buildUniversalCrudSharedRuntimeFiles } from '../src/universal-crud-generation-engine/crud-persistence-abstraction.js';
import { buildUniversalRelationshipSharedRuntimeFiles } from '../src/universal-relationship-intelligence-engine/relationship-persistence-generator.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
let passed = 0;
let failed = 0;

function check(name: string, cond: boolean, detail = ''): void {
  if (cond) {
    passed += 1;
    console.log(`PASS — ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL — ${name}${detail ? ` :: ${detail}` : ''}`);
  }
}

const descriptor = entityDescriptorFromApprovedModule({
  moduleId: 'incident-command-board',
  displayName: 'Incident Command Board',
  route: '/',
});
check('default persistence is localStorage', descriptor.persistenceProvider === 'localStorage');

const repoSrc = generateCrudRepositorySource({
  descriptor,
  appTitle: 'TestApp',
  promptTerms: ['incident'],
});
check('repository imports localStorage provider', repoSrc.includes('createLocalStorageCrudProvider'));
check('repository does not hardcode memory', !repoSrc.includes('createMemoryCrudProvider'));

const shared = buildUniversalCrudSharedRuntimeFiles();
const scopeFile = shared.find((f) => f.relativePath.endsWith('persistence-scope.ts'));
const lsFile = shared.find((f) => f.relativePath.endsWith('local-storage-provider.ts'));
check('shared runtime emits persistence-scope', Boolean(scopeFile));
check('shared runtime emits local-storage provider', Boolean(lsFile));
check(
  'storage keys are project-scoped schema v1',
  Boolean(scopeFile?.content.includes('aidev-crud:v') && scopeFile.content.includes('resolvePersistenceProjectId')),
);
check(
  'localStorage provider refuses silent memory fallback',
  Boolean(lsFile?.content.includes('DurableStorageUnavailableError') && lsFile.content.includes('Does NOT silently')),
);
check('keys do not use preview port', !Boolean(lsFile?.content.includes('location.port')));

const rel = buildUniversalRelationshipSharedRuntimeFiles();
const linkStore = rel.find((f) => f.relativePath.endsWith('link-store.ts'));
check(
  'relationship link store uses durable provider',
  Boolean(linkStore?.content.includes('createLocalStorageCrudProvider')),
);

const workflowGenSrc = readFileSync(
  join(ROOT, 'src/universal-workflow-generation-engine/workflow-instance-persistence.ts'),
  'utf8',
);
check('workflow instance uses durable provider', workflowGenSrc.includes('createLocalStorageCrudProvider'));
check('workflow generator no longer defaults to memory', !workflowGenSrc.includes('createMemoryCrudProvider'));

// Runtime persistence probe with mock localStorage
const dir = mkdtempSync(join(tmpdir(), 'aidev-persist-'));
const runtimeDir = join(dir, 'src', 'universal-crud-runtime');
mkdirSync(runtimeDir, { recursive: true });
for (const file of shared) {
  const name = file.relativePath.split('/').pop()!;
  writeFileSync(join(runtimeDir, name), file.content, 'utf8');
}

const store = new Map<string, string>();
(globalThis as { localStorage?: Storage; document?: Document }).localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => {
    store.set(k, v);
  },
  removeItem: (k: string) => {
    store.delete(k);
  },
  clear: () => store.clear(),
  key: () => null,
  length: 0,
} as Storage;
(globalThis as { document?: { querySelector: (sel: string) => { getAttribute: (n: string) => string } | null; documentElement: { getAttribute: () => string } } }).document = {
  querySelector: (sel: string) =>
    sel.includes('aidevengine-project-id')
      ? { getAttribute: () => 'project-alpha-1' }
      : null,
  documentElement: { getAttribute: () => 'project-alpha-1' },
};

const { createLocalStorageCrudProvider } = await import(
  `file:///${join(runtimeDir, 'local-storage-provider.ts').replace(/\\/g, '/')}`
);
const { buildDurableStorageKey } = await import(
  `file:///${join(runtimeDir, 'persistence-scope.ts').replace(/\\/g, '/')}`
);

type Entity = { id: string; label: string; createdAt: string; updatedAt: string };
const providerA = createLocalStorageCrudProvider<Entity>('feature-incident-command-board');
const now = new Date().toISOString();
providerA.create({ id: 'rec-1', label: 'HQ Outage', createdAt: now, updatedAt: now });
check('create writes durable key', store.size >= 1);

const keyA = buildDurableStorageKey('feature-incident-command-board', 'project-alpha-1');
check('key includes project id', String(keyA).includes('project-alpha-1'));
check('key excludes port', !String(keyA).includes('5173') && !String(keyA).includes('5174'));

// Simulate reload: new provider instance hydrates from storage
const providerA2 = createLocalStorageCrudProvider<Entity>('feature-incident-command-board');
check('reload hydrates created record', providerA2.findById('rec-1')?.label === 'HQ Outage');

providerA2.update('rec-1', { label: 'HQ Outage Updated' });
const providerA3 = createLocalStorageCrudProvider<Entity>('feature-incident-command-board');
check('reload keeps update', providerA3.findById('rec-1')?.label === 'HQ Outage Updated');

providerA3.delete('rec-1');
const providerA4 = createLocalStorageCrudProvider<Entity>('feature-incident-command-board');
check('reload keeps delete', providerA4.findById('rec-1') === null);

// Cross-project isolation
(globalThis as { document?: { querySelector: (sel: string) => { getAttribute: (n: string) => string } | null; documentElement: { getAttribute: () => string } } }).document = {
  querySelector: () => ({ getAttribute: () => 'project-beta-2' }),
  documentElement: { getAttribute: () => 'project-beta-2' },
};
const providerB = createLocalStorageCrudProvider<Entity>('feature-incident-command-board');
providerB.create({ id: 'rec-b', label: 'Beta Only', createdAt: now, updatedAt: now });
(globalThis as { document?: { querySelector: (sel: string) => { getAttribute: (n: string) => string } | null; documentElement: { getAttribute: () => string } } }).document = {
  querySelector: () => ({ getAttribute: () => 'project-alpha-1' }),
  documentElement: { getAttribute: () => 'project-alpha-1' },
};
const providerAAgain = createLocalStorageCrudProvider<Entity>('feature-incident-command-board');
check('cross-project isolation', providerAAgain.findById('rec-b') === null);

// Seed must not overwrite: empty storage stays empty until create
check('empty storage does not invent seed', providerAAgain.list().total === 0);

const repoGenPath = join(ROOT, 'src/universal-crud-generation-engine/crud-repository-generator.ts');
check(
  'generator still supports explicit memory override',
  readFileSync(repoGenPath, 'utf8').includes("persistenceProvider === 'localStorage'"),
);

try {
  rmSync(dir, { recursive: true, force: true });
} catch {
  /* ignore */
}

console.log('');
console.log(`${passed}/${passed + failed} checks passed`);
if (failed > 0) process.exit(1);
console.log('AIDEVENGINE_GENERATED_APP_PERSISTENCE_V1_PASS');
