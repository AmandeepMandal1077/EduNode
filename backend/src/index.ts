// Silence all console output in production before anything else loads
if (process.env.NODE_ENV === "production") {
  const noop = () => {};
  console.log = noop;
  console.error = noop;
  console.warn = noop;
  console.info = noop;
  console.debug = noop;
}

import app from "./app.js";

import connectdb from "./database/db.js";

const PORT = (process.env.PORT as string) || 3000;

connectdb();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
