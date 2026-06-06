import express from "express";
import {
  authenticateUser,
  changeUserPassword,
  createUserAccount,
  deleteUserAccount,
  forgotPassword,
  getCurrentUserProfile,
  resetPassword,
  signOutUser,
  updateUserProfile,
} from "../controllers/user.controller.js";

import upload from "../utils/multer.js";
import { authenticateUserMiddleware } from "../middlewares/auth.middleware.js";
import { SourceType, validator } from "../middlewares/validator.middleware.js";
import {
  changePasswordValidator,
  signinValidator,
  signupValidator,
} from "../validator/user.zod.js";

const router = express.Router();

// Auth routes
router.post(
  "/signup",
  validator(SourceType.BODY, signupValidator),
  createUserAccount,
);
router.post(
  "/signin",
  validator(SourceType.BODY, signinValidator),
  authenticateUser,
);
router.post("/signout", signOutUser);

// Profile routes
router.get("/profile", authenticateUserMiddleware, getCurrentUserProfile);
router.patch(
  "/profile",
  authenticateUserMiddleware,
  upload.single("avatar"),
  updateUserProfile,
);

// Password management
router.patch(
  "/change-password",
  authenticateUserMiddleware,
  validator(SourceType.BODY, changePasswordValidator),
  changeUserPassword,
);
router.post("/forgot-password", authenticateUserMiddleware, forgotPassword);
router.post("/reset-password", authenticateUserMiddleware, resetPassword);

// Account management
router.delete("/account", authenticateUserMiddleware, deleteUserAccount);

export default router;
