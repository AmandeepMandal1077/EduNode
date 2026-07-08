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
  getMyAnnouncements,
  rateCourse,
  getCourseCategories,
  getProcessingLectures,
} from "../controllers/course.controller.js";
import {
  authenticateUserMiddleware,
  restrictToInstructor,
} from "../middlewares/auth.middleware.js";
import { validator, SourceType } from "../middlewares/validator.middleware.js";
import { courseValidator, courseUpdateSchema } from "../validator/course.zod.js";
import { announcementSchema } from "../validator/announcement.zod.js";
import { ratingSchema } from "../validator/rating.zod.js";
import { getPurchasedCourses } from "../controllers/coursePurchase.controller.js";

const router = express.Router();

router.get("/published", getPublishedCourses);
router.get("/search", searchCourses);
router.get("/categories", getCourseCategories);

router.use(authenticateUserMiddleware);

router
  .route("/")
  .post(
    validator(SourceType.BODY, courseValidator),
    createNewCourse,
  )
  .get(getMyCreatedCourses);

router
  .route("/purchased")
  .get(getPurchasedCourses);

router
  .route("/my-announcements")
  .get(getMyAnnouncements);

router
  .route("/:courseId")
  .get(getCourseDetails)
  .patch(
    restrictToInstructor(),
    validator(SourceType.BODY, courseUpdateSchema),
    updateCourseDetails,
  );

router
  .route("/:courseId/announce")
  .post(
    restrictToInstructor(),
    validator(SourceType.BODY, announcementSchema),
    announceMessage,
  );

router
  .route("/:courseId/announcements")
  .get(getCourseAnnouncements);

router
  .route("/:courseId/rate")
  .post(
    validator(SourceType.BODY, ratingSchema),
    rateCourse,
  );

router
  .route("/:courseId/lectures/processing")
  .get(restrictToInstructor(), getProcessingLectures);

router
  .route("/:courseId/lectures")
  .get(getCourseLectures)
  .post(restrictToInstructor(), addLectureToCourse);

export default router;
