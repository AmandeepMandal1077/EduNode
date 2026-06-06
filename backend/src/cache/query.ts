import cache from "./index.js";

export const setJSON = async <T>(
  key: string,
  value: T,
  expireAt: Date | null = null,
) => {
  const json = JSON.stringify(value);

  if (expireAt) {
    await cache.set(key, json, {
      expiration: {
        type: "PX",
        value: expireAt.getTime() - Date.now(),
      },
    });
  } else {
    await cache.set(key, json);
  }
};

export const getJSON = async <T>(key: string) => {
  const type = await cache.type(key);

  if (type !== "string") return null;

  const json = await cache.get(key);
  if (!json) return null;
  return JSON.parse(json) as T;
};

export const incByNum = async (key: string, value: number, expireAt: Date | null = null) => {
  if (expireAt) {
    await cache.incrByFloat(key, value);
    await cache.pExpireAt(key, expireAt.getTime())
  }
  else {
    await cache.incrByFloat(key, value);
  }
}
