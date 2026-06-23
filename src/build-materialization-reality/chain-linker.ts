/**
 * Materialization Chain Linker — idea → verification contract chain (Phase 26.74).
 */

import type {
  BuildReadyExecutionContract,
  RequirementsToPlanContractReport,
} from '../requirements-to-plan-execution-contract/requirements-to-plan-contract-types.js';
import type { ConnectedBuildExecutionReport } from '../connected-build-execution/connected-build-execution-types.js';
import { WORKSPACE_ROOT_DIR } from './build-materialization-reality-registry.js';
import type { ArtifactRealityScanSummary, MaterializationChainStep } from './build-materialization-reality-types.js';
import { selectPrimaryWorkspace } from './workspace-scanner.js';

function step(
  stage: string,
  proven: boolean,
  evidence: string[],
  missingEvidence: string[],
  firstBrokenLink?: string,
): MaterializationChainStep {
  return { readOnly: true, stage, proven, evidence, missingEvidence, firstBrokenLink };
}

export function buildMaterializationChain(input: {
  contractReport: RequirementsToPlanContractReport | null;
  buildReadyContract: BuildReadyExecutionContract | null;
  artifactScan: ArtifactRealityScanSummary;
  connectedBuildReport: ConnectedBuildExecutionReport | null;
}): MaterializationChainStep[] {
  const contract = input.buildReadyContract;
  const primary = selectPrimaryWorkspace(input.artifactScan, contract?.contractId ?? null);
  const workspacePrefix = contract
    ? `${WORKSPACE_ROOT_DIR}/${contract.contractId}`
    : primary?.workspacePath ?? null;

  const chain: MaterializationChainStep[] = [];

  const ideaProven =
    input.contractReport?.userIdea.status === 'CAPTURED' &&
    Boolean(input.contractReport.userIdea.normalizedGoal);
  chain.push(
    step(
      'idea',
      ideaProven,
      ideaProven
        ? [
            `ideaId=${input.contractReport!.userIdea.ideaId}`,
            `goal=${input.contractReport!.userIdea.normalizedGoal.slice(0, 80)}`,
          ]
        : [],
      ideaProven ? [] : ['User idea not captured or insufficient input'],
      ideaProven ? undefined : 'idea→requirements',
    ),
  );

  const reqCount = input.contractReport?.requirementContract?.requirements.length ?? 0;
  const requirementsProven = reqCount > 0;
  chain.push(
    step(
      'requirements',
      requirementsProven,
      requirementsProven ? [`${reqCount} requirement(s) extracted`] : [],
      requirementsProven ? [] : ['No requirements contract entries'],
      requirementsProven ? undefined : 'requirements→plan',
    ),
  );

  const planTasks = input.contractReport?.planContract?.tasks.length ?? 0;
  const planProven = planTasks > 0 && contract !== null;
  chain.push(
    step(
      'plan',
      planProven,
      planProven
        ? [
            `${planTasks} plan task(s)`,
            contract ? `readiness=${contract.readinessState}` : 'no build-ready contract',
          ]
        : [],
      planProven ? [] : ['Plan tasks or build-ready contract missing'],
      planProven ? undefined : 'plan→artifact manifest',
    ),
  );

  const manifestPath = workspacePrefix ? `${workspacePrefix}/build-manifest.json` : null;
  const manifestFile = primary?.artifactFiles.find((f) => f.relativePath.endsWith('build-manifest.json'));
  const manifestProven = manifestFile?.generated === true;
  chain.push(
    step(
      'artifact manifest',
      manifestProven,
      manifestProven
        ? [`manifest at ${manifestPath}`, `size=${manifestFile!.sizeBytes}B`]
        : [],
      manifestProven ? [] : [`Missing build-manifest.json at ${manifestPath ?? 'unknown'}`],
      manifestProven ? undefined : 'plan→artifact manifest',
    ),
  );

  const expectedFiles = primary?.artifactFiles.filter((f) => f.expected) ?? [];
  const generatedExpected = expectedFiles.filter((f) => f.generated);
  const artifactFilesProven =
    expectedFiles.length > 0 && generatedExpected.length === expectedFiles.length;
  chain.push(
    step(
      'artifact files',
      artifactFilesProven,
      [
        `${generatedExpected.length}/${expectedFiles.length} expected artifact file(s) on disk`,
        ...generatedExpected.slice(0, 4).map((f) => f.relativePath),
      ],
      expectedFiles
        .filter((f) => !f.generated)
        .slice(0, 8)
        .map((f) => f.relativePath),
      artifactFilesProven ? undefined : 'artifacts→files',
    ),
  );

  const workspaceProven =
    primary?.workspaceExists === true &&
    primary.workspacePopulated &&
    (primary.structureMarkersFound.includes('package.json') ||
      primary.structureMarkersFound.includes('src'));
  chain.push(
    step(
      'workspace files',
      workspaceProven,
      primary
        ? [
            `workspace=${primary.workspacePath}`,
            `files=${primary.fileCount}`,
            `markers=${primary.structureMarkersFound.join(', ')}`,
          ]
        : [],
      primary
        ? primary.structureMarkersMissing.map((m) => `Missing marker: ${m}`)
        : ['No workspace scanned'],
      workspaceProven ? undefined : 'files→workspace',
    ),
  );

  const runtimePath = workspacePrefix ? `${workspacePrefix}/runtime/dev-server.mjs` : null;
  const runtimeFile = primary?.artifactFiles.find((f) => f.relativePath.includes('runtime/dev-server'));
  const runtimeProven = runtimeFile?.generated === true;
  chain.push(
    step(
      'runtime contract',
      runtimeProven,
      runtimeProven ? [`runtime stub at ${runtimePath}`] : [],
      runtimeProven ? [] : [`Missing ${runtimePath ?? 'runtime/dev-server.mjs'}`],
      runtimeProven ? undefined : 'workspace→runtime',
    ),
  );

  const previewPath = workspacePrefix ? `${workspacePrefix}/verification/run-verify.mjs` : null;
  const previewFile = primary?.artifactFiles.find((f) => f.relativePath.includes('run-verify'));
  const previewProven = previewFile?.generated === true;
  chain.push(
    step(
      'preview contract',
      previewProven,
      previewProven ? [`preview probe at ${previewPath}`] : [],
      previewProven ? [] : [`Missing ${previewPath ?? 'verification/run-verify.mjs'}`],
      previewProven ? undefined : 'runtime→preview',
    ),
  );

  const verifyPath = workspacePrefix ? `${workspacePrefix}/verification/build-verification.json` : null;
  const verifyFile = primary?.artifactFiles.find((f) =>
    f.relativePath.includes('verification/build-verification.json'),
  );
  const verificationProven = verifyFile?.generated === true;
  chain.push(
    step(
      'verification contract',
      verificationProven,
      verificationProven ? [`verification artifact at ${verifyPath}`] : [],
      verificationProven ? [] : [`Missing ${verifyPath ?? 'verification/build-verification.json'}`],
      verificationProven ? undefined : 'preview→verification',
    ),
  );

  return chain;
}

export function resolveFirstBrokenChainLink(
  chain: readonly MaterializationChainStep[],
): string | null {
  for (const stepEntry of chain) {
    if (!stepEntry.proven && stepEntry.firstBrokenLink) {
      return stepEntry.firstBrokenLink;
    }
  }
  const firstUnproven = chain.find((s) => !s.proven);
  return firstUnproven?.firstBrokenLink ?? null;
}
