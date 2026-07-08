import jwt from "jsonwebtoken";
import { ApiError } from "./apiError.js";
import type { Response } from "express";
import type { TokenPayload } from "../types/tokenPayload.js";

/**
 * @desc Generates a JWT token and sets it as an HTTP-only cookie on the response.
 * @input {Response} res - The Express response object.
 * @input {string} userId - The user ID to include in the token payload.
 * @input {string} message - The success message to return in the JSON response.
 * @output None
 */
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
        sameSite: "lax",
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
    throw new ApiError("Failed to generate token", 500);
  }
};

/**
 * @desc Verifies a given JWT token and returns its decoded payload.
 * @input {string} token - The JWT token to verify.
 * @output {TokenPayload} The decoded token payload.
 */
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
