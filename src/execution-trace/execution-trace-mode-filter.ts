/**
 * Execution Trace viewing modes — Stream, Compact, Errors, Artifacts.
 */

import type { ExecutionTraceEvent, ExecutionTraceViewMode } from './execution-trace-types.js';

const MILESTONE_STAGES = new Set([
  'Build',
  'Validation',
  'Preview',
  'Deployment',
  'Security',
  'Performance',
  'Founder Test',
  'AutoFix',
]);

function isMilestone(event: ExecutionTraceEvent): boolean {
  if (MILESTONE_STAGES.has(event.runtimeStage)) return true;
  if (event.severity === 'ERROR' || event.severity === 'WARN') return true;
  if (event.artifactLinks && event.artifactLinks.length > 0) return true;
  if (event.metadata?.milestone === true) return true;
  return false;
}

function isArtifactEvent(event: ExecutionTraceEvent): boolean {
  if (event.artifactLinks && event.artifactLinks.length > 0) return true;
  const title = event.eventTitle.toLowerCase();
  return (
    title.includes('generated') ||
    title.includes('manifest') ||
    title.includes('preview') ||
    title.includes('workspace') ||
    title.includes('artifact') ||
    title.includes('npm install') ||
    title.includes('npm build') ||
    event.metadata?.category === 'artifact'
  );
}

export function filterExecutionTraceEvents(
  events: ExecutionTraceEvent[],
  mode: ExecutionTraceViewMode,
): ExecutionTraceEvent[] {
  const sorted = [...events].sort((a, b) => a.timestamp - b.timestamp);

  switch (mode) {
    case 'stream':
      return sorted;
    case 'compact':
      return sorted.filter(isMilestone);
    case 'errors':
      return sorted.filter((e) => e.severity === 'ERROR' || e.severity === 'WARN');
    case 'artifacts':
      return sorted.filter(isArtifactEvent);
    default:
      return sorted;
  }
}

export function searchExecutionTraceEvents(
  events: ExecutionTraceEvent[],
  query: string,
): ExecutionTraceEvent[] {
  const q = query.trim().toLowerCase();
  if (!q) return events;
  return events.filter((e) => {
    const haystack = [
      e.eventTitle,
      e.technicalDetail,
      e.runtimeStage,
      e.component,
      e.evidence ?? '',
      ...(e.artifactLinks ?? []),
      JSON.stringify(e.metadata ?? {}),
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}
