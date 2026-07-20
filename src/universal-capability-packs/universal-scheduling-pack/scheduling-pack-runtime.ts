/**
 * Universal Scheduling Pack — testable runtime (domain-neutral).
 *
 * Models generic time-window availability: a set of approved availability windows minus a set of
 * reserved (busy) intervals yields the free intervals, which are then divided into fixed-duration
 * bookable slots on a configurable granularity. Times are represented as minutes-from-midnight
 * integers so the algorithm is deterministic and free of any calendar/timezone or product-domain
 * assumptions (no appointment/booking/service vocabulary).
 */

export interface TimeInterval {
  readonly startMinutes: number;
  readonly endMinutes: number;
}

export interface AvailabilitySlot {
  readonly startMinutes: number;
  readonly endMinutes: number;
  readonly label: string;
}

export interface SchedulingConfig {
  readonly slotDurationMinutes: number;
  readonly granularityMinutes: number;
}

export interface SchedulingValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

const MINUTES_PER_DAY = 24 * 60;

export function formatMinutes(total: number): string {
  const clamped = Math.max(0, Math.min(MINUTES_PER_DAY, Math.round(total)));
  const hours = Math.floor(clamped / 60);
  const minutes = clamped % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function validateInterval(interval: TimeInterval): SchedulingValidationResult {
  const errors: string[] = [];
  if (!Number.isFinite(interval.startMinutes) || !Number.isFinite(interval.endMinutes)) {
    errors.push('Interval bounds must be finite minute values');
  }
  if (interval.startMinutes < 0 || interval.endMinutes > MINUTES_PER_DAY) {
    errors.push('Interval must fall within a single day (0..1440 minutes)');
  }
  if (interval.startMinutes >= interval.endMinutes) {
    errors.push('Interval start must be strictly before its end');
  }
  return { valid: errors.length === 0, errors };
}

function intervalsOverlap(a: TimeInterval, b: TimeInterval): boolean {
  return a.startMinutes < b.endMinutes && b.startMinutes < a.endMinutes;
}

/** Merges overlapping/adjacent intervals into a normalized, sorted, non-overlapping set. */
export function normalizeIntervals(intervals: readonly TimeInterval[]): TimeInterval[] {
  const sorted = [...intervals]
    .filter((i) => validateInterval(i).valid)
    .sort((a, b) => a.startMinutes - b.startMinutes);
  const merged: TimeInterval[] = [];
  for (const current of sorted) {
    const last = merged[merged.length - 1];
    if (last && current.startMinutes <= last.endMinutes) {
      merged[merged.length - 1] = {
        startMinutes: last.startMinutes,
        endMinutes: Math.max(last.endMinutes, current.endMinutes),
      };
    } else {
      merged.push({ startMinutes: current.startMinutes, endMinutes: current.endMinutes });
    }
  }
  return merged;
}

/** Subtracts busy intervals from a single availability window, returning the free sub-intervals. */
export function subtractBusyFromWindow(window: TimeInterval, busy: readonly TimeInterval[]): TimeInterval[] {
  const overlapping = normalizeIntervals(busy.filter((b) => intervalsOverlap(window, b)));
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

/** Divides a free interval into fixed-duration slots aligned to the configured granularity. */
export function sliceIntervalIntoSlots(interval: TimeInterval, config: SchedulingConfig): AvailabilitySlot[] {
  const duration = Math.max(1, Math.round(config.slotDurationMinutes));
  const step = Math.max(1, Math.round(config.granularityMinutes || duration));
  const slots: AvailabilitySlot[] = [];
  for (let start = interval.startMinutes; start + duration <= interval.endMinutes; start += step) {
    const end = start + duration;
    slots.push({ startMinutes: start, endMinutes: end, label: `${formatMinutes(start)}-${formatMinutes(end)}` });
  }
  return slots;
}

export function computeAvailableSlots(input: {
  windows: readonly TimeInterval[];
  busy: readonly TimeInterval[];
  config: SchedulingConfig;
}): AvailabilitySlot[] {
  const windows = normalizeIntervals(input.windows);
  const slots: AvailabilitySlot[] = [];
  for (const window of windows) {
    for (const free of subtractBusyFromWindow(window, input.busy)) {
      slots.push(...sliceIntervalIntoSlots(free, input.config));
    }
  }
  return slots.sort((a, b) => a.startMinutes - b.startMinutes);
}

export class AvailabilityStore {
  private readonly windows: TimeInterval[] = [];
  private readonly busy: TimeInterval[] = [];
  private dirty = false;

  addWindow(interval: TimeInterval): SchedulingValidationResult {
    const result = validateInterval(interval);
    if (!result.valid) return result;
    this.windows.push({ startMinutes: interval.startMinutes, endMinutes: interval.endMinutes });
    this.dirty = true;
    return { valid: true, errors: [] };
  }

  reserve(interval: TimeInterval): SchedulingValidationResult {
    const result = validateInterval(interval);
    if (!result.valid) return result;
    const insideWindow = normalizeIntervals(this.windows).some(
      (w) => interval.startMinutes >= w.startMinutes && interval.endMinutes <= w.endMinutes,
    );
    if (!insideWindow) {
      return { valid: false, errors: ['Reserved interval must fall inside an approved availability window'] };
    }
    if (this.busy.some((b) => intervalsOverlap(b, interval))) {
      return { valid: false, errors: ['Reserved interval overlaps an existing reservation'] };
    }
    this.busy.push({ startMinutes: interval.startMinutes, endMinutes: interval.endMinutes });
    this.dirty = true;
    return { valid: true, errors: [] };
  }

  release(interval: TimeInterval): boolean {
    const index = this.busy.findIndex(
      (b) => b.startMinutes === interval.startMinutes && b.endMinutes === interval.endMinutes,
    );
    if (index < 0) return false;
    this.busy.splice(index, 1);
    this.dirty = true;
    return true;
  }

  availableSlots(config: SchedulingConfig): AvailabilitySlot[] {
    return computeAvailableSlots({ windows: this.windows, busy: this.busy, config });
  }

  reservedIntervals(): TimeInterval[] {
    return normalizeIntervals(this.busy);
  }

  isDirty(): boolean {
    return this.dirty;
  }
}
