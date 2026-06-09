import prisma from "../lib/prisma";

export class NotificationService {
  static async createNotification(data: {
    eventId: string;
    eventType: string;
    title: string;
    message: string;
    recipient?: string;
  }) {
    return prisma.notification.create({
      data: {
        eventId: data.eventId,
        eventType: data.eventType,
        channel: "SYSTEM",
        recipient: data.recipient,
        title: data.title,
        message: data.message,
        status: "SENT",
        sentAt: new Date(),
      },
    });
  }
}