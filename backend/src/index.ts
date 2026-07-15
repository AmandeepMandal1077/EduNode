import debug from "./utils/debug.js";

import app from "./app.js";

import connectdb from "./database/db.js";

const PORT = (process.env.PORT as string) || 3000;

connectdb();

app.listen(PORT, () => {
  debug(`Server is running on port ${PORT}`);
});
