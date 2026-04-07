import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../shared/errors/app-error";

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: "ADMIN" | "STAFF";
  };
}

export function authMiddleware(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError("Missing or invalid authorization header", 401));
  }

  const token = authHeader.split(" ")[1];
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    return next(new AppError("JWT_SECRET is not configured", 500));
  }

  try {
    const decoded = jwt.verify(token, secret) as {
      userId: string;
      email: string;
      role: "ADMIN" | "STAFF";
    };

    req.user = decoded;
    next();
  } catch {
    return next(new AppError("Invalid or expired token", 401));
  }
}

export function requireRole(...roles: Array<"ADMIN" | "STAFF">) {
  return (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
  ) => {
    if (!req.user) {
      return next(new AppError("Unauthorized", 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError("Forbidden", 403));
    }

    next();
  };
}