import type { Server } from "http";
import mongoose from "mongoose";
import { server } from "../index.js";

export function gracefulShutdown(err: Error, errorMessage: string, server: Server) {
  console.log(errorMessage);
  console.log(`${err.name}: ${err.message}`);

  server.close(() => process.exit(1));
}

export function shutdown(signal: string) {
  console.log(`\n🚦Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    console.log("⛔HTTP server closed");

    try {
      await mongoose.connection.close();
      console.log("🧹Cleanup completed!💯");
      process.exit(0);
    } catch (err) {
      console.log("Abrupt server shutdown", err);
      process.exit(1);
    }
  });

  // Safety fallback (Render allows ~30s):
  setTimeout(() => {
    console.error("Force shutdown");
    process.exit(1);
  }, 30_000);
}
