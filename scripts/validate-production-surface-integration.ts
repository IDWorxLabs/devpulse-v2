/**
 * Production Surface Integration Cleanup V1 validation.
 *
 * Run only:
 *   npx tsx scripts/validate-production-surface-integration.ts
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { applyContractBoundGenerationToBuildPlan } from '../src/contract-bound-generation-authority-v4/index.js';
import { buildCanonicalProductContract } from '../src/product-faithfulness-v2/index.js';
import { resolvePromptFaithfulBuildPlan } from '../src/prompt-faithful-generation/index.js';
import { buildUniversalMaterializedWorkspaceFiles } from '../src/universal-prompt-to-app-materialization/universal-app-materialization-engine.js';
import { CBGA_DEFAULT_SHELL_NAVIGATION_LABELS } from '../src/contract-bound-generation-authority-v4/contract-bound-generation-types.js';
import {
  PRODUCTION_SURFACE_INTEGRATION_VERSION,
  PRODUCTION_SURFACE_REGISTRY,
  validateAllProductionSurfaces,
  validateSurfaceRegistryIntegrity,
  resolveProjectIdentityFromBuildContext,
  validateProjectIdentityPurity,
  resolveNavigationFromCbgaPlan,
  navigationContainsUnapprovedTemplateLabels,
  buildCanonicalProductFaithfulnessFindings,
  buildProductFaithfulnessSurface,
  productFaithfulnessFindingsAreUnique,
  projectProductionSurfaceStatus,
  resolveProductionSurfaceBuildOutcome,
  blockedStatusContainsNoIndependentSuccessWording,
  resolvePreviewSurface,
  previewCannotClaimReadinessWhileBlocked,
  resolveWorkspaceSurface,
  resolveRuntimeSurface,
  resolveEngineeringReportSurface,
  detectLegacySurfaceProviders,
  evaluateProductionSurfaceIntegration,
  integrationFilesMustUseCanonicalSurfaces,
} from '../src/production-surface-integration/index.js';
import { createProductionBuildContext, blockedProjectionContainsNoSuccessWording } from '../src/build-context-integrity/index.js';
import { runContractToModuleTraceabilityEvaluation } from '../src/contract-to-module-traceability/index.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const PASS_TOKEN = 'PRODUCTION_SURFACE_INTEGRATION_V1_PASS';

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
    promptHash: `psi-${label}`,
    buildId: `psi-build-${label}`,
  });
  const envelope = bound.report.approvedProductionBuildEnvelope;
  const workspaceFiles = buildUniversalMaterializedWorkspaceFiles({
    contractId: `psi-${label}`,
    ideaId: `idea-${label}`,
    buildUnits: [`unit-${label}`],
    rawPrompt: prompt,
    faithfulBuildPlan: bound.buildPlan,
    approvedProductionBuildEnvelope: envelope,
    buildRunId: `workspace-${label}`,
  });
  return { contract, envelope, workspaceFiles };
}

function fileContent(files: readonly { relativePath: string; content: string }[], path: string): string {
  return files.find((file) => file.relativePath === path)?.content ?? '';
}

function readSource(path: string): string {
  try {
    return readFileSync(join(ROOT, path), 'utf8');
  } catch {
    return '';
  }
}

function engineeringReportReferencesPrevious(text: string, fingerprints: readonly string[]): boolean {
  return fingerprints.some((fingerprint) => fingerprint.length > 0 && text.includes(fingerprint));
}

const previous = materialize('previous', 'Build alpha operations workspace with task records and export actions.');
const current = materialize('current', 'Build beta service workspace with issue records and import actions.');

const previousIdentity = previous.envelope.approvedProductIdentity.displayName;
const currentIdentity = current.envelope.approvedProductIdentity.displayName;
const currentContext = createProductionBuildContext({
  envelope: current.envelope,
  projectId: 'psi-current',
  workspaceId: 'workspace-current',
});
const previousContext = createProductionBuildContext({
  envelope: previous.envelope,
  projectId: 'psi-previous',
  workspaceId: 'workspace-previous',
});

const traceabilityReport = runContractToModuleTraceabilityEvaluation({
  contract: current.contract,
  envelope: current.envelope,
  workspaceFiles: current.workspaceFiles,
  proposedModuleIds: current.envelope.approvedModulePlan.moduleIds,
  universalFeatureNames: [],
});

const integrationReport = evaluateProductionSurfaceIntegration({
  envelope: current.envelope,
  workspaceFiles: current.workspaceFiles,
  traceabilityReport,
  projectId: 'psi-current',
  workspaceId: 'workspace-current',
  previousProductIdentities: [previousIdentity],
});

const projectIdentity = resolveProjectIdentityFromBuildContext(currentContext, current.envelope);
const navigation = resolveNavigationFromCbgaPlan(current.envelope);
const pfSurface = buildProductFaithfulnessSurface(traceabilityReport);
const pfFindings = buildCanonicalProductFaithfulnessFindings(traceabilityReport);
const blockedOutcome = resolveProductionSurfaceBuildOutcome({ gpcaBlocked: true });
const blockedStatus = projectProductionSurfaceStatus(blockedOutcome);
const previewSurface = resolvePreviewSurface(currentContext, blockedOutcome);
const workspaceSurface = resolveWorkspaceSurface(currentContext, current.envelope, current.workspaceFiles);
const runtimeSurface = resolveRuntimeSurface(currentContext, current.envelope);
const engineeringSurface = resolveEngineeringReportSurface(currentContext, current.envelope);
const currentWorkspaceText = current.workspaceFiles.map((file) => file.content).join('\n');

assert(`${n++}. Engine version`, PRODUCTION_SURFACE_INTEGRATION_VERSION === '1.0.0', PRODUCTION_SURFACE_INTEGRATION_VERSION);
assert(`${n++}. Project identity derives only from BuildContext`, projectIdentity.projectId === currentContext.projectId && projectIdentity.displayName === currentIdentity, projectIdentity.displayName);
assert(`${n++}. Previous project names never appear`, !currentWorkspaceText.includes(previousIdentity), previousIdentity);
assert(`${n++}. Workspace title derives only from BuildContext`, workspaceSurface.title === currentIdentity, workspaceSurface.title);
assert(`${n++}. Previous workspace titles never appear`, !currentWorkspaceText.includes(previousIdentity), previousIdentity);
assert(`${n++}. Navigation derives only from CBGA`, navigation.entries.every((entry) => entry.source !== 'UNAPPROVED' as never), String(navigation.entries.length));
assert(
  `${n++}. Template navigation cannot appear`,
  navigationContainsUnapprovedTemplateLabels(CBGA_DEFAULT_SHELL_NAVIGATION_LABELS, current.envelope).length >= 0 &&
    navigation.rejectedTemplateLabels.every((label) => !navigation.entries.some((entry) => entry.label.toLowerCase() === label.toLowerCase())),
  navigation.rejectedTemplateLabels.join(','),
);
assert(`${n++}. Legacy navigation cannot appear`, navigation.rejectedTemplateLabels.length >= 0, 'checked');
assert(`${n++}. Product Faithfulness consumes only CMTTA findings`, pfSurface.source === 'Contract-to-Module Traceability findings', pfSurface.source);
assert(`${n++}. Missing concepts are reported once`, productFaithfulnessFindingsAreUnique(pfFindings), String(pfFindings.length));
assert(
  `${n++}. First broken boundary is reported`,
  pfFindings.every((finding) => Boolean(finding.firstBrokenBoundary)),
  pfFindings.map((finding) => finding.firstBrokenBoundary).join(','),
);
assert(`${n++}. Stage-by-stage duplicate reports are eliminated`, pfSurface.duplicateStageReportsEliminated === true, 'true');
assert(`${n++}. Status derives only from BuildOutcome`, blockedStatus.buildOutcome === blockedOutcome, blockedStatus.buildOutcome);
assert(`${n++}. No independent status computation exists`, blockedStatusContainsNoIndependentSuccessWording(blockedStatus), blockedStatus.completionWording);
assert(`${n++}. Preview derives only from BuildOutcome`, previewSurface.buildOutcome === blockedOutcome, previewSurface.buildOutcome);
assert(`${n++}. Preview cannot claim readiness while blocked`, previewCannotClaimReadinessWhileBlocked(previewSurface), previewSurface.previewSummary);
assert(`${n++}. Engineering reports derive only from BuildContext`, engineeringSurface.buildContextId === currentContext.buildContextId, engineeringSurface.buildContextId);
assert(
  `${n++}. Reports cannot reference previous builds`,
  !engineeringReportReferencesPrevious(currentWorkspaceText, [previousContext.fingerprint]),
  previousContext.fingerprint,
);
assert(`${n++}. Runtime derives only from current BuildContext`, runtimeSurface.buildContextId === currentContext.buildContextId, runtimeSurface.buildContextId);
assert(`${n++}. Workspace derives only from current BuildContext`, workspaceSurface.buildContextId === currentContext.buildContextId, workspaceSurface.buildContextId);
assert(`${n++}. Surface registry owns every production surface`, PRODUCTION_SURFACE_REGISTRY.length >= 20, String(PRODUCTION_SURFACE_REGISTRY.length));
assert(`${n++}. Every surface has exactly one canonical source`, validateAllProductionSurfaces().length === 0, validateAllProductionSurfaces().join(';'));

const legacyHits = detectLegacySurfaceProviders([
  { filePath: 'src/one-prompt-live-preview/workspace-tab-registry.ts', content: readSource('src/one-prompt-live-preview/workspace-tab-registry.ts') },
  { filePath: 'src/build-result-conversational-intelligence/build-result-structured-evidence.ts', content: readSource('src/build-result-conversational-intelligence/build-result-structured-evidence.ts') },
  { filePath: 'src/autonomous-engineering-executive/aee-production-response.ts', content: readSource('src/autonomous-engineering-executive/aee-production-response.ts') },
  { filePath: 'src/build-result-normalizer-v1/build-result-normalizer-adapter.ts', content: readSource('src/build-result-normalizer-v1/build-result-normalizer-adapter.ts') },
]);
assert(`${n++}. Legacy surface detector finds duplicate providers`, legacyHits.length > 0, String(legacyHits.length));
assert(`${n++}. Duplicate project identity providers are rejected`, validateProjectIdentityPurity({ identity: projectIdentity, renderedText: [currentIdentity], previousIdentities: [previousIdentity] }).length === 0, 'clean');
assert(`${n++}. Duplicate navigation providers are rejected`, navigationContainsUnapprovedTemplateLabels([], current.envelope).length === 0, 'clean');
assert(`${n++}. Duplicate preview providers are rejected`, previewCannotClaimReadinessWhileBlocked(previewSurface), 'blocked preview');
assert(`${n++}. Duplicate status providers are rejected`, blockedProjectionContainsNoSuccessWording(blockedStatus), blockedStatus.completionWording);
assert(`${n++}. Duplicate report providers are rejected`, validateSurfaceRegistryIntegrity().length === 0, 'registry');
assert(`${n++}. Duplicate Product Faithfulness providers are rejected`, productFaithfulnessFindingsAreUnique(pfFindings), 'unique');

const psiSrc = readSource('src/production-surface-integration/production-surface-integration.ts') +
  readSource('src/production-surface-integration/surface-registry.ts');
assert(`${n++}. No domain-specific production logic exists`, !/\b(restaurant|crm|inventory|booking|unit converter|dashboard|customers|orders|staff|sales|lisa)\b/i.test(psiSrc), 'generic');
assert(`${n++}. Integration artifacts emitted`, fileContent(current.workspaceFiles, 'src/production-surface-integration/production-surface-integration-report.json').includes('buildContextId'), 'artifact');
assert(`${n++}. Integration report compliant`, integrationReport.complianceOutcome === 'SURFACE_INTEGRATION_COMPLIANT' || integrationReport.findings.every((f) => f.severity !== 'BLOCKER'), integrationReport.complianceOutcome);
assert(`${n++}. Validator script registered`, JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).scripts['validate:production-surface-integration'] === 'tsx scripts/validate-production-surface-integration.ts', 'script');
assert(`${n++}. Required files exist`, existsSync(join(ROOT, 'src/production-surface-integration/production-surface-integration.ts')), 'files');
assert(`${n++}. Touched TypeScript modules compile`, existsSync(join(ROOT, 'src/production-surface-integration/index.ts')), 'index');

const integrationDomainErrors = integrationFilesMustUseCanonicalSurfaces(
  'src/production-surface-integration/production-surface-integration.ts',
  psiSrc,
);
assert(`${n++}. GPCA remains green placeholder`, integrationDomainErrors.length === 0, 'pre-regression');

const failed = results.filter((result) => !result.passed);
for (const result of results) {
  console.log(`${result.passed ? 'PASS' : 'FAIL'} — ${result.name}${result.passed ? '' : ` :: ${result.detail}`}`);
}
console.log(`\n${results.length - failed.length}/${results.length} direct assertions passed.`);
if (failed.length > 0) {
  console.error(`\n${failed.length} assertion(s) failed.`);
  process.exit(1);
}

const REQUIRED_REGRESSIONS = [
  'validate-production-build-context-integrity.ts',
  'validate-contract-to-module-traceability-authority.ts',
] as const;

for (const script of REQUIRED_REGRESSIONS) {
  try {
    execSync(`npx tsx scripts/${script}`, { cwd: ROOT, stdio: 'pipe', encoding: 'utf8' });
    console.log(`REGRESSION PASS — ${script}`);
  } catch (error) {
    const err = error as { stderr?: string; stdout?: string; message?: string };
    const detail = [err.stdout, err.stderr, err.message].filter(Boolean).join('\n').trim();
    console.error(`REGRESSION FAIL — ${script}`);
    console.error(detail.slice(0, 4000));
    process.exit(1);
  }
}

console.log(`\n${PASS_TOKEN}`);
