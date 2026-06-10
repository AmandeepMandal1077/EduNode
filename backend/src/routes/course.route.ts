import express from "express";
import {
  createNewCourse,
  searchCourses,
  getPublishedCourses,
  getMyCreatedCourses,
  updateCourseDetails,
  getCourseDetails,
  addLectureToCourse,
  getCourseLectures,
  announceMessage,
  getCourseAnnouncements,
  rateCourse,
} from "../controllers/course.controller.js";
import {
  authenticateUserMiddleware,
  restrictToInstructor,
} from "../middlewares/auth.middleware.js";
import { validator, SourceType } from "../middlewares/validator.middleware.js";
import { courseValidator } from "../validator/course.zod.js";
import { getPurchasedCourses } from "../controllers/coursePurchase.controller.js";

const router = express.Router();

// Public routes
router.get("/published", getPublishedCourses);
router.get("/search", searchCourses);

// Protected routes
router.use(authenticateUserMiddleware);

//Check course is purchased middleware can be added later here
// Course management
router
  .route("/")
  .post(
    validator(SourceType.BODY, courseValidator),
    createNewCourse,
  )
  .get(getMyCreatedCourses);

// Purchases courses
router
  .route("/purchased")
  .get(getPurchasedCourses);

// Course details and updates
router
  .route("/:courseId")
  .get(getCourseDetails)
  .patch(
    restrictToInstructor(),
    updateCourseDetails,
  );

//announce
router
  .route("/:courseId/announce")
  .post(restrictToInstructor(), announceMessage);

// announcements
router
  .route("/:courseId/announcements")
  .get(getCourseAnnouncements);

// rate course
router
  .route("/:courseId/rate")
  .post(rateCourse);

// Lecture management
router
  .route("/:courseId/lectures")
  .get(getCourseLectures)
  .post(restrictToInstructor(), addLectureToCourse);

export default router;
