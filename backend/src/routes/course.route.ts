import express from "express";
import {
  createNewCourse,
  searchCourses,
  getPublishedCourses,
  getMyCreatedCourses,
  updateCourseDetails,
  getPublishedCourseDetails,
  getCourseDetails,
  addLectureToCourse,
  getPublishedCourseLectures,
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

router.get("/", authenticateUserMiddleware, getMyCreatedCourses);
router.get("/purchased", authenticateUserMiddleware, getPurchasedCourses);
router.get("/my-announcements", authenticateUserMiddleware, getMyAnnouncements);

// Published courses are public; drafts fall through to auth and the owner check.
router.get(
  "/:courseId",
  getPublishedCourseDetails,
  authenticateUserMiddleware,
  getCourseDetails,
);

router.get(
  "/:courseId/lectures",
  getPublishedCourseLectures,
  authenticateUserMiddleware,
  getCourseLectures,
);

router.use(authenticateUserMiddleware);

router
  .route("/")
  .post(
    validator(SourceType.BODY, courseValidator),
    createNewCourse,
  );

router.patch(
  "/:courseId",
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
  .post(restrictToInstructor(), addLectureToCourse);

export default router;
