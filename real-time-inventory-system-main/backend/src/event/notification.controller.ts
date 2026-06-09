import type { Request, Response } from "express";
import prisma from "../lib/prisma";

export class NotificationController {
  static async listNotifications(req: Request, res: Response) {
    const eventType =
      typeof req.query.eventType === "string" ? req.query.eventType : undefined;

    const status =
      typeof req.query.status === "string" ? req.query.status : undefined;

    const notifications = await prisma.notification.findMany({
      where: {
        eventType,
        status: status as any,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

    res.json({
      notifications,
    });
  }
}