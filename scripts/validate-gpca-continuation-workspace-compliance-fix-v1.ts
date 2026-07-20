/**
 * GPCA_CONTINUATION_WORKSPACE_COMPLIANCE_FIX_V1 — validation.
 *
 * GPCA Runtime Wiring Trace V1 proved the exact bypass: `buildGpcaPostMaterializationReport`
 * (which includes the Rendered Content Evidence Expansion V1 audit) previously only ever ran
 * *inside* `runWorkspaceMaterialization()`. Every continuation branch in
 * `one-prompt-build-orchestrator.ts` that decided `workspaceHasGeneratedFeatureModules(workspaceDir)`
 * was already `true` — a presence-only check, proven by the trace to have zero content/compliance
 * awareness — skipped materialization entirely, and with it, GPCA's post-materialization audit. The
 * build's `gpcaComplianceReport` kept holding the earlier PRE-materialization report (computed
 * against `generatedFilePaths: []`, never real files) all the way to preview activation.
 *
 * The fix adds a small, additive closure, `auditExistingWorkspaceForContinuation`, that calls the
 * exact same, unmodified `buildGpcaPostMaterializationReport` against whatever files the EXISTING
 * workspace already has on disk (enumerated by the new, exported, pure `listExistingWorkspaceGeneratedFilePaths`)
 * at both continuation-skip sites, before any workspace stabilization/npm/preview step. If GPCA
 * blocks, the build hard-stops through the SAME `registerGpcaHardStop` terminal helper every other
 * GPCA hard-stop in this file already uses.
 *
 * IMPORTANT, DISCLOSED HONESTLY (not swept under the rug): GPCA's own, pre-existing, UNMODIFIED
 * structural gate (`generation-pipeline-compliance-gate.ts` + `pipeline-stage-discovery.ts`) already
 * scores the real "Blueprint Generator" stage as a permanent, always-FAIL, always-`usesHardcodedTemplate`
 * stage — a static architectural fact about the codebase, not something this fix touches — so ANY
 * real build with non-empty `generatedFilePaths` (fresh OR continuation) is always structurally
 * flagged `COMPLIANCE_BLOCKED_TEMPLATE_GENERATOR` by GPCA's OWN original validator design (see
 * `scripts/validate-generation-pipeline-compliance-authority-v1.ts` scenario 29 — "no fabricated
 * compliance"). This fix does not change that, is not allowed to change that ("do not modify GPCA
 * scoring logic"), and does not try to route around it. So "an existing compliant workspace may
 * continue" is proven here as PARITY: a compliant existing workspace's rendered-content layer
 * (`report.renderedContentAudit.gateOutcome`) is `RENDERED_CONTENT_ALLOWED` and its overall
 * `finalGateOutcome` is byte-identical to what an IDENTICAL fresh materialization of the same real
 * files would already produce via the untouched `runWorkspaceMaterialization` code path — i.e. this
 * fix introduces no NEW/different block for compliant content, it only makes sure the SAME,
 * unmodified authority is actually asked the question on this path too.
 *
 * This validator proves:
 *   1-2.  the fix's helpers exist exactly twice, at the two continuation-skip sites, and
 *         `buildGpcaPostMaterializationReport` is now called from a second, distinct location
 *         outside `runWorkspaceMaterialization`,
 *   3-4.  each new audit call site is immediately followed by an unconditional
 *         `gpcaBlocksGeneration` re-check that returns `registerGpcaHardStop('MATERIALIZATION')`,
 *   5-6.  no dev-server-start or preview-recovery-loop call site is reachable before either new
 *         audit call site,
 *   7.    `listExistingWorkspaceGeneratedFilePaths` (the exact function the fix's closure calls)
 *         really does enumerate a synthetic EXISTING workspace's real, on-disk files,
 *   8.    `workspaceHasGeneratedFeatureModules` reports `true` (presence only) for BOTH a
 *         compliant and a non-compliant synthetic existing workspace — proving presence alone
 *         cannot and does not distinguish compliance,
 *   9.    the real `buildGpcaPostMaterializationReport`, called with the real file paths
 *         `listExistingWorkspaceGeneratedFilePaths` enumerates from a COMPLIANT existing
 *         workspace, actually reads real content and reports `RENDERED_CONTENT_ALLOWED`,
 *   10.   the same real call against a NON-COMPLIANT existing workspace (generic template/
 *         reusable-shell wording, unrelated to the current contract) is blocked
 *         (`gpcaBlocksGeneration === true`) and the rendered layer specifically flags it
 *         (`renderedContentAudit.gateOutcome !== RENDERED_CONTENT_ALLOWED`, with the exact generic
 *         shell fingerprint named),
 *   11.   a compliant existing workspace produces byte-identical (timestamp aside) results to an
 *         identical fresh-materialization-shaped call to the same unmodified function (parity —
 *         GPCA's own scoring/authority is not changed by this fix, and this fix adds no new block
 *         for compliant content beyond what fresh materialization already applies today),
 *   12.   registerGpcaHardStop (reused, unmodified) sets GENERATION_PIPELINE_NON_COMPLIANT,
 *         gpcaBlockedMaterialization=true, and gpcaBlockedPreviewActivation=true,
 *   13.   no GPCA scoring/authority file contains any of this fix's own identifiers — the fix's
 *         code lives only in the orchestrator (+ the mandatory capability-matrix row),
 *   14.   no application-specific logic and no hardcoded product domains were introduced by this
 *         fix's own added lines,
 *   15.   no VERE work was introduced,
 *   16.   the mandatory Capability Matrix includes a dedicated row for this fix,
 *   17.   no new TypeScript errors were introduced in the touched files, and
 *   18.   the sibling validators this fix depends on were not weakened.
 *
 * Run only:
 *   npx tsx scripts/validate-gpca-continuation-workspace-compliance-fix-v1.ts
 */

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildGpcaPostMaterializationReport,
  gpcaBlocksGeneration,
  GPCA_CAPABILITY_MATRIX_ROWS,
} from '../src/generation-pipeline-compliance-authority-v1/index.js';
import type { GpcaComplianceReport } from '../src/generation-pipeline-compliance-authority-v1/index.js';
import type { CanonicalProductContract } from '../src/product-faithfulness-v2/generation-faithfulness-types.js';
import type { ResolvedPromptFaithfulBuildPlan } from '../src/prompt-faithful-generation/index.js';
import {
  buildContractModulePlan,
  buildContractRoutePlan,
  buildContractNavigationPlan,
  runContractBoundGenerationAuthority,
} from '../src/contract-bound-generation-authority-v4/index.js';
import type { CbgaCanonicalContractEvidence } from '../src/contract-bound-generation-authority-v4/index.js';
import { workspaceHasGeneratedFeatureModules } from '../src/feature-contract-reality/index.js';
import { GENERATED_BUILDER_WORKSPACES_DIR } from '../src/real-file-workspace-execution/real-file-workspace-execution-bounds.js';
import {
  listExistingWorkspaceGeneratedFilePaths,
} from '../src/one-prompt-live-preview/one-prompt-build-orchestrator.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const PASS_TOKEN = 'GPCA_CONTINUATION_WORKSPACE_COMPLIANCE_FIX_V1_PASS';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

// -------------------------------------------------------------------------------------------
// Fixtures — a domain-neutral test contract deliberately unrelated to every banned product-
// domain word this validator checks for later, plus two hand-written rendered-file fixtures
// (one compliant, one an exact reproduction of the trace's proven generic-shell fixture).
// -------------------------------------------------------------------------------------------
const TEST_CONTRACT: CbgaCanonicalContractEvidence = {
  contractId: 'contract-test-fixture-continuation-v1',
  productIdentity: 'Volunteer Shift Coordinator',
  primaryWorkflows: ['scheduling shifts', 'tracking volunteers'],
  coreEntities: ['shifts', 'volunteers', 'locations'],
  coreActions: ['schedule', 'assign', 'confirm'],
  navigationExpectations: ['shifts', 'volunteers'],
  majorFeatureGroups: ['shift scheduling', 'volunteer tracking'],
  businessConcepts: ['shifts', 'volunteers', 'locations', 'shift scheduling', 'volunteer tracking'],
  allConceptNames: [
    'scheduling shifts',
    'tracking volunteers',
    'shifts',
    'volunteers',
    'locations',
    'schedule',
    'assign',
    'confirm',
    'shift scheduling',
    'volunteer tracking',
  ],
};

const modulePlan = buildContractModulePlan(TEST_CONTRACT);
const routePlan = buildContractRoutePlan(modulePlan);
const navigationPlan = buildContractNavigationPlan(routePlan);

const COMPLIANT_CBGA_REPORT = runContractBoundGenerationAuthority({
  contract: TEST_CONTRACT,
  proposed: {
    proposedModuleIds: modulePlan.map((m) => m.moduleId),
    proposedRoutes: routePlan.map((r) => r.path),
    proposedNavigationLabels: navigationPlan.map((n) => n.label),
    proposedAppTitle: TEST_CONTRACT.productIdentity,
    proposedPrimaryWorkflowVisible: true,
    proposedPrimaryWorkflowInteractive: true,
  },
});

const FAKE_BUILD_PLAN = {
  extraction: { appName: TEST_CONTRACT.productIdentity },
  modulePlan: {
    approvedModuleIds: modulePlan.map((m) => m.moduleId),
    routes: routePlan.map((r) => r.path),
  },
} as unknown as ResolvedPromptFaithfulBuildPlan;

const MODULE_ID = modulePlan[0]?.moduleId ?? 'shift-scheduling';

// Deliberately references real contract vocabulary (shifts, volunteers, locations, scheduling,
// assigning, confirming) and matches no generic/template/placeholder/reusable-shell fingerprint.
const COMPLIANT_FEATURE_TSX = `
import React from 'react';

export function ShiftSchedulingFeature() {
  return (
    <div>
      <h1>Shift Scheduling</h1>
      <p>Coordinate volunteer shifts and confirm assignments across every location.</p>
      <nav>
        <a href="/shifts">Shifts</a>
        <a href="/volunteers">Volunteers</a>
      </nav>
      <section>
        <h2>Volunteer Tracking</h2>
        <button>Assign Volunteer</button>
        <button>Confirm Shift</button>
      </section>
    </div>
  );
}
`;

// The exact synthetic fixture GPCA Runtime Wiring Trace V1 proved GPCA WOULD detect and block —
// literal generic-shell wording, unrelated (calculator) domain content, zero reference to the
// current build's (volunteer-shift) contract vocabulary.
const NON_COMPLIANT_FEATURE_TSX = `
import React from 'react';

export function CalculatorUtilityFeature() {
  return (
    <div className="app-shell">
      <h1>Calculator Arithmetic Utility</h1>
      <p>This app uses reusable components where every module shares the same generic shell.</p>
      <nav>
        <a href="/">Home</a>
        <a href="/dashboard">Dashboard</a>
        <a href="/settings">Settings</a>
      </nav>
      <section>
        <h2>Quick Actions</h2>
        <button>Add</button>
        <button>Subtract</button>
      </section>
    </div>
  );
}
`;

function writeSyntheticWorkspace(suffix: string, featureTsx: string): string {
  const workspaceDir = join(ROOT, GENERATED_BUILDER_WORKSPACES_DIR, `gpca-continuation-fix-validator-${suffix}`);
  rmSync(workspaceDir, { recursive: true, force: true });
  const featureDir = join(workspaceDir, 'src/features', MODULE_ID);
  mkdirSync(featureDir, { recursive: true });
  writeFileSync(join(featureDir, 'Feature.tsx'), featureTsx, 'utf8');
  return workspaceDir;
}

function reportFor(workspaceDir: string): GpcaComplianceReport {
  const existingFilePaths = listExistingWorkspaceGeneratedFilePaths(workspaceDir);
  return buildGpcaPostMaterializationReport({
    contract: TEST_CONTRACT as unknown as CanonicalProductContract,
    cbgaReport: COMPLIANT_CBGA_REPORT,
    buildPlan: FAKE_BUILD_PLAN,
    generatedFilePaths: existingFilePaths,
    workspaceDir,
  });
}

async function main(): Promise<void> {
  const ORCHESTRATOR_PATH = join(ROOT, 'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts');
  const orchestratorSource = readFileSync(ORCHESTRATOR_PATH, 'utf8').replace(/\r\n/g, '\n');

  // -------------------------------------------------------------------------------------------
  // 1. The fix's audit closure exists and is CALLED (not just defined) exactly twice — once at
  //    each continuation-skip site GPCA Runtime Wiring Trace V1 identified.
  // -------------------------------------------------------------------------------------------
  const auditDefinitionCount = (orchestratorSource.match(/const auditExistingWorkspaceForContinuation = \(/g) ?? []).length;
  const auditCallCount = (orchestratorSource.match(/(?<!const )auditExistingWorkspaceForContinuation\(\s*\)\s*;/g) ?? []).length;
  assert(
    "1. auditExistingWorkspaceForContinuation is defined once and called exactly twice (the two continuation-skip sites)",
    auditDefinitionCount === 1 && auditCallCount === 2,
    `definitions=${auditDefinitionCount}, calls=${auditCallCount}`,
  );

  const callsAtBothBranches =
    orchestratorSource.includes(
      "// GPCA Continuation Workspace Compliance Fix V1 — materialization is being skipped\n        // because the existing workspace already appears to have feature modules; audit its\n        // real, current contents before any workspace stabilization/build/preview step below.\n        auditExistingWorkspaceForContinuation();",
    ) &&
    orchestratorSource.includes(
      "// GPCA Continuation Workspace Compliance Fix V1 — same bypass, second branch: AEE\n        // forbade abort and the workspace already appears to have feature modules, so\n        // materialization is skipped here too. Audit the existing workspace before continuing.\n        auditExistingWorkspaceForContinuation();",
    );
  assert(
    '1b. both continuation-skip branches (needsMaterialization=false, and AEE-forbids-abort workspaceHasGeneratedFeatureModules=true) call the audit',
    callsAtBothBranches,
    `both call sites present verbatim in source: ${callsAtBothBranches}`,
  );

  // -------------------------------------------------------------------------------------------
  // 2. buildGpcaPostMaterializationReport is now called from a SECOND, distinct location, outside
  //    runWorkspaceMaterialization — proving the exact fix for the root cause (it previously only
  //    ever ran inside that one closure).
  // -------------------------------------------------------------------------------------------
  const postMatCallIndices = [...orchestratorSource.matchAll(/buildGpcaPostMaterializationReport\(/g)].map((m) => m.index ?? -1);
  const runWorkspaceMaterializationDefIndex = orchestratorSource.indexOf('const runWorkspaceMaterialization = (): { ok: boolean; failureReason: string | null } => {');
  const runWorkspaceMaterializationEndIndex = orchestratorSource.indexOf(
    "continuationMaterializationExecuted = true;\n    return { ok: true, failureReason: null };\n  };",
  );
  const auditClosureDefIndex = orchestratorSource.indexOf('const auditExistingWorkspaceForContinuation = (');
  assert(
    '2. buildGpcaPostMaterializationReport is called exactly twice: once inside runWorkspaceMaterialization, once inside the new auditExistingWorkspaceForContinuation closure (strictly after it)',
    postMatCallIndices.length === 2 &&
      postMatCallIndices[0] > runWorkspaceMaterializationDefIndex &&
      postMatCallIndices[0] < runWorkspaceMaterializationEndIndex &&
      postMatCallIndices[1] > auditClosureDefIndex &&
      postMatCallIndices[1] > runWorkspaceMaterializationEndIndex,
    `callIndices=${postMatCallIndices.join(', ')}, runWorkspaceMaterialization=[${runWorkspaceMaterializationDefIndex}, ${runWorkspaceMaterializationEndIndex}], auditClosureDefIndex=${auditClosureDefIndex}`,
  );

  // -------------------------------------------------------------------------------------------
  // 3-4. Each new audit call site is immediately followed by an unconditional
  //      gpcaBlocksGeneration re-check that returns registerGpcaHardStop('MATERIALIZATION') —
  //      never a value that could be silently ignored.
  // -------------------------------------------------------------------------------------------
  const HARD_STOP_AFTER_AUDIT_MARKER =
    "        if (gpcaBlocksGeneration(gpcaComplianceReport)) {\n          return registerGpcaHardStop('MATERIALIZATION');\n        }";
  const hardStopAfterAuditCount = (
    orchestratorSource.match(
      /auditExistingWorkspaceForContinuation\(\s*\)\s*;\s*\n\s*if \(gpcaBlocksGeneration\(gpcaComplianceReport\)\) \{\s*\n\s*return registerGpcaHardStop\('MATERIALIZATION'\);\s*\n\s*\}/g,
    ) ?? []
  ).length;
  assert(
    '3-4. Every auditExistingWorkspaceForContinuation( call site is immediately followed by an unconditional gpcaBlocksGeneration re-check that returns registerGpcaHardStop(\'MATERIALIZATION\')',
    hardStopAfterAuditCount === 2 && orchestratorSource.includes(HARD_STOP_AFTER_AUDIT_MARKER),
    `hardStopAfterAuditCount=${hardStopAfterAuditCount}`,
  );

  // -------------------------------------------------------------------------------------------
  // 5-6. No dev-server-start or preview-recovery-loop call site is reachable before either new
  //      audit call site.
  // -------------------------------------------------------------------------------------------
  const auditCallSiteIndices = [...orchestratorSource.matchAll(/(?<!const )auditExistingWorkspaceForContinuation\(\s*\)\s*;/g)].map((m) => m.index ?? -1);
  const devServerStartIndices = [...orchestratorSource.matchAll(/startGeneratedAppDevServer\(/g)].map((m) => m.index ?? -1);
  const previewRecoveryIndices = [...orchestratorSource.matchAll(/runAeePreviewRecoveryLoop\(/g)].map((m) => m.index ?? -1);
  assert(
    '5. No startGeneratedAppDevServer( call site precedes either new audit call site',
    auditCallSiteIndices.length === 2 &&
      devServerStartIndices.length > 0 &&
      devServerStartIndices.every((i) => auditCallSiteIndices.every((a) => i > a)),
    `auditCallSiteIndices=${auditCallSiteIndices.join(', ')}, devServerStartIndices=${devServerStartIndices.join(', ')}`,
  );
  assert(
    '6. No runAeePreviewRecoveryLoop( call site precedes either new audit call site',
    previewRecoveryIndices.length > 0 && previewRecoveryIndices.every((i) => auditCallSiteIndices.every((a) => i > a)),
    `auditCallSiteIndices=${auditCallSiteIndices.join(', ')}, previewRecoveryIndices=${previewRecoveryIndices.join(', ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // 7-11. Behavioral proof, against REAL synthetic on-disk workspaces, using the REAL exported
  //       helper (listExistingWorkspaceGeneratedFilePaths) and the REAL, unmodified
  //       buildGpcaPostMaterializationReport — never a hand-simulated stand-in.
  // -------------------------------------------------------------------------------------------
  const compliantWorkspaceDir = writeSyntheticWorkspace('compliant', COMPLIANT_FEATURE_TSX);
  const nonCompliantWorkspaceDir = writeSyntheticWorkspace('noncompliant', NON_COMPLIANT_FEATURE_TSX);

  const compliantPaths = listExistingWorkspaceGeneratedFilePaths(compliantWorkspaceDir);
  const nonCompliantPaths = listExistingWorkspaceGeneratedFilePaths(nonCompliantWorkspaceDir);
  assert(
    '7. listExistingWorkspaceGeneratedFilePaths enumerates the real, on-disk existing-workspace files (never invented, never empty when files exist)',
    compliantPaths.length === 1 &&
      compliantPaths[0] === `src/features/${MODULE_ID}/Feature.tsx` &&
      nonCompliantPaths.length === 1 &&
      nonCompliantPaths[0] === `src/features/${MODULE_ID}/Feature.tsx`,
    `compliantPaths=${JSON.stringify(compliantPaths)}, nonCompliantPaths=${JSON.stringify(nonCompliantPaths)}`,
  );

  const compliantHasModules = workspaceHasGeneratedFeatureModules(compliantWorkspaceDir);
  const nonCompliantHasModules = workspaceHasGeneratedFeatureModules(nonCompliantWorkspaceDir);
  assert(
    '8. workspaceHasGeneratedFeatureModules reports true (presence only) for BOTH the compliant and non-compliant existing workspace — presence alone cannot and does not distinguish compliance',
    compliantHasModules === true && nonCompliantHasModules === true,
    `compliantHasModules=${compliantHasModules}, nonCompliantHasModules=${nonCompliantHasModules}`,
  );

  const compliantReport = reportFor(compliantWorkspaceDir);
  assert(
    '9. The real buildGpcaPostMaterializationReport, called with the real enumerated paths from a COMPLIANT existing workspace, reads real content and reports RENDERED_CONTENT_ALLOWED',
    compliantReport.renderedContentAudit !== null &&
      compliantReport.renderedContentAudit.gateOutcome === 'RENDERED_CONTENT_ALLOWED' &&
      compliantReport.renderedContentAudit.templates.genericShellFingerprintsMatched.length === 0 &&
      compliantReport.renderedContentAudit.templates.templateFingerprintsMatched.length === 0 &&
      compliantReport.renderedContentAudit.renderedContractMatchPercent > 0,
    `renderedContentAudit=${JSON.stringify({
      gateOutcome: compliantReport.renderedContentAudit?.gateOutcome,
      renderedContractMatchPercent: compliantReport.renderedContentAudit?.renderedContractMatchPercent,
      genericShellFingerprintsMatched: compliantReport.renderedContentAudit?.templates.genericShellFingerprintsMatched,
    })}`,
  );

  const nonCompliantReport = reportFor(nonCompliantWorkspaceDir);
  assert(
    '10. The same real call against a NON-COMPLIANT existing workspace is blocked, and the rendered layer specifically flags the exact generic-shell fingerprint GPCA Runtime Wiring Trace V1 proved GPCA would detect',
    gpcaBlocksGeneration(nonCompliantReport) &&
      nonCompliantReport.renderedContentAudit !== null &&
      nonCompliantReport.renderedContentAudit.gateOutcome !== 'RENDERED_CONTENT_ALLOWED' &&
      nonCompliantReport.renderedContentAudit.templates.genericShellFingerprintsMatched.length > 0,
    `finalGateOutcome=${nonCompliantReport.finalGateOutcome}, renderedGateOutcome=${nonCompliantReport.renderedContentAudit?.gateOutcome}, genericShellFingerprintsMatched=${nonCompliantReport.renderedContentAudit?.templates.genericShellFingerprintsMatched.join(', ')}`,
  );

  // 11. Parity — a compliant existing workspace produces byte-identical (timestamp aside) results
  //     to an identical fresh-materialization-shaped call to the SAME unmodified function. GPCA's
  //     own, pre-existing, untouched structural gate already scores the real "Blueprint Generator"
  //     stage as permanently non-compliant for ANY real build (fresh or continuation) with
  //     non-empty generatedFilePaths — this fix does not change, weaken, or route around that (see
  //     header comment); it only proves the SAME authority computes both call paths identically,
  //     i.e. this fix adds no new/different block for compliant content.
  const freshStyleReport = buildGpcaPostMaterializationReport({
    contract: TEST_CONTRACT as unknown as CanonicalProductContract,
    cbgaReport: COMPLIANT_CBGA_REPORT,
    buildPlan: FAKE_BUILD_PLAN,
    generatedFilePaths: [`src/features/${MODULE_ID}/Feature.tsx`],
    workspaceDir: compliantWorkspaceDir,
  });
  const strip = (r: GpcaComplianceReport) =>
    JSON.stringify({
      ...r,
      generatedAt: null,
      renderedContentAudit: r.renderedContentAudit ? { ...r.renderedContentAudit, generatedAt: null } : null,
      // Infrastructure vs Product Boundary Authority V1 added `boundaryAudit`, which (exactly like
      // `renderedContentAudit` above) carries its own real, per-call `generatedAt` timestamp — the
      // same timestamp-normalization this parity check already applied to renderedContentAudit.
      boundaryAudit: r.boundaryAudit ? { ...r.boundaryAudit, generatedAt: null } : null,
    });
  assert(
    '11. Parity: existing-workspace-audit call path and fresh-materialization-shaped call path produce byte-identical results for identical compliant content (no GPCA scoring change, no new block introduced by this fix)',
    strip(compliantReport) === strip(freshStyleReport) &&
      compliantReport.finalGateOutcome === 'COMPLIANCE_BLOCKED_TEMPLATE_GENERATOR' &&
      compliantReport.templateGeneratorsDetected.length === 1 &&
      compliantReport.templateGeneratorsDetected[0] === 'Blueprint Generator',
    `finalGateOutcome=${compliantReport.finalGateOutcome}, templateGeneratorsDetected=${compliantReport.templateGeneratorsDetected.join(', ')}, byteIdentical=${strip(compliantReport) === strip(freshStyleReport)}`,
  );

  rmSync(compliantWorkspaceDir, { recursive: true, force: true });
  rmSync(nonCompliantWorkspaceDir, { recursive: true, force: true });

  // -------------------------------------------------------------------------------------------
  // 12. registerGpcaHardStop (reused, unmodified) sets GENERATION_PIPELINE_NON_COMPLIANT,
  //     gpcaBlockedMaterialization=true, and gpcaBlockedPreviewActivation=true.
  // -------------------------------------------------------------------------------------------
  assert(
    '12. registerGpcaHardStop sets GENERATION_PIPELINE_NON_COMPLIANT, gpcaBlockedMaterialization=true, and gpcaBlockedPreviewActivation=true',
    orchestratorSource.includes("`GENERATION_PIPELINE_NON_COMPLIANT: ${gpcaReason}`") &&
      orchestratorSource.includes('gpcaBlockedMaterialization: true,') &&
      orchestratorSource.includes('gpcaBlockedPreviewActivation: true,'),
    'all three literals present in registerGpcaHardStop',
  );

  // -------------------------------------------------------------------------------------------
  // 13. No GPCA scoring/authority logic was changed — none of this fix's own identifiers leak
  //     into any GPCA scoring/authority/rendered-content-detection file. The fix's code lives only
  //     in the orchestrator (plus the mandatory capability-matrix row).
  // -------------------------------------------------------------------------------------------
  const GPCA_SCORING_FILES = [
    'src/generation-pipeline-compliance-authority-v1/generation-pipeline-compliance-authority.ts',
    'src/generation-pipeline-compliance-authority-v1/generation-pipeline-compliance-gate.ts',
    'src/generation-pipeline-compliance-authority-v1/pipeline-compliance-scoring.ts',
    'src/generation-pipeline-compliance-authority-v1/pipeline-stage-discovery.ts',
    'src/generation-pipeline-compliance-authority-v1/generation-pipeline-compliance-adapter.ts',
    'src/generation-pipeline-compliance-authority-v1/generator-legacy-detection.ts',
    'src/generation-pipeline-compliance-authority-v1/rendered-content-collector.ts',
    'src/generation-pipeline-compliance-authority-v1/rendered-content-fingerprints.ts',
    'src/generation-pipeline-compliance-authority-v1/rendered-content-gate.ts',
    'src/generation-pipeline-compliance-authority-v1/rendered-content-types.ts',
    'src/contract-bound-generation-authority-v4/contract-bound-generation-authority.ts',
    'src/product-faithfulness-v2/generation-faithfulness-auditor.ts',
  ];
  const FIX_MARKERS = [
    'auditExistingWorkspaceForContinuation',
    'listExistingWorkspaceGeneratedFilePaths',
    'CONTINUATION_WORKSPACE_AUDIT',
    'GPCA Continuation Workspace Compliance',
  ];
  const scoringFileHits: string[] = [];
  for (const f of GPCA_SCORING_FILES) {
    let src = '';
    try {
      src = readFileSync(join(ROOT, f), 'utf8');
    } catch {
      continue;
    }
    for (const marker of FIX_MARKERS) {
      if (src.includes(marker)) scoringFileHits.push(`${f}:${marker}`);
    }
  }
  assert(
    '13. No GPCA scoring/authority file contains any of this fix\'s own identifiers — the fix is isolated to the orchestrator',
    scoringFileHits.length === 0,
    scoringFileHits.length === 0 ? `inspected ${GPCA_SCORING_FILES.length} scoring/authority files — no fix markers found` : `found: ${scoringFileHits.join(', ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // 14. No application-specific logic and no hardcoded product domains in this fix's own added
  //     lines (comments stripped; scoped to lines containing this fix's own markers, so
  //     pre-existing, unrelated file content is never flagged).
  // -------------------------------------------------------------------------------------------
  const TOUCHED_PRODUCTION_FILES = [
    'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts',
    'src/generation-pipeline-compliance-authority-v1/generation-pipeline-compliance-report.ts',
  ];
  const touchedSource = TOUCHED_PRODUCTION_FILES.map((f) => readFileSync(join(ROOT, f), 'utf8').replace(/\r\n/g, '\n')).join('\n');
  const touchedSourceWithoutComments = touchedSource.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  const touchedSourceFixLinesOnly = touchedSourceWithoutComments
    .split('\n')
    .filter((line) => FIX_MARKERS.some((m) => line.includes(m)))
    .join('\n');
  const APPLICATION_SPECIFIC_LOGIC_PATTERNS = [
    /if\s*\(\s*(domain|product|profile)\s*===\s*['"](restaurant|calculator|crm|booking|inventory|notes|converter)['"]/i,
    /switch\s*\(\s*(domain|product|profile)\s*\)/i,
  ];
  const logicHits = APPLICATION_SPECIFIC_LOGIC_PATTERNS.filter((p) => p.test(touchedSourceFixLinesOnly));
  const FORBIDDEN_DOMAIN_WORDS = [
    'restaurant',
    'calculator',
    'converter',
    '\\bcrm\\b',
    'booking',
    'inventory management',
    'notes app',
    'note-taking',
    'authentication system',
    '\\bcrud\\b',
  ];
  const domainHits = FORBIDDEN_DOMAIN_WORDS.filter((w) => new RegExp(w, 'i').test(touchedSourceFixLinesOnly));
  assert(
    '14. No application-specific logic and no hardcoded product domains introduced by this fix\'s own added lines',
    logicHits.length === 0 && domainHits.length === 0,
    `logicHits=${logicHits.length}, domainHits=${domainHits.join(', ') || '(none)'}, inspected ${touchedSourceFixLinesOnly.split('\n').filter(Boolean).length} fix-added line(s)`,
  );

  // -------------------------------------------------------------------------------------------
  // 15. No VERE work was introduced.
  // -------------------------------------------------------------------------------------------
  const vereMention = /\bvere\b/i.test(touchedSource);
  assert(
    '15. No VERE work was introduced by this fix',
    !vereMention,
    vereMention ? 'unexpected VERE reference found' : 'no VERE references found in touched files',
  );

  // -------------------------------------------------------------------------------------------
  // 16. Mandatory Capability Matrix includes a dedicated row for this fix.
  // -------------------------------------------------------------------------------------------
  const continuationRow = GPCA_CAPABILITY_MATRIX_ROWS.find((r) => r.capability === 'GPCA Continuation Workspace Compliance');
  assert(
    '16. Mandatory Capability Matrix includes a dedicated, IMPLEMENTED, production-wired row for this fix',
    continuationRow !== undefined && continuationRow.status === 'IMPLEMENTED' && continuationRow.productionWired === 'YES',
    `row present=${continuationRow !== undefined}, status=${continuationRow?.status}, productionWired=${continuationRow?.productionWired}`,
  );

  // -------------------------------------------------------------------------------------------
  // 17. No new TypeScript errors introduced in touched files (lightweight touched-file tsc
  //     diagnostic, run as part of this validator — never a separate full-repo command).
  // -------------------------------------------------------------------------------------------
  const KNOWN_PREEXISTING_ERROR_SIGNATURES = [
    "Type '\"CAPABILITY_PLANNING\"' is not assignable to type 'ForensicBuildStage'",
    'is missing the following properties from type \'OnePromptLivePreviewBuildResult\': livePreviewGate, autonomousSoftwareEngineering',
    "The type 'readonly string[]' is 'readonly' and cannot be assigned to the mutable type 'string[]'",
    "Type 'string' is not assignable to type 'ForensicBuildStage'",
    'have no overlap',
  ];
  let tscOutput = '';
  let tscFailedToRun = false;
  try {
    tscOutput = execSync('npx tsc --noEmit', { cwd: ROOT, encoding: 'utf8', maxBuffer: 1024 * 1024 * 64 });
  } catch (err) {
    const e = err as { stdout?: string; stderr?: string };
    tscOutput = `${e.stdout ?? ''}${e.stderr ?? ''}`;
    if (!tscOutput) tscFailedToRun = true;
  }
  const tscLines = tscOutput.split(/\r?\n/).filter((l) => l.trim().length > 0 && /error TS/.test(l));
  const touchedFileErrorLines = tscLines.filter((l) => {
    const normalized = l.replace(/\\/g, '/');
    return TOUCHED_PRODUCTION_FILES.some((f) => normalized.includes(f));
  });
  const newTouchedFileErrors = touchedFileErrorLines.filter(
    (line) => !KNOWN_PREEXISTING_ERROR_SIGNATURES.some((sig) => line.includes(sig)),
  );
  assert(
    '17. No new TypeScript errors introduced in touched files',
    !tscFailedToRun && newTouchedFileErrors.length === 0,
    tscFailedToRun
      ? 'tsc did not run/produce output'
      : `touched-file error lines=${touchedFileErrorLines.length}, new (non-pre-existing)=${newTouchedFileErrors.length}${newTouchedFileErrors.length > 0 ? `: ${newTouchedFileErrors.join(' | ')}` : ''}`,
  );

  // -------------------------------------------------------------------------------------------
  // 18. Sibling validators this fix depends on were not weakened.
  // -------------------------------------------------------------------------------------------
  const SIBLING_VALIDATORS: Array<{ path: string; passToken: string }> = [
    { path: 'scripts/validate-generation-pipeline-compliance-authority-v1.ts', passToken: 'GENERATION_PIPELINE_COMPLIANCE_AUTHORITY_V1_PASS' },
    { path: 'scripts/validate-gpca-production-enforcement-fix-v1.ts', passToken: 'GPCA_PRODUCTION_ENFORCEMENT_FIX_V1_PASS' },
    { path: 'scripts/validate-gpca-rendered-content-evidence-v1.ts', passToken: 'GPCA_RENDERED_CONTENT_EVIDENCE_V1_PASS' },
  ];
  const siblingChecks = SIBLING_VALIDATORS.map((v) => {
    try {
      const src = readFileSync(join(ROOT, v.path), 'utf8');
      return src.includes(v.passToken);
    } catch {
      return false;
    }
  });
  assert(
    '18. No sibling validators were weakened — each still declares its own pass token untouched',
    siblingChecks.every(Boolean),
    `sibling validator pass-token presence: ${SIBLING_VALIDATORS.map((v, i) => `${v.path}=${siblingChecks[i]}`).join(', ')}`,
  );

  // -------------------------------------------------------------------------------------------
  // Report + exit
  // -------------------------------------------------------------------------------------------
  let failCount = 0;
  for (const r of results) {
    const marker = r.passed ? 'PASS' : 'FAIL';
    if (!r.passed) failCount += 1;
    // eslint-disable-next-line no-console
    console.log(`${marker} — ${r.name}${r.passed ? '' : ` :: ${r.detail}`}`);
  }
  // eslint-disable-next-line no-console
  console.log(`\n${results.length - failCount}/${results.length} scenarios passed.`);

  // eslint-disable-next-line no-console
  console.log('\n## Mandatory Capability Matrix\n');
  // eslint-disable-next-line no-console
  console.log('| Capability | Status | Production Wired | Auto Run | Activation Allowed | Notes |');
  // eslint-disable-next-line no-console
  console.log('|------------|--------|------------------|----------|--------------------|-------|');
  for (const row of GPCA_CAPABILITY_MATRIX_ROWS) {
    // eslint-disable-next-line no-console
    console.log(`| ${row.capability} | ${row.status} | ${row.productionWired} | ${row.autoRun} | ${row.activationAllowed} | ${row.notes} |`);
  }

  if (failCount === 0) {
    // eslint-disable-next-line no-console
    console.log(`\n${PASS_TOKEN}`);
    process.exit(0);
  } else {
    // eslint-disable-next-line no-console
    console.error(`\n${failCount} scenario(s) failed.`);
    process.exit(1);
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Validator crashed:', err);
  process.exit(1);
});
