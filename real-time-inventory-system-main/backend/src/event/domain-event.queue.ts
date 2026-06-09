import { Queue } from "bullmq";
import { redisConnection } from "../lib/redis";

export const domainEventQueue = new Queue("domain-events", {
  connection: redisConnection,
});

export async function enqueueDomainEvent(eventId: string) {
  return domainEventQueue.add(
    "process-domain-event",
    { eventId },
    {
      attempts: 1,
      removeOnComplete: 100,
      removeOnFail: 100,
    },
  );
}

export async function replayDomainEvent(eventId: string) {
  return domainEventQueue.add(
    "replay-domain-event",
    {
      eventId,
      replay: true,
    },
    {
      attempts: 1,
      removeOnComplete: 100,
      removeOnFail: 100,
    },
  );
}