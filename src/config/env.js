import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "5000", 10),
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  mongodbUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/luxecart",
  jwtSecret: process.env.JWT_SECRET || "luxecart_default_jwt_secret_dev_key",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  nodeEnv: process.env.NODE_ENV || "development",
  admin: {
    name: process.env.ADMIN_NAME || "Administrator",
    email: process.env.ADMIN_EMAIL || "admin@luxecart.com",
    password: process.env.ADMIN_PASSWORD || "Admin123456!",
  },
};
