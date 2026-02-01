import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import userRouter from "./routes/user.route.js";
import gameRouter from "./routes/game.route.js";
import adminRouter from "./routes/admin.route.js";

dotenv.config();

const app = express();
app.use(express.json());

// for cors policy - allow multiple origins for development
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174"
];

app.use(cors({ 
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all origins in development
    }
  },
  credentials: true 
}));

// for cookies
app.use(cookieParser());

// Define routes
app.use("/api/user", userRouter);
app.use("/api/game", gameRouter);
app.use("/api/admin", adminRouter);

export default app;
