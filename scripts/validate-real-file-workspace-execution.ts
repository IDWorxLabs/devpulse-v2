/**
 * Phase 24D — Real File Workspace Execution validation (leaf mode).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createBuilderAction,
  createBuilderExecutionWorkspace,
  resetBuilderExecutionFoundationForTests,
} from '../src/autonomous-builder-execution-foundation/index.js';
import {
  REAL_FILE_WORKSPACE_EXECUTION_PASS_TOKEN,
  FUTURE_MOBILE_PROJECT_PATH_PREFIXES,
  GENERATED_BUILDER_WORKSPACES_DIR,
  PHASE_24D_ALLOWED_OPERATIONS,
  PHASE_24D_BLOCKED_OPERATIONS,
  assessRealFileWorkspaceExecution,
  createBlockedOperationProbe,
  executeRealFileOperation,
  isControlledActionBridgeBlocked,
  isRealFileOperationBlocked,
  mapControlledActionToRealFileOperation,
  resetRealFileWorkspaceExecutionForTests,
  resolveSafeAbsolutePath,
  resolveSafeWorkspaceRoot,
  runRealFileWorkspaceExecution,
  verifyRealFileExists,
} from '../src/real-file-workspace-execution/index.js';

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
  'src/real-file-workspace-execution/real-file-workspace-path-authority.ts',
  'src/real-file-workspace-execution/real-file-operation-model.ts',
  'src/real-file-workspace-execution/real-file-operation-executor.ts',
  'src/real-file-workspace-execution/real-file-execution-evidence.ts',
  'src/real-file-workspace-execution/real-file-workspace-execution-session.ts',
  'src/real-file-workspace-execution/controlled-to-real-file-execution-bridge.ts',
  'src/real-file-workspace-execution/real-file-workspace-execution-authority.ts',
  'src/real-file-workspace-execution/real-file-workspace-execution-bounds.ts',
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
  console.log('Real File Workspace Execution — Validation (leaf mode)');
  console.log('=========================================================');
  console.log('');

  checkpoint('start');
  resetBuilderExecutionFoundationForTests();
  resetRealFileWorkspaceExecutionForTests();

  const fileTexts = new Map<string, string>();
  for (const rel of STATIC_SCAN_FILES) {
    fileTexts.set(rel, readBoundedText(rel));
    checkpoint(`read ${rel}`);
  }

  const pathAuthority = fileTexts.get('src/real-file-workspace-execution/real-file-workspace-path-authority.ts') ?? '';
  const operationModel = fileTexts.get('src/real-file-workspace-execution/real-file-operation-model.ts') ?? '';
  const executor = fileTexts.get('src/real-file-workspace-execution/real-file-operation-executor.ts') ?? '';
  const evidence = fileTexts.get('src/real-file-workspace-execution/real-file-execution-evidence.ts') ?? '';
  const sessionModel = fileTexts.get('src/real-file-workspace-execution/real-file-workspace-execution-session.ts') ?? '';
  const bridge = fileTexts.get('src/real-file-workspace-execution/controlled-to-real-file-execution-bridge.ts') ?? '';
  const authority = fileTexts.get('src/real-file-workspace-execution/real-file-workspace-execution-authority.ts') ?? '';
  const bounds = fileTexts.get('src/real-file-workspace-execution/real-file-workspace-execution-bounds.ts') ?? '';
  const builderAnalyzers = fileTexts.get('src/autonomous-builder-reality/autonomous-builder-reality-analyzers.ts') ?? '';
  const workflowAnalyzers = fileTexts.get('src/end-to-end-founder-workflow-reality/end-to-end-founder-workflow-reality-analyzers.ts') ?? '';
  const proofHandler = fileTexts.get('server/execution-proof-handler.ts') ?? '';
  const appJs = fileTexts.get('public/founder-reality/app.js') ?? '';
  const pkg = JSON.parse(fileTexts.get('package.json') ?? '{}') as { scripts?: Record<string, string> };

  assert('01. module exists', existsSync(join(ROOT, 'src/real-file-workspace-execution/index.ts')), 'module');
  assert('02. path authority', pathAuthority.includes('REAL_FILE_WORKSPACE_PATH_PASS') && pathAuthority.includes('REAL_FILE_WORKSPACE_PATH_FAIL'), 'path');
  assert('03. operation model', operationModel.includes('RealFileOperation') && operationModel.includes('evidenceRequired') && bounds.includes('CREATE_FILE'), 'model');
  assert('04. executor', executor.includes('executeRealFileOperation') && executor.includes('writeFileSync'), 'executor');
  assert('05. evidence collector', evidence.includes('FILE_CREATED') && evidence.includes('PATH_BLOCKED'), 'evidence');
  assert('06. session model', sessionModel.includes('RealFileWorkspaceExecutionSession') && sessionModel.includes('BLOCKED'), 'session');
  assert('07. 24C bridge', bridge.includes('mapControlledActionToRealFileOperation') && bridge.includes('GENERATE_SCREEN'), 'bridge');
  assert('08. production protection', bounds.includes('FORBIDDEN_REPO_ROOT_TARGETS') && pathAuthority.includes('Forbidden production'), 'production');
  assert('09. path traversal protection', pathAuthority.includes('Parent-directory traversal'), 'traversal');
  assert('10. blocked operations', bounds.includes('DELETE_FILE') && operationModel.includes('isRealFileOperationBlocked'), 'blocked');
  assert('11. allowed operations', PHASE_24D_ALLOWED_OPERATIONS.includes('READ_FILE'), 'allowed');
  assert('12. dashboard integration', proofHandler.includes('realFileWorkspaceExecution') && appJs.includes('Real File Workspace Execution'), 'dashboard');
  assert('13. founder reality integration', builderAnalyzers.includes('real-file-workspace-execution') && workflowAnalyzers.includes('real-file-workspace-execution'), 'reality');
  assert('14. mobile path compatibility', bounds.includes('FUTURE_MOBILE_PROJECT_PATH_PREFIXES') && FUTURE_MOBILE_PROJECT_PATH_PREFIXES.includes('app.json'), 'mobile');
  assert('15. package script', Boolean(pkg.scripts?.['validate:real-file-workspace-execution']), 'package');
  assert('16. no workspace snapshot', !authority.includes('buildProductWorkspaceSnapshot'), 'snapshot');
  assert('17. no brain calls', !authority.includes('assessFounderSensemaking'), 'brain');
  assert('18. no command execution', !authority.includes('execSync') && !authority.includes('spawnSync') && !authority.includes('npm install'), 'commands');
  assert('19. generated workspace dir', bounds.includes('.generated-builder-workspaces'), 'generated');
  assert('20. pass token', bounds.includes('REAL_FILE_WORKSPACE_EXECUTION_PASS'), 'token');
  checkpoint('static checks complete');

  const ws = createBuilderExecutionWorkspace({
    projectId: 'proj-24d',
    sourceProject: 'World 2 disposable builder workspace',
    initialState: 'WORKSPACE_READY',
  });

  const rootPass = resolveSafeWorkspaceRoot(ROOT, ws.workspaceId);
  assert('21. workspace root pass', rootPass.result === 'REAL_FILE_WORKSPACE_PATH_PASS', rootPass.result);
  assert('22. generated root path', rootPass.workspaceRoot.includes(GENERATED_BUILDER_WORKSPACES_DIR), rootPass.workspaceRoot);

  let productionBlocked = false;
  try {
    createBuilderExecutionWorkspace({
      projectId: 'proj-bad',
      sourceProject: 'DevPulse production workspace',
    });
  } catch {
    productionBlocked = true;
  }
  assert('23. production workspace blocked', productionBlocked, 'forbidden');

  const traversal = resolveSafeAbsolutePath(ROOT, ws.workspaceId, '../src/evil.ts');
  assert('24. traversal blocked', traversal.result === 'REAL_FILE_WORKSPACE_PATH_FAIL', traversal.reason);

  const repoRootAttempt = resolveSafeAbsolutePath(ROOT, ws.workspaceId, join('..', '..', 'src', 'hack.ts').replace(/\\/g, '/'));
  assert('25. escape to repo src blocked', repoRootAttempt.result === 'REAL_FILE_WORKSPACE_PATH_FAIL', repoRootAttempt.reason);

  assert('26. RUN_COMMAND blocked bridge', isControlledActionBridgeBlocked('RUN_COMMAND'), 'RUN_COMMAND');
  assert('27. DELETE blocked model', isRealFileOperationBlocked('DELETE_FILE'), 'DELETE_FILE');

  const blockedProbe = createBlockedOperationProbe(ws.workspaceId);
  const blockedExec = executeRealFileOperation({
    projectRootDir: ROOT,
    workspaceId: ws.workspaceId,
    operation: blockedProbe,
  });
  assert('28. blocked operation evidence', blockedExec.result?.blocked === true && (blockedExec.result?.evidenceIds.length ?? 0) > 0, 'blocked');

  const mapped = mapControlledActionToRealFileOperation(
    createBuilderAction({
      workspaceId: ws.workspaceId,
      actionType: 'GENERATE_SCREEN',
      requestedBy: 'validator',
      sourceRequirement: 'task-1',
      targetPath: 'src/screens/HomeScreen.tsx',
      payloadSummary: 'Home screen',
    }),
  );
  assert('29. bridge maps generate screen', mapped !== null && mapped.operationType === 'CREATE_FILE', mapped?.operationType ?? 'null');

  const assessment = runRealFileWorkspaceExecution({
    projectRootDir: ROOT,
    workspaceId: ws.workspaceId,
    projectId: 'proj-24d',
  });
  checkpoint('execution complete');

  assert('30. session completed', assessment.sessionCount >= 1, String(assessment.sessionCount));
  assert('31. real file active', assessment.realFileExecutionActive === true, String(assessment.realFileExecutionActive));
  assert('32. file exists on disk', verifyRealFileExists({ projectRootDir: ROOT, workspaceId: ws.workspaceId, relativePath: 'src/screens/AppScreen.tsx' }) || verifyRealFileExists({ projectRootDir: ROOT, workspaceId: ws.workspaceId, relativePath: 'src/generated/AppScreen.tsx' }), 'exists');
  assert('33. evidence produced', assessment.evidenceCount >= 3, String(assessment.evidenceCount));
  assert('34. assess authority', assessRealFileWorkspaceExecution().realFileExecutionActive, 'active');
  assert('35. blocked ops list', PHASE_24D_BLOCKED_OPERATIONS.includes('INSTALL_DEPENDENCY'), 'install blocked');

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
    console.log('REAL_FILE_WORKSPACE_EXECUTION_REQUIRES_FIXES');
    process.exit(1);
  }
  console.log(REAL_FILE_WORKSPACE_EXECUTION_PASS_TOKEN);
}

try {
  main();
} catch (err) {
  console.error(err);
  console.log('REAL_FILE_WORKSPACE_EXECUTION_REQUIRES_FIXES');
  process.exit(1);
}
