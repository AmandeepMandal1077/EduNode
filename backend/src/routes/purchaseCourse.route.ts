import express from "express";
import {
  getCoursePurchaseStatus,
  getPurchasedCourses,
  handleStripeWebhook,
  initiateStripeCheckout,
  verifyStripeSession,
} from "../controllers/coursePurchase.controller.js";
import { authenticateUserMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router
  .route("/create-checkout-session")
  .post(authenticateUserMiddleware, initiateStripeCheckout);

router
  .route("/checkout/verify")
  .post(authenticateUserMiddleware, verifyStripeSession);

router
  .route("/course/:courseId/detail-with-status")
  .get(authenticateUserMiddleware, getCoursePurchaseStatus);

router.route("/").get(authenticateUserMiddleware, getPurchasedCourses);

export default router;
