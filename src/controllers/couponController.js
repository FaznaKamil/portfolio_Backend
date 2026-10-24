import { asyncHandler } from "../utils/asyncHandler.js";
import { Coupon } from "../models/Coupon.js";
import { ApiError } from "../utils/ApiError.js";
import { getDbConnectionStatus } from "../config/database.js";
import { memoryStore } from "../services/memoryStore.js";

export const validateCoupon = asyncHandler(async (req, res) => {
  const { code, subtotal } = req.body;
  const uppercaseCode = code.toUpperCase().trim();

  let coupon;
  if (getDbConnectionStatus()) {
    coupon = await Coupon.findOne({ code: uppercaseCode, isActive: true });
  } else {
    coupon = memoryStore.coupons.find((c) => c.code === uppercaseCode && c.isActive);
  }

  if (!coupon) {
    throw new ApiError(404, "Invalid or non-existent promotional coupon");
  }

  if (new Date(coupon.expiryDate) < new Date()) {
    throw new ApiError(400, "This coupon has expired");
  }

  if (coupon.usedCount >= coupon.usageLimit) {
    throw new ApiError(400, "Coupon usage limit has been reached");
  }

  if (subtotal < coupon.minOrderAmount) {
    throw new ApiError(400, `Minimum order amount of $${coupon.minOrderAmount} required for this coupon`);
  }

  let discountAmount = 0;
  if (coupon.discountType === "percentage") {
    discountAmount = Number(((subtotal * coupon.discountAmount) / 100).toFixed(2));
  } else {
    discountAmount = Math.min(coupon.discountAmount, subtotal);
  }

  res.status(200).json({
    success: true,
    message: "Coupon applied successfully",
    data: {
      code: coupon.code,
      discountType: coupon.discountType,
      discountRate: coupon.discountAmount,
      discountAmount,
      minOrderAmount: coupon.minOrderAmount,
    },
  });
});

export const getCoupons = asyncHandler(async (req, res) => {
  if (getDbConnectionStatus()) {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: coupons });
  } else {
    res.status(200).json({ success: true, data: memoryStore.coupons });
  }
});

export const createCoupon = asyncHandler(async (req, res) => {
  const { code, discountType, discountAmount, minOrderAmount, expiryDate, usageLimit, isActive } = req.body;
  const uppercaseCode = code.toUpperCase().trim();

  if (getDbConnectionStatus()) {
    const existing = await Coupon.findOne({ code: uppercaseCode });
    if (existing) throw new ApiError(409, "A coupon with this code already exists");

    const coupon = await Coupon.create({
      code: uppercaseCode,
      discountType,
      discountAmount,
      minOrderAmount,
      expiryDate,
      usageLimit,
      isActive,
    });
    res.status(201).json({ success: true, message: "Coupon created", data: coupon });
  } else {
    const existing = memoryStore.coupons.find((c) => c.code === uppercaseCode);
    if (existing) throw new ApiError(409, "A coupon with this code already exists");

    const newCoupon = {
      _id: "cpn_" + Date.now(),
      code: uppercaseCode,
      discountType,
      discountAmount,
      minOrderAmount: minOrderAmount || 0,
      expiryDate: new Date(expiryDate),
      usageLimit: usageLimit || 100,
      usedCount: 0,
      isActive: isActive !== undefined ? isActive : true,
    };
    memoryStore.coupons.unshift(newCoupon);
    res.status(201).json({ success: true, message: "Coupon created", data: newCoupon });
  }
});

export const updateCoupon = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (getDbConnectionStatus()) {
    const coupon = await Coupon.findByIdAndUpdate(id, req.body, { new: true });
    if (!coupon) throw new ApiError(404, "Coupon not found");
    res.status(200).json({ success: true, message: "Coupon updated", data: coupon });
  } else {
    const idx = memoryStore.coupons.findIndex((c) => c._id.toString() === id.toString());
    if (idx === -1) throw new ApiError(404, "Coupon not found");
    memoryStore.coupons[idx] = { ...memoryStore.coupons[idx], ...req.body };
    res.status(200).json({ success: true, message: "Coupon updated", data: memoryStore.coupons[idx] });
  }
});

export const deleteCoupon = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (getDbConnectionStatus()) {
    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) throw new ApiError(404, "Coupon not found");
    res.status(200).json({ success: true, message: "Coupon deleted" });
  } else {
    const idx = memoryStore.coupons.findIndex((c) => c._id.toString() === id.toString());
    if (idx === -1) throw new ApiError(404, "Coupon not found");
    memoryStore.coupons.splice(idx, 1);
    res.status(200).json({ success: true, message: "Coupon deleted" });
  }
});
