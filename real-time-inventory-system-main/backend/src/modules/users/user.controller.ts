import type { NextFunction, Response } from "express";
import { ZodError } from "zod";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import { getRequestParam } from "../../shared/utils/request-param";
import { UserService } from "./user.service";
import { createUserSchema, updateUserProfileSchema, updateUserRoleSchema } from "./user.schemas";

export class UserController {
  static async getUsers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const users = await UserService.getUsers(req.user ? { userId: req.user.userId } : undefined);
      return res.status(200).json({ users });
    } catch (error) {
      next(error);
    }
  }

  static async createUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user?.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const data = createUserSchema.parse(req.body);
      const result = await UserService.createUser(data, {
        userId: req.user.userId,
        email: req.user.email,
      });

      return res.status(201).json({
        message: "User created successfully",
        user: result.user,
        temporaryPassword: result.temporaryPassword,
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

  static async deleteUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user?.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await UserService.deleteUser(getRequestParam(req, "id"), {
        userId: req.user.userId,
      });

      return res.status(200).json({
        message: "User deleted successfully",
        user,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateUserProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = updateUserProfileSchema.parse(req.body);
      const user = await UserService.updateUserProfile(getRequestParam(req, "id"), data);

      return res.status(200).json({
        message: "User profile updated successfully",
        user,
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

  static async updateUserRole(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user?.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const data = updateUserRoleSchema.parse(req.body);
      const user = await UserService.updateUserRole(getRequestParam(req, "id"), data, {
        userId: req.user.userId,
        email: req.user.email,
      });

      return res.status(200).json({
        message: "User role updated successfully",
        user,
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
