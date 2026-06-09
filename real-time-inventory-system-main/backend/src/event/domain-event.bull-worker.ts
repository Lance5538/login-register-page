import { Worker } from "bullmq";
import { redisConnection } from "../lib/redis";
import {
  processDomainEventById,
  replayDomainEventById,
} from "./domain-event.processor";

export function startDomainEventBullWorker() {
  const worker = new Worker(
    "domain-events",
    async (job) => {
      console.log("[BullMQ] Processing domain event job", {
        jobId: job.id,
        jobName: job.name,
        eventId: job.data.eventId,
        replay: job.data.replay,
      });

      if (job.name === "replay-domain-event" || job.data.replay === true) {
        await replayDomainEventById(job.data.eventId);
      } else {
        await processDomainEventById(job.data.eventId);
      }

      return {
        ok: true,
        eventId: job.data.eventId,
        replay: job.data.replay === true,
      };
    },
    {
      connection: redisConnection,
    },
  );

  worker.on("completed", (job) => {
    console.log("[BullMQ] Domain event job completed", {
      jobId: job.id,
      jobName: job.name,
      eventId: job.data.eventId,
      replay: job.data.replay,
    });
  });

  worker.on("failed", (job, error) => {
    console.error("[BullMQ] Domain event job failed", {
      jobId: job?.id,
      jobName: job?.name,
      eventId: job?.data?.eventId,
      replay: job?.data?.replay,
      error,
    });
  });

  console.log("[BullMQ] Domain event worker started");

  return worker;
}