/**
 * Project context classifier guard — LISA recognition and anti-task false-positive protection.
 */

export const LISA_PROJECT_DISPLAY_NAME = 'Locked In Syndrome App' as const;

export const LISA_DOMAIN_LABEL =
  'accessibility / assistive communication' as const;

export const LISA_ACCEPTED_TERMS = [
  'lisa',
  'locked in syndrome app',
  'locked-in syndrome',
  'locked in syndrome',
  'assistive communication',
  'eye tracking',
  'eye movement',
  'gaze',
  'blink',
  'blinks',
  'speech',
  'text to speech',
  'text-to-speech',
  'communication board',
  'caregiver',
  'calibration',
  'accessibility',
  'health accessibility',
] as const;

const LISA_NAME_PATTERN = /\b(lisa|locked[\s-]?in[\s-]?syndrome)\b/i;

// Generic words such as "calibration", "speech", "communication", and "accessibility" occur in
// many unrelated products. They are useful vocabulary after an assistive-communication product
// has been identified, but a single occurrence is not product-identity evidence.
const ASSISTIVE_COMMUNICATION_SIGNALS: RegExp[] = [
  /\bassistive\s+communication\b/i,
  /\bsevere\s+motor\s+impairment\b/i,
  /\bgaze\s+(?:selection|keyboard|input)\b/i,
  /\bblink\s+input\b/i,
  /\beye[\s-]?(?:tracking|movement)\b/i,
  /\btext[\s-]?to[\s-]?speech\b/i,
  /\bcommunication\s+board\b/i,
  /\bcaregiver[\s-]?(?:assisted\s+)?calibration\b/i,
  /\bemergency[\s-]?speech\b/i,
];

const TASK_TRACKER_BOILERPLATE =
  /\b(generate architecture,\s*plan,\s*tasks|begin build execution|generate tasks)\b/i;

const TASK_TRACKER_STRONG =
  /\b(task tracker|todo app|todo list|to-do list|add tasks|mark them complete|complete tasks)\b/i;

export function isLisaProjectName(name: string): boolean {
  const normalized = name.trim();
  if (!normalized) return false;
  return LISA_NAME_PATTERN.test(normalized) || normalized.toLowerCase() === 'lisa';
}

export function promptMentionsLisaOrAccessibility(prompt: string): boolean {
  const normalized = prompt.trim();
  if (!normalized) return false;
  if (LISA_NAME_PATTERN.test(normalized)) return true;
  const signalCount = ASSISTIVE_COMMUNICATION_SIGNALS.reduce(
    (count, pattern) => count + (pattern.test(normalized) ? 1 : 0),
    0,
  );
  return /\bassistive\s+communication\b/i.test(normalized) || signalCount >= 2;
}

export function promptMentionsActiveProjectName(prompt: string, projectName: string): boolean {
  const normalizedPrompt = prompt.trim().toLowerCase();
  const normalizedName = projectName.trim().toLowerCase();
  if (!normalizedPrompt || !normalizedName) return false;
  if (normalizedPrompt.includes(normalizedName)) return true;
  if (isLisaProjectName(projectName) && promptMentionsLisaOrAccessibility(prompt)) return true;
  return false;
}

export function resolveLisaProjectDomain(projectName: string): string | null {
  if (!isLisaProjectName(projectName)) return null;
  return LISA_DOMAIN_LABEL;
}

export function resolveLisaDisplayName(projectName: string): string | null {
  if (!isLisaProjectName(projectName)) return null;
  return LISA_PROJECT_DISPLAY_NAME;
}

export function lisaKeywordsForProject(): string[] {
  return [
    'lisa',
    'accessibility',
    'assistive',
    'communication',
    'eye',
    'gaze',
    'blink',
    'speech',
    'caregiver',
    'calibration',
  ];
}

/**
 * True when prompt should not be classified as task tracking despite weak keyword overlap.
 */
export function shouldSuppressTaskTrackingClassification(prompt: string): boolean {
  if (!promptMentionsLisaOrAccessibility(prompt)) return false;
  if (TASK_TRACKER_STRONG.test(prompt)) return false;
  return true;
}

/**
 * Strip task-tracking domain when accessibility/LISA evidence dominates generic boilerplate.
 */
export function filterMisplacedTaskDomainIds(
  domainIds: string[],
  prompt: string,
  projectName?: string | null,
): string[] {
  const lisaEvidence =
    promptMentionsLisaOrAccessibility(prompt) ||
    (projectName ? isLisaProjectName(projectName) : false);
  if (!lisaEvidence) return domainIds;
  if (TASK_TRACKER_STRONG.test(prompt)) return domainIds;
  return domainIds.filter((id) => id !== 'task');
}

export function filterTaskTrackingKeywordsFromBoilerplate(prompt: string, keywords: string[]): string[] {
  if (!shouldSuppressTaskTrackingClassification(prompt)) return keywords;
  return keywords.filter((keyword) => keyword !== 'task' && keyword !== 'task_tracker_web_v1');
}

export function proposedNameShouldNotBeTaskTracker(
  prompt: string,
  proposedName: string | null,
): boolean {
  if (!proposedName) return false;
  if (proposedName.toLowerCase() !== 'tasktracker') return false;
  return shouldSuppressTaskTrackingClassification(prompt);
}

export function isRealTaskTrackerPrompt(prompt: string): boolean {
  return TASK_TRACKER_STRONG.test(prompt) && !shouldSuppressTaskTrackingClassification(prompt);
}

export function isBuildBoilerplateTaskCue(prompt: string): boolean {
  return TASK_TRACKER_BOILERPLATE.test(prompt);
}
