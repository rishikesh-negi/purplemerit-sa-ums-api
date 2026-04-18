import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import hpp from "hpp";
import morgan from "morgan";
import { AppError } from "./errors/AppError.js";
import { globalErrorHandler } from "./middleware/globalErrorHandler.js";
import { sanitizeRequest } from "./middleware/sanitizeData.js";
import { userRouter } from "./routes/userRoutes.js";

const app = express();

const allowedOrigins = [
  "http://localhost:8000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://purplemerit-ums.vercel.app",
];

app.enable("trust-proxy");
app.use(
  cors({
    origin(origin, callback) {
      if (process.env["NODE_ENV"] === "development" && !origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin!) !== -1) return callback(null, true);
      else callback(new Error("Not allowed by the API's CORS policy"));
    },
    credentials: true,
  }),
);
app.use(helmet());

if (process.env["NODE_ENV"] === "development") app.use(morgan("dev"));

const limiter = rateLimit({
  limit: 120,
  windowMs: 60 * 60 * 1000,
  message: "You have been rate limited. Please try again after some time",
});
app.use("/api", limiter);
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));
app.use(cookieParser());
app.use(sanitizeRequest);

app.disable("x-powered-by");
app.use(
  hpp({
    whitelist: [],
  }),
);

app.use("/api/v1/users", userRouter);

app.all(/.*/, (req, _res, next) => {
  next(new AppError(`The requested resource ${req.originalUrl} does not exist`, 404));
});

app.use(globalErrorHandler);

export default app;
