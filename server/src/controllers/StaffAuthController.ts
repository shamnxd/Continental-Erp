import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { container } from "tsyringe";
import { IStaffRepository } from "../interfaces/repositories/IStaffRepository";
import { AppError } from "../errors/AppError";
import { StatusCode } from "../constants/statusCodes";
import { env } from "../config/env";
import { AuditLogger } from "../utils/AuditLogger";

export class StaffAuthController {
  public login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        throw new AppError("Email and password are required", StatusCode.BAD_REQUEST);
      }

      const staffRepo = container.resolve<IStaffRepository>("StaffRepository");
      const staff = await staffRepo.findByEmail(email);

      if (!staff || !staff.passwordHash) {
        throw new AppError("Invalid email or password", StatusCode.UNAUTHORIZED);
      }

      if (!staff.isActive) {
        throw new AppError("Account is inactive. Please contact your administrator.", StatusCode.FORBIDDEN);
      }

      const isValid = await bcrypt.compare(password, staff.passwordHash);
      if (!isValid) {
        throw new AppError("Invalid email or password", StatusCode.UNAUTHORIZED);
      }

      const payload = {
        id: staff.id!,
        staffNo: staff.staffNo,
        fullName: staff.fullName,
        email: staff.email,
        role: "staff" as const,
      };

      const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
        expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"],
      });

      const refreshToken = jwt.sign({ id: staff.id }, env.JWT_REFRESH_SECRET, {
        expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions["expiresIn"],
      });

      await staffRepo.updateRefreshToken(staff.id!, refreshToken);

      res.cookie(env.COOKIE_NAME_REFRESH + "_staff", refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });



      res.status(StatusCode.OK).json({
        success: true,
        accessToken,
        staff: {
          id: staff.id,
          staffNo: staff.staffNo,
          fullName: staff.fullName,
          email: staff.email,
          role: staff.role,
          city: staff.city,
          status: staff.status,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  public refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refreshToken = req.cookies?.[env.COOKIE_NAME_REFRESH + "_staff"] as string | undefined;
      if (!refreshToken) {
        throw new AppError("No refresh token session found", StatusCode.UNAUTHORIZED);
      }

      let userId: string;
      try {
        const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { id: string };
        userId = decoded.id;
      } catch (err) {
        throw new AppError("Invalid or expired refresh token", StatusCode.UNAUTHORIZED);
      }

      const staffRepo = container.resolve<IStaffRepository>("StaffRepository");
      const staff = await staffRepo.findById(userId);

      if (!staff || staff.refreshToken !== refreshToken) {
        throw new AppError("Invalid refresh token session", StatusCode.UNAUTHORIZED);
      }

      if (!staff.isActive) {
        throw new AppError("Account is inactive", StatusCode.FORBIDDEN);
      }

      const payload = {
        id: staff.id!,
        staffNo: staff.staffNo,
        fullName: staff.fullName,
        email: staff.email,
        role: "staff" as const,
      };

      const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
        expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"],
      });

      res.status(StatusCode.OK).json({
        success: true,
        accessToken,
      });
    } catch (error) {
      next(error);
    }
  };

  public logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith("Bearer ")) {
        try {
          const decoded = jwt.decode(authHeader.split(" ")[1]) as any;
          if (decoded?.id) {
            const staffRepo = container.resolve<IStaffRepository>("StaffRepository");
            await staffRepo.updateRefreshToken(decoded.id, null);
          }
        } catch {}
      }
      res.clearCookie(env.COOKIE_NAME_REFRESH + "_staff", {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "lax",
      });
      res.status(StatusCode.OK).json({ success: true, message: "Logged out successfully" });
    } catch (error) {
      next(error);
    }
  };
}
