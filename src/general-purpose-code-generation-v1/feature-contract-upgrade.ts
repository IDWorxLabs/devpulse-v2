/**
 * General-Purpose Code Generation V1 — extended feature contracts.
 */

import type { GeneralPurposeAppModel } from './general-purpose-code-generation-v1-types.js';

export interface ExtendedFeatureContracts {
  readOnly: true;
  profile: string;
  domain: string;
  strategy: string;
  workflowContracts: readonly {
    id: string;
    label: string;
    steps: readonly string[];
    critical: boolean;
  }[];
  roleContracts: readonly {
    id: string;
    label: string;
    permissions: readonly string[];
  }[];
  permissionContracts: readonly string[];
  domainBehaviorContracts: readonly {
    id: string;
    label: string;
    indicatorType: string;
  }[];
}

export function buildExtendedFeatureContracts(model: GeneralPurposeAppModel): ExtendedFeatureContracts {
  return {
    readOnly: true,
    profile: model.profile,
    domain: model.domain,
    strategy: model.strategy,
    workflowContracts: model.workflows.map((wf) => ({
      id: wf.id,
      label: wf.label,
      steps: wf.steps,
      critical: wf.critical,
    })),
    roleContracts: model.roles.map((role) => ({
      id: role.id,
      label: role.label,
      permissions: role.permissions,
    })),
    permissionContracts: model.permissions,
    domainBehaviorContracts: model.workflows.length
      ? [
          {
            id: `${model.strategy.toLowerCase()}-behavior`,
            label: `${model.appType} domain behavior`,
            indicatorType: 'workflow-state',
          },
        ]
      : [],
  };
}
