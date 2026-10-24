import { asyncHandler } from "../utils/asyncHandler.js";
import { Category } from "../models/Category.js";
import { ApiError } from "../utils/ApiError.js";
import { getDbConnectionStatus } from "../config/database.js";
import { memoryStore } from "../services/memoryStore.js";

export const getCategories = asyncHandler(async (req, res) => {
  if (getDbConnectionStatus()) {
    const categories = await Category.find({ isActive: true }).sort({ displayOrder: 1 });
    return res.status(200).json({ success: true, data: categories });
  } else {
    return res.status(200).json({
      success: true,
      data: memoryStore.categories.filter((c) => c.isActive),
    });
  }
});

export const getCategoryBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  if (getDbConnectionStatus()) {
    const category = await Category.findOne({ slug, isActive: true });
    if (!category) throw new ApiError(404, "Category not found");
    return res.status(200).json({ success: true, data: category });
  } else {
    const category = memoryStore.categories.find((c) => c.slug === slug && c.isActive);
    if (!category) throw new ApiError(404, "Category not found");
    return res.status(200).json({ success: true, data: category });
  }
});

export const createCategory = asyncHandler(async (req, res) => {
  const { name, description, image, displayOrder } = req.body;
  const slug = req.body.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  if (getDbConnectionStatus()) {
    const category = await Category.create({ name, slug, description, image, displayOrder });
    return res.status(201).json({ success: true, message: "Category created", data: category });
  } else {
    const newCat = {
      _id: "cat_" + Date.now(),
      name,
      slug,
      description,
      image,
      isActive: true,
      displayOrder: displayOrder || memoryStore.categories.length + 1,
    };
    memoryStore.categories.push(newCat);
    return res.status(201).json({ success: true, message: "Category created", data: newCat });
  }
});

export const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (getDbConnectionStatus()) {
    const category = await Category.findByIdAndUpdate(id, req.body, { new: true });
    if (!category) throw new ApiError(404, "Category not found");
    return res.status(200).json({ success: true, message: "Category updated", data: category });
  } else {
    const idx = memoryStore.categories.findIndex((c) => c._id.toString() === id.toString());
    if (idx === -1) throw new ApiError(404, "Category not found");
    memoryStore.categories[idx] = { ...memoryStore.categories[idx], ...req.body };
    return res.status(200).json({ success: true, message: "Category updated", data: memoryStore.categories[idx] });
  }
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (getDbConnectionStatus()) {
    const category = await Category.findByIdAndDelete(id);
    if (!category) throw new ApiError(404, "Category not found");
    return res.status(200).json({ success: true, message: "Category deleted" });
  } else {
    const idx = memoryStore.categories.findIndex((c) => c._id.toString() === id.toString());
    if (idx === -1) throw new ApiError(404, "Category not found");
    memoryStore.categories.splice(idx, 1);
    return res.status(200).json({ success: true, message: "Category deleted" });
  }
});
