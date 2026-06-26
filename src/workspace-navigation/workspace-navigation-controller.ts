/**
 * Workspace Navigation V1 — controller facade.
 */

import {
  createWorkspaceNavigationState,
  pushWorkspaceNavigationEntry,
  snapshotWorkspaceNavigation,
  workspaceNavigationBack,
  workspaceNavigationForward,
} from './workspace-navigation-history.js';
import type {
  WorkspaceNavigationEntry,
  WorkspaceNavigationSnapshot,
  WorkspaceNavigationState,
} from './workspace-navigation-types.js';

export class WorkspaceNavigationController {
  private state: WorkspaceNavigationState = createWorkspaceNavigationState();

  push(entry: Omit<WorkspaceNavigationEntry, 'readOnly'>): void {
    this.state = pushWorkspaceNavigationEntry(this.state, entry);
  }

  back(): WorkspaceNavigationEntry | null {
    const result = workspaceNavigationBack(this.state);
    this.state = result.state;
    return result.entry;
  }

  forward(): WorkspaceNavigationEntry | null {
    const result = workspaceNavigationForward(this.state);
    this.state = result.state;
    return result.entry;
  }

  snapshot(
    surfaceTitles: Record<string, string>,
    projectNameResolver?: (projectId: string | null) => string | null,
  ): WorkspaceNavigationSnapshot {
    return snapshotWorkspaceNavigation(this.state, surfaceTitles, projectNameResolver);
  }

  getState(): WorkspaceNavigationState {
    return this.state;
  }

  reset(): void {
    this.state = createWorkspaceNavigationState();
  }
}

export {
  createWorkspaceNavigationState,
  pushWorkspaceNavigationEntry,
  snapshotWorkspaceNavigation,
  workspaceNavigationBack,
  workspaceNavigationForward,
} from './workspace-navigation-history.js';
