/**
 * Rule-based build package generation — no AI, LLM, code generation, or execution.
 */

import type { ArchitectureBlueprint, ArchitectureComponent } from '../product-architect/types.js';
import { DUPLICATE_RISK_PREFIX as ARCHITECT_DUP_PREFIX } from '../product-architect/types.js';
import type {
  BuildPackage,
  BuildPackageGenerationResult,
  BuildPackageStatus,
  PackageDuplicateContext,
} from './types.js';
import { DUPLICATE_RISK_PREFIX } from './types.js';

function createPackageId(): string {
  return `pkg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function createGenerationId(): string {
  return `gen-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function componentsByType(blueprint: ArchitectureBlueprint, type: string): ArchitectureComponent[] {
  return blueprint.components.filter((c) => c.type === type);
}

function deriveObjective(blueprint: ArchitectureBlueprint, moduleName: string): string {
  const screens = componentsByType(blueprint, 'SCREEN')
    .filter((s) => s.name.toLowerCase().includes(moduleName.replace(/Module$/i, '').toLowerCase()))
    .map((s) => s.name);
  if (screens.length > 0) {
    return `Implement ${moduleName} supporting ${screens.join(', ')}`;
  }
  return `Implement ${moduleName} per architecture blueprint ${blueprint.blueprintId}`;
}

export function detectExistingCapabilities(context: PackageDuplicateContext): string[] {
  const capabilities = new Set<string>();

  for (const summary of context.brainSummaries) {
    const lower = summary.toLowerCase();
    const matches = lower.match(/\b([a-z]+(?:module|service|integration|screen|flow))\b/gi) ?? [];
    for (const m of matches) capabilities.add(normalizeName(m));
  }

  for (const cap of context.vaultCapabilities) {
    capabilities.add(normalizeName(cap));
  }

  for (const warning of context.architectDuplicateWarnings) {
    const nameMatch = warning.match(/:\s*(\S+)/);
    if (nameMatch?.[1]) capabilities.add(normalizeName(nameMatch[1]));
  }

  return [...capabilities];
}

export function detectPotentialDuplicates(
  packageName: string,
  context: PackageDuplicateContext,
): string[] {
  const existing = detectExistingCapabilities(context);
  const normalized = normalizeName(packageName);
  const warnings: string[] = [];

  for (const cap of existing) {
    if (cap === normalized || cap.includes(normalized) || normalized.includes(cap)) {
      warnings.push(
        `${DUPLICATE_RISK_PREFIX}: ${packageName} may already exist — recommend integration, extension, or consolidation`,
      );
      break;
    }
  }

  const corpus = [
    ...context.brainSummaries,
    ...context.vaultCapabilities,
    ...context.architectDuplicateWarnings,
  ]
    .join(' ')
    .toLowerCase();

  const baseName = packageName.replace(/Module|Service|Integration/gi, '').toLowerCase();
  if (baseName.length > 3 && corpus.includes(baseName) && warnings.length === 0) {
    warnings.push(
      `${DUPLICATE_RISK_PREFIX}: ${packageName} may overlap existing capability "${baseName}" — recommend integration, extension, or consolidation`,
    );
  }

  return warnings;
}

export function generateModulePackages(blueprint: ArchitectureBlueprint): BuildPackage[] {
  const modules = componentsByType(blueprint, 'MODULE');
  const packages: BuildPackage[] = [];

  for (const mod of modules) {
    packages.push({
      packageId: createPackageId(),
      createdAt: Date.now(),
      blueprintId: blueprint.blueprintId,
      objective: deriveObjective(blueprint, mod.name),
      modules: [mod.name],
      dependencies: [],
      validationRequirements: [],
      risks: [],
      duplicateRisks: [],
      rollbackRequirements: [],
      status: 'READY',
      warnings: [],
      errors: [],
    });
  }

  if (packages.length === 0) {
    packages.push({
      packageId: createPackageId(),
      createdAt: Date.now(),
      blueprintId: blueprint.blueprintId,
      objective: `Implement core build package for blueprint ${blueprint.blueprintId}`,
      modules: ['CoreModule'],
      dependencies: [],
      validationRequirements: [],
      risks: [],
      duplicateRisks: [],
      rollbackRequirements: [],
      status: 'READY',
      warnings: ['No MODULE components in blueprint — default CoreModule package created.'],
      errors: [],
    });
  }

  return packages;
}

export function generateDependencyRequirements(
  blueprint: ArchitectureBlueprint,
  pkg: BuildPackage,
): string[] {
  const deps: string[] = [];
  const integrations = componentsByType(blueprint, 'INTEGRATION');
  const services = componentsByType(blueprint, 'SERVICE');
  const dataModels = componentsByType(blueprint, 'DATA_MODEL');

  for (const integration of integrations) {
    deps.push(`Requires integration: ${integration.name}`);
  }
  for (const service of services) {
    if (service.name.toLowerCase().includes(pkg.modules[0]?.replace(/Module$/i, '').toLowerCase() ?? '')) {
      deps.push(`Depends on service: ${service.name}`);
    }
  }
  for (const model of dataModels) {
    deps.push(`Requires data model: ${model.name}`);
  }

  const flows = componentsByType(blueprint, 'FLOW');
  for (const flow of flows) {
    deps.push(`Supports flow: ${flow.name}`);
  }

  return [...new Set(deps)];
}

export function generateValidationRequirements(
  blueprint: ArchitectureBlueprint,
  pkg: BuildPackage,
): string[] {
  const validations: string[] = [
    'Package must pass Verification Loop before execution',
    'Package must comply with Validation Budget Policy',
  ];

  const permissions = componentsByType(blueprint, 'PERMISSION');
  for (const perm of permissions) {
    validations.push(`Validate permission: ${perm.name}`);
  }

  if (pkg.modules.some((m) => /offline/i.test(m))) {
    validations.push('Validate offline mode behavior without network');
  }
  if (pkg.modules.some((m) => /expense/i.test(m))) {
    validations.push('Validate expense CRUD operations');
  }

  return validations;
}

export function generateRiskRequirements(
  blueprint: ArchitectureBlueprint,
  pkg: BuildPackage,
): string[] {
  const risks: string[] = [];

  for (const component of blueprint.components) {
    if (component.warnings.some((w) => w.startsWith(ARCHITECT_DUP_PREFIX))) {
      risks.push(`Architect flagged: ${component.name} duplicate risk`);
    }
  }

  if (blueprint.warnings.some((w) => w.includes('offline'))) {
    risks.push('Offline data consistency risk');
  }
  if (pkg.modules.some((m) => /expense/i.test(m))) {
    risks.push('Financial data accuracy risk');
  }

  return [...new Set(risks)];
}

export function generateRollbackRequirements(_blueprint: ArchitectureBlueprint, pkg: BuildPackage): string[] {
  const rollbacks: string[] = [
    'Snapshot project state before package application',
    'Preserve rollback point in Project Vault',
  ];

  if (pkg.modules.some((m) => /offline/i.test(m))) {
    rollbacks.push('Restore local storage snapshot on rollback');
  }

  return rollbacks;
}

function resolvePackageStatus(pkg: BuildPackage): BuildPackageStatus {
  if (pkg.errors.length > 0) return 'BLOCKED';
  if (pkg.warnings.length > 0 || pkg.duplicateRisks.length > 0) return 'WARN';
  return 'READY';
}

export function generateBuildPackages(
  blueprint: ArchitectureBlueprint,
  duplicateContext?: PackageDuplicateContext,
): BuildPackageGenerationResult {
  const warnings: string[] = [
    'Build Package Generator performs package generation only — no code generation, execution, or project modification.',
  ];
  const errors: string[] = [];

  if (blueprint.errors.length > 0) {
    errors.push(...blueprint.errors);
  }

  const context: PackageDuplicateContext = duplicateContext ?? {
    brainSummaries: [],
    vaultCapabilities: [],
    architectDuplicateWarnings: blueprint.components
      .flatMap((c) => c.warnings)
      .filter((w) => w.startsWith(ARCHITECT_DUP_PREFIX)),
  };

  if (context.architectDuplicateWarnings.length === 0) {
    context.architectDuplicateWarnings = blueprint.components
      .flatMap((c) => c.warnings)
      .filter((w) => w.startsWith(ARCHITECT_DUP_PREFIX));
  }

  const modulePackages = generateModulePackages(blueprint);
  const packages: BuildPackage[] = [];

  for (const pkg of modulePackages) {
    const enriched: BuildPackage = {
      ...pkg,
      dependencies: generateDependencyRequirements(blueprint, pkg),
      validationRequirements: generateValidationRequirements(blueprint, pkg),
      risks: generateRiskRequirements(blueprint, pkg),
      rollbackRequirements: generateRollbackRequirements(blueprint, pkg),
      duplicateRisks: [],
      warnings: [...pkg.warnings],
      errors: [...pkg.errors],
    };

    for (const mod of enriched.modules) {
      const dupWarnings = detectPotentialDuplicates(mod, context);
      for (const w of dupWarnings) {
        enriched.duplicateRisks.push(w);
        enriched.warnings.push(w);
        if (!warnings.includes(w)) warnings.push(w);
      }
    }

    enriched.status = resolvePackageStatus(enriched);
    packages.push(enriched);
  }

  if (packages.length === 0) {
    errors.push('No build packages generated from blueprint.');
  }

  return {
    generationId: createGenerationId(),
    packageCount: packages.length,
    packages,
    warnings,
    errors,
  };
}

export function summarizePackages(result: BuildPackageGenerationResult): string {
  const ready = result.packages.filter((p) => p.status === 'READY').length;
  const warn = result.packages.filter((p) => p.status === 'WARN').length;
  const blocked = result.packages.filter((p) => p.status === 'BLOCKED').length;
  const dupCount = result.packages.reduce((sum, p) => sum + p.duplicateRisks.length, 0);

  return (
    `Generation ${result.generationId}: packages=${result.packageCount} ` +
    `READY=${ready} WARN=${warn} BLOCKED=${blocked} duplicate_risks=${dupCount}`
  );
}
