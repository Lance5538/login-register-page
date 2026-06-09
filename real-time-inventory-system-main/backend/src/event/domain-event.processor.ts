import prisma from "../lib/prisma";
import { DomainEventService } from "./domain-event.service";
import { DOMAIN_EVENT_TYPES } from "./domain-event.types";
import { handleInboundApproved } from "./handlers/inbound-approved.handler";
import { handleOutboundApproved } from "./handlers/outbound-approved.handler";
import { handleNotification } from "./handlers/notification.handler";


async function handleEvent(
  event: Awaited<ReturnType<typeof DomainEventService.claimPendingEvents>>[number],
) {
  switch (event.eventType) {
    case DOMAIN_EVENT_TYPES.INBOUND_APPROVED:
      await handleInboundApproved(event);
      break;

    case DOMAIN_EVENT_TYPES.OUTBOUND_APPROVED:
      await handleOutboundApproved(event);
      break;

    default:
      throw new Error(`Unknown domain event type: ${event.eventType}`);
  }
}

export async function processPendingEvents(limit = 10) {
  const events = await prisma.$transaction(async (tx) => {
    return DomainEventService.claimPendingEvents(tx, limit);
  });

  if (events.length === 0) {
    return [];
  }

  const results = [];

  for (const event of events) {
    try {
      await handleEvent(event);
      await handleNotification(event);

      const processedEvent = await prisma.$transaction(async (tx) => {
        return DomainEventService.markProcessed(tx, event.id);
      });

      results.push(processedEvent);
    } catch (error) {
      console.error("[DomainEvent] Failed to process event", {
        eventId: event.id,
        eventType: event.eventType,
        error,
      });

      const failedEvent = await prisma.$transaction(async (tx) => {
        return DomainEventService.markFailed(tx, event.id, error);
      });

      results.push(failedEvent);
    }
  }

  return results;
}

export const DomainEventProcessor = {
  processPendingEvents,
  processDomainEventById,
  replayDomainEventById,
};

export async function processDomainEventById(eventId: string) {
  const event = await prisma.$transaction(async (tx) => {
    return DomainEventService.claimEventById(tx, eventId);
  });

  if (!event) {
    console.log("[DomainEvent] Event not claimable, skipping", {
      eventId,
    });

    return null;
  }

  try {
    await handleEvent(event);
    await handleNotification(event);

    return prisma.$transaction(async (tx) => {
      return DomainEventService.markProcessed(tx, event.id);
    });
  } catch (error) {
    console.error("[DomainEvent] Failed to process event", {
      eventId: event.id,
      eventType: event.eventType,
      error,
    });

    return prisma.$transaction(async (tx) => {
      return DomainEventService.markFailed(tx, event.id, error);
    });
  }
}
export async function replayDomainEventById(eventId: string) {
  const event = await prisma.domainEvent.findUnique({
    where: {
      id: eventId,
    },
  });

  if (!event) {
    throw new Error(`Domain event not found: ${eventId}`);
  }

  if (!["PROCESSED", "FAILED", "DEAD"].includes(event.status)) {
    throw new Error(
      `Only PROCESSED, FAILED, or DEAD events can be replayed. Current status: ${event.status}`,
    );
  }

  try {
    console.log("[DomainEvent] Replaying event", {
      eventId: event.id,
      eventType: event.eventType,
      status: event.status,
    });

    await handleEvent(event);

    return event;
  } catch (error) {
    console.error("[DomainEvent] Failed to replay event", {
      eventId: event.id,
      eventType: event.eventType,
      error,
    });

    throw error;
  }
}