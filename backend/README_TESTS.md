# User Controller Test Sequence Mapping

This document maps sequential test case numbers to their specific descriptions in `tests/user.test.ts`.

| Sequence | Test Case Description            | Route                                 | Expected Result  |
| -------- | -------------------------------- | ------------------------------------- | ---------------- |
| 1        | Signup with valid details        | `POST /api/v1/users/signup`           | 201 Created      |
| 2        | Signup with missing fields       | `POST /api/v1/users/signup`           | 400 Bad Request  |
| 3        | Signup with existing email       | `POST /api/v1/users/signup`           | 400 Bad Request  |
| 4        | Signin with valid credentials    | `POST /api/v1/users/signin`           | 200 OK           |
| 5        | Signin with non-existent user    | `POST /api/v1/users/signin`           | 404 Not Found    |
| 6        | Signin with invalid password     | `POST /api/v1/users/signin`           | 401 Unauthorized |
| 7        | Get Profile (Authenticated)      | `GET /api/v1/users/profile`           | 200 OK           |
| 8        | Get Profile (Unauthenticated)    | `GET /api/v1/users/profile`           | 401 Unauthorized |
| 9        | Update Profile                   | `PATCH /api/v1/users/profile`         | 200 OK           |
| 10       | Change Password                  | `PATCH /api/v1/users/change-password` | 200 OK           |
| 11       | Forgot Password (Generate Token) | `POST /api/v1/users/forgot-password`  | 200 OK           |
| 12       | Reset Password (Validate Token)  | `POST /api/v1/users/reset-password`   | 200 OK           |
| 13       | Delete User Account              | `DELETE /api/v1/users/account`        | 200 OK           |

# Course Controller Test Sequence Mapping

| Sequence | Test Case Description           | Route                                       | Expected Result |
| -------- | ------------------------------- | ------------------------------------------- | --------------- |
| 1        | Create Course (Instructor)      | `POST /api/v1/courses`                      | 201 Created     |
| 2        | Create Course (Student)         | `POST /api/v1/courses`                      | 403 Forbidden   |
| 3        | Create Course (Missing Fields)  | `POST /api/v1/courses`                      | 400 Bad Request |
| 4        | Search Courses                  | `GET /api/v1/courses/search`                | 200 OK          |
| 5        | Search Courses (Missing String) | `GET /api/v1/courses/search`                | 400 Bad Request |
| 6        | Get Published Courses           | `GET /api/v1/courses/published`             | 200 OK          |
| 7        | Get My Courses                  | `GET /api/v1/courses`                       | 200 OK          |
| 8        | Get Course Details              | `GET /api/v1/courses/c/:courseId`           | 200 OK          |
| 9        | Update Course                   | `PATCH /api/v1/courses/c/:courseId`         | 200 OK          |
| 10       | Update Course (Student)         | `PATCH /api/v1/courses/c/:courseId`         | 403 Forbidden   |
| 11       | Add Lecture                     | `POST /api/v1/courses/c/:courseId/lectures` | 201 Created     |
| 12       | Get Lectures                    | `GET /api/v1/courses/c/:courseId/lectures`  | 200 OK          |

# Lecture Controller Test Sequence Mapping

| Sequence | Test Case Description                     | Route                                     | Expected Result  |
| -------- | ----------------------------------------- | ----------------------------------------- | ---------------- |
| 1        | Get Lecture (Unauthenticated)             | `GET /api/v1/lecture/:lectureId`          | 401 Unauthorized |
| 2        | Get Lecture (Invalid ID Format)           | `GET /api/v1/lecture/:lectureId`          | 400 Bad Request  |
| 3        | Get Lecture (Non-existent ID)             | `GET /api/v1/lecture/:lectureId`          | 404 Not Found    |
| 4        | Get Lecture Details (Valid)               | `GET /api/v1/lecture/:lectureId`          | 200 OK           |
| 5        | Get Comments (Unauthenticated)            | `GET /api/v1/lecture/:lectureId/comments` | 401 Unauthorized |
| 6        | Get Comments (Invalid Lecture ID)         | `GET /api/v1/lecture/:lectureId/comments` | 400 Bad Request  |
| 7        | Get Comments (Empty - No Comments)        | `GET /api/v1/lecture/:lectureId/comments` | 200 OK           |
| 8        | Get Comments (With User Population)       | `GET /api/v1/lecture/:lectureId/comments` | 200 OK           |
| 9        | Get Comments (Only For Specified Lecture) | `GET /api/v1/lecture/:lectureId/comments` | 200 OK           |

# Course Purchase Controller Test Sequence Mapping

| Sequence | Test Case Description                   | Route                                                | Expected Result  |
| -------- | --------------------------------------- | ---------------------------------------------------- | ---------------- |
| 1        | Create Checkout (Unauthenticated)       | `POST /api/v1/payments/create-checkout-session`      | 401 Unauthorized |
| 2        | Create Checkout (Invalid Course ID)     | `POST /api/v1/payments/create-checkout-session`      | 400 Bad Request  |
| 3        | Create Checkout (Course Not Found)      | `POST /api/v1/payments/create-checkout-session`      | 404 Not Found    |
| 4        | Create Checkout (Valid)                 | `POST /api/v1/payments/create-checkout-session`      | 200 OK           |
| 5        | Create Checkout (Already Purchased)     | `POST /api/v1/payments/create-checkout-session`      | 400 Bad Request  |
| 6        | Get Purchase Status (Unauthenticated)   | `GET /api/v1/payments/course/:id/detail-with-status` | 401 Unauthorized |
| 7        | Get Purchase Status (Invalid Course ID) | `GET /api/v1/payments/course/:id/detail-with-status` | 400 Bad Request  |
| 8        | Get Purchase Status (Not Purchased)     | `GET /api/v1/payments/course/:id/detail-with-status` | 404 Not Found    |
| 9        | Get Purchase Status (Valid)             | `GET /api/v1/payments/course/:id/detail-with-status` | 200 OK           |
| 10       | Get Purchased Courses (Unauthenticated) | `GET /api/v1/payments`                               | 401 Unauthorized |
| 11       | Get Purchased Courses (Empty)           | `GET /api/v1/payments`                               | 200 OK           |
| 12       | Get Purchased Courses (With Courses)    | `GET /api/v1/payments`                               | 200 OK           |
| 13       | Get Purchased Courses (Only Completed)  | `GET /api/v1/payments`                               | 200 OK           |

# Course Progress Controller Test Sequence Mapping

> Note: Routes not yet registered in app.ts (expected at `/api/v1/progress`)

| Sequence | Test Case Description                     | Route                                           | Expected Result  |
| -------- | ----------------------------------------- | ----------------------------------------------- | ---------------- |
| 1        | Get Progress (Unauthenticated)            | `GET /api/v1/progress/:courseId`                | 401 Unauthorized |
| 2        | Get Progress (Invalid Course ID)          | `GET /api/v1/progress/:courseId`                | 400 Bad Request  |
| 3        | Get Progress (Not Found)                  | `GET /api/v1/progress/:courseId`                | 404 Not Found    |
| 4        | Get Progress (Valid)                      | `GET /api/v1/progress/:courseId`                | 200 OK           |
| 5        | Update Lecture Progress (Unauthenticated) | `PATCH /api/v1/progress/:courseId/lectures/:id` | 401 Unauthorized |
| 6        | Update Lecture Progress (Invalid ID)      | `PATCH /api/v1/progress/:courseId/lectures/:id` | 400 Bad Request  |
| 7        | Update Lecture Progress (Valid)           | `PATCH /api/v1/progress/:courseId/lectures/:id` | 200 OK           |
| 8        | Mark Complete (Unauthenticated)           | `PATCH /api/v1/progress/:courseId/complete`     | 401 Unauthorized |
| 9        | Mark Complete (Not Found)                 | `PATCH /api/v1/progress/:courseId/complete`     | 404 Not Found    |
| 10       | Mark Complete (Valid)                     | `PATCH /api/v1/progress/:courseId/complete`     | 200 OK           |
| 11       | Reset Progress (Unauthenticated)          | `PATCH /api/v1/progress/:courseId/reset`        | 401 Unauthorized |
| 12       | Reset Progress (Valid)                    | `PATCH /api/v1/progress/:courseId/reset`        | 200 OK           |

# Comment Controller Test Sequence Mapping

> Note: Routes not yet registered in app.ts (expected at `/api/v1/comments`)

| Sequence | Test Case Description              | Route                           | Expected Result  |
| -------- | ---------------------------------- | ------------------------------- | ---------------- |
| 1        | Write Comment (Unauthenticated)    | `POST /api/v1/comments`         | 401 Unauthorized |
| 2        | Write Comment (Missing Content)    | `POST /api/v1/comments`         | 400 Bad Request  |
| 3        | Write Comment (Invalid Lecture ID) | `POST /api/v1/comments`         | 400 Bad Request  |
| 4        | Write Comment (Valid)              | `POST /api/v1/comments`         | 201 Created      |
| 5        | Write Reply Comment                | `POST /api/v1/comments`         | 201 Created      |
| 6        | Like Comment (Unauthenticated)     | `POST /api/v1/comments/like`    | 401 Unauthorized |
| 7        | Like Comment (Missing Comment ID)  | `POST /api/v1/comments/like`    | 400 Bad Request  |
| 8        | Like Comment (Not Found)           | `POST /api/v1/comments/like`    | 404 Not Found    |
| 9        | Like Comment (Valid)               | `POST /api/v1/comments/like`    | 200 OK           |
| 10       | Dislike Comment (Unauthenticated)  | `POST /api/v1/comments/dislike` | 401 Unauthorized |
| 11       | Dislike Comment (Valid)            | `POST /api/v1/comments/dislike` | 200 OK           |
| 12       | Delete Comment (Unauthenticated)   | `DELETE /api/v1/comments`       | 401 Unauthorized |
| 13       | Delete Comment (Not Found)         | `DELETE /api/v1/comments`       | 404 Not Found    |
| 14       | Delete Comment (Valid - Soft)      | `DELETE /api/v1/comments`       | 200 OK           |

# Media Controller Test Sequence Mapping

| Sequence | Test Case Description                  | Route                          | Expected Result  |
| -------- | -------------------------------------- | ------------------------------ | ---------------- |
| 1        | Generate Signature (Unauthenticated)   | `POST /api/v1/media/signature` | 401 Unauthorized |
| 2        | Generate Signature (Valid)             | `POST /api/v1/media/signature` | 200 OK           |
| 3        | Verify Signature (Unauthenticated)     | `POST /api/v1/media/verify`    | 401 Unauthorized |
| 4        | Verify Signature (Missing Fields)      | `POST /api/v1/media/verify`    | 400 Bad Request  |
| 5        | Verify Signature (Missing Version)     | `POST /api/v1/media/verify`    | 400 Bad Request  |
| 6        | Verify Signature (Missing Signature)   | `POST /api/v1/media/verify`    | 400 Bad Request  |
| 7        | Verify Signature (Valid)               | `POST /api/v1/media/verify`    | 200 OK           |
| 8        | Verify Signature (With SecureUrl)      | `POST /api/v1/media/verify`    | 200 OK           |
| 9        | Generate Signature (User Folder Check) | `POST /api/v1/media/signature` | 200 OK           |
