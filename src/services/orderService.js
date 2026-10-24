import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { Coupon } from "../models/Coupon.js";
import { ApiError } from "../utils/ApiError.js";
import { getDbConnectionStatus } from "../config/database.js";
import { memoryStore } from "./memoryStore.js";

export const createOrder = async ({ userId, items, shippingAddress, paymentMethod, couponCode }) => {
  if (!items || items.length === 0) {
    throw new ApiError(400, "Cannot create an empty order");
  }

  let verifiedItems = [];
  let itemsPrice = 0;

  if (getDbConnectionStatus()) {
    // 1. Validate items & stock from real DB
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product || !product.isActive) {
        throw new ApiError(404, `Product not found or unavailable: ${item.productId}`);
      }

      if (product.stock < item.quantity) {
        throw new ApiError(
          400,
          `Insufficient inventory for "${product.name}". Available: ${product.stock}, requested: ${item.quantity}`
        );
      }

      const itemTotal = product.price * item.quantity;
      itemsPrice += itemTotal;

      verifiedItems.push({
        product: product._id,
        title: product.name,
        price: product.price,
        quantity: item.quantity,
        image: product.images[0] || "",
      });
    }

    // 2. Validate Coupon on server
    let discountAmount = 0;
    let couponUsed = undefined;

    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase().trim(),
        isActive: true,
        expiryDate: { $gt: new Date() },
      });

      if (coupon) {
        if (itemsPrice >= coupon.minOrderAmount) {
          if (coupon.discountType === "percentage") {
            discountAmount = (itemsPrice * coupon.discountAmount) / 100;
          } else {
            discountAmount = Math.min(coupon.discountAmount, itemsPrice);
          }
          couponUsed = {
            code: coupon.code,
            discountAmount,
          };
          coupon.usedCount += 1;
          await coupon.save();
        }
      }
    }

    // 3. Shipping & Tax
    const shippingPrice = itemsPrice >= 500 ? 0 : 25;
    const taxPrice = Number(((itemsPrice - discountAmount) * 0.08).toFixed(2));
    const totalPrice = Number((itemsPrice - discountAmount + shippingPrice + taxPrice).toFixed(2));

    // 4. Atomic stock updates
    for (const item of items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity },
      });
    }

    // 5. Generate Order Number
    const orderNumber = `LUXE-${Math.floor(100000 + Math.random() * 900000)}`;

    const order = await Order.create({
      orderNumber,
      user: userId,
      items: verifiedItems,
      shippingAddress,
      paymentMethod: paymentMethod || "cod",
      paymentStatus: paymentMethod === "test_card" ? "paid" : "pending",
      orderStatus: "pending",
      itemsPrice,
      shippingPrice,
      taxPrice,
      discountAmount,
      totalPrice,
      couponUsed,
      trackingNumber: `TRK-${Math.floor(100000000 + Math.random() * 900000000)}US`,
      statusHistory: [
        {
          status: "pending",
          date: new Date(),
          note: paymentMethod === "test_card" ? "Authorized test payment processed successfully." : "Order placed with Cash on Delivery.",
        },
      ],
    });

    return order;
  } else {
    // In-memory atomic fallback
    for (const item of items) {
      const product = memoryStore.products.find(
        (p) => p._id.toString() === item.productId.toString()
      );
      if (!product || !product.isActive) {
        throw new ApiError(404, `Product not found or unavailable`);
      }

      if (product.stock < item.quantity) {
        throw new ApiError(
          400,
          `Insufficient inventory for "${product.name}". Available: ${product.stock}, requested: ${item.quantity}`
        );
      }

      const itemTotal = product.price * item.quantity;
      itemsPrice += itemTotal;

      verifiedItems.push({
        product: product._id,
        title: product.name,
        price: product.price,
        quantity: item.quantity,
        image: product.images[0] || "",
      });
    }

    let discountAmount = 0;
    let couponUsed = undefined;

    if (couponCode) {
      const coupon = memoryStore.coupons.find(
        (c) =>
          c.code.toUpperCase() === couponCode.toUpperCase().trim() &&
          c.isActive &&
          new Date(c.expiryDate) > new Date()
      );

      if (coupon && itemsPrice >= coupon.minOrderAmount) {
        if (coupon.discountType === "percentage") {
          discountAmount = (itemsPrice * coupon.discountAmount) / 100;
        } else {
          discountAmount = Math.min(coupon.discountAmount, itemsPrice);
        }
        couponUsed = {
          code: coupon.code,
          discountAmount,
        };
        coupon.usedCount += 1;
      }
    }

    const shippingPrice = itemsPrice >= 500 ? 0 : 25;
    const taxPrice = Number(((itemsPrice - discountAmount) * 0.08).toFixed(2));
    const totalPrice = Number((itemsPrice - discountAmount + shippingPrice + taxPrice).toFixed(2));

    // Deduct stock in memory
    for (const item of items) {
      const product = memoryStore.products.find(
        (p) => p._id.toString() === item.productId.toString()
      );
      if (product) {
        product.stock -= item.quantity;
      }
    }

    const orderNumber = `LUXE-${Math.floor(100000 + Math.random() * 900000)}`;

    const newOrder = {
      _id: "order_" + Date.now(),
      orderNumber,
      user: userId,
      items: verifiedItems,
      shippingAddress,
      paymentMethod: paymentMethod || "cod",
      paymentStatus: paymentMethod === "test_card" ? "paid" : "pending",
      orderStatus: "pending",
      itemsPrice,
      shippingPrice,
      taxPrice,
      discountAmount,
      totalPrice,
      couponUsed,
      trackingNumber: `TRK-${Math.floor(100000000 + Math.random() * 900000000)}US`,
      statusHistory: [
        {
          status: "pending",
          date: new Date(),
          note: paymentMethod === "test_card" ? "Authorized test payment processed successfully." : "Order placed with Cash on Delivery.",
        },
      ],
      createdAt: new Date(),
    };

    memoryStore.orders.unshift(newOrder);
    return newOrder;
  }
};

export const getCustomerOrders = async (userId) => {
  if (getDbConnectionStatus()) {
    return await Order.find({ user: userId }).sort({ createdAt: -1 });
  } else {
    return memoryStore.orders.filter(
      (o) => o.user.toString() === userId.toString()
    );
  }
};

export const getOrderById = async (orderId, requestingUser) => {
  let order;

  if (getDbConnectionStatus()) {
    order = await Order.findById(orderId).populate("user", "name email");
  } else {
    order = memoryStore.orders.find(
      (o) => o._id.toString() === orderId.toString() || o.orderNumber === orderId
    );
  }

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  // Security authorization: Ensure customer can only view their own orders
  const orderUserId = typeof order.user === "object" ? order.user._id.toString() : order.user.toString();
  if (requestingUser.role !== "admin" && orderUserId !== requestingUser._id.toString()) {
    throw new ApiError(403, "Access denied: You do not have permission to view this order");
  }

  return order;
};

export const getAllOrders = async ({ status, page = 1, limit = 20 }) => {
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.max(1, parseInt(limit, 10));
  const skip = (pageNum - 1) * limitNum;

  if (getDbConnectionStatus()) {
    const filter = status ? { orderStatus: status } : {};
    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("user", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Order.countDocuments(filter),
    ]);

    return {
      orders,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    };
  } else {
    let list = [...memoryStore.orders];
    if (status) {
      list = list.filter((o) => o.orderStatus === status);
    }
    const total = list.length;
    const paginated = list.slice(skip, skip + limitNum).map((o) => {
      const u = memoryStore.users.find((u) => u._id.toString() === o.user?.toString());
      return {
        ...o,
        user: u ? { _id: u._id, name: u.name, email: u.email } : o.user,
      };
    });

    return {
      orders: paginated,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    };
  }
};

export const updateOrderStatus = async (orderId, { orderStatus, note, trackingNumber }) => {
  const validTransitions = ["pending", "processing", "shipped", "delivered", "cancelled"];
  if (!validTransitions.includes(orderStatus)) {
    throw new ApiError(400, `Invalid order status. Permitted: ${validTransitions.join(", ")}`);
  }

  if (getDbConnectionStatus()) {
    const order = await Order.findById(orderId);
    if (!order) throw new ApiError(404, "Order not found");

    order.orderStatus = orderStatus;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (orderStatus === "delivered") order.paymentStatus = "paid";

    order.statusHistory.push({
      status: orderStatus,
      date: new Date(),
      note: note || `Order updated to ${orderStatus}`,
    });

    await order.save();
    return order;
  } else {
    const order = memoryStore.orders.find(
      (o) => o._id.toString() === orderId.toString() || o.orderNumber === orderId
    );
    if (!order) throw new ApiError(404, "Order not found");

    order.orderStatus = orderStatus;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (orderStatus === "delivered") order.paymentStatus = "paid";

    order.statusHistory = order.statusHistory || [];
    order.statusHistory.push({
      status: orderStatus,
      date: new Date(),
      note: note || `Order updated to ${orderStatus}`,
    });

    return order;
  }
};
