/**
 * Rule-based requirement extraction — no AI, LLM, code generation, or execution.
 */

import type {
  ExtractRequirementsInput,
  RequirementCategory,
  RequirementConfidence,
  RequirementDuplicateContext,
  RequirementExtractionResult,
  RequirementRecord,
} from './types.js';
import { DUPLICATE_RISK_PREFIX } from './types.js';

function createRequirementId(prefix: string): string {
  return `req-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function createExtractionId(): string {
  return `extract-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeInput(input: string): string {
  return input.trim().replace(/\s+/g, ' ');
}

function makeRecord(
  category: RequirementCategory,
  value: string,
  sourceRequestId: string,
  confidence: RequirementConfidence = 'HIGH',
): RequirementRecord {
  return {
    requirementId: createRequirementId(category.toLowerCase()),
    createdAt: Date.now(),
    category,
    value,
    confidence,
    sourceRequestId,
    warnings: [],
    errors: [],
  };
}

function normalizeCapabilityName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function detectExistingCapabilities(context: RequirementDuplicateContext): string[] {
  const capabilities = new Set<string>();
  for (const summary of context.brainSummaries) {
    const lower = summary.toLowerCase();
    const matches = lower.match(/\b([a-z]+(?:module|feature|capability))\b/gi) ?? [];
    for (const m of matches) capabilities.add(normalizeCapabilityName(m));
  }
  for (const cap of context.vaultCapabilities) {
    capabilities.add(normalizeCapabilityName(cap));
  }
  return [...capabilities];
}

export function detectPotentialDuplicates(
  requirementValue: string,
  context: RequirementDuplicateContext,
): string[] {
  const existing = detectExistingCapabilities(context);
  const normalized = normalizeCapabilityName(requirementValue);
  const warnings: string[] = [];
  for (const cap of existing) {
    if (cap === normalized || cap.includes(normalized) || normalized.includes(cap)) {
      warnings.push(
        `${DUPLICATE_RISK_PREFIX}: requirement "${requirementValue}" may overlap existing capability — recommend integration, extension, or consolidation`,
      );
      break;
    }
  }
  return warnings;
}

function matchPhrases(text: string, patterns: RegExp[]): string[] {
  const found: string[] = [];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const value = match[1].trim();
      if (value && !found.includes(value)) found.push(value);
    }
  }
  return found;
}

export function extractFeatures(text: string, requestId: string): RequirementRecord[] {
  const lower = normalizeInput(text).toLowerCase();
  const features: RequirementRecord[] = [];

  const keywordFeatures: [RegExp, string][] = [
    [/\bexpense tracker\b/i, 'expense tracking'],
    [/\boffline support\b/i, 'offline support'],
    [/\boffline mode\b/i, 'offline support'],
    [/\buser authentication\b/i, 'user authentication'],
    [/\blogin\b/i, 'user login'],
    [/\bdashboard\b/i, 'dashboard'],
    [/\bnotifications?\b/i, 'notifications'],
    [/\breporting\b/i, 'reporting'],
    [/\bsync\b/i, 'data sync'],
  ];

  for (const [pattern, label] of keywordFeatures) {
    if (pattern.test(lower)) {
      features.push(makeRecord('FEATURE', label, requestId));
    }
  }

  const buildMatch = lower.match(/\bbuild (?:a|an|the) ([^.]+?)(?: app| application| system| for\b|$)/i);
  if (buildMatch?.[1]) {
    const phrase = buildMatch[1].trim();
    if (!features.some((f) => f.value === phrase) && phrase.length < 60) {
      features.push(makeRecord('FEATURE', phrase, requestId, 'MEDIUM'));
    }
  }

  return features;
}

export function extractConstraints(text: string, requestId: string): RequirementRecord[] {
  const lower = normalizeInput(text).toLowerCase();
  const constraints: RequirementRecord[] = [];

  if (/\boffline\b/i.test(lower)) {
    constraints.push(makeRecord('CONSTRAINT', 'must work offline', requestId));
  }
  if (/\bwithout internet\b/i.test(lower)) {
    constraints.push(makeRecord('CONSTRAINT', 'without internet connectivity', requestId));
  }
  if (/\bmust not\b/i.test(lower) || /\bwithout\b/i.test(lower)) {
    const without = matchPhrases(lower, [/\bwithout ([^.]+)/i, /\bmust not ([^.]+)/i]);
    for (const w of without) {
      constraints.push(makeRecord('CONSTRAINT', w, requestId, 'MEDIUM'));
    }
  }

  return constraints;
}

export function extractPlatforms(text: string, requestId: string): RequirementRecord[] {
  const lower = normalizeInput(text).toLowerCase();
  const platforms: RequirementRecord[] = [];
  const platformMap: [RegExp, string][] = [
    [/\bandroid\b/i, 'Android'],
    [/\bios\b/i, 'iOS'],
    [/\bweb\b/i, 'Web'],
    [/\bmobile\b/i, 'Mobile'],
    [/\bdesktop\b/i, 'Desktop'],
    [/\bwindows\b/i, 'Windows'],
    [/\bmacos\b/i, 'macOS'],
  ];

  for (const [pattern, label] of platformMap) {
    if (pattern.test(lower)) {
      platforms.push(makeRecord('PLATFORM', label, requestId));
    }
  }

  return platforms;
}

export function extractUserTypes(text: string, requestId: string): RequirementRecord[] {
  const lower = normalizeInput(text).toLowerCase();
  const users: RequirementRecord[] = [];

  const userMatch = lower.match(/\bfor ([a-z\s]+?)(?: with\b|,|\.|$)/i);
  if (userMatch?.[1]) {
    users.push(makeRecord('USER_TYPE', userMatch[1].trim(), requestId));
  }

  const types: [RegExp, string][] = [
    [/\bstudents?\b/i, 'students'],
    [/\bfounders?\b/i, 'founders'],
    [/\bdevelopers?\b/i, 'developers'],
    [/\bteams?\b/i, 'teams'],
    [/\benterprises?\b/i, 'enterprises'],
  ];

  for (const [pattern, label] of types) {
    if (pattern.test(lower) && !users.some((u) => u.value === label)) {
      users.push(makeRecord('USER_TYPE', label, requestId));
    }
  }

  return users;
}

export function extractRisks(text: string, requestId: string): RequirementRecord[] {
  const lower = normalizeInput(text).toLowerCase();
  const risks: RequirementRecord[] = [];

  if (/\boffline\b/i.test(lower)) {
    risks.push(makeRecord('RISK', 'offline data consistency', requestId, 'MEDIUM'));
  }
  if (/\bexpense\b/i.test(lower)) {
    risks.push(makeRecord('RISK', 'financial data accuracy', requestId, 'MEDIUM'));
  }
  if (/\bsecurity\b/i.test(lower) || /\bauth/i.test(lower)) {
    risks.push(makeRecord('RISK', 'authentication and data security', requestId, 'HIGH'));
  }

  return risks;
}

export function extractSuccessCriteria(text: string, requestId: string): RequirementRecord[] {
  const lower = normalizeInput(text).toLowerCase();
  const criteria: RequirementRecord[] = [];

  if (/\btrack expenses?\b/i.test(lower) || /\bexpense tracker\b/i.test(lower)) {
    criteria.push(makeRecord('SUCCESS_CRITERIA', 'users can track expenses reliably', requestId));
  }
  if (/\boffline support\b/i.test(lower) || /\boffline\b/i.test(lower)) {
    criteria.push(makeRecord('SUCCESS_CRITERIA', 'core features work without network', requestId));
  }
  if (/\bstudents?\b/i.test(lower)) {
    criteria.push(makeRecord('SUCCESS_CRITERIA', 'usable by student user type', requestId, 'MEDIUM'));
  }

  return criteria;
}

export function extractRequirements(input: ExtractRequirementsInput): RequirementExtractionResult {
  const text = normalizeInput(input.userInput);
  const warnings: string[] = [
    'Requirement Extractor performs extraction only — no code generation, execution, or project modification.',
  ];
  const errors: string[] = [];

  if (!text) {
    errors.push('Empty input — no requirements to extract.');
    return {
      extractionId: createExtractionId(),
      requestId: input.requestId,
      requirements: [],
      warnings,
      errors,
    };
  }

  const requirements: RequirementRecord[] = [
    ...extractFeatures(text, input.requestId),
    ...extractConstraints(text, input.requestId),
    ...extractPlatforms(text, input.requestId),
    ...extractUserTypes(text, input.requestId),
    ...extractRisks(text, input.requestId),
    ...extractSuccessCriteria(text, input.requestId),
  ];

  const deduped = requirements.filter(
    (r, i, arr) => arr.findIndex((x) => x.category === r.category && x.value === r.value) === i,
  );

  if (deduped.length === 0) {
    warnings.push('No structured requirements detected — input may need clearer feature/platform language.');
  }

  return {
    extractionId: createExtractionId(),
    requestId: input.requestId,
    requirements: deduped,
    warnings,
    errors,
  };
}

export function summarizeRequirements(result: RequirementExtractionResult): string {
  const byCategory = (cat: RequirementCategory) =>
    result.requirements.filter((r) => r.category === cat).map((r) => r.value).join(', ');
  return (
    `Extraction ${result.extractionId}: request=${result.requestId} ` +
    `count=${result.requirements.length} ` +
    `FEATURE=[${byCategory('FEATURE')}] PLATFORM=[${byCategory('PLATFORM')}] ` +
    `USER_TYPE=[${byCategory('USER_TYPE')}]`
  );
}
