import bcrypt from "bcrypt";
import crypto from "crypto";
import prisma from "../../lib/prisma";
import { AppError } from "../../shared/errors/app-error";
import { formatUserDisplayName } from "../../shared/utils/user-display";
import type { CreateUserInput, UpdateUserProfileInput, UpdateUserRoleInput } from "./user.schemas";

function serializeUser(user: {
  id: string;
  name: string | null;
  email: string;
  role: "ADMIN" | "STAFF";
  status: "ACTIVE" | "INVITED";
  appointedBy: string | null;
  appointedAt: Date | null;
  permissionsUpdatedAt: Date;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}, options: { canDelete?: boolean } = {}) {
  return {
    id: user.id,
    name: formatUserDisplayName(user),
    email: user.email,
    role: user.role,
    status: user.status === "ACTIVE" ? "Active" : "Invited",
    appointedBy: user.appointedBy ?? "System",
    appointedAt: (user.appointedAt ?? user.createdAt).toISOString(),
    permissionsUpdatedAt: user.permissionsUpdatedAt.toISOString(),
    lastLoginAt: user.lastLoginAt?.toISOString() ?? "",
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    canDelete: options.canDelete ?? false,
  };
}

const userSelect = {
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
} as const;

function createTemporaryPassword() {
  return `Temp-${crypto.randomBytes(4).toString("hex")}`;
}

function calculateActivityCount(targetUser: {
  _count: {
    transactions: number;
    inboundOrdersCreated: number;
    inboundOrdersApproved: number;
    outboundOrdersCreated: number;
    outboundOrdersApproved: number;
  };
}) {
  return (
    targetUser._count.transactions +
    targetUser._count.inboundOrdersCreated +
    targetUser._count.inboundOrdersApproved +
    targetUser._count.outboundOrdersCreated +
    targetUser._count.outboundOrdersApproved
  );
}

function canDeleteUser(
  targetUser: {
    id: string;
    role: "ADMIN" | "STAFF";
    _count: {
      transactions: number;
      inboundOrdersCreated: number;
      inboundOrdersApproved: number;
      outboundOrdersCreated: number;
      outboundOrdersApproved: number;
    };
  },
  context: {
    actorUserId?: string;
    adminCount: number;
  },
) {
  if (targetUser.id === context.actorUserId) {
    return false;
  }

  if (targetUser.role === "ADMIN" && context.adminCount <= 1) {
    return false;
  }

  return calculateActivityCount(targetUser) === 0;
}

export class UserService {
  static async getUsers(actor?: { userId: string }) {
    const [users, adminCount] = await Promise.all([
      prisma.user.findMany({
        select: {
          ...userSelect,
          _count: {
            select: {
              transactions: true,
              inboundOrdersCreated: true,
              inboundOrdersApproved: true,
              outboundOrdersCreated: true,
              outboundOrdersApproved: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.user.count({
        where: {
          role: "ADMIN",
        },
      }),
    ]);

    return users.map((user) =>
      serializeUser(user, {
        canDelete: canDeleteUser(user, {
          actorUserId: actor?.userId,
          adminCount,
        }),
      }),
    );
  }

  static async createUser(data: CreateUserInput, actor: { userId: string; email: string }) {
    const email = data.email.trim().toLowerCase();
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
      },
    });

    if (existingUser) {
      throw new AppError("Email already registered", 409);
    }

    const [actorUser, temporaryPassword] = await Promise.all([
      prisma.user.findUnique({
        where: { id: actor.userId },
        select: {
          id: true,
          name: true,
          email: true,
        },
      }),
      Promise.resolve(createTemporaryPassword()),
    ]);
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);
    const assignedAt = new Date();

    const user = await prisma.user.create({
      data: {
        name: data.name?.trim() || null,
        email,
        passwordHash,
        role: data.role,
        status: "INVITED",
        appointedBy: actorUser ? formatUserDisplayName(actorUser) : actor.email,
        appointedAt: assignedAt,
        permissionsUpdatedAt: assignedAt,
        lastLoginAt: null,
      },
      select: userSelect,
    });

    return {
      user: serializeUser(user),
      temporaryPassword,
    };
  }

  static async deleteUser(id: string, actor: { userId: string }) {
    const [targetUser, adminCount] = await Promise.all([
      prisma.user.findUnique({
        where: { id },
        select: {
          ...userSelect,
          _count: {
            select: {
              transactions: true,
              inboundOrdersCreated: true,
              inboundOrdersApproved: true,
              outboundOrdersCreated: true,
              outboundOrdersApproved: true,
            },
          },
        },
      }),
      prisma.user.count({
        where: {
          role: "ADMIN",
        },
      }),
    ]);

    if (!targetUser) {
      throw new AppError("User not found", 404);
    }

    if (!canDeleteUser(targetUser, { actorUserId: actor.userId, adminCount })) {
      throw new AppError("Only users without business activity can be deleted", 400);
    }

    const deletedUser = await prisma.user.delete({
      where: { id },
      select: userSelect,
    });

    return serializeUser(deletedUser);
  }

  static async updateUserProfile(id: string, data: UpdateUserProfileInput) {
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });

    if (!targetUser) {
      throw new AppError("User not found", 404);
    }

    const email = data.email.trim().toLowerCase();
    if (email !== targetUser.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
        },
      });

      if (existingUser) {
        throw new AppError("Email already registered", 409);
      }
    }

    const passwordHash = data.password ? await bcrypt.hash(data.password, 10) : undefined;
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name: data.name?.trim() || null,
        email,
        passwordHash,
      },
      select: userSelect,
    });

    return serializeUser(updatedUser);
  }

  static async updateUserRole(id: string, data: UpdateUserRoleInput, actor: { userId: string; email: string }) {
    const [targetUser, actorUser, adminCount] = await Promise.all([
      prisma.user.findUnique({
        where: { id },
        select: userSelect,
      }),
      prisma.user.findUnique({
        where: { id: actor.userId },
        select: {
          id: true,
          name: true,
          email: true,
        },
      }),
      prisma.user.count({
        where: {
          role: "ADMIN",
        },
      }),
    ]);

    if (!targetUser) {
      throw new AppError("User not found", 404);
    }

    if (targetUser.id === actor.userId && targetUser.role === "ADMIN" && data.role !== "ADMIN" && adminCount <= 1) {
      throw new AppError("The last admin cannot remove their own admin access", 400);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        role: data.role,
        appointedBy: actorUser ? formatUserDisplayName(actorUser) : actor.email,
        appointedAt: new Date(),
        permissionsUpdatedAt: new Date(),
      },
      select: userSelect,
    });

    return serializeUser(updatedUser);
  }
}
