import { InboundService } from "../inbounds/inbound.service";
import { OutboundService } from "../outbounds/outbound.service";
import type { ApprovalModule } from "./approval.schemas";

function countUnits(lineItems: Array<{ quantity: string }>) {
  return lineItems.reduce((total, lineItem) => total + Number(lineItem.quantity || 0), 0);
}

export class ApprovalService {
  static async getApprovalQueue() {
    const [inbounds, outbounds] = await Promise.all([
      InboundService.getInboundOrders(),
      OutboundService.getOutboundOrders(),
    ]);

    return [
      ...inbounds.map((order) => ({
        key: `inbound:${order.id}`,
        id: order.id,
        module: "Inbound",
        orderNo: order.inboundNo,
        warehouseId: order.warehouseId,
        warehouseCode: order.warehouse.code,
        warehouseName: order.warehouse.name,
        partner: order.supplierName,
        orderStatus: order.status,
        approvalStatus: order.approvalStatus,
        approvalReason: order.approvalReason,
        units: countUnits(order.lineItems),
        createdBy: order.createdBy,
        createdAt: order.createdAt,
        approvalUpdatedAt: order.approvalUpdatedAt,
        approvedBy: order.approvedBy,
      })),
      ...outbounds.map((order) => ({
        key: `outbound:${order.id}`,
        id: order.id,
        module: "Outbound",
        orderNo: order.outboundNo,
        warehouseId: order.warehouseId,
        warehouseCode: order.warehouse.code,
        warehouseName: order.warehouse.name,
        partner: order.destination,
        orderStatus: order.status,
        approvalStatus: order.approvalStatus,
        approvalReason: order.approvalReason,
        units: countUnits(order.lineItems),
        createdBy: order.createdBy,
        createdAt: order.createdAt,
        approvalUpdatedAt: order.approvalUpdatedAt,
        approvedBy: order.approvedBy,
      })),
    ].sort((left, right) => {
      const leftTime = new Date(left.approvalUpdatedAt || left.createdAt).getTime();
      const rightTime = new Date(right.approvalUpdatedAt || right.createdAt).getTime();
      return rightTime - leftTime;
    });
  }

  static async approve(module: ApprovalModule, id: string, actorUserId: string) {
    if (module === "inbound") {
      return InboundService.approveInboundOrder(id, actorUserId);
    }

    return OutboundService.approveOutboundOrder(id, actorUserId);
  }

  static async reject(module: ApprovalModule, id: string, actorUserId: string, reason: string) {
    if (module === "inbound") {
      return InboundService.rejectInboundOrder(id, actorUserId, reason);
    }

    return OutboundService.rejectOutboundOrder(id, actorUserId, reason);
  }
}
