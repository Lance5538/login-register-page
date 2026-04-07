import { z } from "zod";

const outboundLineItemSchema = z.object({
  productId: z.string().min(1, "productId is required"),
  quantity: z.coerce
    .number({
      error: "Quantity must be a number",
    })
    .int("Quantity must be an integer")
    .positive("Quantity must be greater than 0"),
  notes: z.string().max(255, "Line item notes must be at most 255 characters").optional(),
});

export const createOutboundOrderSchema = z.object({
  outboundNo: z.string().min(1, "Outbound No is required").optional(),
  warehouseId: z.string().min(1, "warehouseId is required"),
  destination: z.string().min(1, "Destination is required"),
  carrier: z.string().max(255, "Carrier must be at most 255 characters").optional(),
  shipmentDate: z.string().min(1, "Shipment date is required"),
  notes: z.string().max(1000, "Notes must be at most 1000 characters").optional(),
  submitForApproval: z.boolean().optional().default(false),
  lineItems: z.array(outboundLineItemSchema).min(1, "At least one line item is required"),
});

export const updateOutboundOrderSchema = createOutboundOrderSchema;

export type CreateOutboundOrderInput = z.infer<typeof createOutboundOrderSchema>;
export type UpdateOutboundOrderInput = z.infer<typeof updateOutboundOrderSchema>;
