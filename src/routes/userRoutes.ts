import { Router } from "express";
import {
  login,
  logout,
  protect,
  refreshSession,
  restrictTo,
  signup,
} from "../controllers/authController.js";
import { createUser, deleteUser, getUsers, updateUser } from "../controllers/userController.js";

export const userRouter = Router();

userRouter.post("/signup", signup);
userRouter.post("/login", login);
userRouter.get("/refresh-session", refreshSession);
userRouter.get("/logout", logout);

userRouter.use(protect);
userRouter
  .route("/")
  .get(restrictTo("admin", "manager"), getUsers)
  .post(restrictTo("admin"), createUser);

userRouter.route("/:userId").patch(updateUser).delete(deleteUser);
