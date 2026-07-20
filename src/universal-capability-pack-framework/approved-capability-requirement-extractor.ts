/**
 * Universal Capability Pack Framework V1 — approved capability requirement extraction.
 *
 * Reads only approved envelope truth. Does not map product names to packs.
 */

import type { ApprovedProductionBuildEnvelope } from '../contract-bound-generation-authority-v4/approved-production-build-envelope.js';
import type { CapabilityCategory, CapabilityRequirementDescriptor } from './universal-capability-pack-types.js';
import { stableCapabilityRequirementId, UNIVERSAL_CAPABILITY_PACK_FRAMEWORK_SOURCE } from './universal-capability-pack-types.js';

export interface CapabilityRequirementExtractionInput {
  readonly envelope: ApprovedProductionBuildEnvelope;
  readonly supplementalTexts?: readonly { readonly text: string; readonly path: string }[];
}

const CAPABILITY_PATTERNS: readonly {
  readonly pattern: RegExp;
  readonly capabilityKey: string;
  readonly category: CapabilityCategory;
  readonly label: string;
  readonly criticality: 'REQUIRED' | 'OPTIONAL' | 'INFORMATIONAL';
}[] = [
  { pattern: /\bpreference\b|\bsetting\b|\buser\s+config\b|\bpersisted\s+setting\b/gi, capabilityKey: 'preferences.persisted-setting', category: 'DATA', label: 'Persisted preferences', criticality: 'OPTIONAL' },
  { pattern: /\baudit\b|\bactivity\s+trail\b|\bactivity\s+history\b|\bchange\s+log\b/gi, capabilityKey: 'audit.activity-trail', category: 'OBSERVABILITY', label: 'Activity audit trail', criticality: 'OPTIONAL' },
  { pattern: /\bexport\b.*\bcsv\b|\bcsv\s+export\b/gi, capabilityKey: 'export.csv', category: 'IMPORT_EXPORT', label: 'CSV export', criticality: 'OPTIONAL' },
  { pattern: /\bexport\b.*\bjson\b|\bjson\s+export\b|\bexport\s+data\b/gi, capabilityKey: 'export.json', category: 'IMPORT_EXPORT', label: 'JSON export', criticality: 'OPTIONAL' },
  { pattern: /\bschedul(?:e|ing)\b|\bavailability\b|\btime[- ]slot\b|\bcalendar\b/gi, capabilityKey: 'scheduling.availability', category: 'SCHEDULING', label: 'Scheduling availability', criticality: 'REQUIRED' },
  { pattern: /\blogin\b|\bsession\b|\bauthenticat\w*\b|\bsign[- ]in\b/gi, capabilityKey: 'authentication.session', category: 'AUTHENTICATION', label: 'Authentication session', criticality: 'REQUIRED' },
  { pattern: /\bpermission\b|\brole[- ]based\b|\bauthoriz\w*\b|\brbac\b/gi, capabilityKey: 'authorization.rbac', category: 'AUTHORIZATION', label: 'Role-based authorization', criticality: 'REQUIRED' },
  { pattern: /\bnotif\w*\b|\bemail\s+reminder\b|\bsms\b|\bpush\b/gi, capabilityKey: 'notification.email', category: 'NOTIFICATION', label: 'Notification delivery', criticality: 'REQUIRED' },
  { pattern: /\bfile\s+upload\b|\battachment\b|\bfile\s+storage\b/gi, capabilityKey: 'file.storage', category: 'FILE_MANAGEMENT', label: 'File storage', criticality: 'REQUIRED' },
  { pattern: /\bdashboard\b|\breport\b|\bmetric\b/gi, capabilityKey: 'reporting.metric', category: 'REPORTING', label: 'Reporting metric', criticality: 'OPTIONAL' },
  { pattern: /\bfull[- ]text\b|\branked\s+search\b/gi, capabilityKey: 'search.full-text-ranking', category: 'SEARCH', label: 'Full-text ranked search', criticality: 'OPTIONAL' },
  { pattern: /\breal[- ]?time\b|\bwebsocket\b|\blive\s+sync\b/gi, capabilityKey: 'realtime.sync', category: 'REALTIME', label: 'Real-time synchronization', criticality: 'REQUIRED' },
  // Offline / sync-when-available — domain-neutral Synchronization Engine.
  // Intentionally excludes bare "local persistence" and bare "sync" so apps that only persist
  // locally without offline/sync semantics do not receive the engine.
  {
    pattern:
      /\boffline\b|\blocal[\s-]?first\b|\bpersist(?:s|ed|ing)?\s+locally\b|\bworks?\s+offline\b|\bonline\s*\/\s*offline\b|\bsynchroniz(?:e|ation|ing)\b|\bsync(?:hronization)?\s+engine\b|\bconflict\s+resolution\b|\bretry\s+queue\b/gi,
    capabilityKey: 'offline.sync',
    category: 'OFFLINE',
    label: 'Offline synchronization',
    criticality: 'REQUIRED',
  },
  { pattern: /\bpdf\b|\bexcel\b|\bxlsx\b/gi, capabilityKey: 'export.advanced-binary', category: 'IMPORT_EXPORT', label: 'Advanced binary export', criticality: 'INFORMATIONAL' as 'OPTIONAL' },
];

export function extractCapabilityRequirementsFromEnvelope(
  input: CapabilityRequirementExtractionInput,
): CapabilityRequirementDescriptor[] {
  const texts = [...collectEnvelopeCapabilityTexts(input.envelope), ...(input.supplementalTexts ?? [])];
  const results: CapabilityRequirementDescriptor[] = [];
  const seen = new Set<string>();

  for (const { text, path } of texts) {
    for (const def of CAPABILITY_PATTERNS) {
      def.pattern.lastIndex = 0;
      if (!def.pattern.test(text)) continue;
      const key = def.capabilityKey;
      if (seen.has(key)) continue;
      seen.add(key);
      results.push({
        requirementId: stableCapabilityRequirementId(key, 'envelope'),
        capabilityKey: key,
        category: def.category,
        label: def.label,
        description: `Approved envelope declares ${def.label}`,
        moduleIds: [],
        requiredBehaviors: [def.capabilityKey],
        criticality: def.criticality,
        optional: def.criticality !== 'REQUIRED',
        sourceEnvelopePaths: [path],
        provenance: [UNIVERSAL_CAPABILITY_PACK_FRAMEWORK_SOURCE, path],
        supportClassification: 'NOT_REQUIRED',
      });
    }
  }

  // Baseline reference-pack requirements for any CRUD-backed application.
  for (const baseline of BASELINE_REFERENCE_REQUIREMENTS) {
    if (seen.has(baseline.capabilityKey)) continue;
    seen.add(baseline.capabilityKey);
    results.push(baseline);
  }

  return results.sort((a, b) => a.requirementId.localeCompare(b.requirementId));
}

const BASELINE_REFERENCE_REQUIREMENTS: readonly CapabilityRequirementDescriptor[] = [
  {
    requirementId: stableCapabilityRequirementId('preferences.persisted-setting', 'baseline'),
    capabilityKey: 'preferences.persisted-setting',
    category: 'DATA',
    label: 'Persisted preferences',
    description: 'Generic persisted user-approved preferences for generated applications',
    moduleIds: [],
    requiredBehaviors: ['preferences.read', 'preferences.update', 'preferences.reset'],
    criticality: 'OPTIONAL',
    optional: true,
    sourceEnvelopePaths: ['approvedProductionBuildEnvelope.baselineCapabilities'],
    provenance: [UNIVERSAL_CAPABILITY_PACK_FRAMEWORK_SOURCE, 'baseline'],
    supportClassification: 'NOT_REQUIRED',
  },
  {
    requirementId: stableCapabilityRequirementId('audit.activity-trail', 'baseline'),
    capabilityKey: 'audit.activity-trail',
    category: 'OBSERVABILITY',
    label: 'Activity audit trail',
    description: 'Generic immutable activity entries for approved mutations',
    moduleIds: [],
    requiredBehaviors: ['audit.record-event', 'audit.query-events'],
    criticality: 'OPTIONAL',
    optional: true,
    sourceEnvelopePaths: ['approvedProductionBuildEnvelope.baselineCapabilities'],
    provenance: [UNIVERSAL_CAPABILITY_PACK_FRAMEWORK_SOURCE, 'baseline'],
    supportClassification: 'NOT_REQUIRED',
  },
  {
    requirementId: stableCapabilityRequirementId('export.json', 'baseline'),
    capabilityKey: 'export.json',
    category: 'IMPORT_EXPORT',
    label: 'JSON export',
    description: 'Generic JSON export for approved serializable entity collections',
    moduleIds: [],
    requiredBehaviors: ['export.json', 'export.selected-records'],
    criticality: 'OPTIONAL',
    optional: true,
    sourceEnvelopePaths: ['approvedProductionBuildEnvelope.baselineCapabilities'],
    provenance: [UNIVERSAL_CAPABILITY_PACK_FRAMEWORK_SOURCE, 'baseline'],
    supportClassification: 'NOT_REQUIRED',
  },
];

function collectEnvelopeCapabilityTexts(envelope: ApprovedProductionBuildEnvelope): { text: string; path: string }[] {
  const contract = envelope.canonicalProductContract;
  const out: { text: string; path: string }[] = [];
  const push = (values: readonly string[] | undefined, path: string) => {
    if (!values) return;
    for (const value of values) {
      if (value.trim()) out.push({ text: value, path });
    }
  };
  push(contract.coreActions, 'canonicalProductContract.coreActions');
  push(contract.primaryWorkflows, 'canonicalProductContract.primaryWorkflows');
  push(contract.navigationExpectations, 'canonicalProductContract.navigationExpectations');
  push(contract.businessConcepts, 'canonicalProductContract.businessConcepts');
  push(contract.majorFeatureGroups, 'canonicalProductContract.majorFeatureGroups');
  push(contract.allConceptNames, 'canonicalProductContract.allConceptNames');
  for (const entry of envelope.approvedModulePlan.moduleEntries) {
    if (entry.contractSource?.trim()) {
      out.push({ text: entry.contractSource, path: `approvedModulePlan.moduleEntries[${entry.moduleId}].contractSource` });
    }
  }
  return out;
}
