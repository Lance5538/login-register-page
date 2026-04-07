import type {
  ApprovalStatus,
  InboundLineItem,
  InboundOrder,
  InboundStatus,
  OutboundLineItem,
  OutboundOrder,
  OutboundStatus,
  Product,
  User,
  Warehouse,
} from "@prisma/client";
import { formatUserDisplayName } from "./user-display";

type OrderWarehouse = Pick<Warehouse, "id" | "name" | "code" | "location">;
type OrderUser = Pick<User, "id" | "name" | "email" | "role">;
type OrderProduct = Pick<Product, "id" | "name" | "sku" | "unit">;

type InboundOrderWithRelations = InboundOrder & {
  warehouse: OrderWarehouse;
  createdBy: OrderUser;
  approvedBy: OrderUser | null;
  lineItems: Array<InboundLineItem & { product: OrderProduct }>;
};

type OutboundOrderWithRelations = OutboundOrder & {
  warehouse: OrderWarehouse;
  createdBy: OrderUser;
  approvedBy: OrderUser | null;
  lineItems: Array<OutboundLineItem & { product: OrderProduct }>;
};

export function formatApprovalStatus(status: ApprovalStatus) {
  if (status === "PENDING_APPROVAL") {
    return "Pending Approval";
  }

  if (status === "APPROVED") {
    return "Approved";
  }

  return "Rejected";
}

export function formatInboundStatus(status: InboundStatus) {
  if (status === "PENDING_RECEIPT") {
    return "Pending Receipt";
  }

  if (status === "RECEIVED") {
    return "Received";
  }

  return "Draft";
}

export function formatOutboundStatus(status: OutboundStatus) {
  if (status === "PENDING_SHIPMENT") {
    return "Pending Shipment";
  }

  if (status === "SHIPPED") {
    return "Shipped";
  }

  return "Draft";
}

export function serializeInboundOrder(order: InboundOrderWithRelations) {
  return {
    id: order.id,
    inboundNo: order.inboundNo,
    warehouseId: order.warehouseId,
    supplierName: order.supplierName,
    referenceNo: order.referenceNo ?? "",
    plannedDate: order.plannedDate.toISOString().slice(0, 10),
    status: formatInboundStatus(order.status),
    createdBy: formatUserDisplayName(order.createdBy),
    createdById: order.createdBy.id,
    createdAt: order.createdAt.toISOString(),
    confirmedAt: order.confirmedAt?.toISOString() ?? "",
    notes: order.notes ?? "",
    approvalStatus: formatApprovalStatus(order.approvalStatus),
    approvalReason: order.approvalReason ?? "",
    approvalUpdatedAt: order.approvalUpdatedAt?.toISOString() ?? "",
    approvedBy: order.approvedBy ? formatUserDisplayName(order.approvedBy) : "",
    approvedById: order.approvedBy?.id ?? "",
    appliedAt: order.appliedAt?.toISOString() ?? "",
    warehouse: order.warehouse,
    lineItems: order.lineItems.map((lineItem) => ({
      id: lineItem.id,
      productId: lineItem.productId,
      quantity: String(lineItem.quantity),
      notes: lineItem.notes ?? "",
      product: lineItem.product,
    })),
  };
}

export function serializeOutboundOrder(order: OutboundOrderWithRelations) {
  return {
    id: order.id,
    outboundNo: order.outboundNo,
    warehouseId: order.warehouseId,
    destination: order.destination,
    carrier: order.carrier ?? "",
    shipmentDate: order.shipmentDate.toISOString().slice(0, 10),
    status: formatOutboundStatus(order.status),
    createdBy: formatUserDisplayName(order.createdBy),
    createdById: order.createdBy.id,
    createdAt: order.createdAt.toISOString(),
    confirmedAt: order.confirmedAt?.toISOString() ?? "",
    notes: order.notes ?? "",
    approvalStatus: formatApprovalStatus(order.approvalStatus),
    approvalReason: order.approvalReason ?? "",
    approvalUpdatedAt: order.approvalUpdatedAt?.toISOString() ?? "",
    approvedBy: order.approvedBy ? formatUserDisplayName(order.approvedBy) : "",
    approvedById: order.approvedBy?.id ?? "",
    appliedAt: order.appliedAt?.toISOString() ?? "",
    warehouse: order.warehouse,
    lineItems: order.lineItems.map((lineItem) => ({
      id: lineItem.id,
      productId: lineItem.productId,
      quantity: String(lineItem.quantity),
      notes: lineItem.notes ?? "",
      product: lineItem.product,
    })),
  };
}
