import type { NextFunction, Response } from "express";
import mongoose from "mongoose";
import {
  AccessTokenExpiredError,
  EmailAlreadyExistsError,
  InvalidCredentialsError,
  InvalidSessionError,
  InvalidTokenError,
  NoAccessTokenError,
  PasswordChangedReloginError,
  UnauthorizedAccessError,
  UsernameTakenError,
  UserNotFoundError,
} from "../errors/AppError.js";
import { User, type UserDocument } from "../models/UserModel.js";
import type { AuthJWTPayload, RequestWithUser } from "../types/types.js";
import { authenticateUser } from "../utils/authenticateUser.js";
import { catchAsyncError } from "../utils/catchAsyncError.js";
import { checkSessionValidity } from "../utils/checkSessionValidity.js";
import { REFRESH_JWT_COOKIE_NAME } from "../utils/constants.js";
import { verifyAuthJWT } from "../utils/jwt.js";
import { removeClientRefreshTokenCookie } from "../utils/removeClientRefreshTokenCookie.js";

export const signup = catchAsyncError(async (req, res, next) => {
  const emailAlreadyExists = await User.findOne({ email: req.body.email }).setOptions({
    includeInactive: true,
  });
  if (emailAlreadyExists) return next(new EmailAlreadyExistsError());
  const usernameTaken = await User.findOne({ username: req.body.username }).setOptions({
    includeInactive: true,
  });
  if (usernameTaken) return next(new UsernameTakenError());

  const session = await mongoose.startSession();
  session.startTransaction();
  const newUser = (await User.create(req.body)) as UserDocument;
  await session.commitTransaction();

  const jwtPayload: AuthJWTPayload = { id: newUser.id };
  return authenticateUser({ req, res, jwtPayload, user: newUser, authAction: "signup" });
});

export const login = catchAsyncError(async (req, res, next) => {
  const refreshToken = req.cookies[REFRESH_JWT_COOKIE_NAME];

  if (refreshToken) {
    const sessionIsValid = await checkSessionValidity(refreshToken);
    if (!sessionIsValid) {
      removeClientRefreshTokenCookie(req, res);
      return next(new InvalidSessionError());
    }

    if (sessionIsValid) {
      const { id } = await verifyAuthJWT(refreshToken, "refresh");
      const userId = new mongoose.Types.ObjectId(id);
      const user = (await User.findById(userId)) as UserDocument;
      const jwtPayload: AuthJWTPayload = { id };
      return authenticateUser({ req, res, jwtPayload, user, authAction: "login" });
    }
  }

  const { email, username, password } = req.body;
  if (!(email || username) || !password) return next(new InvalidCredentialsError());

  const user = await User.findOne().or([{ email }, { username }]).select("+password");
  const passwordsMatched = await user?.matchPasswords(password, user.password || "");
  if (!user || !passwordsMatched) return next(new InvalidCredentialsError());

  const jwtPayload: AuthJWTPayload = { id: user.id };
  return await authenticateUser({ req, res, jwtPayload, user, authAction: "login" });
});

export const protect = catchAsyncError(async (req, res, next) => {
  const accessToken = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.split(" ")[1]
    : null;
  if (!accessToken) return next(new NoAccessTokenError());

  const { id, ...decoded } = await verifyAuthJWT(accessToken, "access");
  if (!id || !decoded.iat || !decoded.exp) return next(new InvalidTokenError());
  if (Date.now() > decoded.exp * 1000) return next(new AccessTokenExpiredError());

  const userId = new mongoose.Types.ObjectId(id);
  const sessionUser = (await User.findById(userId)) as UserDocument;
  if (!sessionUser) return next(new UserNotFoundError());
  if (sessionUser.changedPasswordAfter(decoded.iat)) return next(new PasswordChangedReloginError());

  req.user = sessionUser;
  next();
});

export const refreshSession = catchAsyncError(async (req, res, next) => {
  const refreshToken = req.cookies[REFRESH_JWT_COOKIE_NAME];
  if (!refreshToken) {
    res.redirect("/");
    return next(new UnauthorizedAccessError());
  }

  const { id, ...decoded } = await verifyAuthJWT(refreshToken, "refresh");
  if (!id || !decoded.iat || !decoded.exp) {
    res.redirect("/login");
    return next(new InvalidTokenError());
  }

  const userId = new mongoose.Types.ObjectId(id);
  const sessionUser = (await User.findById(userId)) as UserDocument;
  if (!sessionUser) return next(new UserNotFoundError());
  if (sessionUser.changedPasswordAfter(decoded.iat)) return next(new PasswordChangedReloginError());

  const jwtPayload: AuthJWTPayload = { id };
  return authenticateUser({ req, res, jwtPayload, user: sessionUser, authAction: "login" });
});

export const restrictTo = (...roles: string[]) => {
  return (req: RequestWithUser, _res: Response, next: NextFunction) => {
    if (!roles.includes(req.user?.role || "")) return next(new UnauthorizedAccessError());
    next();
  };
};

export const logout = catchAsyncError(async (req, res) => {
  const refreshToken = req.cookies[REFRESH_JWT_COOKIE_NAME];
  if (!refreshToken) return res.sendStatus(204);

  removeClientRefreshTokenCookie(req, res);
  return res.sendStatus(204);
});
