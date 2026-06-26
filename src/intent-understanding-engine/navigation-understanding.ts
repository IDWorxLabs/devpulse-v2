/**
 * Intent Understanding Engine — navigation understanding extraction.
 */

import { extractPromptFeatures } from '../prompt-faithful-generation/prompt-feature-extractor.js';
import { promptMentionsLisaOrAccessibility } from '../project-context-switching/project-context-classifier-guard.js';
import type { NavigationPattern, NavigationUnderstanding, UnderstandingEvidence } from './intent-understanding-types.js';

function evidence(source: string, excerpt: string, weight = 1): UnderstandingEvidence {
  return { readOnly: true, source, excerpt, weight };
}

const NAV_SIGNALS: Array<{ pattern: RegExp; pattern_type: NavigationPattern; excerpt: string }> = [
  { pattern: /\bbottom[\s-]?nav/i, pattern_type: 'BOTTOM_NAVIGATION', excerpt: 'Bottom navigation' },
  { pattern: /\bdrawer|hamburger/i, pattern_type: 'DRAWER', excerpt: 'Drawer navigation' },
  { pattern: /\bsidebar/i, pattern_type: 'SIDEBAR', excerpt: 'Sidebar navigation' },
  { pattern: /\btabs?\b/i, pattern_type: 'TABS', excerpt: 'Tab navigation' },
  { pattern: /\bwizard|step[\s-]?by[\s-]?step/i, pattern_type: 'WIZARD', excerpt: 'Wizard flow' },
  { pattern: /\bsingle[\s-]?screen/i, pattern_type: 'SINGLE_SCREEN', excerpt: 'Single screen layout' },
  { pattern: /\bdashboard/i, pattern_type: 'DASHBOARD', excerpt: 'Dashboard hub' },
  { pattern: /\bnested|sub[\s-]?nav/i, pattern_type: 'NESTED_NAVIGATION', excerpt: 'Nested navigation' },
];

export function extractNavigationUnderstanding(rawPrompt: string): NavigationUnderstanding {
  const extraction = extractPromptFeatures(rawPrompt);
  const patterns = new Set<NavigationPattern>();
  const evidenceItems: UnderstandingEvidence[] = [];

  for (const signal of NAV_SIGNALS) {
    if (signal.pattern.test(rawPrompt)) {
      patterns.add(signal.pattern_type);
      evidenceItems.push(evidence('navigation_signal', signal.excerpt, 0.85));
    }
  }

  if (promptMentionsLisaOrAccessibility(rawPrompt)) {
    patterns.add('BOTTOM_NAVIGATION');
    patterns.add('DASHBOARD');
    evidenceItems.push(evidence('domain_template', 'Assistive app uses bottom nav + dashboard', 0.95));
  } else if (extraction.requiredModules.length >= 4) {
    patterns.add('TABS');
    patterns.add('DASHBOARD');
    evidenceItems.push(evidence('module_count', `${extraction.requiredModules.length} modules → tab navigation`, 0.8));
  } else if (!patterns.size) {
    patterns.add('SIDEBAR');
    evidenceItems.push(evidence('default', 'Default sidebar navigation for web app', 0.6));
  }

  let primaryPattern: NavigationPattern = [...patterns][0] ?? 'SIDEBAR';
  if (patterns.has('BOTTOM_NAVIGATION')) primaryPattern = 'BOTTOM_NAVIGATION';
  else if (patterns.has('DASHBOARD')) primaryPattern = 'DASHBOARD';
  else if (patterns.has('TABS')) primaryPattern = 'TABS';

  const modules = extraction.requiredModules.slice(0, 8);
  const navigationGraph = modules.flatMap((moduleId, index) => {
    const edges: { from: string; to: string; trigger: string }[] = [];
    if (index === 0) {
      edges.push({ from: 'home', to: moduleId, trigger: 'navigate' });
    } else {
      edges.push({ from: modules[index - 1] ?? 'home', to: moduleId, trigger: 'navigate' });
    }
    return edges;
  });

  return {
    readOnly: true,
    patterns: [...patterns],
    primaryPattern,
    navigationGraph,
    evidence: evidenceItems,
  };
}
