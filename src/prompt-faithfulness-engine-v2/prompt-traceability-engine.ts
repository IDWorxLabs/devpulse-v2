/**
 * Prompt Faithfulness Engine V2 — artifact traceability engine.
 */

import type {
  PromptKnowledgeGraph,
  PromptRequirement,
  TraceabilityLink,
} from './prompt-faithfulness-v2-types.js';

let linkCounter = 0;

export function resetPromptTraceabilityEngineForTests(): void {
  linkCounter = 0;
}

function nextLinkId(): string {
  linkCounter += 1;
  return `trace-${linkCounter}`;
}

function slugify(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
}

export function buildTraceabilityLinks(
  requirements: readonly PromptRequirement[],
  knowledgeGraph: PromptKnowledgeGraph,
  generatedModules: readonly string[] = [],
): TraceabilityLink[] {
  const links: TraceabilityLink[] = [];

  for (const node of knowledgeGraph.nodes) {
    if (node.nodeType === 'ROOT') {
      const allReqIds = requirements.slice(0, 8).map((r) => r.requirementId);
      links.push({
        readOnly: true,
        linkId: nextLinkId(),
        artifactPath: 'src/App.tsx',
        artifactType: 'COMPONENT',
        requirementIds: allReqIds,
        evidenceIds: requirements
          .slice(0, 8)
          .flatMap((r) => r.sourceEvidenceIds),
      });
      links.push({
        readOnly: true,
        linkId: nextLinkId(),
        artifactPath: 'src/blueprint/AppShell.tsx',
        artifactType: 'COMPONENT',
        requirementIds: node.requirementIds,
        evidenceIds: [],
      });
      continue;
    }

    if (node.nodeType === 'FEATURE') {
      const slug = slugify(node.label);
      const moduleId = generatedModules.find((m) => slug.includes(m) || m.includes(slug.split('-')[0] ?? '')) ?? slug;
      const relatedReqs = requirements.filter((r) => node.requirementIds.includes(r.requirementId));

      links.push({
        readOnly: true,
        linkId: nextLinkId(),
        artifactPath: `src/features/${moduleId}/${moduleId.replace(/-/g, '')}Feature.tsx`,
        artifactType: 'COMPONENT',
        requirementIds: node.requirementIds,
        evidenceIds: relatedReqs.flatMap((r) => r.sourceEvidenceIds),
      });
      links.push({
        readOnly: true,
        linkId: nextLinkId(),
        artifactPath: `src/features/${moduleId}/${moduleId}.service.ts`,
        artifactType: 'SERVICE',
        requirementIds: node.requirementIds,
        evidenceIds: relatedReqs.flatMap((r) => r.sourceEvidenceIds),
      });
    }

    if (node.nodeType === 'WORKFLOW') {
      links.push({
        readOnly: true,
        linkId: nextLinkId(),
        artifactPath: `src/workflows/${slugify(node.label)}.ts`,
        artifactType: 'WORKFLOW',
        requirementIds: node.requirementIds,
        evidenceIds: requirements
          .filter((r) => node.requirementIds.includes(r.requirementId))
          .flatMap((r) => r.sourceEvidenceIds),
      });
    }
  }

  const authReqs = requirements.filter((r) => /auth|login/i.test(r.description));
  if (authReqs.length) {
    links.push({
      readOnly: true,
      linkId: nextLinkId(),
      artifactPath: 'src/features/auth/auth.service.ts',
      artifactType: 'API',
      requirementIds: authReqs.map((r) => r.requirementId),
      evidenceIds: authReqs.flatMap((r) => r.sourceEvidenceIds),
    });
  }

  const dataReqs = requirements.filter((r) => r.category === 'STORAGE' || r.category === 'DATA_MODEL');
  if (dataReqs.length) {
    links.push({
      readOnly: true,
      linkId: nextLinkId(),
      artifactPath: 'src/data/demo-data.ts',
      artifactType: 'SCHEMA',
      requirementIds: dataReqs.map((r) => r.requirementId),
      evidenceIds: dataReqs.flatMap((r) => r.sourceEvidenceIds),
    });
  }

  return links;
}

export function getRequirementsForArtifact(
  links: readonly TraceabilityLink[],
  artifactPath: string,
): string[] {
  const link = links.find((l) => l.artifactPath === artifactPath);
  return link?.requirementIds ?? [];
}

export function assertArtifactHasLineage(
  links: readonly TraceabilityLink[],
  artifactPath: string,
): boolean {
  const link = links.find((l) => l.artifactPath === artifactPath);
  return Boolean(link && link.requirementIds.length > 0);
}
