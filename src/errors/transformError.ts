import { MongoServerError } from "mongodb";
import mongoose from "mongoose";

import { AppError, BadRequestError, NotFoundError } from "./AppError.js";

export const transformError = (err: Error): Error => {
  if (err instanceof mongoose.Error.CastError)
    return new BadRequestError(`Invalid ${err.path}: ${err.value}`);

  if (err instanceof mongoose.Error.ValidationError) {
    const messages = Object.values(err.errors).map((er) => {
      if ("message" in er) return er.message;
      return;
    });
    return new BadRequestError(`Invalid input data. ${messages.join(", \n")}`);
  }

  if (err instanceof mongoose.Error.DocumentNotFoundError)
    return new NotFoundError("No document matching that query was found");

  // Common MongoDB errors:
  if (err instanceof MongoServerError) {
    // DuplicateKeyError:
    if (err.code === 11000) {
      const field = Object.keys(err["keyValue"])[0]!;
      const value = err["keyValue"][field];
      const message = `Unique value expteced: '${value}' already exists in '${field}'`;
      return new AppError(message, 409);
    }
  }

  if (err.name === "JsonWebTokenError")
    return new AppError("Invalid token. Please log in again", 401);

  if (err.name === "TokenExpiredError")
    return new AppError("Session expired. Please log in again", 401);

  return err;
};
