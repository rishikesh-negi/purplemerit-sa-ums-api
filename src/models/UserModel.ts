import { model, Query, Schema, type HydratedDocument, type InferSchemaType } from "mongoose";
import {
  emailAddressFormatValidator,
  partialNameValidator,
  passwordValidator,
  usernameValidator,
} from "../utils/stringValidators.js";
import {
  changedPasswordAfter,
  hashPasswordPreSave,
  matchPasswords,
  setPasswordChangeTimestampPreSave,
  type PasswordManagementSchemaMethods,
} from "../middleware/passwordManagementMiddleware.js";

const userSchema = new Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required for account creation"],
      trim: true,
      minLength: [2, "Please enter a valid first name"],
      maxLength: [40, "First name must not exceed 40 characters"],
      validate: { validator: partialNameValidator, message: "Please enter a valid first name" },
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      minlength: [2, "Invalid last name"],
      maxlength: [40, "Last name must not exceed 40 characters"],
      validate: { validator: partialNameValidator, message: "Please enter a valid last name" },
    },
    fullName: {
      type: String,
      default: function (): string {
        return `${this.firstName} ${this.lastName}`;
      },
    },
    username: {
      type: String,
      required: [true, "Username is required"],
      trim: true,
      unique: [true, "This username is taken. Try a different one"],
      index: true,
      minlength: [3, "Username must have at least 3 characters"],
      maxlength: [25, "Username length cannot exceed 25 characters"],
      validate: {
        validator: usernameValidator,
        message: "Only letters, numbers, and underscores allowed. Must contain at least one letter",
      },
    },
    email: {
      type: String,
      trim: true,
      required: [true, "A valid email address is required"],
      unique: [true, "An account with this email address already exists"],
      index: true,
      lowercase: true,
      validate: { validator: emailAddressFormatValidator, message: "Invalid email address" },
      maxLength: [50, "The email address cannot exceed 50 characters"],
      message: "Please provide a valid email address",
    },
    role: {
      type: String,
      enum: ["user", "manager", "admin"],
      default: "user",
    },
    password: {
      type: String,
      required: [true, "A valid password is required to secure your account"],
      select: false,
      validate: {
        validator: passwordValidator,
        message:
          "Password must contain minimum 8 characters, uppercase and lowercase letters, a number, and a special character",
      },
    },
    passwordChangedAt: Date,
    createdAt: { type: Date, default: new Date(Date.now()), select: false, immutable: true },
    updatedAt: { type: Date, default: null, select: false },
    createdBy: { type: Schema.ObjectId, ref: "Users", default: "self" },
    updatedBy: { type: Schema.ObjectId, ref: "Users", default: "self" },
    active: { type: Boolean, default: true, select: false },
  },
  { timestamps: true },
);

userSchema.pre("save", hashPasswordPreSave);
userSchema.pre("save", setPasswordChangeTimestampPreSave);

userSchema.pre(/^find/, async function (this: Query<unknown, IUser>) {
  if (this.getOptions()["includeInactive"]) return;
  this.where("active").ne(false);
});

userSchema.methods["matchPasswords"] = matchPasswords;
userSchema.methods["changedPasswordAfter"] = changedPasswordAfter;

export type IUserSchema = InferSchemaType<typeof userSchema>;
export type IUser = IUserSchema & PasswordManagementSchemaMethods<IUserSchema>;
export type UserDocument = HydratedDocument<IUser>;

export const User = model<IUser>("User", userSchema);
