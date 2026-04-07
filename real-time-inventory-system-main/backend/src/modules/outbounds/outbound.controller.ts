import type { NextFunction, Response } from "express";
import { ZodError } from "zod";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import { getRequestParam } from "../../shared/utils/request-param";
import { OutboundService } from "./outbound.service";
import { createOutboundOrderSchema, updateOutboundOrderSchema } from "./outbound.schemas";

export class OutboundController {
  static async getOutboundOrders(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orders = await OutboundService.getOutboundOrders();
      return res.status(200).json({ orders });
    } catch (error) {
      next(error);
    }
  }

  static async getOutboundOrderById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const order = await OutboundService.getOutboundOrderById(getRequestParam(req, "id"));
      return res.status(200).json({ order });
    } catch (error) {
      next(error);
    }
  }

  static async createOutboundOrder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user?.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const data = createOutboundOrderSchema.parse(req.body);
      const order = await OutboundService.createOutboundOrder(data, req.user.userId);
      return res.status(201).json({
        message: "Outbound order created successfully",
        order,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: "Validation failed",
          errors: error.flatten(),
        });
      }

      next(error);
    }
  }

  static async updateOutboundOrder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = updateOutboundOrderSchema.parse(req.body);
      const order = await OutboundService.updateOutboundOrder(getRequestParam(req, "id"), data);
      return res.status(200).json({
        message: "Outbound order updated successfully",
        order,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: "Validation failed",
          errors: error.flatten(),
        });
      }

      next(error);
    }
  }
}
