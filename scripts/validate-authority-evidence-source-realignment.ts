/**
 * Phase 26.91 — Authority Evidence Source Realignment validation (V1).
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assessConnectedBuildExecution,
  refreshGeneratedRuntimeDevServer,
  resetConnectedBuildExecutionCounterForTests,
} from '../src/connected-build-execution/index.js';
import { resetBuildMaterializationTruthBridgeModuleForTests } from '../src/build-materialization-truth-bridge/index.js';
import {
  assessRuntimeMaterializationTruthBridge,
  resetRuntimeMaterializationTruthBridgeModuleForTests,
} from '../src/runtime-materialization-truth-bridge/index.js';
import {
  assessRuntimeStartupProofRepair,
  resetRuntimeStartupProofRepairModuleForTests,
} from '../src/runtime-startup-proof-repair/index.js';
import {
  assessRuntimeRouteReachabilityProof,
  resetRuntimeRouteReachabilityProofModuleForTests,
} from '../src/runtime-route-reachability-proof/index.js';
import {
  assessRuntimeUiRenderProof,
  resetRuntimeUiRenderProofModuleForTests,
} from '../src/runtime-ui-render-proof/index.js';
import {
  assessFounderFlowRuntimeProof,
  resetFounderFlowRuntimeProofModuleForTests,
} from '../src/founder-flow-runtime-proof/index.js';
import {
  buildFounderTestRunHandoffPayload,
  persistFounderTestResultHandoff,
  resetFounderResultStoreDeliveryRepairForTests,
  resetFounderTestRunResultStoreForTests,
} from '../src/founder-test-runtime-monitor/index.js';
import { resetFounderTruthMatrixIntegrationModuleForTests } from '../src/founder-truth-matrix-integration/index.js';
import { resetEvidencePropagationReconciliationModuleForTests } from '../src/evidence-propagation-reconciliation/index.js';
import {
  AUTHORITY_EVIDENCE_SOURCE_REALIGNMENT_PASS,
  TESTING_INFRASTRUCTURE_DEFECT,
  assessAuthorityEvidenceSourceRealignment,
  applyAuthorityEvidenceSourceRealignmentSync,
  classifyLaunchBlockerFromStaleEvidence,
  detectStaleAuthorities,
  resetAuthorityEvidenceSourceRealignmentModuleForTests,
  buildAuthorityEvidenceSourceRealignmentReportMarkdown,
  buildAuthorityStaleEvidenceAuditMarkdown,
} from '../src/authority-evidence-source-realignment/index.js';
import type { AuthorityEvidenceRecord } from '../src/authority-evidence-source-realignment/index.js';

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const VALIDATOR_BASENAME = 'validate-authority-evidence-source-realignment';
const CANONICAL_WORKSPACE = 'build-ready-idea-1';

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

class HangingLlmProvider {
  readonly name = 'mock' as const;
  readonly model = 'hang-mock';
  getStatus() {
    return { readOnly: true as const, connected: true as const, provider: this.name, model: this.model };
  }
  chat(): Promise<never> {
    return new Promise(() => {});
  }
}

const REQUIRED = [
  'src/authority-evidence-source-realignment/authority-evidence-source-realignment-types.ts',
  'src/authority-evidence-source-realignment/authority-evidence-source-realignment-registry.ts',
  'src/authority-evidence-source-realignment/authority-workspace-source-auditor.ts',
  'src/authority-evidence-source-realignment/authority-runid-source-auditor.ts',
  'src/authority-evidence-source-realignment/authority-manifest-source-auditor.ts',
  'src/authority-evidence-source-realignment/authority-report-source-auditor.ts',
  'src/authority-evidence-source-realignment/stale-authority-detector.ts',
  'src/authority-evidence-source-realignment/authority-source-realignment-planner.ts',
  'src/authority-evidence-source-realignment/authority-evidence-source-realignment-report-builder.ts',
  'src/authority-evidence-source-realignment/authority-evidence-source-realignment-history.ts',
  'src/authority-evidence-source-realignment/authority-evidence-source-realignment-authority.ts',
  'src/authority-evidence-source-realignment/index.ts',
];

for (const file of REQUIRED) {
  assert(`file: ${file}`, existsSync(join(ROOT, file)), existsSync(join(ROOT, file)) ? 'present' : 'missing');
}

const registrySource = readFileSync(
  join(ROOT, 'src/authority-evidence-source-realignment/authority-evidence-source-realignment-registry.ts'),
  'utf8',
);
const authoritySource = readFileSync(
  join(ROOT, 'src/authority-evidence-source-realignment/authority-evidence-source-realignment-authority.ts'),
  'utf8',
);
const staleDetectorSource = readFileSync(
  join(ROOT, 'src/authority-evidence-source-realignment/stale-authority-detector.ts'),
  'utf8',
);
const truthMatrixSource = readFileSync(
  join(ROOT, 'src/founder-truth-matrix-integration/founder-truth-matrix-integration-authority.ts'),
  'utf8',
);
const propagationSource = readFileSync(
  join(ROOT, 'src/evidence-propagation-reconciliation/evidence-propagation-reconciliation-authority.ts'),
  'utf8',
);
const packageJson = readFileSync(join(ROOT, 'package.json'), 'utf8');

assert('PASS token in registry', registrySource.includes(AUTHORITY_EVIDENCE_SOURCE_REALIGNMENT_PASS), 'missing');
assert('Rule 1 STALE_EVIDENCE', registrySource.includes('STALE_EVIDENCE'), 'missing');
assert('Rule 5 TESTING_INFRASTRUCTURE_DEFECT', registrySource.includes(TESTING_INFRASTRUCTURE_DEFECT), 'missing');
assert('truth matrix wired', truthMatrixSource.includes('applyAuthorityEvidenceSourceRealignmentSync'), 'missing');
assert('evidence propagation wired', propagationSource.includes('assessAuthorityEvidenceSourceRealignment'), 'missing');
assert('no writeFileSync in authority', !authoritySource.includes('writeFileSync'), 'mutates');
assert('no nested validator', !authoritySource.includes('validate-'), 'nested');
assert(
  'package script registered',
  packageJson.includes(`validate:authority-evidence-source-realignment": "tsx scripts/${VALIDATOR_BASENAME}.ts"`),
  'missing',
);

resetConnectedBuildExecutionCounterForTests();
resetBuildMaterializationTruthBridgeModuleForTests();
resetRuntimeMaterializationTruthBridgeModuleForTests();
resetRuntimeStartupProofRepairModuleForTests();
resetRuntimeRouteReachabilityProofModuleForTests();
resetRuntimeUiRenderProofModuleForTests();
resetFounderFlowRuntimeProofModuleForTests();
resetFounderTestRunResultStoreForTests();
resetFounderResultStoreDeliveryRepairForTests();
resetFounderTruthMatrixIntegrationModuleForTests();
resetEvidencePropagationReconciliationModuleForTests();
resetAuthorityEvidenceSourceRealignmentModuleForTests();

refreshGeneratedRuntimeDevServer({ projectRootDir: ROOT, workspaceId: CANONICAL_WORKSPACE });

const buildReport = assessConnectedBuildExecution({
  rootDir: ROOT,
  attemptBuildProofGapMaterialization: false,
}).report;

const startupRepair = assessRuntimeStartupProofRepair({
  rootDir: ROOT,
  buildMaterializationReport: buildReport,
  skipHistoryRecording: true,
});

const routeProof = assessRuntimeRouteReachabilityProof({
  rootDir: ROOT,
  buildMaterializationReport: buildReport,
  startupProbe: startupRepair.report.probe,
  entrypoint: startupRepair.report.entrypoint,
  resolvedCommand: startupRepair.report.resolvedCommand,
  skipHistoryRecording: true,
});

const uiProof = assessRuntimeUiRenderProof({
  rootDir: ROOT,
  buildMaterializationReport: buildReport,
  startupProbe: startupRepair.report.probe,
  routeReachabilityProof: routeProof.report,
  entrypoint: startupRepair.report.entrypoint,
  resolvedCommand: startupRepair.report.resolvedCommand,
  skipHistoryRecording: true,
});

const deliveryRunId = 'authority-evidence-source-realignment-run';
persistFounderTestResultHandoff({
  phase: 'complete',
  requestedRunId: deliveryRunId,
  runtimeRunId: deliveryRunId,
  ok: true,
  completedAt: new Date().toISOString(),
  payload: buildFounderTestRunHandoffPayload({
    runId: deliveryRunId,
    ok: true,
    runtime: { runId: deliveryRunId, state: 'COMPLETE' } as never,
    reportMarkdown: '# Founder Test Final Report\n\nAuthority evidence source realignment validation.',
    finalReportReady: true,
    finalReportPreparing: false,
  }),
  errorMessage: null,
});

const flowProof = assessFounderFlowRuntimeProof({
  rootDir: ROOT,
  buildMaterializationReport: buildReport,
  startupProbe: startupRepair.report.probe,
  routeReachabilityProof: routeProof.report,
  uiRenderProof: uiProof.report,
  filesExistOnDisk: true,
  dependenciesReady: startupRepair.report.dependencyMaterialization?.dependenciesReady ?? true,
  skipHistoryRecording: true,
});

const runtimeBridge = assessRuntimeMaterializationTruthBridge({
  rootDir: ROOT,
  buildMaterializationReport: buildReport,
  startupProofRepair: startupRepair,
  routeReachabilityProof: routeProof,
  uiRenderProof: uiProof,
  founderFlowRuntimeProof: flowProof,
  skipHistoryRecording: true,
});

assert(
  'runtime bridge APPLICATION_PROVEN baseline',
  runtimeBridge.report.finalApplicationTruth === 'APPLICATION_PROVEN',
  runtimeBridge.report.finalApplicationTruth,
);

const staleRecords: AuthorityEvidenceRecord[] = [
  {
    readOnly: true,
    authorityName: 'Autonomous Build Execution Proof',
    authorityId: 'AUTONOMOUS_BUILD_EXECUTION_PROOF',
    workspaceId: 'build-ready-idea-15',
    runId: 'stale-run-001',
    manifestId: 'manifest-stale',
    reportTimestamp: '2020-01-01T00:00:00.000Z',
    evidenceTimestamp: '2020-01-01T00:00:00.000Z',
    proofLevel: 'NOT_PROVEN',
    verdict: 'NOT_PROVEN',
    dataSource: 'AUTONOMOUS_BUILD_EXECUTION_PROOF',
    buildProofLevel: 'NOT_PROVEN',
    runtimeProofLevel: 'NOT_PROVEN',
    previewProofLevel: 'NOT_PROVEN',
    consumesRuntimeBridge: false,
    evidenceStale: true,
    workspaceStale: true,
    runIdStale: true,
    manifestStale: true,
    reportStale: true,
    contradictsAuthoritativeRuntime: true,
    blocksLaunchFromStaleEvidence: true,
    failureClass: 'STALE_WORKSPACE',
    detail: 'Runtime NOT_PROVEN from stale workspace build-ready-idea-15',
  },
];

const authoritative = {
  readOnly: true as const,
  authoritativeWorkspaceId: CANONICAL_WORKSPACE,
  authoritativeRunId: 'founder-run-canonical',
  authoritativeManifestId: 'manifest-current',
  authoritativeReportTimestamp: new Date().toISOString(),
  finalApplicationTruth: 'APPLICATION_PROVEN' as const,
  applicationBoots: true,
  routesReachable: true,
  uiRenders: true,
  founderFlowProven: true,
};

const staleFindings = detectStaleAuthorities({ records: staleRecords, authoritative });
assert('stale authorities detected', staleFindings.length > 0, String(staleFindings.length));
assert('stale workspaces detected', staleFindings.some((f) => f.failureClass === 'STALE_WORKSPACE'), staleFindings.map((f) => f.failureClass).join(', '));
assert('stale runIds detected', staleFindings.some((f) => f.failureClass === 'STALE_RUNID'), staleFindings.map((f) => f.failureClass).join(', '));
assert('stale reports detected', staleFindings.some((f) => f.failureClass === 'STALE_REPORT'), staleFindings.map((f) => f.failureClass).join(', '));

const staleBlocker = classifyLaunchBlockerFromStaleEvidence({
  blockerExplanation: 'Runtime NOT_PROVEN — AiDevEngine cannot run applications',
  authoritative,
  hasStaleAuthorityFinding: true,
});
assert(
  'stale launch blockers reclassified correctly',
  staleBlocker.reclassified && staleBlocker.defectClass === TESTING_INFRASTRUCTURE_DEFECT,
  String(staleBlocker.defectClass),
);

const genuineBlocker = classifyLaunchBlockerFromStaleEvidence({
  blockerExplanation: 'Chat intelligence score below launch gate',
  authoritative,
  hasStaleAuthorityFinding: true,
});
assert(
  'genuine product gap blockers remain',
  genuineBlocker.genuineProductGap && !genuineBlocker.reclassified,
  String(genuineBlocker.genuineProductGap),
);

const assessment = assessAuthorityEvidenceSourceRealignment({
  rootDir: ROOT,
  runId: deliveryRunId,
  runtimeMaterializationTruthBridge: runtimeBridge,
  launchBlockers: [
    { id: 'runtime-not-proven', explanation: 'Runtime NOT_PROVEN — stale path' },
    { id: 'chat-gate', explanation: 'Chat intelligence score below launch gate' },
  ],
  skipHistoryRecording: true,
  skipHeavyOrchestration: true,
});

assert(
  'authoritative workspace identified',
  assessment.report.authoritative.authoritativeWorkspaceId != null,
  assessment.report.authoritative.authoritativeWorkspaceId ?? 'null',
);
assert(
  'authoritative runId identified',
  assessment.report.authoritative.authoritativeRunId === deliveryRunId,
  assessment.report.authoritative.authoritativeRunId ?? 'null',
);

const syncResult = applyAuthorityEvidenceSourceRealignmentSync({
  runtimeMaterializationTruthBridge: runtimeBridge,
  runId: deliveryRunId,
  launchBlockers: [
    { id: 'preview-not-proven', explanation: 'Preview NOT_PROVEN from stale workspace' },
    { id: 'build-not-proven', explanation: 'Build NOT_PROVEN from stale manifest' },
    { id: 'product-chat', explanation: 'Users will hit weak chat answers at launch' },
  ],
  skipHistoryRecording: true,
  skipHeavyOrchestration: true,
});
assert(
  'sync reclassifies stale-only blockers',
  syncResult.reclassifiedBlockerIds.length >= 2,
  syncResult.reclassifiedBlockerIds.join(', '),
);
assert(
  'sync preserves genuine blockers',
  syncResult.genuineBlockerIds.includes('product-chat'),
  syncResult.genuineBlockerIds.join(', '),
);

const failed = results.filter((entry) => !entry.passed);
const passToken = AUTHORITY_EVIDENCE_SOURCE_REALIGNMENT_PASS;

const realignmentReport = buildAuthorityEvidenceSourceRealignmentReportMarkdown(assessment.report);
const staleAudit = buildAuthorityStaleEvidenceAuditMarkdown(assessment.report);
const validationSummary = [
  '# Authority Source Alignment Validation',
  '',
  `Result: ${failed.length === 0 ? passToken : 'FAILED'}`,
  '',
  ...results.map((entry) => `- [${entry.passed ? 'x' : ' '}] ${entry.name}: ${entry.detail}`),
  '',
  '## Assessment snapshot',
  '',
  `- authoritativeWorkspace=${assessment.report.authoritative.authoritativeWorkspaceId ?? 'n/a'}`,
  `- authoritativeRunId=${assessment.report.authoritative.authoritativeRunId ?? 'n/a'}`,
  `- staleFindings=${assessment.report.staleFindings.length}`,
  `- staleLaunchBlockersReclassified=${assessment.report.staleLaunchBlockersReclassified}`,
  `- genuineProductGapBlockers=${assessment.report.genuineProductGapBlockers}`,
  '',
].join('\n');

writeFileSync(join(ROOT, 'architecture', 'AUTHORITY_EVIDENCE_SOURCE_REALIGNMENT_REPORT.md'), realignmentReport, 'utf8');
writeFileSync(join(ROOT, 'architecture', 'AUTHORITY_STALE_EVIDENCE_AUDIT.md'), staleAudit, 'utf8');
writeFileSync(join(ROOT, 'architecture', 'AUTHORITY_SOURCE_ALIGNMENT_VALIDATION.md'), validationSummary, 'utf8');

if (failed.length > 0) {
  console.error(validationSummary);
  process.exit(1);
}

console.log(passToken);
console.log(validationSummary);
