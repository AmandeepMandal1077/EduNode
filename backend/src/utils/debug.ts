const isDev = process.env.NODE_ENV === "development";

const debug = (...args: unknown[]): void => {
  if (isDev) console.log(...args);
};

export default debug;
