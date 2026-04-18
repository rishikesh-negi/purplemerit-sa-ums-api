import type { Request, Response } from "express";
import type { UserDocument } from "../models/UserModel.js";
import type { AuthJWTPayload } from "../types/types.js";
import { REFRESH_JWT_COOKIE_NAME } from "./constants.js";
import { createAccessToken, createRefreshToken } from "./jwt.js";

export type AuthCreatorFunctionParams = {
  req: Request;
  res: Response;
  jwtPayload: AuthJWTPayload;
  user: UserDocument;
  authAction: "signup" | "login";
};

export async function authenticateUser(authParams: AuthCreatorFunctionParams) {
  const { req, res, jwtPayload, user, authAction } = authParams;

  const { refreshToken, refreshTokenExpiry } = createRefreshToken(jwtPayload);
  const { accessToken, accessTokenExpiry } = createAccessToken(jwtPayload);
  const resStatusCode = authAction === "login" ? 200 : 201;

  res.cookie(REFRESH_JWT_COOKIE_NAME, refreshToken, {
    expires: refreshTokenExpiry,
    secure:
      process.env["NODE_ENV"] === "development"
        ? false
        : req.secure || req.headers["x-forwarded-proto"] === "https",
    httpOnly: true,
    sameSite: process.env["NODE_ENV"] === "development" ? "lax" : "strict",
  });

  const userData: Record<string, unknown> = {};
  const userObject: Record<string, unknown> = user.toObject();
  for (const key in userObject) {
    if (key === "password" || key === "passwordChangedAt" || key === "active") continue;
    userData[key] = userObject[key];
  }

  res.status(resStatusCode).json({
    message: "success",
    user: userData,
    accessToken,
    tokenExpiresAt: accessTokenExpiry,
  });
}
