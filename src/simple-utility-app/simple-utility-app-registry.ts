/**
 * Simple Utility App — detection, module contracts, and planning templates.
 * Covers calculator, todo, notes, timer, and counter prompts that must build without
 * irrelevant dashboard/settings infrastructure.
 *
 * Critically: these detectors only fire for *single-purpose* utility prompts. A product that
 * lists several entity capabilities (contacts + tasks + notes, menu + orders + inventory, …)
 * is a multi-feature application and must never collapse to the first matching utility word.
 */

export type SimpleUtilityAppKind = 'calculator' | 'todo' | 'notes' | 'timer' | 'counter';

const SIMPLE_UTILITY_PATTERNS: ReadonlyArray<{ kind: SimpleUtilityAppKind; pattern: RegExp }> = [
  { kind: 'calculator', pattern: /\bcalculator\b/i },
  { kind: 'todo', pattern: /\b(?:todo|to-do)(?:\s+(?:list|app))?\b/i },
  // Require "notes app" / leading purpose — bare "notes" is a common capability noun, not a
  // sufficient signal that the entire product is a single-purpose notes utility.
  { kind: 'notes', pattern: /\bnotes?\s+app\b|\bsimple\s+notes?\b|\bnote[\s-]?taking\b/i },
  { kind: 'timer', pattern: /\btimer(?:\s+app)?\b/i },
  { kind: 'counter', pattern: /\bcounter(?:\s+app)?\b/i },
];

const BUILD_VERB_PATTERN = /\b(build|create|make)\b/i;

/**
 * Domain-neutral product-entity nouns. Two or more distinct hits mean the prompt describes a
 * composed application, not a single-purpose utility — simple-utility detection must yield.
 */
const MULTI_ENTITY_PRODUCT_PATTERNS: readonly RegExp[] = [
  /\bcontacts?\b/i,
  /\btasks?\b/i,
  /\bnotes?\b/i,
  /\bcategories?\b/i,
  /\bproducts?\b/i,
  /\bstock\b/i,
  /\bsuppliers?\b/i,
  /\bappointments?\b/i,
  /\bservices?\b/i,
  /\borders?\b/i,
  /\bmenu\b/i,
  /\binventory\b/i,
  /\bcustomers?\b/i,
  /\bstaff\b/i,
  /\btables?\b/i,
];

export function promptDescribesMultiEntityProduct(rawPrompt: string): boolean {
  let hits = 0;
  for (const pattern of MULTI_ENTITY_PRODUCT_PATTERNS) {
    if (pattern.test(rawPrompt)) {
      hits += 1;
      if (hits >= 2) return true;
    }
  }
  return false;
}

export function detectSimpleUtilityAppKind(rawPrompt: string): SimpleUtilityAppKind | null {
  const normalized = rawPrompt.trim();
  if (!BUILD_VERB_PATTERN.test(normalized)) return null;
  if (promptDescribesMultiEntityProduct(normalized)) return null;
  for (const entry of SIMPLE_UTILITY_PATTERNS) {
    if (entry.pattern.test(normalized)) return entry.kind;
  }
  return null;
}

export function isSimpleUtilityAppPrompt(rawPrompt: string): boolean {
  return detectSimpleUtilityAppKind(rawPrompt) !== null;
}

export function simpleUtilityFeatureModules(kind: SimpleUtilityAppKind): string[] {
  switch (kind) {
    case 'calculator':
      return ['calculator'];
    case 'todo':
      return ['todo-list'];
    case 'notes':
      return ['notes'];
    case 'timer':
      return ['timer'];
    case 'counter':
      return ['counter'];
  }
}

export function simpleUtilityRoutes(kind: SimpleUtilityAppKind): string[] {
  const modules = simpleUtilityFeatureModules(kind);
  return modules.map((moduleId, index) => (index === 0 ? '/' : `/${moduleId}`));
}

export function simpleUtilityRequiredUiTerms(kind: SimpleUtilityAppKind): string[] {
  switch (kind) {
    case 'calculator':
      return ['calculator', '+', '-', '×', '÷', 'equals', 'clear'];
    case 'todo':
      return ['todo', 'add', 'complete', 'delete'];
    case 'notes':
      return ['notes', 'edit', 'delete'];
    case 'timer':
      return ['timer', 'start', 'pause', 'reset'];
    case 'counter':
      return ['counter', 'increment', 'decrement', 'reset'];
  }
}

export function simpleUtilityAppTitle(kind: SimpleUtilityAppKind): string {
  switch (kind) {
    case 'calculator':
      return 'Calculator App';
    case 'todo':
      return 'Todo App';
    case 'notes':
      return 'Notes App';
    case 'timer':
      return 'Timer App';
    case 'counter':
      return 'Counter App';
  }
}

export function simpleUtilityNormalizedGoal(kind: SimpleUtilityAppKind): string {
  switch (kind) {
    case 'calculator':
      return 'Browser calculator with number pad, operators, clear, and equals result';
    case 'todo':
      return 'Simple todo list with add, complete, and delete in the browser';
    case 'notes':
      return 'Simple notes app with create, edit, and delete notes in the browser';
    case 'timer':
      return 'Countdown/stopwatch timer with start, pause, and reset controls';
    case 'counter':
      return 'Increment/decrement counter with reset in the browser';
  }
}

export const SIMPLE_UTILITY_FORBIDDEN_MODULES = new Set(['dashboard', 'settings']);

export const SIMPLE_UTILITY_SHELL_MODULES = new Set(['navigation-router', 'persistence', 'auth']);

export function isForbiddenSimpleUtilityModule(moduleId: string): boolean {
  return SIMPLE_UTILITY_FORBIDDEN_MODULES.has(moduleId);
}
