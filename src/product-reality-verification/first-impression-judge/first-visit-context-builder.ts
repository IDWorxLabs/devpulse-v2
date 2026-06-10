/**
 * First-Impression Judge — first-visit context builder.
 */

import type { FirstVisitContext, FirstVisitPersona } from './first-impression-types.js';
import { FIRST_VISIT_CONTEXT_PASS } from './first-impression-types.js';
import { getCachedFirstVisitContext, setCachedFirstVisitContext } from './first-impression-cache.js';

const PERSONA_DEFINITIONS: Record<FirstVisitPersona, Omit<FirstVisitContext, 'passToken'>> = {
  FOUNDER_FIRST_VISIT: {
    persona: 'FOUNDER_FIRST_VISIT',
    userIntent: 'Direct daily work, monitor progress, and trust system status without reading architecture docs',
    expectedClarity: 'Clear command center purpose, chat entry point, and operator feed intelligence',
    expectedTrustSignals: 'Brain connected status, honest not-connected warnings, visible verification state',
    expectedProductPromise: 'Autonomous AI development command center for founder-led product building',
    expectedFirstAction: 'Message DevPulse in chat to ask about roadmap, status, or next step',
    likelyConfusionRisks: ['diagnostic sections visible', 'placeholder nav items', 'technical phase labels'],
  },
  CUSTOMER_FIRST_VISIT: {
    persona: 'CUSTOMER_FIRST_VISIT',
    userIntent: 'Understand product value and whether DevPulse can help manage a software project',
    expectedClarity: 'Plain-language product purpose and obvious starting action',
    expectedTrustSignals: 'Professional UI, clear status, no broken surfaces',
    expectedProductPromise: 'Intelligent project command center with visible recommendations',
    expectedFirstAction: 'Explore chat or see a guided welcome explaining what DevPulse does',
    likelyConfusionRisks: ['too much technical diagnostics', 'unclear product naming', 'hidden features'],
  },
  INVESTOR_FIRST_VISIT: {
    persona: 'INVESTOR_FIRST_VISIT',
    userIntent: 'Assess product maturity, intelligence depth, and launch readiness perception',
    expectedClarity: 'Premium polish, coherent identity, and credible system status',
    expectedTrustSignals: 'Verification layers, honest capability boundaries, professional reporting',
    expectedProductPromise: 'Enterprise-grade AI development platform with visible intelligence',
    expectedFirstAction: 'Scan dashboard for maturity signals and intelligence visibility',
    likelyConfusionRisks: ['alpha diagnostics exposed', 'inconsistent connected/disconnected states', 'generic AI feel'],
  },
  TECHNICAL_REVIEWER_FIRST_VISIT: {
    persona: 'TECHNICAL_REVIEWER_FIRST_VISIT',
    userIntent: 'Evaluate architecture signals, verification depth, and system honesty',
    expectedClarity: 'Structured panels, status bar truthfulness, and verification surfaces',
    expectedTrustSignals: 'Read-only boundaries, validator ecosystem, UVL and brain health signals',
    expectedProductPromise: 'Verified modular AI platform with transparent system state',
    expectedFirstAction: 'Review status bar, operator feed pipeline, and founder reality surface',
    likelyConfusionRisks: ['excessive temporary diagnostics', 'placeholder navigation without labels'],
  },
  NON_TECHNICAL_USER_FIRST_VISIT: {
    persona: 'NON_TECHNICAL_USER_FIRST_VISIT',
    userIntent: 'Use DevPulse without technical background to get answers and direction',
    expectedClarity: 'Simple welcome, obvious chat input, minimal jargon',
    expectedTrustSignals: 'Friendly copy, clear buttons, visible help orientation',
    expectedProductPromise: 'Easy-to-use intelligent assistant for project questions',
    expectedFirstAction: 'Type a question in the chat input',
    likelyConfusionRisks: ['technical status bar text', 'diagnostic cards', 'architecture terminology'],
  },
};

let contextBuildCount = 0;

export function buildFirstVisitContext(persona: FirstVisitPersona): FirstVisitContext {
  const cacheKey = persona;
  const cached = getCachedFirstVisitContext(cacheKey);
  if (cached) return cached;

  contextBuildCount += 1;
  const def = PERSONA_DEFINITIONS[persona];
  const context: FirstVisitContext = { ...def, passToken: FIRST_VISIT_CONTEXT_PASS };
  setCachedFirstVisitContext(cacheKey, context);
  return context;
}

export function listFirstVisitPersonas(): readonly FirstVisitPersona[] {
  return Object.keys(PERSONA_DEFINITIONS) as FirstVisitPersona[];
}

export function getContextBuildCount(): number {
  return contextBuildCount;
}

export function resetFirstVisitContextBuilderForTests(): void {
  contextBuildCount = 0;
}
