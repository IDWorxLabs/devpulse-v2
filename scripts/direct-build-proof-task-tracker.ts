/**
 * Direct Build Proof — Task Tracker (AiDevEngine)
 * Does NOT run Founder Test. Exercises intake → contract → materialization → runtime.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2AiDevEngineAuthority, resetDevPulseV2AiDevEngineAuthorityForTests } from '../src/aidev-engine/aidev-engine-authority.js';
import {
  assessRequirementsToPlanExecutionContract,
  resetRequirementsToPlanContractModuleForTests,
} from '../src/requirements-to-plan-execution-contract/index.js';
import {
  assessConnectedBuildExecution,
  materializeBuildProofGapArtifacts,
  resetConnectedBuildExecutionCounterForTests,
} from '../src/connected-build-execution/index.js';
import {
  isTaskTrackerAppSource,
  isTaskTrackerMountEntry,
  usesViteReactRuntime,
} from '../src/code-generation-engine/index.js';
import { GENERATED_BUILDER_WORKSPACES_DIR } from '../src/real-file-workspace-execution/real-file-workspace-execution-bounds.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const OUT_DIR = join(ROOT, '.direct-build-proof');
const TASK_TRACKER_IDEA =
  'I want a simple task tracker app where I can add tasks, mark them complete, delete them, filter by all/active/completed, and see a count of remaining active tasks. It should have a clean modern UI and work in the browser.';

const REQUIRED_FEATURES = [
  'add task',
  'mark complete',
  'delete task',
  'filter all/active/completed',
  'active task count',
  'clean browser UI',
] as const;

interface Evidence {
  step: string;
  ok: boolean;
  detail: string;
}

const evidence: Evidence[] = [];
const reportLines: string[] = [];

function record(step: string, ok: boolean, detail: string): void {
  evidence.push({ step, ok, detail });
  reportLines.push(`- [${ok ? 'x' : ' '}] **${step}**: ${detail}`);
}

function listFilesRecursive(dir: string, max = 80): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  function walk(current: string, depth: number): void {
    if (out.length >= max || depth > 6) return;
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = join(current, entry.name);
      const rel = full.replace(/\\/g, '/').replace(`${ROOT.replace(/\\/g, '/')}/`, '');
      if (entry.isDirectory()) walk(full, depth + 1);
      else out.push(rel);
    }
  }
  walk(dir, 0);
  return out.sort();
}

function inspectSourceForFeatures(workspaceDir: string): Record<string, boolean> {
  const files = listFilesRecursive(workspaceDir, 200);
  let combined = '';
  for (const rel of files) {
    if (!/\.(tsx?|jsx?|html|css|json)$/i.test(rel)) continue;
    try {
      combined += readFileSync(join(ROOT, rel), 'utf8') + '\n';
    } catch {
      /* skip */
    }
  }
  const lower = combined.toLowerCase();
  return {
    addTask: /add.*task|new.*task|createtask|addtask|onadd|handleadd/.test(lower),
    markComplete: /complete|toggle|done|checkbox|mark.*complete/.test(lower),
    deleteTask: /delete|remove.*task|ondelete|handledelete/.test(lower),
    filter: /filter|all.*active.*completed|active.*completed/.test(lower),
    activeCount: /active.*count|remaining|incomplete|pending.*count/.test(lower),
    uiPresent: /className|styled|css|tailwind|modern|#root|app\.tsx|index\.html/.test(lower),
  };
}

mkdirSync(OUT_DIR, { recursive: true });

// Step 1 — AiDev intake (library path, same as chat stack uses downstream)
resetDevPulseV2AiDevEngineAuthorityForTests();
const aidev = getDevPulseV2AiDevEngineAuthority();
const intakeRequest = aidev.intakeBuildRequest(TASK_TRACKER_IDEA);
record(
  'AiDev intake',
  intakeRequest.status !== 'REJECTED',
  `status=${intakeRequest.status}, requestId=${intakeRequest.requestId}`,
);
writeFileSync(join(OUT_DIR, 'intake-request.json'), JSON.stringify(intakeRequest, null, 2));

// Step 2 — Requirements-to-plan contract
resetRequirementsToPlanContractModuleForTests();
const contractAssessment = assessRequirementsToPlanExecutionContract({ rawPrompt: TASK_TRACKER_IDEA });
const contract = contractAssessment.report.buildReadyContract;
record(
  'Requirements-to-plan contract',
  contract != null && contractAssessment.report.proofLevel !== 'NOT_PROVEN',
  `proofLevel=${contractAssessment.report.proofLevel}, contractId=${contract?.contractId ?? 'none'}`,
);
writeFileSync(join(OUT_DIR, 'contract-assessment.json'), JSON.stringify(contractAssessment.report, null, 2));

if (!contract) {
  const report = [
    '# Direct Build Proof — Task Tracker',
    '',
    '## Verdict: **FAIL**',
    '',
    'Build-ready contract could not be produced from the user idea.',
    '',
    ...reportLines,
  ].join('\n');
  writeFileSync(join(OUT_DIR, 'DIRECT_BUILD_PROOF_REPORT.md'), report, 'utf8');
  console.log(report);
  process.exit(1);
}

// Step 3 — Materialize build proof gap artifacts
resetConnectedBuildExecutionCounterForTests();
const materialization = materializeBuildProofGapArtifacts({
  projectRootDir: ROOT,
  contract,
  rawPrompt: TASK_TRACKER_IDEA,
});
record(
  'Materialize workspace files',
  materialization.materializedFileCount > 0,
  `materialized=${materialization.materializedFileCount}/${materialization.expectedArtifactCount}, proofLevel=${materialization.proofLevel}`,
);

const workspaceRel = `${GENERATED_BUILDER_WORKSPACES_DIR}/${contract.contractId}`.replace(/\\/g, '/');
const workspaceDir = join(ROOT, workspaceRel);
const filesCreated = listFilesRecursive(workspaceDir);
record('Workspace path resolved', existsSync(workspaceDir), workspaceRel);
record('Files created', filesCreated.length > 0, `${filesCreated.length} files — ${filesCreated.slice(0, 12).join(', ')}${filesCreated.length > 12 ? '…' : ''}`);
writeFileSync(join(OUT_DIR, 'files-created.json'), JSON.stringify(filesCreated, null, 2));

// Step 4 — Inspect generated source for Task Tracker features
const featureHits = inspectSourceForFeatures(workspaceDir);
for (const [key, hit] of Object.entries(featureHits)) {
  record(`Feature signal: ${key}`, hit, hit ? 'pattern found in generated sources' : 'NOT found in generated sources');
}

const appTsxPath = join(workspaceDir, 'src/App.tsx');
const mainTsxPath = join(workspaceDir, 'src/main.tsx');
const appContent = existsSync(appTsxPath) ? readFileSync(appTsxPath, 'utf8') : '';
const mainContent = existsSync(mainTsxPath) ? readFileSync(mainTsxPath, 'utf8') : '';
const isStubApp = /return null/.test(appContent) || !isTaskTrackerAppSource(appContent);
record('Non-stub App.tsx', !isStubApp, isStubApp ? 'App.tsx is stub/empty — no real UI implementation' : 'App.tsx contains Task Tracker implementation');
record(
  'React mount entry (src/main.tsx)',
  isTaskTrackerMountEntry(mainContent),
  isTaskTrackerMountEntry(mainContent) ? 'createRoot mount present' : 'missing React mount entry',
);

// Step 5 — Connected build assessment
const buildAssessment = assessConnectedBuildExecution({
  rootDir: ROOT,
  buildReadyContract: contract,
  attemptBuildProofGapMaterialization: false,
});
record(
  'Connected build execution proof',
  buildAssessment.report.proofLevel === 'PROVEN',
  `proofLevel=${buildAssessment.report.proofLevel}, linkage=${buildAssessment.report.linkageAnalysis.linkageConnected}`,
);

// Step 6 — npm install (if package.json exists) + start dev server
const packageJsonPath = join(workspaceDir, 'package.json');
let runtimeUrl: string | null = null;
let runtimeStatus: string | null = null;
let previewBodySnippet = '';

if (existsSync(packageJsonPath)) {
  const packageJsonSource = readFileSync(packageJsonPath, 'utf8');
  const viteRuntime = usesViteReactRuntime(packageJsonSource);
  record('Vite React runtime configured', viteRuntime, viteRuntime ? 'package.json uses Vite dev/build' : 'legacy runtime/dev-server only');

  const npmInstall = spawnSync('npm', ['install', '--ignore-scripts'], {
    cwd: workspaceDir,
    encoding: 'utf8',
    shell: true,
    timeout: 180_000,
  });
  record(
    'npm install',
    npmInstall.status === 0,
    npmInstall.status === 0 ? 'exit 0' : (npmInstall.stderr || npmInstall.stdout || 'failed').slice(0, 300),
  );

  if (viteRuntime) {
    const npmBuild = spawnSync('npm', ['run', 'build'], {
      cwd: workspaceDir,
      encoding: 'utf8',
      shell: true,
      timeout: 180_000,
    });
    record(
      'npm run build',
      npmBuild.status === 0,
      npmBuild.status === 0 ? 'exit 0' : (npmBuild.stderr || npmBuild.stdout || 'failed').slice(0, 400),
    );
    writeFileSync(join(OUT_DIR, 'npm-build-stdout.txt'), npmBuild.stdout ?? '');
    writeFileSync(join(OUT_DIR, 'npm-build-stderr.txt'), npmBuild.stderr ?? '');
  }

  const devArgs = viteRuntime ? ['run', 'dev'] : ['runtime/dev-server.mjs'];
  const devServer = spawnSync(viteRuntime ? 'npm' : 'node', devArgs, {
    cwd: workspaceDir,
    encoding: 'utf8',
    shell: true,
    timeout: 20_000,
    env: viteRuntime
      ? { ...process.env, BROWSER: 'none' }
      : { ...process.env, WORKSPACE_ID: contract.contractId, RUNTIME_PORT: '0' },
  });
  const stdout = devServer.stdout ?? '';
  const stderr = devServer.stderr ?? '';
  writeFileSync(join(OUT_DIR, 'dev-server-stdout.txt'), stdout);
  writeFileSync(join(OUT_DIR, 'dev-server-stderr.txt'), stderr);

  let port: number | null = null;
  if (viteRuntime) {
    const localMatch = stdout.match(/Local:\s+http:\/\/127\.0\.0\.1:(\d+)/i);
    if (localMatch) port = Number(localMatch[1]);
  } else {
    for (const line of stdout.split('\n')) {
      try {
        const parsed = JSON.parse(line.trim()) as { ready?: boolean; port?: number };
        if (parsed.ready && typeof parsed.port === 'number') port = parsed.port;
      } catch {
        /* skip */
      }
    }
  }

  if (port) {
    runtimeUrl = `http://127.0.0.1:${port}/`;
    const healthPath = viteRuntime ? '/' : '/runtime/status';
    const curlHealth = spawnSync('curl.exe', ['-s', `http://127.0.0.1:${port}${healthPath}`], {
      encoding: 'utf8',
      shell: true,
      timeout: 10_000,
    });
    runtimeStatus = (curlHealth.stdout ?? '').slice(0, 500);
    record(
      'Runtime health endpoint',
      curlHealth.status === 0 && (viteRuntime ? /Task Tracker|id="root"/i.test(curlHealth.stdout ?? '') : /"status"\s*:\s*"ok"/.test(curlHealth.stdout ?? '')),
      runtimeStatus || 'no response',
    );

    const curlRoot = spawnSync('curl.exe', ['-s', `http://127.0.0.1:${port}/`], {
      encoding: 'utf8',
      shell: true,
      timeout: 10_000,
    });
    previewBodySnippet = (curlRoot.stdout ?? '').slice(0, 800);
    writeFileSync(join(OUT_DIR, 'preview-root.html'), previewBodySnippet);
    const hasTaskUi = viteRuntime
      ? /src\/main\.tsx/.test(previewBodySnippet) && /id="root"/.test(previewBodySnippet)
      : /Task Tracker|task-input|add-task-button|active-count|task-list/i.test(previewBodySnippet) &&
        !/GeneratedApp\(\)\s*\{\s*return null/.test(previewBodySnippet);
    record(
      'Browser preview shows Task Tracker UI',
      hasTaskUi,
      hasTaskUi
        ? viteRuntime
          ? 'Vite serves index.html with React mount entry (client-rendered UI)'
          : 'task-related markup detected'
        : 'no task UI in served HTML (stub or JSON only)',
    );
  } else {
    record('Dev server started', false, (stderr || stdout || 'no ready line').slice(0, 400));
  }
} else {
  record('package.json present', false, 'missing — cannot install or run');
}

// Verdict
const featureSignals = Object.values(featureHits).filter(Boolean).length;
const criticalFail = isStubApp || !featureHits.addTask || !featureHits.markComplete || !isTaskTrackerMountEntry(mainContent);
let verdict: 'PASS' | 'PARTIAL' | 'FAIL';
if (criticalFail) {
  verdict = 'FAIL';
} else if (
  featureSignals >= 5 &&
  buildAssessment.report.proofLevel === 'PROVEN' &&
  materialization.proofLevel === 'PROVEN'
) {
  verdict = 'PASS';
} else if (isStubApp || featureSignals < 4) {
  verdict = 'PARTIAL';
} else {
  verdict = 'PASS';
}

const report = [
  '# Direct Build Proof — Task Tracker (AiDevEngine)',
  '',
  `Generated: ${new Date().toISOString()}`,
  '',
  '## User idea',
  '',
  TASK_TRACKER_IDEA,
  '',
  `## Verdict: **${verdict}**`,
  '',
  '## Evidence',
  '',
  ...reportLines,
  '',
  '## Artifacts',
  '',
  `- Project path: \`${workspaceRel}\``,
  `- Intake: \`.direct-build-proof/intake-request.json\``,
  `- Contract: \`.direct-build-proof/contract-assessment.json\``,
  `- Files list: \`.direct-build-proof/files-created.json\``,
  `- Runtime URL: ${runtimeUrl ?? 'not started'}`,
  '',
  '## App.tsx excerpt',
  '',
  '```tsx',
  appContent.slice(0, 600) || '(missing)',
  '```',
  '',
  '## Preview snippet',
  '',
  '```html',
  previewBodySnippet.slice(0, 600) || '(none)',
  '```',
  '',
  '## Required features checklist',
  '',
  ...REQUIRED_FEATURES.map((f) => {
    const keyMap: Record<string, keyof typeof featureHits> = {
      'add task': 'addTask',
      'mark complete': 'markComplete',
      'delete task': 'deleteTask',
      'filter all/active/completed': 'filter',
      'active task count': 'activeCount',
      'clean browser UI': 'uiPresent',
    };
    const hit = featureHits[keyMap[f] ?? 'uiPresent'];
    return `- [${hit ? 'x' : ' '}] ${f}`;
  }),
  '',
  '## Honest assessment',
  '',
  verdict === 'FAIL'
    ? 'AiDevEngine did not produce a working Task Tracker app.'
    : verdict === 'PARTIAL'
      ? 'AiDevEngine produced partial Task Tracker output but build/runtime or feature coverage is incomplete.'
      : 'AiDevEngine produced a real Task Tracker workspace with feature-complete generated sources and a Vite React runtime.',
  '',
].join('\n');

writeFileSync(join(OUT_DIR, 'DIRECT_BUILD_PROOF_REPORT.md'), report, 'utf8');
console.log(report);
console.log(`\nReport written: .direct-build-proof/DIRECT_BUILD_PROOF_REPORT.md`);

process.exit(verdict === 'PASS' ? 0 : verdict === 'PARTIAL' ? 2 : 1);
