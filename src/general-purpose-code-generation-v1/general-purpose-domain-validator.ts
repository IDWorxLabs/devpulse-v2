/**
 * General-Purpose Code Generation V1 — workflow/role/domain validation.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { GeneralPurposeAppModel } from './general-purpose-code-generation-v1-types.js';

function readWorkspaceSource(workspaceDir: string): string {
  const paths = [
    join(workspaceDir, 'src', 'App.tsx'),
    join(workspaceDir, 'src', 'gpcg', 'WorkflowPanel.tsx'),
    join(workspaceDir, 'src', 'gpcg', 'RoleSelector.tsx'),
    join(workspaceDir, 'src', 'gpcg', 'DomainLogicIndicators.tsx'),
    join(workspaceDir, 'src', 'gpcg', 'GeneralPurposeManifest.json'),
  ];
  return paths
    .filter((path) => existsSync(path))
    .map((path) => readFileSync(path, 'utf8'))
    .join('\n');
}

export function validateGeneralPurposeDomain(input: {
  workspaceDir: string;
  model: GeneralPurposeAppModel;
}): {
  workflowValidationPassed: boolean;
  roleCoveragePassed: boolean;
  domainLogicPassed: boolean;
} {
  const source = readWorkspaceSource(input.workspaceDir);
  const primaryWorkflow = input.model.workflows[0];
  const workflowStepsFound =
    primaryWorkflow?.steps.filter((step) => source.toLowerCase().includes(step.toLowerCase())).length ?? 0;
  const workflowValidationPassed =
    Boolean(primaryWorkflow && primaryWorkflow.steps.length >= 3) &&
    workflowStepsFound >= Math.min(3, primaryWorkflow.steps.length);

  const rolesFound = input.model.roles.filter((role) =>
    source.toLowerCase().includes(role.label.toLowerCase()),
  ).length;
  const roleCoveragePassed =
    input.model.roles.length >= 2 &&
    rolesFound >= 2 &&
    /role|permission|gpcg-role/i.test(source);

  const logicLabels = input.model.workflows.length
    ? [
        'booking conflict',
        'order status',
        'ticket priority',
        'course progress',
        'invoice status',
        'low stock',
        'status indicator',
        'domain logic',
      ]
    : [];
  const domainLogicPassed =
    /gpcg-domain-logic|domain-logic|indicatorType/i.test(source) &&
    logicLabels.some((label) => source.toLowerCase().includes(label));

  return { workflowValidationPassed, roleCoveragePassed, domainLogicPassed };
}
