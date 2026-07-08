/**
 * BUILD_REALITY_AUTOFIX_ENGINE_V1 — evidence-driven repair planning.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type {
  BuildRealityAutofixEvidence,
  BuildRealityAutofixFailureClass,
  BuildRealityAutofixRepairPlan,
} from './build-reality-autofix-types.js';
import {
  BUILD_REALITY_AUTOFIX_PLAYWRIGHT_INSTALL_COMMAND,
} from './build-reality-autofix-types.js';
import { selectPrimaryFailureClass } from './build-reality-autofix-classifier.js';
import type { BuildRealityAutofixFailureFinding } from './build-reality-autofix-types.js';

const BLOCKED_ENVIRONMENT_CLASSES = new Set<BuildRealityAutofixFailureClass>([
  'PLAYWRIGHT_OR_BROWSER_ENVIRONMENT_FAILURE',
]);

const HARNESS_ONLY_CLASSES = new Set<BuildRealityAutofixFailureClass>([
  'VALIDATOR_HARNESS_FAILURE',
]);

export function planBuildRealityRepair(input: {
  findings: BuildRealityAutofixFailureFinding[];
  evidence: BuildRealityAutofixEvidence;
}): BuildRealityAutofixRepairPlan {
  const primaryFailureClass = selectPrimaryFailureClass(input.findings);
  const primaryFinding =
    input.findings.find((finding) => finding.failureClass === primaryFailureClass) ??
    input.findings[0];

  if (BLOCKED_ENVIRONMENT_CLASSES.has(primaryFailureClass)) {
    return {
      readOnly: true,
      primaryFailureClass,
      primaryRootCause: primaryFinding?.detail ?? 'Playwright browser environment unavailable',
      actions: [],
      blockedReason: 'Environment setup required — no safe code patch available',
      blockedCommand: BUILD_REALITY_AUTOFIX_PLAYWRIGHT_INSTALL_COMMAND,
    };
  }

  if (HARNESS_ONLY_CLASSES.has(primaryFailureClass)) {
    return {
      readOnly: true,
      primaryFailureClass,
      primaryRootCause: primaryFinding?.detail ?? 'Validator harness failure',
      actions: [
        {
          readOnly: true,
          actionId: 'repair-validator-harness',
          failureClass: primaryFailureClass,
          description: 'Repair validator harness state handling — do not patch generated app',
          targetFiles: [],
          safe: true,
        },
      ],
      blockedReason: null,
      blockedCommand: null,
    };
  }

  if (primaryFailureClass === 'UNKNOWN_FAILURE' && !hasActionableWorkspaceEvidence(input.evidence)) {
    return {
      readOnly: true,
      primaryFailureClass,
      primaryRootCause: primaryFinding?.detail ?? 'Unknown failure without actionable evidence',
      actions: [],
      blockedReason: 'No evidence-backed safe patch available',
      blockedCommand: null,
    };
  }

  const actions = buildActionsForClass(primaryFailureClass, input.evidence);
  return {
    readOnly: true,
    primaryFailureClass,
    primaryRootCause: primaryFinding?.detail ?? primaryFailureClass,
    actions,
    blockedReason: actions.length === 0 ? 'No bounded repair action derived from evidence' : null,
    blockedCommand: null,
  };
}

function hasActionableWorkspaceEvidence(evidence: BuildRealityAutofixEvidence): boolean {
  return Boolean(evidence.workspaceDir && existsSync(evidence.workspaceDir));
}

function buildActionsForClass(
  failureClass: BuildRealityAutofixFailureClass,
  evidence: BuildRealityAutofixEvidence,
): BuildRealityAutofixRepairPlan['actions'] {
  const workspaceDir = evidence.workspaceDir;
  if (!workspaceDir) return [];

  switch (failureClass) {
    case 'TYPESCRIPT_COMPILE_FAILURE':
    case 'IMPORT_EXPORT_MISMATCH':
      return [
        {
          readOnly: true,
          actionId: 'repair-typescript-import-export',
          failureClass,
          description: 'Repair import/export paths or duplicate imports from TypeScript evidence',
          targetFiles: collectTypeScriptTargets(workspaceDir, evidence.typescriptOutput),
          safe: true,
        },
      ];
    case 'MISSING_FILE_OR_MODULE':
      return [
        {
          readOnly: true,
          actionId: 'repair-missing-module-or-path',
          failureClass,
          description: 'Create minimal contract-required module stub or correct import path',
          targetFiles: collectMissingModuleTargets(workspaceDir, evidence.typescriptOutput),
          safe: true,
        },
      ];
    case 'ROUTE_OR_ROOT_MOUNT_MISMATCH':
    case 'CONTRACT_PRIMARY_FEATURE_NOT_RENDERED':
      return [
        {
          readOnly: true,
          actionId: 'repair-root-mount-from-contract',
          failureClass,
          description: 'Repair App.tsx root mount to contract-primary feature surface',
          targetFiles: [join(workspaceDir, 'src/App.tsx'), join(workspaceDir, 'src/features/registry.ts')],
          safe: true,
        },
      ];
    case 'DOM_INTERACTION_FAILURE':
      return [
        {
          readOnly: true,
          actionId: 'repair-dom-interaction-evidence',
          failureClass,
          description: 'Repair interaction selectors, data attributes, or display wiring from DOM evidence',
          targetFiles: collectDomInteractionTargets(workspaceDir, evidence),
          safe: true,
        },
      ];
    case 'PREVIEW_SERVER_FAILURE':
      return [
        {
          readOnly: true,
          actionId: 'repair-preview-session-lifecycle',
          failureClass,
          description: 'Repair preview session lifecycle markers when evidence points to stale registration',
          targetFiles: [],
          safe: false,
        },
      ];
    case 'MATERIALIZATION_FAILURE':
      return [
        {
          readOnly: true,
          actionId: 'repair-materialization-integrity',
          failureClass,
          description: 'Repair missing manifest or registry artifacts when contract evidence exists',
          targetFiles: [
            join(workspaceDir, 'src/features/registry.ts'),
            join(workspaceDir, 'universal-feature-contract.json'),
          ],
          safe: false,
        },
      ];
    default:
      return [];
  }
}

function collectTypeScriptTargets(workspaceDir: string, output: string | null): string[] {
  const files = new Set<string>();
  const appPath = join(workspaceDir, 'src/App.tsx');
  if (existsSync(appPath)) files.add(appPath);

  if (output) {
    for (const match of output.matchAll(/(?:\.tsx?|\.jsx?):\d+:\d+/g)) {
      const token = match[0]!.split(':')[0]!;
      if (token.startsWith('src/')) {
        files.add(join(workspaceDir, token));
      }
    }
    for (const match of output.matchAll(/(?:src[/\\][\w./\\-]+\.(?:tsx?|jsx?))/g)) {
      files.add(join(workspaceDir, match[0]!.replace(/\\/g, '/')));
    }
  }

  const featuresDir = join(workspaceDir, 'src/features');
  if (existsSync(featuresDir)) {
    for (const rel of ['registry.ts', 'index.ts']) {
      const candidate = join(featuresDir, rel);
      if (existsSync(candidate)) files.add(candidate);
    }
  }
  return [...files];
}

function collectMissingModuleTargets(workspaceDir: string, output: string | null): string[] {
  const targets = collectTypeScriptTargets(workspaceDir, output);
  if (output) {
    const importMatch = output.match(/cannot find module ['"]([^'"]+)['"]/i);
    const spec = importMatch?.[1];
    if (spec?.startsWith('.')) {
      const resolved = join(workspaceDir, 'src', spec.replace(/^\.\//, ''));
      targets.push(`${resolved}.tsx`, `${resolved}.ts`, `${join(resolved, 'index.ts')}`);
    }
  }
  return [...new Set(targets)];
}

function collectDomInteractionTargets(
  workspaceDir: string,
  evidence: BuildRealityAutofixEvidence,
): string[] {
  const primaryModuleId =
    evidence.e2eReport?.expectations.primaryModuleId ??
    readPrimaryModuleFromContract(workspaceDir);
  if (!primaryModuleId) {
    return [join(workspaceDir, 'src/App.tsx')];
  }
  const featureDir = join(workspaceDir, 'src/features', primaryModuleId);
  if (!existsSync(featureDir)) {
    return [join(workspaceDir, 'src/App.tsx')];
  }
  return [join(featureDir, `${resolveFeatureComponentName(primaryModuleId)}.tsx`), join(workspaceDir, 'src/App.tsx')];
}

function readPrimaryModuleFromContract(workspaceDir: string): string | null {
  const contractPath = join(workspaceDir, 'universal-feature-contract.json');
  if (!existsSync(contractPath)) return null;
  try {
    const contract = JSON.parse(readFileSync(contractPath, 'utf8')) as {
      entities?: Array<{ slug?: string }>;
    };
    return contract.entities?.[0]?.slug ?? null;
  } catch {
    return null;
  }
}

function moduleIdToPascal(moduleId: string): string {
  return moduleId
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function resolveFeatureComponentName(moduleId: string): string {
  const pascal = moduleIdToPascal(moduleId);
  return pascal.endsWith('Feature') ? pascal : `${pascal}Feature`;
}

export function isUnsafeRepairPlan(plan: BuildRealityAutofixRepairPlan): boolean {
  if (plan.blockedReason && plan.actions.length === 0) {
    return plan.primaryFailureClass === 'UNKNOWN_FAILURE';
  }
  return plan.actions.some((action) => !action.safe) && plan.actions.length === 1;
}
