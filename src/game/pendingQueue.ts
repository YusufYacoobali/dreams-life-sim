import type { World } from './model';
import type { Pending } from './runtime';
export function priorityOf(event: Pending): number {
  if (event.kind === 'decision') return event.templateId === 'medical-emergency' ? 120 : event.templateId === 'court-hearing' ? 110 : event.templateId === 'arrest' ? 100 : event.templateId === 'property-sale-offer' ? 40 : 20;
  return 30;
}
export function offerPending(world: World, event: Pending, priority = priorityOf(event)) {
  if (!world.pending) { world.pending = event; world.pendingPriority = priority; return; }
  const currentPriority = world.pendingPriority || priorityOf(world.pending);
  world.pendingPriority = currentPriority;
  if (priority > currentPriority) { world.deferred.push({ priority: currentPriority, event: world.pending }); world.pending = event; world.pendingPriority = priority; }
  else world.deferred.push({ priority, event });
  world.deferred.sort((a, b) => b.priority - a.priority);
}
export function nextPending(world: World): boolean {
  const next = world.deferred.shift(); if (!next) return false; world.pending = next.event; world.pendingPriority = next.priority; return true;
}
