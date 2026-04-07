import type { Prisma } from "@prisma/client";
import { AppError } from "../../shared/errors/app-error";

type InventoryPostingLineItem = {
  productId: string;
  quantity: number;
  notes?: string | null;
};

type InventoryPostingInput = {
  tx: Prisma.TransactionClient;
  warehouseId: string;
  createdById: string;
  reference: string;
  lineItems: InventoryPostingLineItem[];
};

export async function postInboundInventory({
  tx,
  warehouseId,
  createdById,
  reference,
  lineItems,
}: InventoryPostingInput) {
  for (const lineItem of lineItems) {
    const existingInventory = await tx.inventory.findUnique({
      where: {
        productId_warehouseId: {
          productId: lineItem.productId,
          warehouseId,
        },
      },
    });

    const beforeOnHand = existingInventory?.onHand ?? 0;
    const beforeReserved = existingInventory?.reserved ?? 0;
    const afterOnHand = beforeOnHand + lineItem.quantity;

    const inventory = existingInventory
      ? await tx.inventory.update({
          where: { id: existingInventory.id },
          data: {
            onHand: afterOnHand,
          },
        })
      : await tx.inventory.create({
          data: {
            productId: lineItem.productId,
            warehouseId,
            onHand: afterOnHand,
            reserved: 0,
          },
        });

    await tx.inventoryTransaction.create({
      data: {
        type: "STOCK_IN",
        productId: lineItem.productId,
        warehouseId,
        quantity: lineItem.quantity,
        beforeOnHand,
        afterOnHand: inventory.onHand,
        beforeReserved,
        afterReserved: inventory.reserved,
        reference,
        note: lineItem.notes ?? "Inbound order approved",
        createdById,
      },
    });
  }
}

export async function postOutboundInventory({
  tx,
  warehouseId,
  createdById,
  reference,
  lineItems,
}: InventoryPostingInput) {
  for (const lineItem of lineItems) {
    const existingInventory = await tx.inventory.findUnique({
      where: {
        productId_warehouseId: {
          productId: lineItem.productId,
          warehouseId,
        },
      },
    });

    if (!existingInventory) {
      throw new AppError(`Inventory record not found for product ${lineItem.productId}`, 404);
    }

    const beforeOnHand = existingInventory.onHand;
    const beforeReserved = existingInventory.reserved;
    const available = beforeOnHand - beforeReserved;

    if (available < lineItem.quantity) {
      throw new AppError(`Insufficient available stock for product ${lineItem.productId}`, 400);
    }

    const inventory = await tx.inventory.update({
      where: { id: existingInventory.id },
      data: {
        onHand: beforeOnHand - lineItem.quantity,
      },
    });

    await tx.inventoryTransaction.create({
      data: {
        type: "STOCK_OUT",
        productId: lineItem.productId,
        warehouseId,
        quantity: lineItem.quantity,
        beforeOnHand,
        afterOnHand: inventory.onHand,
        beforeReserved,
        afterReserved: inventory.reserved,
        reference,
        note: lineItem.notes ?? "Outbound order approved",
        createdById,
      },
    });
  }
}
