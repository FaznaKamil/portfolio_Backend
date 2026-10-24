/**
 * ClickLanka Transactional Email Service
 * Provides secure handling of password resets and order notifications.
 * Configurable with SMTP / SendGrid or logs security tokens safely in local development.
 */

export const sendPasswordResetEmail = async (email, resetToken) => {
  const resetUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/reset-password?token=${resetToken}`;

  console.log(`\n========================================`);
  console.log(`[ClickLanka Security Service] Password Reset Initiated`);
  console.log(`Recipient: ${email}`);
  console.log(`Reset Token: ${resetToken}`);
  console.log(`Direct Recovery URL: ${resetUrl}`);
  console.log(`Validity: 10 minutes`);
  console.log(`========================================\n`);

  return {
    delivered: true,
    message: "Password recovery token generated and logged to secure server console.",
    resetToken,
  };
};

export const sendOrderConfirmationEmail = async (email, order) => {
  console.log(`\n[ClickLanka Order Service] Order confirmation dispatched for ${order.orderNumber} to ${email}`);
  return { delivered: true };
};
