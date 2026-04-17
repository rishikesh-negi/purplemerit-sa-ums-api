import mongoose from "mongoose";
import {
  BadRequestError,
  ForbiddenAccessError,
  UnauthorizedAccessError,
  UserNotFoundError,
} from "../errors/AppError.js";
import { User } from "../models/UserModel.js";
import { catchAsyncError } from "../utils/catchAsyncError.js";

export const getUsers = catchAsyncError(async (req, res) => {
  type QueryParams = { page?: string; limit?: string; search?: string };

  const { page: queryPage = 1, limit: queryLimit = 10, search = "" } = req.query as QueryParams;
  const userCount = await User.countDocuments({ active: true });
  const page = Number(queryPage);
  const limit = Number(queryLimit);
  let users;

  if (search !== "") {
    users = await User.aggregate([
      {
        $search: {
          index: "search-users",
          compound: {
            should: [
              {
                autocomplete: {
                  query: search,
                  path: "firstName",
                  score: { boost: { value: 4 } },
                },
              },
              {
                autocomplete: {
                  query: search,
                  path: "lastName",
                  score: { boost: { value: 4 } },
                },
              },
              {
                autocomplete: {
                  query: search,
                  path: "fullName",
                  score: { boost: { value: 3 } },
                },
              },
              {
                autocomplete: {
                  query: search,
                  path: "username",
                  score: { boost: { value: 2 } },
                },
              },
              {
                autocomplete: {
                  query: search,
                  path: "email",
                  score: { boost: { value: 1 } },
                },
              },
            ],
          },
        },
      },
      { $match: { active: true } },
      {
        $facet: {
          metadata: [{ $count: "userCount" }],
          data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
        },
      },
    ]);
  }

  if (search === "") {
    users = await User.find()
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
  }

  res.status(200).json({
    users,
    userCount: search !== "" ? users![0]?.metadata[0]?.userCount : userCount,
  });
});

export const createUser = catchAsyncError(async (req, res, next) => {
  const adminId = req.user?.id;
  if (!adminId) return next(new UnauthorizedAccessError());
  const { firstName, lastName, username, email, role, password } = req.body;
  const newUser = await User.create({
    firstName,
    lastName,
    username,
    email,
    role,
    createdBy: adminId,
    password,
  });
  newUser.createdBy = mongoose.Types.ObjectId.createFromHexString(adminId);
  newUser.save();
  return res.sendStatus(201);
});

export const updateUser = catchAsyncError(async (req, res, next) => {
  const targetUserId = req.params["userId"];
  const actionCreatorId = req.user!.id;
  const actionCreatorRole = req.user!.role;

  async function getUpdatedUserDoc(userId: string, updatedData: Record<string, unknown>) {
    const updatedUser = await User.findByIdAndUpdate(userId, updatedData, {
      new: true,
      runValidators: true,
    });

    return updatedUser;
  }

  if (actionCreatorRole === "admin" || actionCreatorId === targetUserId) {
    const updatedUser = (await getUpdatedUserDoc(targetUserId as string, req.body))!;
    if (actionCreatorRole === "admin" && actionCreatorId !== targetUserId) {
      updatedUser.updatedAt = new Date();
      updatedUser.updatedBy = mongoose.Types.ObjectId.createFromHexString(actionCreatorId);
      updatedUser.save();
    }
    return res.status(200).json({
      user: updatedUser,
    });
  }

  if (actionCreatorRole === "manager") {
    const { role: targetUserRole } = (await User.findById(targetUserId).select("role").lean()) as {
      role: "user" | "manager" | "admin";
    };
    if (!targetUserRole) return next(new BadRequestError());
    if (targetUserRole === "admin") return next(new ForbiddenAccessError());

    const updatedUser = (await getUpdatedUserDoc(targetUserId as string, req.body))!;

    if (actionCreatorId !== targetUserId) {
      updatedUser.updatedAt = new Date();
      updatedUser.updatedBy = mongoose.Types.ObjectId.createFromHexString(actionCreatorId);
      updatedUser.save();
    }

    return res.status(200).json({
      user: updatedUser,
    });
  }

  return next(new ForbiddenAccessError());
});

export const deleteUser = catchAsyncError(async (req, res, next) => {
  const targetUserId = req.params["userId"];
  const actionCreatorId = req.user?.id;
  const actionCreatorRole = req.user?.role;

  if (actionCreatorRole === "admin" || actionCreatorId === targetUserId) {
    const user = await User.findById(targetUserId);
    if (!user) return next(new UserNotFoundError());

    await user.updateOne({ active: false });
    return res.sendStatus(204);
  }

  return next(new ForbiddenAccessError());
});

export const getUser = catchAsyncError(async (req, res, next) => {
  const userId = req.params["userId"];
  const actionCreatorId = req.user!.id;
  const actionCreatorRole = req.user!.role;
  if (!userId) return next(new BadRequestError());

  if (
    actionCreatorRole === "admin" ||
    actionCreatorRole === "manager" ||
    actionCreatorId === userId
  ) {
    const user = await User.findById(userId).select("+createdAt +updatedAt");
    if (!user) return next(new UserNotFoundError());

    res.status(200).json({
      user,
    });
  }
});
