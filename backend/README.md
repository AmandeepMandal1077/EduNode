# Project Description

## Overview

This project is a robust **Learning Management System (LMS) Backend API** built to facilitate online education. It is a **backend-only** project, serving as the core infrastructure for an education platform. It provides a comprehensive platform for instructors to create and manage courses, and for students to browse, purchase, and track their progress through educational content.

## Technical Stack

- **Runtime Environment:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (via Mongoose ODM)
- **Language:** TypeScript
- **Authentication:** JSON Web Tokens (JWT) & Cookies
- **Validation:** Zod
- **File Storage:** Cloudinary (for images and videos)
- **Payments:** Stripe
- **Testing:** Vitest (Integration & Unit Testing)
- **Tooling:** Bun (for development)

## Key Functionalities

### 1. Authentication & User Management

Secure user access and profile handling.

- **Sign Up / Sign In / Sign Out:** Standard authentication flow.
- **Profile Management:** Users can view, update, and delete their profiles.
- **Avatar Upload:** Users can upload profile pictures (handled via Multer and Cloudinary).
- **Password Management:** Secure password change functionality.

### 2. Course Management

Full CRUD capabilities for courses, enabling instructors to build content.

- **Public Access:**
  - List published courses.
  - Search functionality to find courses.
- **Instructor Features:**
  - Create new courses with thumbnails.
  - Update course details.
  - View list of created courses.
- **Lecture Management:**
  - Add video lectures to specific courses.
  - Retrieve course lectures.

### 3. Course Interactions & Progress

Features to engage students and track their learning journey.

- **Progress Tracking:**
  - Track completion of individual lectures.
  - View overall course progress.
  - Mark courses as completed.
  - Reset course progress if needed.

### 4. Payments & Enrollment

Integration with payment gateways to handle course purchases.

- **Stripe Integration:**
  - Create checkout sessions for course purchase.
  - Webhook handling for payment confirmation.
- **Enrollment Status:** Check if a user has purchased a specific course.
- **Purchase History:** detailed list of purchased courses.

### 5. Media Management

Centralized handling of media assets.

- **Video Uploads:** Dedicated endpoint for uploading video content to Cloudinary.

## Directory Structure Highlights

- `src/routes`: API route definitions organized by feature (user, course, purchase, etc.).
- `src/controllers`: Business logic handlers.
- `src/models`: Mongoose data schemas.
- `src/middlewares`: Authentication, validation, and upload middlewares.
