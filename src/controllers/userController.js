import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/User.js";
import { Order } from "../models/Order.js";
import { ApiError } from "../utils/ApiError.js";
import { getDbConnectionStatus } from "../config/database.js";
import { memoryStore } from "../services/memoryStore.js";

export const getCustomers = asyncHandler(async (req, res) => {
  if (getDbConnectionStatus()) {
    const customers = await User.find({ role: "customer" }).select("-password");

    const customersWithStats = await Promise.all(
      customers.map(async (customer) => {
        const orders = await Order.find({ user: customer._id });
        const totalSpent = orders.reduce((acc, curr) => acc + (curr.totalPrice || 0), 0);
        return {
          ...customer.toObject(),
          orderCount: orders.length,
          totalSpent,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: customersWithStats,
    });
  } else {
    const customers = memoryStore.users.filter((u) => u.role === "customer");
    const customersWithStats = customers.map((c) => {
      const orders = memoryStore.orders.filter((o) => o.user.toString() === c._id.toString());
      const totalSpent = orders.reduce((acc, curr) => acc + (curr.totalPrice || 0), 0);
      const { password, ...safeUser } = c;
      return {
        ...safeUser,
        orderCount: orders.length,
        totalSpent,
      };
    });

    res.status(200).json({
      success: true,
      data: customersWithStats,
    });
  }
});

export const getCustomerById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (getDbConnectionStatus()) {
    const customer = await User.findById(id).select("-password");
    if (!customer) throw new ApiError(404, "Customer not found");
    const orders = await Order.find({ user: id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        ...customer.toObject(),
        orders,
      },
    });
  } else {
    const customer = memoryStore.users.find((u) => u._id.toString() === id.toString());
    if (!customer) throw new ApiError(404, "Customer not found");
    const orders = memoryStore.orders.filter((o) => o.user.toString() === id.toString());
    const { password, ...safeUser } = customer;

    res.status(200).json({
      success: true,
      data: {
        ...safeUser,
        orders,
      },
    });
  }
});

export const addAddress = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  if (getDbConnectionStatus()) {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found");

    if (req.body.isDefault) {
      user.addresses.forEach((a) => (a.isDefault = false));
    }

    user.addresses.push(req.body);
    await user.save();

    res.status(201).json({
      success: true,
      message: "Address saved",
      data: user.addresses,
    });
  } else {
    const user = memoryStore.users.find((u) => u._id.toString() === userId.toString());
    if (!user) throw new ApiError(404, "User not found");

    user.addresses = user.addresses || [];
    if (req.body.isDefault) {
      user.addresses.forEach((a) => (a.isDefault = false));
    }
    const newAddr = { _id: "addr_" + Date.now(), ...req.body };
    user.addresses.push(newAddr);

    res.status(201).json({
      success: true,
      message: "Address saved",
      data: user.addresses,
    });
  }
});

export const deleteAddress = asyncHandler(async (req, res) => {
  const { addressId } = req.params;
  const userId = req.user._id;

  if (getDbConnectionStatus()) {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found");

    user.addresses = user.addresses.filter((a) => a._id.toString() !== addressId.toString());
    await user.save();

    res.status(200).json({
      success: true,
      message: "Address removed",
      data: user.addresses,
    });
  } else {
    const user = memoryStore.users.find((u) => u._id.toString() === userId.toString());
    if (!user) throw new ApiError(404, "User not found");

    user.addresses = (user.addresses || []).filter((a) => a._id.toString() !== addressId.toString());

    res.status(200).json({
      success: true,
      message: "Address removed",
      data: user.addresses,
    });
  }
});

export const toggleWishlistItem = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  const userId = req.user._id;

  if (getDbConnectionStatus()) {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found");

    const index = user.wishlist.indexOf(productId);
    let added = false;
    if (index > -1) {
      user.wishlist.splice(index, 1);
    } else {
      user.wishlist.push(productId);
      added = true;
    }
    await user.save();

    res.status(200).json({
      success: true,
      message: added ? "Product added to wishlist" : "Product removed from wishlist",
      data: user.wishlist,
    });
  } else {
    const user = memoryStore.users.find((u) => u._id.toString() === userId.toString());
    if (!user) throw new ApiError(404, "User not found");

    user.wishlist = user.wishlist || [];
    const index = user.wishlist.indexOf(productId);
    let added = false;
    if (index > -1) {
      user.wishlist.splice(index, 1);
    } else {
      user.wishlist.push(productId);
      added = true;
    }

    res.status(200).json({
      success: true,
      message: added ? "Product added to wishlist" : "Product removed from wishlist",
      data: user.wishlist,
    });
  }
});
