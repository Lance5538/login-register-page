import { Router } from "express";
import { DomainEventController } from "./domain-event.controller";
import {
  authMiddleware,
  requireRole,
} from "../middlewares/auth.middleware";

const router = Router();

router.get(
  "/",
  authMiddleware,
  requireRole("ADMIN"),
  DomainEventController.listEvents,
);

router.get(
  "/:id",
  authMiddleware,
  requireRole("ADMIN"),
  DomainEventController.getEventById,
);

router.post(
  "/:id/retry",
  authMiddleware,
  requireRole("ADMIN"),
  DomainEventController.retryEvent,
);

router.post(
  "/:id/replay",
  authMiddleware,
  requireRole("ADMIN"),
  DomainEventController.replayEvent,
);

export default router;