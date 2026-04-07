import { z } from "zod";

export const createWarehouseSchema = z.object({
  name: z.string().min(1, "Warehouse name is required"),
  code: z.string().min(1, "Warehouse code is required"),
  location: z.string().optional(),
});

export const updateWarehouseSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().min(1).optional(),
  location: z.string().optional(),
});

export type CreateWarehouseInput = z.infer<typeof createWarehouseSchema>;
export type UpdateWarehouseInput = z.infer<typeof updateWarehouseSchema>;