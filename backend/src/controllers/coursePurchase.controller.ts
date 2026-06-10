import mongoose from "mongoose";
import {
  CoursePurchase,
  PaymentStatus,
} from "../models/coursePurchase.model.js";

import type { AuthenticatedRequest } from "../types/user.js";
import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asynchandler.js";
import { Course } from "../models/course.model.js";
import Stripe from "stripe";
import { User } from "../models/user.model.js";
import { CourseProgress } from "../models/courseProgress.model.js";
import { ApiError } from "../utils/apiError.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

/**
 * Create a Stripe checkout session for course purchase
 * @route POST /api/v1/payments/create-checkout-session
 */
export const initiateStripeCheckout = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;
    const { courseId } = req.body;
    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
      throw new ApiError("Invalid course id", 400);
    }
    const user = await User.findById(new mongoose.Types.ObjectId(userId));
    if (!user) {
      throw new ApiError("User not found", 404);
    }
    const course = await Course.findById(new mongoose.Types.ObjectId(courseId));
    if (!course) {
      throw new ApiError("Course not found", 404);
    }

    const existingPurchase = await CoursePurchase.findOne({
      user: userId,
      course: courseId,
    });

    if (existingPurchase?.status === PaymentStatus.COMPLETED) {
      throw new ApiError("Course already purchased", 400);
    }

    let courseOrder = existingPurchase;
    if (!courseOrder) {
      courseOrder = await CoursePurchase.create({
        course: courseId,
        user: userId,
        amount: course.price,
        currency: "inr",
        status: PaymentStatus.PENDING,
        paymentMethod: "card",
        paymentId: "not available",
      });
    } else {
      courseOrder.amount = course.price;
    }

    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      mode: "payment",
      payment_method_types: ["card"],
      success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
      line_items: [
        {
          price_data: {
            currency: "inr",
            unit_amount: course.price * 100, //paise
            product_data: {
              name: course.title,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        courseOrderId: courseOrder._id.toString(),
        userId: userId?.toString(),
        courseId: courseId.toString(),
      },
      payment_intent_data: {
        metadata: {
          courseOrderId: courseOrder._id.toString(),
          userId: userId?.toString(),
          courseId: courseId.toString(),
        },
      },
    });

    await courseOrder.save();

    res.status(200).json({
      success: true,
      message: "Checkout session created successfully",
      data: {
        url: session.url,
      },
    });
  },
);

/**
 * Verify Stripe session
 * @route POST /api/v1/payments/verify-session
 */
export const verifyStripeSession = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { session_id } = req.query;

    if (!session_id || typeof session_id !== "string") {
      throw new ApiError("Session id is required", 400);
    }

    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (!session) {
      throw new ApiError("Session not found", 404);
    }

    if (session.metadata?.userId !== req.userId) {
      throw new ApiError("Session does not belong to the user", 403);
    }

    const { courseOrderId } = session.metadata || {};
    if (!courseOrderId || !mongoose.Types.ObjectId.isValid(courseOrderId)) {
      throw new ApiError("Invalid or missing course order ID in metadata", 400);
    }

    const coursePurchase = await CoursePurchase.findById(
      new mongoose.Types.ObjectId(courseOrderId),
    ).populate("course");

    if (!coursePurchase) {
      throw new ApiError("Course order not found", 404);
    }

    if (coursePurchase.amount * 100 !== session.amount_total) {
      throw new ApiError("Course amount does not match", 400);
    }

    res.status(200).json({
      success: true,
      message: "Session verified successfully",
      data: {
        paid: session.payment_status === "paid",
        purchase: coursePurchase,
      },
    });
  },
);

/**
 * Handle Stripe webhook events
 * @route POST /api/v1/payments/webhook
 */
export const handleStripeWebhook = asyncHandler(
  async (req: Request, res: Response) => {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;
    const sig = req.headers["stripe-signature"] as string;
    if (!sig) {
      throw new ApiError("Webhook signature is required", 400);
    }

    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        req.body,
        sig,
        webhookSecret,
      );
    } catch (err: any) {
      console.error("Invalid webhook signature:", err.message);
      return res.status(400).send();
    }

    const eventType = event.type;

    if (
      eventType === "checkout.session.completed" ||
      eventType === "checkout.session.async_payment_succeeded"
    ) {
      const session = event.data.object as Stripe.Checkout.Session;
      const courseOrderId = session.metadata?.courseOrderId;

      if (!courseOrderId) return res.status(200).send();

      const courseOrder = await CoursePurchase.findById(
        new mongoose.Types.ObjectId(courseOrderId),
      );
      if (!courseOrder) return res.status(200).send();

      if (courseOrder.status === PaymentStatus.COMPLETED) {
        return res.status(200).send();
      }

      if (
        courseOrder.amount * 100 !== session.amount_total ||
        courseOrder.currency.toLowerCase() !==
        session.currency?.toLowerCase() ||
        session.payment_status !== "paid" ||
        courseOrder.user.toString() !== session.metadata?.userId ||
        courseOrder.course.toString() !== session.metadata?.courseId ||
        !session.payment_intent
      ) {
        courseOrder.status = PaymentStatus.FAILED;
      } else {
        const course = await Course.findById(courseOrder.course);
        if (course) {
          const isStudentEnrolled = course.enrolledStudents.some(
            (s) => s.student.toString() === courseOrder.user.toString(),
          );
          if (!isStudentEnrolled) {
            course.enrolledStudents.push({
              student: new mongoose.Types.ObjectId(courseOrder.user.toString()),
            });
            await course.save();
          }
        }

        const user = await User.findById(courseOrder.user);
        if (user) {
          const isCourseEnrolled = user.enrolledCourses?.some(
            (item) => item.course.toString() === courseOrder.course.toString(),
          );
          if (!isCourseEnrolled) {
            user.enrolledCourses?.push({
              course: new mongoose.Types.ObjectId(courseOrder.course.toString()),
            });
            await user.save();
          }
        }

        // Idempotently create CourseProgress record
        const existingProgress = await CourseProgress.findOne({
          user: courseOrder.user,
          course: courseOrder.course,
        });

        if (!existingProgress && course) {
          const lectures = course.lectures || [];
          const lectureProgressEntries = lectures.map((lectureId: any) => ({
            lecture: lectureId,
            userId: courseOrder.user,
            isCompleted: false,
            lastWatchedPosition: 0,
            lastWatched: new Date(),
          }));

          await CourseProgress.create({
            user: courseOrder.user,
            course: courseOrder.course,
            isCompleted: false,
            completionPercentage: 0,
            lectureProgress: lectureProgressEntries,
          });
        }

        courseOrder.paymentId = session.payment_intent as string;
        courseOrder.status = PaymentStatus.COMPLETED;
      }

      await courseOrder.save();
    } else if (
      eventType === "checkout.session.async_payment_failed" ||
      eventType === "checkout.session.expired"
    ) {
      const session = event.data.object as Stripe.Checkout.Session;
      const courseOrderId = session.metadata?.courseOrderId;

      if (!courseOrderId) return res.status(200).send();

      const courseOrder = await CoursePurchase.findById(
        new mongoose.Types.ObjectId(courseOrderId),
      );
      if (!courseOrder) return res.status(200).send();
      courseOrder.status = PaymentStatus.FAILED;
      if (session.payment_intent) {
        courseOrder.paymentId = session.payment_intent as string;
      }
      await courseOrder.save();
    }

    res.status(200).json({ received: true });
  },
);

/**
 * Get course details with purchase status
 * @route GET /api/v1/payments/courses/:courseId/purchase-status
 */
export const getCoursePurchaseStatus = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;
    const courseId = req.params.courseId;

    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
      throw new ApiError("Invalid course id", 400);
    }

    const coursePurchase = await CoursePurchase.findOne({
      user: new mongoose.Types.ObjectId(userId),
      course: new mongoose.Types.ObjectId(courseId),
    }).select("status");

    if (!coursePurchase) {
      throw new ApiError("Course not purchased", 404);
    }

    res.status(200).json({
      success: true,
      message: "Course purchase status fetched successfully",
      data: {
        status: coursePurchase.status,
      },
    });
  },
);

/**
 * Get all purchased courses
 * @route GET /api/v1/payments/purchased-courses
 */
export const getPurchasedCourses = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;

    // const purchasedCoursesIds = await CoursePurchase.find({
    //   user: new mongoose.Types.ObjectId(userId),
    //   status: PaymentStatus.COMPLETED,
    // }).select("course -_id");

    // const courseIds = purchasedCoursesIds.map((course) => course.course);
    // const purchasedCourses = await Course.find({
    //   _id: { $in: courseIds },
    // });

    const userWithCourses = await User.findById(
      new mongoose.Types.ObjectId(userId),
    )
      .populate({
        path: "enrolledCourses.course",
      })
      .select("enrolledCourses");

    const courses = userWithCourses?.enrolledCourses
      ?.map((item) => item.course)
      .filter((course) => course != null) || [];

    res.status(200).json({
      success: true,
      message: "purchased courses fetched successfully",
      data: courses,
    });
  },
);

/**
 * Get purchase history for the user
 * @route GET /api/v1/payments/
 */
export const getPurchaseHistory = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;

    const purchases = await CoursePurchase.find({
      user: new mongoose.Types.ObjectId(userId),
    }).populate("course");

    res.status(200).json({
      success: true,
      message: "Purchase history fetched successfully",
      data: { purchases },
    });
  },
);

