import prisma from "../../lib/prisma";
import { AppError } from "../../shared/errors/app-error";
import { serializeInboundOrder } from "../../shared/utils/order-workflow";
import type { CreateInboundOrderInput, UpdateInboundOrderInput } from "./inbound.schemas";
import { postInboundInventory } from "../inventory/inventory-posting";

function toOrderDate(value: string) {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new AppError("Invalid planned date", 400);
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

async function generateInboundNo() {
  const count = await prisma.inboundOrder.count();
  return `INB-${String(1046 + count).padStart(4, "0")}`;
}

const inboundOrderInclude = {
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

export class InboundService {
  static async getInboundOrders() {
    const orders = await prisma.inboundOrder.findMany({
      include: inboundOrderInclude,
      orderBy: {
        createdAt: "desc",
      },
    });

    return orders.map(serializeInboundOrder);
  }

  static async getInboundOrderById(id: string) {
    const order = await prisma.inboundOrder.findUnique({
      where: { id },
      include: inboundOrderInclude,
    });

    if (!order) {
      throw new AppError("Inbound order not found", 404);
    }

    return serializeInboundOrder(order);
  }

  static async createInboundOrder(data: CreateInboundOrderInput, userId: string) {
    await ensureWarehouseAndProductsExist(
      data.warehouseId,
      data.lineItems.map((lineItem) => lineItem.productId),
    );

    const inboundNo = data.inboundNo?.trim() || (await generateInboundNo());
    const order = await prisma.inboundOrder.create({
      data: {
        inboundNo,
        warehouseId: data.warehouseId,
        supplierName: data.supplierName.trim(),
        referenceNo: data.referenceNo?.trim() || null,
        plannedDate: toOrderDate(data.plannedDate),
        status: data.submitForApproval ? "PENDING_RECEIPT" : "DRAFT",
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
      include: inboundOrderInclude,
    });

    return serializeInboundOrder(order);
  }

  static async updateInboundOrder(id: string, data: UpdateInboundOrderInput) {
    const existingOrder = await prisma.inboundOrder.findUnique({
      where: { id },
      select: {
        id: true,
        approvalStatus: true,
      },
    });

    if (!existingOrder) {
      throw new AppError("Inbound order not found", 404);
    }

    if (existingOrder.approvalStatus === "APPROVED") {
      throw new AppError("Approved inbound orders cannot be edited", 400);
    }

    await ensureWarehouseAndProductsExist(
      data.warehouseId,
      data.lineItems.map((lineItem) => lineItem.productId),
    );

    const order = await prisma.inboundOrder.update({
      where: { id },
      data: {
        inboundNo: data.inboundNo?.trim() || undefined,
        warehouseId: data.warehouseId,
        supplierName: data.supplierName.trim(),
        referenceNo: data.referenceNo?.trim() || null,
        plannedDate: toOrderDate(data.plannedDate),
        status: data.submitForApproval ? "PENDING_RECEIPT" : "DRAFT",
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
      include: inboundOrderInclude,
    });

    return serializeInboundOrder(order);
  }

  static async approveInboundOrder(id: string, actorUserId: string) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.inboundOrder.findUnique({
        where: { id },
        include: {
          ...inboundOrderInclude,
        },
      });

      if (!order) {
        throw new AppError("Inbound order not found", 404);
      }

      if (order.approvalStatus === "APPROVED") {
        return serializeInboundOrder(order);
      }

      await postInboundInventory({
        tx,
        warehouseId: order.warehouseId,
        createdById: actorUserId,
        reference: order.inboundNo,
        lineItems: order.lineItems.map((lineItem) => ({
          productId: lineItem.productId,
          quantity: lineItem.quantity,
          notes: lineItem.notes,
        })),
      });

      const approvedAt = new Date();
      const updatedOrder = await tx.inboundOrder.update({
        where: { id },
        data: {
          status: "RECEIVED",
          approvalStatus: "APPROVED",
          approvalReason: "",
          approvalUpdatedAt: approvedAt,
          approvedById: actorUserId,
          appliedAt: approvedAt,
          confirmedAt: approvedAt,
        },
        include: inboundOrderInclude,
      });

      return serializeInboundOrder(updatedOrder);
    });
  }

  static async rejectInboundOrder(id: string, actorUserId: string, reason: string) {
    const order = await prisma.inboundOrder.findUnique({
      where: { id },
      select: {
        id: true,
      },
    });

    if (!order) {
      throw new AppError("Inbound order not found", 404);
    }

    const rejectedOrder = await prisma.inboundOrder.update({
      where: { id },
      data: {
        approvalStatus: "REJECTED",
        approvalReason: reason.trim() || "Approval rejected. Please review the order details.",
        approvalUpdatedAt: new Date(),
        approvedById: actorUserId,
        appliedAt: null,
        confirmedAt: null,
      },
      include: inboundOrderInclude,
    });

    return serializeInboundOrder(rejectedOrder);
  }
}
