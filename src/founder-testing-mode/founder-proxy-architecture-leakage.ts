/**
 * Founder Proxy — architecture leakage detection.
 */

export type ArchitectureLeakageLevel = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ArchitectureLeakageFinding {
  label: string;
  excerpt: string;
  weight: number;
}

export interface ArchitectureLeakageAssessment {
  level: ArchitectureLeakageLevel;
  riskScore: number;
  findings: ArchitectureLeakageFinding[];
}

const LEAK_PATTERNS: ReadonlyArray<{ pattern: RegExp; weight: number; label: string }> = [
  { pattern: /\bdevpulse\s*v2\b/i, weight: 35, label: 'DevPulse V2 reference' },
  { pattern: /\bphase\s*\d+(?:\.\d+)?\b/i, weight: 28, label: 'Internal phase number' },
  { pattern: /\bunified decision layer\b/i, weight: 22, label: 'Unified Decision Layer' },
  { pattern: /\bfoundation building\b/i, weight: 20, label: 'Foundation building terminology' },
  { pattern: /\bfoundation stacks?\b/i, weight: 18, label: 'Foundation stacks' },
  { pattern: /\bownership registry\b/i, weight: 18, label: 'Ownership registry' },
  { pattern: /\bowner_module\b/i, weight: 16, label: 'Owner module identifier' },
  { pattern: /\bvalidate:[a-z0-9-]+\b/i, weight: 14, label: 'Validator script reference' },
  { pattern: /\bdevpulse_v2_/i, weight: 16, label: 'Internal registry identifier' },
  { pattern: /\bworld\s*2\b/i, weight: 12, label: 'World 2 internal naming' },
  { pattern: /\boperator feed\b/i, weight: 10, label: 'Operator feed internals' },
  { pattern: /\bgovernance stack\b/i, weight: 12, label: 'Governance stack terminology' },
  { pattern: /\buvl\b/i, weight: 10, label: 'UVL internal acronym' },
  { pattern: /\bimplement(?:ation)? detail/i, weight: 8, label: 'Implementation detail framing' },
];

function levelFromRiskScore(score: number): ArchitectureLeakageLevel {
  if (score <= 0) return 'NONE';
  if (score <= 15) return 'LOW';
  if (score <= 35) return 'MEDIUM';
  if (score <= 55) return 'HIGH';
  return 'CRITICAL';
}

export function assessArchitectureLeakage(text: string): ArchitectureLeakageAssessment {
  const findings: ArchitectureLeakageFinding[] = [];
  let riskScore = 0;

  for (const entry of LEAK_PATTERNS) {
    const match = entry.pattern.exec(text);
    if (match) {
      const excerpt = text.slice(Math.max(0, match.index - 20), match.index + match[0].length + 40).trim();
      findings.push({ label: entry.label, excerpt, weight: entry.weight });
      riskScore += entry.weight;
    }
  }

  return {
    level: levelFromRiskScore(riskScore),
    riskScore: Math.min(100, riskScore),
    findings,
  };
}

export function leakageLevelSeverity(level: ArchitectureLeakageLevel): number {
  const map: Record<ArchitectureLeakageLevel, number> = {
    NONE: 0,
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3,
    CRITICAL: 4,
  };
  return map[level];
}
