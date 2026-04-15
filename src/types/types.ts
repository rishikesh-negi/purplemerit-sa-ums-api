import type { NextFunction, Request, Response } from "express";
import type { UserDocument } from "../models/UserModel.js";
import type { JwtPayload } from "jsonwebtoken";

export interface RequestWithUser extends Request {
  user?: UserDocument;
}

export type Controller = (
  req: RequestWithUser,
  res: Response,
  next: NextFunction,
) => Promise<unknown | void>;

export type OptionsCreateSendAuthJWT = Required<{
  tokenType: "access" | "refresh";
  user: UserDocument;
  statusCode: number;
  req: Request<unknown>;
  res: Response;
  sendUserData?: boolean;
}>;

export interface AuthJWTPayload extends JwtPayload {
  id: string;
}
