import mongoose from "mongoose";
import { config } from "./env.js";

let isDbConnected = false;

export function getDbConnectionStatus() {
  return isDbConnected;
}

export async function connectDatabase() {
  const uri = config.mongodbUri;

  try {
    mongoose.set("strictQuery", false);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000,
    });
    isDbConnected = true;
    console.log("MongoDB connected successfully at:", uri);
  } catch (error) {
    isDbConnected = false;
    console.warn(`[ClickLanka Database] Notice: MongoDB connection failed (${error.message}). Running with resilient in-memory data store for testing and preview.`);
  }

  return isDbConnected;
}
