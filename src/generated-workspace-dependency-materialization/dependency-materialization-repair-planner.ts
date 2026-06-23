/**
 * Dependency materialization repair planner (Phase 26.78).
 */

import type {
  DependencyMaterializationRepairPlan,
  DependencyPresenceScan,
  PackageManagerResolution,
  RepairRiskLevel,
} from './generated-workspace-dependency-materialization-types.js';
import { installCommandForLockfile } from './package-manager-resolver.js';

export function buildDependencyMaterializationRepairPlan(input: {
  workspaceRoot: string;
  packageManager: PackageManagerResolution;
  presence: DependencyPresenceScan;
  allowAutoInstall?: boolean;
}): DependencyMaterializationRepairPlan {
  const missing = [
    ...input.presence.missingRuntimeDependencies,
    ...input.presence.importGraphMissingModules,
  ];
  const uniqueMissing = [...new Set(missing)];

  const installCommand = installCommandForLockfile(
    input.packageManager.packageManager,
    input.presence.lockfileType,
  );

  let reason = input.presence.dependencyStateReason;
  let expectedEffect = 'Install declared dependencies so runtime startup can resolve modules.';
  let riskLevel: RepairRiskLevel = 'MEDIUM';
  let shouldAutoRun = false;

  if (input.presence.dependencyState === 'DEPENDENCIES_READY') {
    return {
      readOnly: true,
      installCommand,
      installCwd: input.workspaceRoot,
      packageManager: input.packageManager.packageManager,
      reason: 'Dependencies already ready — no install required.',
      expectedEffect: 'Runtime startup may proceed without dependency install.',
      riskLevel: 'LOW',
      shouldAutoRun: false,
      missingModulesSummary: 'none',
    };
  }

  if (input.presence.dependencyState === 'PACKAGE_MANIFEST_MISSING') {
    reason = 'Materialize package.json in generated workspace before dependency install.';
    expectedEffect = 'Enable dependency declaration and install.';
    riskLevel = 'HIGH';
  } else if (input.presence.dependencyState === 'INSTALL_REQUIRED') {
    reason = 'node_modules missing — install required before APPLICATION_BOOTS.';
    riskLevel = 'MEDIUM';
  } else if (input.presence.dependencyState === 'MODULE_RESOLUTION_FAILED') {
    reason = `Module resolution failed for: ${uniqueMissing.join(', ') || 'unknown modules'}`;
    expectedEffect = 'After install, re-run bounded startup probe.';
  }

  // Default shouldAutoRun=false; only true if explicitly allowed AND safe generated-workspace-only install
  if (input.allowAutoInstall === true && input.presence.dependencyState === 'INSTALL_REQUIRED') {
    shouldAutoRun = true;
    riskLevel = 'MEDIUM';
  }

  return {
    readOnly: true,
    installCommand,
    installCwd: input.workspaceRoot,
    packageManager: input.packageManager.packageManager,
    reason,
    expectedEffect,
    riskLevel,
    shouldAutoRun,
    missingModulesSummary: uniqueMissing.length > 0 ? uniqueMissing.join(', ') : 'node_modules absent',
  };
}
