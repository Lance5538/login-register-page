import type { Response, NextFunction } from "express";
import { ZodError } from "zod";
import {
  increaseInventorySchema,
  decreaseInventorySchema,
  transferInventorySchema,
  reserveInventorySchema,
  releaseInventorySchema,
  commitReservedInventorySchema,
} from "./inventory.schema";
import { InventoryService } from "./inventory.service";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware";

export class InventoryController {
  static async increase(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const parsedBody = increaseInventorySchema.parse(req.body);

      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          message: "Unauthorized",
        });
      }

      const result = await InventoryService.increaseInventory(parsedBody, userId);

      return res.status(200).json({
        message: "Inventory increased successfully",
        data: result,
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

  static async decrease(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const parsedBody = decreaseInventorySchema.parse(req.body);

      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          message: "Unauthorized",
        });
      }

      const result = await InventoryService.decreaseInventory(parsedBody, userId);

      return res.status(200).json({
        message: "Inventory decreased successfully",
        data: result,
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

  static async transfer(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const parsedBody = transferInventorySchema.parse(req.body);

      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          message: "Unauthorized",
        });
      }

      const result = await InventoryService.transferInventory(parsedBody, userId);

      return res.status(200).json({
        message: "Inventory transferred successfully",
        data: result,
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

  static async reserve(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const parsedBody = reserveInventorySchema.parse(req.body);

      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          message: "Unauthorized",
        });
      }

      const result = await InventoryService.reserveInventory(parsedBody, userId);

      return res.status(200).json({
        message: "Inventory reserved successfully",
        data: result,
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

  static async release(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const parsedBody = releaseInventorySchema.parse(req.body);

      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          message: "Unauthorized",
        });
      }

      const result = await InventoryService.releaseInventory(parsedBody, userId);

      return res.status(200).json({
        message: "Inventory released successfully",
        data: result,
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

  static async commitReserved(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const parsedBody = commitReservedInventorySchema.parse(req.body);

      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          message: "Unauthorized",
        });
      }

      const result = await InventoryService.commitReservedInventory(
        parsedBody,
        userId
      );

      return res.status(200).json({
        message: "Reserved inventory committed successfully",
        data: result,
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

  static async getInventory(
    _req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const inventory = await InventoryService.getInventory();

      return res.status(200).json({
        inventory,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTransactions(
    _req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const transactions = await InventoryService.getTransactions();

      return res.status(200).json({
        transactions,
      });
    } catch (error) {
      next(error);
    }
  }
}