import type { NextFunction, Response } from "express";
import { ZodError } from "zod";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import { getRequestParam } from "../../shared/utils/request-param";
import { ApprovalService } from "./approval.service";
import { approvalModuleSchema, rejectApprovalSchema } from "./approval.schemas";

export class ApprovalController {
  static async getApprovalQueue(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const items = await ApprovalService.getApprovalQueue();
      return res.status(200).json({ items });
    } catch (error) {
      next(error);
    }
  }

  static async approve(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user?.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const module = approvalModuleSchema.parse(getRequestParam(req, "module"));
      const order = await ApprovalService.approve(module, getRequestParam(req, "id"), req.user.userId);
      return res.status(200).json({
        message: "Approval completed successfully",
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

  static async reject(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user?.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const module = approvalModuleSchema.parse(getRequestParam(req, "module"));
      const data = rejectApprovalSchema.parse(req.body);
      const order = await ApprovalService.reject(module, getRequestParam(req, "id"), req.user.userId, data.reason ?? "");
      return res.status(200).json({
        message: "Approval rejected successfully",
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
