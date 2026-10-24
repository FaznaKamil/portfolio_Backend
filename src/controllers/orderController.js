import { asyncHandler } from "../utils/asyncHandler.js";
import * as orderService from "../services/orderService.js";
import * as emailService from "../services/emailService.js";

export const createOrder = asyncHandler(async (req, res) => {
  const { items, shippingAddress, paymentMethod, couponCode } = req.body;
  const order = await orderService.createOrder({
    userId: req.user._id,
    items,
    shippingAddress,
    paymentMethod,
    couponCode,
  });

  await emailService.sendOrderConfirmationEmail(req.user.email, order);

  res.status(201).json({
    success: true,
    message: "Order placed successfully",
    data: order,
  });
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await orderService.getCustomerOrders(req.user._id);
  res.status(200).json({
    success: true,
    data: orders,
  });
});

export const getOrderById = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderById(req.params.id, req.user);
  res.status(200).json({
    success: true,
    data: order,
  });
});

export const getAllOrders = asyncHandler(async (req, res) => {
  const { status, page, limit } = req.query;
  const result = await orderService.getAllOrders({ status, page, limit });
  res.status(200).json({
    success: true,
    data: result.orders,
    pagination: result.pagination,
  });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await orderService.updateOrderStatus(req.params.id, req.body);
  res.status(200).json({
    success: true,
    message: `Order status updated to ${order.orderStatus}`,
    data: order,
  });
});
