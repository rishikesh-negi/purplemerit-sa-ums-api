import bcrypt from "bcryptjs";
import type { HydratedDocument } from "mongoose";
import { generateToken } from "../utils/generateToken.js";

type PasswordManagementProperties = {
  password: string;
  passwordChangedAt?: NativeDate | null;
};

export type PasswordManagementSchemaMethods<T extends PasswordManagementProperties> = {
  hashPasswordPreSave(this: HydratedDocument<T>): Promise<void>;

  setPasswordChangeTimestampPreSave(this: HydratedDocument<T>): Promise<void>;

  matchPasswords(candidatePassword: string, userPassword: string): Promise<boolean>;

  changedPasswordAfter(this: HydratedDocument<T>, JWTTimestamp: number): boolean;
};

// The HydratedDocument utility type is used to type a fetched mongoose document:
export async function hashPasswordPreSave<T extends PasswordManagementProperties>(
  this: HydratedDocument<T>,
): Promise<void> {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
}

export async function setPasswordChangeTimestampPreSave<T extends PasswordManagementProperties>(
  this: HydratedDocument<T>,
): Promise<void> {
  if (!this.isModified("password") || this.isNew) return;
  this.passwordChangedAt = new Date(Date.now() - 1000);
}

export async function matchPasswords(
  candidatePassword: string,
  userPassword: string,
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, userPassword);
}

export function changedPasswordAfter<T extends PasswordManagementProperties>(
  this: HydratedDocument<T>,
  jwtTimestamp: number,
): boolean {
  if (this.passwordChangedAt) {
    const passwordChangeTimestamp = Math.floor(this.passwordChangedAt.getTime() / 1000);
    return jwtTimestamp < passwordChangeTimestamp;
  }

  return false;
}
