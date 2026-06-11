/**
 * Phase 24C — Controlled Builder Execution Engine validation (leaf mode).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createBuilderAction,
  createBuilderExecutionWorkspace,
  prepareBuilderExecutionFoundation,
  resetBuilderExecutionFoundationForTests,
} from '../src/autonomous-builder-execution-foundation/index.js';
import {
  CONTROLLED_BUILDER_EXECUTION_ENGINE_PASS_TOKEN,
  FUTURE_MOBILE_BUILD_SESSION_TYPES,
  MAX_AUDIT_TRAIL_RECORDS,
  PHASE_24C_ALLOWED_ACTION_TYPES,
  PHASE_24C_BLOCKED_ACTION_TYPES,
  assessControlledBuilderExecution,
  cancelBuilderExecutionSession,
  collectControlledBuilderExecutionEvidenceLines,
  createControlledExecutionSession,
  executeApprovedBuilderAction,
  getBuilderExecutionAuditCount,
  getBuilderExecutionAuditTrail,
  getBuilderExecutionSessionCount,
  integrateControlledBuilderExecutionWithRealityReporting,
  isPhase24CActionBlocked,
  pauseBuilderExecutionSession,
  resetControlledBuilderExecutionEngineForTests,
  resumeBuilderExecutionSession,
  runControlledBuilderExecution,
  startBuilderExecutionSession,
  verifyWorkspaceIsolation,
} from '../src/controlled-builder-execution-engine/index.js';

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
  'src/controlled-builder-execution-engine/builder-execution-session.ts',
  'src/controlled-builder-execution-engine/builder-execution-controller.ts',
  'src/controlled-builder-execution-engine/builder-action-executor.ts',
  'src/controlled-builder-execution-engine/workspace-isolation-authority.ts',
  'src/controlled-builder-execution-engine/builder-execution-evidence-collector.ts',
  'src/controlled-builder-execution-engine/builder-execution-audit-trail.ts',
  'src/controlled-builder-execution-engine/controlled-builder-execution-authority.ts',
  'src/controlled-builder-execution-engine/controlled-builder-execution-proof-integration.ts',
  'src/controlled-builder-execution-engine/controlled-builder-execution-engine-bounds.ts',
  'src/autonomous-builder-reality/autonomous-builder-reality-analyzers.ts',
  'src/end-to-end-founder-workflow-reality/end-to-end-founder-workflow-reality-analyzers.ts',
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
  console.log('Controlled Builder Execution Engine — Validation (leaf mode)');
  console.log('============================================================');
  console.log('');

  checkpoint('start');
  resetBuilderExecutionFoundationForTests();
  resetControlledBuilderExecutionEngineForTests();

  const fileTexts = new Map<string, string>();
  for (const rel of STATIC_SCAN_FILES) {
    fileTexts.set(rel, readBoundedText(rel));
    checkpoint(`read ${rel}`);
  }

  const sessionModel = fileTexts.get('src/controlled-builder-execution-engine/builder-execution-session.ts') ?? '';
  const controller = fileTexts.get('src/controlled-builder-execution-engine/builder-execution-controller.ts') ?? '';
  const executor = fileTexts.get('src/controlled-builder-execution-engine/builder-action-executor.ts') ?? '';
  const isolation = fileTexts.get('src/controlled-builder-execution-engine/workspace-isolation-authority.ts') ?? '';
  const evidenceCollector =
    fileTexts.get('src/controlled-builder-execution-engine/builder-execution-evidence-collector.ts') ?? '';
  const auditTrail = fileTexts.get('src/controlled-builder-execution-engine/builder-execution-audit-trail.ts') ?? '';
  const authority = fileTexts.get('src/controlled-builder-execution-engine/controlled-builder-execution-authority.ts') ?? '';
  const integration =
    fileTexts.get('src/controlled-builder-execution-engine/controlled-builder-execution-proof-integration.ts') ?? '';
  const bounds = fileTexts.get('src/controlled-builder-execution-engine/controlled-builder-execution-engine-bounds.ts') ?? '';
  const builderAnalyzers = fileTexts.get('src/autonomous-builder-reality/autonomous-builder-reality-analyzers.ts') ?? '';
  const workflowAnalyzers =
    fileTexts.get('src/end-to-end-founder-workflow-reality/end-to-end-founder-workflow-reality-analyzers.ts') ?? '';
  const proofHandler = fileTexts.get('server/execution-proof-handler.ts') ?? '';
  const appJs = fileTexts.get('public/founder-reality/app.js') ?? '';
  const pkg = JSON.parse(fileTexts.get('package.json') ?? '{}') as { scripts?: Record<string, string> };

  assert('01. session model', sessionModel.includes('BuilderExecutionSession') && sessionModel.includes('COMPLETED'), 'session');
  assert('02. execution controller', controller.includes('startBuilderExecutionSession') && controller.includes('pauseBuilderExecutionSession'), 'controller');
  assert('03. action executor', executor.includes('executeApprovedBuilderAction') && executor.includes('CREATE_FILE'), 'executor');
  assert('04. isolation authority', isolation.includes('WORKSPACE_ISOLATION_PASS') && isolation.includes('WORKSPACE_ISOLATION_FAIL'), 'isolation');
  assert('05. evidence collector', evidenceCollector.includes('SESSION_CREATED') && evidenceCollector.includes('ACTION_COMPLETED'), 'evidence');
  assert('06. audit trail', auditTrail.includes('MAX_AUDIT_TRAIL_RECORDS') && auditTrail.includes('SESSION_STARTED'), 'audit');
  assert('07. execution authority', authority.includes('CONTROLLED_EXECUTION_READY') && authority.includes('CONTROLLED_EXECUTION_BLOCKED'), 'authority');
  assert('08. dashboard integration', proofHandler.includes('controlledBuilderExecution') && appJs.includes('Controlled Builder Execution'), 'dashboard');
  assert('09. founder reality integration', builderAnalyzers.includes('controlled-builder-execution-engine') && workflowAnalyzers.includes('controlled-builder-execution-engine'), 'reality');
  assert('10. World 2 isolation', isolation.includes('devpulse production') && bounds.includes('PHASE_24C_BLOCKED_ACTION_TYPES'), 'world2');
  assert('11. unsupported actions blocked', executor.includes('isPhase24CActionBlocked') && bounds.includes('RUN_COMMAND'), 'blocked');
  assert('12. mobile extension points', bounds.includes('ANDROID_BUILD_SESSION') && bounds.includes('FUTURE_MOBILE_BUILD_SESSION_TYPES'), 'mobile');
  assert('13. package script', Boolean(pkg.scripts?.['validate:controlled-builder-execution-engine']), 'package');
  assert('14. no workspace snapshot', !authority.includes('buildProductWorkspaceSnapshot'), 'snapshot');
  assert('15. no brain calls', !authority.includes('assessFounderSensemaking'), 'brain');
  assert('16. bounded audit trail', bounds.includes('5000'), 'bounded');
  checkpoint('static checks complete');

  const ws = createBuilderExecutionWorkspace({
    projectId: 'proj-24c',
    sourceProject: 'World 2 disposable builder workspace',
    initialState: 'WORKSPACE_READY',
  });

  const isolationPass = verifyWorkspaceIsolation({ workspaceId: ws.workspaceId });
  assert('17. isolation pass', isolationPass.result === 'WORKSPACE_ISOLATION_PASS', isolationPass.result);

  let productionBlocked = false;
  try {
    createBuilderExecutionWorkspace({
      projectId: 'proj-bad',
      sourceProject: 'DevPulse production workspace',
    });
  } catch {
    productionBlocked = true;
  }
  assert('18. isolation fail production', productionBlocked, 'forbidden');

  const missingIsolation = verifyWorkspaceIsolation({ workspaceId: 'missing-workspace' });
  assert('18b. missing workspace fail', missingIsolation.result === 'WORKSPACE_ISOLATION_FAIL', missingIsolation.reason);

  assert('19. RUN_COMMAND blocked', isPhase24CActionBlocked('RUN_COMMAND'), 'RUN_COMMAND');
  assert('20. CREATE_FILE allowed', PHASE_24C_ALLOWED_ACTION_TYPES.includes('CREATE_FILE'), 'CREATE_FILE');

  const { session: createdSession } = createControlledExecutionSession({
    workspaceId: ws.workspaceId,
    projectId: 'proj-24c',
    executionPlanId: 'plan-24c',
  });
  assert('21. session created', createdSession.state === 'READY', createdSession.state);

  const approvedAction = createBuilderAction({
    workspaceId: ws.workspaceId,
    actionType: 'GENERATE_CODE',
    requestedBy: 'validator',
    sourceRequirement: 'task-1',
    targetPath: 'src/generated/Widget.tsx',
    payloadSummary: 'Generate widget',
  });

  const blockedAction = createBuilderAction({
    workspaceId: ws.workspaceId,
    actionType: 'RUN_COMMAND',
    requestedBy: 'validator',
    sourceRequirement: 'task-bad',
    payloadSummary: 'npm install',
  });

  const runResult = startBuilderExecutionSession({
    workspaceId: ws.workspaceId,
    projectId: 'proj-24c',
    executionPlanId: 'plan-24c',
    actions: [approvedAction, blockedAction],
  });
  assert('22. session completed', runResult.session.state === 'COMPLETED', runResult.session.state);
  assert('23. actions completed', runResult.completedActions >= 1, String(runResult.completedActions));
  assert('24. blocked actions', runResult.blockedActions >= 1, String(runResult.blockedActions));
  assert('25. evidence produced', runResult.evidenceCount >= 4, String(runResult.evidenceCount));

  pauseBuilderExecutionSession(runResult.session.sessionId);
  resumeBuilderExecutionSession(runResult.session.sessionId);
  cancelBuilderExecutionSession(runResult.session.sessionId);
  assert('26. audit trail populated', getBuilderExecutionAuditCount() >= 5, String(getBuilderExecutionAuditCount()));

  const blockedExec = executeApprovedBuilderAction({
    sessionId: createdSession.sessionId,
    workspaceId: ws.workspaceId,
    action: blockedAction,
  });
  assert('27. executor blocks RUN_COMMAND', blockedExec.blocked && !blockedExec.success, 'blocked');

  resetControlledBuilderExecutionEngineForTests();
  resetBuilderExecutionFoundationForTests();
  const foundation = prepareBuilderExecutionFoundation({
    projectId: 'proj-24c-demo',
    sourceProject: 'World 2 isolated target app',
    requirements: ['Generate screen'],
    architecture: ['src/App.tsx'],
    tasks: [{ taskId: 't1', title: 'Generate screen', actionType: 'GENERATE_SCREEN' }],
  });
  const workspaceId = foundation.summary.workspace.latestId;
  assert('28. foundation workspace', Boolean(workspaceId), 'workspace');

  const controlled = runControlledBuilderExecution({
    workspaceId: workspaceId ?? '',
    projectId: 'proj-24c-demo',
  });
  assert('29. controlled execution ready', controlled.readiness === 'CONTROLLED_EXECUTION_READY', controlled.readiness);
  assert('30. executionConnected path', controlled.executionConnected === true, String(controlled.executionConnected));

  const assessment = assessControlledBuilderExecution();
  assert('31. assess authority', assessment.sessionCount >= 1, String(assessment.sessionCount));

  const lines = collectControlledBuilderExecutionEvidenceLines(true);
  assert('32. reality integration lines', lines.some((l) => l.includes('session')), 'lines');

  const reporting = integrateControlledBuilderExecutionWithRealityReporting(true);
  assert('33. dashboard signals', reporting.dashboardSignals.length >= 3, String(reporting.dashboardSignals.length));

  assert('34. session count', getBuilderExecutionSessionCount() >= 1, String(getBuilderExecutionSessionCount()));
  assert('35. audit bounded constant', MAX_AUDIT_TRAIL_RECORDS === 5000, String(MAX_AUDIT_TRAIL_RECORDS));
  assert('36. mobile types reserved', FUTURE_MOBILE_BUILD_SESSION_TYPES.includes('EXPO_BUILD_SESSION'), 'mobile');
  assert('37. audit entries typed', getBuilderExecutionAuditTrail().every((e) => e.eventType.length > 0), 'audit');
  assert('38. blocked types include DELETE', PHASE_24C_BLOCKED_ACTION_TYPES.includes('DELETE_FILE'), 'DELETE_FILE');

  checkpoint('runtime checks complete');

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
    console.log('CONTROLLED_BUILDER_EXECUTION_ENGINE_REQUIRES_FIXES');
    process.exit(1);
  }
  console.log(CONTROLLED_BUILDER_EXECUTION_ENGINE_PASS_TOKEN);
}

try {
  main();
} catch (err) {
  console.error(err);
  console.log('CONTROLLED_BUILDER_EXECUTION_ENGINE_REQUIRES_FIXES');
  process.exit(1);
}
