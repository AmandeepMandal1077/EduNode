import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../types/user.js";
import mongoose from "mongoose";

import { asyncHandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/apiError.js";

import { Course, CourseLevel } from "../models/course.model.js";
import { EUploadStatus, Lecture } from "../models/lecture.model.js";
import {
  getPublishedCoursesFromCache,
  savePublishedCoursesToCache,
  invalidatePublishedCoursesInCache,
} from "../cache/courses-cache.js";
import { Announcement } from "../models/announcement.model.js";
import { CoursePurchase } from "../models/coursePurchase.model.js";
import { addLectureUploadJob } from "../queue/lecture-upload.queue.js";
import { verifyUploadSignature } from "../utils/cloudinary.js";

/**
 * @desc Creates a new course under the authenticated instructor's account.
 * @input {AuthenticatedRequest} req - The Express request object containing course details.
 * @input {Response} res - The Express response object.
 * @output {Promise<void>} Sends a JSON response with the created course data.
 */
export const createNewCourse = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const {
      title,
      subtitle,
      description,
      category,
      level = CourseLevel.BEGINNER,
      price,
      thumbnail,
    } = req.body;
    const alreadyExist = await Course.findOne({
      slug: title.trim().toLowerCase().replace(/ /g, "-"),
    });
    if (alreadyExist) {
      throw new ApiError("Course already exists", 400);
    }

    const course = await Course.create({
      title,
      subtitle,
      description,
      category,
      level,
      price,
      thumbnail,
      instructor: new mongoose.Types.ObjectId(req.userId),
    });

    await invalidatePublishedCoursesInCache();

    return res.status(201).json({
      success: true,
      message: "Course created successfully",
      data: { course },
    });
  },
);

/**
 * @desc Searches published courses using a text search string.
 * @input {Request} req - The Express request object containing the searchString query parameter.
 * @input {Response} res - The Express response object.
 * @output {Promise<void>} Sends a JSON response with matching courses.
 */
export const searchCourses = asyncHandler(
  async (req: Request, res: Response) => {
    const searchString = req.query.searchString as string;
    if (!searchString || searchString.trim() === "") {
      throw new ApiError("Search string is required", 400);
    }

    const courses = await Course.find({
      isPublished: true,
      $text: { $search: searchString },
    })
      .select(
        "title subtitle description category level price thumbnail instructor slug totalDuration totalLectures enrolledStudents",
      )
      .populate("instructor", "name bio avatar")
      .sort({ score: { $meta: "textScore" } })
      .limit(50);

    return res.status(200).json({
      success: true,
      message: "Courses fetched successfully",
      data: { courses },
    });
  },
);

/**
 * @desc Fetches all published courses, utilizing a cache for performance.
 * @input {Request} _ - The Express request object.
 * @input {Response} res - The Express response object.
 * @output {Promise<void>} Sends a JSON response with the published courses.
 */
export const getPublishedCourses = asyncHandler(
  async (_: Request, res: Response) => {
    let courses = await getPublishedCoursesFromCache();
    if (!courses) {
      courses = await Course.find({ isPublished: true }).populate("instructor", "name bio avatar");
      await savePublishedCoursesToCache(courses);
    }

    return res.status(200).json({
      success: true,
      message: "Published courses fetched successfully",
      data: { courses },
    });
  },
);

/**
 * @desc Retrieves all unique categories from published courses.
 * @input {Request} _ - The Express request object.
 * @input {Response} res - The Express response object.
 * @output {Promise<void>} Sends a JSON response with an array of sorted category strings.
 */
export const getCourseCategories = asyncHandler(
  async (_: Request, res: Response) => {
    const categories = await Course.distinct("category", { isPublished: true });

    return res.status(200).json({
      success: true,
      message: "Categories fetched successfully",
      data: { categories: categories.sort() },
    });
  },
);

/**
 * @desc Fetches all courses created by the authenticated instructor.
 * @input {AuthenticatedRequest} req - The Express request object containing the user ID.
 * @input {Response} res - The Express response object.
 * @output {Promise<void>} Sends a JSON response with the user's created courses.
 */
export const getMyCreatedCourses = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;

    const courses = await Course.find({
      instructor: new mongoose.Types.ObjectId(userId),
    });

    return res.status(200).json({
      success: true,
      message: "My courses fetched successfully",
      data: { courses },
    });
  },
);

/**
 * @desc Updates details of a course owned by the authenticated instructor.
 * @input {AuthenticatedRequest} req - The Express request object containing courseId params and update fields in body.
 * @input {Response} res - The Express response object.
 * @output {Promise<void>} Sends a JSON response with the updated course data.
 */
export const updateCourseDetails = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { courseId } = req.params;
    const userId = req.userId;

    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
      throw new ApiError("Invalid courseId", 400);
    }

    const {
      title,
      subtitle,
      description,
      category,
      level,
      price,
      thumbnail,
      isPublished,
    } = req.body;

    const updateBody = Object.fromEntries(
      Object.entries({
        title,
        subtitle,
        description,
        category,
        level,
        price,
        thumbnail,
        isPublished,
      }).filter(([_, val]) => val !== undefined),
    );

    const course = await Course.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(courseId),
        instructor: new mongoose.Types.ObjectId(userId),
      },
      {
        $set: updateBody,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    await invalidatePublishedCoursesInCache();

    return res.status(200).json({
      success: true,
      message: "Course updated successfully",
      data: { course },
    });
  },
);

/**
 * @desc Fetches complete details of a specific course by its ID.
 * @input {AuthenticatedRequest} req - The Express request object containing the courseId parameter.
 * @input {Response} res - The Express response object.
 * @output {Promise<void>} Sends a JSON response with the course data.
 */
export const getCourseDetails = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { courseId } = req.params;
    const userId = req.userId;
    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
      throw new ApiError("Invalid courseId", 400);
    }

    const course = await Course.findById(new mongoose.Types.ObjectId(courseId)).populate("instructor", "name bio avatar");

    return res.status(200).json({
      success: true,
      message: "Course fetched successfully",
      data: { course },
    });
  },
);

/**
 * @desc Adds a new lecture to a specific course owned by the instructor, using a transaction.
 * @input {AuthenticatedRequest} req - The Express request object containing courseId and lecture details.
 * @input {Response} res - The Express response object.
 * @output {Promise<void>} Sends a JSON response with the newly created lecture.
 */
export const addLectureToCourse = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { courseId } = req.params;
    const userId = req.userId;
    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
      throw new ApiError("Invalid courseId", 400);
    }

    const { title, description, order, videoUrl, publicId, signature, version } = req.body;
    if (!title || !description) {
      throw new ApiError("Lecture data is required", 400);
    }

    const isValid = verifyUploadSignature({ publicId, version, signature })

    if (!isValid) {
      throw new ApiError("Invalid upload signature", 400)
    }
    const slug = title.toLowerCase().replace(/ /g, "-");
    let lecture = await Lecture.findOne({
      courseId: new mongoose.Types.ObjectId(courseId),
      slug,
    });
    if (lecture) {
      throw new ApiError("Lecture with this title already exists", 400);
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const createdLectures = await Lecture.create([{
        title,
        description,
        videoUrl,
        publicId,
        courseId: new mongoose.Types.ObjectId(courseId),
        uploadStatus: EUploadStatus.PROCESSING,
      }], { session });

      lecture = createdLectures[0]!;

      const push: { $each: mongoose.Types.ObjectId[]; $position?: number } = {
        $each: [lecture!._id as mongoose.Types.ObjectId],
      };

      if (order != null) {
        push.$position = order - 1;
      }

      await Course.findOneAndUpdate(
        {
          instructor: new mongoose.Types.ObjectId(userId),
          _id: new mongoose.Types.ObjectId(courseId),
        },
        {
          $inc: {
            totalLectures: 1,
          },
          $push: {
            lectures: push,
          },
        },
        {
          runValidators: true,
          session,
        },
      );

      await session.commitTransaction();

      await addLectureUploadJob({
        lectureUrl: videoUrl,
        lectureId: lecture._id.toString(),
        courseId: courseId.toString()
      })

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

    return res.status(201).json({
      success: true,
      message: "Lecture added successfully",
      data: { lecture },
    });
  },
);


/**
 * @desc Fetches all lectures for a specific course.
 * @input {AuthenticatedRequest} req - The Express request object containing the courseId parameter.
 * @input {Response} res - The Express response object.
 * @output {Promise<void>} Sends a JSON response with the course's lectures.
 */
export const getCourseLectures = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { courseId } = req.params;
    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
      throw new ApiError("Invalid courseId", 400);
    }

    const lectures = await Course.findById(
      new mongoose.Types.ObjectId(courseId),
    )
      .select("lectures")
      .populate("lectures");

    return res.status(200).json({
      success: true,
      message: "Lectures fetched successfully",
      data: { lectures },
    });
  },
);

/**
 * @desc Creates a new announcement for a course owned by the instructor.
 * @input {AuthenticatedRequest} req - The Express request object containing courseId and message.
 * @input {Response} res - The Express response object.
 * @output {Promise<void>} Sends a JSON response with the updated course data.
 */
export const announceMessage = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { courseId } = req.params;
    const { message } = req.body;
    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
      throw new ApiError("Invalid courseId", 400);
    }
    if (!message) {
      throw new ApiError("Message is required", 400);
    }
    const course = await Course.findById(new mongoose.Types.ObjectId(courseId));
    if (!course) {
      throw new ApiError("Course not found", 404);
    }
    if (course.instructor.toString() !== req.userId) {
      throw new ApiError("You are not authorized to perform this action", 403);
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    let announcement;
    try {
      const createdAnnouncements = await Announcement.create([{
        courseId: new mongoose.Types.ObjectId(courseId),
        message: message,
      }], { session });

      announcement = createdAnnouncements[0];

      course.announcements.push(announcement!._id);
      await course.save({ session });
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
    return res.status(200).json({
      success: true,
      message: "Message announced successfully",
      data: { course },
    });
  },
);

/**
 * @desc Fetches all announcements for a specific course.
 * @input {AuthenticatedRequest} req - The Express request object containing the courseId parameter.
 * @input {Response} res - The Express response object.
 * @output {Promise<void>} Sends a JSON response with the course announcements.
 */
export const getCourseAnnouncements = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { courseId } = req.params;
    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
      throw new ApiError("Invalid courseId", 400);
    }
    const announcements = await Announcement.find({
      courseId: new mongoose.Types.ObjectId(courseId),
    })
      .select("+sentAt")
      .sort({ sentAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Announcements fetched successfully",
      data: { announcements },
    });
  },
);

/**
 * @desc Fetches all announcements from all courses the authenticated user has purchased.
 * @input {AuthenticatedRequest} req - The Express request object containing the user ID.
 * @input {Response} res - The Express response object.
 * @output {Promise<void>} Sends a JSON response with the user's announcements.
 */
export const getMyAnnouncements = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;

    const purchases = await CoursePurchase.find({
      user: new mongoose.Types.ObjectId(userId),
      status: "completed",
    }).select("course");

    const courseIds = purchases.map((p) => p.course);

    const announcements = await Announcement.find({
      courseId: { $in: courseIds },
    })
      .select("+sentAt")
      .sort({ sentAt: -1 })
      .populate("courseId", "title");

    return res.status(200).json({
      success: true,
      message: "My announcements fetched successfully",
      data: { announcements },
    });
  },
);

/**
 * @desc Allows an enrolled user to rate a course.
 * @input {AuthenticatedRequest} req - The Express request object containing courseId and rating.
 * @input {Response} res - The Express response object.
 * @output {Promise<void>} Sends a JSON response with the updated average rating.
 */
export const rateCourse = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { courseId } = req.params;
    const userId = req.userId;
    const { rating } = req.body;

    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
      throw new ApiError("Invalid courseId", 400);
    }

    if (rating === undefined || typeof rating !== "number" || rating < 1 || rating > 5) {
      throw new ApiError("Rating must be a number between 1 and 5", 400);
    }

    if (!userId) {
      throw new ApiError("User not authenticated", 401);
    }

    const result = await Course.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(courseId),
        "enrolledStudents.student": new mongoose.Types.ObjectId(userId),
      },
      { $set: { "enrolledStudents.$.rating": rating } },
      { new: true, runValidators: true }
    );

    if (!result) {
      throw new ApiError("You must be enrolled in this course to rate it", 403);
    }

    await invalidatePublishedCoursesInCache();

    return res.status(200).json({
      success: true,
      message: "Course rated successfully",
      data: {
        averageRating: result.averageRating,
        reviewCount: result.enrolledStudents.filter((s) => s.rating !== undefined).length,
      },
    });
  }
);

