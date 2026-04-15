import type { Request, Response } from "express";
import { REFRESH_JWT_COOKIE_NAME } from "./constants.js";

export const removeClientRefreshTokenCookie = (req: Request, res: Response) => {
  res.clearCookie(REFRESH_JWT_COOKIE_NAME, {
    httpOnly: true,
    secure: req.secure || req.headers["x-forwarded-proto"] === "https",
    sameSite: "strict",
  });
};
