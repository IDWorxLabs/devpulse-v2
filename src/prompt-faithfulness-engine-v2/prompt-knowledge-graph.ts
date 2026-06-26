/**
 * Prompt Faithfulness Engine V2 — prompt knowledge graph builder.
 */

import { extractPromptFeatures } from '../prompt-faithful-generation/prompt-feature-extractor.js';
import type {
  KnowledgeGraphNode,
  PromptKnowledgeGraph,
  PromptRequirement,
} from './prompt-faithfulness-v2-types.js';

let graphCounter = 0;

export function resetPromptKnowledgeGraphForTests(): void {
  graphCounter = 0;
}

function nextGraphId(): string {
  graphCounter += 1;
  return `pkg-${graphCounter}`;
}

export function buildPromptKnowledgeGraph(
  requirements: readonly PromptRequirement[],
  rawPrompt?: string,
): PromptKnowledgeGraph {
  const extraction = extractPromptFeatures(rawPrompt ?? requirements[0]?.description ?? 'application');
  const nodes: KnowledgeGraphNode[] = [];
  const rootId = 'root-dashboard';
  const functionalReqs = requirements.filter((r) => r.category === 'FUNCTIONAL');
  const workflowReqs = requirements.filter((r) => r.category === 'USER_WORKFLOW');
  const navReqs = requirements.filter((r) => r.category === 'NAVIGATION');
  const settingsReqs = requirements.filter(
    (r) => /setting|theme|notif|profile/i.test(r.description),
  );

  nodes.push({
    readOnly: true,
    nodeId: rootId,
    label: extraction.appName || 'Dashboard',
    nodeType: 'ROOT',
    requirementIds: [],
    children: [],
    parentId: null,
  });

  const featureChildren: string[] = [];
  for (const moduleId of extraction.requiredModules.slice(0, 10)) {
    const nodeId = `feature-${moduleId}`;
    const relatedReqs = functionalReqs
      .filter((r) => r.description.toLowerCase().includes(moduleId.replace(/-/g, ' ')) || r.description.includes(moduleId))
      .map((r) => r.requirementId);
    const actions = ['Create', 'Edit', 'Delete', 'Search'].filter((_, i) => i < 2 + (moduleId.length % 3));
    const actionChildren: string[] = [];

    for (const action of actions) {
      const actionId = `${nodeId}-${action.toLowerCase()}`;
      actionChildren.push(actionId);
      nodes.push({
        readOnly: true,
        nodeId: actionId,
        label: action,
        nodeType: 'WORKFLOW',
        requirementIds: relatedReqs.slice(0, 1),
        children: [],
        parentId: nodeId,
      });
    }

    featureChildren.push(nodeId);
    nodes.push({
      readOnly: true,
      nodeId,
      label: moduleId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      nodeType: 'FEATURE',
      requirementIds: relatedReqs,
      children: actionChildren,
      parentId: rootId,
    });
  }

  if (!featureChildren.length) {
    for (const req of functionalReqs.slice(0, 6)) {
      const nodeId = `feature-${req.requirementId}`;
      featureChildren.push(nodeId);
      nodes.push({
        readOnly: true,
        nodeId,
        label: req.description.slice(0, 40),
        nodeType: 'FEATURE',
        requirementIds: [req.requirementId],
        children: [],
        parentId: rootId,
      });
    }
  }

  if (workflowReqs.length) {
    const wfId = 'workflow-primary';
    featureChildren.push(wfId);
    nodes.push({
      readOnly: true,
      nodeId: wfId,
      label: 'Primary Workflow',
      nodeType: 'USER_JOURNEY',
      requirementIds: workflowReqs.map((r) => r.requirementId),
      children: [],
      parentId: rootId,
    });
  }

  if (settingsReqs.length || navReqs.length) {
    const settingsId = 'settings';
    featureChildren.push(settingsId);
    const settingsChildren: string[] = [];
    if (settingsReqs.some((r) => /theme/i.test(r.description))) {
      settingsChildren.push('settings-theme');
      nodes.push({
        readOnly: true,
        nodeId: 'settings-theme',
        label: 'Theme',
        nodeType: 'FEATURE',
        requirementIds: settingsReqs.filter((r) => /theme/i.test(r.description)).map((r) => r.requirementId),
        children: [],
        parentId: settingsId,
      });
    }
    if (settingsReqs.some((r) => /notif/i.test(r.description))) {
      settingsChildren.push('settings-notifications');
      nodes.push({
        readOnly: true,
        nodeId: 'settings-notifications',
        label: 'Notifications',
        nodeType: 'FEATURE',
        requirementIds: settingsReqs.filter((r) => /notif/i.test(r.description)).map((r) => r.requirementId),
        children: [],
        parentId: settingsId,
      });
    }
    nodes.push({
      readOnly: true,
      nodeId: settingsId,
      label: 'Settings',
      nodeType: 'NAVIGATION',
      requirementIds: [...settingsReqs, ...navReqs].map((r) => r.requirementId),
      children: settingsChildren,
      parentId: rootId,
    });
  }

  const root = nodes.find((n) => n.nodeId === rootId);
  if (root) {
    const rootIndex = nodes.findIndex((n) => n.nodeId === rootId);
    nodes[rootIndex] = { ...root, children: featureChildren };
  }

  return {
    readOnly: true,
    graphId: nextGraphId(),
    rootNodeId: rootId,
    nodes,
  };
}
