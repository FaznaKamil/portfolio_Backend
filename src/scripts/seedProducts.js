import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../config/database.js";
import { Category } from "../models/Category.js";
import { Product } from "../models/Product.js";
import { Coupon } from "../models/Coupon.js";
import { User } from "../models/User.js";
import {
  initialCategories,
  initialProducts,
  initialCoupons,
  initialUsers,
} from "../services/memoryStore.js";

async function seed() {
  console.log("Starting ClickLanka Database Seeding...");
  const connected = await connectDatabase();

  if (!connected) {
    console.log("Database not available locally. In-memory data store is loaded automatically at runtime.");
    process.exit(0);
  }

  try {
    // 1. Clear existing items
    await Category.deleteMany({});
    await Product.deleteMany({});
    await Coupon.deleteMany({});

    console.log("Cleared collections.");

    // 2. Insert Categories
    const createdCategories = await Category.insertMany(initialCategories);
    console.log(`Seeded ${createdCategories.length} categories.`);

    // 3. Map category IDs
    const categoryMap = {};
    createdCategories.forEach((cat) => {
      categoryMap[cat.slug] = cat._id;
    });

    // 4. Insert Products with correct category references
    const productsToInsert = initialProducts.map((p) => {
      const origCat = initialCategories.find((c) => c._id === p.category);
      const catSlug = origCat ? origCat.slug : initialCategories[0].slug;
      return {
        ...p,
        category: categoryMap[catSlug] || createdCategories[0]._id,
      };
    });

    const createdProducts = await Product.insertMany(productsToInsert);
    console.log(`Seeded ${createdProducts.length} luxury products.`);

    // 5. Seed Coupons
    await Coupon.insertMany(initialCoupons);
    console.log(`Seeded ${initialCoupons.length} promotional coupons.`);

    // 6. Ensure default admin and customer user
    for (const u of initialUsers) {
      const exists = await User.findOne({ email: u.email });
      if (!exists) {
        await User.create(u);
        console.log(`Created default user: ${u.email} (${u.role})`);
      }
    }

    console.log("Seeding completed successfully!");
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
}

seed();
