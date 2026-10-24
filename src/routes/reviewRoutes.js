import express from "express";
import * as reviewController from "../controllers/reviewController.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.get("/product/:productId", reviewController.getProductReviews);
router.post("/product/:productId", protect, reviewController.createReview);

// Admin review moderation
router.get("/admin", protect, adminOnly, reviewController.getAllReviews);
router.patch("/admin/:id/toggle-approval", protect, adminOnly, reviewController.toggleReviewApproval);
router.delete("/admin/:id", protect, adminOnly, reviewController.deleteReview);

export default router;
