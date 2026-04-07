import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Invalid email format"),
  role: z.enum(["ADMIN", "STAFF"]).optional().default("STAFF"),
});

export const updateUserProfileSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(["ADMIN", "STAFF"]),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
