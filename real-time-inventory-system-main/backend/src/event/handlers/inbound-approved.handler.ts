import type { DomainEvent } from "@prisma/client";
import prisma from "../../lib/prisma";
import { AppError } from "../../shared/errors/app-error";
import { postInboundInventory } from "../../modules/inventory/inventory-posting";

type InboundApprovedPayload = {
  inboundNo: string;
  warehouseId: string;
  approvedById: string;
  lineItems: Array<{
    productId: string;
    quantity: string;
    notes?: string | null;
  }>;
};

export async function handleInboundApproved(event: DomainEvent) {
  console.log("[DomainEvent] Handling inbound.approved", {
    eventId: event.id,
    aggregateId: event.aggregateId,
  });

  const payload = event.payload as InboundApprovedPayload;

  await prisma.$transaction(async (tx) => {
    const order = await tx.inboundOrder.findUnique({
      where: { id: event.aggregateId },
      select: {
        id: true,
        inboundNo: true,
        warehouseId: true,
        approvalStatus: true,
        appliedAt: true,
        confirmedAt: true,
      },
    });

    if (!order) {
      throw new AppError("Inbound order not found", 404);
    }

    if (order.approvalStatus !== "APPROVED") {
      throw new AppError("Inbound order is not approved", 400);
    }

    const existingPosting = await tx.inventoryPostingRecord.findUnique({
      where: {
        orderId_postingType: {
          orderId: order.id,
          postingType: "INBOUND",
        },
      },
    });

    if (existingPosting) {
      console.log("[DomainEvent] inbound inventory already posted, skipping", {
        eventId: event.id,
        inboundOrderId: order.id,
      });

      return;
    }

    await postInboundInventory({
      tx,
      warehouseId: payload.warehouseId,
      createdById: payload.approvedById,
      reference: payload.inboundNo,
      lineItems: payload.lineItems.map((lineItem) => ({
        productId: lineItem.productId,
        quantity: lineItem.quantity,
        notes: lineItem.notes ?? null,
      })),
    });

    await tx.inventoryPostingRecord.create({
      data: {
        eventId: event.id,
        orderId: order.id,
        postingType: "INBOUND",
        reference: payload.inboundNo,
      },
    });

    const now = new Date();

    await tx.inboundOrder.update({
      where: { id: order.id },
      data: {
        status: "RECEIVED",
        appliedAt: now,
        confirmedAt: now,
      },
    });
  });
}