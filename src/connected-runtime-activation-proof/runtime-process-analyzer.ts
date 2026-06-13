/**
 * Runtime Process Analyzer — detect whether a runtime process was started.
 */

import type {
  RuntimeCommandAssessment,
  RuntimeProcessAssessment,
  RuntimeProcessState,
  RuntimeSessionEvidence,
} from './connected-runtime-activation-proof-types.js';

export function analyzeRuntimeProcess(input: {
  command: RuntimeCommandAssessment;
  sessionEvidence?: RuntimeSessionEvidence;
}): RuntimeProcessAssessment {
  const injected = input.sessionEvidence;

  if (injected?.processState) {
    const state = injected.processState;
    return {
      readOnly: true,
      processState: state,
      processId: injected.processId ?? null,
      commandUsed: injected.command ?? input.command.command,
      workingDirectory: injected.workingDirectory ?? input.command.workingDirectory,
      startTime: injected.startTime ?? null,
      exitStatus: injected.exitStatus ?? null,
      runtimeSessionId: injected.runtimeSessionId ?? null,
      confidence: state === 'STARTED' ? 90 : state === 'EXITED' ? 70 : 50,
    };
  }

  if (injected?.processId || injected?.runtimeSessionId) {
    return {
      readOnly: true,
      processState: 'STARTED',
      processId: injected.processId ?? null,
      commandUsed: injected.command ?? input.command.command,
      workingDirectory: injected.workingDirectory ?? input.command.workingDirectory,
      startTime: injected.startTime ?? null,
      exitStatus: injected.exitStatus ?? null,
      runtimeSessionId: injected.runtimeSessionId ?? null,
      confidence: 85,
    };
  }

  if (input.command.executionObserved) {
    return {
      readOnly: true,
      processState: 'STARTED',
      processId: null,
      commandUsed: input.command.command,
      workingDirectory: input.command.workingDirectory,
      startTime: null,
      exitStatus: null,
      runtimeSessionId: injected?.runtimeSessionId ?? null,
      confidence: 75,
    };
  }

  return {
    readOnly: true,
    processState: 'NOT_STARTED',
    processId: null,
    commandUsed: input.command.command,
    workingDirectory: input.command.workingDirectory,
    startTime: null,
    exitStatus: null,
    runtimeSessionId: null,
    confidence: input.command.runtimeCommandFound ? 20 : 0,
  };
}

export function isProcessObserved(state: RuntimeProcessState): boolean {
  return state === 'STARTED';
}
