/**
 * World 2 Dry-Run Execution Composer → Execution Package Runtime bridge.
 * Adapter only — execution_package_runtime remains the authoritative execution package owner.
 */

import type { ExecutionPackage, PackageRiskLevel } from '../execution-runtime/types.js';
import type { World2DryRunExecutionPackage } from './world2-dry-run-execution-composer-types.js';

export const EXECUTION_PACKAGE_AUTHORITATIVE_OWNER = 'execution_package_runtime';
export const WORLD2_DRY_RUN_COMPOSER_ADAPTER_ROLE = 'composer_adapter_view_layer';

export interface World2DryRunExecutionPackageBridgeOptions {
  requestedBy?: string;
  requestText?: string;
}

function resolvePackageRiskLevel(
  finalReadinessState: World2DryRunExecutionPackage['finalReadinessState'],
): PackageRiskLevel {
  switch (finalReadinessState) {
    case 'DRY_RUN_PACKAGE_BLOCKED':
    case 'NOT_READY':
      return 'CRITICAL';
    case 'DRY_RUN_PACKAGE_READY_WITH_WARNINGS':
    case 'INSUFFICIENT_EVIDENCE':
      return 'MEDIUM';
    case 'DRY_RUN_PACKAGE_READY':
    default:
      return 'LOW';
  }
}

export function mapWorld2DryRunPackageToExecutionPackage(
  dryRunPackage: World2DryRunExecutionPackage,
  options: World2DryRunExecutionPackageBridgeOptions = {},
): ExecutionPackage {
  const requiresWrite = dryRunPackage.changeMaterializationOperation !== null;

  return {
    packageId: dryRunPackage.packageId,
    requestedBy: options.requestedBy ?? 'world2_dry_run_execution_composer',
    requestText:
      options.requestText ??
      'World 2 dry-run execution package adapted for execution_package_runtime (composer is adapter only).',
    executionIntent: 'WORLD2_DRY_RUN_PACKAGE_RUNTIME_HANDOFF',
    targetDomain: 'world2_disposable_workspace',
    requestedAction: 'DRY_RUN_PACKAGE_ADAPTATION',
    riskLevel: resolvePackageRiskLevel(dryRunPackage.finalReadinessState),
    requiresWrite,
    requiresCommand: false,
    requiresRecovery: dryRunPackage.rollbackSteps.length > 0,
    requiresAutonomy: false,
    metadata: {
      bridgeSource: 'world2_dry_run_execution_composer',
      adapterRole: WORLD2_DRY_RUN_COMPOSER_ADAPTER_ROLE,
      authoritativeExecutionPackageOwner: EXECUTION_PACKAGE_AUTHORITATIVE_OWNER,
      workspaceId: dryRunPackage.workspaceId,
      finalReadinessState: dryRunPackage.finalReadinessState,
      orderedStepCount: String(dryRunPackage.orderedSteps.length),
      realExecutionPerformed: 'false',
    },
  };
}
