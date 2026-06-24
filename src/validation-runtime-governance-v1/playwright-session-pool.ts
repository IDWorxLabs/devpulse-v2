/**
 * Validation Runtime Governance V1 — Playwright session pool.
 */

export interface PlaywrightSessionLease {
  sessionId: string;
  reused: boolean;
  browserReady: boolean;
}

interface PlaywrightPoolState {
  sessionId: string;
  contextCount: number;
  createdAt: number;
}

let poolState: PlaywrightPoolState | null = null;
let sessionCounter = 0;
let reuseCount = 0;
let newSessionCount = 0;

export function resetPlaywrightSessionPoolForTests(): void {
  poolState = null;
  sessionCounter = 0;
  reuseCount = 0;
  newSessionCount = 0;
}

export function getPlaywrightSessionPoolStats(): {
  active: boolean;
  reuseCount: number;
  newSessionCount: number;
  contextCount: number;
} {
  return {
    active: poolState !== null,
    reuseCount,
    newSessionCount,
    contextCount: poolState?.contextCount ?? 0,
  };
}

/**
 * Acquire shared browser session; reuses browser/context where safe.
 */
export function acquirePlaywrightSession(): PlaywrightSessionLease {
  if (poolState) {
    poolState.contextCount += 1;
    reuseCount += 1;
    return {
      sessionId: poolState.sessionId,
      reused: true,
      browserReady: true,
    };
  }

  sessionCounter += 1;
  newSessionCount += 1;
  poolState = {
    sessionId: `pw-session-${sessionCounter}`,
    contextCount: 1,
    createdAt: Date.now(),
  };

  return {
    sessionId: poolState.sessionId,
    reused: false,
    browserReady: true,
  };
}

export function releasePlaywrightSession(): void {
  if (!poolState) return;
  poolState.contextCount -= 1;
  if (poolState.contextCount <= 0) {
    poolState = null;
  }
}
