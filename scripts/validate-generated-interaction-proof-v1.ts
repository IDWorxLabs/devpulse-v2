/**
 * Generated Interaction Proof V1 — semantic create workflow over first-button clicks.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { planInteractions } from '../src/live-preview-interaction-proof-v1/live-preview-interaction-proof-planner.js';
import { attemptInteraction, type ProofPageDriver } from '../src/live-preview-interaction-proof-v1/live-preview-interaction-proof-runner.js';
import { classifyInteractionProof } from '../src/live-preview-interaction-proof-v1/live-preview-interaction-proof-normalizer.js';

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

const plan = planInteractions(5);
check('plan prefers CREATE_WORKFLOW first', plan[0]?.type === 'CREATE_WORKFLOW');
check('plan still includes BUTTON_CLICK', plan.some((p) => p.type === 'BUTTON_CLICK'));

function mockDriver(overrides: Partial<ProofPageDriver> = {}): ProofPageDriver {
  return {
    goto: async () => ({ ok: true }),
    getConsoleErrors: () => [],
    getFatalErrors: () => [],
    countRootUi: async () => 10,
    findVisibleText: async () => false,
    hasButton: async () => true,
    clickFirstButton: async () => true,
    hasTextInput: async () => true,
    fillAndSubmitFirstTextInput: async () => true,
    hasCheckbox: async () => false,
    toggleFirstCheckbox: async () => ({ performed: false, changed: false }),
    hasSelect: async () => false,
    changeFirstSelect: async () => ({ performed: false, changed: false }),
    hasInternalLink: async () => false,
    clickFirstInternalLink: async () => false,
    snapshotBodyText: async () => 'empty',
    close: async () => undefined,
    ...overrides,
  };
}

const createPass = await attemptInteraction(
  mockDriver({
    performCreateWorkflow: async (label) => ({
      found: true,
      performed: true,
      stateChanged: true,
      detail: `Created ${label}`,
    }),
  }),
  plan[0]!,
);
check('CREATE_WORKFLOW success changes state', createPass.stateChanged && createPass.performed);

const createMissing = await attemptInteraction(
  mockDriver({
    performCreateWorkflow: async () => ({
      found: false,
      performed: false,
      stateChanged: false,
      detail: 'No create form',
    }),
  }),
  plan[0]!,
);
check('missing create form is not falsely successful', !createMissing.stateChanged);

const deadPrimary = await attemptInteraction(
  mockDriver({
    clickPrimaryActionButton: async () => true,
    snapshotBodyText: async () => 'unchanged',
  }),
  plan.find((p) => p.type === 'BUTTON_CLICK')!,
);
check('dead primary button remains unconfirmed', deadPrimary.performed && !deadPrimary.stateChanged);

const classified = classifyInteractionProof({
  pageLoaded: true,
  rootUiFound: true,
  fatalConsoleErrorDetected: false,
  interactionAttempts: [createPass],
  blockedReason: null,
});
check('successful create classifies PASS', classified === 'PREVIEW_INTERACTION_PASS');

const runnerSrc = readFileSync(
  join(ROOT, 'src/live-preview-interaction-proof-v1/live-preview-interaction-proof-runner.ts'),
  'utf8',
);
check('runner waits for preview readiness', runnerSrc.includes('data-aidev-preview-ready'));
check('runner implements create workflow', runnerSrc.includes('performCreateWorkflow'));
check('runner prefers Create/Save/Submit semantics', runnerSrc.includes('create|save|submit|add|new|update|confirm'));

console.log('');
console.log(`${passed}/${passed + failed} checks passed`);
if (failed > 0) process.exit(1);
console.log('AIDEVENGINE_GENERATED_INTERACTION_PROOF_V1_PASS');
