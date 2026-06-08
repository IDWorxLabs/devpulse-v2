/**
 * Rule-based implementation strategy generation — no AI, LLM, code generation, or execution.
 */

import type { BuildPackage, BuildPackageGenerationResult } from '../build-package-generator/types.js';
import { DUPLICATE_RISK_PREFIX as PACKAGE_DUP_PREFIX } from '../build-package-generator/types.js';
import type {
  ImplementationPhase,
  ImplementationStrategy,
  StrategyDuplicateContext,
  StrategyStatus,
} from './types.js';
import { DUPLICATE_RISK_PREFIX } from './types.js';

function createStrategyId(): string {
  return `strategy-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createPhaseId(order: number): string {
  return `phase-${order}-${Date.now().toString(36).slice(-4)}`;
}

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function modulePriority(moduleName: string): number {
  if (/offline|storage|sync/i.test(moduleName)) return 1;
  if (/auth|login|security/i.test(moduleName)) return 2;
  if (/core|base|foundation/i.test(moduleName)) return 3;
  if (/expense|track|dashboard|feature/i.test(moduleName)) return 4;
  if (/report|analytics|notification/i.test(moduleName)) return 5;
  return 4;
}

export function detectExistingCapabilities(context: StrategyDuplicateContext): string[] {
  const capabilities = new Set<string>();

  for (const summary of context.brainSummaries) {
    const lower = summary.toLowerCase();
    const matches = lower.match(/\b([a-z]+(?:module|service|integration|screen|flow|package))\b/gi) ?? [];
    for (const m of matches) capabilities.add(normalizeName(m));
  }

  for (const cap of context.vaultCapabilities) {
    capabilities.add(normalizeName(cap));
  }

  for (const warning of context.packageDuplicateWarnings) {
    const nameMatch = warning.match(/:\s*(\S+)/);
    if (nameMatch?.[1]) capabilities.add(normalizeName(nameMatch[1]));
  }

  return [...capabilities];
}

export function detectPotentialDuplicates(
  moduleName: string,
  context: StrategyDuplicateContext,
): string[] {
  const existing = detectExistingCapabilities(context);
  const normalized = normalizeName(moduleName);
  const warnings: string[] = [];

  for (const cap of existing) {
    if (cap === normalized || cap.includes(normalized) || normalized.includes(cap)) {
      warnings.push(
        `${DUPLICATE_RISK_PREFIX}: ${moduleName} phase may duplicate existing capability — recommend integration, extension, or consolidation`,
      );
      break;
    }
  }

  const corpus = [
    ...context.brainSummaries,
    ...context.vaultCapabilities,
    ...context.packageDuplicateWarnings,
  ]
    .join(' ')
    .toLowerCase();

  const baseName = moduleName.replace(/Module|Service|Integration/gi, '').toLowerCase();
  if (baseName.length > 3 && corpus.includes(baseName) && warnings.length === 0) {
    warnings.push(
      `${DUPLICATE_RISK_PREFIX}: ${moduleName} may overlap existing capability "${baseName}" — recommend integration, extension, or consolidation`,
    );
  }

  return warnings;
}

export function generateBuildOrder(packages: BuildPackage[]): BuildPackage[] {
  return [...packages].sort((a, b) => {
    const priorityA = Math.min(...a.modules.map(modulePriority));
    const priorityB = Math.min(...b.modules.map(modulePriority));
    if (priorityA !== priorityB) return priorityA - priorityB;
    if (a.status === 'BLOCKED' && b.status !== 'BLOCKED') return 1;
    if (b.status === 'BLOCKED' && a.status !== 'BLOCKED') return -1;
    return a.createdAt - b.createdAt;
  });
}

export function generateDependencyOrder(packages: BuildPackage[]): string[] {
  const ordered = generateBuildOrder(packages);
  const packageIds: string[] = [];
  const seen = new Set<string>();

  for (const pkg of ordered) {
    for (const dep of pkg.dependencies) {
      const depModule = dep.replace(/^Requires integration: |^Depends on service: |^Requires data model: |^Supports flow: /i, '').trim();
      if (!seen.has(depModule)) {
        seen.add(depModule);
      }
    }
    if (!seen.has(pkg.packageId)) {
      packageIds.push(pkg.packageId);
      seen.add(pkg.packageId);
    }
  }

  for (const pkg of ordered) {
    if (!packageIds.includes(pkg.packageId)) {
      packageIds.push(pkg.packageId);
    }
  }

  return packageIds;
}

export function generateValidationSequence(packages: BuildPackage[]): string[] {
  const ordered = generateBuildOrder(packages);
  const sequence: string[] = [];

  for (const pkg of ordered) {
    for (const validation of pkg.validationRequirements) {
      if (!sequence.includes(validation)) {
        sequence.push(validation);
      }
    }
  }

  return sequence;
}

export function generateRollbackPlan(packages: BuildPackage[]): string[] {
  const ordered = generateBuildOrder(packages);
  const checkpoints: string[] = [];

  for (let i = 0; i < ordered.length; i++) {
    const pkg = ordered[i];
    const moduleName = pkg.modules[0] ?? 'unknown';
    const rollback =
      pkg.rollbackRequirements[0] ??
      `Rollback checkpoint after ${moduleName} (phase ${i + 1})`;
    checkpoints.push(`Phase ${i + 1}: ${rollback}`);
  }

  checkpoints.push('Final rollback: restore Project Vault snapshot before strategy start');
  return checkpoints;
}

export function generateImplementationPhases(
  packages: BuildPackage[],
  duplicateContext?: StrategyDuplicateContext,
): ImplementationPhase[] {
  const ordered = generateBuildOrder(packages);
  const context: StrategyDuplicateContext = duplicateContext ?? {
    brainSummaries: [],
    vaultCapabilities: [],
    packageDuplicateWarnings: packages.flatMap((p) => p.duplicateRisks),
  };

  if (context.packageDuplicateWarnings.length === 0) {
    context.packageDuplicateWarnings = packages
      .flatMap((p) => p.duplicateRisks)
      .filter((w) => w.startsWith(PACKAGE_DUP_PREFIX));
  }

  const phases: ImplementationPhase[] = [];

  for (let i = 0; i < ordered.length; i++) {
    const pkg = ordered[i];
    const moduleName = pkg.modules[0] ?? `Package-${i + 1}`;
    const order = i + 1;
    const phaseWarnings: string[] = [...pkg.warnings.filter((w) => !w.startsWith(PACKAGE_DUP_PREFIX))];
    const phaseErrors: string[] = [...pkg.errors];

    for (const mod of pkg.modules) {
      const dupWarnings = detectPotentialDuplicates(mod, context);
      phaseWarnings.push(...dupWarnings);
    }

    phases.push({
      phaseId: createPhaseId(order),
      order,
      title: `Phase ${order}: ${moduleName}`,
      objective: pkg.objective,
      packageIds: [pkg.packageId],
      dependencies: [...pkg.dependencies],
      validationRequirements: [...pkg.validationRequirements],
      rollbackCheckpoint: pkg.rollbackRequirements[0] ?? `Checkpoint after ${moduleName}`,
      warnings: phaseWarnings,
      errors: phaseErrors,
    });
  }

  return phases;
}

function resolveStrategyStatus(
  phases: ImplementationPhase[],
  duplicateRisks: string[],
): StrategyStatus {
  if (phases.some((p) => p.errors.length > 0)) return 'BLOCKED';
  if (duplicateRisks.length > 0 || phases.some((p) => p.warnings.length > 0)) return 'WARN';
  return 'READY';
}

export function generateImplementationStrategy(
  generation: BuildPackageGenerationResult,
  duplicateContext?: StrategyDuplicateContext,
): ImplementationStrategy {
  const warnings: string[] = [
    'Implementation Strategy Engine performs strategy generation only — no code generation, execution, or project modification.',
  ];
  const errors: string[] = [];

  if (generation.errors.length > 0) {
    errors.push(...generation.errors);
  }

  if (generation.packages.length === 0) {
    errors.push('No build packages provided — cannot generate implementation strategy.');
    return {
      strategyId: createStrategyId(),
      createdAt: Date.now(),
      phases: [],
      duplicateRisks: [],
      status: 'BLOCKED',
      warnings,
      errors,
    };
  }

  const context: StrategyDuplicateContext = duplicateContext ?? {
    brainSummaries: [],
    vaultCapabilities: [],
    packageDuplicateWarnings: generation.packages.flatMap((p) => p.duplicateRisks),
  };

  const phases = generateImplementationPhases(generation.packages, context);
  const duplicateRisks: string[] = [];

  for (const phase of phases) {
    for (const w of phase.warnings) {
      if (w.startsWith(DUPLICATE_RISK_PREFIX) && !duplicateRisks.includes(w)) {
        duplicateRisks.push(w);
        if (!warnings.includes(w)) warnings.push(w);
      }
    }
  }

  for (const pkg of generation.packages) {
    for (const dr of pkg.duplicateRisks) {
      if (!duplicateRisks.includes(dr)) duplicateRisks.push(dr);
    }
  }

  const status = resolveStrategyStatus(phases, duplicateRisks);

  return {
    strategyId: createStrategyId(),
    createdAt: Date.now(),
    phases,
    duplicateRisks,
    status,
    warnings,
    errors,
  };
}

export function summarizeStrategy(strategy: ImplementationStrategy): string {
  const phaseTitles = strategy.phases.map((p) => p.title).join(' → ');
  return (
    `Strategy ${strategy.strategyId}: phases=${strategy.phases.length} ` +
    `status=${strategy.status} duplicate_risks=${strategy.duplicateRisks.length} ` +
    `order=[${phaseTitles}]`
  );
}
