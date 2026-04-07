import { z } from "zod";

export const increaseInventorySchema = z.object({
  productId: z.string().min(1, "productId is required"),
  warehouseId: z.string().min(1, "warehouseId is required"),
  quantity: z
    .number({
      error: (issue) => {
        if (issue.input === undefined) {
          return "Quantity is required";
        }
        return "Quantity must be a number";
      },
    })
    .int("Quantity must be an integer")
    .positive("Quantity must be greater than 0"),
  reference: z
    .string()
    .max(255, "Reference must be at most 255 characters")
    .optional(),
  note: z
    .string()
    .max(255, "Note must be at most 255 characters")
    .optional(),
});

export const decreaseInventorySchema = z.object({
  productId: z.string().min(1, "productId is required"),
  warehouseId: z.string().min(1, "warehouseId is required"),
  quantity: z
    .number({
      error: (issue) => {
        if (issue.input === undefined) {
          return "Quantity is required";
        }
        return "Quantity must be a number";
      },
    })
    .int("Quantity must be an integer")
    .positive("Quantity must be greater than 0"),
  reference: z
    .string()
    .max(255, "Reference must be at most 255 characters")
    .optional(),
  note: z
    .string()
    .max(255, "Note must be at most 255 characters")
    .optional(),
});

export const transferInventorySchema = z.object({
  productId: z.string().min(1, "productId is required"),
  sourceWarehouseId: z.string().min(1, "sourceWarehouseId is required"),
  targetWarehouseId: z.string().min(1, "targetWarehouseId is required"),
  quantity: z
    .number({
      error: (issue) => {
        if (issue.input === undefined) {
          return "Quantity is required";
        }
        return "Quantity must be a number";
      },
    })
    .int("Quantity must be an integer")
    .positive("Quantity must be greater than 0"),
  reference: z
    .string()
    .max(255, "Reference must be at most 255 characters")
    .optional(),
  note: z
    .string()
    .max(255, "Note must be at most 255 characters")
    .optional(),
});

export const reserveInventorySchema = z.object({
  productId: z.string().min(1, "productId is required"),
  warehouseId: z.string().min(1, "warehouseId is required"),
  quantity: z
    .number({
      error: (issue) => {
        if (issue.input === undefined) {
          return "Quantity is required";
        }
        return "Quantity must be a number";
      },
    })
    .int("Quantity must be an integer")
    .positive("Quantity must be greater than 0"),
  reference: z
    .string()
    .max(255, "Reference must be at most 255 characters")
    .optional(),
  note: z
    .string()
    .max(255, "Note must be at most 255 characters")
    .optional(),
});

export const releaseInventorySchema = z.object({
  productId: z.string().min(1, "productId is required"),
  warehouseId: z.string().min(1, "warehouseId is required"),
  quantity: z
    .number({
      error: (issue) => {
        if (issue.input === undefined) {
          return "Quantity is required";
        }
        return "Quantity must be a number";
      },
    })
    .int("Quantity must be an integer")
    .positive("Quantity must be greater than 0"),
  reference: z
    .string()
    .max(255, "Reference must be at most 255 characters")
    .optional(),
  note: z
    .string()
    .max(255, "Note must be at most 255 characters")
    .optional(),
});

export const commitReservedInventorySchema = z.object({
  productId: z.string().min(1, "productId is required"),
  warehouseId: z.string().min(1, "warehouseId is required"),
  quantity: z
    .number({
      error: (issue) => {
        if (issue.input === undefined) {
          return "Quantity is required";
        }
        return "Quantity must be a number";
      },
    })
    .int("Quantity must be an integer")
    .positive("Quantity must be greater than 0"),
  reference: z
    .string()
    .max(255, "Reference must be at most 255 characters")
    .optional(),
  note: z
    .string()
    .max(255, "Note must be at most 255 characters")
    .optional(),
});

export type IncreaseInventoryInput = z.infer<typeof increaseInventorySchema>;
export type DecreaseInventoryInput = z.infer<typeof decreaseInventorySchema>;
export type TransferInventoryInput = z.infer<typeof transferInventorySchema>;
export type ReserveInventoryInput = z.infer<typeof reserveInventorySchema>;
export type ReleaseInventoryInput = z.infer<typeof releaseInventorySchema>;
export type CommitReservedInventoryInput = z.infer<
  typeof commitReservedInventorySchema
>;