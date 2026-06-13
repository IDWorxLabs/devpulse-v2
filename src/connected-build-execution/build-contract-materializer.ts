/**
 * Build Contract Materializer — derive required materialization evidence from build-ready contract.
 * Does NOT generate code — defines what must exist to prove materialization.
 */

import type { BuildReadyExecutionContract, BuildUnit } from '../requirements-to-plan-execution-contract/requirements-to-plan-contract-types.js';
import type {
  BuildMaterializationAssessment,
  ExpectedArtifactEntry,
  MaterializationState,
} from './connected-build-execution-types.js';
import { WORKSPACE_ROOT_DIR } from './connected-build-execution-registry.js';

function layerCategory(layer: BuildUnit['layer']): ExpectedArtifactEntry['category'] {
  switch (layer) {
    case 'FRONTEND':
      return 'frontend';
    case 'BACKEND':
      return 'backend';
    case 'DATABASE':
      return 'database';
    case 'AUTH':
      return 'auth';
    case 'API':
      return 'api';
    case 'VERIFICATION':
      return 'verification';
    case 'DOCUMENTATION':
      return 'documentation';
    default:
      return 'configuration';
  }
}

function artifactsForUnit(
  contract: BuildReadyExecutionContract,
  workspaceRoot: string,
  unit: BuildUnit,
): ExpectedArtifactEntry[] {
  const category = layerCategory(unit.layer);
  const specs: Array<{ suffix: string; file: string }> = [];

  switch (unit.layer) {
    case 'FRONTEND':
      specs.push({ suffix: 'app', file: 'src/App.tsx' });
      specs.push({ suffix: 'screens', file: 'src/screens/index.ts' });
      break;
    case 'BACKEND':
      specs.push({ suffix: 'server', file: 'src/server/index.ts' });
      specs.push({ suffix: 'routes', file: 'src/server/routes.ts' });
      break;
    case 'DATABASE':
      specs.push({ suffix: 'schema', file: 'src/db/schema.ts' });
      break;
    case 'AUTH':
      specs.push({ suffix: 'auth', file: 'src/auth/index.ts' });
      break;
    case 'API':
      specs.push({ suffix: 'api', file: 'src/api/index.ts' });
      break;
    case 'VERIFICATION':
      specs.push({ suffix: 'verify', file: 'verification/build-verification.json' });
      break;
    case 'DOCUMENTATION':
      specs.push({ suffix: 'readme', file: 'README.md' });
      break;
    default:
      specs.push({ suffix: 'config', file: 'package.json' });
  }

  return specs.map((spec) => ({
    readOnly: true as const,
    artifactId: `${unit.unitId}-${spec.suffix}`,
    buildUnitId: unit.unitId,
    contractId: contract.contractId,
    category,
    expectedPath: `${workspaceRoot}/${spec.file}`.replace(/\\/g, '/'),
    layer: unit.layer,
  }));
}

export function materializeBuildContractExpectations(
  contract: BuildReadyExecutionContract,
): BuildMaterializationAssessment {
  const workspaceRoot = `${WORKSPACE_ROOT_DIR}/${contract.contractId}`;
  const expectedArtifacts: ExpectedArtifactEntry[] = [];

  for (const unit of contract.buildUnits) {
    if (unit.layer === 'DOCUMENTATION') continue;
    expectedArtifacts.push(...artifactsForUnit(contract, workspaceRoot, unit));
  }

  expectedArtifacts.unshift({
    readOnly: true,
    artifactId: `${contract.contractId}-package`,
    buildUnitId: contract.buildUnits[0]?.unitId ?? 'unit-001',
    contractId: contract.contractId,
    category: 'configuration',
    expectedPath: `${workspaceRoot}/package.json`.replace(/\\/g, '/'),
    layer: 'DOCUMENTATION',
  });

  expectedArtifacts.push({
    readOnly: true,
    artifactId: `${contract.contractId}-manifest`,
    buildUnitId: contract.buildUnits[0]?.unitId ?? 'unit-001',
    contractId: contract.contractId,
    category: 'configuration',
    expectedPath: `${workspaceRoot}/build-manifest.json`.replace(/\\/g, '/'),
    layer: 'VERIFICATION',
  });

  const expectedFiles = expectedArtifacts.map((a) => a.expectedPath);
  const workspaceTargets = [workspaceRoot.replace(/\\/g, '/')];

  let materializationState: MaterializationState = 'NOT_STARTED';
  if (expectedArtifacts.length > 0) materializationState = 'PARTIAL';

  return {
    readOnly: true,
    contractId: contract.contractId,
    buildUnits: contract.buildUnits.map((u) => u.unitId),
    expectedArtifacts,
    expectedFiles,
    workspaceTargets,
    executionOrder: contract.executionOrder,
    materializationState,
  };
}

export function deriveMaterializationStateFromEvidence(input: {
  expectedCount: number;
  observedCount: number;
  linkageConnected: boolean;
}): MaterializationState {
  if (input.observedCount === 0) return 'NOT_STARTED';
  if (input.linkageConnected && input.observedCount >= input.expectedCount) return 'MATERIALIZED';
  if (input.observedCount > 0) return 'PARTIAL';
  return 'NOT_STARTED';
}
