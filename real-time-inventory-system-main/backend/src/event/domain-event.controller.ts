import type { Request, Response, NextFunction } from "express";
import { DomainEventService } from "./domain-event.service";
import { listDomainEventsQuerySchema } from "./domain-event.schemas";


export class DomainEventController {
  static async listEvents(req: Request, res: Response) {
    const query = listDomainEventsQuerySchema.parse(req.query);

    const events = await DomainEventService.listEvents(query);

    res.json({
      events,
    });
  }

  static async getEventById(req: Request, res: Response) {
    const event = await DomainEventService.getEventById(req.params.id);

    res.json({
      event,
    });
  }
  static async retryEvent(req: Request, res: Response) {
    const event = await DomainEventService.retryEvent(req.params.id);

    res.json({
      message: "Domain event retry scheduled successfully",
      event,
    });
  }
  static async replayEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await DomainEventService.replayEvent(req.params.id);
    res.status(202).json(result);
  } catch (error) {
    next(error);
  }
}
}