import { z } from "zod";

const inboundLineItemSchema = z.object({
  productId: z.string().min(1, "productId is required"),
  quantity: z.coerce
    .number({
      error: "Quantity must be a number",
    })
    .int("Quantity must be an integer")
    .positive("Quantity must be greater than 0"),
  notes: z.string().max(255, "Line item notes must be at most 255 characters").optional(),
});

export const createInboundOrderSchema = z.object({
  inboundNo: z.string().min(1, "Inbound No is required").optional(),
  warehouseId: z.string().min(1, "warehouseId is required"),
  supplierName: z.string().min(1, "Supplier name is required"),
  referenceNo: z.string().max(255, "Reference No must be at most 255 characters").optional(),
  plannedDate: z.string().min(1, "Planned date is required"),
  notes: z.string().max(1000, "Notes must be at most 1000 characters").optional(),
  submitForApproval: z.boolean().optional().default(false),
  lineItems: z.array(inboundLineItemSchema).min(1, "At least one line item is required"),
});

export const updateInboundOrderSchema = createInboundOrderSchema;

export type CreateInboundOrderInput = z.infer<typeof createInboundOrderSchema>;
export type UpdateInboundOrderInput = z.infer<typeof updateInboundOrderSchema>;
