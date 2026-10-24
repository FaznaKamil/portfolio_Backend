import express from "express";
import * as productController from "../controllers/productController.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";
import { validate } from "../middleware/validate.js";
import {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
} from "../validators/productValidator.js";

const router = express.Router();

router.get("/", validate(productQuerySchema), productController.getProducts);
router.get("/featured", productController.getFeaturedProducts);
router.get("/best-sellers", productController.getBestSellers);
router.get("/new-arrivals", productController.getNewArrivals);
router.get("/:id", productController.getProductById);
router.get("/:id/related", productController.getRelatedProducts);

// Admin-protected routes
router.post("/", protect, adminOnly, validate(createProductSchema), productController.createProduct);
router.put("/:id", protect, adminOnly, validate(updateProductSchema), productController.updateProduct);
router.delete("/:id", protect, adminOnly, productController.deleteProduct);

export default router;
