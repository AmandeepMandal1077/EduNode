import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../types/user.js";
import mongoose from "mongoose";

//utils
import { asyncHandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/apiError.js";

//models
import { Course, CourseLevel } from "../models/course.model.js";
import { Lecture } from "../models/lecture.model.js";
import {
  getPublishedCoursesFromCache,
  savePublishedCoursesToCache,
} from "../cache/courses-cache.js";
import { Announcement } from "../models/announcement.model.js";
import { CoursePurchase } from "../models/coursePurchase.model.js";

/**
 * Create a new course
 * @route POST /api/v1/courses
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
      thumbnail, //thumbnail url
      instructor: new mongoose.Types.ObjectId(req.userId),
    });

    return res.status(201).json({
      success: true,
      message: "Course created successfully",
      data: { course },
    });
  },
);

/**
 * Search courses with filters
 * @route GET /api/v1/courses/search
 */
export const searchCourses = asyncHandler(
  async (req: Request, res: Response) => {
    const searchString = req.query.searchString as string;
    if (!searchString || searchString.trim() === "") {
      throw new ApiError("Search string is required", 400);
    }
    const escapedSearchString = searchString
      .toLowerCase()
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const courses = await Course.find({
      isPublished: true,
      $or: [
        { title: { $regex: escapedSearchString, $options: "i" } },
        { subtitle: { $regex: escapedSearchString, $options: "i" } },
        { description: { $regex: escapedSearchString, $options: "i" } },
        { category: { $regex: escapedSearchString, $options: "i" } },
      ],
    }).select(
      "title subtitle description category level price thumbnail instructor slug totalDuration totalLectures",
    );

    return res.status(200).json({
      success: true,
      message: "Courses fetched successfully",
      data: { courses },
    });
  },
);

/**
 * Get all published courses
 * @route GET /api/v1/courses/published
 */
export const getPublishedCourses = asyncHandler(
  async (_: Request, res: Response) => {
    let courses = await getPublishedCoursesFromCache();
    if (!courses) {
      courses = await Course.find({ isPublished: true });
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
 * Get courses created by the current user
 * @route GET /api/v1/courses/my-courses
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
 * Update course details
 * @route PATCH /api/v1/courses/:courseId
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
      }).filter((_, value) => value !== undefined),
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

    return res.status(200).json({
      success: true,
      message: "Course updated successfully",
      data: { course },
    });
  },
);

/**
 * Get course by ID
 * @route GET /api/v1/courses/:courseId
 */
export const getCourseDetails = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { courseId } = req.params;
    const userId = req.userId;
    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
      throw new ApiError("Invalid courseId", 400);
    }

    const course = await Course.findById(new mongoose.Types.ObjectId(courseId));

    return res.status(200).json({
      success: true,
      message: "Course fetched successfully",
      data: { course },
    });
  },
);

//TODO: fix setting up lecture
/**
 * Add lecture to course
 * @route POST /api/v1/courses/:courseId/lectures
 */
export const addLectureToCourse = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { courseId } = req.params;
    const userId = req.userId;
    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
      throw new ApiError("Invalid courseId", 400);
    }

    const { title, description, order, videoUrl, publicId } = req.body;
    if (!title || !description) {
      throw new ApiError("Lecture data is required", 400);
    }
    const slug = title.toLowerCase().replace(/ /g, "-");
    let lecture = await Lecture.findOne({
      courseId: new mongoose.Types.ObjectId(courseId),
      slug,
    });
    if (lecture) {
      throw new ApiError("Lecture with this title already exists", 400);
    }

    lecture = await Lecture.create({
      title,
      description,
      videoUrl,
      publicId,
      courseId: new mongoose.Types.ObjectId(courseId),
    });

    const push: any = {
      $each: [lecture._id],
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
      },
    );

    return res.status(201).json({
      success: true,
      message: "Lecture added successfully",
      data: { lecture },
    });
  },
);

/**
 * Get purchasaed courses
 * @route GET /api/v1/courses/purchased
 */
export const getPurchasedCourses = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;

    const courses = await CoursePurchase.find({
      user: new mongoose.Types.ObjectId(userId),
      status: "SUCCESS",
    }).select("course")
      .populate("course")


    return res.status(200).json({
      success: true,
      message: "Purchased courses fetched successfully",
      data: { courses },
    });
  },
);

/**
 * Get course lectures
 * @route GET /api/v1/courses/:courseId/lectures
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
 * Announce message to all students
 * @route POST /api/v1/courses/:courseId/announce
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

    const announcement = await Announcement.create({
      courseId: new mongoose.Types.ObjectId(courseId),
      message: message,
    });

    course.announcements.push(announcement._id);
    await course.save();
    return res.status(200).json({
      success: true,
      message: "Message announced successfully",
      data: { course },
    });
  },
);

/**
 * Get announcements for a course
 * @route GET /api/v1/courses/:courseId/announcements
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
