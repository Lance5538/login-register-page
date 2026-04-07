import type { NextFunction, Response } from "express";
import { ZodError } from "zod";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import { getRequestParam } from "../../shared/utils/request-param";
import { InboundService } from "./inbound.service";
import { createInboundOrderSchema, updateInboundOrderSchema } from "./inbound.schemas";

export class InboundController {
  static async getInboundOrders(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const orders = await InboundService.getInboundOrders();
      return res.status(200).json({ orders });
    } catch (error) {
      next(error);
    }
  }

  static async getInboundOrderById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const order = await InboundService.getInboundOrderById(getRequestParam(req, "id"));
      return res.status(200).json({ order });
    } catch (error) {
      next(error);
    }
  }

  static async createInboundOrder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user?.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const data = createInboundOrderSchema.parse(req.body);
      const order = await InboundService.createInboundOrder(data, req.user.userId);
      return res.status(201).json({
        message: "Inbound order created successfully",
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

  static async updateInboundOrder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = updateInboundOrderSchema.parse(req.body);
      const order = await InboundService.updateInboundOrder(getRequestParam(req, "id"), data);
      return res.status(200).json({
        message: "Inbound order updated successfully",
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
