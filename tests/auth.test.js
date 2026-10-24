import { test, describe } from "node:test";
import assert from "node:assert";
import request from "supertest";
import app from "../src/app.js";

describe("Authentication & Security API", () => {
  test("GET /api/health should return 200 operational status", async () => {
    const res = await request(app).get("/api/health");
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.message, "ClickLanka API is operational");
  });

  test("POST /api/auth/register should create a customer account", async () => {
    const uniqueEmail = `test_${Date.now()}@example.com`;
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Test Customer",
        email: uniqueEmail,
        password: "SecretPassword123!",
      });

    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.token);
    assert.strictEqual(res.body.data.user.role, "customer");
  });

  test("POST /api/auth/register should fail on invalid email or short password", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Invalid",
        email: "not-an-email",
        password: "123",
      });

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.success, false);
  });

  test("POST /api/auth/login should authenticate valid demo credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "admin@luxecart.com",
        password: "Admin123456!",
      });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.token);
    assert.strictEqual(res.body.data.user.role, "admin");
  });

  test("POST /api/auth/login should reject incorrect password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "admin@luxecart.com",
        password: "WrongPassword999!",
      });

    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.body.success, false);
  });

  test("Admin routes should reject unauthenticated requests with 401", async () => {
    const res = await request(app).get("/api/reports/dashboard");
    assert.strictEqual(res.statusCode, 401);
  });

  test("Admin routes should reject standard customer tokens with 403", async () => {
    // 1. Register a normal customer
    const resCust = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Regular Customer",
        email: `regular_${Date.now()}@test.com`,
        password: "CustomerPassword123!",
      });

    const token = resCust.body.data.token;

    // 2. Try to access admin reports
    const resAdmin = await request(app)
      .get("/api/reports/dashboard")
      .set("Authorization", `Bearer ${token}`);

    assert.strictEqual(resAdmin.statusCode, 403);
  });
});
