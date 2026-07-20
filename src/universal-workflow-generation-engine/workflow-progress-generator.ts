/** Universal Workflow Generation Engine V1 — progress calculation */
export function computeWorkflowProgress(completedSteps: number, totalRequiredSteps: number): number {
  if (totalRequiredSteps <= 0) return 100;
  return Math.min(100, Math.round((completedSteps / totalRequiredSteps) * 100));
}
