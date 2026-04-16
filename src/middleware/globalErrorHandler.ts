import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError.js";
import { transformError } from "../errors/transformError.js";
import { GENERIC_ERROR_MSG } from "../utils/constants.js";

export type SendErrorFunction = (err: Error | AppError, req: Request, res: Response) => void;

function sendErrorResponse(
  err: Error | AppError,
  res: Response,
  message: string = GENERIC_ERROR_MSG,
) {
  const status = err instanceof AppError ? err.status : "error";
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const reason = err instanceof AppError ? err.reason : null;

  return res.status(statusCode).json({
    status,
    ...(reason ? { reason } : {}),
    message,
  });
}

// -----> Function to send a detailed error response in development for debugging:
const sendErrorInDevelopment: SendErrorFunction = function (err, req, res) {
  // Sending a detailed error in response to an invalid/failed API request:
  if (req.originalUrl.startsWith("/api")) {
    const statusCode = err instanceof AppError ? err.statusCode : 500;
    const status = err instanceof AppError ? err.status : "error";
    const reason = err instanceof AppError ? err.reason : null;

    return res.status(statusCode).json({
      status,
      ...(reason ? { reason } : {}),
      message: err.message,
      error: err,
      stack: err.stack,
    });
  }

  // Sending an error response for non-API errors:
  return sendErrorResponse(err, res, err.message);
};

// -----> Function to send an error response in production:
const sendErrorInProduction: SendErrorFunction = function (err, req, res) {
  // Error response for invalid/failed API requests:
  if (req.originalUrl.startsWith("/api")) {
    // If operational error, send actual error message. If programming or unknown error, send a generic error message:
    const errorMessage = err instanceof AppError ? err.message : GENERIC_ERROR_MSG;
    return sendErrorResponse(err, res, errorMessage);
  }

  // Non-API error:
  if (err instanceof AppError) return sendErrorResponse(err, res, err.message);

  return sendErrorResponse(err, res, GENERIC_ERROR_MSG);
};

export function globalErrorHandler(
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (process.env["NODE_ENV"] === "development") {
    sendErrorInDevelopment(err, req, res);
  }

  if (process.env["NODE_ENV"] === "production") {
    // An operational error containing a 'reason' is intended to be sent as it is:
    const error = err.reason ? err : transformError(err);
    sendErrorInProduction(error, req, res);
  }
}
