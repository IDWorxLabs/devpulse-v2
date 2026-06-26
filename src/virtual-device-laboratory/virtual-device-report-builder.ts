/**
 * Virtual Device Laboratory — pipeline report builder.
 */

import type { VirtualDevicePipelineResult } from './virtual-device-types.js';

export function buildVirtualDevicePipelineReport(result: VirtualDevicePipelineResult): string {
  return [
    '# Virtual Device Laboratory Report',
    '',
    `**Pipeline ID:** ${result.pipelineId}`,
    `**Verdict:** ${result.permissionVerdict}`,
    `**Blocked:** ${result.blockedReason ?? 'none'}`,
    '',
    '## Device Profiles',
    ...result.profiles.map(
      (p) => `- ${p.deviceType} ${p.orientation} ${p.themeMode} (${p.viewportWidth}x${p.viewportHeight})`,
    ),
    '',
    '## Matrix',
    ...result.matrix.map((m) => `- ${m.profileId}: ${m.reasonIncluded}`),
    '',
    '## Profile Results',
    ...result.profileResults.map(
      (r) => `- ${r.profileId}: ${r.passed ? 'PASS' : 'FAIL'} (${r.performance.status})`,
    ),
    '',
    '## Whole-App Sweep',
    `${result.wholeAppSweep.passed ? 'PASSED' : 'FAILED'}`,
    result.wholeAppSweep.resumedFromProfileId
      ? `Resumed from: ${result.wholeAppSweep.resumedFromProfileId}`
      : '',
    ...result.wholeAppSweep.checks.map((c) => `- ${c.check}: ${c.passed ? 'PASS' : 'FAIL'} — ${c.detail}`),
  ]
    .filter(Boolean)
    .join('\n');
}
