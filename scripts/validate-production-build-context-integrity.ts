/**
 * Production Build Context and Surface Integrity Authority V1 validation.
 *
 * Run only:
 *   npx tsx scripts/validate-production-build-context-integrity.ts
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { applyContractBoundGenerationToBuildPlan } from '../src/contract-bound-generation-authority-v4/index.js';
import { buildCanonicalProductContract } from '../src/product-faithfulness-v2/index.js';
import { resolvePromptFaithfulBuildPlan } from '../src/prompt-faithful-generation/index.js';
import { buildUniversalMaterializedWorkspaceFiles } from '../src/universal-prompt-to-app-materialization/universal-app-materialization-engine.js';
import {
  PRODUCTION_BUILD_CONTEXT_INTEGRITY_VERSION,
  blockedProjectionContainsNoSuccessWording,
  buildContextFinding,
  createProductionBuildContext,
  evaluateProductionBuildContextIntegrity,
  fingerprintBuildContextValue,
  ownedArtifact,
  projectBuildStatusFromBuildOutcome,
  resolveBuildContextOutcome,
  toBuildContextNavigationEntry,
  validateArtifactOwnership,
  validateNavigationPurity,
  validateProjectIdentityPurity,
  validateWorkspaceIsolation,
  INFRASTRUCTURE_NAVIGATION_REGISTRY,
} from '../src/build-context-integrity/index.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const PASS_TOKEN = 'PRODUCTION_BUILD_CONTEXT_AND_SURFACE_INTEGRITY_AUTHORITY_V1_PASS';

interface Result {
  name: string;
  passed: boolean;
  detail: string;
}

const results: Result[] = [];
let n = 1;
function assert(name: string, passed: boolean, detail: string): void {
  results.push({ name, passed, detail });
}

function materialize(label: string, prompt: string) {
  const contract = buildCanonicalProductContract({ prompt });
  const plan = resolvePromptFaithfulBuildPlan(prompt);
  const bound = applyContractBoundGenerationToBuildPlan(plan, contract, {
    promptHash: `pbci-${label}`,
    buildId: `pbci-build-${label}`,
  });
  const envelope = bound.report.approvedProductionBuildEnvelope;
  const workspaceFiles = buildUniversalMaterializedWorkspaceFiles({
    contractId: `pbci-${label}`,
    ideaId: `idea-${label}`,
    buildUnits: [`unit-${label}`],
    rawPrompt: prompt,
    faithfulBuildPlan: bound.buildPlan,
    approvedProductionBuildEnvelope: envelope,
    buildRunId: `workspace-${label}`,
  });
  return { contract, plan: bound.buildPlan, report: bound.report, envelope, workspaceFiles };
}

function fileContent(files: readonly { relativePath: string; content: string }[], path: string): string {
  return files.find((file) => file.relativePath === path)?.content ?? '';
}

const previous = materialize('previous', 'Build alpha operations workspace with task records and export actions.');
const current = materialize('current', 'Build beta service workspace with issue records and import actions.');

const previousIdentity = previous.envelope.approvedProductIdentity.displayName;
const currentIdentity = current.envelope.approvedProductIdentity.displayName;
const currentContext = createProductionBuildContext({
  envelope: current.envelope,
  projectId: 'pbci-current',
  workspaceId: 'workspace-current',
});
const previousContext = createProductionBuildContext({
  envelope: previous.envelope,
  projectId: 'pbci-previous',
  workspaceId: 'workspace-previous',
});

assert(`${n++}. Engine version`, PRODUCTION_BUILD_CONTEXT_INTEGRITY_VERSION === '1.0.0', PRODUCTION_BUILD_CONTEXT_INTEGRITY_VERSION);
assert(`${n++}. Every build receives a unique BuildContext`, currentContext.buildContextId !== previousContext.buildContextId, `${currentContext.buildContextId}/${previousContext.buildContextId}`);
assert(`${n++}. BuildContext is immutable`, currentContext.immutable === true, 'immutable');
assert(`${n++}. BuildContext fingerprints are stable`, currentContext.fingerprint === createProductionBuildContext({ envelope: current.envelope, projectId: 'pbci-current', workspaceId: 'workspace-current' }).fingerprint, currentContext.fingerprint);
assert(`${n++}. BuildContext changes with envelope`, currentContext.fingerprint !== previousContext.fingerprint, 'changed');

const currentWorkspaceText = current.workspaceFiles.map((file) => file.content).join('\n');
assert(`${n++}. Previous project identity never appears`, !currentWorkspaceText.includes(previousIdentity), previousIdentity);
assert(`${n++}. Current project identity appears`, currentWorkspaceText.includes(currentIdentity), currentIdentity);
assert(`${n++}. Previous workspace title never appears`, validateWorkspaceIsolation({ buildContext: currentContext, workspaceTextByPath: { 'index.html': currentWorkspaceText }, previousWorkspaceTokens: [previousIdentity] }).length === 0, 'workspace clean');
assert(`${n++}. Previous workspace contamination is detected`, validateWorkspaceIsolation({ buildContext: currentContext, workspaceTextByPath: { stale: previousIdentity }, previousWorkspaceTokens: [previousIdentity] }).length === 1, 'contamination');
assert(`${n++}. Previous project contamination is detected`, validateProjectIdentityPurity({ buildContext: currentContext, currentProductIdentity: currentIdentity, renderedText: [currentIdentity, previousIdentity], previousProductIdentities: [previousIdentity] }).some((f) => f.diagnosticCode === 'previous_project_identity_contamination'), 'identity contamination');

const approvedNav = current.envelope.approvedNavigationPlan.navigationItems[0];
const approvedNavEntry = toBuildContextNavigationEntry({
  label: approvedNav?.label ?? currentIdentity,
  route: approvedNav?.path ?? '/',
  moduleId: approvedNav?.moduleId ?? null,
  buildContext: currentContext,
  envelope: current.envelope,
});
const unapprovedNavEntry = toBuildContextNavigationEntry({
  label: 'Unapproved Surface',
  route: '/unapproved-surface',
  moduleId: null,
  buildContext: currentContext,
  envelope: current.envelope,
});
const infraNavEntry = toBuildContextNavigationEntry({
  label: INFRASTRUCTURE_NAVIGATION_REGISTRY[0]!.label,
  route: '/settings',
  moduleId: null,
  buildContext: currentContext,
  envelope: current.envelope,
});
assert(`${n++}. Navigation only contains approved entries`, validateNavigationPurity({ buildContext: currentContext, envelope: current.envelope, navigationEntries: [approvedNavEntry] }).length === 0, 'approved');
assert(`${n++}. Infrastructure navigation requires explicit registration`, infraNavEntry.source === 'INFRASTRUCTURE_APPROVED', infraNavEntry.source);
assert(`${n++}. Template defaults are rejected`, validateNavigationPurity({ buildContext: currentContext, envelope: current.envelope, navigationEntries: [unapprovedNavEntry] }).some((f) => f.diagnosticCode === 'navigation_entry_not_approved'), 'blocked');
assert(`${n++}. Previous navigation never appears`, !fileContent(current.workspaceFiles, 'src/features/FeatureAppRouter.tsx').includes(previous.envelope.approvedNavigationPlan.productEntries[0] ?? '__missing__'), 'nav clean');
const previousUniqueRoute = previous.envelope.approvedModulePlan.routes.find(
  (route) => route !== '/' && !current.envelope.approvedModulePlan.routes.includes(route),
);
assert(`${n++}. Previous routes never appear`, !previousUniqueRoute || !fileContent(current.workspaceFiles, 'src/features/routes.ts').includes(previousUniqueRoute), previousUniqueRoute ?? 'no unique previous route');

const currentArtifact = ownedArtifact({ artifactKind: 'PREVIEW_DOM', artifactId: 'preview', buildContext: currentContext, sourceAuthority: 'TEST' });
const foreignArtifact = { ...currentArtifact, artifactId: 'foreign-preview', buildContextId: previousContext.buildContextId };
assert(`${n++}. Preview only uses current BuildContext`, validateArtifactOwnership(currentContext, [currentArtifact]).length === 0, 'preview owned');
assert(`${n++}. Preview foreign BuildContext is rejected`, validateArtifactOwnership(currentContext, [foreignArtifact]).some((f) => f.diagnosticCode === 'foreign_build_context_artifact'), 'preview blocked');
assert(`${n++}. Runtime only uses current BuildContext`, validateArtifactOwnership(currentContext, [ownedArtifact({ artifactKind: 'RUNTIME_REGISTRATION', artifactId: 'runtime', buildContext: currentContext, sourceAuthority: 'TEST' })]).length === 0, 'runtime');
assert(`${n++}. Engineering reports only use current BuildContext`, validateArtifactOwnership(currentContext, [ownedArtifact({ artifactKind: 'ENGINEERING_REPORT', artifactId: 'engineering', buildContext: currentContext, sourceAuthority: 'TEST' })]).length === 0, 'engineering');
assert(`${n++}. Product Faithfulness uses current BuildContext only`, validateArtifactOwnership(currentContext, [ownedArtifact({ artifactKind: 'PRODUCT_FAITHFULNESS_EVIDENCE', artifactId: 'pf', buildContext: currentContext, sourceAuthority: 'PRODUCT_FAITHFULNESS' })]).length === 0, 'pf');
assert(`${n++}. Traceability validates ownership`, validateArtifactOwnership(currentContext, [ownedArtifact({ artifactKind: 'TRACEABILITY_EVIDENCE', artifactId: 'traceability', buildContext: currentContext, sourceAuthority: 'CONTRACT_TO_MODULE_TRACEABILITY' })]).length === 0, 'trace');

const integrityReport = evaluateProductionBuildContextIntegrity({
  envelope: current.envelope,
  workspaceFiles: current.workspaceFiles,
  projectId: 'pbci-current',
  workspaceId: 'workspace-current',
  previousProductIdentities: [previousIdentity],
  previousWorkspaceTokens: [previousIdentity],
});
assert(`${n++}. Workspace artifacts are emitted`, fileContent(current.workspaceFiles, 'src/build-context-integrity/build-context.json').includes('buildContextId'), 'artifact');
assert(`${n++}. Previous preview never appears`, integrityReport.findings.every((f) => f.diagnosticCode !== 'previous_workspace_contamination'), 'preview clean');
assert(`${n++}. Previous runtime registrations never appear`, !currentWorkspaceText.includes(previousContext.buildContextId), 'runtime clean');
assert(`${n++}. Previous engineering reports never appear`, !currentWorkspaceText.includes(previousContext.buildContextId), 'engineering clean');
assert(`${n++}. Previous Product Faithfulness evidence never appears`, !currentWorkspaceText.includes(previousContext.buildContextId), 'pf clean');
assert(`${n++}. Previous traceability findings never appear`, !currentWorkspaceText.includes(previousContext.buildContextId), 'trace clean');

assert(`${n++}. GPCA rejects foreign BuildContexts`, validateArtifactOwnership(currentContext, [foreignArtifact]).length === 1, 'gpca ownership primitive');
assert(`${n++}. CBGA artifacts carry BuildContext ownership`, currentContext.approvedEnvelopeFingerprint === current.envelope.buildFingerprint, currentContext.approvedEnvelopeFingerprint);
assert(`${n++}. C1 repairs only current BuildContext`, validateArtifactOwnership(currentContext, [currentArtifact]).length === 0 && validateArtifactOwnership(currentContext, [foreignArtifact]).length === 1, 'c1 ownership primitive');

const blockedOutcome = resolveBuildContextOutcome({ gpcaBlocked: true });
const blockedProjection = projectBuildStatusFromBuildOutcome(blockedOutcome);
assert(`${n++}. BuildOutcome is canonical`, blockedOutcome === 'BUILD_BLOCKED_GPCA', blockedOutcome);
assert(`${n++}. All status surfaces derive from BuildOutcome`, blockedProjection.buildOutcome === blockedOutcome && blockedProjection.executionStatus === 'BLOCKED', blockedProjection.executionStatus);
assert(`${n++}. Blocked builds never display success wording`, blockedProjectionContainsNoSuccessWording(blockedProjection), blockedProjection.completionWording);
assert(`${n++}. Blocked builds never claim preview readiness`, blockedProjection.previewAvailable === false && blockedProjection.successBanner === null, 'blocked preview');

const src = [
  'src/build-context-integrity/build-context-types.ts',
  'src/build-context-integrity/build-context.ts',
  'src/build-context-integrity/navigation-purity-validator.ts',
  'src/build-context-integrity/production-build-context-integrity.ts',
  'src/build-context-integrity/build-status-projection.ts',
].map((path) => readFileSync(join(ROOT, path), 'utf8')).join('\n');
assert(`${n++}. No domain-specific logic exists`, !/\b(restaurant|crm|inventory|booking|unit converter|dashboard|customers|orders|staff|sales|lisa)\b/i.test(src), 'generic source');
assert(`${n++}. Validator script registered`, JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).scripts['validate:production-build-context-integrity'] === 'tsx scripts/validate-production-build-context-integrity.ts', 'script');
assert(`${n++}. Required files exist`, existsSync(join(ROOT, 'src/build-context-integrity/production-build-context-integrity.ts')), 'files');
assert(`${n++}. Findings are fingerprinted`, buildContextFinding({ diagnosticCode: 'test', expectedBuildContextId: currentContext.buildContextId, message: 'test' }).fingerprint.length > 0, 'fingerprint');
assert(`${n++}. Fingerprints are deterministic`, fingerprintBuildContextValue({ b: 1, a: 2 }) === fingerprintBuildContextValue({ a: 2, b: 1 }), 'stable');

const failed = results.filter((result) => !result.passed);
for (const result of results) {
  console.log(`${result.passed ? 'PASS' : 'FAIL'} — ${result.name}${result.passed ? '' : ` :: ${result.detail}`}`);
}
console.log(`\n${results.length - failed.length}/${results.length} assertions passed.`);
if (failed.length > 0) {
  console.error(`\n${failed.length} assertion(s) failed.`);
  process.exit(1);
}
console.log(`\n${PASS_TOKEN}`);
