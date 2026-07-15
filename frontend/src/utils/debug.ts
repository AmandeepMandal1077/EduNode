const isDev = import.meta.env.DEV;

const debug = (...args: unknown[]): void => {
  if (isDev) console.log(...args);
};

export default debug;
