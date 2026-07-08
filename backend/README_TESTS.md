# LMS Backend Testing Documentation

This document explains the structure and execution of the test suite for the LMS backend application.

## Directory Structure

The tests are segregated into two separate directories under `tests/` based on their testing scope:

```
tests/
├── setup.ts                 # Global test configuration and mocks
├── unit/                    # Unit-style controller tests
│   ├── auth.test.ts
│   ├── comment.test.ts
│   ├── course.test.ts
│   ├── courseProgress.test.ts
│   ├── email.test.ts
│   ├── health.test.ts
│   ├── lecture.test.ts
│   ├── playback.test.ts
│   └── purchase.test.ts
└── integration/             # End-to-end integration tests
    ├── auth.test.ts
    ├── comment.test.ts
    ├── course.test.ts
    ├── courseProgress.test.ts
    ├── email.test.ts
    ├── health.test.ts
    ├── lecture.test.ts
    └── purchase.test.ts
```

### Why two separate directories?
1. **`unit/`**: Directly runs the controller functions in isolation using mocked Request, Response, and NextFunction parameters, or mounts them on a dummy Express app. It mocks out Mongoose database operations and the Redis cache to ensure the tests run in milliseconds and have no external service dependencies.
2. **`integration/`**: Tests the full API route lifecycle by making actual HTTP requests (via Supertest) to the Express application endpoints. It interacts with a real MongoDB database instance (managed via Docker Compose) to guarantee that schemas, indexes, and transaction blocks work perfectly end-to-end.

---

## How to Run Tests

### Prerequisites
Make sure you have Docker and Bun installed.

### Step 1: Spin up the Test Databases
Run the following command to start MongoDB (replica set for transaction support) and Redis:
```bash
bun run test:docker:up
```

### Step 2: Run the Tests
To run the Vitest test suite once:
```bash
bun run test
```

To run the test suite in watch mode:
```bash
bun x vitest
```

### Step 3: Tear down the Test Databases
After you are done, shut down the containers and clean the volumes:
```bash
bun run test:docker:down
```
