import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../errors/AppError";
import { StatusCode } from "../constants/statusCodes";
import { env } from "../config/env";

export interface StaffTokenPayload {
  id: string;
  staffNo: string;
  fullName: string;
  email: string;
  role: "staff";
}

export interface StaffAuthenticatedRequest extends Request {
  staff?: StaffTokenPayload;
}

export const requireStaffAuth = (
  req: StaffAuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError("Staff access token required", StatusCode.UNAUTHORIZED);
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as StaffTokenPayload;
    if (decoded.role !== "staff") {
      throw new AppError("Staff access required", StatusCode.FORBIDDEN);
    }
    req.staff = decoded;
    next();
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    throw new AppError("Invalid or expired staff access token", StatusCode.UNAUTHORIZED);
  }
};
