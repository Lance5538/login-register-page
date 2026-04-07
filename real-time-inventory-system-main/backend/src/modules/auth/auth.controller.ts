import  type { Request, Response, NextFunction } from "express";
import { loginSchema, registerSchema } from "./auth.schemas";
import { AuthService } from "./auth.service";
import type { AuthenticatedRequest } from "../../middlewares/auth.middleware";

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const data = registerSchema.parse(req.body);
      const user = await AuthService.register(data);

      return res.status(201).json({
        message: "User registered successfully",
        user,
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const data = loginSchema.parse(req.body);
      const result = await AuthService.login(data);

      return res.status(200).json({
        message: "Login successful",
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async me(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.user?.userId) {
        return res.status(401).json({
          message: "Unauthorized",
        });
      }

      const user = await AuthService.getMe(req.user.userId);

      return res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }
}