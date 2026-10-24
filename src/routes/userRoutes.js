import express from "express";
import * as userController from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";

const router = express.Router();

// Customer address & wishlist endpoints
router.post("/addresses", protect, userController.addAddress);
router.delete("/addresses/:addressId", protect, userController.deleteAddress);
router.post("/wishlist/toggle", protect, userController.toggleWishlistItem);

// Admin customer management endpoints
router.get("/customers", protect, adminOnly, userController.getCustomers);
router.get("/customers/:id", protect, adminOnly, userController.getCustomerById);

export default router;
