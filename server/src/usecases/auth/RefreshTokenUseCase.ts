import { injectable, inject } from "tsyringe";
import jwt, { SignOptions } from "jsonwebtoken";
import { IUseCase } from "../../interfaces/usecases/IUseCase";
import { IUserRepository } from "../../interfaces/repositories/IUserRepository";
import { AppError } from "../../errors/AppError";
import { StatusCode } from "../../constants/statusCodes";
import { env } from "../../config/env";

interface DecodedToken {
  id: string;
}

@injectable()
export class RefreshTokenUseCase implements IUseCase<string, string> {
  constructor(
    @inject("UserRepository")
    private _userRepository: IUserRepository
  ) {}

  public async execute(token: string): Promise<string> {
    let userId: string;

    try {
      const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as DecodedToken;
      userId = decoded.id;
    } catch (err) {
      throw new AppError("Invalid or expired refresh token", StatusCode.UNAUTHORIZED);
    }

    const user = await this._userRepository.findById(userId);
    if (!user || user.refreshToken !== token) {
      throw new AppError("Invalid refresh token session", StatusCode.UNAUTHORIZED);
    }

    // Generate a fresh new access token
    const newAccessToken = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role, permissions: user.permissions },
      env.JWT_ACCESS_SECRET,
      { expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"] }
    );

    return newAccessToken;
  }
}
