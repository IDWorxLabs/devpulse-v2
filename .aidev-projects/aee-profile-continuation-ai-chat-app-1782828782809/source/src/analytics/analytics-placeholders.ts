/** Analytics placeholders — disabled by default. Marker: data-blueprint="analytics" */
export const BLUEPRINT_ANALYTICS_MARKER = 'data-blueprint="analytics"';
export const ANALYTICS_EVENTS = {
  signup: 'analytics.signup',
  session: 'analytics.session',
  retention: 'analytics.retention',
  usage: 'analytics.usage',
  featureUsage: 'analytics.feature_usage',
} as const;

export function trackAnalyticsEvent(_event: string, _payload?: Record<string, unknown>): void {
  /* placeholder — data-blueprint="analytics" */
}
