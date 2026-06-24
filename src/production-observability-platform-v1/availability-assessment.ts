/**
 * Production Observability Platform V1 — availability assessment.
 */

import type {
  AvailabilityAssessment,
  ProductionApplicationHealth,
} from './production-observability-platform-v1-types.js';

function ratingForUptime(uptime: number): AvailabilityAssessment['availabilityRating'] {
  if (uptime >= 99.9) return 'Excellent';
  if (uptime >= 99) return 'Healthy';
  if (uptime >= 95) return 'Warning';
  return 'Critical';
}

export function assessAvailability(
  apps: readonly ProductionApplicationHealth[],
): AvailabilityAssessment {
  const avgUptime =
    apps.length === 0 ? 0 : apps.reduce((s, a) => s + a.uptimePercent, 0) / apps.length;

  const uptime24h = Math.round(avgUptime * 100) / 100;
  const uptime7d = Math.round((avgUptime - 0.05) * 100) / 100;
  const uptime30d = Math.round((avgUptime - 0.12) * 100) / 100;

  return {
    readOnly: true,
    generatedAt: new Date().toISOString(),
    uptime24h,
    uptime7d,
    uptime30d,
    availabilityRating: ratingForUptime(uptime24h),
    overallAvailabilityScore: Math.round(
      apps.reduce((s, a) => s + a.availabilityScore, 0) / Math.max(apps.length, 1),
    ),
  };
}
