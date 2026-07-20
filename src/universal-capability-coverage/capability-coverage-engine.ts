/**
 * Universal Capability Coverage Intelligence V1 — coverage engine.
 */

import type { GeneratedWorkspaceFile } from '../code-generation-engine/code-generation-engine-types.js';
import type { ApprovedProductionBuildEnvelope } from '../contract-bound-generation-authority-v4/approved-production-build-envelope.js';
import {
  extractCapabilityRequirementsFromEnvelope,
  normalizeCapabilityRequirements,
  getPack,
  findProvidersForCapability,
  verifyPackBehavior,
} from '../universal-capability-pack-framework/index.js';
import type { UniversalBehaviorVerificationReport } from '../universal-behavioral-verification/universal-behavior-types.js';
import type {
  CapabilityCategory,
  CapabilityCoverageComparison,
  CapabilityCoverageMaterializationInput,
  CapabilityCoverageSnapshot,
  CapabilityEngineeringScorecard,
  CapabilityMilestoneCheck,
  UniversalCapabilityDescriptor,
} from './universal-capability-coverage-types.js';
import {
  fingerprintCapability,
  fingerprintCoverageSnapshot,
  stableCapabilityId,
  UNIVERSAL_CAPABILITY_COVERAGE_SOURCE,
} from './universal-capability-coverage-types.js';
import {
  classifyMaturityFromDimensions,
  classifySupportFromMaturity,
  computeDimensionScores,
  deriveBehavioralCoverage,
  deriveEngineeringCoverage,
} from './capability-maturity-classifier.js';
import { buildCapabilityEngineeringScorecard } from './capability-scorecard.js';
import { detectCoverageRegressions } from './capability-regression-detector.js';

const ENGINE_CAPABILITIES: readonly {
  readonly capabilityKey: string;
  readonly category: CapabilityCategory;
  readonly label: string;
  readonly providedBy: string;
  readonly structuralPaths: readonly string[];
  readonly runtimePaths: readonly string[];
  readonly behaviorPrefixes: readonly string[];
  readonly enabled: (input: CapabilityCoverageMaterializationInput) => boolean;
}[] = [
  {
    capabilityKey: 'engine.crud',
    category: 'CRUD',
    label: 'Universal CRUD generation',
    providedBy: 'B1_UNIVERSAL_CRUD_GENERATION_ENGINE',
    structuralPaths: ['src/universal-crud-runtime/persistence-abstraction.ts', 'src/features/'],
    runtimePaths: ['src/universal-crud-runtime/memory-provider.ts'],
    behaviorPrefixes: ['crud.'],
    enabled: (i) => i.crudBacked,
  },
  {
    capabilityKey: 'engine.actions',
    category: 'ACTIONS',
    label: 'Universal action materialization',
    providedBy: 'B2_UNIVERSAL_ACTION_MATERIALIZATION_ENGINE',
    structuralPaths: ['.action-handlers.ts', '.universal-actions.ts'],
    runtimePaths: ['src/universal-action-runtime/'],
    behaviorPrefixes: ['action.'],
    enabled: (i) => i.actionBacked,
  },
  {
    capabilityKey: 'engine.workflows',
    category: 'WORKFLOWS',
    label: 'Universal workflow generation',
    providedBy: 'B3_UNIVERSAL_WORKFLOW_GENERATION_ENGINE',
    structuralPaths: ['.workflow-runtime.ts', '.universal-workflows.ts'],
    runtimePaths: ['src/universal-workflow-runtime/'],
    behaviorPrefixes: ['workflow.'],
    enabled: (i) => i.workflowBacked,
  },
  {
    capabilityKey: 'engine.relationships',
    category: 'RELATIONSHIPS',
    label: 'Universal relationship intelligence',
    providedBy: 'B4_UNIVERSAL_RELATIONSHIP_INTELLIGENCE_ENGINE',
    structuralPaths: ['.relationship-runtime.ts', '.universal-relationships.ts'],
    runtimePaths: ['src/universal-relationship-runtime/'],
    behaviorPrefixes: ['relationship.'],
    enabled: (i) => i.relationshipBacked,
  },
  {
    capabilityKey: 'engine.runtime',
    category: 'RUNTIME',
    label: 'Universal runtime state',
    providedBy: 'B5_UNIVERSAL_RUNTIME_STATE_ENGINE',
    structuralPaths: ['.universal-runtime.ts', 'src/universal-runtime-state/store.ts'],
    runtimePaths: ['src/universal-runtime-state/store.ts'],
    behaviorPrefixes: ['runtime.'],
    enabled: (i) => i.runtimeBacked,
  },
  {
    capabilityKey: 'engine.business-rules',
    category: 'BUSINESS_RULES',
    label: 'Universal business rule engine',
    providedBy: 'B6_UNIVERSAL_BUSINESS_RULE_ENGINE',
    structuralPaths: ['.business-rules.ts', 'src/universal-business-rule-runtime/'],
    runtimePaths: ['src/universal-business-rule-runtime/evaluator.ts'],
    behaviorPrefixes: ['rule.'],
    enabled: (i) => i.ruleBacked,
  },
  {
    capabilityKey: 'engine.verification',
    category: 'VERIFICATION',
    label: 'Universal behavioral verification',
    providedBy: 'B8_UNIVERSAL_BEHAVIORAL_VERIFICATION_ENGINE',
    structuralPaths: ['src/universal-behavioral-verification/behavior-verification-report.json'],
    runtimePaths: ['src/universal-behavioral-verification/runtime-marker.ts'],
    behaviorPrefixes: ['behavior.'],
    enabled: (i) => i.behavioralVerificationBacked,
  },
];

const CAPABILITY_KEY_CATEGORY: Record<string, CapabilityCategory> = {
  'preferences.persisted-setting': 'PREFERENCES',
  'audit.activity-trail': 'AUDIT',
  'export.csv': 'EXPORT',
  'export.json': 'EXPORT',
  'export.advanced-binary': 'EXPORT',
  'authentication.session': 'AUTHENTICATION',
  'authorization.rbac': 'AUTHORIZATION',
  'notification.email': 'NOTIFICATIONS',
  'scheduling.availability': 'SCHEDULING',
  'file.storage': 'FILE_MANAGEMENT',
  'reporting.metric': 'REPORTING',
  'search.full-text-ranking': 'SEARCH',
  'realtime.sync': 'REALTIME',
};

function workspaceHasPath(files: readonly GeneratedWorkspaceFile[], fragment: string): boolean {
  return files.some((f) => f.relativePath.includes(fragment) || f.content.includes(fragment));
}

function countVerifiedBehaviors(
  report: UniversalBehaviorVerificationReport | null,
  prefixes: readonly string[],
): { verified: number; total: number } {
  if (!report) return { verified: 0, total: 0 };
  const matching = report.results.filter((r) =>
    prefixes.some((p) => r.evidence.runtimeEvidence.actionExecuted?.toString().includes(p.replace('.', '')) || r.behaviorId.includes(p.replace('.', '-'))),
  );
  if (matching.length === 0 && prefixes.length > 0) {
    const byCategory = report.results.filter((r) =>
      prefixes.some((p) => {
        if (p.startsWith('crud.')) return r.behaviorId.includes('.crud.');
        if (p.startsWith('action.')) return r.behaviorId.includes('.action.');
        if (p.startsWith('workflow.')) return r.behaviorId.includes('.workflow.');
        if (p.startsWith('rule.')) return r.behaviorId.includes('.business-rule.') || r.behaviorId.includes('.rule.');
        if (p.startsWith('runtime.')) return r.behaviorId.includes('.runtime-state.') || r.behaviorId.includes('.runtime.');
        if (p.startsWith('relationship.')) return r.behaviorId.includes('.relationship.');
        // The behavioral-verification engine capability (prefix `behavior.`) is not a single
        // behavior category — it IS the engine that verifies every behavior in the report. Its
        // coverage therefore spans all verified behaviors, so match them all. Without this, the
        // `behavior.` prefix matched nothing and the engine reported a false "0/N verified" even
        // though the report proves N behaviors were genuinely verified.
        if (p.startsWith('behavior.')) return true;
        return false;
      }),
    );
    return {
      verified: byCategory.filter((r) => r.classification === 'VERIFIED' || r.classification === 'PARTIALLY_VERIFIED').length,
      total: byCategory.length,
    };
  }
  return {
    verified: matching.filter((r) => r.classification === 'VERIFIED' || r.classification === 'PARTIALLY_VERIFIED').length,
    total: matching.length,
  };
}

function packCategoryForKey(key: string): CapabilityCategory {
  return CAPABILITY_KEY_CATEGORY[key] ?? 'CUSTOM';
}

function scanDeclaredBlockedCapabilityKeys(envelope: ApprovedProductionBuildEnvelope): string[] {
  const texts = [
    envelope.cbgaGenerationSummary,
    envelope.traceability.envelopeSummary,
    ...envelope.canonicalProductContract.businessConcepts,
    ...envelope.canonicalProductContract.majorFeatureGroups,
    ...envelope.canonicalProductContract.allConceptNames,
    ...envelope.canonicalProductContract.coreActions,
    ...envelope.canonicalProductContract.primaryWorkflows,
    ...envelope.canonicalProductContract.navigationExpectations,
    ...envelope.approvedModulePlan.moduleEntries.map((e) => e.contractSource ?? ''),
    ...envelope.approvedModulePlan.moduleEntries.map((e) => e.displayName ?? ''),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  const keys: string[] = [];
  if (/\bauthenticat|\bsign[- ]in|\bsession\b|\blogin\b/.test(texts)) keys.push('authentication.session');
  if (/\bauthoriz|\bpermission|\brbac|\brole[- ]based/.test(texts)) keys.push('authorization.rbac');
  if (/\bnotif|\bemail reminder|\bsms\b|\bpush\b/.test(texts)) keys.push('notification.email');
  if (/\bschedul|\bavailability|\btime[- ]slot|\bcalendar\b/.test(texts)) keys.push('scheduling.availability');
  if (/\breal[- ]?time|\bwebsocket|\blive sync/.test(texts)) keys.push('realtime.sync');
  if (/\bpdf\b|\bexcel\b|\bxlsx\b/.test(texts)) keys.push('export.advanced-binary');
  if (/\bfile upload|\battachment storage/.test(texts)) keys.push('file.storage');
  if (/\bfull[- ]text|\branked search/.test(texts)) keys.push('search.full-text-ranking');
  return keys;
}

function buildEngineCapability(
  def: (typeof ENGINE_CAPABILITIES)[number],
  input: CapabilityCoverageMaterializationInput,
  workspaceFiles: readonly GeneratedWorkspaceFile[],
  behaviorReport: UniversalBehaviorVerificationReport | null,
): UniversalCapabilityDescriptor {
  const structuralChecks: CapabilityMilestoneCheck[] = def.structuralPaths.map((path) => ({
    milestoneId: `structural.${path}`,
    label: `Structural: ${path}`,
    passed: workspaceHasPath(workspaceFiles, path),
    detail: workspaceHasPath(workspaceFiles, path) ? 'present' : 'missing',
  }));
  const runtimeChecks: CapabilityMilestoneCheck[] = def.runtimePaths.map((path) => ({
    milestoneId: `runtime.${path}`,
    label: `Runtime: ${path}`,
    passed: workspaceHasPath(workspaceFiles, path),
    detail: workspaceHasPath(workspaceFiles, path) ? 'executable' : 'missing',
  }));
  const behaviorStats = countVerifiedBehaviors(behaviorReport, def.behaviorPrefixes);
  const behavioralChecks: CapabilityMilestoneCheck[] = [
    {
      milestoneId: 'behavioral.verification',
      label: 'Behavior verification',
      passed: behaviorStats.verified > 0,
      detail: `${behaviorStats.verified}/${behaviorStats.total || behaviorReport?.verifiedCount || 0} verified`,
    },
  ];
  const productionChecks: CapabilityMilestoneCheck[] = [
    {
      milestoneId: 'production.readiness',
      label: 'Production readiness',
      passed: structuralChecks.every((c) => c.passed) && runtimeChecks.every((c) => c.passed) && behavioralChecks[0]!.passed,
      detail: 'engine milestone',
    },
  ];
  const checks = [...structuralChecks, ...runtimeChecks, ...behavioralChecks, ...productionChecks];
  const dimensions = computeDimensionScores(checks);
  const maturityLevel = classifyMaturityFromDimensions({
    requirementDeclared: def.enabled(input),
    structuralPresent: dimensions.structuralCoverage >= 50,
    runtimePresent: dimensions.runtimeCoverage >= 50,
    behaviorallyVerified: dimensions.behavioralCoverage >= 50,
    productionReady: dimensions.productionCoverage >= 100,
  });
  const descriptor: UniversalCapabilityDescriptor = {
    readOnly: true,
    capabilityId: stableCapabilityId(def.capabilityKey, input.contractId),
    capabilityKey: def.capabilityKey,
    category: def.category,
    label: def.label,
    description: `${def.label} engineering capability`,
    providedBy: def.providedBy,
    sourceAuthorities: [UNIVERSAL_CAPABILITY_COVERAGE_SOURCE, def.providedBy],
    supportingMilestones: checks.filter((c) => c.passed).map((c) => c.milestoneId),
    supportingPacks: [],
    supportedBehaviors: behaviorReport?.results.filter((r) => r.classification === 'VERIFIED').map((r) => r.behaviorId) ?? [],
    verificationEvidence: behaviorReport ? [`behavior-report:${behaviorReport.reportId}`] : [],
    productionReadiness: maturityLevel === 'PRODUCTION_READY',
    supportClassification: classifySupportFromMaturity({
      maturityLevel,
      blocked: false,
      invalid: false,
      deprecated: false,
    }),
    maturityLevel,
    engineeringCoverage: deriveEngineeringCoverage(dimensions),
    behavioralCoverage: deriveBehavioralCoverage(dimensions),
    provenance: [UNIVERSAL_CAPABILITY_COVERAGE_SOURCE, 'ApprovedProductionBuildEnvelope'],
    fingerprint: '',
    dimensionScores: dimensions,
    milestoneChecks: checks,
  };
  return { ...descriptor, fingerprint: fingerprintCapability(descriptor) };
}

function buildPackCapability(
  capabilityKey: string,
  label: string,
  input: CapabilityCoverageMaterializationInput,
  envelope: ApprovedProductionBuildEnvelope,
  workspaceFiles: readonly GeneratedWorkspaceFile[],
  behaviorReport: UniversalBehaviorVerificationReport | null,
  sourceEnvelopePath: string,
): UniversalCapabilityDescriptor {
  const providers = findProvidersForCapability(capabilityKey);
  const selectedPack = providers.find((p) => p.supportStatus !== 'NOT_IMPLEMENTED') ?? providers[0] ?? null;
  const pack = selectedPack ? getPack(selectedPack.packId) : null;
  const blocked = !selectedPack || selectedPack.supportStatus === 'NOT_IMPLEMENTED';
  const packId = selectedPack?.packId ?? '';

  const structuralChecks: CapabilityMilestoneCheck[] = [
    {
      milestoneId: 'structural.requirement-extraction',
      label: 'Requirement extraction',
      passed: true,
      detail: sourceEnvelopePath,
    },
    {
      milestoneId: 'structural.pack-registered',
      label: 'Pack registered',
      passed: providers.length > 0,
      detail: providers.map((p) => p.packId).join(',') || 'none',
    },
    {
      milestoneId: 'structural.composition-plan',
      label: 'Composition plan',
      passed: workspaceHasPath(workspaceFiles, 'composition-plan.json'),
      detail: 'composition plan artifact',
    },
  ];

  const runtimeChecks: CapabilityMilestoneCheck[] = [
    {
      milestoneId: 'runtime.pack-materialized',
      label: 'Runtime materialized',
      passed: !blocked && packId.length > 0 && workspaceHasPath(workspaceFiles, packId),
      detail: packId || 'no pack',
    },
    {
      milestoneId: 'runtime.registry',
      label: 'Runtime registry',
      passed: workspaceHasPath(workspaceFiles, 'universal-capability-packs/runtime/registry.ts'),
      detail: 'pack registry',
    },
  ];

  const behaviorKeyMap: Record<string, string[]> = {
    'preferences.persisted-setting': ['preferences.'],
    'audit.activity-trail': ['audit.'],
    'export.csv': ['export.csv'],
    'export.json': ['export.json'],
    'authentication.session': ['authentication'],
    'authorization.rbac': ['authorization'],
    'notification.email': ['notification'],
    'scheduling.availability': ['scheduling'],
  };
  const prefixes = behaviorKeyMap[capabilityKey] ?? [capabilityKey.split('.')[0] ?? capabilityKey];
  const behaviorStats = countVerifiedBehaviors(behaviorReport, prefixes);
  const hasFalseCatalogOnly = blocked && providers.some((p) => p.supportStatus === 'NOT_IMPLEMENTED');

  // Genuine, canonical pack verification (same signal the pack framework's own B8 uses): a pack is
  // behaviorally verified when its artifacts are materialized, contain no static shell, and it is
  // registered in the runtime registry. Baseline reference packs (audit/export/preferences) never
  // emit contract-required behaviors — their behaviors are deterministically simulated as
  // NOT_REQUIRED — so `countVerifiedBehaviors` legitimately returns 0. That is NOT evidence the
  // capability is absent: the pack declares `productionReadiness: true` and is genuinely wired.
  // Verify it truthfully via the materialized artifacts instead of a behavior that, by design, is
  // never contract-required.
  const registrySource =
    workspaceFiles.find((f) => f.relativePath.includes('universal-capability-packs/runtime/registry.ts'))?.content ?? '';
  const packArtifacts = packId
    ? workspaceFiles
        .filter((f) => f.relativePath.includes(packId) || f.content.includes(packId))
        .map((f) => f.content)
        .join('\n')
    : '';
  const packVerification =
    packId && !blocked ? verifyPackBehavior(packId, { packArtifacts, registrySource }) : null;
  const packReferenceVerified =
    !blocked &&
    pack?.productionReadiness === true &&
    (pack.supportStatus === 'PRODUCTION_READY' || pack.supportStatus === 'FUNCTIONAL_REFERENCE') &&
    packVerification?.passed === true;

  const behavioralChecks: CapabilityMilestoneCheck[] = [
    {
      milestoneId: 'behavioral.verification',
      label: 'Behavior verification',
      passed: !hasFalseCatalogOnly && (behaviorStats.verified > 0 || packReferenceVerified),
      detail: hasFalseCatalogOnly
        ? 'catalog-only blocked'
        : behaviorStats.verified > 0
          ? `${behaviorStats.verified} verified`
          : packReferenceVerified
            ? `reference pack verified (${pack?.supportStatus})`
            : `${behaviorStats.verified} verified`,
    },
  ];

  const productionChecks: CapabilityMilestoneCheck[] = [
    {
      milestoneId: 'production.readiness',
      label: 'Production readiness',
      passed: pack?.supportStatus === 'PRODUCTION_READY' && behavioralChecks[0]!.passed && runtimeChecks[0]!.passed,
      detail: pack?.supportStatus ?? 'none',
    },
  ];

  const checks = [...structuralChecks, ...runtimeChecks, ...behavioralChecks, ...productionChecks];
  const dimensions = computeDimensionScores(checks);
  const adjustedDimensions = hasFalseCatalogOnly
    ? {
        ...dimensions,
        behavioralCoverage: 0,
        productionCoverage: 0,
        engineeringCoverage: Math.round((dimensions.structuralCoverage + dimensions.runtimeCoverage) / 4),
      }
    : dimensions;

  const maturityLevel = classifyMaturityFromDimensions({
    requirementDeclared: true,
    structuralPresent: dimensions.structuralCoverage >= 50,
    runtimePresent: dimensions.runtimeCoverage >= 50 && !blocked,
    behaviorallyVerified: dimensions.behavioralCoverage >= 50 && !hasFalseCatalogOnly,
    productionReady: dimensions.productionCoverage >= 100,
  });

  const descriptor: UniversalCapabilityDescriptor = {
    readOnly: true,
    capabilityId: stableCapabilityId(capabilityKey, input.contractId),
    capabilityKey,
    category: packCategoryForKey(capabilityKey),
    label,
    description: `Pack-backed capability: ${label}`,
    providedBy: pack?.packId ?? 'B7_UNIVERSAL_CAPABILITY_PACK_FRAMEWORK',
    sourceAuthorities: [UNIVERSAL_CAPABILITY_COVERAGE_SOURCE, 'B7_UNIVERSAL_CAPABILITY_PACK_FRAMEWORK', sourceEnvelopePath],
    supportingMilestones: checks.filter((c) => c.passed).map((c) => c.milestoneId),
    supportingPacks: packId ? [packId] : providers.map((p) => p.packId),
    supportedBehaviors: [],
    verificationEvidence: behaviorReport ? [`behavior-report:${behaviorReport.reportId}`] : [],
    productionReadiness: maturityLevel === 'PRODUCTION_READY',
    supportClassification: classifySupportFromMaturity({
      maturityLevel: hasFalseCatalogOnly ? 'DECLARED' : maturityLevel,
      packSupportStatus: selectedPack?.supportStatus,
      blocked,
      invalid: false,
      deprecated: selectedPack?.supportStatus === 'DEPRECATED',
    }),
    maturityLevel: hasFalseCatalogOnly ? 'DECLARED' : maturityLevel,
    engineeringCoverage: hasFalseCatalogOnly
      ? Math.min(dimensions.engineeringCoverage, dimensions.structuralCoverage)
      : deriveEngineeringCoverage(dimensions),
    behavioralCoverage: hasFalseCatalogOnly ? 0 : deriveBehavioralCoverage(dimensions),
    provenance: [UNIVERSAL_CAPABILITY_COVERAGE_SOURCE, sourceEnvelopePath],
    fingerprint: '',
    dimensionScores: adjustedDimensions,
    milestoneChecks: checks,
  };
  return { ...descriptor, fingerprint: fingerprintCapability(descriptor) };
}

export function extractCapabilitiesFromProductionTruth(input: {
  envelope: ApprovedProductionBuildEnvelope;
  materializationInput: CapabilityCoverageMaterializationInput;
  workspaceFiles: readonly GeneratedWorkspaceFile[];
  behaviorReport: UniversalBehaviorVerificationReport | null;
}): UniversalCapabilityDescriptor[] {
  const capabilities: UniversalCapabilityDescriptor[] = [];

  for (const engineDef of ENGINE_CAPABILITIES) {
    if (!engineDef.enabled(input.materializationInput)) continue;
    capabilities.push(
      buildEngineCapability(engineDef, input.materializationInput, input.workspaceFiles, input.behaviorReport),
    );
  }

  if (input.materializationInput.capabilityPackBacked) {
    const requirements = normalizeCapabilityRequirements(
      extractCapabilityRequirementsFromEnvelope({
        envelope: input.envelope,
        supplementalTexts: [
          { text: input.envelope.cbgaGenerationSummary, path: 'cbgaGenerationSummary' },
          { text: input.envelope.traceability.envelopeSummary, path: 'traceability.envelopeSummary' },
        ].filter((t) => t.text.trim().length > 0),
      }),
    );
    const seen = new Set<string>();
    for (const req of requirements) {
      if (seen.has(req.capabilityKey)) continue;
      seen.add(req.capabilityKey);
      capabilities.push(
        buildPackCapability(
          req.capabilityKey,
          req.label,
          input.materializationInput,
          input.envelope,
          input.workspaceFiles,
          input.behaviorReport,
          req.sourceEnvelopePaths[0] ?? 'envelope',
        ),
      );
    }
    for (const blockedKey of scanDeclaredBlockedCapabilityKeys(input.envelope)) {
      if (seen.has(blockedKey)) continue;
      seen.add(blockedKey);
      capabilities.push(
        buildPackCapability(
          blockedKey,
          blockedKey,
          input.materializationInput,
          input.envelope,
          input.workspaceFiles,
          input.behaviorReport,
          'approvedProductionBuildEnvelope.declaredBlockedCapability',
        ),
      );
    }
  }

  return capabilities.sort((a, b) => a.capabilityKey.localeCompare(b.capabilityKey));
}

export function calculateCoverage(capabilities: readonly UniversalCapabilityDescriptor[]): CapabilityEngineeringScorecard {
  return buildCapabilityEngineeringScorecard(capabilities);
}

export function calculateBehavioralCoverage(capabilities: readonly UniversalCapabilityDescriptor[]): number {
  if (capabilities.length === 0) return 0;
  const sum = capabilities.reduce((acc, c) => acc + c.behavioralCoverage, 0);
  return Math.min(100, Math.round(sum / capabilities.length));
}

export function calculateEngineeringCoverage(capabilities: readonly UniversalCapabilityDescriptor[]): number {
  if (capabilities.length === 0) return 0;
  const sum = capabilities.reduce((acc, c) => acc + c.engineeringCoverage, 0);
  return Math.min(100, Math.round(sum / capabilities.length));
}

export function calculatePackCoverage(capabilities: readonly UniversalCapabilityDescriptor[]): number {
  const packCaps = capabilities.filter((c) => c.supportingPacks.length > 0);
  if (packCaps.length === 0) return 0;
  return Math.min(100, Math.round(packCaps.reduce((a, c) => a + c.behavioralCoverage, 0) / packCaps.length));
}

export function calculateModuleCoverage(
  capabilities: readonly UniversalCapabilityDescriptor[],
  moduleIds: readonly string[],
): number {
  void moduleIds;
  return calculateEngineeringCoverage(capabilities);
}

export function calculateApplicationCoverage(capabilities: readonly UniversalCapabilityDescriptor[]): number {
  return calculateEngineeringCoverage(capabilities);
}

export function compareCoverage(
  previous: CapabilityCoverageSnapshot,
  current: CapabilityCoverageSnapshot,
): CapabilityCoverageComparison {
  const regressions = detectCoverageRegressions(previous.capabilities, current.capabilities);
  const improvements = current.capabilities
    .filter((c) => {
      const prev = previous.capabilities.find((p) => p.capabilityKey === c.capabilityKey);
      return prev && c.engineeringCoverage > prev.engineeringCoverage;
    })
    .map((c) => c.capabilityKey);
  return {
    previousFingerprint: previous.fingerprint,
    currentFingerprint: current.fingerprint,
    regressions,
    improvements,
    unchanged: regressions.length === 0 && improvements.length === 0,
  };
}

export function detectCoverageRegression(
  previous: CapabilityCoverageSnapshot,
  current: CapabilityCoverageSnapshot,
): readonly import('./universal-capability-coverage-types.js').CapabilityCoverageRegression[] {
  return detectCoverageRegressions(previous.capabilities, current.capabilities);
}

export function fingerprintCoverage(capabilities: readonly UniversalCapabilityDescriptor[]): string {
  return fingerprintCoverageSnapshot(capabilities);
}

export function buildCoverageSnapshot(input: {
  snapshotId: string;
  capabilities: readonly UniversalCapabilityDescriptor[];
}): CapabilityCoverageSnapshot {
  const scorecard = calculateCoverage(input.capabilities);
  return {
    snapshotId: input.snapshotId,
    generatedAt: new Date().toISOString(),
    capabilities: input.capabilities,
    scorecard,
    fingerprint: fingerprintCoverage(input.capabilities),
  };
}

export function rejectFalseCoverage(descriptor: UniversalCapabilityDescriptor): boolean {
  if (descriptor.supportClassification === 'NOT_IMPLEMENTED' && descriptor.behavioralCoverage > 0) return true;
  if (descriptor.milestoneChecks.some((c) => c.detail.includes('catalog-only')) && descriptor.behavioralCoverage > 0) return true;
  if (descriptor.maturityLevel === 'BEHAVIORALLY_VERIFIED' && descriptor.dimensionScores.behavioralCoverage === 0) return true;
  return false;
}
