export interface Lecture {
  id: string;
  title: string;
  duration: string; // e.g. "12:34"
  durationSeconds: number;
  videoUrl: string;
  description: string;
  resources: Resource[];
  isPreview: boolean;
  order: number;
}

export interface Resource {
  id: string;
  title: string;
  type: "pdf" | "link" | "zip" | "doc";
  url: string;
}

export interface Module {
  id: string;
  title: string;
  order: number;
  lectures: Lecture[];
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  courseId: string;
  lectureId?: string;
  content: string;
  upvotes: number;
  createdAt: string;
  replies: Comment[];
}

export interface Course {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  instructor: string;
  instructorBio: string;
  instructorAvatar: string;
  category: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  price: number;
  originalPrice: number;
  currency: string;
  rating: number;
  reviewCount: number;
  studentCount: number;
  totalDuration: string;
  lectureCount: number;
  language: string;
  lastUpdated: string;
  thumbnailAccent: string;   // Hex color for metadata chips / gradients
  thumbnail?: string;        // Actual thumbnail URL from backend
  tags: string[];
  modules: Module[];
  requirements: string[];
  learningOutcomes: string[];
  isBestseller: boolean;
  isFeatured: boolean;
  isPublished?: boolean;
  enrolledStudents?: { student: string; rating?: number }[];
}


export interface LectureProgress {
  lectureId: string;
  watchedSeconds: number;
  completed: boolean;
  lastWatchedAt: string;
}

export interface Enrollment {
  id: string;
  courseId: string;
  userId: string;
  enrolledAt: string;
  progressPercent: number;
  lastLectureId: string;
  lastModuleId: string;
  lectureProgress: LectureProgress[];
  completedAt?: string;
  certificateUrl?: string;
}

export interface Purchase {
  id: string;
  courseId: string;
  courseTitle: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: "completed" | "refunded" | "pending" | "failed";
  purchasedAt: string;
  invoiceUrl: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  bio: string;
  avatarUrl: string;
  joinedAt: string;
  streakDays: number;
  totalHoursLearned: number;
  role: "student" | "instructor" | "admin";
  purchases: Purchase[];
}
