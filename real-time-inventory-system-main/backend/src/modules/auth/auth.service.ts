import bcrypt from "bcrypt";
import jwt, { type SignOptions } from "jsonwebtoken";
import prisma from "../../lib/prisma";
import type { LoginInput, RegisterInput } from "./auth.schemas";
import { AppError } from "../../shared/errors/app-error";

export class AuthService {
  static async register(data: RegisterInput) {
    const existingUser = await prisma.user.findUnique({
      where: {
        email: data.email,
      },
    });

    if (existingUser) {
      throw new AppError("Email already registered", 409);
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        name: data.name?.trim() || null,
        email: data.email,
        passwordHash,
        role: data.role ?? "STAFF",
        status: "ACTIVE",
        appointedBy: "Self-service",
        appointedAt: new Date(),
        permissionsUpdatedAt: new Date(),
        lastLoginAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  static async login(data: LoginInput) {
    const user = await prisma.user.findUnique({
      where: {
        email: data.email,
      },
    });

    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    const passwordMatches = await bcrypt.compare(data.password, user.passwordHash);

    if (!passwordMatches) {
      throw new AppError("Invalid email or password", 401);
    }

    const loggedAt = new Date();
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new AppError("JWT_SECRET is not configured", 500);
    }

    const expiresIn = (process.env.JWT_EXPIRES_IN || "7d") as SignOptions["expiresIn"];

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        lastLoginAt: loggedAt,
        status: "ACTIVE",
      },
    });

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      secret,
      {
        expiresIn,
      }
    );

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: "ACTIVE" as const,
        lastLoginAt: loggedAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }

  static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        appointedBy: true,
        appointedAt: true,
        permissionsUpdatedAt: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  }
}
