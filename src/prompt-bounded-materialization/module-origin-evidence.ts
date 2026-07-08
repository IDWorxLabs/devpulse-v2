/**
 * Prompt-Bounded Materialization — prompt evidence for generic module terms.
 */

import type { GenericFallbackModuleTerm } from './prompt-bounded-materialization-types.js';
import { GENERIC_FALLBACK_MODULE_TERMS } from './prompt-bounded-materialization-types.js';

const MODULE_EVIDENCE_PATTERNS: Record<GenericFallbackModuleTerm, readonly RegExp[]> = {
  projects: [/\bprojects?\b/i, /\bproject management\b/i, /\bproject manager\b/i],
  tasks: [/\btasks?\b/i, /\btask manager\b/i, /\btask tracker\b/i, /\btask tracking\b/i],
  team: [/\bteam\b/i, /\bteam members?\b/i, /\bassign team\b/i],
  timeline: [/\btimeline\b/i, /\bgantt\b/i, /\bproject timeline\b/i],
  dashboard: [/\bdashboard\b/i],
  board: [/\bkanban board\b/i, /\bproject board\b/i, /\btask board\b/i],
  backlog: [/\bbacklog\b/i, /\bproduct backlog\b/i],
  sprint: [/\bsprints?\b/i, /\bagile\b/i, /\bscrum\b/i],
  roadmap: [/\broadmap\b/i],
  kanban: [/\bkanban\b/i],
  calendar: [/\bcalendar\b/i, /\bscheduling\b/i, /\bappointments?\b/i],
  users: [/\busers?\b/i, /\buser management\b/i, /\buser accounts?\b/i],
  deals: [/\bdeals?\b/i, /\bsales pipeline\b/i, /\bcrm\b/i],
  leads: [/\bleads?\b/i, /\blead management\b/i],
  expenses: [/\bexpenses?\b/i, /\bexpense tracker\b/i, /\bexpensetracker\b/i],
  inventory: [/\binventory\b/i, /\bstock management\b/i],
  filter: [/\bfilter\b/i, /\bfiltering\b/i, /\bsearch and filter\b/i],
  export: [/\bexport\b/i, /\bcsv export\b/i, /\bdownload csv\b/i],
};

const PROJECT_MANAGEMENT_JUSTIFIED = new Set<GenericFallbackModuleTerm>([
  'projects',
  'tasks',
  'team',
  'timeline',
  'dashboard',
  'board',
  'backlog',
  'sprint',
  'roadmap',
  'kanban',
  'calendar',
  'users',
]);

export function promptExplicitlyJustifiesGenericModule(rawPrompt: string, moduleId: string): boolean {
  const normalized = moduleId.toLowerCase().replace(/_/g, '-');
  if (!GENERIC_FALLBACK_MODULE_TERMS.includes(normalized as GenericFallbackModuleTerm)) {
    return false;
  }
  if (
    new RegExp(`\\bno\\s+${normalized}s?\\b`, 'i').test(rawPrompt) ||
    new RegExp(`\\bwithout\\s+${normalized}s?\\b`, 'i').test(rawPrompt) ||
    new RegExp(`\\bnot\\s+.*\\b${normalized}s?\\b`, 'i').test(rawPrompt)
  ) {
    return false;
  }
  const patterns = MODULE_EVIDENCE_PATTERNS[normalized as GenericFallbackModuleTerm];
  return patterns.some((pattern) => pattern.test(rawPrompt));
}

export function profileJustifiesGenericModules(materializationProfile: string): boolean {
  return (
    materializationProfile === 'PROJECT_MANAGEMENT_WEB_V1' ||
    materializationProfile === 'TASK_TRACKER_WEB_V1' ||
    materializationProfile === 'CRM_WEB_V1'
  );
}

export function isGenericFallbackModuleTerm(moduleId: string): boolean {
  const normalized = moduleId.toLowerCase().replace(/_/g, '-');
  return GENERIC_FALLBACK_MODULE_TERMS.includes(normalized as GenericFallbackModuleTerm);
}

export function projectManagementProfileAllowsModule(
  materializationProfile: string,
  moduleId: string,
): boolean {
  if (materializationProfile !== 'PROJECT_MANAGEMENT_WEB_V1') return false;
  return PROJECT_MANAGEMENT_JUSTIFIED.has(moduleId.toLowerCase() as GenericFallbackModuleTerm);
}

export function buildGenericModuleEvidence(rawPrompt: string, moduleId: string): readonly string[] {
  const normalized = moduleId.toLowerCase();
  const evidence: string[] = [];
  if (promptExplicitlyJustifiesGenericModule(rawPrompt, normalized)) {
    evidence.push(`Prompt explicitly mentions ${normalized}`);
  }
  for (const term of GENERIC_FALLBACK_MODULE_TERMS) {
    if (term === normalized || normalized.includes(term)) {
      if (promptExplicitlyJustifiesGenericModule(rawPrompt, term)) {
        evidence.push(`Prompt evidence for ${term}`);
      }
    }
  }
  return evidence;
}
