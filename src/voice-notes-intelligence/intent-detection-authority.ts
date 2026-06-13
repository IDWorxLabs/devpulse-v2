/**
 * Intent Detection Authority — transcript intent classification (V1).
 */

import { normalizeConfidence } from './audio-metadata-reader.js';
import type { IntentDetectionResult, VoiceIntentType } from './voice-notes-types.js';

interface IntentPattern {
  intent: VoiceIntentType;
  patterns: RegExp[];
  weight: number;
}

const INTENT_PATTERNS: IntentPattern[] = [
  {
    intent: 'BUILD_REQUEST',
    patterns: [
      /\bbuild\b/i,
      /\bneed to build\b/i,
      /\bbuild a (?:mobile |web )?app\b/i,
      /\bcreate an app\b/i,
      /\bmake a (web|mobile)? app\b/i,
      /\bdevelop\b/i,
    ],
    weight: 12,
  },
  {
    intent: 'FEATURE_REQUEST',
    patterns: [
      /\bfeature\b/i,
      /\badd\b.+\bfunctionality\b/i,
      /\bneed\b.+\bmodule\b/i,
      /\buser can\b/i,
      /\bintegration\b/i,
      /\boauth\b/i,
    ],
    weight: 10,
  },
  {
    intent: 'BUG_REPORT',
    patterns: [/\bbug\b/i, /\bbroken\b/i, /\bcrash(?:es|ing)?\b/i, /\bnot working\b/i, /\berror\b/i],
    weight: 11,
  },
  {
    intent: 'ROADMAP_REQUEST',
    patterns: [/\broadmap\b/i, /\bphase\b/i, /\blater\b/i, /\bfuture\b/i, /\bnext quarter\b/i],
    weight: 9,
  },
  {
    intent: 'DESIGN_REQUEST',
    patterns: [/\bdesign\b/i, /\bui\b/i, /\bux\b/i, /\bwireframe\b/i, /\blook and feel\b/i],
    weight: 10,
  },
  {
    intent: 'PLANNING_REQUEST',
    patterns: [/\bplan\b/i, /\barchitecture\b/i, /\brequirements\b/i, /\bscope\b/i, /\bmilestone\b/i, /\bmust\b/i],
    weight: 10,
  },
];

export function detectVoiceIntents(transcriptText: string): IntentDetectionResult {
  const normalized = transcriptText.trim();
  const detected: IntentDetectionResult['detectedIntents'][number][] = [];

  for (const pattern of INTENT_PATTERNS) {
    const evidence: string[] = [];
    let score = 0;
    for (const regex of pattern.patterns) {
      const match = normalized.match(regex);
      if (match) {
        score += pattern.weight;
        evidence.push(`MATCH_${match[0].toUpperCase().replace(/\s+/g, '_')}`);
      }
    }
    if (score > 0) {
      if (pattern.intent === 'BUILD_REQUEST' && /\bbuild a\b/i.test(normalized)) {
        score += 8;
      }
      detected.push({
        intent: pattern.intent,
        confidence: normalizeConfidence(45 + score),
        evidence,
      });
    }
  }

  detected.sort((a, b) => b.confidence - a.confidence);

  const primaryIntent: VoiceIntentType =
    detected[0]?.intent ??
    (/\bapp\b/i.test(normalized) ? 'BUILD_REQUEST' : 'PLANNING_REQUEST');

  if (detected.length === 0) {
    detected.push({
      intent: primaryIntent,
      confidence: 42,
      evidence: ['DEFAULT_INTENT_FROM_TRANSCRIPT_CONTEXT'],
    });
  }

  return {
    readOnly: true,
    primaryIntent,
    detectedIntents: detected,
  };
}
