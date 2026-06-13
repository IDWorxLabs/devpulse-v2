/**
 * Integration Architecture Summarizer — detected integrations (V1).
 */

import type {
  ArchitectureEvidenceBundle,
  ArchitectureIntegrationItem,
  ArchitectureIntegrationSummary,
} from './architecture-brief-types.js';

let integrationCounter = 0;

export function resetIntegrationCounterForTests(): void {
  integrationCounter = 0;
}

function categorizeIntegration(name: string): ArchitectureIntegrationItem['category'] {
  const upper = name.toUpperCase();
  if (/STRIPE|PAYPAL|PAYMENT|BILLING/.test(upper)) return 'PAYMENT';
  if (/OPENAI|ANTHROPIC|AI|GPT/.test(upper)) return 'AI';
  if (/TWILIO|SENDGRID|EMAIL|SMS|PUSH/.test(upper)) return 'COMMUNICATION';
  if (/GOOGLE|OAUTH|AUTH0|CLERK/.test(upper)) return 'AUTH';
  return 'THIRD_PARTY';
}

export function summarizeIntegrationArchitecture(bundle: ArchitectureEvidenceBundle): ArchitectureIntegrationSummary {
  const integrations: ArchitectureIntegrationItem[] = bundle.integrations.map((name) => {
    integrationCounter += 1;
    return {
      readOnly: true,
      integrationId: `integration-${integrationCounter}`,
      name,
      category: categorizeIntegration(name),
      evidence: [`INTEGRATION:${name}`, ...bundle.sources.slice(0, 2)],
    };
  });

  const thirdPartyApis = integrations
    .filter((i) => i.category === 'THIRD_PARTY' || i.category === 'AI')
    .map((i) => i.name);

  return {
    readOnly: true,
    integrations,
    thirdPartyApis: thirdPartyApis.length > 0 ? thirdPartyApis : integrations.map((i) => i.name),
  };
}

export function summarizeSecurityArchitecture(bundle: ArchitectureEvidenceBundle): import('./architecture-brief-types.js').ArchitectureSecuritySummary {
  const authentication = bundle.authentication.length > 0
    ? [...bundle.authentication]
    : bundle.workflows.some((w) => /auth|login|signup/i.test(w))
      ? ['OAuth', 'session-based authentication']
      : [];

  const authorization = bundle.userRoles.length > 1
    ? ['Role-based access control']
    : bundle.userRoles.length === 1
      ? ['Authenticated user access']
      : [];

  const permissions = bundle.userRoles.map((role) => `${role}-scoped permissions`);

  return {
    readOnly: true,
    authentication,
    authorization,
    permissions,
    userRoles: [...bundle.userRoles],
  };
}
