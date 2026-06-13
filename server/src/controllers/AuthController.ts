import { Request, Response, NextFunction } from "express";
import { inject, autoInjectable } from "tsyringe";
import jwt from "jsonwebtoken";
import { IUseCase } from "../interfaces/usecases/IUseCase";
import { LoginRequestDto, LoginResponseDto } from "../dtos/auth.dto";
import { StatusCode } from "../constants/statusCodes";
import { AppError } from "../errors/AppError";
import { env } from "../config/env";
import { AuditLogger } from "../utils/AuditLogger";

@autoInjectable()
export class AuthController {
  constructor(
    @inject("LoginUseCase")
    private _loginUseCase?: IUseCase<LoginRequestDto, LoginResponseDto>,
    @inject("RefreshTokenUseCase")
    private _refreshTokenUseCase?: IUseCase<string, string>
  ) {}

  public login = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dto = req.body as LoginRequestDto;
      const result = await this._loginUseCase!.execute(dto);

      // Set Refresh Token as secure, HTTP-only Cookie using custom configured name
      res.cookie(env.COOKIE_NAME_REFRESH, result.refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 Days in ms
      });

      // Log successful login
      await AuditLogger.log(
        result.user.name,
        "Login",
        "Auth",
        `Admin logged in successfully (${result.user.email})`
      );

      res.status(StatusCode.OK).json({
        success: true,
        accessToken: result.accessToken,
        user: result.user
      });
    } catch (error) {
      next(error);
    }
  };

  public refresh = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const refreshToken = req.cookies?.[env.COOKIE_NAME_REFRESH] as string | undefined;
      if (!refreshToken) {
        throw new AppError("No refresh token session found", StatusCode.UNAUTHORIZED);
      }

      const newAccessToken = await this._refreshTokenUseCase!.execute(refreshToken);

      res.status(StatusCode.OK).json({
        success: true,
        accessToken: newAccessToken
      });
    } catch (error) {
      next(error);
    }
  };

  public logout = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Safely try to get user name from token for audit log
      let userName = "Unknown Admin";
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        try {
          const decoded = jwt.decode(token) as any;
          if (decoded && decoded.name) {
            userName = decoded.name;
          }
        } catch (_) {}
      }

      // Clear HTTP cookie using custom configured name
      res.clearCookie(env.COOKIE_NAME_REFRESH, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "lax"
      });

      // Log successful logout
      await AuditLogger.log(
        userName,
        "Logout",
        "Auth",
        "Admin logged out successfully"
      );

      res.status(StatusCode.OK).json({
        success: true,
        message: "Successfully logged out"
      });
    } catch (error) {
      next(error);
    }
  };
}
