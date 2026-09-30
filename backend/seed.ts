import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import "dotenv/config";

const BACKEND_URL = "http://localhost:3000/api/v1";
const RAG_URL = "http://rag-service:8000";

class Api {
  cookie = "";
  async request(method: string, url: string, data?: any, customHeaders: any = {}) {
    const res = await fetch(`${BACKEND_URL}${url}`, {
      method,
      headers: { 
        "Content-Type": "application/json", 
        ...(this.cookie ? { Cookie: this.cookie } : {}), 
        ...customHeaders 
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) this.cookie = setCookie.split(";")[0];
    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch { json = text; }
    if (!res.ok) throw new Error(`${method} ${url} failed: ${res.status} ${JSON.stringify(json)}`);
    return json;
  }
}

async function seed() {
  console.log("Starting E2E Seed process...");

  // 2. Drop MongoDB
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI as string);
  await mongoose.connection.db?.dropDatabase();
  console.log("MongoDB dropped successfully.");

  // 3. Clear S3 Bucket
  const s3Client = new S3Client({
    region: process.env.AWS_REGION as string,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    },
  });
  const bucketName = process.env.S3_BUCKET_NAME as string;
  try {
    console.log("Emptying S3 bucket...");
    let listedObjects = await s3Client.send(new ListObjectsV2Command({ Bucket: bucketName }));
    while (listedObjects.Contents && listedObjects.Contents.length > 0) {
      await s3Client.send(
        new DeleteObjectsCommand({
          Bucket: bucketName,
          Delete: { Objects: listedObjects.Contents.map((c) => ({ Key: c.Key! })) },
        })
      );
      listedObjects = await s3Client.send(new ListObjectsV2Command({ Bucket: bucketName }));
    }
    console.log("S3 Bucket cleared.");
  } catch (err: any) {
    console.log("S3 bucket empty failed:", err.message);
  }

  // 4. Wait a few seconds to ensure backend is fully reachable
  console.log("Waiting for backend API to be ready...");
  await new Promise(r => setTimeout(r, 5000));

  // 5. Seed Users
  const internalApi = new Api();
  const users = [
    { name: "Instructor", email: "instructor@edunode.dev", password: "Seeded@123", role: "instructor" },
    { name: "Student", email: "student@edunode.dev", password: "Seeded@123", role: "student" },
    { name: "Alice", email: "alice@edunode.dev", password: "Seeded@123", role: "student" },
    { name: "Bob", email: "bob@edunode.dev", password: "Seeded@123", role: "student" },
    { name: "Charlie", email: "charlie@edunode.dev", password: "Seeded@123", role: "student" },
  ];
  for (const u of users) {
    await internalApi.request("POST", "/users/signup", u);
  }
  console.log("Users registered via API.");

  // 6. Instructor Creates Courses & Uploads Videos
  const instApi = new Api();
  await instApi.request("POST", "/users/signin", { email: "instructor@edunode.dev", password: "Seeded@123" });
  
  const paidCourseRes = await instApi.request("POST", "/courses", {
    title: "Premium Masterclass", subtitle: "Advanced concepts", description: "Paid course details.", category: "Web Development", level: "beginner", price: 999, thumbnail: "https://picsum.photos/seed/premium/800/450"
  });
  const paidCourseId = paidCourseRes.data.course._id;
  await instApi.request("PATCH", `/courses/${paidCourseId}`, { isPublished: true, price: 999 });

  const freeCourseRes = await instApi.request("POST", "/courses", {
    title: "Free Bootcamp", subtitle: "Start here", description: "Free stuff.", category: "Web Development", level: "beginner", price: 0, thumbnail: "https://picsum.photos/seed/free/800/450"
  });
  const freeCourseId = freeCourseRes.data.course._id;
  await instApi.request("PATCH", `/courses/${freeCourseId}`, { isPublished: true, price: 0 });
  console.log("Courses created and published.");
  
  const courseLecs: any = {};
  const uploadSessionsToWait: { sessionId: string, lectureId: string }[] = [];
  const videos: any = {
    [paidCourseId]: { path: "./seed-data/test_2_2.mp4", name: "test_2_2.mp4" },
    [freeCourseId]: { path: "./seed-data/test_1_1.mp4", name: "test_1_1.mp4" },
  };

  for (const cid of [paidCourseId, freeCourseId]) {
    const videoFile = videos[cid];
    const videoBuffer = fs.readFileSync(videoFile.path);

    console.log(`Adding lecture to course ${cid}...`);
    const lecRes = await instApi.request("POST", `/courses/${cid}/lectures`, {
      title: "Test Lecture", description: "Lecture details", fileName: videoFile.name, contentType: "video/mp4", order: 1
    });
    
    const { presignedUrl, s3Key, uploadSessionId, lecture: { _id: lectureId } } = lecRes.data;
    courseLecs[cid] = lectureId;
    uploadSessionsToWait.push({ sessionId: uploadSessionId, lectureId });

    console.log("PUT to S3 presigned URL...");
    await fetch(presignedUrl, { method: "PUT", body: videoBuffer, headers: { "Content-Type": "video/mp4" } });

    console.log("Confirming upload internally...");
    await internalApi.request("POST", "/internal/media/confirm-upload", { s3Key }, { "x-internal-secret": process.env.INTERNAL_API_SECRET });


    console.log("Adding announcement...");
    await instApi.request("POST", `/courses/${cid}/announce`, { message: "Welcome to this newly seeded course!" });
  }

  // 7. Enrolled Students actions in Free Course
  console.log("Enrolling students and adding comments...");
  const enrolledEmails = ["alice@edunode.dev", "bob@edunode.dev", "charlie@edunode.dev"];
  const freeLecId = courseLecs[freeCourseId];
  
  for (const email of enrolledEmails) {
    const stuApi = new Api();
    await stuApi.request("POST", "/users/signin", { email, password: "Seeded@123" });
    await stuApi.request("POST", "/payments/enroll-free", { courseId: freeCourseId });
    await stuApi.request("POST", `/courses/${freeCourseId}/rate`, { rating: Math.floor(Math.random() * 2) + 4 });
    await stuApi.request("POST", "/comment", { lectureId: freeLecId, content: `I love this lecture! - ${email}` });
  }

  console.log("Waiting for media-worker to finish processing all videos...");
  const statusMap: Record<string, string> = {};
  const pendingSessions = new Set(uploadSessionsToWait);

  while (pendingSessions.size > 0) {
    for (const session of Array.from(pendingSessions)) {
      const statusRes = await instApi.request("GET", `/media/status/${session.sessionId}`);
      const status = statusRes.data.status;
      
      if (statusMap[session.sessionId] !== status) {
        const time = new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' });
        console.log(`[${time}, ${session.lectureId}, ${status}]`);
        statusMap[session.sessionId] = status;
      }

      if (status === "READY") {
        pendingSessions.delete(session);
      } else if (status === "FAILED") {
        throw new Error(`Media worker failed to process video ${session.lectureId}`);
      }
    }
    
    if (pendingSessions.size > 0) {
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  console.log("Seeding completed perfectly using the backend API!");
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
