/**
 * Skeptical Founder Simulator — bounded integrity checks.
 */

import { SKEPTICAL_FOUNDER_SCENARIOS } from './skeptical-founder-scenarios.js';
import type { SkepticalFounderScenarioResult } from './skeptical-founder-types.js';

export function validateSkepticalScenarioCount(): { passed: boolean; detail: string } {
  const passed = SKEPTICAL_FOUNDER_SCENARIOS.length === 6;
  return { passed, detail: `count=${SKEPTICAL_FOUNDER_SCENARIOS.length}` };
}

export function validateSkepticalDeterministicScoring(
  first: SkepticalFounderScenarioResult[],
  second: SkepticalFounderScenarioResult[],
): { passed: boolean; detail: string } {
  const firstDigest = first.map((scenario) => `${scenario.id}:${scenario.score}:${scenario.passed}`).join('|');
  const secondDigest = second.map((scenario) => `${scenario.id}:${scenario.score}:${scenario.passed}`).join('|');
  return { passed: firstDigest === secondDigest, detail: firstDigest };
}

export function validateSkepticalLaunchBlocking(input: {
  skepticalFounderScore: number;
  launchRiskScore: number;
  criticalTrustObjection: boolean;
  blocksLaunchReadiness: boolean;
}): { passed: boolean; detail: string } {
  const shouldBlock =
    input.skepticalFounderScore < 60 || input.launchRiskScore > 70 || input.criticalTrustObjection;
  return {
    passed: input.blocksLaunchReadiness === shouldBlock,
    detail: `blocks=${input.blocksLaunchReadiness}; expected=${shouldBlock}`,
  };
}
