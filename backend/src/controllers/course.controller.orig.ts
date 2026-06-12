
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
