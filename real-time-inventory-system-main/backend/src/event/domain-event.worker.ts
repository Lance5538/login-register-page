import { DomainEventProcessor } from "./domain-event.processor";

let isRunning = false;
let timer: NodeJS.Timeout | null = null;

export function startDomainEventWorker() {
  if (timer) {
    return;
  }

  console.log("[DomainEventWorker] Started");

  timer = setInterval(async () => {
    if (isRunning) {
      return;
    }

    isRunning = true;

    try {
      const results = await DomainEventProcessor.processPendingEvents(10);

      if (results.length > 0) {
        console.log("[DomainEventWorker] Processed events", results);
      }
    } catch (error) {
      console.error("[DomainEventWorker] Failed to process events", error);
    } finally {
      isRunning = false;
    }
  }, 5000);
}

export function stopDomainEventWorker() {
  if (timer) {
    clearInterval(timer);
    timer = null;
    console.log("[DomainEventWorker] Stopped");
  }
}