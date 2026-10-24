import express from "express";
import * as reportController from "../controllers/reportController.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.get("/dashboard", protect, adminOnly, reportController.getDashboardStats);
router.get("/sales", protect, adminOnly, reportController.getSalesReport);

export default router;
