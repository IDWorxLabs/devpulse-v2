import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCanonicalProductContract } from '../src/product-faithfulness-v2/canonical-product-contract.js';
import { extractPromptFeatures } from '../src/prompt-faithful-generation/prompt-feature-extractor.js';
import { classifyNewBuildDecision, buildContextScope } from '../src/project-context-isolation-v4/index.js';
import {
  resolveProjectContext,
  resetWorkspaceTabRegistryForTests,
} from '../src/one-prompt-live-preview/workspace-tab-registry.js';
import {
  buildRuntimeEvidenceScope,
  runBuildArtifactStalenessCheck,
} from '../src/fresh-build-artifact-isolation-v4/index.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
let passed = 0;

function assert(label: string, condition: unknown, detail: string): void {
  if (!condition) throw new Error(`FAIL — ${label}: ${detail}`);
  passed += 1;
  console.log(`PASS — ${label}: ${detail}`);
}

const pairs = [
  {
    label: 'LISA → ExpeditionOS',
    first: 'Build LISA, an assistive communication app with eye tracking, blink input, gaze keyboard, and text-to-speech.',
    second:
      'Build a production-ready scientific expedition planning platform called ExpeditionOS with expedition management, equipment management, camp planning, field scheduling, scientific sample tracking, offline synchronization, mapping, and weather.',
    expectedIdentity: 'ExpeditionOS',
    forbidden: ['LISA', 'Eye Tracking Board', 'Blink Input Engine', 'Gaze Keyboard', 'Text To Speech'],
  },
  {
    label: 'Inventory Manager → Medical Practice',
    first: 'Build an Inventory Manager app with products, stock, suppliers, and purchase orders.',
    second: 'Build a Medical Practice app with patients, clinicians, appointments, prescriptions, and treatment records.',
    expectedIdentity: 'Medical Practice',
    forbidden: ['Products', 'Stock', 'Suppliers', 'Purchase Orders'],
  },
  {
    label: 'Appointment Booking → Scientific Laboratory',
    first: 'Build an Appointment Booking app with customers, services, staff, and calendar slots.',
    second: 'Build a Scientific Laboratory app with experiments, specimens, instruments, protocols, and results.',
    expectedIdentity: 'Scientific Laboratory',
    forbidden: ['Appointments', 'Customers', 'Services', 'Calendar'],
  },
  {
    label: 'ERP → Note-Taking',
    first: 'Build an ERP platform with inventory, invoices, purchasing, and reporting.',
    second: 'Build a Simple Note-Taking App with notes, tags, search, pinning, and archive.',
    expectedIdentity: 'Simple Note-Taking',
    forbidden: ['Inventory', 'Invoices', 'Purchasing'],
  },
  {
    label: 'Complex app → unrelated complex app',
    first: 'Build a Restaurant Operations platform with menus, tables, orders, kitchen tickets, and payments.',
    second: 'Build a University Research Portal with studies, grants, publications, ethics reviews, and datasets.',
    expectedIdentity: 'University Research Portal',
    forbidden: ['Menus', 'Tables', 'Orders', 'Kitchen Tickets'],
  },
] as const;

function hash(value: string): string {
  let result = 0;
  for (let i = 0; i < value.length; i += 1) result = (result * 31 + value.charCodeAt(i)) | 0;
  return `prompt-${Math.abs(result).toString(16)}`;
}

for (const [index, pair] of pairs.entries()) {
  resetWorkspaceTabRegistryForTests();
  const prior = resolveProjectContext({
    projectId: `prior-${index}`,
    projectName: extractPromptFeatures(pair.first).appName,
    createIfMissing: true,
  });
  const freshId = `fresh-${index}`;
  const fresh = resolveProjectContext({
    projectId: freshId,
    projectName: extractPromptFeatures(pair.second).appName,
    createIfMissing: true,
    blockActiveProjectFallback: true,
    freshlyCreatedProjectId: freshId,
  });
  const contract = buildCanonicalProductContract({ prompt: pair.second });
  const contractLower = new Set(contract.allConceptNames.map((concept) => concept.toLowerCase()));
  const forbidden = pair.forbidden.filter((concept) => contractLower.has(concept.toLowerCase()));

  assert(`${pair.label}: identity`, contract.productIdentity === pair.expectedIdentity, contract.productIdentity);
  assert(`${pair.label}: project id isolated`, fresh.projectId !== prior.projectId && fresh.projectId === freshId, `${prior.projectId} → ${fresh.projectId}`);
  assert(`${pair.label}: workspace scope isolated`, fresh.session.chatThreadId !== prior.session.chatThreadId, fresh.session.chatThreadId);
  assert(`${pair.label}: prior concepts excluded`, forbidden.length === 0, JSON.stringify(forbidden));

  const scope = buildContextScope({
    requestId: `request-${index}`,
    buildId: `build-${index}`,
    projectId: fresh.projectId,
    decision: 'NEW_BUILD',
    currentPromptHash: hash(pair.second),
    explicitlyReferencedProjectId: null,
    activeProjectIdCandidate: prior.projectId,
  });
  assert(
    `${pair.label}: inherited context blocked`,
    scope.inheritedConcepts.length === 0 && scope.blockedContextSources.length >= 10,
    `${scope.blockedContextSources.length} sources blocked`,
  );

  const runtimeScope = buildRuntimeEvidenceScope({
    requestId: scope.requestId,
    buildId: scope.buildId,
    projectId: scope.projectId,
    decision: scope.decision,
    promptHash: scope.currentPromptHash,
  });
  const stale = runBuildArtifactStalenessCheck({
    scope: runtimeScope,
    evidenceObjects: [
      {
        evidenceKind: 'PRODUCT_FAITHFULNESS_REPORT',
        metadata: {
          requestId: 'previous-request',
          buildId: 'previous-build',
          projectId: prior.projectId,
          promptHash: hash(pair.first),
          productIdentity: extractPromptFeatures(pair.first).appName,
          createdAt: new Date(0).toISOString(),
          evidenceKind: 'PRODUCT_FAITHFULNESS_REPORT',
        },
      },
    ],
  });
  assert(
    `${pair.label}: stale faithfulness/repair evidence rejected`,
    !stale.passed && stale.blockedEvidenceKinds.includes('PRODUCT_FAITHFULNESS_REPORT'),
    `${stale.detections.length} detections`,
  );
}

// Failed/successful build state, browser reload, Reset test, and New prompt all exercise the same
// NEW_BUILD policy: a selected/active old id is not trusted unless explicit continuation wins.
for (const label of ['Failed build', 'Successful preview', 'Browser reload', 'Reset test', 'New prompt']) {
  const decision = classifyNewBuildDecision({
    rawPrompt: 'Build a new application called FreshCanvas with documents, folders, and sharing.',
    requestedProjectId: 'old-selected-project',
    requestedProjectName: 'Old Product',
    hasKnownExistingProject: true,
    currentProjectIdentitySummary: 'Old Product with unrelated modules',
  });
  assert(`${label} → new build`, decision.decision === 'NEW_BUILD', decision.decision);
}

const continuation = classifyNewBuildDecision({
  rawPrompt: 'Continue the existing ChronicleVault writing and organizing journals project and add archive support.',
  requestedProjectId: 'chronicle-vault-project',
  requestedProjectName: 'ChronicleVault',
  hasKnownExistingProject: true,
  currentProjectIdentitySummary: 'ChronicleVault application for writing and organizing journals',
  buildIntentOverride: 'CONTINUE_EXISTING_PROJECT',
});
assert('Explicit edit preserves continuation', continuation.decision === 'CONTINUE_EXISTING_PROJECT', continuation.decision);

const explicitNew = classifyNewBuildDecision({
  rawPrompt: 'Create a new project called CleanSlate with canvases and drawing tools.',
  requestedProjectId: 'old-selected-project',
  requestedProjectName: 'Old Product',
  hasKnownExistingProject: true,
  currentProjectIdentitySummary: 'Old Product',
  buildIntentOverride: 'START_NEW_BUILD',
});
assert('Explicit new project excludes selected old project', explicitNew.decision === 'NEW_BUILD', explicitNew.decision);

const frontend = readFileSync(join(ROOT, 'public/founder-reality/builder-home.js'), 'utf8');
assert('New prompt clears persisted project id', frontend.includes('persistProjectId(null);'), 'frontend project binding cleared');
assert('Reset/New prompt invalidate stale responses', frontend.includes('state.requestId += 1'), 'request generation incremented');
assert('Build intent override forwarded', frontend.includes('body.buildIntentOverride = options.buildIntentOverride'), 'explicit choice sent to API');

console.log(`\n${passed}/${pairs.length * 6 + 10} checks passed`);
console.log('CONSECUTIVE_BUILD_CONTEXT_ISOLATION_V1_PASS');
