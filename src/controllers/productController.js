import { asyncHandler } from "../utils/asyncHandler.js";
import * as productService from "../services/productService.js";

export const getProducts = asyncHandler(async (req, res) => {
  const result = await productService.queryProducts(req.query);
  res.status(200).json({
    success: true,
    data: result.products,
    pagination: result.pagination,
  });
});

export const getProductById = asyncHandler(async (req, res) => {
  const product = await productService.getProductById(req.params.id);
  res.status(200).json({
    success: true,
    data: product,
  });
});

export const getFeaturedProducts = asyncHandler(async (req, res) => {
  const result = await productService.queryProducts({ featured: true, limit: 8 });
  res.status(200).json({
    success: true,
    data: result.products,
  });
});

export const getBestSellers = asyncHandler(async (req, res) => {
  const result = await productService.queryProducts({ bestSeller: true, limit: 8 });
  res.status(200).json({
    success: true,
    data: result.products,
  });
});

export const getNewArrivals = asyncHandler(async (req, res) => {
  const result = await productService.queryProducts({ newArrival: true, limit: 8 });
  res.status(200).json({
    success: true,
    data: result.products,
  });
});

export const getRelatedProducts = asyncHandler(async (req, res) => {
  const products = await productService.getRelatedProducts(req.params.id);
  res.status(200).json({
    success: true,
    data: products,
  });
});

export const createProduct = asyncHandler(async (req, res) => {
  const product = await productService.createProduct(req.body);
  res.status(201).json({
    success: true,
    message: "Product created successfully",
    data: product,
  });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await productService.updateProduct(req.params.id, req.body);
  res.status(200).json({
    success: true,
    message: "Product updated successfully",
    data: product,
  });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  await productService.deleteProduct(req.params.id);
  res.status(200).json({
    success: true,
    message: "Product removed successfully",
  });
});
