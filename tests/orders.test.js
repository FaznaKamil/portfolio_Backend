import { test, describe } from "node:test";
import assert from "node:assert";
import request from "supertest";
import app from "../src/app.js";

describe("Orders & Checkout Security API", () => {
  let customerToken;
  let customerId;
  let sampleProduct;

  test("Setup customer authentication", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "eleanor@example.com",
        password: "Customer123456!",
      });

    assert.strictEqual(res.statusCode, 200);
    customerToken = res.body.data.token;
    customerId = res.body.data.user._id;

    // Get a sample product
    const prodRes = await request(app).get("/api/products");
    sampleProduct = prodRes.body.data[0];
    assert.ok(sampleProduct);
  });

  test("POST /api/orders should calculate order totals, tax, and shipping on the server", async () => {
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        items: [{ productId: sampleProduct._id, quantity: 1 }],
        shippingAddress: {
          fullName: "Eleanor Vance",
          street: "128 Beacon St",
          city: "Boston",
          state: "MA",
          postalCode: "02116",
          country: "United States",
          phone: "617-555-8321",
        },
        paymentMethod: "cod",
      });

    assert.strictEqual(res.statusCode, 201);
    const order = res.body.data;
    assert.strictEqual(order.itemsPrice, sampleProduct.price);
    // Shipping is free for orders >= 500, else 25
    const expectedShipping = sampleProduct.price >= 500 ? 0 : 25;
    assert.strictEqual(order.shippingPrice, expectedShipping);
    // Server-side tax at 8%
    const expectedTax = Number((sampleProduct.price * 0.08).toFixed(2));
    assert.strictEqual(order.taxPrice, expectedTax);
    // Server-side total
    assert.strictEqual(order.totalPrice, Number((sampleProduct.price + expectedShipping + expectedTax).toFixed(2)));
  });

  test("POST /api/orders should reject orders requesting more than available stock", async () => {
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        items: [{ productId: sampleProduct._id, quantity: 999999 }],
        shippingAddress: {
          fullName: "Eleanor Vance",
          street: "128 Beacon St",
          city: "Boston",
          state: "MA",
          postalCode: "02116",
          phone: "617-555-8321",
        },
        paymentMethod: "cod",
      });

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /Insufficient inventory/i);
  });

  test("POST /api/contact should validate message inputs", async () => {
    const resInvalid = await request(app)
      .post("/api/contact")
      .send({
        name: "A",
        email: "not-an-email",
        subject: "Hi",
        message: "Short",
      });

    assert.strictEqual(resInvalid.statusCode, 400);

    const resValid = await request(app)
      .post("/api/contact")
      .send({
        name: "Audrey Hepburn",
        email: "audrey@example.com",
        subject: "Concierge Diamond Inquiry",
        message: "Inquiring about personal consultation appointments in New York.",
      });

    assert.strictEqual(resValid.statusCode, 201);
    assert.strictEqual(resValid.body.success, true);
  });
});
