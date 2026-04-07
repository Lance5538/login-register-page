import { NextFunction, Request, Response } from "express";
import { AppError } from "../shared/errors/app-error";

export const errorMiddleware = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      message: err.message,
    });
  }

  if (err?.type === "entity.parse.failed") {
    return res.status(400).json({
      message: "Invalid JSON body",
    });
  }

  console.error("Unhandled error:", err);

  return res.status(500).json({
    message: "Internal server error",
  });
};