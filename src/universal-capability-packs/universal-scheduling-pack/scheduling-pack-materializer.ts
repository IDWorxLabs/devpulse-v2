/**
 * Universal Scheduling Pack — workspace materializer.
 */

import type { GeneratedWorkspaceFile } from '../../code-generation-engine/code-generation-engine-types.js';
import { UNIVERSAL_SCHEDULING_PACK_DESCRIPTOR } from './scheduling-pack-descriptor.js';

export function materializeSchedulingPack(configuration: Readonly<Record<string, unknown>>): GeneratedWorkspaceFile[] {
  const slotDurationMinutes = Number(configuration.slotDurationMinutes ?? 30);
  const granularityMinutes = Number(configuration.granularityMinutes ?? 15);
  const windowStartMinutes = Number(configuration.windowStartMinutes ?? 540);
  const windowEndMinutes = Number(configuration.windowEndMinutes ?? 1020);

  return [
    {
      relativePath: 'src/universal-capability-packs/scheduling/scheduling-runtime.ts',
      content: generateSelfContainedSchedulingRuntime({
        slotDurationMinutes,
        granularityMinutes,
        windowStartMinutes,
        windowEndMinutes,
      }),
    },
    {
      relativePath: 'src/universal-capability-packs/scheduling/scheduling-pack.json',
      content: `${JSON.stringify(
        {
          packId: UNIVERSAL_SCHEDULING_PACK_DESCRIPTOR.packId,
          version: UNIVERSAL_SCHEDULING_PACK_DESCRIPTOR.packVersion,
          slotDurationMinutes,
          granularityMinutes,
          windowStartMinutes,
          windowEndMinutes,
        },
        null,
        2,
      )}\n`,
    },
  ];
}

function generateSelfContainedSchedulingRuntime(config: {
  slotDurationMinutes: number;
  granularityMinutes: number;
  windowStartMinutes: number;
  windowEndMinutes: number;
}): string {
  return `/** Universal Scheduling Pack runtime — self-contained generated artifact */
export interface TimeInterval {
  startMinutes: number;
  endMinutes: number;
}

export interface AvailabilitySlot {
  startMinutes: number;
  endMinutes: number;
  label: string;
}

const MINUTES_PER_DAY = 24 * 60;
const SLOT_DURATION_MINUTES = ${config.slotDurationMinutes};
const GRANULARITY_MINUTES = ${config.granularityMinutes};
const DEFAULT_WINDOW: TimeInterval = { startMinutes: ${config.windowStartMinutes}, endMinutes: ${config.windowEndMinutes} };

function formatMinutes(total: number): string {
  const clamped = Math.max(0, Math.min(MINUTES_PER_DAY, Math.round(total)));
  const hours = Math.floor(clamped / 60);
  const minutes = clamped % 60;
  return String(hours).padStart(2, '0') + ':' + String(minutes).padStart(2, '0');
}

function isValidInterval(interval: TimeInterval): boolean {
  if (!Number.isFinite(interval.startMinutes) || !Number.isFinite(interval.endMinutes)) return false;
  if (interval.startMinutes < 0 || interval.endMinutes > MINUTES_PER_DAY) return false;
  return interval.startMinutes < interval.endMinutes;
}

function overlaps(a: TimeInterval, b: TimeInterval): boolean {
  return a.startMinutes < b.endMinutes && b.startMinutes < a.endMinutes;
}

function normalize(intervals: TimeInterval[]): TimeInterval[] {
  const sorted = intervals.filter(isValidInterval).sort((a, b) => a.startMinutes - b.startMinutes);
  const merged: TimeInterval[] = [];
  for (const current of sorted) {
    const last = merged[merged.length - 1];
    if (last && current.startMinutes <= last.endMinutes) {
      merged[merged.length - 1] = { startMinutes: last.startMinutes, endMinutes: Math.max(last.endMinutes, current.endMinutes) };
    } else {
      merged.push({ startMinutes: current.startMinutes, endMinutes: current.endMinutes });
    }
  }
  return merged;
}

function subtractBusy(window: TimeInterval, busy: TimeInterval[]): TimeInterval[] {
  const overlapping = normalize(busy.filter((b) => overlaps(window, b)));
  const free: TimeInterval[] = [];
  let cursor = window.startMinutes;
  for (const b of overlapping) {
    const blockStart = Math.max(b.startMinutes, window.startMinutes);
    const blockEnd = Math.min(b.endMinutes, window.endMinutes);
    if (blockStart > cursor) free.push({ startMinutes: cursor, endMinutes: blockStart });
    cursor = Math.max(cursor, blockEnd);
  }
  if (cursor < window.endMinutes) free.push({ startMinutes: cursor, endMinutes: window.endMinutes });
  return free;
}

function sliceSlots(interval: TimeInterval): AvailabilitySlot[] {
  const duration = Math.max(1, SLOT_DURATION_MINUTES);
  const step = Math.max(1, GRANULARITY_MINUTES || duration);
  const slots: AvailabilitySlot[] = [];
  for (let start = interval.startMinutes; start + duration <= interval.endMinutes; start += step) {
    const end = start + duration;
    slots.push({ startMinutes: start, endMinutes: end, label: formatMinutes(start) + '-' + formatMinutes(end) });
  }
  return slots;
}

export function computeAvailableSlots(windows: TimeInterval[], busy: TimeInterval[]): AvailabilitySlot[] {
  const source = windows.length > 0 ? windows : [DEFAULT_WINDOW];
  const slots: AvailabilitySlot[] = [];
  for (const window of normalize(source)) {
    for (const free of subtractBusy(window, busy)) slots.push(...sliceSlots(free));
  }
  return slots.sort((a, b) => a.startMinutes - b.startMinutes);
}

export class AvailabilityStore {
  private readonly windows: TimeInterval[] = [];
  private readonly busy: TimeInterval[] = [];
  private dirty = false;

  addWindow(interval: TimeInterval): boolean {
    if (!isValidInterval(interval)) return false;
    this.windows.push({ startMinutes: interval.startMinutes, endMinutes: interval.endMinutes });
    this.dirty = true;
    return true;
  }

  reserve(interval: TimeInterval): boolean {
    if (!isValidInterval(interval)) return false;
    const source = this.windows.length > 0 ? this.windows : [DEFAULT_WINDOW];
    const insideWindow = normalize(source).some((w) => interval.startMinutes >= w.startMinutes && interval.endMinutes <= w.endMinutes);
    if (!insideWindow) return false;
    if (this.busy.some((b) => overlaps(b, interval))) return false;
    this.busy.push({ startMinutes: interval.startMinutes, endMinutes: interval.endMinutes });
    this.dirty = true;
    return true;
  }

  release(interval: TimeInterval): boolean {
    const index = this.busy.findIndex((b) => b.startMinutes === interval.startMinutes && b.endMinutes === interval.endMinutes);
    if (index < 0) return false;
    this.busy.splice(index, 1);
    this.dirty = true;
    return true;
  }

  availableSlots(): AvailabilitySlot[] {
    return computeAvailableSlots(this.windows, this.busy);
  }

  isDirty(): boolean {
    return this.dirty;
  }
}

export const SCHEDULING_SLOT_DURATION_MINUTES = SLOT_DURATION_MINUTES;
`;
}
