import { z } from "zod";

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Product name is required"),
    slug: z.string().min(2).optional(),
    description: z.string().min(10, "Description must be at least 10 characters"),
    price: z.number().positive("Price must be greater than 0"),
    compareAtPrice: z.number().min(0).optional().default(0),
    category: z.string().min(1, "Category is required"),
    images: z.array(z.string().url("Image must be a valid URL")).min(1, "At least one image is required"),
    stock: z.number().int().min(0, "Stock cannot be negative"),
    isFeatured: z.boolean().optional().default(false),
    isBestSeller: z.boolean().optional().default(false),
    isNewArrival: z.boolean().optional().default(false),
    tags: z.array(z.string()).optional().default([]),
    sku: z.string().optional(),
    isActive: z.boolean().optional().default(true),
  }),
});

export const updateProductSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    slug: z.string().min(2).optional(),
    description: z.string().min(10).optional(),
    price: z.number().positive().optional(),
    compareAtPrice: z.number().min(0).optional(),
    category: z.string().optional(),
    images: z.array(z.string().url()).min(1).optional(),
    stock: z.number().int().min(0).optional(),
    isFeatured: z.boolean().optional(),
    isBestSeller: z.boolean().optional(),
    isNewArrival: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
    sku: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const productQuerySchema = z.object({
  query: z.object({
    keyword: z.string().optional(),
    category: z.string().optional(),
    minPrice: z.string().optional(),
    maxPrice: z.string().optional(),
    sortBy: z.string().optional(),
    order: z.enum(["asc", "desc"]).optional().default("asc"),
    page: z.string().optional().default("1"),
    limit: z.string().optional().default("12"),
    featured: z.string().optional(),
    bestSeller: z.string().optional(),
    newArrival: z.string().optional(),
  }).optional(),
});
