export {
  SHARED_MEMORY_LAYER_PASS_TOKEN,
  SHARED_MEMORY_LAYER_OWNER_MODULE,
  DUPLICATE_SHARED_MEMORY_PATTERNS,
  MEMORY_FEED_SEQUENCE,
  nextMemoryId,
  resetMemoryIdCounterForTests,
  type MemoryCategory,
  type MemoryRecord,
  type SharedMemoryContext,
  type MemoryRecallResult,
} from './shared-memory-types.js';

export {
  SharedMemoryStore,
  getSharedMemoryStore,
  resetSharedMemoryStoreForTests,
} from './shared-memory-store.js';

export { seedArchitectureFacts, listArchitectureFacts } from './shared-memory-facts.js';
export { seedFounderDecisions, listFounderDecisions } from './shared-memory-decisions.js';
export { seedRuntimeObservations, listRuntimeObservations } from './shared-memory-observations.js';

export {
  recallRelevantMemories,
  recallByCategory,
  formatMemoryRecord,
  formatMemoryRecallResponse,
  isMemoryRecallQuery,
} from './shared-memory-recall.js';

export {
  ensureSharedMemorySeeded,
  resetSharedMemoryForTests,
  processMemoryForRequest,
  sharedMemoryKey,
  DevPulseV2SharedMemoryLayer,
  getDevPulseV2SharedMemoryLayer,
} from './shared-memory-runtime.js';
