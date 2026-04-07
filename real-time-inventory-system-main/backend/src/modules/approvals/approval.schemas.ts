import { z } from "zod";

export const approvalModuleSchema = z.enum(["inbound", "outbound"]);

export const rejectApprovalSchema = z.object({
  reason: z.string().max(1000, "Reason must be at most 1000 characters").optional(),
});

export type ApprovalModule = z.infer<typeof approvalModuleSchema>;
export type RejectApprovalInput = z.infer<typeof rejectApprovalSchema>;
