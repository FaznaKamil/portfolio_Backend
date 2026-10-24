/**
 * ClickLanka Payment Service
 * Supports Test Sandbox card simulation and Cash on Delivery.
 * Designed with adapter pattern for future Stripe / PayPal integration.
 */

export const processPayment = async ({ paymentMethod, amount, currency = "USD" }) => {
  if (paymentMethod === "cod") {
    return {
      success: true,
      transactionId: null,
      status: "pending",
      paymentMethod: "cod",
      message: "Order placed for Cash on Delivery. Payment collected upon receipt.",
    };
  }

  if (paymentMethod === "test_card") {
    return {
      success: true,
      transactionId: `txn_sim_${Date.now()}`,
      status: "paid",
      paymentMethod: "test_card",
      amount,
      currency,
      timestamp: new Date(),
      message: "Sandbox test payment authorized successfully.",
    };
  }

  throw new Error(`Unsupported payment method: ${paymentMethod}`);
};
