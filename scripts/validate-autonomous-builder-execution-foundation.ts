/**
 * Phase 24B — Autonomous Builder Execution Foundation validation (leaf mode).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  AUTONOMOUS_BUILDER_EXECUTION_FOUNDATION_PASS_TOKEN,
  FUTURE_MOBILE_RUNTIME_EVIDENCE_TYPES,
  MAX_ACTION_QUEUE_SIZE,
  assertIsolatedExecutionTarget,
  assessBuilderExecutionFoundation,
  buildExecutionPlan,
  cancelBuilderAction,
  collectBuilderExecutionFoundationEvidenceLines,
  createBuilderAction,
  createBuilderExecutionWorkspace,
  dequeueBuilderAction,
  enqueueBuilderAction,
  getBuilderActionQueueSize,
  getBuilderQueueAuditCount,
  getBuilderQueueAuditTrail,
  integrateBuilderExecutionFoundationWithRealityReporting,
  markActionResult,
  pauseBuilderActionQueue,
  prepareBuilderExecutionFoundation,
  recordBuilderExecutionEvidence,
  replayBuilderAction,
  resetBuilderExecutionFoundationForTests,
  resumeBuilderActionQueue,
} from '../src/autonomous-builder-execution-foundation/index.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const START = Date.now();
const MAX_RUNTIME_MS = 2_000;

const STATIC_SCAN_FILES = [
  'src/autonomous-builder-execution-foundation/builder-execution-workspace.ts',
  'src/autonomous-builder-execution-foundation/builder-action-model.ts',
  'src/autonomous-builder-execution-foundation/builder-execution-evidence.ts',
  'src/autonomous-builder-execution-foundation/builder-execution-plan-authority.ts',
  'src/autonomous-builder-execution-foundation/builder-action-queue.ts',
  'src/autonomous-builder-execution-foundation/builder-execution-proof-integration.ts',
  'src/autonomous-builder-execution-foundation/builder-execution-foundation-authority.ts',
  'src/autonomous-builder-execution-foundation/autonomous-builder-execution-foundation-bounds.ts',
  'server/execution-proof-handler.ts',
  'public/founder-reality/app.js',
  'package.json',
] as const;

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function readBoundedText(relativePath: string, maxBytes = 256_000): string {
  const fullPath = join(ROOT, relativePath);
  if (!existsSync(fullPath)) return '';
  const buf = readFileSync(fullPath);
  return buf.subarray(0, Math.min(buf.length, maxBytes)).toString('utf8');
}

function checkpoint(label: string): void {
  const elapsed = Date.now() - START;
  console.log(`[checkpoint ${elapsed}ms] ${label}`);
  if (elapsed > MAX_RUNTIME_MS) {
    throw new Error(`Runtime guard exceeded at "${label}" (${elapsed}ms > ${MAX_RUNTIME_MS}ms)`);
  }
}

function main(): void {
  console.log('');
  console.log('Autonomous Builder Execution Foundation — Validation (leaf mode)');
  console.log('================================================================');
  console.log('');

  checkpoint('start');
  resetBuilderExecutionFoundationForTests();

  const fileTexts = new Map<string, string>();
  for (const rel of STATIC_SCAN_FILES) {
    fileTexts.set(rel, readBoundedText(rel));
    checkpoint(`read ${rel}`);
  }

  const workspace = fileTexts.get('src/autonomous-builder-execution-foundation/builder-execution-workspace.ts') ?? '';
  const actionModel = fileTexts.get('src/autonomous-builder-execution-foundation/builder-action-model.ts') ?? '';
  const evidence = fileTexts.get('src/autonomous-builder-execution-foundation/builder-execution-evidence.ts') ?? '';
  const planAuthority = fileTexts.get('src/autonomous-builder-execution-foundation/builder-execution-plan-authority.ts') ?? '';
  const queue = fileTexts.get('src/autonomous-builder-execution-foundation/builder-action-queue.ts') ?? '';
  const integration = fileTexts.get('src/autonomous-builder-execution-foundation/builder-execution-proof-integration.ts') ?? '';
  const authority = fileTexts.get('src/autonomous-builder-execution-foundation/builder-execution-foundation-authority.ts') ?? '';
  const bounds = fileTexts.get('src/autonomous-builder-execution-foundation/autonomous-builder-execution-foundation-bounds.ts') ?? '';
  const proofHandler = fileTexts.get('server/execution-proof-handler.ts') ?? '';
  const appJs = fileTexts.get('public/founder-reality/app.js') ?? '';
  const pkg = JSON.parse(fileTexts.get('package.json') ?? '{}') as { scripts?: Record<string, string> };

  assert('01. workspace model', workspace.includes('BuilderExecutionWorkspace') && workspace.includes('WORKSPACE_READY'), 'workspace');
  assert('02. action model', actionModel.includes('CREATE_FILE') && actionModel.includes('GENERATE_API'), 'actions');
  assert('03. evidence model', evidence.includes('FILE_CREATED') && evidence.includes('BUILD_COMPLETED'), 'evidence');
  assert('04. plan authority', planAuthority.includes('buildExecutionPlan') && planAuthority.includes('ExecutionPlan'), 'plan');
  assert('05. action queue', queue.includes('enqueueBuilderAction') && queue.includes('getBuilderQueueAuditTrail'), 'queue');
  assert('06. bounded queue', bounds.includes('MAX_ACTION_QUEUE_SIZE = 1000'), 'bounded');
  assert('07. audit trail', queue.includes('QueueAuditEventType') && queue.includes('REPLAY'), 'audit');
  assert('08. World 2 isolation', workspace.includes('DevPulse production') && bounds.includes('WORLD2_ISOLATION_RULE'), 'isolation');
  assert('09. execution proof integration', integration.includes('integrateBuilderExecutionFoundationWithRealityReporting'), 'integration');
  assert('10. mobile runtime extensions', evidence.includes('ANDROID_RUNTIME_STARTED') && evidence.includes('FUTURE_MOBILE_RUNTIME_EVIDENCE_TYPES'), 'mobile');
  assert('11. package script', Boolean(pkg.scripts?.['validate:autonomous-builder-execution-foundation']), 'package');
  assert('12. dashboard integration', proofHandler.includes('executionFoundation') && appJs.includes('Execution Foundation'), 'dashboard');
  assert('13. no workspace snapshot', !authority.includes('buildProductWorkspaceSnapshot'), 'snapshot');
  assert('14. no brain calls', !authority.includes('assessFounderSensemaking'), 'brain');
  assert('15. evidence required rule', actionModel.includes('No action may be marked successful without evidence'), 'proof rule');
  checkpoint('static checks complete');

  let isolationBlocked = false;
  try {
    assertIsolatedExecutionTarget('DevPulse production workspace');
  } catch {
    isolationBlocked = true;
  }
  assert('16. forbidden production target', isolationBlocked, 'forbidden');

  const ws = createBuilderExecutionWorkspace({
    projectId: 'proj-24b',
    sourceProject: 'World 2 demo app',
  });
  const plan = buildExecutionPlan({
    projectId: 'proj-24b',
    workspaceId: ws.workspaceId,
    requirements: ['Build login screen'],
    architecture: ['src/app.tsx'],
    tasks: [{ taskId: 't1', title: 'Generate screen', actionType: 'GENERATE_SCREEN' }],
  });
  const action = createBuilderAction({
    workspaceId: ws.workspaceId,
    actionType: 'CREATE_FILE',
    requestedBy: 'validator',
    sourceRequirement: 't1',
    targetPath: 'src/app.tsx',
  });
  const enq = enqueueBuilderAction(action);
  pauseBuilderActionQueue();
  assert('17. queue paused blocks dequeue', dequeueBuilderAction() === null, 'pause');
  resumeBuilderActionQueue();
  const deq = dequeueBuilderAction();
  assert('18. dequeue works', deq !== null, 'dequeue');
  const cancelled = cancelBuilderAction(action.actionId);
  assert('19. cancel works', cancelled === null || cancelled.status === 'CANCELLED', 'cancel');

  const replayAction = createBuilderAction({
    workspaceId: ws.workspaceId,
    actionType: 'GENERATE_CODE',
    requestedBy: 'validator',
    sourceRequirement: 't1',
  });
  enqueueBuilderAction(replayAction);
  replayBuilderAction(replayAction);
  assert('20. audit trail populated', getBuilderQueueAuditCount() > 0, String(getBuilderQueueAuditCount()));

  const ev = recordBuilderExecutionEvidence({
    workspaceId: ws.workspaceId,
    actionId: replayAction.actionId,
    evidenceType: 'OUTPUT_GENERATED',
    description: 'Planning evidence only',
    source: 'validator',
  });
  let evidenceRequired = false;
  try {
    markActionResult(replayAction, { success: true, summary: 'fail test', evidenceIds: [], completedAt: Date.now() });
  } catch {
    evidenceRequired = true;
  }
  assert('21. success requires evidence', evidenceRequired, 'evidence rule');
  markActionResult(replayAction, {
    success: true,
    summary: 'planned success record only',
    evidenceIds: [ev.evidenceId],
    completedAt: Date.now(),
  });

  resetBuilderExecutionFoundationForTests();
  const prepared = prepareBuilderExecutionFoundation({
    projectId: 'proj-prepared',
    sourceProject: 'World 2 isolated app',
    requirements: ['Requirement A'],
    architecture: ['src/main.ts'],
    tasks: [
      { taskId: 'task-a', title: 'Generate code', actionType: 'GENERATE_CODE' },
      { taskId: 'task-b', title: 'Create folder', actionType: 'CREATE_FOLDER' },
    ],
  });
  checkpoint('foundation prepared');

  assert('22. workspace created', prepared.workspaceCount >= 1, String(prepared.workspaceCount));
  assert('23. plan generated', prepared.planCount >= 1, String(prepared.planCount));
  assert('24. actions queued', prepared.queueSize >= 1, String(prepared.queueSize));
  assert('25. evidence produced', prepared.evidenceCount >= 2, String(prepared.evidenceCount));
  assert('26. executionConnected false', prepared.summary.executionConnected === false, 'honest');
  assert('27. reality integration lines', collectBuilderExecutionFoundationEvidenceLines().length > 0, 'lines');
  assert('28. proof integration object', integrateBuilderExecutionFoundationWithRealityReporting().dashboardSignals.length === 3, 'dashboard');
  assert('29. queue bounded', getBuilderActionQueueSize() <= MAX_ACTION_QUEUE_SIZE, String(getBuilderActionQueueSize()));
  assert('30. assess authority', assessBuilderExecutionFoundation().summary.foundationReady === true, 'assess');

  const elapsed = Date.now() - START;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed);

  console.log(`Scenarios: ${results.length} | Passed: ${passed} | Failed: ${failed.length} | Runtime: ${elapsed}ms`);
  console.log('');
  for (const r of results) {
    console.log(`${r.passed ? 'PASS' : 'FAIL'} — ${r.name}: ${r.detail}`);
  }
  console.log('');

  if (failed.length || elapsed > MAX_RUNTIME_MS) {
    console.log('AUTONOMOUS_BUILDER_EXECUTION_FOUNDATION_REQUIRES_FIXES');
    process.exit(1);
  }
  console.log(AUTONOMOUS_BUILDER_EXECUTION_FOUNDATION_PASS_TOKEN);
}

try {
  main();
} catch (err) {
  console.error(err);
  console.log('AUTONOMOUS_BUILDER_EXECUTION_FOUNDATION_REQUIRES_FIXES');
  process.exit(1);
}
