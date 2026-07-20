/**
 * Contract-Bound Fallback Module Integrity / Compound Hardening V1 —
 * evidence-backed classification for modules that collide with banned fallback terms.
 *
 * Filename/label alone is never authoritative. Compound names may pass only with
 * positive exact-identity ancestry AND current-build approval binding.
 */

import { BANNED_FALLBACK_MODULES } from './prompt-faithful-generation-types.js';
import { promptExplicitlyJustifiesGenericModule } from '../prompt-bounded-materialization/module-origin-evidence.js';

export type FallbackStatus =
  | 'CONTRACT_BOUND'
  | 'PACK_COMPOSED'
  | 'SYSTEM_SHELL'
  | 'RECOVERY_GENERATED'
  | 'LEGACY_FALLBACK'
  | 'UNTRACED'
  | 'TEST_ONLY';

export const SYSTEM_SHELL_MODULE_IDS = new Set([
  'auth',
  'authentication',
  'persistence',
  'settings',
  'navigation-router',
  'navigation',
  'router',
]);

/** Cosmetic suffixes/prefixes that do not create contract ancestry by themselves. */
const DISGUISE_SEGMENTS = new Set([
  'view',
  'module',
  'feature',
  'pack',
  'unified',
  'smart',
  'generic',
  'core',
  'manager',
  'workspace',
  'panel',
  'page',
  'screen',
  'widget',
]);

export interface ModuleFallbackClassification {
  readonly readOnly: true;
  readonly moduleId: string;
  readonly matchedBannedTerm: string | null;
  readonly isExactBannedId: boolean;
  readonly isCompoundOverBannedTerm: boolean;
  readonly isDisguisedBannedForm: boolean;
  readonly approvedByCbga: boolean;
  readonly promptRequired: boolean;
  readonly promptJustifiesExactId: boolean;
  readonly promptJustifiesBannedTermOnly: boolean;
  readonly hasAuthoritativeAncestry: boolean;
  readonly hasApprovalBinding: boolean;
  readonly fallbackStatus: FallbackStatus;
  readonly forbidden: boolean;
  readonly reason: string;
}

export interface ModuleFallbackClassificationInput {
  moduleId: string;
  approvedModuleIds?: readonly string[];
  promptRequiredModules?: readonly string[];
  /** Normalized capability ids from UFC / canonical contract / CBGA capability nodes. */
  contractCapabilityIds?: readonly string[];
  rawPrompt?: string;
  originHint?: string | null;
  testOnly?: boolean;
  /** Claimed status without proof — must be validated. */
  claimedFallbackStatus?: FallbackStatus | null;
  /** Current build / project binding for isolation checks. */
  currentProjectId?: string | null;
  currentBuildId?: string | null;
  ancestryProjectId?: string | null;
  ancestryBuildId?: string | null;
  /** Folder id after rename; must match approved identity when provided. */
  materializedFolderId?: string | null;
}

function normalizeModuleId(value: string): string {
  return value.toLowerCase().replace(/_/g, '-').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

export function moduleIdMatchesBannedTerm(moduleId: string, banned: string): boolean {
  const id = normalizeModuleId(moduleId);
  return (
    id === banned ||
    id.startsWith(`${banned}-`) ||
    id.endsWith(`-${banned}`) ||
    id.includes(`-${banned}-`)
  );
}

export function findMatchingBannedTerm(moduleId: string): string | null {
  const id = normalizeModuleId(moduleId);
  for (const banned of BANNED_FALLBACK_MODULES) {
    if (moduleIdMatchesBannedTerm(id, banned)) return banned;
  }
  return null;
}

export function isCompoundOverBannedTerm(moduleId: string, banned: string): boolean {
  const id = normalizeModuleId(moduleId);
  if (id === banned) return false;
  if (!id.includes('-')) return false;
  return moduleIdMatchesBannedTerm(id, banned);
}

export function isDisguisedBannedForm(moduleId: string, banned: string): boolean {
  const id = normalizeModuleId(moduleId);
  if (id === banned) return false;
  if (!moduleIdMatchesBannedTerm(id, banned)) return false;
  const parts = id.split('-').filter(Boolean);
  if (parts.length < 2) return false;
  const nonBanned = parts.filter((part) => part !== banned);
  return nonBanned.length > 0 && nonBanned.every((part) => DISGUISE_SEGMENTS.has(part));
}

/**
 * Prompt evidence that justifies the *exact* module id (including compounds).
 * Compound phrases like "occupancy timeline" justify `occupancy-timeline`, not bare `timeline`.
 *
 * Exact banned fallback ids never use loose singularization ("project" ≠ `projects`);
 * they reuse the bare-banned prompt authority so negations and compound domain phrases
 * cannot mint ancestry for a bare registry term.
 */
export function promptJustifiesExactModuleId(rawPrompt: string, moduleId: string): boolean {
  const normalized = normalizeModuleId(moduleId);
  if (!normalized) return false;

  if ((BANNED_FALLBACK_MODULES as readonly string[]).includes(normalized)) {
    return promptJustifiesBareBannedFallback(rawPrompt, normalized);
  }

  const phrase = normalized.replace(/-/g, '[\\s_-]+');
  if (new RegExp(`\\b${phrase}\\b`, 'i').test(rawPrompt)) return true;

  if (!normalized.includes('-')) {
    if (new RegExp(`\\b${normalized}s\\b`, 'i').test(rawPrompt)) return true;
    if (normalized.endsWith('s') && new RegExp(`\\b${normalized.slice(0, -1)}\\b`, 'i').test(rawPrompt)) {
      return true;
    }
  }
  return false;
}

/**
 * Bare banned-term justification must not be satisfied by compound domain phrases.
 */
function promptNegatesBannedFallback(rawPrompt: string, banned: string): boolean {
  const forms = new Set<string>([banned]);
  if (banned.endsWith('s') && banned.length > 1) forms.add(banned.slice(0, -1));
  else forms.add(`${banned}s`);
  const affirmativelyRedefined = [...forms].some(
    (form) =>
      new RegExp(`\\b${form}\\s+means\\b`, 'i').test(rawPrompt) ||
      new RegExp(`\\b${form}\\s+is\\b`, 'i').test(rawPrompt) ||
      new RegExp(`\\bthe\\s+word\\s+${form}\\b`, 'i').test(rawPrompt) ||
      new RegExp(`\\b${form}\\b[^.\\n]{0,80}\\bjustified\\s+explicitly\\b`, 'i').test(rawPrompt),
  );
  for (const form of forms) {
    if (
      new RegExp(`\\bno\\s+${form}\\b`, 'i').test(rawPrompt) ||
      new RegExp(`\\bwithout\\s+${form}\\b`, 'i').test(rawPrompt)
    ) {
      return true;
    }
    // "Not a task tracker" — reject unless the prompt affirmatively redefines the term.
    if (
      !affirmativelyRedefined &&
      new RegExp(
        `\\b(?:not|never)\\s+(?:a\\s+|an\\s+)?(?:generic\\s+|bare\\s+|banned\\s+)?(?:[\\w-]+\\s+){0,6}${form}\\b`,
        'i',
      ).test(rawPrompt)
    ) {
      return true;
    }
  }
  return false;
}

export function promptJustifiesBareBannedFallback(rawPrompt: string, banned: string): boolean {
  if (promptNegatesBannedFallback(rawPrompt, banned)) {
    return false;
  }

  const standalonePatterns: Record<string, readonly RegExp[]> = {
    timeline: [
      /\bproject\s+timeline\b/i,
      /\bgantt\b/i,
      /(?:^|\n)\s*timeline\s*(?:\n|$)/i,
      /\btimeline\s+module\b/i,
      /\bmodules?\b[^\n.]{0,80}\btimeline\b(?!\s+(?:for|of|view|feed|history))/i,
    ],
    tasks: [/\btask\s+manager\b/i, /\btask\s+tracker\b/i, /(?:^|\n)\s*tasks?\s*(?:\n|$)/i, /\btasks?\b/i],
    projects: [/\bproject\s+management\b/i, /(?:^|\n)\s*projects?\s*(?:\n|$)/i, /\bprojects?\b/i],
    team: [/\bteam\s+members?\b/i, /(?:^|\n)\s*team\s*(?:\n|$)/i, /\bteams?\b/i],
    deals: [/\bdeals?\b/i, /\bsales\s+pipeline\b/i, /\bcrm\b/i],
    leads: [/\bleads?\b/i, /\blead\s+management\b/i],
    expenses: [/\bexpenses?\b/i, /\bexpense\s+tracker\b/i],
    inventory: [/\binventory\b/i, /\bstock\s+management\b/i],
  };

  const patterns = standalonePatterns[banned];
  if (!patterns) return promptExplicitlyJustifiesGenericModule(rawPrompt, banned);

  if (banned === 'timeline') {
    const hasCompoundTimeline = /\b[a-z][a-z0-9]+\s+timeline\b/i.test(rawPrompt);
    const hasStandalone = patterns.some((pattern) => pattern.test(rawPrompt));
    if (hasCompoundTimeline && !/\bproject\s+timeline\b/i.test(rawPrompt) && !/\bgantt\b/i.test(rawPrompt)) {
      return false;
    }
    return hasStandalone;
  }

  return patterns.some((pattern) => pattern.test(rawPrompt));
}

function identitySet(values: readonly string[] | undefined): Set<string> {
  return new Set((values ?? []).map(normalizeModuleId).filter(Boolean));
}

function hasExactIdentity(set: Set<string>, moduleId: string): boolean {
  return set.has(normalizeModuleId(moduleId));
}

/**
 * Positive ancestry for the exact module identity — not bare banned-term keyword hits,
 * not sibling compounds, not forged approval alone.
 */
export function hasAuthoritativeExactAncestry(input: {
  moduleId: string;
  promptRequiredModules?: readonly string[];
  contractCapabilityIds?: readonly string[];
  rawPrompt?: string;
}): boolean {
  const moduleId = normalizeModuleId(input.moduleId);
  if (hasExactIdentity(identitySet(input.promptRequiredModules), moduleId)) return true;
  if (hasExactIdentity(identitySet(input.contractCapabilityIds), moduleId)) return true;
  if (input.rawPrompt && promptJustifiesExactModuleId(input.rawPrompt, moduleId)) return true;
  return false;
}

function projectBindingIntact(input: ModuleFallbackClassificationInput): boolean {
  if (input.ancestryProjectId && input.currentProjectId) {
    if (normalizeModuleId(input.ancestryProjectId) !== normalizeModuleId(input.currentProjectId)) {
      return false;
    }
  }
  if (input.ancestryBuildId && input.currentBuildId) {
    if (String(input.ancestryBuildId) !== String(input.currentBuildId)) {
      return false;
    }
  }
  return true;
}

function folderMatchesApprovedIdentity(input: ModuleFallbackClassificationInput, moduleId: string): boolean {
  if (!input.materializedFolderId) return true;
  return normalizeModuleId(input.materializedFolderId) === normalizeModuleId(moduleId);
}

export function classifyModuleFallbackStatus(
  input: ModuleFallbackClassificationInput,
): ModuleFallbackClassification {
  const moduleId = normalizeModuleId(input.moduleId);
  const approved = identitySet(input.approvedModuleIds);
  const required = identitySet(input.promptRequiredModules);
  const contractCaps = identitySet(input.contractCapabilityIds);
  const prompt = input.rawPrompt ?? '';
  const matchedBannedTerm = findMatchingBannedTerm(moduleId);
  const isExactBannedId = matchedBannedTerm !== null && moduleId === matchedBannedTerm;
  const compoundOverBanned =
    matchedBannedTerm !== null && isCompoundOverBannedTerm(moduleId, matchedBannedTerm);
  const disguised =
    matchedBannedTerm !== null && isDisguisedBannedForm(moduleId, matchedBannedTerm);
  const approvedByCbga = approved.has(moduleId);
  const promptRequired = required.has(moduleId);
  const promptJustifiesExactId = prompt ? promptJustifiesExactModuleId(prompt, moduleId) : false;
  const promptJustifiesBannedTermOnly =
    matchedBannedTerm !== null && prompt ? promptJustifiesBareBannedFallback(prompt, matchedBannedTerm) : false;
  const hasAuthoritativeAncestry =
    promptRequired ||
    promptJustifiesExactId ||
    contractCaps.has(moduleId);
  const hasApprovalBinding = approvedByCbga;
  const bindingOk = projectBindingIntact(input);
  const folderOk = folderMatchesApprovedIdentity(input, moduleId);

  const base = {
    readOnly: true as const,
    moduleId,
    matchedBannedTerm,
    isExactBannedId,
    isCompoundOverBannedTerm: compoundOverBanned,
    isDisguisedBannedForm: disguised,
    approvedByCbga,
    promptRequired,
    promptJustifiesExactId,
    promptJustifiesBannedTermOnly,
    hasAuthoritativeAncestry,
    hasApprovalBinding,
  };

  if (input.testOnly) {
    return {
      ...base,
      fallbackStatus: 'TEST_ONLY',
      forbidden: true,
      reason: 'Test-only module is forbidden in production workspaces.',
    };
  }

  if (input.claimedFallbackStatus === 'CONTRACT_BOUND' && !hasAuthoritativeAncestry) {
    return {
      ...base,
      fallbackStatus: 'UNTRACED',
      forbidden: true,
      reason: 'Claimed CONTRACT_BOUND status without supporting ancestry evidence.',
    };
  }

  if (!bindingOk) {
    return {
      ...base,
      fallbackStatus: 'UNTRACED',
      forbidden: true,
      reason: 'Ancestry project/build binding does not match the current build context.',
    };
  }

  if (!folderOk) {
    return {
      ...base,
      fallbackStatus: 'UNTRACED',
      forbidden: true,
      reason: 'Materialized folder identity does not resolve to the approved module identity.',
    };
  }

  if (SYSTEM_SHELL_MODULE_IDS.has(moduleId)) {
    return {
      ...base,
      fallbackStatus: 'SYSTEM_SHELL',
      forbidden: false,
      reason: 'System-shell module.',
    };
  }

  // Banned-term collision path (exact, compound, or disguised).
  if (matchedBannedTerm) {
    // Forged approval: listed in approved set without exact ancestry.
    if (hasApprovalBinding && !hasAuthoritativeAncestry) {
      return {
        ...base,
        fallbackStatus: 'UNTRACED',
        forbidden: true,
        reason: `Module "${moduleId}" is listed as approved but lacks corresponding prompt/contract ancestry.`,
      };
    }

    // Disguised rename without exact ancestry — never pass on cosmetic specificity.
    if (disguised && !hasAuthoritativeAncestry) {
      return {
        ...base,
        fallbackStatus: 'LEGACY_FALLBACK',
        forbidden: true,
        reason: `Disguised banned fallback "${moduleId}" has no verified exact-identity ancestry.`,
      };
    }

    // CONTRACT_BOUND requires positive exact ancestry AND approval binding.
    if (hasAuthoritativeAncestry && hasApprovalBinding) {
      return {
        ...base,
        fallbackStatus: 'CONTRACT_BOUND',
        forbidden: false,
        reason: `Exact identity "${moduleId}" is approved and backed by prompt/contract ancestry.`,
      };
    }

    // Ancestry without approval — not yet contract-bound for integrity gate.
    if (hasAuthoritativeAncestry && !hasApprovalBinding) {
      return {
        ...base,
        fallbackStatus: 'UNTRACED',
        forbidden: true,
        reason: `Module "${moduleId}" has prompt/contract evidence but is not in the current approved module set.`,
      };
    }

    if (isExactBannedId) {
      return {
        ...base,
        fallbackStatus: 'LEGACY_FALLBACK',
        forbidden: true,
        reason: `Bare banned fallback module "${moduleId}" lacks verified contract-bound ancestry.`,
      };
    }

    return {
      ...base,
      fallbackStatus: 'UNTRACED',
      forbidden: true,
      reason: `Compound/renamed module "${moduleId}" matches banned term "${matchedBannedTerm}" without verified exact-identity ancestry.`,
    };
  }

  // Non-banned modules: approval or prompt evidence is sufficient; still not forged-claimable.
  if (hasAuthoritativeAncestry || hasApprovalBinding) {
    return {
      ...base,
      fallbackStatus: hasApprovalBinding && hasAuthoritativeAncestry
        ? 'CONTRACT_BOUND'
        : hasApprovalBinding
          ? 'PACK_COMPOSED'
          : 'PACK_COMPOSED',
      forbidden: false,
      reason: 'Module has approved or prompt-bound ancestry.',
    };
  }

  if (input.originHint === 'RECOVERY' || input.originHint === 'RECOVERY_GENERATED') {
    return {
      ...base,
      fallbackStatus: 'RECOVERY_GENERATED',
      forbidden: true,
      reason: 'Recovery-generated module without approved ancestry.',
    };
  }

  return {
    ...base,
    fallbackStatus: 'UNTRACED',
    forbidden: false,
    reason: 'Module has no banned-term match; not classified as forbidden fallback.',
  };
}

export function classifyWorkspaceBannedFallbackContamination(input: {
  workspaceModuleIds: readonly string[];
  approvedModuleIds?: readonly string[];
  promptRequiredModules?: readonly string[];
  contractCapabilityIds?: readonly string[];
  rawPrompt?: string;
  currentProjectId?: string | null;
  currentBuildId?: string | null;
  ancestryProjectId?: string | null;
  ancestryBuildId?: string | null;
}): {
  readonly readOnly: true;
  readonly classifications: ModuleFallbackClassification[];
  readonly forbiddenModuleIds: string[];
  readonly forbiddenBannedTerms: string[];
  readonly allowedCompoundModuleIds: string[];
  readonly passed: boolean;
} {
  const classifications = input.workspaceModuleIds.map((moduleId) =>
    classifyModuleFallbackStatus({
      moduleId,
      approvedModuleIds: input.approvedModuleIds,
      promptRequiredModules: input.promptRequiredModules,
      contractCapabilityIds: input.contractCapabilityIds,
      rawPrompt: input.rawPrompt,
      currentProjectId: input.currentProjectId,
      currentBuildId: input.currentBuildId,
      ancestryProjectId: input.ancestryProjectId,
      ancestryBuildId: input.ancestryBuildId,
      materializedFolderId: moduleId,
    }),
  );
  const forbidden = classifications.filter((entry) => entry.forbidden && entry.matchedBannedTerm);
  const allowedCompounds = classifications.filter(
    (entry) => !entry.forbidden && entry.isCompoundOverBannedTerm,
  );
  return {
    readOnly: true,
    classifications,
    forbiddenModuleIds: forbidden.map((entry) => entry.moduleId),
    forbiddenBannedTerms: [...new Set(forbidden.map((entry) => entry.matchedBannedTerm!).filter(Boolean))],
    allowedCompoundModuleIds: allowedCompounds.map((entry) => entry.moduleId),
    passed: forbidden.length === 0,
  };
}
