import express from "express";
import {
  getCoursePurchaseStatus,
  getPurchaseHistory,
  handleStripeWebhook,
  initiateStripeCheckout,
  verifyStripeSession,
  getMyEnrollments,
  enrollFreeCourse,
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

router.route("/").get(authenticateUserMiddleware, getPurchaseHistory);

router.route("/my-enrollments").get(authenticateUserMiddleware, getMyEnrollments);

router.route("/enroll-free").post(authenticateUserMiddleware, enrollFreeCourse);


export default router;
