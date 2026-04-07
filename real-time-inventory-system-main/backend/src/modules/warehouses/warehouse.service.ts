import prisma from "../../lib/prisma";
import { AppError } from "../../shared/errors/app-error";
import {
  CreateWarehouseInput,
  UpdateWarehouseInput,
} from "./warehouse.schemas";

export class WarehouseService {
  static async createWarehouse(data: CreateWarehouseInput) {
    const existingWarehouse = await prisma.warehouse.findUnique({
      where: {
        code: data.code,
      },
    });

    if (existingWarehouse) {
      throw new AppError("Warehouse code already exists", 409);
    }

    const warehouse = await prisma.warehouse.create({
      data: {
        name: data.name,
        code: data.code,
        location: data.location,
      },
      select: {
        id: true,
        name: true,
        code: true,
        location: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return warehouse;
  }

  static async getWarehouses() {
    const warehouses = await prisma.warehouse.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
        code: true,
        location: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return warehouses;
  }

  static async getWarehouseById(id: string) {
    const warehouse = await prisma.warehouse.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        code: true,
        location: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!warehouse) {
      throw new AppError("Warehouse not found", 404);
    }

    return warehouse;
  }

  static async updateWarehouse(id: string, data: UpdateWarehouseInput) {
    const existingWarehouse = await prisma.warehouse.findUnique({
      where: { id },
    });

    if (!existingWarehouse) {
      throw new AppError("Warehouse not found", 404);
    }

    if (data.code && data.code !== existingWarehouse.code) {
      const codeExists = await prisma.warehouse.findUnique({
        where: { code: data.code },
      });

      if (codeExists) {
        throw new AppError("Warehouse code already exists", 409);
      }
    }

    const updatedWarehouse = await prisma.warehouse.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code,
        location: data.location,
      },
      select: {
        id: true,
        name: true,
        code: true,
        location: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedWarehouse;
  }

  static async deleteWarehouse(id: string) {
    const existingWarehouse = await prisma.warehouse.findUnique({
      where: { id },
    });

    if (!existingWarehouse) {
      throw new AppError("Warehouse not found", 404);
    }

    await prisma.warehouse.delete({
      where: { id },
    });
  }
}