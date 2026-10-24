import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "../config/database.js";
import { User } from "../models/User.js";
import { config } from "../config/env.js";

async function createAdmin() {
  const adminName = config.admin.name;
  const adminEmail = config.admin.email;
  const adminPassword = config.admin.password;

  if (!adminEmail || !adminPassword) {
    console.error("ADMIN_EMAIL and ADMIN_PASSWORD must be set in environment variables.");
    process.exit(1);
  }

  console.log(`Ensuring administrator account: ${adminEmail}`);

  const connected = await connectDatabase();
  if (!connected) {
    console.log("MongoDB is not active locally. The in-memory store already pre-configures this admin account.");
    process.exit(0);
  }

  try {
    const existing = await User.findOne({ email: adminEmail.toLowerCase().trim() });
    if (existing) {
      existing.role = "admin";
      existing.name = adminName;
      existing.password = adminPassword; // Triggers pre('save') hash
      await existing.save();
      console.log(`Updated existing user ${adminEmail} to administrator role.`);
    } else {
      await User.create({
        name: adminName,
        email: adminEmail.toLowerCase().trim(),
        password: adminPassword,
        role: "admin",
      });
      console.log(`Successfully created administrator account for ${adminEmail}`);
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Error creating admin account:", error);
    process.exit(1);
  }
}

createAdmin();
