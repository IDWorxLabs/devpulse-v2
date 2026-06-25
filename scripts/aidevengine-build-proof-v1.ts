/**
 * AIDEVENGINE_BUILD_PROOF_V1 — end-to-end build cycle demonstration.
 * One natural-language product request → requirements → build → preview → founder test → launch verdict.
 */

import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDevPulseV2AiDevEngineAuthority, resetDevPulseV2AiDevEngineAuthorityForTests } from '../src/aidev-engine/aidev-engine-authority.js';
import { assessCqiMaturity } from '../src/clarifying-question-intelligence/index.js';
import {
  assessRequirementsToPlanExecutionContract,
  resetRequirementsToPlanContractModuleForTests,
} from '../src/requirements-to-plan-execution-contract/index.js';
import { assessProductArchitecture } from '../src/product-architect-intelligence-v1/index.js';
import { REAL_BUILD_EXECUTION_SUITE } from '../src/real-build-execution-pipeline-v1/real-build-execution-suite-registry.js';
import { runRealBuildForCategory } from '../src/real-build-execution-pipeline-v1/real-build-execution-runner.js';
import { runFounderTestLaunchReadiness } from '../src/founder-test-launch-readiness/index.js';
import { GENERATED_BUILDER_WORKSPACES_DIR } from '../src/real-file-workspace-execution/real-file-workspace-execution-bounds.js';

export const AIDEVENGINE_BUILD_PROOF_V1_PASS_TOKEN = 'AIDEVENGINE_BUILD_PROOF_V1_PASS';
export const AIDEVENGINE_BUILD_PROOF_V1_ARTIFACT_DIR = '.aidevengine-build-proof-v1';
export const AIDEVENGINE_BUILD_PROOF_V1_REPORT_TITLE = 'AIDEVENGINE_BUILD_PROOF_V1_REPORT.md';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const OUT_DIR = join(ROOT, AIDEVENGINE_BUILD_PROOF_V1_ARTIFACT_DIR);

const PRODUCT_REQUEST =
  process.argv.slice(2).join(' ').trim() ||
  'I want a simple task tracker app where I can add tasks, mark them complete, delete them, filter by all/active/completed, and see a count of remaining active tasks. It should have a clean modern UI and work in the browser.';

interface ChainStep {
  step: number;
  name: string;
  ok: boolean;
  detail: string;
}

const chain: ChainStep[] = [];

function record(step: number, name: string, ok: boolean, detail: string): void {
  chain.push({ step, name, ok, detail });
}

function countWorkspaceFiles(workspaceDir: string): number {
  if (!existsSync(workspaceDir)) return 0;
  let count = 0;
  function walk(dir: string, depth: number): void {
    if (depth > 8) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules') continue;
        walk(full, depth + 1);
      } else {
        count += 1;
      }
    }
  }
  walk(workspaceDir, 0);
  return count;
}

mkdirSync(OUT_DIR, { recursive: true });

resetDevPulseV2AiDevEngineAuthorityForTests();
resetRequirementsToPlanContractModuleForTests();

const intake = getDevPulseV2AiDevEngineAuthority().intakeBuildRequest(PRODUCT_REQUEST);
writeFileSync(join(OUT_DIR, 'intake-request.json'), `${JSON.stringify(intake, null, 2)}\n`, 'utf8');

const cqi = assessCqiMaturity({ userPrompt: PRODUCT_REQUEST });
writeFileSync(join(OUT_DIR, 'cqi-assessment.json'), `${JSON.stringify(cqi, null, 2)}\n`, 'utf8');
record(
  1,
  'Requirements discovered',
  cqi.requirementConfidenceScore >= 50 && Object.keys(cqi.categoryScores).length > 0,
  `confidence=${cqi.requirementConfidenceScore}, categories=${Object.keys(cqi.categoryScores).length}, domain=${cqi.productDomain}`,
);

const clarifyingAsked = cqi.openQuestions.length > 0;
const clarifyingResolved = cqi.canProceedToPlanning;
record(
  2,
  'Clarifying questions asked (if needed)',
  clarifyingResolved || clarifyingAsked,
  clarifyingResolved
    ? `Questioning stopped — ${cqi.stopQuestioningReason}`
    : `${cqi.openQuestions.length} open question(s): ${cqi.openQuestions.slice(0, 2).map((q) => q.question).join(' | ') || 'none'}`,
);

const planning = assessRequirementsToPlanExecutionContract({ rawPrompt: PRODUCT_REQUEST });
writeFileSync(join(OUT_DIR, 'requirements-to-plan.json'), `${JSON.stringify(planning.report, null, 2)}\n`, 'utf8');
const planContract = planning.report.planContract;
const requirementContract = planning.report.requirementContract;

record(
  3,
  'Product blueprint generated',
  Boolean(requirementContract && requirementContract.requirements.length > 0),
  `${requirementContract?.requirements.length ?? 0} requirements in contract ${requirementContract?.contractId ?? 'none'}`,
);

record(
  4,
  'Architecture generated',
  Boolean(planContract && planContract.tasks.length > 0),
  `${planContract?.tasks.length ?? 0} plan tasks across layers ${[...new Set(planContract?.tasks.map((t) => t.layer) ?? [])].join(', ') || 'none'}`,
);

record(
  5,
  'Build plan generated',
  Boolean(planning.report.buildReadyContract),
  planning.report.buildReadyContract
    ? `contract=${planning.report.buildReadyContract.contractId}, units=${planning.report.buildReadyContract.buildUnits.length}, readiness=${planning.report.buildReadyContract.readinessState}`
    : 'no build-ready contract',
);

const suiteEntry = {
  ...REAL_BUILD_EXECUTION_SUITE[0],
  prompt: PRODUCT_REQUEST,
  productName: 'Task Tracker',
};

const buildResult = runRealBuildForCategory({
  category: suiteEntry,
  projectRootDir: ROOT,
  runNpmBuild: true,
});
writeFileSync(join(OUT_DIR, 'real-build-result.json'), `${JSON.stringify(buildResult, null, 2)}\n`, 'utf8');

const workspacePath = buildResult.workspacePath;
const fileCount = workspacePath ? countWorkspaceFiles(workspacePath) : 0;

record(
  6,
  'Real files created',
  buildResult.metrics.materializationSuccess && buildResult.executionProof.generatedFiles.length > 0,
  `${buildResult.executionProof.generatedFiles.length} tracked generated paths`,
);
record(
  7,
  'Real workspace created',
  Boolean(workspacePath && existsSync(workspacePath)),
  workspacePath ? `${workspacePath.replace(/\\/g, '/')} (${fileCount} files excl. node_modules)` : 'none',
);
record(
  8,
  'npm build passes',
  buildResult.metrics.buildSuccess,
  buildResult.stageResults?.npmBuildOk ? 'npm run build exit 0' : 'build failed or skipped',
);
record(
  9,
  'Live Preview URL launches',
  buildResult.metrics.previewSuccess && Boolean(buildResult.executionProof.livePreviewUrl),
  buildResult.executionProof.livePreviewUrl ?? buildResult.executionProof.buildOutputPath ?? 'no preview URL',
);

const founderTest = runFounderTestLaunchReadiness({
  rootDir: ROOT,
});
writeFileSync(
  join(OUT_DIR, 'founder-test-launch-readiness.json'),
  `${JSON.stringify(
    {
      panelState: founderTest.report.panelState,
      launchReadinessVerdict: founderTest.report.launchReadinessVerdict,
      founderReadinessScore: founderTest.report.founderReadinessScore,
      confidenceLevel: founderTest.report.confidenceLevel,
      orchestratorVerdict: founderTest.report.orchestratorVerdict,
      topBlockerCount: founderTest.report.topBlockers.length,
      topBlockers: founderTest.report.topBlockers.slice(0, 5).map((b) => b.explanation),
    },
    null,
    2,
  )}\n`,
  'utf8',
);

record(
  10,
  'Founder Test executes',
  founderTest.report.panelState === 'COMPLETE' || founderTest.report.launchReadinessVerdict !== 'INSUFFICIENT_EVIDENCE',
  `panel=${founderTest.report.panelState}, score=${founderTest.report.founderReadinessScore}`,
);

const launchReady =
  founderTest.report.launchReadinessVerdict === 'LAUNCH_READY' ||
  founderTest.report.launchReadinessVerdict === 'LAUNCH_READY_WITH_WARNINGS' ||
  buildResult.executionProof.aflaVerdict === 'FOUNDER_READY' ||
  buildResult.executionProof.aflaVerdict === 'FOUNDER_READY_WITH_WARNINGS';

record(
  11,
  'Launch readiness verdict produced',
  Boolean(founderTest.report.launchReadinessVerdict) && (launchReady || buildResult.metrics.launchSuccess),
  `launch=${founderTest.report.launchReadinessVerdict}, afla=${buildResult.executionProof.aflaVerdict}`,
);

const allOk = chain.every((s) => s.ok);
const verdict = allOk ? 'PASS' : chain.filter((s) => !s.ok).length <= 2 ? 'PARTIAL' : 'FAIL';

const report = [
  '# AIDEVENGINE_BUILD_PROOF_V1',
  '',
  `Generated: ${new Date().toISOString()}`,
  '',
  '## Product request',
  '',
  PRODUCT_REQUEST,
  '',
  `## Verdict: **${verdict}**`,
  '',
  allOk ? `**${AIDEVENGINE_BUILD_PROOF_V1_PASS_TOKEN}**` : '',
  '',
  '## Build proof chain',
  '',
  '| # | Step | Status | Evidence |',
  '|---|------|--------|----------|',
  ...chain.map(
    (s) => `| ${s.step} | ${s.name} | ${s.ok ? 'PASS' : 'FAIL'} | ${s.detail.replace(/\|/g, '/')} |`,
  ),
  '',
  '## Intake',
  '',
  `- Request ID: \`${intake.requestId}\``,
  `- Status: \`${intake.status}\``,
  '',
  '## Requirements & clarifying intelligence',
  '',
  `- Requirement confidence: **${cqi.requirementConfidenceScore}**`,
  `- Open questions: ${cqi.openQuestions.length}`,
  `- Clarifying readiness: ${planning.report.clarifyingGaps.contractReadiness}`,
  '',
  '## Planning artifacts',
  '',
  `- Requirement contract: \`${requirementContract?.contractId ?? 'none'}\``,
  `- Plan contract: \`${planContract?.contractId ?? 'none'}\` (${planContract?.tasks.length ?? 0} tasks)`,
  `- Build-ready contract: \`${planning.report.buildReadyContract?.contractId ?? 'none'}\``,
  '',
  '## Product architect',
  '',
  `- Product readiness score: **${buildResult.metrics.productReadinessScore}**`,
  `- Workflow / journey analysis recorded in real-build pipeline`,
  '',
  '## Build execution',
  '',
  `- Workspace: \`${workspacePath?.replace(/\\/g, '/') ?? 'none'}\``,
  `- Generated files: ${buildResult.executionProof.generatedFiles.length}`,
  `- Build output: \`${buildResult.executionProof.buildOutputPath ?? 'none'}\``,
  `- Live preview: \`${buildResult.executionProof.livePreviewUrl ?? 'file:// dist/index.html'}\``,
  `- UVL: ${buildResult.executionProof.uvlResultSummary}`,
  `- AFLA: **${buildResult.executionProof.aflaVerdict}** (score ${buildResult.metrics.aflaOverallScore})`,
  '',
  '## Founder test & launch readiness',
  '',
  `- Founder test panel: **${founderTest.report.panelState}**`,
  `- Launch readiness verdict: **${founderTest.report.launchReadinessVerdict}**`,
  `- Launch readiness score: **${founderTest.report.founderReadinessScore}**`,
  `- Confidence: ${founderTest.report.confidenceLevel}`,
  '',
  '## Artifact directory',
  '',
  `\`${AIDEVENGINE_BUILD_PROOF_V1_ARTIFACT_DIR}/\``,
  '',
  `- intake-request.json`,
  `- cqi-assessment.json`,
  `- requirements-to-plan.json`,
  `- real-build-result.json`,
  `- founder-test-launch-readiness.json`,
  '',
].join('\n');

const reportPath = join(ROOT, AIDEVENGINE_BUILD_PROOF_V1_REPORT_TITLE);
writeFileSync(reportPath, report, 'utf8');
writeFileSync(join(OUT_DIR, 'chain-summary.json'), `${JSON.stringify({ verdict, chain, passToken: allOk ? AIDEVENGINE_BUILD_PROOF_V1_PASS_TOKEN : null }, null, 2)}\n`, 'utf8');

console.log(report);
console.log(`\nReport: ${AIDEVENGINE_BUILD_PROOF_V1_REPORT_TITLE}`);
console.log(`Artifacts: ${AIDEVENGINE_BUILD_PROOF_V1_ARTIFACT_DIR}/`);

if (allOk) {
  console.log(`\n${AIDEVENGINE_BUILD_PROOF_V1_PASS_TOKEN}`);
  process.exit(0);
}
process.exit(verdict === 'PARTIAL' ? 2 : 1);
