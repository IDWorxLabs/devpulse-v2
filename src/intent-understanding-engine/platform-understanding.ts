/**
 * Intent Understanding Engine — platform understanding extraction.
 */

import { extractPromptFeatures } from '../prompt-faithful-generation/prompt-feature-extractor.js';
import type { PlatformTarget, PlatformUnderstanding, UnderstandingEvidence } from './intent-understanding-types.js';

function evidence(source: string, excerpt: string, weight = 1): UnderstandingEvidence {
  return { readOnly: true, source, excerpt, weight };
}

const PLATFORM_SIGNALS: Array<{ pattern: RegExp; target: PlatformTarget; excerpt: string }> = [
  { pattern: /\bandroid/i, target: 'ANDROID', excerpt: 'Android platform detected' },
  { pattern: /\bios|iphone|ipad/i, target: 'IOS', excerpt: 'iOS platform detected' },
  { pattern: /\bdesktop|windows|macos|linux/i, target: 'DESKTOP', excerpt: 'Desktop platform detected' },
  { pattern: /\btablet/i, target: 'TABLET', excerpt: 'Tablet layout detected' },
  { pattern: /\bweb\b|browser/i, target: 'WEB', excerpt: 'Web platform detected' },
  { pattern: /\boffline/i, target: 'OFFLINE', excerpt: 'Offline capability required' },
  { pattern: /\bcloud|saas/i, target: 'CLOUD', excerpt: 'Cloud deployment detected' },
  { pattern: /\bhybrid/i, target: 'HYBRID', excerpt: 'Hybrid deployment detected' },
  { pattern: /\bresponsive/i, target: 'RESPONSIVE', excerpt: 'Responsive layout required' },
  { pattern: /\bphone[\s-]?first|mobile[\s-]?first/i, target: 'PHONE_FIRST', excerpt: 'Phone-first design' },
  { pattern: /\bdesktop[\s-]?first/i, target: 'DESKTOP_FIRST', excerpt: 'Desktop-first design' },
];

export function extractPlatformUnderstanding(rawPrompt: string): PlatformUnderstanding {
  const extraction = extractPromptFeatures(rawPrompt);
  const targets = new Set<PlatformTarget>();
  const evidenceItems: UnderstandingEvidence[] = [];

  for (const signal of PLATFORM_SIGNALS) {
    if (signal.pattern.test(rawPrompt)) {
      targets.add(signal.target);
      evidenceItems.push(evidence('platform_signal', signal.excerpt, 0.9));
    }
  }

  for (const req of extraction.platformRequirements) {
    evidenceItems.push(evidence('prompt_extraction', req, 0.85));
    if (/android/i.test(req)) targets.add('ANDROID');
    if (/mobile|phone/i.test(req)) targets.add('PHONE_FIRST');
  }

  if (!targets.size) {
    targets.add('WEB');
    targets.add('RESPONSIVE');
    evidenceItems.push(evidence('default', `Inferred from: ${extraction.primaryPlatform}`, 0.7));
  }

  let primaryTarget: PlatformTarget = 'WEB';
  if (targets.has('PHONE_FIRST') || targets.has('ANDROID')) primaryTarget = 'PHONE_FIRST';
  else if (targets.has('DESKTOP_FIRST') || targets.has('DESKTOP')) primaryTarget = 'DESKTOP';
  else if (targets.has('TABLET')) primaryTarget = 'TABLET';
  else if (targets.has('IOS')) primaryTarget = 'IOS';

  return {
    readOnly: true,
    targets: [...targets],
    primaryTarget,
    offlineRequired: targets.has('OFFLINE'),
    cloudRequired: targets.has('CLOUD'),
    evidence: evidenceItems,
  };
}
