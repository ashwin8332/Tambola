import {
  createUser,
  loginUser,
  refreshToken,
  getUser,
  getInvites,
  changeRole,
  logoutSession,
} from "../controllers/user.controller.js";
import express from "express";
import authenticate, {
  authenticateOptimized,
} from "../middleware/auth.middleware.js";
import authorizeRoles from "../middleware/rbac.middleware.js";

const userRouter = express.Router();

userRouter.post("/register", createUser);
userRouter.post("/login", loginUser);
userRouter.post("/tokens", refreshToken);
userRouter.get("/me", authenticateOptimized, getUser);
userRouter.get("/get-invites", authenticateOptimized, getInvites);
userRouter.post("/change-role", authenticateOptimized, changeRole);
userRouter.post("/logout", authenticateOptimized, logoutSession);

export default userRouter;
