import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), "config.env") });

import mongoose from "mongoose";
import path from "path";
import app from "./app.js";
import { gracefulShutdown, shutdown } from "./utils/gracefulShutdown.js";

process.on("uncaughtException", (err) => {
  console.log("🔴 Unhandled exception encountered! Shutting down...");
  console.log(`${err.name}: ${err.message}`);
});

const DB = process.env["DATABASE"]?.replace("<DB_PASSWORD>", process.env["DB_PASSWORD"]!);

mongoose
  .connect(DB!)
  .then(
    () => process.env["NODE_ENV"] === "development" && console.log("DB successfully connected"),
  );
const PORT: number = +process.env["PORT"]! || 8000;

export const server = app.listen(
  PORT,
  "0.0.0.0",
  () => process.env["NODE_ENV"] === "development" && console.log(`App running on port ${PORT}`),
);

process.on("unhandledRejection", (err: Error) => {
  gracefulShutdown(err, `🔴 Unhandled rejection encountered! Shutting down...`, server);
});

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
