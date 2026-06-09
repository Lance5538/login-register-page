import { NotificationService } from "../notification.service";

export async function handleNotification(event: {
  id: string;
  eventType: string;
  aggregateId: string;
  payload: any;
}) {
  switch (event.eventType) {
    case "inbound.approved":
      return NotificationService.createNotification({
        eventId: event.id,
        eventType: event.eventType,
        title: "Inbound order approved",
        message: `Inbound order ${event.payload?.inboundNo ?? event.aggregateId} has been approved and processed.`,
      });

    case "outbound.approved":
      return NotificationService.createNotification({
        eventId: event.id,
        eventType: event.eventType,
        title: "Outbound order approved",
        message: `Outbound order ${event.payload?.outboundNo ?? event.aggregateId} has been approved and processed.`,
      });

    default:
      return null;
  }
}