import { z } from "zod";

export const createOrderSchema = z.object({
  body: z.object({
    items: z.array(
      z.object({
        productId: z.string().min(1, "Product ID is required"),
        quantity: z.number().int().min(1, "Quantity must be at least 1"),
      })
    ).min(1, "Cart cannot be empty"),
    shippingAddress: z.object({
      fullName: z.string().min(2, "Full name is required"),
      street: z.string().min(3, "Street address is required"),
      city: z.string().min(2, "City is required"),
      state: z.string().min(2, "State/Province is required"),
      postalCode: z.string().min(2, "Postal code is required"),
      country: z.string().default("United States"),
      phone: z.string().min(6, "Valid phone number is required"),
    }),
    paymentMethod: z.enum(["cod", "test_card"]).default("cod"),
    couponCode: z.string().optional(),
  }),
});

export const updateOrderStatusSchema = z.object({
  body: z.object({
    orderStatus: z.enum(["pending", "processing", "shipped", "delivered", "cancelled"]),
    note: z.string().optional(),
    trackingNumber: z.string().optional(),
  }),
});
