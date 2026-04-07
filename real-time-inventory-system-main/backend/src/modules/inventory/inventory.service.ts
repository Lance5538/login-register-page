import prisma from "../../lib/prisma";
import { AppError } from "../../shared/errors/app-error";
import {
  IncreaseInventoryInput,
  DecreaseInventoryInput,
  TransferInventoryInput,
  ReserveInventoryInput,
  ReleaseInventoryInput,
  CommitReservedInventoryInput,
} from "./inventory.schema";

export class InventoryService {
  static async increaseInventory(data: IncreaseInventoryInput, userId: string) {
    const { productId, warehouseId, quantity, note, reference } = data;

    const [product, warehouse] = await Promise.all([
      prisma.product.findUnique({
        where: { id: productId },
      }),
      prisma.warehouse.findUnique({
        where: { id: warehouseId },
      }),
    ]);

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    if (!warehouse) {
      throw new AppError("Warehouse not found", 404);
    }

    const result = await prisma.$transaction(async (tx) => {
      const existingInventory = await tx.inventory.findUnique({
        where: {
          productId_warehouseId: {
            productId,
            warehouseId,
          },
        },
      });

      const beforeOnHand = existingInventory?.onHand ?? 0;
      const afterOnHand = beforeOnHand + quantity;

      const beforeReserved = existingInventory?.reserved ?? 0;
      const afterReserved = beforeReserved;

      const inventory = existingInventory
        ? await tx.inventory.update({
            where: {
              id: existingInventory.id,
            },
            data: {
              onHand: afterOnHand,
            },
          })
        : await tx.inventory.create({
            data: {
              productId,
              warehouseId,
              onHand: afterOnHand,
              reserved: 0,
            },
          });

      const transaction = await tx.inventoryTransaction.create({
        data: {
          type: "STOCK_IN",
          productId,
          warehouseId,
          quantity,
          beforeOnHand,
          afterOnHand,
          beforeReserved,
          afterReserved,
          reference,
          note,
          createdById: userId,
        },
      });

      return {
        inventory: {
          ...inventory,
          available: inventory.onHand - inventory.reserved,
        },
        transaction,
      };
    });

    return result;
  }

  static async decreaseInventory(data: DecreaseInventoryInput, userId: string) {
    const { productId, warehouseId, quantity, note, reference } = data;

    const [product, warehouse] = await Promise.all([
      prisma.product.findUnique({
        where: { id: productId },
      }),
      prisma.warehouse.findUnique({
        where: { id: warehouseId },
      }),
    ]);

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    if (!warehouse) {
      throw new AppError("Warehouse not found", 404);
    }

    const result = await prisma.$transaction(async (tx) => {
      const existingInventory = await tx.inventory.findUnique({
        where: {
          productId_warehouseId: {
            productId,
            warehouseId,
          },
        },
      });

      if (!existingInventory) {
        throw new AppError("Inventory record not found", 404);
      }

      const beforeOnHand = existingInventory.onHand;
      const beforeReserved = existingInventory.reserved;
      const available = beforeOnHand - beforeReserved;

      if (available < quantity) {
        throw new AppError("Insufficient available stock", 400);
      }

      const afterOnHand = beforeOnHand - quantity;
      const afterReserved = beforeReserved;

      const inventory = await tx.inventory.update({
        where: {
          id: existingInventory.id,
        },
        data: {
          onHand: afterOnHand,
        },
      });

      const transaction = await tx.inventoryTransaction.create({
        data: {
          type: "STOCK_OUT",
          productId,
          warehouseId,
          quantity,
          beforeOnHand,
          afterOnHand,
          beforeReserved,
          afterReserved,
          reference,
          note,
          createdById: userId,
        },
      });

      return {
        inventory: {
          ...inventory,
          available: inventory.onHand - inventory.reserved,
        },
        transaction,
      };
    });

    return result;
  }

  static async transferInventory(data: TransferInventoryInput, userId: string) {
    const {
      productId,
      sourceWarehouseId,
      targetWarehouseId,
      quantity,
      reference,
      note,
    } = data;

    if (sourceWarehouseId === targetWarehouseId) {
      throw new AppError("Source and target warehouse cannot be the same", 400);
    }

    const [product, sourceWarehouse, targetWarehouse] = await Promise.all([
      prisma.product.findUnique({
        where: { id: productId },
      }),
      prisma.warehouse.findUnique({
        where: { id: sourceWarehouseId },
      }),
      prisma.warehouse.findUnique({
        where: { id: targetWarehouseId },
      }),
    ]);

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    if (!sourceWarehouse) {
      throw new AppError("Source warehouse not found", 404);
    }

    if (!targetWarehouse) {
      throw new AppError("Target warehouse not found", 404);
    }

    const result = await prisma.$transaction(async (tx) => {
      const sourceInventory = await tx.inventory.findUnique({
        where: {
          productId_warehouseId: {
            productId,
            warehouseId: sourceWarehouseId,
          },
        },
      });

      if (!sourceInventory) {
        throw new AppError("Source inventory record not found", 404);
      }

      const sourceBeforeOnHand = sourceInventory.onHand;
      const sourceBeforeReserved = sourceInventory.reserved;
      const sourceAvailable = sourceBeforeOnHand - sourceBeforeReserved;

      if (sourceAvailable < quantity) {
        throw new AppError("Insufficient available stock in source warehouse", 400);
      }

      const targetInventory = await tx.inventory.findUnique({
        where: {
          productId_warehouseId: {
            productId,
            warehouseId: targetWarehouseId,
          },
        },
      });

      const sourceAfterOnHand = sourceBeforeOnHand - quantity;
      const sourceAfterReserved = sourceBeforeReserved;

      const updatedSourceInventory = await tx.inventory.update({
        where: {
          id: sourceInventory.id,
        },
        data: {
          onHand: sourceAfterOnHand,
        },
      });

      const targetBeforeOnHand = targetInventory?.onHand ?? 0;
      const targetBeforeReserved = targetInventory?.reserved ?? 0;
      const targetAfterOnHand = targetBeforeOnHand + quantity;
      const targetAfterReserved = targetBeforeReserved;

      const updatedTargetInventory = targetInventory
        ? await tx.inventory.update({
            where: {
              id: targetInventory.id,
            },
            data: {
              onHand: targetAfterOnHand,
            },
          })
        : await tx.inventory.create({
            data: {
              productId,
              warehouseId: targetWarehouseId,
              onHand: targetAfterOnHand,
              reserved: 0,
            },
          });

      const transaction = await tx.inventoryTransaction.create({
        data: {
          type: "TRANSFER",
          productId,
          warehouseId: sourceWarehouseId,
          sourceWarehouseId,
          targetWarehouseId,
          quantity,
          beforeOnHand: sourceBeforeOnHand,
          afterOnHand: sourceAfterOnHand,
          beforeReserved: sourceBeforeReserved,
          afterReserved: sourceAfterReserved,
          reference,
          note,
          createdById: userId,
        },
      });

      return {
        sourceInventory: {
          ...updatedSourceInventory,
          available: updatedSourceInventory.onHand - updatedSourceInventory.reserved,
        },
        targetInventory: {
          ...updatedTargetInventory,
          available: updatedTargetInventory.onHand - updatedTargetInventory.reserved,
        },
        transaction,
      };
    });

    return result;
  }

  static async reserveInventory(data: ReserveInventoryInput, userId: string) {
    const { productId, warehouseId, quantity, reference, note } = data;

    const [product, warehouse] = await Promise.all([
      prisma.product.findUnique({
        where: { id: productId },
      }),
      prisma.warehouse.findUnique({
        where: { id: warehouseId },
      }),
    ]);

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    if (!warehouse) {
      throw new AppError("Warehouse not found", 404);
    }

    const result = await prisma.$transaction(async (tx) => {
      const inventory = await tx.inventory.findUnique({
        where: {
          productId_warehouseId: {
            productId,
            warehouseId,
          },
        },
      });

      if (!inventory) {
        throw new AppError("Inventory record not found", 404);
      }

      const beforeOnHand = inventory.onHand;
      const beforeReserved = inventory.reserved;
      const available = beforeOnHand - beforeReserved;

      if (available < quantity) {
        throw new AppError("Insufficient available stock to reserve", 400);
      }

      const afterOnHand = beforeOnHand;
      const afterReserved = beforeReserved + quantity;

      const updatedInventory = await tx.inventory.update({
        where: {
          id: inventory.id,
        },
        data: {
          reserved: afterReserved,
        },
      });

      const transaction = await tx.inventoryTransaction.create({
        data: {
          type: "RESERVE",
          productId,
          warehouseId,
          quantity,
          beforeOnHand,
          afterOnHand,
          beforeReserved,
          afterReserved,
          reference,
          note,
          createdById: userId,
        },
      });

      return {
        inventory: {
          ...updatedInventory,
          available: updatedInventory.onHand - updatedInventory.reserved,
        },
        transaction,
      };
    });

    return result;
  }

  static async releaseInventory(data: ReleaseInventoryInput, userId: string) {
    const { productId, warehouseId, quantity, reference, note } = data;

    const [product, warehouse] = await Promise.all([
      prisma.product.findUnique({
        where: { id: productId },
      }),
      prisma.warehouse.findUnique({
        where: { id: warehouseId },
      }),
    ]);

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    if (!warehouse) {
      throw new AppError("Warehouse not found", 404);
    }

    const result = await prisma.$transaction(async (tx) => {
      const inventory = await tx.inventory.findUnique({
        where: {
          productId_warehouseId: {
            productId,
            warehouseId,
          },
        },
      });

      if (!inventory) {
        throw new AppError("Inventory record not found", 404);
      }

      const beforeOnHand = inventory.onHand;
      const beforeReserved = inventory.reserved;

      if (beforeReserved < quantity) {
        throw new AppError("Cannot release more than reserved stock", 400);
      }

      const afterOnHand = beforeOnHand;
      const afterReserved = beforeReserved - quantity;

      const updatedInventory = await tx.inventory.update({
        where: {
          id: inventory.id,
        },
        data: {
          reserved: afterReserved,
        },
      });

      const transaction = await tx.inventoryTransaction.create({
        data: {
          type: "RELEASE",
          productId,
          warehouseId,
          quantity,
          beforeOnHand,
          afterOnHand,
          beforeReserved,
          afterReserved,
          reference,
          note: note ?? "Release reserved inventory",
          createdById: userId,
        },
      });

      return {
        inventory: {
          ...updatedInventory,
          available: updatedInventory.onHand - updatedInventory.reserved,
        },
        transaction,
      };
    });

    return result;
  }

  static async commitReservedInventory(
    data: CommitReservedInventoryInput,
    userId: string
  ) {
    const { productId, warehouseId, quantity, reference, note } = data;

    const [product, warehouse] = await Promise.all([
      prisma.product.findUnique({
        where: { id: productId },
      }),
      prisma.warehouse.findUnique({
        where: { id: warehouseId },
      }),
    ]);

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    if (!warehouse) {
      throw new AppError("Warehouse not found", 404);
    }

    const result = await prisma.$transaction(async (tx) => {
      const inventory = await tx.inventory.findUnique({
        where: {
          productId_warehouseId: {
            productId,
            warehouseId,
          },
        },
      });

      if (!inventory) {
        throw new AppError("Inventory record not found", 404);
      }

      const beforeOnHand = inventory.onHand;
      const beforeReserved = inventory.reserved;

      if (beforeReserved < quantity) {
        throw new AppError("Cannot commit more than reserved stock", 400);
      }

      const afterOnHand = beforeOnHand - quantity;
      const afterReserved = beforeReserved - quantity;

      const updatedInventory = await tx.inventory.update({
        where: {
          id: inventory.id,
        },
        data: {
          onHand: afterOnHand,
          reserved: afterReserved,
        },
      });

      const transaction = await tx.inventoryTransaction.create({
        data: {
          type: "COMMIT_OUT",
          productId,
          warehouseId,
          quantity,
          beforeOnHand,
          afterOnHand,
          beforeReserved,
          afterReserved,
          reference,
          note: note ?? "Commit reserved inventory",
          createdById: userId,
        },
      });

      return {
        inventory: {
          ...updatedInventory,
          available: updatedInventory.onHand - updatedInventory.reserved,
        },
        transaction,
      };
    });

    return result;
  }

  static async getInventory() {
    const inventory = await prisma.inventory.findMany({
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            unit: true,
          },
        },
        warehouse: {
          select: {
            id: true,
            name: true,
            code: true,
            location: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return inventory.map((item) => ({
      ...item,
      available: item.onHand - item.reserved,
    }));
  }

  static async getTransactions() {
    return prisma.inventoryTransaction.findMany({
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
        warehouse: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        sourceWarehouse: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        targetWarehouse: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }
}