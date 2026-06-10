/**
 * Missing Capability Escalation — repeated bottleneck detection.
 */

import type { BottleneckEvent, BottleneckPatternResult } from './escalation-types.js';
import { getCachedBottleneckPattern, setCachedBottleneckPattern } from './escalation-cache.js';

let bottleneckPatternCount = 0;

const BOTTLENECK_TYPES = [
  'validator',
  'orchestration',
  'verification',
  'resource',
  'dependency',
  'workspace',
];

export function detectRepeatedBottlenecks(
  bottlenecks: BottleneckEvent[],
  threshold = 2,
): BottleneckPatternResult {
  const cacheKey = bottlenecks.map((b) => `${b.bottleneckType}:${b.subsystem}`).join('|');
  const cached = getCachedBottleneckPattern(cacheKey);
  if (cached) return cached;

  if (bottlenecks.length < threshold) {
    const result: BottleneckPatternResult = {
      detected: false,
      bottleneckType: 'none',
      severity: 'LOW',
      frequency: bottlenecks.length,
      confidence: 20,
    };
    setCachedBottleneckPattern(cacheKey, result);
    return result;
  }

  const byType = new Map<string, number>();
  for (const b of bottlenecks) {
    byType.set(b.bottleneckType, (byType.get(b.bottleneckType) ?? 0) + 1);
  }

  let topType = 'unknown';
  let topCount = 0;
  for (const [type, count] of byType) {
    if (count > topCount) {
      topType = type;
      topCount = count;
    }
  }

  const detected = topCount >= threshold;
  let severity: BottleneckPatternResult['severity'] = 'MEDIUM';
  if (topCount >= 5) severity = 'CRITICAL';
  else if (topCount >= 3) severity = 'HIGH';

  const confidence = Math.min(95, 40 + topCount * 15 + (BOTTLENECK_TYPES.includes(topType) ? 10 : 0));

  if (detected) bottleneckPatternCount += 1;

  const result: BottleneckPatternResult = {
    detected,
    bottleneckType: topType,
    severity,
    frequency: topCount,
    confidence,
  };

  setCachedBottleneckPattern(cacheKey, result);
  return result;
}

export function getBottleneckPatternCount(): number {
  return bottleneckPatternCount;
}

export function resetBottleneckPatternDetectorForTests(): void {
  bottleneckPatternCount = 0;
}
