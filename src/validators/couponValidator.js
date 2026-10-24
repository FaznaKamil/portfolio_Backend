import { z } from "zod";

export const createCouponSchema = z.object({
  body: z.object({
    code: z.string().min(3).max(20).toUpperCase(),
    discountType: z.enum(["percentage", "fixed"]),
    discountAmount: z.number().positive(),
    minOrderAmount: z.number().min(0).default(0),
    expiryDate: z.string().or(z.date()),
    usageLimit: z.number().int().min(1).default(100),
    isActive: z.boolean().default(true),
  }),
});

export const applyCouponSchema = z.object({
  body: z.object({
    code: z.string().min(1, "Coupon code is required"),
    subtotal: z.number().min(0),
  }),
});
