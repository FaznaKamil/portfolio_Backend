import express from "express";
import * as categoryController from "../controllers/categoryController.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.get("/", categoryController.getCategories);
router.get("/:slug", categoryController.getCategoryBySlug);

// Admin-protected routes
router.post("/", protect, adminOnly, categoryController.createCategory);
router.put("/:id", protect, adminOnly, categoryController.updateCategory);
router.delete("/:id", protect, adminOnly, categoryController.deleteCategory);

export default router;
