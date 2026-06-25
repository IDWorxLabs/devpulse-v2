/**
 * Universal Prompt-to-App Materialization V1 — prompt-derived app metadata.
 */

export function extractPromptAppTitle(rawPrompt: string): string {
  const called = rawPrompt.match(/\bcalled\s+([A-Za-z][A-Za-z0-9]*)/i);
  if (called?.[1]) return called[1];

  const named = rawPrompt.match(/\bnamed\s+([A-Za-z][A-Za-z0-9]*)/i);
  if (named?.[1]) return named[1];

  const buildMatch = rawPrompt.match(
    /\bbuild\s+(?:a|an|the)?\s*(?:modern\s+|simple\s+|full-featured\s+)?([A-Za-z][A-Za-z0-9\s]{2,48}?)(?:\s+(?:web|mobile)\s+(?:app|application)|\s+app|\s+application|\s+system|\s+platform)/i,
  );
  if (buildMatch?.[1]) {
    return buildMatch[1]
      .trim()
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  return 'Custom App';
}

export function summarizePrompt(rawPrompt: string, maxLength = 160): string {
  const trimmed = rawPrompt.trim().replace(/\s+/g, ' ');
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength)}…`;
}

export function derivePromptFeatureTerms(rawPrompt: string): string[] {
  const lower = rawPrompt.toLowerCase();
  const candidates = [
    'habit',
    'streak',
    'daily routine',
    'routine',
    'dashboard',
    'reports',
    'charts',
    'analytics',
    'export',
    'csv',
    'categories',
    'income',
    'expenses',
    'balance',
    'customers',
    'leads',
    'pipeline',
    'deals',
    'contacts',
    'inventory',
    'stock',
    'products',
    'suppliers',
    'reorder',
    'booking',
    'appointments',
    'schedule',
    'qr',
    'scan',
    'generate',
    'tasks',
    'projects',
    'due dates',
  ];
  return candidates.filter((term) => lower.includes(term));
}

export function deriveGenericCustomFeatureModules(rawPrompt: string): string[] {
  const terms = derivePromptFeatureTerms(rawPrompt);
  const modules = new Set<string>(['dashboard', 'auth']);
  for (const term of terms) {
    if (/habit|streak|routine/.test(term)) {
      modules.add('habits');
      modules.add('streaks');
    }
    if (/dashboard|report|chart|analytics/.test(term)) modules.add('analytics');
    if (/export|csv/.test(term)) modules.add('export');
    if (/category|categories/.test(term)) modules.add('categories');
    if (term.length > 2) modules.add(term.replace(/\s+/g, '-'));
  }
  if (modules.size <= 2) {
    modules.add('records');
    modules.add('settings');
  }
  return [...modules];
}
