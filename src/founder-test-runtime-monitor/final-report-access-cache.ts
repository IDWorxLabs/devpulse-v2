/**
 * Final report access cache — unified local markdown resolution by runId (V1).
 */

export const FINAL_REPORT_ACCESS_CACHE_UNIFICATION_V1_PASS =
  'FINAL_REPORT_ACCESS_CACHE_UNIFICATION_V1_PASS';

export type FinalReportMarkdownSource =
  | 'local-cache'
  | 'last-report'
  | 'notification'
  | 'partial-report'
  | 'result-fetch'
  | 'complete-diagnostic'
  | 'none';

export function isFounderTestFinalReportMarkdownCandidate(markdown: string | null | undefined): boolean {
  if (!markdown || !markdown.trim()) return false;
  return (
    !markdown.includes('# Founder Test Runtime Failure Report') &&
    !markdown.includes('Founder test still running')
  );
}

export function resolveFinalReportMarkdownPriority(input: {
  runId: string | null;
  finalReportsByRunId: Readonly<Record<string, string>>;
  lastFounderTestReportMarkdown?: string | null;
  notificationReportMarkdown?: string | null;
  partialReportMarkdown?: string | null;
}): { markdown: string | null; source: FinalReportMarkdownSource; needsFetch: boolean } {
  const runId = input.runId;
  if (runId) {
    const cached = input.finalReportsByRunId[runId];
    if (cached && isFounderTestFinalReportMarkdownCandidate(cached)) {
      return { markdown: cached, source: 'local-cache', needsFetch: false };
    }
  }
  if (
    input.lastFounderTestReportMarkdown &&
    isFounderTestFinalReportMarkdownCandidate(input.lastFounderTestReportMarkdown)
  ) {
    return { markdown: input.lastFounderTestReportMarkdown, source: 'last-report', needsFetch: false };
  }
  if (
    input.notificationReportMarkdown &&
    isFounderTestFinalReportMarkdownCandidate(input.notificationReportMarkdown)
  ) {
    return { markdown: input.notificationReportMarkdown, source: 'notification', needsFetch: false };
  }
  if (input.partialReportMarkdown && isFounderTestFinalReportMarkdownCandidate(input.partialReportMarkdown)) {
    return { markdown: input.partialReportMarkdown, source: 'partial-report', needsFetch: false };
  }
  if (runId) {
    return { markdown: null, source: 'none', needsFetch: true };
  }
  return { markdown: null, source: 'none', needsFetch: false };
}

export function shouldUseCachedFinalReportDespiteFetchFailure(input: {
  runId: string | null;
  finalReportsByRunId: Readonly<Record<string, string>>;
  notificationReportMarkdown?: string | null;
  lastFounderTestReportMarkdown?: string | null;
}): boolean {
  const resolved = resolveFinalReportMarkdownPriority({
    runId: input.runId,
    finalReportsByRunId: input.finalReportsByRunId,
    lastFounderTestReportMarkdown: input.lastFounderTestReportMarkdown,
    notificationReportMarkdown: input.notificationReportMarkdown,
  });
  return resolved.markdown != null && resolved.source !== 'none';
}

export function storeFinalReportMarkdownInCache(
  cache: Record<string, string>,
  runId: string,
  markdown: string,
): Record<string, string> {
  if (!runId || !isFounderTestFinalReportMarkdownCandidate(markdown)) return cache;
  return { ...cache, [runId]: markdown };
}
