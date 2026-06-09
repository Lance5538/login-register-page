import { z } from "zod";

export const domainEventStatusSchema = z.enum([
  "PENDING",
  "PROCESSING",
  "PROCESSED",
  "FAILED",
  "DEAD",
]);

export const listDomainEventsQuerySchema = z.object({
  status: domainEventStatusSchema.optional(),
  eventType: z.string().optional(),
  aggregateId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type ListDomainEventsQuery = z.infer<typeof listDomainEventsQuerySchema>;