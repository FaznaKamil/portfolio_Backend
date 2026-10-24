import express from "express";
import * as couponController from "../controllers/couponController.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";
import { validate } from "../middleware/validate.js";
import { applyCouponSchema, createCouponSchema } from "../validators/couponValidator.js";

const router = express.Router();

router.post("/validate", validate(applyCouponSchema), couponController.validateCoupon);

// Admin-protected coupon management
router.get("/", protect, adminOnly, couponController.getCoupons);
router.post("/", protect, adminOnly, validate(createCouponSchema), couponController.createCoupon);
router.put("/:id", protect, adminOnly, couponController.updateCoupon);
router.delete("/:id", protect, adminOnly, couponController.deleteCoupon);

export default router;
