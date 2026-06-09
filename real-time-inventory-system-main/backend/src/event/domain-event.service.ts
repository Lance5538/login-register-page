import type { Prisma } from "@prisma/client";
import prisma from "../lib/prisma";
import { AppError } from "../shared/errors/app-error";
import { replayDomainEvent } from "./domain-event.queue";

type TxClient = Prisma.TransactionClient;

const MAX_RETRIES = 3;

export class DomainEventService {
  static async createEvent(
    tx: TxClient,
    data: {
      eventType: string;
      aggregateType: string;
      aggregateId: string;
      payload: Prisma.InputJsonValue;
    },
  ) {
    return tx.domainEvent.create({
      data: {
        eventType: data.eventType,
        aggregateType: data.aggregateType,
        aggregateId: data.aggregateId,
        payload: data.payload,
        status: "PENDING",
        retryCount: 0,
        maxRetries: MAX_RETRIES,
      },
    });
  }

  static async claimPendingEvents(tx: TxClient, limit = 10) {
    const now = new Date();

    const events = await tx.domainEvent.findMany({
      where: {
        OR: [
          { status: "PENDING" },
          {
            status: "FAILED",
            nextRetryAt: { lte: now },
            retryCount: { lt: MAX_RETRIES },
          },
        ],
      },
      orderBy: { createdAt: "asc" },
      take: limit,
    });

    if (events.length === 0) {
      return [];
    }

    const eventIds = events.map((event) => event.id);

    await tx.domainEvent.updateMany({
      where: {
        id: { in: eventIds },
        OR: [
          { status: "PENDING" },
          {
            status: "FAILED",
            nextRetryAt: { lte: now },
            retryCount: { lt: MAX_RETRIES },
          },
        ],
      },
      data: {
        status: "PROCESSING",
      },
    });

    return tx.domainEvent.findMany({
      where: {
        id: { in: eventIds },
        status: "PROCESSING",
      },
      orderBy: { createdAt: "asc" },
    });
  }

  static async claimEventById(tx: TxClient, eventId: string) {
    const now = new Date();

    const updated = await tx.domainEvent.updateMany({
      where: {
        id: eventId,
        OR: [
          { status: "PENDING" },
          {
            status: "FAILED",
            nextRetryAt: { lte: now },
            retryCount: { lt: MAX_RETRIES },
          },
        ],
      },
      data: {
        status: "PROCESSING",
      },
    });

    if (updated.count === 0) {
      return null;
    }

    return tx.domainEvent.findUnique({
      where: { id: eventId },
    });
  }

  static async markProcessed(tx: TxClient, eventId: string) {
    return tx.domainEvent.update({
      where: { id: eventId },
      data: {
        status: "PROCESSED",
        lastError: null,
        nextRetryAt: null,
        processedAt: new Date(),
      },
    });
  }

  static async markFailed(tx: TxClient, eventId: string, error: unknown) {
    const event = await tx.domainEvent.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        retryCount: true,
        maxRetries: true,
      },
    });

    if (!event) {
      return null;
    }

    const nextRetryCount = event.retryCount + 1;
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unknown domain event processing error";

    if (nextRetryCount >= event.maxRetries) {
      return tx.domainEvent.update({
        where: { id: eventId },
        data: {
          status: "DEAD",
          retryCount: nextRetryCount,
          lastError: errorMessage,
          nextRetryAt: null,
        },
      });
    }

    const nextRetryAt = new Date(Date.now() + nextRetryCount * 10_000);

    return tx.domainEvent.update({
      where: { id: eventId },
      data: {
        status: "FAILED",
        retryCount: nextRetryCount,
        lastError: errorMessage,
        nextRetryAt,
      },
    });
  }

  static async listEvents(query: {
    status?: "PENDING" | "PROCESSING" | "PROCESSED" | "FAILED" | "DEAD";
    eventType?: string;
    aggregateId?: string;
    limit: number;
  }) {
    return prisma.domainEvent.findMany({
      where: {
        status: query.status,
        eventType: query.eventType,
        aggregateId: query.aggregateId,
      },
      orderBy: { createdAt: "desc" },
      take: query.limit,
    });
  }

  static async getEventById(id: string) {
    const event = await prisma.domainEvent.findUnique({
      where: { id },
    });

    if (!event) {
      throw new AppError("Domain event not found", 404);
    }

    return event;
  }

  static async retryEvent(id: string) {
    const event = await prisma.domainEvent.findUnique({
      where: { id },
    });

    if (!event) {
      throw new AppError("Domain event not found", 404);
    }

    if (event.status !== "FAILED" && event.status !== "DEAD") {
      throw new AppError("Only FAILED or DEAD events can be retried", 400);
    }

    return prisma.domainEvent.update({
      where: { id },
      data: {
        status: "PENDING",
        retryCount: 0,
        lastError: null,
        nextRetryAt: null,
        processedAt: null,
      },
    });
  }

  static async replayEvent(id: string) {
    const event = await prisma.domainEvent.findUnique({
      where: { id },
    });

    if (!event) {
      throw new AppError("Domain event not found", 404);
    }

    if (
      event.status !== "PROCESSED" &&
      event.status !== "FAILED" &&
      event.status !== "DEAD"
    ) {
      throw new AppError(
        `Only PROCESSED, FAILED, or DEAD events can be replayed. Current status: ${event.status}`,
        400,
      );
    }

    const job = await replayDomainEvent(event.id);

    return {
      eventId: event.id,
      eventType: event.eventType,
      status: event.status,
      replayJobId: job.id,
      message: "Domain event replay enqueued successfully",
    };
  }
}