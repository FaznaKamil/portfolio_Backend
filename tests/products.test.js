import { test, describe } from "node:test";
import assert from "node:assert";
import request from "supertest";
import app from "../src/app.js";

describe("Products & Categories API", () => {
  test("GET /api/products should return product list with pagination", async () => {
    const res = await request(app).get("/api/products");
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.pagination);
    assert.strictEqual(typeof res.body.pagination.total, "number");
  });

  test("GET /api/products/:id with non-existent id should return 404", async () => {
    const res = await request(app).get("/api/products/non-existent-product-id-9999");
    assert.strictEqual(res.statusCode, 404);
    assert.strictEqual(res.body.success, false);
  });

  test("GET /api/products/featured should return featured luxury items", async () => {
    const res = await request(app).get("/api/products/featured");
    assert.strictEqual(res.statusCode, 200);
    assert.ok(Array.isArray(res.body.data));
    res.body.data.forEach((item) => {
      assert.strictEqual(item.isFeatured, true);
    });
  });

  test("GET /api/categories should return all active categories", async () => {
    const res = await request(app).get("/api/categories");
    assert.strictEqual(res.statusCode, 200);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length > 0);
    assert.ok(res.body.data[0].name);
    assert.ok(res.body.data[0].slug);
  });
});
