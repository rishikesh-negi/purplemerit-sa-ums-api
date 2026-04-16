import { Router } from "express";
import { login, logout, protect, restrictTo, signup } from "../controllers/authController.js";
import { createUser, deleteUser, getUsers, updateUser } from "../controllers/userController.js";

export const userRouter = Router();

userRouter.post("/signup", signup);
userRouter.post("/login", login);

userRouter.use(protect);
userRouter.get("/logout", logout);
userRouter
  .route("/")
  .get(restrictTo("admin", "manager"), getUsers)
  .post(restrictTo("admin"), createUser);

userRouter.route("/:userId").patch(updateUser).delete(deleteUser);
