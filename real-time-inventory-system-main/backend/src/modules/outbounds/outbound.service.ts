import prisma from "../../lib/prisma";
import { AppError } from "../../shared/errors/app-error";
import { serializeOutboundOrder } from "../../shared/utils/order-workflow";
import type { CreateOutboundOrderInput, UpdateOutboundOrderInput } from "./outbound.schemas";
import { postOutboundInventory } from "../inventory/inventory-posting";

function toOrderDate(value: string) {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new AppError("Invalid shipment date", 400);
  }

  return parsedDate;
}

async function ensureWarehouseAndProductsExist(warehouseId: string, productIds: string[]) {
  const [warehouse, products] = await Promise.all([
    prisma.warehouse.findUnique({
      where: { id: warehouseId },
      select: { id: true },
    }),
    prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
      select: { id: true },
    }),
  ]);

  if (!warehouse) {
    throw new AppError("Warehouse not found", 404);
  }

  if (products.length !== new Set(productIds).size) {
    throw new AppError("One or more products were not found", 404);
  }
}

async function generateOutboundNo() {
  const count = await prisma.outboundOrder.count();
  return `OUT-${String(2025 + count).padStart(4, "0")}`;
}

const outboundOrderInclude = {
  warehouse: {
    select: {
      id: true,
      name: true,
      code: true,
      location: true,
    },
  },
  createdBy: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },
  approvedBy: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },
  lineItems: {
    include: {
      product: {
        select: {
          id: true,
          name: true,
          sku: true,
          unit: true,
        },
      },
    },
  },
} as const;

export class OutboundService {
  static async getOutboundOrders() {
    const orders = await prisma.outboundOrder.findMany({
      include: outboundOrderInclude,
      orderBy: {
        createdAt: "desc",
      },
    });

    return orders.map(serializeOutboundOrder);
  }

  static async getOutboundOrderById(id: string) {
    const order = await prisma.outboundOrder.findUnique({
      where: { id },
      include: outboundOrderInclude,
    });

    if (!order) {
      throw new AppError("Outbound order not found", 404);
    }

    return serializeOutboundOrder(order);
  }

  static async createOutboundOrder(data: CreateOutboundOrderInput, userId: string) {
    await ensureWarehouseAndProductsExist(
      data.warehouseId,
      data.lineItems.map((lineItem) => lineItem.productId),
    );

    const outboundNo = data.outboundNo?.trim() || (await generateOutboundNo());
    const order = await prisma.outboundOrder.create({
      data: {
        outboundNo,
        warehouseId: data.warehouseId,
        destination: data.destination.trim(),
        carrier: data.carrier?.trim() || null,
        shipmentDate: toOrderDate(data.shipmentDate),
        status: data.submitForApproval ? "PENDING_SHIPMENT" : "DRAFT",
        approvalStatus: "PENDING_APPROVAL",
        approvalReason: "",
        notes: data.notes?.trim() || null,
        createdById: userId,
        lineItems: {
          create: data.lineItems.map((lineItem) => ({
            productId: lineItem.productId,
            quantity: lineItem.quantity,
            notes: lineItem.notes?.trim() || null,
          })),
        },
      },
      include: outboundOrderInclude,
    });

    return serializeOutboundOrder(order);
  }

  static async updateOutboundOrder(id: string, data: UpdateOutboundOrderInput) {
    const existingOrder = await prisma.outboundOrder.findUnique({
      where: { id },
      select: {
        id: true,
        approvalStatus: true,
      },
    });

    if (!existingOrder) {
      throw new AppError("Outbound order not found", 404);
    }

    if (existingOrder.approvalStatus === "APPROVED") {
      throw new AppError("Approved outbound orders cannot be edited", 400);
    }

    await ensureWarehouseAndProductsExist(
      data.warehouseId,
      data.lineItems.map((lineItem) => lineItem.productId),
    );

    const order = await prisma.outboundOrder.update({
      where: { id },
      data: {
        outboundNo: data.outboundNo?.trim() || undefined,
        warehouseId: data.warehouseId,
        destination: data.destination.trim(),
        carrier: data.carrier?.trim() || null,
        shipmentDate: toOrderDate(data.shipmentDate),
        status: data.submitForApproval ? "PENDING_SHIPMENT" : "DRAFT",
        approvalStatus: "PENDING_APPROVAL",
        approvalReason: "",
        approvalUpdatedAt: null,
        approvedById: null,
        appliedAt: null,
        confirmedAt: null,
        notes: data.notes?.trim() || null,
        lineItems: {
          deleteMany: {},
          create: data.lineItems.map((lineItem) => ({
            productId: lineItem.productId,
            quantity: lineItem.quantity,
            notes: lineItem.notes?.trim() || null,
          })),
        },
      },
      include: outboundOrderInclude,
    });

    return serializeOutboundOrder(order);
  }

  static async approveOutboundOrder(id: string, actorUserId: string) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.outboundOrder.findUnique({
        where: { id },
        include: {
          ...outboundOrderInclude,
        },
      });

      if (!order) {
        throw new AppError("Outbound order not found", 404);
      }

      if (order.approvalStatus === "APPROVED") {
        return serializeOutboundOrder(order);
      }

      await postOutboundInventory({
        tx,
        warehouseId: order.warehouseId,
        createdById: actorUserId,
        reference: order.outboundNo,
        lineItems: order.lineItems.map((lineItem) => ({
          productId: lineItem.productId,
          quantity: lineItem.quantity,
          notes: lineItem.notes,
        })),
      });

      const approvedAt = new Date();
      const updatedOrder = await tx.outboundOrder.update({
        where: { id },
        data: {
          status: "SHIPPED",
          approvalStatus: "APPROVED",
          approvalReason: "",
          approvalUpdatedAt: approvedAt,
          approvedById: actorUserId,
          appliedAt: approvedAt,
          confirmedAt: approvedAt,
        },
        include: outboundOrderInclude,
      });

      return serializeOutboundOrder(updatedOrder);
    });
  }

  static async rejectOutboundOrder(id: string, actorUserId: string, reason: string) {
    const order = await prisma.outboundOrder.findUnique({
      where: { id },
      select: {
        id: true,
      },
    });

    if (!order) {
      throw new AppError("Outbound order not found", 404);
    }

    const rejectedOrder = await prisma.outboundOrder.update({
      where: { id },
      data: {
        approvalStatus: "REJECTED",
        approvalReason: reason.trim() || "Approval rejected. Please review the order details.",
        approvalUpdatedAt: new Date(),
        approvedById: actorUserId,
        appliedAt: null,
        confirmedAt: null,
      },
      include: outboundOrderInclude,
    });

    return serializeOutboundOrder(rejectedOrder);
  }
}
