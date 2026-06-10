/**
 * Resource Allocation — resource reservations (planning only).
 */

import type { ResourceReservation, ResourceType } from './resource-allocation-types.js';
import { updateResourceUsage } from './resource-registry.js';
import { invalidateCapacityCache, invalidateReservationCache, setCachedReservations } from './resource-cache.js';
import { getRemainingCapacity } from './resource-capacity-manager.js';

const reservations = new Map<string, ResourceReservation>();
const reservationsByProject = new Map<string, ResourceReservation[]>();
let reservationCounter = 0;

const DEFAULT_RESERVATION_TTL_MS = 30 * 60 * 1000;

export function reserveResources(
  projectId: string,
  resourceType: ResourceType,
  units: number,
  ttlMs = DEFAULT_RESERVATION_TTL_MS,
): { ok: true; reservation: ResourceReservation } | { ok: false; error: string } {
  if (getRemainingCapacity(resourceType) < units) {
    return { ok: false, error: `Insufficient capacity for ${units} ${resourceType} units` };
  }

  reservationCounter += 1;
  const reservation: ResourceReservation = {
    reservationId: `resource-reservation-${reservationCounter}`,
    projectId,
    resourceType,
    units,
    expiresAt: Date.now() + ttlMs,
    createdAt: Date.now(),
  };

  reservations.set(reservation.reservationId, reservation);
  const projectReservations = reservationsByProject.get(projectId) ?? [];
  projectReservations.push(reservation);
  reservationsByProject.set(projectId, projectReservations);

  updateResourceUsage(resourceType, 0, units);
  invalidateCapacityCache(resourceType);
  invalidateReservationCache(projectId);
  setCachedReservations(projectId, projectReservations);

  return { ok: true, reservation };
}

export function releaseResources(reservationId: string): boolean {
  const reservation = reservations.get(reservationId);
  if (!reservation) return false;

  reservations.delete(reservationId);
  const projectReservations = (reservationsByProject.get(reservation.projectId) ?? []).filter(
    (r) => r.reservationId !== reservationId,
  );
  reservationsByProject.set(reservation.projectId, projectReservations);

  updateResourceUsage(reservation.resourceType, 0, -reservation.units);
  invalidateCapacityCache(reservation.resourceType);
  invalidateReservationCache(reservation.projectId);

  return true;
}

export function listReservationsForProject(projectId: string): ResourceReservation[] {
  return (reservationsByProject.get(projectId) ?? []).filter((r) => r.expiresAt > Date.now());
}

export function getReservationCount(): number {
  return reservations.size;
}

export function resetResourceReservationsForTests(): void {
  reservations.clear();
  reservationsByProject.clear();
  reservationCounter = 0;
}
