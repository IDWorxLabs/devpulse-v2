/**
 * Workspace Materialization Stabilizer V1 — auditor.
 *
 * Orchestrates every individual validator check into a single audit pass over the workspace.
 * Read-only: never repairs, never writes to disk.
 */

import { existsSync, statSync } from 'node:fs';
import type {
  WorkspaceMaterializationAuditEvidence,
  WorkspaceMaterializationAuditInput,
} from './workspace-materialization-types.js';
import {
  checkAppEntry,
  checkFeatureModuleFiles,
  checkFeatureRouter,
  checkImportsResolve,
  checkManifest,
  checkRegistryAndRoutes,
  checkRootFiles,
  checkWorkspaceCorruption,
  featureModulesFromDisk,
  featureModulesFromManifest,
  readManifest,
} from './workspace-materialization-validator.js';

export function auditWorkspaceMaterialization(
  input: WorkspaceMaterializationAuditInput,
): WorkspaceMaterializationAuditEvidence {
  const { workspaceDir } = input;

  const workspaceExists = existsSync(workspaceDir) && statSync(workspaceDir).isDirectory();
  const corruption = workspaceExists
    ? checkWorkspaceCorruption(workspaceDir)
    : { corrupted: true, reasons: ['The generated workspace directory does not exist.'] };

  if (corruption.corrupted) {
    return {
      readOnly: true,
      workspaceDir,
      workspaceExists,
      corrupted: true,
      corruptionReasons: corruption.reasons,
      manifestFound: false,
      manifestParseError: null,
      featureModules: [],
      findings: [],
      filesChecked: 0,
    };
  }

  const manifestResult = readManifest(workspaceDir);
  const featureModules = manifestResult.found && manifestResult.manifest
    ? featureModulesFromManifest(manifestResult.manifest)
    : featureModulesFromDisk(workspaceDir);

  const findings = [
    ...checkRootFiles(workspaceDir),
    ...checkAppEntry(workspaceDir, featureModules),
    ...checkFeatureRouter(workspaceDir),
    ...checkFeatureModuleFiles(workspaceDir, featureModules),
    ...checkRegistryAndRoutes(workspaceDir, featureModules),
    ...checkImportsResolve(workspaceDir, featureModules),
    ...checkManifest(workspaceDir, manifestResult, featureModules),
  ];

  const filesChecked =
    6 /* root files */ + featureModules.length * 5 /* component/service/types/validation/barrel */;

  return {
    readOnly: true,
    workspaceDir,
    workspaceExists,
    corrupted: false,
    corruptionReasons: [],
    manifestFound: manifestResult.found,
    manifestParseError: manifestResult.parseError,
    featureModules,
    findings,
    filesChecked,
  };
}
