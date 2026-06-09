/**
 * Project knowledge model — single source of project facts for reasoning.
 */

export type ProjectFactCategory =
  | 'identity'
  | 'phase'
  | 'milestone'
  | 'gap'
  | 'blocked'
  | 'risk'
  | 'system'
  | 'roadmap'
  | 'memory'
  | 'relationship'
  | 'recommendation';

export type ProjectBroadIntent =
  | 'IDENTITY'
  | 'PROGRESS'
  | 'DEPENDENCIES'
  | 'RISKS'
  | 'PLANNING'
  | 'STATUS'
  | 'GENERAL_PROJECT'
  | 'UNKNOWN';

export interface ProjectFact {
  factId: string;
  category: ProjectFactCategory;
  title: string;
  statement: string;
  source: string;
  importance: number;
  tags: string[];
}

export interface ProjectKnowledgeSnapshot {
  projectId: string;
  projectName: string;
  factCount: number;
  facts: ProjectFact[];
  collectedAt: number;
}

export interface ProjectReasoningContext {
  query: string;
  snapshot: ProjectKnowledgeSnapshot;
  memoryFactCount: number;
  crossSystemFactCount: number;
  vaultFactCount: number;
  dependencyFactCount: number;
  workspaceFactCount: number;
  historyFactCount: number;
  roadmapPhase: string;
  roadmapNextPhase: string;
}

export interface ReasoningResult {
  intent: ProjectBroadIntent;
  selectedFacts: ProjectFact[];
  conclusions: string[];
  supportingEvidence: string[];
  recommendedNextStep: string;
  warnings: string[];
  relatedSystems: string[];
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export const PROJECT_KNOWLEDGE_REASONING_PASS_TOKEN =
  'DEVPULSE_V2_PROJECT_KNOWLEDGE_REASONING_V1_PASS';

export class ProjectKnowledgeModel {
  private facts: ProjectFact[] = [];

  loadFacts(facts: ProjectFact[]): void {
    this.facts = [...facts];
  }

  allFacts(): ProjectFact[] {
    return [...this.facts];
  }

  factsByCategory(category: ProjectFactCategory): ProjectFact[] {
    return this.facts.filter((f) => f.category === category);
  }

  factsMatchingTokens(tokens: string[]): ProjectFact[] {
    if (tokens.length === 0) return [];
    return this.facts.filter((fact) => {
      const haystack = [fact.title, fact.statement, ...fact.tags].join(' ').toLowerCase();
      return tokens.some((t) => t.length > 2 && haystack.includes(t));
    });
  }

  snapshot(projectId: string, projectName: string): ProjectKnowledgeSnapshot {
    return {
      projectId,
      projectName,
      factCount: this.facts.length,
      facts: this.allFacts(),
      collectedAt: Date.now(),
    };
  }
}

let modelSingleton: ProjectKnowledgeModel | null = null;

export function getProjectKnowledgeModel(): ProjectKnowledgeModel {
  if (!modelSingleton) modelSingleton = new ProjectKnowledgeModel();
  return modelSingleton;
}

export function resetProjectKnowledgeModelForTests(): ProjectKnowledgeModel {
  modelSingleton = new ProjectKnowledgeModel();
  return modelSingleton;
}

let factCounter = 0;

export function nextProjectFactId(): string {
  factCounter += 1;
  return `pfact-${factCounter.toString().padStart(5, '0')}`;
}

export function resetProjectFactIdCounterForTests(): void {
  factCounter = 0;
}
