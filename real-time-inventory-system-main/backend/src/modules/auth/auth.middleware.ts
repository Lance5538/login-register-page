import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: "ADMIN" | "STAFF";
  };
}

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  // 1. 检查是否存在 Bearer token
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  const token = authHeader.split(" ")[1];
  const secret = process.env.JWT_SECRET;

  // 2. 检查 JWT_SECRET 是否存在
  if (!secret) {
    return res.status(500).json({
      message: "JWT_SECRET is not configured",
    });
  }

  try {
    // 3. 验证 token
    const decoded = jwt.verify(token, secret) as {
      userId: string;
      email: string;
      role: "ADMIN" | "STAFF";
    };

    req.user = decoded;

    next();
  } catch {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};