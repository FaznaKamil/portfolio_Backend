import { config } from "./env.js";

export const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      config.clientUrl,
      "http://localhost:5173",
      "http://localhost:3000",
      "http://127.0.0.1:5173",
    ];
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Dev-friendly permissive for local inspection
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};
