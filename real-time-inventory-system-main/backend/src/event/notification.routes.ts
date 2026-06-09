import { Router } from "express";
import { NotificationController } from "./notification.controller";
import {
  authMiddleware,
  requireRole,
} from "../middlewares/auth.middleware";

const router = Router();

router.get(
  "/",
  authMiddleware,
  requireRole("ADMIN"),
  NotificationController.listNotifications,
);

export default router;