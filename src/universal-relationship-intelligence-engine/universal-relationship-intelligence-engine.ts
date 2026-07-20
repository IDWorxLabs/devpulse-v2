/**
 * Universal Relationship Intelligence Engine V1 — orchestrator.
 */

import type { GeneratedWorkspaceFile } from '../code-generation-engine/code-generation-engine-types.js';
import type { ApprovedProductionBuildEnvelope } from '../contract-bound-generation-authority-v4/approved-production-build-envelope.js';
import { extractApprovedRelationshipsFromEnvelope } from './approved-relationship-extractor.js';
import { normalizeApprovedRelationships } from './relationship-normalization-engine.js';
import { resolveRelationshipEndpoints } from './relationship-endpoint-resolver.js';
import { classifyRelationshipSupport } from './relationship-support-classifier.js';
import { buildRelationshipDescriptors } from './relationship-descriptor-builder.js';
import { validateRelationshipGraph, validateSingleRelationshipGraph } from './relationship-graph-validator.js';
import { buildUniversalRelationshipSharedRuntimeFiles } from './relationship-persistence-generator.js';
import { generateRelationshipRepositorySource } from './relationship-repository-generator.js';
import { generateRelationshipServiceSource } from './relationship-service-generator.js';
import { generateRelationshipTypeExtensionsSource } from './relationship-type-generator.js';
import {
  generateRelationshipPanelJsx,
  generateRelationshipModuleCss,
  detectStaticRelationshipShell,
} from './relationship-ui-generator.js';
import { generateRelationshipFormControlsJsx } from './relationship-form-generator.js';
import { generateRelationshipQueryHelpersSource } from './relationship-query-generator.js';
import { generateRelationshipNavigationHelperSource } from './relationship-navigation-generator.js';
import { generateWorkflowRelationshipGuardsSource } from './relationship-workflow-integration.js';
import {
  verifyUniversalRelationshipBehavior,
  type RelationshipGeneratedSources,
} from './relationship-behavior-verification.js';
import { buildUniversalRelationshipMaterializationReport } from './relationship-generation-report.js';
import type {
  RawApprovedRelationship,
  UniversalRelationshipDescriptor,
  UniversalRelationshipMaterializationInput,
  UniversalRelationshipMaterializationReport,
} from './universal-relationship-types.js';
import { moduleIdToPascalCase } from '../universal-crud-generation-engine/universal-crud-types.js';

export interface UniversalRelationshipModuleMaterializationResult {
  readonly files: GeneratedWorkspaceFile[];
  readonly descriptors: UniversalRelationshipDescriptor[];
  readonly report: UniversalRelationshipMaterializationReport;
  readonly componentAugmentation: string;
  readonly formAugmentation: string;
}

export function buildRelationshipMaterializationInputFromEnvelope(input: {
  envelope: ApprovedProductionBuildEnvelope;
  moduleId: string;
  moduleDisplayName: string;
  moduleRoute: string;
  appTitle: string;
  contractId: string;
  crudBacked: boolean;
  actionBacked: boolean;
  workflowBacked: boolean;
  rawPrompt?: string;
}): UniversalRelationshipMaterializationInput {
  return {
    moduleId: input.moduleId,
    moduleDisplayName: input.moduleDisplayName,
    moduleRoute: input.moduleRoute,
    appTitle: input.appTitle,
    contractId: input.contractId,
    crudBacked: input.crudBacked,
    actionBacked: input.actionBacked,
    workflowBacked: input.workflowBacked,
    approvedRoutes: input.envelope.approvedModulePlan.moduleEntries.map((e) => e.route),
    canonicalProductContract: input.envelope.canonicalProductContract,
    approvedModulePlan: input.envelope.approvedModulePlan,
    buildId: input.envelope.buildId,
    promptHash: input.envelope.promptHash,
    rawPrompt: input.rawPrompt,
  };
}

export function materializeUniversalRelationshipsForModule(
  materializationInput: UniversalRelationshipMaterializationInput,
  envelope: ApprovedProductionBuildEnvelope,
): UniversalRelationshipModuleMaterializationResult {
  let rawRelationships = extractApprovedRelationshipsFromEnvelope({
    envelope,
    moduleId: materializationInput.moduleId,
    supplementalTexts: materializationInput.rawPrompt
      ? [{ text: materializationInput.rawPrompt, path: 'production.rawPrompt' }]
      : [],
  });
  rawRelationships = ensureRelationshipBaseline(rawRelationships, materializationInput, envelope);

  const buildFilteredDescriptors = (raw: readonly RawApprovedRelationship[]): UniversalRelationshipDescriptor[] => {
    const normalized = normalizeApprovedRelationships(raw);
    const endpointsList = normalized.map((item) =>
      resolveRelationshipEndpoints(item, materializationInput.approvedModulePlan, materializationInput.canonicalProductContract),
    );
    const classifications = normalized.map((item, index) =>
      classifyRelationshipSupport(item, endpointsList[index]!),
    );
    return buildRelationshipDescriptors(normalized, classifications, endpointsList, materializationInput)
      .map((descriptor) => {
        const graph = validateSingleRelationshipGraph(descriptor);
        if (!graph.valid && descriptor.supportClassification !== 'BLOCKED_BY_FUTURE_CAPABILITY') {
          return {
            ...descriptor,
            supportClassification: 'INVALID_RELATIONSHIP_CONTRACT' as const,
            blockedReason: graph.errors.join('; '),
          };
        }
        return descriptor;
      })
      .filter(
        (d) => d.sourceModuleId === materializationInput.moduleId || d.targetModuleId === materializationInput.moduleId,
      );
  };

  let descriptors = buildFilteredDescriptors(rawRelationships);

  // Every CRUD-backed host must receive at least one concrete relationship edge. When the envelope
  // yields global relationships but NONE resolve onto this module (it is neither source nor target
  // of any of them), the module would otherwise materialize zero relationship descriptors — yet the
  // behavioral-verification extractor asserts a baseline relationship behavior for every CRUD module
  // (`approvedModulePlan.moduleEntries[<module>].baselineRelationship`), so an uncovered host would
  // report a false B8/B11 behavioral failure. `ensureRelationshipBaseline` only injects the
  // module-sequence baseline when the envelope has NO relationships at all; extend that same,
  // domain-neutral baseline to this per-module-uncovered case so the host materializes a real,
  // verifiable edge instead of a silent gap.
  if (descriptors.length === 0 && materializationInput.crudBacked) {
    const baseline = buildModuleSequenceBaselineRelationship(materializationInput, envelope);
    if (baseline) {
      rawRelationships = [...rawRelationships, baseline];
      descriptors = buildFilteredDescriptors(rawRelationships);
    }
  }

  const graphAll = validateRelationshipGraph(descriptors);

  let runtimeSource = descriptors.length > 0 ? generateRelationshipRuntimeHookSource(descriptors, materializationInput) : '';
  const repositorySource =
    descriptors.length > 0 ? generateRelationshipRepositorySource(descriptors, materializationInput) : '';
  const serviceSource =
    descriptors.length > 0 ? generateRelationshipServiceSource(descriptors, materializationInput) : '';
  const typesSource =
    descriptors.length > 0 ? generateRelationshipTypeExtensionsSource(descriptors, materializationInput) : '';
  const descriptorsSource = generateRelationshipDescriptorsSource(descriptors, materializationInput);
  const panelJsx = generateRelationshipPanelJsx(descriptors, materializationInput.moduleId);
  const formJsx = generateRelationshipFormControlsJsx(descriptors, materializationInput.moduleId);
  const workflowGuardsSource =
    materializationInput.workflowBacked && descriptors.length > 0
      ? generateWorkflowRelationshipGuardsSource(descriptors)
      : '';

  // When B4 host eligibility is true but no concrete graph edges resolve (e.g. first module
  // before baseline sequencing), still emit a compile-safe relationship runtime hook so
  // universal-runtime imports of `./${moduleId}.relationship-runtime` never dangle.
  if (!runtimeSource && materializationInput.crudBacked) {
    runtimeSource = generateEmptyRelationshipRuntimeHookSource(materializationInput);
  }

  const verifications = descriptors.map((descriptor) => {
    const sources: RelationshipGeneratedSources = {
      runtime: runtimeSource,
      repository: repositorySource,
      service: serviceSource,
      componentFragment: `${panelJsx}\n${formJsx}`,
      descriptors: descriptorsSource,
    };
    return verifyUniversalRelationshipBehavior(descriptor, sources);
  });

  const report = buildUniversalRelationshipMaterializationReport({
    moduleId: materializationInput.moduleId,
    descriptors,
    verifications,
  });

  const moduleId = materializationInput.moduleId;
  const files: GeneratedWorkspaceFile[] = [];
  if (descriptors.length > 0 && runtimeSource && repositorySource) {
    files.push(
      { relativePath: `src/features/${moduleId}/${moduleId}.relationship-runtime.ts`, content: runtimeSource },
      { relativePath: `src/features/${moduleId}/${moduleId}.relationship.repository.ts`, content: repositorySource },
      { relativePath: `src/features/${moduleId}/${moduleId}.relationship.service.ts`, content: serviceSource },
      { relativePath: `src/features/${moduleId}/${moduleId}.relationship.types.ts`, content: typesSource },
      { relativePath: `src/features/${moduleId}/${moduleId}.universal-relationships.ts`, content: descriptorsSource },
      {
        relativePath: `src/features/${moduleId}/${moduleId}.relationship-report.json`,
        content: `${JSON.stringify({ ...report, graphValid: graphAll.valid }, null, 2)}\n`,
      },
      { relativePath: `src/features/${moduleId}/${moduleId}.relationship.module.css`, content: generateRelationshipModuleCss() },
      {
        relativePath: `src/features/${moduleId}/${moduleId}.relationship-query.ts`,
        content: generateRelationshipQueryHelpersSource(),
      },
      {
        relativePath: `src/features/${moduleId}/${moduleId}.relationship-navigation.ts`,
        content: generateRelationshipNavigationHelperSource(),
      },
    );
    if (workflowGuardsSource) {
      files.push({
        relativePath: `src/features/${moduleId}/${moduleId}.relationship-workflow-guards.ts`,
        content: workflowGuardsSource,
      });
    }
  } else if (runtimeSource) {
    files.push({
      relativePath: `src/features/${moduleId}/${moduleId}.relationship-runtime.ts`,
      content: runtimeSource,
    });
  }

  return {
    files,
    descriptors,
    report,
    componentAugmentation: panelJsx,
    formAugmentation: formJsx,
  };
}

function generateRelationshipDescriptorsSource(
  descriptors: readonly UniversalRelationshipDescriptor[],
  input: UniversalRelationshipMaterializationInput,
): string {
  return `/** Universal relationship descriptors — ${input.moduleDisplayName} */
export const ${moduleIdToPascalCase(input.moduleId).replace(/Feature$/, '')}_UNIVERSAL_RELATIONSHIPS = ${JSON.stringify(
    descriptors.map((d) => ({
      relationshipId: d.relationshipId,
      label: d.label,
      cardinality: d.cardinality,
      sourceModuleId: d.sourceModuleId,
      targetModuleId: d.targetModuleId,
      supportClassification: d.supportClassification,
      onDeletePolicy: d.onDeletePolicy,
      blockedReason: d.blockedReason ?? null,
    })),
    null,
    2,
  )} as const;
`;
}

function generateRelationshipRuntimeHookSource(
  descriptors: readonly UniversalRelationshipDescriptor[],
  input: UniversalRelationshipMaterializationInput,
): string {
  const pascal = moduleIdToPascalCase(input.moduleId);
  const relIds = descriptors.map((d) => d.relationshipId);

  return `/** Universal relationship runtime hook — ${input.moduleDisplayName} */
import { useCallback, useMemo, useState } from 'react';
import { ${input.moduleId.replace(/-/g, '_')}RelationshipService } from './${input.moduleId}.relationship.service';
import { buildRelationshipDeepLink } from './${input.moduleId}.relationship-navigation';

const RELATIONSHIP_IDS = ${JSON.stringify(relIds)} as const;

export function use${pascal}RelationshipRuntime(activeRecordId = 'active-record') {
  const service = useMemo(() => ${input.moduleId.replace(/-/g, '_')}RelationshipService(), []);
  const [relationshipSelections, setRelationshipSelectionsState] = useState<Record<string, string>>({});
  const [relatedLists, setRelatedLists] = useState<Record<string, Array<{ id: string; label: string }>>>({});
  const [relatedCounts, setRelatedCounts] = useState<Record<string, number>>({});
  const [relatedOptions, setRelatedOptions] = useState<Record<string, Array<{ id: string; label: string }>>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [relationshipError, setRelationshipError] = useState<string | null>(null);
  const [relationshipSuccess, setRelationshipSuccess] = useState<string | null>(null);
  const [undoStack, setUndoStack] = useState<Array<{ relationshipId: string; sourceId: string; targetId: string }>>([]);

  const refreshRelated = useCallback(() => {
    const lists: Record<string, Array<{ id: string; label: string }>> = {};
    const counts: Record<string, number> = {};
    for (const relationshipId of RELATIONSHIP_IDS) {
      const links = service.listRelated(relationshipId, activeRecordId);
      lists[relationshipId] = links.map((link) => ({ id: link.targetId, label: link.targetId }));
      counts[relationshipId] = links.length;
    }
    setRelatedLists(lists);
    setRelatedCounts(counts);
  }, [activeRecordId, service]);

  const setSelection = useCallback((relationshipId: string, value: string) => {
    setRelationshipSelectionsState((prev) => ({ ...prev, [relationshipId]: value }));
    if (!value) {
      setValidationErrors((prev) => ({ ...prev, [relationshipId]: 'Required relationship missing' }));
    } else {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[relationshipId];
        return next;
      });
    }
  }, []);

  const dispatchRelationshipEvent = useCallback(
    (eventType: string, payload: { relationshipId: string; sourceId: string; targetId: string }) => {
      setRelationshipError(null);
      setRelationshipSuccess(null);
      const validation = service.validateReferentialIntegrity(
        payload.relationshipId,
        payload.sourceId,
        payload.targetId,
        true,
      );
      if (!validation.ok) {
        setRelationshipError(validation.message);
        return;
      }
      if (eventType === 'relationship:link') {
        const result = service.link(payload.relationshipId, payload.sourceId, payload.targetId);
        if (!result.ok) {
          setRelationshipError(result.message);
          return;
        }
        setUndoStack((prev) => [...prev, payload]);
        setRelationshipSuccess(result.message);
        refreshRelated();
        return;
      }
      if (eventType === 'relationship:unlink') {
        const result = service.unlink(payload.relationshipId, payload.sourceId, payload.targetId);
        if (!result.ok) {
          setRelationshipError(result.message);
          return;
        }
        setRelationshipSuccess(result.message);
        refreshRelated();
        return;
      }
      setRelationshipError('Unknown relationship event');
    },
    [refreshRelated, service],
  );

  const navigateToRelated = useCallback(
    (relationshipId: string, relatedId: string, inverse: boolean) => {
      const def = ${JSON.stringify(
        descriptors.map((d) => ({
          relationshipId: d.relationshipId,
          sourceRoute: d.sourceRoute,
          targetRoute: d.targetRoute,
        })),
      )}.find((item) => item.relationshipId === relationshipId);
      if (!def) return;
      const route = inverse ? def.sourceRoute : def.targetRoute;
      window.location.hash = buildRelationshipDeepLink(route, relatedId, relationshipId);
    },
    [],
  );

  const undoLastLink = useCallback(() => {
    const last = undoStack[undoStack.length - 1];
    if (!last) return;
    service.unlink(last.relationshipId, last.sourceId, last.targetId);
    setUndoStack((prev) => prev.slice(0, -1));
    refreshRelated();
    setRelationshipSuccess('Undo link succeeded');
  }, [refreshRelated, service, undoStack]);

  return {
    activeRecordId,
    relationshipSelections,
    relatedLists,
    relatedCounts,
    relatedOptions,
    validationErrors,
    relationshipError,
    relationshipSuccess,
    setSelection,
    dispatchRelationshipEvent,
    navigateToRelated,
    refreshRelated,
    undoLastLink,
    link: service.link,
    unlink: service.unlink,
    listRelated: service.listRelated,
    listInverseRelated: service.listInverseRelated,
  };
}
`;
}

export function augmentCrudComponentWithUniversalRelationships(
  componentSource: string,
  materializationInput: UniversalRelationshipMaterializationInput,
  envelope: ApprovedProductionBuildEnvelope,
): { componentSource: string; relationshipResult: UniversalRelationshipModuleMaterializationResult } {
  const relationshipResult = materializeUniversalRelationshipsForModule(materializationInput, envelope);
  const pascal = moduleIdToPascalCase(materializationInput.moduleId);
  const moduleId = materializationInput.moduleId;

  let augmented = componentSource;
  if (relationshipResult.descriptors.length > 0 && !augmented.includes(`use${pascal}RelationshipRuntime`)) {
    const importLine = `import { use${pascal}RelationshipRuntime } from './${moduleId}.relationship-runtime';`;
    if (augmented.includes('from \'react\'')) {
      augmented = augmented.replace(
        /import \{([^}]+)\} from 'react';/,
        (match, imports) => `import {${imports}} from 'react';\n${importLine}`,
      );
    } else {
      augmented = `${importLine}\n${augmented}`;
    }
    augmented = augmented.replace(
      /const \[createLabel, setCreateLabel\] = useState\(''\);/,
      `const relationship = use${pascal}RelationshipRuntime();
  const [relationshipSelections, setRelationshipSelections] = useState<Record<string, string>>({});
  const [createLabel, setCreateLabel] = useState('');`,
    );
    if (!augmented.includes(`use${pascal}RelationshipRuntime()`)) {
      augmented = augmented.replace(
        'const crud = use',
        `const relationship = use${pascal}RelationshipRuntime();
  const [relationshipSelections, setRelationshipSelections] = useState<Record<string, string>>({});
  const crud = use`,
      );
    }
  }

  if (!augmented.includes('data-universal-relationship-engine')) {
    augmented = augmented.replace(
      'data-universal-crud-engine="v1"',
      'data-universal-crud-engine="v1"\n      data-universal-relationship-engine="v1"',
    );
  }

  if (relationshipResult.formAugmentation.trim()) {
    const formPoint = '<form className="universal-crud-form" onSubmit={onCreateSubmit}>';
    if (augmented.includes(formPoint)) {
      augmented = augmented.replace(
        formPoint,
        `${formPoint}\n${relationshipResult.formAugmentation}`,
      );
    }
  }

  if (relationshipResult.componentAugmentation.trim()) {
    const injectionPoint = '<header className="modular-feature-header">';
    if (augmented.includes(injectionPoint)) {
      augmented = augmented.replace(
        injectionPoint,
        `${injectionPoint}\n${relationshipResult.componentAugmentation}`,
      );
    } else {
      augmented = augmented.replace('</section>', `${relationshipResult.componentAugmentation}\n    </section>`);
    }
  } else if (relationshipResult.descriptors.length > 0 && !augmented.includes('dispatchRelationshipEvent')) {
    const injectionPoint = '<header className="modular-feature-header">';
    const fallback = `\n        <button type="button" data-interaction-control="true" data-universal-relationship-engine="v1" onClick={() => relationship.refreshRelated()}>Refresh related</button>`;
    if (augmented.includes(injectionPoint)) {
      augmented = augmented.replace('</header>', `${fallback}\n      </header>`);
    }
  }

  return { componentSource: augmented, relationshipResult };
}

/**
 * Sequence baseline edge for a single module: each non-first module links from previous→self; the
 * first module links self→next. Domain-neutral (uses only approved module ordering/displayNames) so
 * every CRUD-backed host can receive at least one concrete relationship edge. Returns null when the
 * module cannot host a baseline (not crud-backed, unknown module, or fewer than two modules).
 */
function buildModuleSequenceBaselineRelationship(
  input: UniversalRelationshipMaterializationInput,
  envelope: ApprovedProductionBuildEnvelope,
): RawApprovedRelationship | null {
  if (!input.crudBacked) return null;
  const entries = envelope.approvedModulePlan.moduleEntries;
  const idx = entries.findIndex((e) => e.moduleId === input.moduleId);
  if (idx < 0 || entries.length < 2) return null;

  const source = idx === 0 ? entries[0]! : entries[idx - 1]!;
  const target = idx === 0 ? entries[1]! : entries[idx]!;

  return {
    label: `${source.displayName} → ${target.displayName}`,
    sourceEntityLabel: source.displayName,
    targetEntityLabel: target.displayName,
    cardinalityHint: 'ONE_TO_MANY',
    sourceOptional: false,
    targetOptional: false,
    sourceEnvelopePath: 'universal-relationship-engine.module-sequence-baseline',
    ordered: false,
  };
}

function ensureRelationshipBaseline(
  rawRelationships: RawApprovedRelationship[],
  input: UniversalRelationshipMaterializationInput,
  envelope: ApprovedProductionBuildEnvelope,
): RawApprovedRelationship[] {
  if (rawRelationships.length > 0) return rawRelationships;
  const baseline = buildModuleSequenceBaselineRelationship(input, envelope);
  return baseline ? [baseline] : rawRelationships;
}

function generateEmptyRelationshipRuntimeHookSource(
  input: UniversalRelationshipMaterializationInput,
): string {
  const pascal = moduleIdToPascalCase(input.moduleId);
  return `/** Universal relationship runtime hook (empty graph host) — ${input.moduleDisplayName} */
import { useCallback, useState } from 'react';

export function use${pascal}RelationshipRuntime(_activeRecordId = 'active-record') {
  const [relationshipSelections, setRelationshipSelectionsState] = useState<Record<string, string>>({});
  const [relatedLists] = useState<Record<string, Array<{ id: string; label: string }>>>({});
  const [relatedCounts] = useState<Record<string, number>>({});
  const [relatedOptions] = useState<Record<string, Array<{ id: string; label: string }>>>({});
  const [validationErrors] = useState<Record<string, string>>({});
  const [relationshipError] = useState<string | null>(null);
  const [relationshipSuccess] = useState<string | null>(null);

  const refreshRelated = useCallback(() => {}, []);
  const setSelection = useCallback((relationshipId: string, value: string) => {
    setRelationshipSelectionsState((prev) => ({ ...prev, [relationshipId]: value }));
  }, []);
  const dispatchRelationshipEvent = useCallback((_eventType: string, _payload: { relationshipId: string; sourceId: string; targetId: string }) => {}, []);
  const validateRequiredRelationships = useCallback(() => true, []);
  const buildRelatedDeepLink = useCallback((_relationshipId: string, recordId: string) => \`/\${recordId}\`, []);

  return {
    relationshipSelections,
    relatedLists,
    relatedCounts,
    relatedOptions,
    validationErrors,
    relationshipError,
    relationshipSuccess,
    refreshRelated,
    setSelection,
    dispatchRelationshipEvent,
    validateRequiredRelationships,
    buildRelatedDeepLink,
  };
}
`;
}

export function shouldMaterializeUniversalRelationshipsForModule(
  moduleId: string,
  envelope?: ApprovedProductionBuildEnvelope | null,
  options?: { crudBacked?: boolean; rawPrompt?: string },
): boolean {
  const excluded = new Set(['auth', 'persistence', 'calculator', 'navigation-router']);
  if (excluded.has(moduleId)) return false;
  if (!envelope) return false;
  if (!shouldGenerateRelationshipHostModule(moduleId)) return false;

  const hasExplicitEvidence =
    extractApprovedRelationshipsFromEnvelope({
      envelope,
      moduleId,
      supplementalTexts: options?.rawPrompt ? [{ text: options.rawPrompt, path: 'production.rawPrompt' }] : [],
    }).length > 0;
  if (hasExplicitEvidence) return true;

  const entries = envelope.approvedModulePlan.moduleEntries;
  const idx = entries.findIndex((e) => e.moduleId === moduleId);
  if (idx > 0 && options?.crudBacked === true) return true;

  return options?.crudBacked === true && envelope.canonicalProductContract.coreEntities.length > 1;
}

function shouldGenerateRelationshipHostModule(moduleId: string): boolean {
  const informational = new Set(['dashboard', 'reports', 'charts', 'analytics', 'history', 'code-history']);
  return !informational.has(moduleId);
}

export { buildUniversalRelationshipSharedRuntimeFiles } from './relationship-persistence-generator.js';
export {
  buildUniversalRelationshipMaterializationReport,
  renderUniversalRelationshipMaterializationReportMarkdown,
  computeUniversalRelationshipCapabilityCoverageScore,
} from './relationship-generation-report.js';
export {
  verifyUniversalRelationshipBehavior,
  diagnoseUniversalRelationshipGenerationGaps,
} from './relationship-behavior-verification.js';
export { extractApprovedRelationshipsFromEnvelope } from './approved-relationship-extractor.js';
export { detectStaticRelationshipShell } from './relationship-ui-generator.js';
export { validateRelationshipGraph, validateSingleRelationshipGraph } from './relationship-graph-validator.js';
export { normalizeApprovedRelationship, normalizeApprovedRelationships } from './relationship-normalization-engine.js';
export { classifyRelationshipSupport } from './relationship-support-classifier.js';
export { resolveRelationshipEndpoints } from './relationship-endpoint-resolver.js';
export {
  UNIVERSAL_RELATIONSHIP_INTELLIGENCE_ENGINE_VERSION,
  UNIVERSAL_RELATIONSHIP_INTELLIGENCE_ENGINE_SOURCE,
} from './universal-relationship-types.js';
