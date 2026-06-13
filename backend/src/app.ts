import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import ExpressMongoSanitize from "express-mongo-sanitize";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import dotenv from "dotenv";
import morgan from "morgan";
import hpp from "hpp";
import cors from "cors";
import cookieParser from "cookie-parser";


import healthCheckRouter from "./routes/health.routes.js";
import userRouter from "./routes/user.route.js";
import stripePaymentRouter from "./routes/purchaseCourse.route.js";
import courseRouter from "./routes/course.route.js";
import lectureRouter from "./routes/lecture.route.js";
import mediaRouter from "./routes/media.route.js";
import emailRouter from "./routes/email.route.js";
import playbackRouter from "./routes/playback.route.js";
import courseProgressRouter from "./routes/courseProgress.route.js";
import commentRouter from "./routes/comment.route.js";


import "./cron/syncHeatmaps.js"

import type { ApiError } from "./utils/apiError.js";
import { handleStripeWebhook } from "./controllers/coursePurchase.controller.js";
import { handleCloudinaryWebhook } from "./controllers/media.controller.js";


dotenv.config();

const app = express();


if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}


app.use(hpp());
app.use(helmet());
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: "Too many requests from this IP, please try again after 15 minutes",
});
app.use("/api/v1/users/signin", authLimiter);
app.use("/api/v1/users/signup", authLimiter);
app.use("/api/v1/users/forgot-password", authLimiter);
app.use("/api/v1/users/reset-password", authLimiter);


app.post(
  "/api/v1/payments/webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook,
);
app.post(
  "/api/v1/media/webhook",
  express.raw({ type: "application/json" }),
  handleCloudinaryWebhook,
);

app.use(express.json({ limit: "20kb" }));

app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());


app.use((req, res, next) => {
  if (req.body) ExpressMongoSanitize.sanitize(req.body);
  if (req.params) ExpressMongoSanitize.sanitize(req.params);
  if (req.query) ExpressMongoSanitize.sanitize(req.query);
  next();
});


const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  methods: ["GET", "PUT", "POST", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};
app.use(cors(corsOptions));


app.use("/health", healthCheckRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/payments", stripePaymentRouter);
app.use("/api/v1/courses", courseRouter);
app.use("/api/v1/lecture", lectureRouter);
app.use("/api/v1/media", mediaRouter);
app.use("/api/v1/sendEmail", emailRouter);
app.use("/api/v1/playback", playbackRouter);
app.use("/api/v1/progress", courseProgressRouter);
app.use("/api/v1/comment", commentRouter);


app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({
    status: "error",
    message: "Page not found",
  });
});


app.use((err: ApiError, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: "error",
    message: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "production" ? "🔒" : err.stack,
  });
});

export default app;
