import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../errors/AppError";
import { StatusCode } from "../constants/statusCodes";
import { env } from "../config/env";

export interface TokenPayload {
  id: string;
  name: string;
  email: string;
  role?: string;
  permissions?: {
    crm: boolean;
    operations: boolean;
    finance: boolean;
    administration: boolean;
  };
}

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export const requireAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  console.log(`[Auth Debug] URL: ${req.originalUrl}, Method: ${req.method}, AuthHeader: ${authHeader}`);

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError("Access token required", StatusCode.UNAUTHORIZED);
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
    req.user = decoded; // Bind decoded user details
    next();
  } catch (error) {
    throw new AppError("Invalid or expired access token", StatusCode.UNAUTHORIZED);
  }
};
