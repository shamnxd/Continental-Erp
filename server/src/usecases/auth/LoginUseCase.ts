import { injectable, inject } from "tsyringe";
import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { IUseCase } from "../../interfaces/usecases/IUseCase";
import { IUserRepository } from "../../interfaces/repositories/IUserRepository";
import { LoginRequestDto, LoginResponseDto } from "../../dtos/auth.dto";
import { AppError } from "../../errors/AppError";
import { StatusCode } from "../../constants/statusCodes";
import { env } from "../../config/env";

@injectable()
export class LoginUseCase implements IUseCase<LoginRequestDto, LoginResponseDto> {
  constructor(
    @inject("UserRepository")
    private _userRepository: IUserRepository
  ) {}

  public async execute(dto: LoginRequestDto): Promise<LoginResponseDto> {
    const user = await this._userRepository.findByEmail(dto.email);
    if (!user) {
      throw new AppError("Invalid email or password", StatusCode.UNAUTHORIZED);
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError("Invalid email or password", StatusCode.UNAUTHORIZED);
    }

    const accessToken = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role, permissions: user.permissions },
      env.JWT_ACCESS_SECRET,
      { expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"] }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      env.JWT_REFRESH_SECRET,
      { expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions["expiresIn"] }
    );

    // Save refresh token to user model in database
    await this._userRepository.updateRefreshToken(user.id!, refreshToken);

    return {
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user.id!,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions
      }
    };
  }
}
