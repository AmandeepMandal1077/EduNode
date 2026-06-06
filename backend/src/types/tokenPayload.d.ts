import type { JwtPayload } from "jsonwebtoken";

declare interface TokenPayload extends JwtPayload {
  userId: string;
}
