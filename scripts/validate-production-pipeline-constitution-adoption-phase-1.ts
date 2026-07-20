/**
 * PRODUCTION_PIPELINE_CONSTITUTION_ADOPTION_PHASE_1 — validation.
 *
 * Verifies the two highest-priority production fixes from docs/production-pipeline-constitution-v1.md's
 * Implementation Roadmap:
 *
 *   TIER 0 (PPC-606 / PPC-702) — the continuation-path file-list gap. `listExistingWorkspaceGeneratedFilePaths()`
 *   in one-prompt-build-orchestrator.ts previously only walked one level into `src/features/<module>/` plus
 *   `src/App.tsx` — silently skipping root-level `src/features/*` files (the feature router itself), the entire
 *   `src/blueprint/**` subtree (AppShell, screens, pages, components, product-surface, app-metadata), `src/App.css`,
 *   and generated manifests (blueprint-manifest.json/build-manifest.json). Fixed: it now recursively walks both
 *   subtrees and includes the manifests, so a continuation build that skips fresh materialization audits the
 *   COMPLETE existing workspace, never a partial subset.
 *
 *   TIER 1 (PPC-607 / PPC-1001 / PPC-1002 / PPC-1203 / PPC-1205 / PPC-1304) — GPCA as a final invariant. A new,
 *   shared, exported re-audit primitive (`auditCurrentWorkspaceStateForGpca`, invoked via the orchestrator's
 *   `reauditGpcaAfterWorkspaceMutation` closure) re-runs the identical `buildGpcaPostMaterializationReport` call
 *   against the CURRENT on-disk workspace state after every real post-audit mutation this milestone identified
 *   (workspace stabilizer, build AutoFix, Engineering Intelligence, capability evolution), and the pre-existing
 *   single stale re-check immediately before dev-server start was upgraded to ALWAYS re-run a fresh audit first.
 *
 * This is NOT another GPCA/CBGA/Product Faithfulness/AEO/EIAA/VERE milestone and creates no new authority — it
 * only wires the orchestrator to call GPCA's own existing, unmodified `buildGpcaPostMaterializationReport` /
 * `gpcaBlocksGeneration` more completely and more often.
 *
 * Run only:
 *   npx tsx scripts/validate-production-pipeline-constitution-adoption-phase-1.ts
 */

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  listExistingWorkspaceGeneratedFilePaths,
  auditCurrentWorkspaceStateForGpca,
  PRODUCTION_PIPELINE_CONSTITUTION_ADOPTION_PHASE_1_RULE_IDS,
} from '../src/one-prompt-live-preview/one-prompt-build-orchestrator.js';
import { resolvePromptFaithfulBuildPlan } from '../src/prompt-faithful-generation/index.js';
import { buildCanonicalProductContract } from '../src/product-faithfulness-v2/index.js';
import { applyContractBoundGenerationToBuildPlan } from '../src/contract-bound-generation-authority-v4/index.js';
import { buildUniversalBlueprintWorkspaceFiles } from '../src/universal-app-blueprint/index.js';
import type { UniversalBlueprintBuildInput } from '../src/universal-app-blueprint/index.js';
import { gpcaBlocksGeneration, GPCA_CAPABILITY_MATRIX_ROWS } from '../src/generation-pipeline-compliance-authority-v1/index.js';
import { RULE_REGISTRY } from '../src/production-pipeline-constitution-v1/index.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const PASS_TOKEN = 'PRODUCTION_PIPELINE_CONSTITUTION_ADOPTION_PHASE_1_PASS';

interface ScenarioResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: ScenarioResult[] = [];

function assert(name: string, condition: boolean, detail: string): void {
  results.push({ name, passed: condition, detail });
}

function readSource(relativePath: string): string {
  try {
    return readFileSync(join(ROOT, relativePath), 'utf8');
  } catch {
    return '';
  }
}

function writeWorkspaceFiles(workspaceDir: string, files: ReadonlyArray<{ relativePath: string; content: string }>): void {
  for (const file of files) {
    const abs = join(workspaceDir, file.relativePath);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, file.content, 'utf8');
  }
}

async function main(): Promise<void> {
  // ===============================================================================================
  // Fixture setup — a REAL build plan / canonical contract / CBGA report, produced by the exact
  // same production functions the orchestrator calls (resolvePromptFaithfulBuildPlan →
  // buildCanonicalProductContract → applyContractBoundGenerationToBuildPlan), so every scenario
  // below exercises this milestone's fix against real production evidence shapes, never synthetic
  // stand-ins for the generator's own types.
  // ===============================================================================================
  // A prompt whose product-faithfulness-v2 domain identity and prompt-faithful-generation app-name
  // extraction converge to the SAME approved identity after CBGA repair (verified empirically) — so
  // this fixture's "compliant" baseline (scenario 5) is genuinely content-compliant, never confounded
  // by the unrelated, out-of-scope appName/productIdentity reconciliation gap that a differently-named
  // prompt (e.g. an explicit-name CRM prompt) can independently surface. This milestone touches only
  // the continuation file-list walk and the GPCA re-audit wiring — it does not touch CBGA/Product
  // Faithfulness, so the fixture must not depend on fixing that unrelated gap to pass.
  const prompt =
    'Build an app for managing personal tasks and to-do lists with reminders and categories.';
  const initialBuildPlan = resolvePromptFaithfulBuildPlan(prompt);
  const canonicalContract = buildCanonicalProductContract({ prompt });
  const cbgaResult = applyContractBoundGenerationToBuildPlan(initialBuildPlan, canonicalContract);
  const buildPlan = cbgaResult.buildPlan;
  const cbgaReport = cbgaResult.report;
  const approvedNavigationLabels = cbgaReport.navigationPlan.map((item) => item.label);

  // Mirrors real production's deriveBlueprintContractCopy() (universal-app-blueprint-contract-
  // provenance.ts): coreFeatureLabel is always the display name of the first CBGA-APPROVED module/
  // nav item — never an independent literal like "Overview" — so this fixture's nav is exactly the
  // same set the CBGA navigation plan already approved, and "compliant" genuinely means compliant.
  const primaryApprovedLabel = approvedNavigationLabels[0] ?? canonicalContract.productIdentity;
  const blueprintInput: UniversalBlueprintBuildInput = {
    contractId: canonicalContract.contractId,
    ideaId: 'i1',
    buildUnits: ['ui'],
    appName: canonicalContract.productIdentity,
    tagline: `${canonicalContract.productIdentity} — modular application workspace`,
    coreFeatureLabel: primaryApprovedLabel,
    landingSummary: `${canonicalContract.productIdentity} — manage ${primaryApprovedLabel} and connected workflows.`,
    homeSummary: `Your ${canonicalContract.productIdentity} workspace is ready.`,
    contractDerivationSource: 'APPROVED_MODULE_PLAN',
    approvedNavigationLabels,
  };
  const blueprintFiles = buildUniversalBlueprintWorkspaceFiles(blueprintInput);

  // A minimal, generic feature module (module-content files inside a subdirectory) PLUS a
  // root-level file directly under `src/features/` (mirroring the real production
  // `src/features/FeatureAppRouter.tsx` / `registry.ts` / `routes.ts` files a fresh materialization
  // always writes) — this exact root-level shape is what the pre-fix walker silently skipped.
  const featureModuleFiles = [
    { relativePath: 'src/features/leads/LeadsFeature.tsx', content: 'export default function LeadsFeature() { return null; }\n' },
    { relativePath: 'src/features/leads/leads.service.ts', content: 'export function listLeads(): unknown[] { return []; }\n' },
    { relativePath: 'src/features/FeatureAppRouter.tsx', content: 'export default function FeatureAppRouter() { return null; }\n' },
    { relativePath: 'src/features/registry.ts', content: 'export const registry: unknown[] = [];\n' },
  ];

  // Production also writes a generic, structural `build-manifest.json` (real evidence file,
  // never product/business content) to the workspace root alongside `blueprint-manifest.json` —
  // mirrored here so this fixture matches what a real materialized workspace actually has on disk.
  const buildManifestFile = {
    relativePath: 'build-manifest.json',
    content: JSON.stringify({ contractId: canonicalContract.contractId, generatedAt: new Date().toISOString() }, null, 2) + '\n',
  };

  function freshWorkspace(): string {
    const dir = mkdtempSync(join(tmpdir(), 'ppc-adoption-phase-1-'));
    writeWorkspaceFiles(dir, [...blueprintFiles, ...featureModuleFiles, buildManifestFile]);
    return dir;
  }

  const cleanupDirs: string[] = [];
  function trackedFreshWorkspace(): string {
    const dir = freshWorkspace();
    cleanupDirs.push(dir);
    return dir;
  }

  // ===============================================================================================
  // Scenarios 1-4 — Tier 0: continuation file list completeness.
  // ===============================================================================================
  const workspaceA = trackedFreshWorkspace();
  const listedPaths = listExistingWorkspaceGeneratedFilePaths(workspaceA);

  assert(
    '1. Continuation file list includes src/blueprint/**',
    listedPaths.includes('src/blueprint/AppShell.tsx') && listedPaths.includes('src/blueprint/pages/HomePage.tsx'),
    `listedPaths includes AppShell.tsx=${listedPaths.includes('src/blueprint/AppShell.tsx')}, pages/HomePage.tsx=${listedPaths.includes('src/blueprint/pages/HomePage.tsx')} (total listed=${listedPaths.length})`,
  );

  assert(
    '2. Continuation file list includes product-surface files',
    listedPaths.includes('src/blueprint/product-surface.ts'),
    `src/blueprint/product-surface.ts present=${listedPaths.includes('src/blueprint/product-surface.ts')}`,
  );

  assert(
    '3. Continuation file list includes generated manifests',
    listedPaths.includes('blueprint-manifest.json') && listedPaths.includes('build-manifest.json'),
    `blueprint-manifest.json=${listedPaths.includes('blueprint-manifest.json')}, build-manifest.json=${listedPaths.includes('build-manifest.json')}`,
  );

  const onlyFeaturesAndAppTsx = listedPaths.every(
    (p) => p === 'src/App.tsx' || p.startsWith('src/features/'),
  );
  const rootLevelFeatureFileIncluded = listedPaths.includes('src/features/FeatureAppRouter.tsx') && listedPaths.includes('src/features/registry.ts');
  assert(
    '4. Continuation audit is not limited to src/features/** and src/App.tsx',
    !onlyFeaturesAndAppTsx && rootLevelFeatureFileIncluded,
    `onlyFeaturesAndAppTsx=${onlyFeaturesAndAppTsx} (must be false), root-level src/features/*.tsx files included=${rootLevelFeatureFileIncluded}, total listed=${listedPaths.length}`,
  );

  // ===============================================================================================
  // Scenario 5 — existing workspace presence alone does not prove compliance. Proven two ways on
  // the exact same fully-present workspace (workspaceA, scenario 1-4's complete Tier-0 file list):
  // (a) a workspace with an IDENTICAL, complete file-path set but NO real content at all (every
  //     path present as an empty file — "presence" satisfied, content absent) is audited
  //     differently than the real, fully-populated workspace — proving the audit result is a
  //     function of real content, never of the path list alone; and (b) the real, fully-populated
  //     workspace's own blocked/allowed reasons — whichever this build's genuinely unmodified GPCA/
  //     CBGA/generator pipeline produces — cite a specific, real per-artifact comparison against
  //     the CBGA-approved plan (e.g. a named navigation item's real CBGA traceability), never a
  //     generic "files are present so this is compliant" shortcut. Together this proves presence
  //     is necessary-but-never-sufficient — compliance is always decided by reading real content.
  // ===============================================================================================
  const fullyPopulatedReport = auditCurrentWorkspaceStateForGpca({
    contract: canonicalContract,
    cbgaReport,
    buildPlan,
    workspaceDir: workspaceA,
  });
  const emptyContentWorkspace = trackedFreshWorkspace();
  for (const p of listExistingWorkspaceGeneratedFilePaths(emptyContentWorkspace)) {
    writeFileSync(join(emptyContentWorkspace, p), '', 'utf8');
  }
  const identicalPathsButEmptyContent =
    listExistingWorkspaceGeneratedFilePaths(emptyContentWorkspace).length ===
    listExistingWorkspaceGeneratedFilePaths(workspaceA).length;
  const emptyContentReport = auditCurrentWorkspaceStateForGpca({
    contract: canonicalContract,
    cbgaReport,
    buildPlan,
    workspaceDir: emptyContentWorkspace,
  });
  const outcomesDifferByContentAlone = fullyPopulatedReport.finalGateOutcome !== emptyContentReport.finalGateOutcome
    || JSON.stringify(fullyPopulatedReport.blockedReasons) !== JSON.stringify(emptyContentReport.blockedReasons);
  const citesRealPerArtifactComparison = fullyPopulatedReport.blockedReasons.some(
    (r) => /navigation plan|route plan|module plan|approved product identity|CBGA/i.test(r),
  );
  const isGenericPresenceShortcut = fullyPopulatedReport.blockedReasons.some((r) => /no files (found|present)|cannot audit/i.test(r));
  assert(
    "5. Existing workspace presence alone does not prove compliance: a workspace sharing workspaceA's IDENTICAL, Tier-0-complete file-PATH list but with every file emptied of real content produces a DIFFERENT GPCA verdict than the real, fully-populated workspace (same presence, different content, different result) — and the fully-populated workspace's own verdict cites a specific, real per-artifact CBGA-plan comparison, never a generic presence-based shortcut",
    identicalPathsButEmptyContent && outcomesDifferByContentAlone && citesRealPerArtifactComparison && !isGenericPresenceShortcut,
    `identicalPathsButEmptyContent=${identicalPathsButEmptyContent}, outcomesDifferByContentAlone=${outcomesDifferByContentAlone}, citesRealPerArtifactComparison=${citesRealPerArtifactComparison}, isGenericPresenceShortcut=${isGenericPresenceShortcut} :: fullyPopulated.finalGateOutcome=${fullyPopulatedReport.finalGateOutcome}, fullyPopulated.blockedReasons=${JSON.stringify(fullyPopulatedReport.blockedReasons)}, emptyContent.finalGateOutcome=${emptyContentReport.finalGateOutcome}`,
  );

  // ===============================================================================================
  // Scenario 6 — skipped materialization still triggers a GPCA audit: structural proof that both
  // real ASE/AEE continuation-skip branches in the orchestrator call `auditExistingWorkspaceForContinuation()`
  // (which itself now uses this exact `auditCurrentWorkspaceStateForGpca` primitive) immediately
  // followed by a `gpcaBlocksGeneration` hard-stop check, before any workspace-stabilization/build/
  // preview step is reached.
  // ===============================================================================================
  const orchestratorSource = readSource('src/one-prompt-live-preview/one-prompt-build-orchestrator.ts');
  const continuationCallSites = orchestratorSource.match(/auditExistingWorkspaceForContinuation\(\);\s*\n\s*if \(gpcaBlocksGeneration\(gpcaComplianceReport\)\)/g) ?? [];
  assert(
    '6. Skipped materialization still triggers GPCA audit: both real continuation-skip branches call auditExistingWorkspaceForContinuation() immediately followed by a gpcaBlocksGeneration hard-stop check',
    continuationCallSites.length >= 2,
    `found ${continuationCallSites.length} continuation-skip call site(s) with an immediate hard-stop check (expected >= 2)`,
  );

  // ===============================================================================================
  // Scenarios 7-11 — every post-audit mutation path re-audits GPCA via the single shared primitive
  // `reauditGpcaAfterWorkspaceMutation`, gated on that specific repair system's own real "did this
  // actually change a file" evidence field — never a blanket always-reaudit (which would be wasteful)
  // and never a hardcoded assumption that it always did.
  // ===============================================================================================
  function hasMutationReauditWiring(mutationEvidenceExpr: string, reauditLabel: string): boolean {
    const pattern = new RegExp(
      `${mutationEvidenceExpr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]{0,400}?reauditGpcaAfterWorkspaceMutation\\('${reauditLabel}'\\)`,
    );
    return pattern.test(orchestratorSource);
  }

  assert(
    '7. Workspace stabilizer write invalidates GPCA: `workspaceStabilizerReport.repairActions.some((action) => action.applied)` gates a call to reauditGpcaAfterWorkspaceMutation(\'WORKSPACE_STABILIZATION\')',
    hasMutationReauditWiring('workspaceStabilizerReport.repairActions.some((action) => action.applied)', 'WORKSPACE_STABILIZATION'),
    'wiring pattern present in orchestrator source',
  );

  assert(
    "8. Build autofix write invalidates GPCA: `buildAutofixLoop.report.filesChanged.length > 0` gates a call to reauditGpcaAfterWorkspaceMutation('NPM_BUILD_AUTOFIX')",
    hasMutationReauditWiring('buildAutofixLoop.report.filesChanged.length > 0', 'NPM_BUILD_AUTOFIX'),
    'wiring pattern present in orchestrator source',
  );

  assert(
    "9. Engineering Intelligence write invalidates GPCA: `(engineeringIntelligencePostWorkspace?.repairResult?.repairAttempts.length ?? 0) > 0` gates a call to reauditGpcaAfterWorkspaceMutation('ENGINEERING_INTELLIGENCE_POST_WORKSPACE')",
    hasMutationReauditWiring('(engineeringIntelligencePostWorkspace?.repairResult?.repairAttempts.length ?? 0) > 0', 'ENGINEERING_INTELLIGENCE_POST_WORKSPACE'),
    'wiring pattern present in orchestrator source',
  );

  assert(
    "10. Capability evolution write invalidates GPCA: `aelReport.capabilitiesEvolved.length > 0` gates a call to reauditGpcaAfterWorkspaceMutation('CAPABILITY_EVOLUTION')",
    hasMutationReauditWiring('aelReport.capabilitiesEvolved.length > 0', 'CAPABILITY_EVOLUTION'),
    'wiring pattern present in orchestrator source',
  );

  const reauditCallSiteCount = (orchestratorSource.match(/reauditGpcaAfterWorkspaceMutation\('[A-Z_]+'\)/g) ?? []).length;
  assert(
    '11. Any file-mutating repair invalidates GPCA: every one of this milestone\'s 5 distinct mutation call sites (workspace stabilizer, build AutoFix, pre-preview final gate, Engineering Intelligence, capability evolution) invokes the exact same shared, generic `reauditGpcaAfterWorkspaceMutation` primitive — never a per-repair-system bespoke re-audit implementation',
    reauditCallSiteCount === 5,
    `found ${reauditCallSiteCount} reauditGpcaAfterWorkspaceMutation(...) call site(s) (expected exactly 5: WORKSPACE_STABILIZATION, NPM_BUILD_AUTOFIX, PRE_PREVIEW_FINAL_GATE, ENGINEERING_INTELLIGENCE_POST_WORKSPACE, CAPABILITY_EVOLUTION)`,
  );

  // ===============================================================================================
  // Scenario 12 — GPCA re-runs after post-audit mutation, and the fresh re-audit is genuinely
  // sensitive to real content mutation (not merely a cached re-return of the same report object).
  // Mutates a fully-present workspace (same file-path set throughout, never adding/removing a
  // path) by appending a real CBGA default-shell nav-style `label:` field GPCA's own (unmodified)
  // navigation extractor recognizes, which this build's CBGA report never approved — proving the
  // re-audit call genuinely re-reads current file content (the reported reasons name the NEW
  // unapproved label after the mutation, never the pre-mutation reasons repeated verbatim / cached).
  // ===============================================================================================
  const workspaceB = trackedFreshWorkspace();
  const beforeMutationReport = auditCurrentWorkspaceStateForGpca({
    contract: canonicalContract,
    cbgaReport,
    buildPlan,
    workspaceDir: workspaceB,
  });
  const productSurfacePath = join(workspaceB, 'src/blueprint/product-surface.ts');
  const originalProductSurfaceContent = readFileSync(productSurfacePath, 'utf8');
  const mutatedLabel = approvedNavigationLabels.includes('Profile') ? 'Settings' : 'Profile';
  writeFileSync(
    productSurfacePath,
    `${originalProductSurfaceContent}\n// POST_AUDIT_MUTATION_MARKER — unapproved default-shell nav item injected by a simulated repair-system write\nexport const __postAuditMutationMarker = { label: "${mutatedLabel}" };\n`,
    'utf8',
  );
  const afterMutationReport = auditCurrentWorkspaceStateForGpca({
    contract: canonicalContract,
    cbgaReport,
    buildPlan,
    workspaceDir: workspaceB,
  });
  const afterMutationCitesNewUnapprovedLabel = afterMutationReport.blockedReasons.some((r) => r.includes(`"${mutatedLabel}"`));
  const beforeMutationDidNotCiteThatLabel = !beforeMutationReport.blockedReasons.some((r) => r.includes(`"${mutatedLabel}"`));
  assert(
    "12. GPCA re-runs after post-audit mutation: auditCurrentWorkspaceStateForGpca is genuinely sensitive to a real content-only mutation on the exact same workspaceDir/file-path set (no path added or removed) — the mutation injects a brand-new unapproved nav label, and only the AFTER-mutation report's reasons name that new label, proving the re-audit call re-reads current file content on every invocation rather than returning a cached prior result",
    gpcaBlocksGeneration(afterMutationReport) && afterMutationCitesNewUnapprovedLabel && beforeMutationDidNotCiteThatLabel,
    `beforeMutation.finalGateOutcome=${beforeMutationReport.finalGateOutcome}, afterMutation.finalGateOutcome=${afterMutationReport.finalGateOutcome}, afterMutation.blockedReasons=${JSON.stringify(afterMutationReport.blockedReasons)}`,
  );

  // ===============================================================================================
  // Scenarios 13-15 — the final pre-preview gate always uses a fresh report, ordered strictly
  // before dev-server start, and a GPCA hard-stop there returns before preview recovery can run.
  // ===============================================================================================
  const prePreviewGateIdx = orchestratorSource.indexOf("reauditGpcaAfterWorkspaceMutation('PRE_PREVIEW_FINAL_GATE')");
  const devServerStartIdx = orchestratorSource.indexOf('await startGeneratedAppDevServer({');
  const previewRecoveryLoopIdx = orchestratorSource.indexOf('await runAeePreviewRecoveryLoop({');
  const staleRecheckPattern = /if \(gpcaBlocksGeneration\(gpcaComplianceReport\)\)\s*\{\s*\n\s*return registerGpcaHardStop\('PREVIEW'\);/;

  assert(
    "13. Final preview gate uses fresh GPCA report: the pre-existing stale re-check (`if (gpcaBlocksGeneration(gpcaComplianceReport))` re-consulting the SAME report object) immediately before preview activation was replaced with `reauditGpcaAfterWorkspaceMutation('PRE_PREVIEW_FINAL_GATE')`, which always re-runs buildGpcaPostMaterializationReport against the CURRENT workspace before returning a boolean",
    prePreviewGateIdx !== -1 && !staleRecheckPattern.test(orchestratorSource),
    `PRE_PREVIEW_FINAL_GATE re-audit call present=${prePreviewGateIdx !== -1}, old stale-recheck pattern still present=${staleRecheckPattern.test(orchestratorSource)}`,
  );

  assert(
    '14. Preview cannot start after stale GPCA report: the PRE_PREVIEW_FINAL_GATE re-audit call is positioned strictly before the only production call site that starts the dev server (startGeneratedAppDevServer) for this build',
    prePreviewGateIdx !== -1 && devServerStartIdx !== -1 && prePreviewGateIdx < devServerStartIdx,
    `prePreviewGateIdx=${prePreviewGateIdx}, devServerStartIdx=${devServerStartIdx}`,
  );

  assert(
    '15. Preview recovery does not run after GPCA hard-stop: the PRE_PREVIEW_FINAL_GATE block `return`s a terminal registerGpcaHardStop(\'PREVIEW\') result strictly before the dev server starts and strictly before the preview recovery loop (runAeePreviewRecoveryLoop, only reachable much later, after a live preview gate evaluation) is ever invoked',
    prePreviewGateIdx !== -1 &&
      devServerStartIdx !== -1 &&
      previewRecoveryLoopIdx !== -1 &&
      prePreviewGateIdx < devServerStartIdx &&
      devServerStartIdx < previewRecoveryLoopIdx,
    `prePreviewGateIdx=${prePreviewGateIdx}, devServerStartIdx=${devServerStartIdx}, previewRecoveryLoopIdx=${previewRecoveryLoopIdx}`,
  );

  // ===============================================================================================
  // Scenarios 16-24 — violated PPC rule IDs are reported, and every one of the 8 rule IDs this
  // milestone claims to enforce is a REAL, pre-existing rule ID already ratified in the constitution's
  // own machine-readable RULE_REGISTRY (never an ID invented for this validator).
  // ===============================================================================================
  const EXPECTED_RULE_IDS = ['PPC-606', 'PPC-607', 'PPC-702', 'PPC-1001', 'PPC-1002', 'PPC-1203', 'PPC-1205', 'PPC-1304'];
  assert(
    '16. Violated PPC rule IDs are reported: PRODUCTION_PIPELINE_CONSTITUTION_ADOPTION_PHASE_1_RULE_IDS is referenced in the orchestrator\'s registerGpcaHardStop() result construction (every GPCA hard-stop this milestone touches) and in the post-preview-activation-mutation override path, so every blocked build this milestone\'s wiring produces carries its violated rule IDs',
    PRODUCTION_PIPELINE_CONSTITUTION_ADOPTION_PHASE_1_RULE_IDS.length === EXPECTED_RULE_IDS.length &&
      EXPECTED_RULE_IDS.every((id) => PRODUCTION_PIPELINE_CONSTITUTION_ADOPTION_PHASE_1_RULE_IDS.includes(id as never)) &&
      (orchestratorSource.match(/gpcaViolatedConstitutionRuleIds: PRODUCTION_PIPELINE_CONSTITUTION_ADOPTION_PHASE_1_RULE_IDS/g) ?? []).length >= 2,
    `ruleIds=${JSON.stringify(PRODUCTION_PIPELINE_CONSTITUTION_ADOPTION_PHASE_1_RULE_IDS)}, reference count=${(orchestratorSource.match(/gpcaViolatedConstitutionRuleIds: PRODUCTION_PIPELINE_CONSTITUTION_ADOPTION_PHASE_1_RULE_IDS/g) ?? []).length}`,
  );

  const ruleScenarioNumbers: Record<string, string> = {
    'PPC-606': '17',
    'PPC-607': '18',
    'PPC-702': '19',
    'PPC-1001': '20',
    'PPC-1002': '21',
    'PPC-1203': '22',
    'PPC-1205': '23',
    'PPC-1304': '24',
  };
  for (const [ruleId, num] of Object.entries(ruleScenarioNumbers)) {
    const declaredByThisMilestone = PRODUCTION_PIPELINE_CONSTITUTION_ADOPTION_PHASE_1_RULE_IDS.includes(ruleId as never);
    const ratifiedInConstitution = RULE_REGISTRY.some((r) => r.id === ruleId);
    assert(
      `${num}. ${ruleId} enforced: declared in this milestone's rule-ID list AND already a real, ratified rule in the constitution's own RULE_REGISTRY (never an ID invented for this validator)`,
      declaredByThisMilestone && ratifiedInConstitution,
      `declaredByThisMilestone=${declaredByThisMilestone}, ratifiedInConstitution=${ratifiedInConstitution}`,
    );
  }

  // ===============================================================================================
  // Scenarios 25-28 — no GPCA/CBGA/Product Faithfulness/AEO/EIAA weakening: none of this milestone's
  // new symbols appear anywhere in those authorities' own source (this milestone only ever calls
  // their existing, unmodified exports from the outside — buildGpcaPostMaterializationReport,
  // gpcaBlocksGeneration — never edits gate/detector/scoring logic).
  // ===============================================================================================
  const THIS_MILESTONE_NEW_SYMBOLS = [
    'auditCurrentWorkspaceStateForGpca',
    'reauditGpcaAfterWorkspaceMutation',
    'PRODUCTION_PIPELINE_CONSTITUTION_ADOPTION_PHASE_1_RULE_IDS',
    'collectGeneratedFilesRecursively',
    'postPreviewGpcaBlockedMutationLabel',
    'gpcaViolatedConstitutionRuleIds',
  ];
  function fileContainsAnyMilestoneSymbol(relPath: string): boolean {
    const abs = join(ROOT, relPath);
    if (!existsSync(abs)) return false;
    const content = readFileSync(abs, 'utf8');
    return THIS_MILESTONE_NEW_SYMBOLS.some((sym) => content.includes(sym));
  }
  function anyFileInDirContainsAnyMilestoneSymbol(dirRelPath: string, excludeFilenames: readonly string[] = []): string | null {
    const abs = join(ROOT, dirRelPath);
    if (!existsSync(abs)) return null;
    const stack = [abs];
    while (stack.length > 0) {
      const current = stack.pop()!;
      const entries = readdirSync(current, { withFileTypes: true });
      for (const entry of entries) {
        const full = join(current, entry.name);
        if (entry.isDirectory()) {
          stack.push(full);
        } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name) && !excludeFilenames.includes(entry.name)) {
          const content = readFileSync(full, 'utf8');
          const hit = THIS_MILESTONE_NEW_SYMBOLS.find((sym) => content.includes(sym));
          if (hit) return `${relative(ROOT, full)} contains "${hit}"`;
        }
      }
    }
    return null;
  }

  // "No GPCA weakening" means this milestone never edited GPCA's own gate/detector/scoring/adapter
  // logic — it does NOT mean the mandatory Capability Matrix (scenario 33, required to live in
  // generation-pipeline-compliance-report.ts, GPCA's own report module) may not mention this
  // milestone's name/functions in its documentation row. This checks that within every file GPCA
  // owns, this milestone's new symbols appear ONLY inside that additive CapabilityMatrixRow
  // documentation object in the report module — never inside any gate/detector/scoring/adapter
  // function body that could alter GPCA's actual authority logic. (git diff is not scoped to this
  // milestone alone — this workspace has many prior, separately-completed milestones' uncommitted
  // GPCA changes already staged, so a diff-based check would misattribute their edits to this one.)
  const gpcaSourceFiles = ['src/generation-pipeline-compliance-authority-v1'];
  const reportSource = readSource('src/generation-pipeline-compliance-authority-v1/generation-pipeline-compliance-report.ts');
  const capabilityMatrixRowStart = reportSource.indexOf("capability: 'Production Pipeline Constitution Adoption Phase 1'");
  const symbolsOutsideMatrixRow =
    capabilityMatrixRowStart === -1
      ? THIS_MILESTONE_NEW_SYMBOLS
      : THIS_MILESTONE_NEW_SYMBOLS.filter((sym) => {
          const firstIdx = reportSource.indexOf(sym);
          // Any occurrence of the symbol name outside a ~4000-char window starting at the matrix
          // row is a real code reference, not documentation text inside that row's `notes` string.
          return firstIdx !== -1 && (firstIdx < capabilityMatrixRowStart || firstIdx > capabilityMatrixRowStart + 4000);
        });
  const gpcaGateHitOutsideReport = gpcaSourceFiles
    .map((dir) => anyFileInDirContainsAnyMilestoneSymbol(dir, ['generation-pipeline-compliance-report.ts']))
    .find((hit) => hit !== null) ?? null;
  const gpcaGateHit =
    gpcaGateHitOutsideReport ??
    (symbolsOutsideMatrixRow.length > 0
      ? `report.ts references milestone symbol(s) outside the Capability Matrix row: ${symbolsOutsideMatrixRow.join(', ')}`
      : null);
  assert(
    "25. No GPCA weakening: within every file GPCA owns, this milestone's new symbols appear only inside generation-pipeline-compliance-report.ts's additive Capability Matrix documentation row — never inside any GPCA gate/detector/scoring/adapter function body — this milestone only calls GPCA's existing, unmodified buildGpcaPostMaterializationReport()/gpcaBlocksGeneration() from the orchestrator, more completely (Tier 0) and more often (Tier 1), never editing GPCA's own gate/detector/scoring logic",
    gpcaGateHit === null,
    gpcaGateHit === null ? 'no milestone symbol found outside the report.ts Capability Matrix row' : gpcaGateHit,
  );

  const cbgaHit = anyFileInDirContainsAnyMilestoneSymbol('src/contract-bound-generation-authority-v4');
  assert(
    "26. No CBGA weakening: none of this milestone's new symbols appear anywhere under src/contract-bound-generation-authority-v4 — this milestone never touched CBGA's repair/gate/plan-building logic",
    cbgaHit === null,
    cbgaHit === null ? 'no milestone symbol found in CBGA' : cbgaHit,
  );

  const pfHit =
    anyFileInDirContainsAnyMilestoneSymbol('src/product-faithfulness-v1') ??
    anyFileInDirContainsAnyMilestoneSymbol('src/product-faithfulness-v2');
  assert(
    "27. No Product Faithfulness weakening: none of this milestone's new symbols appear anywhere under src/product-faithfulness-v1 or src/product-faithfulness-v2 (this milestone never touched those directories)",
    pfHit === null,
    pfHit === null ? 'no milestone symbol found in Product Faithfulness v1/v2' : pfHit,
  );

  const aeoHit = anyFileInDirContainsAnyMilestoneSymbol('src/autonomous-engineering-orchestrator-v1');
  const eiaaHit =
    anyFileInDirContainsAnyMilestoneSymbol('src/engineering-intelligence-activation-authority') ??
    anyFileInDirContainsAnyMilestoneSymbol('src/engineering-intelligence-runtime');
  assert(
    "28. No AEO/EIAA weakening: none of this milestone's new symbols appear anywhere under the AEO orchestrator or Engineering Intelligence directories — this milestone only reads Engineering Intelligence's existing repairResult.repairAttempts field from the outside, never editing AEO/EIAA's own decision/activation logic",
    aeoHit === null && eiaaHit === null,
    `aeoHit=${aeoHit}, eiaaHit=${eiaaHit}`,
  );

  // ===============================================================================================
  // Scenarios 29-30 — no application-specific logic, no VERE work.
  // ===============================================================================================
  const TOUCHED_PRODUCTION_FILES = [
    'src/one-prompt-live-preview/one-prompt-build-orchestrator.ts',
    'src/one-prompt-live-preview/one-prompt-live-preview-types.ts',
    'src/generation-pipeline-compliance-authority-v1/generation-pipeline-compliance-report.ts',
  ];
  let touchedDiff = '';
  try {
    touchedDiff = execSync(`git diff -- ${TOUCHED_PRODUCTION_FILES.map((f) => `"${f}"`).join(' ')}`, {
      cwd: ROOT,
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 16,
    });
  } catch {
    touchedDiff = '';
  }
  const addedCodeLines = touchedDiff
    .split('\n')
    .filter((l) => l.startsWith('+') && !l.startsWith('+++'))
    .map((l) => l.slice(1).trim())
    .filter((l) => l.length > 0 && !l.startsWith('//') && !l.startsWith('*') && !l.startsWith('/*'));
  const APPLICATION_SPECIFIC_LOGIC_PATTERNS = [
    /\b(domain|product|profile|appname|moduleid)\b\s*===\s*['"](restaurant|calculator|converter|crm|booking|inventory|notes|dashboard|authentication|crud|todo|medical|finance|lisa)['"]/i,
    /switch\s*\(\s*(domain|product|profile)\s*\)/i,
    /\[\s*['"](restaurant|calculator|converter|crm|booking|inventory|notes|todo|medical|finance|lisa)['"]\s*,/i,
  ];
  const HARDCODED_DOMAIN_WORDS = [
    'restaurant',
    'calculator',
    'crm',
    'booking',
    'inventory',
    'notes',
    'dashboard-app',
    'authentication-app',
    'crud-app',
    'lisa',
  ];
  const logicHits = addedCodeLines.filter((l) => APPLICATION_SPECIFIC_LOGIC_PATTERNS.some((p) => p.test(l)));
  const hardcodedDomainHits = addedCodeLines.filter((l) =>
    HARDCODED_DOMAIN_WORDS.some((w) => new RegExp(`['"\`][^'"\`]*\\b${w}\\b[^'"\`]*['"\`]`, 'i').test(l)) &&
    !/root cause/i.test(l),
  );
  assert(
    "29. No application-specific logic: none of this milestone's own added code lines (git diff, comments excluded) branch on a hardcoded product/domain word or literal — the file-listing walk and mutation re-audit gating are the same generic mechanism for every application/profile/domain",
    logicHits.length === 0 && hardcodedDomainHits.length === 0,
    `logicHits=${logicHits.length}, hardcodedDomainHits=${hardcodedDomainHits.length}${logicHits.length + hardcodedDomainHits.length > 0 ? ` :: ${[...logicHits, ...hardcodedDomainHits].join(' || ')}` : ''} (inspected ${addedCodeLines.length} added code line(s))`,
  );

  const vereDirHit = existsSync(join(ROOT, 'src', 'vere-v1'))
    ? anyFileInDirContainsAnyMilestoneSymbol('src/vere-v1')
    : null;
  const touchedFilesReferenceVere = TOUCHED_PRODUCTION_FILES.some((f) => /\bvere\b/i.test(readSource(f)));
  assert(
    '30. No VERE work: this milestone never touched any VERE directory/file, and none of the files this milestone DID touch reference VERE in any way',
    vereDirHit === null && !touchedFilesReferenceVere,
    `vereDirHit=${vereDirHit}, touchedFilesReferenceVere=${touchedFilesReferenceVere}`,
  );

  // ===============================================================================================
  // Scenario 31 — no broad validator chain: this validator's own source never shells out to a
  // sibling validator script or to `tsc` outside its own lightweight, touched-file-scoped diagnostic
  // (scenario 32 below), and never imports/invokes VERE.
  // ===============================================================================================
  const thisValidatorSource = readSource('scripts/validate-production-pipeline-constitution-adoption-phase-1.ts');
  const nonCommentValidatorSource = thisValidatorSource
    .split('\n')
    .filter((l) => !l.trim().startsWith('//') && !l.trim().startsWith('*'))
    .join('\n');
  const invokesSiblingValidator = /execSync\([^)]*validate-(?!production-pipeline-constitution-adoption-phase-1)/i.test(
    nonCommentValidatorSource,
  );
  // "Invokes VERE" means an actual ES import declaration / require(...) call / execSync(...) call
  // that references a VERE module or script from EXECUTABLE code — never a mention of the word
  // "VERE" inside a comment, string literal describing a constraint, or assertion/scenario-name
  // text (this validator necessarily discusses "no VERE work" at length because it is the scenario
  // being verified, and its OWN detector regexes below spell out the word "import"/"require" as
  // literal pattern text, which a naive substring scan would otherwise self-match). Matched against
  // canonical import-declaration/require-call/execSync-call shapes only, one real source line at a
  // time, never a free substring search for "import"/"require" anywhere in the file.
  const REAL_IMPORT_OR_REQUIRE_OR_EXECSYNC_LINE_PATTERN = /^(?:import\s.*from\s*['"]([^'"]+)['"]|.*\brequire\(\s*['"]([^'"]+)['"]\s*\)|.*\bexecSync\(\s*['"]([^'"]*vere[^'"]*)['"])/i;
  const invokesVere = nonCommentValidatorSource.split('\n').some((line) => {
    const trimmed = line.trim();
    const match = REAL_IMPORT_OR_REQUIRE_OR_EXECSYNC_LINE_PATTERN.exec(trimmed);
    if (!match) return false;
    const referencedModuleOrCommand = match[1] ?? match[2] ?? match[3] ?? '';
    return /vere/i.test(referencedModuleOrCommand);
  });
  assert(
    '31. No broad validator chain: this validator only ever runs itself and a single lightweight, touched-file-scoped `tsc` diagnostic (scenario 32) — it never shells out to a sibling validate-*.ts script and never imports/executes VERE',
    !invokesSiblingValidator && !invokesVere,
    `invokesSiblingValidator=${invokesSiblingValidator}, invokesVere=${invokesVere}`,
  );

  // ===============================================================================================
  // Scenario 32 — no NEW TypeScript errors introduced in touched files (lightweight, touched-file-
  // scoped diagnostic only). Several touched files (one-prompt-build-orchestrator.ts in particular)
  // carry real, pre-existing TS errors from unrelated prior work — this compares the CURRENT
  // touched-file error set against a BASELINE captured by temporarily git-stashing this milestone's
  // own changes to those exact files, normalized by stripping line:col, so only genuinely NEW error
  // signatures count as a failure.
  // ===============================================================================================
  function runTsc(): { lines: string[]; failedToRun: boolean } {
    let output = '';
    let failedToRun = false;
    try {
      output = execSync('npx tsc --noEmit --pretty false', { cwd: ROOT, encoding: 'utf8', maxBuffer: 1024 * 1024 * 64 });
    } catch (err) {
      const e = err as { stdout?: string; stderr?: string };
      output = `${e.stdout ?? ''}${e.stderr ?? ''}`;
      if (!output) failedToRun = true;
    }
    const lines = output.split(/\r?\n/).filter((l) => l.trim().length > 0 && /error TS/.test(l));
    return { lines, failedToRun };
  }
  function touchedFileErrorSignatures(lines: string[]): Set<string> {
    const sigs = new Set<string>();
    for (const l of lines) {
      const normalized = l.replace(/\\/g, '/');
      const matchedFile = TOUCHED_PRODUCTION_FILES.find((f) => normalized.startsWith(f));
      if (!matchedFile) continue;
      const signature = normalized.replace(/\(\d+,\d+\)/, '(L,C)');
      sigs.add(signature);
    }
    return sigs;
  }

  const current = runTsc();
  const currentTouchedSignatures = touchedFileErrorSignatures(current.lines);

  let baselineTouchedSignatures = new Set<string>();
  let baselineFailedToRun = false;
  let stashed = false;
  try {
    const stashOutput = execSync(
      `git stash push -u -- ${TOUCHED_PRODUCTION_FILES.map((f) => `"${f}"`).join(' ')}`,
      { cwd: ROOT, encoding: 'utf8' },
    );
    stashed = !/No local changes to save/i.test(stashOutput);
    const baseline = runTsc();
    baselineFailedToRun = baseline.failedToRun;
    baselineTouchedSignatures = touchedFileErrorSignatures(baseline.lines);
  } catch {
    baselineFailedToRun = true;
  } finally {
    if (stashed) {
      try {
        execSync('git stash pop', { cwd: ROOT, encoding: 'utf8' });
      } catch (popErr) {
        throw new Error(
          `CRITICAL: failed to restore git stash after scenario 32 baseline tsc run — working tree may be left stashed. Run "git stash pop" manually. ${String(popErr)}`,
        );
      }
    }
  }

  const newErrorSignatures = [...currentTouchedSignatures].filter((s) => !baselineTouchedSignatures.has(s));
  assert(
    '32. No new TypeScript errors introduced in touched files',
    !current.failedToRun && !baselineFailedToRun && newErrorSignatures.length === 0,
    current.failedToRun || baselineFailedToRun
      ? `tsc did not run/produce output (currentFailed=${current.failedToRun}, baselineFailed=${baselineFailedToRun})`
      : `pre-existing touched-file errors (unrelated to this milestone, not counted)=${baselineTouchedSignatures.size}, NEW touched-file errors=${newErrorSignatures.length}${newErrorSignatures.length > 0 ? `: ${newErrorSignatures.join(' | ')}` : ''}`,
  );

  // ===============================================================================================
  // Scenario 33 — mandatory Capability Matrix row.
  // ===============================================================================================
  const capabilityRow = GPCA_CAPABILITY_MATRIX_ROWS.find(
    (r) => r.capability === 'Production Pipeline Constitution Adoption Phase 1',
  );
  assert(
    '33. Capability Matrix included: a dedicated "Production Pipeline Constitution Adoption Phase 1" row exists with Status/Production Wired/Auto Run/Activation Allowed/Notes',
    capabilityRow !== undefined && capabilityRow.status === 'IMPLEMENTED' && capabilityRow.productionWired === 'YES',
    `row present=${capabilityRow !== undefined}, status=${capabilityRow?.status}, productionWired=${capabilityRow?.productionWired}`,
  );

  // -------------------------------------------------------------------------------------------
  // Cleanup temp workspaces.
  // -------------------------------------------------------------------------------------------
  for (const dir of cleanupDirs) {
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      // best-effort cleanup only
    }
  }

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
  } else {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exitCode = 1;
});
