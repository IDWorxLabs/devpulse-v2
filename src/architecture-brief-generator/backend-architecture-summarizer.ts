/**
 * Backend Architecture Summarizer — detected backend needs (V1).
 */

import type { ArchitectureEvidenceBundle, ArchitectureBackendSummary } from './architecture-brief-types.js';

export function summarizeBackendArchitecture(bundle: ArchitectureEvidenceBundle): ArchitectureBackendSummary {
  const hasWorkflows = bundle.workflows.length > 0;
  const hasIntegrations = bundle.integrations.length > 0;
  const hasBusinessRules = bundle.businessRules.length > 0;
  const hasNotifications = bundle.notifications.length > 0;
  const hasAdminWorkflow = bundle.workflows.some((w) => /admin|approval|orchestr/i.test(w));

  const apis = bundle.screens.length > 0 || hasIntegrations;
  const businessServices = hasBusinessRules || hasWorkflows;
  const backgroundJobs = hasNotifications || bundle.workflows.some((w) => /billing|subscription|report/i.test(w));
  const workflowOrchestration = hasAdminWorkflow || bundle.workflows.length >= 2;

  const detectedNeeds: string[] = [];
  if (apis) detectedNeeds.push('REST or GraphQL APIs backing client screens');
  if (businessServices) detectedNeeds.push('Domain business services for core workflows');
  if (backgroundJobs) detectedNeeds.push('Background jobs for notifications and async processing');
  if (workflowOrchestration) detectedNeeds.push('Workflow orchestration for multi-step processes');

  return {
    readOnly: true,
    apis,
    businessServices,
    backgroundJobs,
    workflowOrchestration,
    detectedNeeds,
    evidence: [`WORKFLOWS_${bundle.workflows.length}`, `INTEGRATIONS_${bundle.integrations.length}`],
  };
}
