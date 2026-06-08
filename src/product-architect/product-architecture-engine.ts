/**
 * Rule-based product architecture generation — no AI, LLM, code generation, or execution.
 */

import type { RequirementRecord } from '../requirement-extractor/types.js';
import type {
  ArchitectureBlueprint,
  ArchitectureComponent,
  ArchitectureComponentType,
  DuplicateDetectionContext,
  GenerateBlueprintInput,
} from './types.js';
import { DUPLICATE_CHECK_TYPES, DUPLICATE_RISK_PREFIX } from './types.js';

function createComponentId(type: string): string {
  return `comp-${type.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function createBlueprintId(): string {
  return `blueprint-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function makeComponent(
  type: ArchitectureComponentType,
  name: string,
  description: string,
  sourceRequirementIds: string[],
): ArchitectureComponent {
  return {
    componentId: createComponentId(type),
    createdAt: Date.now(),
    type,
    name,
    description,
    sourceRequirementIds,
    warnings: [],
    errors: [],
  };
}

function reqIds(requirements: RequirementRecord[], category: string): string[] {
  return requirements.filter((r) => r.category === category).map((r) => r.requirementId);
}

function reqValues(requirements: RequirementRecord[], category: string): string[] {
  return requirements.filter((r) => r.category === category).map((r) => r.value);
}

function normalizeCapabilityName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function detectExistingCapabilities(context: DuplicateDetectionContext): string[] {
  const capabilities = new Set<string>();

  for (const summary of context.brainSummaries) {
    const lower = summary.toLowerCase();
    const moduleMatches = lower.match(/\b([a-z]+module)\b/gi) ?? [];
    for (const m of moduleMatches) capabilities.add(normalizeCapabilityName(m));

    const screenMatches = lower.match(/\b([a-z]+screen)\b/gi) ?? [];
    for (const s of screenMatches) capabilities.add(normalizeCapabilityName(s));

    const serviceMatches = lower.match(/\b([a-z]+service)\b/gi) ?? [];
    for (const s of serviceMatches) capabilities.add(normalizeCapabilityName(s));
  }

  for (const cap of context.vaultCapabilities) {
    capabilities.add(normalizeCapabilityName(cap));
  }

  return [...capabilities];
}

export function detectPotentialDuplicates(
  component: ArchitectureComponent,
  context: DuplicateDetectionContext,
): string[] {
  if (!DUPLICATE_CHECK_TYPES.includes(component.type)) return [];

  const existing = detectExistingCapabilities(context);
  const normalizedName = normalizeCapabilityName(component.name);
  const warnings: string[] = [];

  for (const cap of existing) {
    if (cap === normalizedName || cap.includes(normalizedName) || normalizedName.includes(cap)) {
      warnings.push(
        `${DUPLICATE_RISK_PREFIX}: ${component.name} (${component.type}) may already exist — recommend integration, extension, or consolidation`,
      );
      break;
    }
  }

  const corpus = [...context.brainSummaries, ...context.vaultCapabilities].join(' ').toLowerCase();
  const nameWords = component.name.replace(/([A-Z])/g, ' $1').trim().toLowerCase().split(/\s+/);
  for (const word of nameWords) {
    if (word.length > 4 && corpus.includes(word) && !warnings.length) {
      const baseName = component.name.replace(/Module|Screen|Flow|Service|Integration/gi, '').toLowerCase();
      if (baseName.length > 3 && corpus.includes(baseName)) {
        warnings.push(
          `${DUPLICATE_RISK_PREFIX}: ${component.name} (${component.type}) may overlap existing capability "${baseName}" — recommend integration, extension, or consolidation`,
        );
        break;
      }
    }
  }

  return warnings;
}

export function generateScreens(requirements: RequirementRecord[]): ArchitectureComponent[] {
  const screens: ArchitectureComponent[] = [];
  const features = reqValues(requirements, 'FEATURE');
  const ids = reqIds(requirements, 'FEATURE');

  for (let i = 0; i < features.length; i++) {
    const feature = features[i];
    const id = ids[i] ?? ids[0] ?? '';
    if (/expense/i.test(feature)) {
      screens.push(
        makeComponent('SCREEN', 'ExpenseListScreen', 'List and browse expense entries', [id]),
        makeComponent('SCREEN', 'AddExpenseScreen', 'Create and edit expense entries', [id]),
      );
    } else if (/dashboard/i.test(feature)) {
      screens.push(makeComponent('SCREEN', 'DashboardScreen', 'Overview dashboard for key metrics', [id]));
    } else if (/offline/i.test(feature)) {
      screens.push(makeComponent('SCREEN', 'OfflineStatusScreen', 'Offline mode status and sync queue', [id]));
    } else if (/login|auth/i.test(feature)) {
      screens.push(makeComponent('SCREEN', 'LoginScreen', 'User authentication entry point', [id]));
    } else {
      const screenName = `${feature.replace(/\s+/g, '')}Screen`.replace(/^./, (c) => c.toUpperCase());
      screens.push(makeComponent('SCREEN', screenName, `Screen for ${feature}`, [id]));
    }
  }

  if (screens.length === 0 && requirements.length > 0) {
    screens.push(
      makeComponent('SCREEN', 'HomeScreen', 'Default home screen', [requirements[0].requirementId]),
    );
  }

  return screens;
}

export function generateFlows(requirements: RequirementRecord[]): ArchitectureComponent[] {
  const flows: ArchitectureComponent[] = [];
  const features = reqValues(requirements, 'FEATURE');
  const ids = reqIds(requirements, 'FEATURE');

  for (let i = 0; i < features.length; i++) {
    const feature = features[i];
    const id = ids[i] ?? ids[0] ?? '';
    if (/expense/i.test(feature)) {
      flows.push(makeComponent('FLOW', 'AddExpenseFlow', 'User adds a new expense entry', [id]));
    }
    if (/offline/i.test(feature)) {
      flows.push(makeComponent('FLOW', 'OfflineSyncFlow', 'Sync local data when connectivity returns', [id]));
    }
    if (/login|auth/i.test(feature)) {
      flows.push(makeComponent('FLOW', 'AuthenticationFlow', 'User sign-in and session establishment', [id]));
    }
  }

  const successIds = reqIds(requirements, 'SUCCESS_CRITERIA');
  if (successIds.length > 0) {
    flows.push(
      makeComponent('FLOW', 'PrimaryUserFlow', 'Main user journey to satisfy success criteria', successIds),
    );
  }

  return flows;
}

export function generateModules(requirements: RequirementRecord[]): ArchitectureComponent[] {
  const modules: ArchitectureComponent[] = [];
  const features = reqValues(requirements, 'FEATURE');
  const featureIds = reqIds(requirements, 'FEATURE');
  const constraintIds = reqIds(requirements, 'CONSTRAINT');

  for (let i = 0; i < features.length; i++) {
    const feature = features[i];
    const id = featureIds[i] ?? featureIds[0] ?? '';
    if (/expense/i.test(feature)) {
      modules.push(makeComponent('MODULE', 'ExpenseModule', 'Core expense tracking logic', [id]));
    }
    if (/offline/i.test(feature)) {
      modules.push(makeComponent('MODULE', 'OfflineStorageModule', 'Local persistence for offline use', [id]));
    }
    if (/dashboard/i.test(feature)) {
      modules.push(makeComponent('MODULE', 'DashboardModule', 'Dashboard aggregation logic', [id]));
    }
    if (/notification/i.test(feature)) {
      modules.push(makeComponent('MODULE', 'NotificationModule', 'Push and in-app notifications', [id]));
    }
  }

  const constraints = reqValues(requirements, 'CONSTRAINT');
  for (let i = 0; i < constraints.length; i++) {
    if (/offline/i.test(constraints[i])) {
      modules.push(
        makeComponent('MODULE', 'OfflineStorageModule', 'Enforces offline constraint', [
          constraintIds[i] ?? constraintIds[0] ?? '',
        ]),
      );
    }
  }

  return modules.filter(
    (m, i, arr) => arr.findIndex((x) => x.name === m.name) === i,
  );
}

export function generateDataModels(requirements: RequirementRecord[]): ArchitectureComponent[] {
  const models: ArchitectureComponent[] = [];
  const features = reqValues(requirements, 'FEATURE');
  const ids = reqIds(requirements, 'FEATURE');

  for (let i = 0; i < features.length; i++) {
    const feature = features[i];
    const id = ids[i] ?? ids[0] ?? '';
    if (/expense/i.test(feature)) {
      models.push(
        makeComponent('DATA_MODEL', 'Expense', 'Expense entry with amount, date, category', [id]),
        makeComponent('DATA_MODEL', 'Category', 'Expense category classification', [id]),
      );
    }
    if (/user|auth|login/i.test(feature)) {
      models.push(makeComponent('DATA_MODEL', 'User', 'User account and profile', [id]));
    }
  }

  const userIds = reqIds(requirements, 'USER_TYPE');
  if (userIds.length > 0) {
    models.push(makeComponent('DATA_MODEL', 'UserProfile', 'User profile for target user type', userIds));
  }

  return models;
}

export function generateIntegrations(requirements: RequirementRecord[]): ArchitectureComponent[] {
  const integrations: ArchitectureComponent[] = [];
  const platforms = reqValues(requirements, 'PLATFORM');
  const platformIds = reqIds(requirements, 'PLATFORM');
  const features = reqValues(requirements, 'FEATURE');
  const featureIds = reqIds(requirements, 'FEATURE');

  for (let i = 0; i < platforms.length; i++) {
    const platform = platforms[i];
    const id = platformIds[i] ?? platformIds[0] ?? '';
    integrations.push(
      makeComponent('INTEGRATION', `${platform}PlatformIntegration`, `Platform integration for ${platform}`, [id]),
    );
  }

  for (let i = 0; i < features.length; i++) {
    if (/offline/i.test(features[i])) {
      integrations.push(
        makeComponent('INTEGRATION', 'LocalStorageIntegration', 'Local device storage for offline data', [
          featureIds[i] ?? featureIds[0] ?? '',
        ]),
      );
    }
    if (/sync/i.test(features[i])) {
      integrations.push(
        makeComponent('INTEGRATION', 'CloudSyncIntegration', 'Remote sync service integration', [
          featureIds[i] ?? featureIds[0] ?? '',
        ]),
      );
    }
  }

  return integrations.filter(
    (m, i, arr) => arr.findIndex((x) => x.name === m.name) === i,
  );
}

export function generatePermissions(requirements: RequirementRecord[]): ArchitectureComponent[] {
  const permissions: ArchitectureComponent[] = [];
  const userTypes = reqValues(requirements, 'USER_TYPE');
  const userIds = reqIds(requirements, 'USER_TYPE');
  const constraints = reqValues(requirements, 'CONSTRAINT');
  const constraintIds = reqIds(requirements, 'CONSTRAINT');
  const platforms = reqValues(requirements, 'PLATFORM');
  const platformIds = reqIds(requirements, 'PLATFORM');

  for (let i = 0; i < userTypes.length; i++) {
    const userType = userTypes[i];
    const roleName = userType.replace(/\s+/g, '');
    permissions.push(
      makeComponent('PERMISSION', `${roleName}RolePermission`, `Role-based access for ${userType}`, [
        userIds[i] ?? userIds[0] ?? '',
      ]),
    );
  }

  for (let i = 0; i < constraints.length; i++) {
    if (/offline/i.test(constraints[i])) {
      permissions.push(
        makeComponent('PERMISSION', 'OfflineAccessPermission', 'Permission to use offline features', [
          constraintIds[i] ?? constraintIds[0] ?? '',
        ]),
      );
    }
  }

  for (let i = 0; i < platforms.length; i++) {
    if (/android|ios|mobile/i.test(platforms[i])) {
      permissions.push(
        makeComponent('PERMISSION', 'DeviceStoragePermission', 'Device storage access for mobile platform', [
          platformIds[i] ?? platformIds[0] ?? '',
        ]),
      );
    }
  }

  return permissions;
}

function generateServices(requirements: RequirementRecord[]): ArchitectureComponent[] {
  const services: ArchitectureComponent[] = [];
  const features = reqValues(requirements, 'FEATURE');
  const ids = reqIds(requirements, 'FEATURE');

  for (let i = 0; i < features.length; i++) {
    const feature = features[i];
    const id = ids[i] ?? ids[0] ?? '';
    if (/expense/i.test(feature)) {
      services.push(
        makeComponent('SERVICE', 'ExpenseTrackingService', 'Orchestrates expense CRUD operations', [id]),
      );
    }
    if (/offline/i.test(feature)) {
      services.push(
        makeComponent('SERVICE', 'OfflineSyncService', 'Manages offline sync lifecycle', [id]),
      );
    }
  }

  return services;
}

export function generateArchitectureBlueprint(
  input: GenerateBlueprintInput,
  duplicateContext?: DuplicateDetectionContext,
): ArchitectureBlueprint {
  const warnings: string[] = [
    'Product Architect performs architecture design only — no code generation, execution, or project modification.',
  ];
  const errors: string[] = [];

  const requirements: RequirementRecord[] = input.requirements.map((r) => ({
    requirementId: r.requirementId,
    createdAt: Date.now(),
    category: r.category as RequirementRecord['category'],
    value: r.value,
    confidence: 'HIGH' as const,
    sourceRequestId: input.requestId,
    warnings: [],
    errors: [],
  }));

  if (requirements.length === 0) {
    errors.push('No requirements provided — cannot generate architecture blueprint.');
    return {
      blueprintId: createBlueprintId(),
      createdAt: Date.now(),
      requestId: input.requestId,
      components: [],
      warnings,
      errors,
    };
  }

  const components: ArchitectureComponent[] = [
    ...generateScreens(requirements),
    ...generateFlows(requirements),
    ...generateModules(requirements),
    ...generateDataModels(requirements),
    ...generateIntegrations(requirements),
    ...generatePermissions(requirements),
    ...generateServices(requirements),
  ];

  const context: DuplicateDetectionContext = duplicateContext ?? {
    brainSummaries: [],
    vaultCapabilities: [],
  };

  for (const component of components) {
    const dupWarnings = detectPotentialDuplicates(component, context);
    for (const w of dupWarnings) {
      component.warnings.push(w);
      if (!warnings.includes(w)) warnings.push(w);
    }
  }

  return {
    blueprintId: createBlueprintId(),
    createdAt: Date.now(),
    requestId: input.requestId,
    components,
    warnings,
    errors,
  };
}

export function summarizeArchitecture(blueprint: ArchitectureBlueprint): string {
  const count = (type: ArchitectureComponentType) =>
    blueprint.components.filter((c) => c.type === type).length;
  const dupCount = blueprint.components.filter((c) =>
    c.warnings.some((w) => w.startsWith(DUPLICATE_RISK_PREFIX)),
  ).length;

  return (
    `Blueprint ${blueprint.blueprintId}: request=${blueprint.requestId} ` +
    `components=${blueprint.components.length} ` +
    `SCREEN=${count('SCREEN')} FLOW=${count('FLOW')} MODULE=${count('MODULE')} ` +
    `DATA_MODEL=${count('DATA_MODEL')} INTEGRATION=${count('INTEGRATION')} ` +
    `PERMISSION=${count('PERMISSION')} SERVICE=${count('SERVICE')} ` +
    `duplicate_risks=${dupCount}`
  );
}
