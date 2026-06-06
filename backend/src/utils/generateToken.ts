import jwt from "jsonwebtoken";
import { ApiError } from "./apiError.js";
import type { Response } from "express";

const generateToken = (res: Response, userId: string, message: string) => {
  try {
    const payload = { userId };
    const token = jwt.sign(payload, process.env.JWT_SECRET as string, {
      expiresIn: "1d",
    });
    res
      .status(200)
      .cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000,
      })
      .json({
        success: true,
        message,
        data: {
          token,
        },
      });
  } catch (error) {
    console.log(error);
    throw new ApiError("Failed to generate token", 500);
  }
};

const verifyJWTToken = (token: string): TokenPayload => {
  if (!token) {
    throw new Error("No token found");
  }

  const decodedPayload = jwt.verify(token, process.env.JWT_SECRET as string);
  if (typeof decodedPayload === "string") {
    throw new Error("Invalid token structure");
  }
  return decodedPayload as TokenPayload;
};
export { generateToken, verifyJWTToken };
