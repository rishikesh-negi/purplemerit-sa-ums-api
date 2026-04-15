import mongoose from "mongoose";
import { User } from "../models/UserModel.js";
import { verifyAuthJWT } from "./jwt.js";

export async function checkSessionValidity(refreshToken: string): Promise<boolean> {
  const { id, ...decoded } = await verifyAuthJWT(refreshToken, "refresh");
  if (!id || !decoded.iat || !decoded.exp) return false;

  const userId = new mongoose.Types.ObjectId(id);
  const user = await User.findById(userId);

  // Possible token theft or reuse attack, so log the user out of all devices and try clearing the refresh token cookie on the client:
  if (!user) return false;

  if (Date.now() > decoded.exp * 1000) return false;

  if (user.changedPasswordAfter(decoded.iat)) return false;

  return true;
}
