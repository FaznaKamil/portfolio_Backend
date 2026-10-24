import express from "express";
import * as orderController from "../controllers/orderController.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";
import { validate } from "../middleware/validate.js";
import { createOrderSchema, updateOrderStatusSchema } from "../validators/orderValidator.js";

const router = express.Router();

// Customer protected routes
router.post("/", protect, validate(createOrderSchema), orderController.createOrder);
router.get("/my-orders", protect, orderController.getMyOrders);
router.get("/:id", protect, orderController.getOrderById);

// Admin protected routes
router.get("/", protect, adminOnly, orderController.getAllOrders);
router.patch("/:id/status", protect, adminOnly, validate(updateOrderStatusSchema), orderController.updateOrderStatus);

export default router;
