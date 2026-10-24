import express from "express";
import * as contactController from "../controllers/contactController.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";
import { validate } from "../middleware/validate.js";
import { createContactSchema } from "../validators/contactValidator.js";

const router = express.Router();

router.post("/", validate(createContactSchema), contactController.submitContactMessage);

// Admin-protected routes
router.get("/messages", protect, adminOnly, contactController.getContactMessages);
router.patch("/messages/:id", protect, adminOnly, contactController.updateMessageStatus);
router.get("/settings", contactController.getStoreSettings);
router.put("/settings", protect, adminOnly, contactController.updateStoreSettings);

export default router;
