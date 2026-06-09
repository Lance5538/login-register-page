import type { DomainEvent } from "@prisma/client";
import prisma from "../../lib/prisma";
import { AppError } from "../../shared/errors/app-error";
import { postOutboundInventory } from "../../modules/inventory/inventory-posting";

type OutboundApprovedPayload = {
  outboundNo: string;
  warehouseId: string;
  approvedById: string;
  lineItems: Array<{
    productId: string;
    quantity: string;
    notes?: string | null;
  }>;
};

export async function handleOutboundApproved(event: DomainEvent) {
  console.log("[DomainEvent] Handling outbound.approved", {
    eventId: event.id,
    aggregateId: event.aggregateId,
  });

  const payload = event.payload as OutboundApprovedPayload;

  await prisma.$transaction(async (tx) => {
    const order = await tx.outboundOrder.findUnique({
      where: { id: event.aggregateId },
      select: {
        id: true,
        outboundNo: true,
        warehouseId: true,
        approvalStatus: true,
        appliedAt: true,
        confirmedAt: true,
      },
    });

    if (!order) {
      throw new AppError("Outbound order not found", 404);
    }

    if (order.approvalStatus !== "APPROVED") {
      throw new AppError("Outbound order is not approved", 400);
    }

    const existingPosting = await tx.inventoryPostingRecord.findUnique({
      where: {
        orderId_postingType: {
          orderId: order.id,
          postingType: "OUTBOUND",
        },
      },
    });

    if (existingPosting) {
      console.log("[DomainEvent] outbound inventory already posted, skipping", {
        eventId: event.id,
        outboundOrderId: order.id,
      });

      return;
    }

    await postOutboundInventory({
      tx,
      warehouseId: payload.warehouseId,
      createdById: payload.approvedById,
      reference: payload.outboundNo,
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
        postingType: "OUTBOUND",
        reference: payload.outboundNo,
      },
    });

    const now = new Date();

    await tx.outboundOrder.update({
      where: { id: order.id },
      data: {
        status: "SHIPPED",
        appliedAt: now,
        confirmedAt: now,
      },
    });
  });
}