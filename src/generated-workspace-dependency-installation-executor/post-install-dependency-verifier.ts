/**
 * Post-install dependency verifier (Phase 26.79).
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { assessGeneratedWorkspaceDependencyMaterialization } from '../generated-workspace-dependency-materialization/index.js';
import type { GeneratedWorkspaceDependencyMaterializationReport } from '../generated-workspace-dependency-materialization/generated-workspace-dependency-materialization-types.js';
import type {
  DependencyInstallProcessResult,
  PostInstallDependencyVerification,
} from './generated-workspace-dependency-installation-executor-types.js';
import type { ConnectedBuildExecutionReport } from '../connected-build-execution/connected-build-execution-types.js';

export function verifyPostInstallDependencies(input: {
  rootDir: string;
  workspacePath: string;
  workspaceId: string;
  workspaceAbs: string;
  beforeMaterialization: GeneratedWorkspaceDependencyMaterializationReport;
  processResult: DependencyInstallProcessResult;
  buildMaterializationReport: ConnectedBuildExecutionReport;
}): PostInstallDependencyVerification {
  const beforeState = input.beforeMaterialization.dependencyState;
  const dryRunSkipped = input.processResult.dryRun;

  if (dryRunSkipped) {
    return {
      readOnly: true,
      beforeState,
      afterState: beforeState,
      dependenciesReady: input.beforeMaterialization.dependenciesReady,
      nodeModulesExists: input.beforeMaterialization.presence.nodeModulesExists,
      missingModulesAfterInstall: [
        ...input.beforeMaterialization.presence.missingRuntimeDependencies,
        ...input.beforeMaterialization.presence.importGraphMissingModules,
      ],
      installSucceeded: false,
      verificationSucceeded: false,
      verificationReason: 'DRY_RUN — no install executed; dependency state unchanged.',
      afterMaterialization: input.beforeMaterialization,
    };
  }

  if (!input.processResult.installSucceeded) {
    return {
      readOnly: true,
      beforeState,
      afterState: beforeState,
      dependenciesReady: false,
      nodeModulesExists: existsSync(join(input.workspaceAbs, 'node_modules')),
      missingModulesAfterInstall: [
        ...input.beforeMaterialization.presence.missingRuntimeDependencies,
        ...input.beforeMaterialization.presence.importGraphMissingModules,
      ],
      installSucceeded: false,
      verificationSucceeded: false,
      verificationReason: input.processResult.failureReason ?? 'Install process failed.',
      afterMaterialization: input.beforeMaterialization,
    };
  }

  const afterAssessment = assessGeneratedWorkspaceDependencyMaterialization({
    rootDir: input.rootDir,
    buildMaterializationReport: input.buildMaterializationReport,
    workspacePath: input.workspacePath,
    workspaceId: input.workspaceId,
    skipHistoryRecording: true,
  });

  const afterReport = afterAssessment.report;
  const missingAfter = [
    ...afterReport.presence.missingRuntimeDependencies,
    ...afterReport.presence.importGraphMissingModules,
  ];

  const verificationSucceeded =
    afterReport.dependenciesReady &&
    afterReport.presence.nodeModulesExists &&
    missingAfter.length === 0;

  return {
    readOnly: true,
    beforeState,
    afterState: afterReport.dependencyState,
    dependenciesReady: afterReport.dependenciesReady,
    nodeModulesExists: afterReport.presence.nodeModulesExists,
    missingModulesAfterInstall: missingAfter,
    installSucceeded: input.processResult.installSucceeded,
    verificationSucceeded,
    verificationReason: verificationSucceeded
      ? 'Post-install dependency scan confirms DEPENDENCIES_READY.'
      : `Post-install state: ${afterReport.dependencyState} — ${afterReport.presence.dependencyStateReason}`,
    afterMaterialization: afterReport,
  };
}
