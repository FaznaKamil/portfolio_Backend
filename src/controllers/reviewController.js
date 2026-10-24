import { asyncHandler } from "../utils/asyncHandler.js";
import { Review } from "../models/Review.js";
import { Product } from "../models/Product.js";
import { ApiError } from "../utils/ApiError.js";
import { getDbConnectionStatus } from "../config/database.js";
import { memoryStore } from "../services/memoryStore.js";

export const getProductReviews = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  if (getDbConnectionStatus()) {
    const reviews = await Review.find({ product: productId, isApproved: true }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: reviews });
  } else {
    const reviews = memoryStore.reviews.filter(
      (r) => r.product.toString() === productId.toString() && r.isApproved
    );
    res.status(200).json({ success: true, data: reviews });
  }
});

export const createReview = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { rating, title, comment } = req.body;
  const userId = req.user._id;
  const userName = req.user.name;

  if (getDbConnectionStatus()) {
    const product = await Product.findById(productId);
    if (!product) throw new ApiError(404, "Product not found");

    const existing = await Review.findOne({ product: productId, user: userId });
    if (existing) {
      throw new ApiError(400, "You have already reviewed this product");
    }

    const review = await Review.create({
      product: productId,
      user: userId,
      userName,
      rating,
      title,
      comment,
      isApproved: true,
    });

    // Update product rating
    const allReviews = await Review.find({ product: productId, isApproved: true });
    const avgRating = allReviews.reduce((acc, r) => acc + r.rating, 0) / allReviews.length;
    product.rating = Number(avgRating.toFixed(1));
    product.numReviews = allReviews.length;
    await product.save();

    res.status(201).json({ success: true, message: "Review posted successfully", data: review });
  } else {
    const product = memoryStore.products.find((p) => p._id.toString() === productId.toString());
    if (!product) throw new ApiError(404, "Product not found");

    const existing = memoryStore.reviews.find(
      (r) => r.product.toString() === productId.toString() && r.user.toString() === userId.toString()
    );
    if (existing) {
      throw new ApiError(400, "You have already reviewed this product");
    }

    const newRev = {
      _id: "rev_" + Date.now(),
      product: productId,
      user: userId,
      userName,
      rating: Number(rating),
      title,
      comment,
      isApproved: true,
      createdAt: new Date(),
    };
    memoryStore.reviews.unshift(newRev);

    const allRevs = memoryStore.reviews.filter(
      (r) => r.product.toString() === productId.toString() && r.isApproved
    );
    const avg = allRevs.reduce((acc, r) => acc + r.rating, 0) / allRevs.length;
    product.rating = Number(avg.toFixed(1));
    product.numReviews = allRevs.length;

    res.status(201).json({ success: true, message: "Review posted successfully", data: newRev });
  }
});

export const getAllReviews = asyncHandler(async (req, res) => {
  if (getDbConnectionStatus()) {
    const reviews = await Review.find()
      .populate("product", "name images")
      .populate("user", "name email")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: reviews });
  } else {
    const reviews = memoryStore.reviews.map((r) => {
      const prod = memoryStore.products.find((p) => p._id.toString() === r.product.toString());
      const usr = memoryStore.users.find((u) => u._id.toString() === r.user.toString());
      return {
        ...r,
        product: prod ? { _id: prod._id, name: prod.name, images: prod.images } : r.product,
        user: usr ? { _id: usr._id, name: usr.name, email: usr.email } : r.user,
      };
    });
    res.status(200).json({ success: true, data: reviews });
  }
});

export const toggleReviewApproval = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (getDbConnectionStatus()) {
    const review = await Review.findById(id);
    if (!review) throw new ApiError(404, "Review not found");
    review.isApproved = !review.isApproved;
    await review.save();
    res.status(200).json({ success: true, message: "Review status updated", data: review });
  } else {
    const review = memoryStore.reviews.find((r) => r._id.toString() === id.toString());
    if (!review) throw new ApiError(404, "Review not found");
    review.isApproved = !review.isApproved;
    res.status(200).json({ success: true, message: "Review status updated", data: review });
  }
});

export const deleteReview = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (getDbConnectionStatus()) {
    const review = await Review.findByIdAndDelete(id);
    if (!review) throw new ApiError(404, "Review not found");
    res.status(200).json({ success: true, message: "Review deleted" });
  } else {
    const idx = memoryStore.reviews.findIndex((r) => r._id.toString() === id.toString());
    if (idx === -1) throw new ApiError(404, "Review not found");
    memoryStore.reviews.splice(idx, 1);
    res.status(200).json({ success: true, message: "Review deleted" });
  }
});
