import { injectable } from "tsyringe";
import { BaseRepository } from "./BaseRepository";
import { IUserRepository } from "../../interfaces/repositories/IUserRepository";
import { IUser } from "../../interfaces/models/IUser";
import { UserModel, IUserDocument } from "../../models/User";

@injectable()
export class UserRepository extends BaseRepository<IUserDocument, IUser> implements IUserRepository {
  constructor() {
    super(UserModel);
  }

  protected toDomain(userDoc: IUserDocument): IUser {
    return {
      id: userDoc._id.toString(),
      name: userDoc.name || (userDoc as any).username || "",
      username: (userDoc as any).username,
      email: userDoc.email,
      passwordHash: userDoc.passwordHash,
      refreshToken: userDoc.refreshToken,
      role: userDoc.role || "admin",
      permissions: userDoc.permissions ? {
        crm: userDoc.permissions.crm ?? true,
        operations: userDoc.permissions.operations ?? true,
        finance: userDoc.permissions.finance ?? true,
        administration: userDoc.permissions.administration ?? true,
      } : { crm: true, operations: true, finance: true, administration: true },
      createdAt: userDoc.createdAt,
      updatedAt: userDoc.updatedAt
    };
  }

  public async findByEmail(email: string): Promise<IUser | null> {
    const userDoc = await UserModel.findOne({ email }).exec();
    return userDoc ? this.toDomain(userDoc) : null;
  }

  public async findByName(name: string): Promise<IUser | null> {
    const userDoc = await UserModel.findOne({
      $or: [{ name }, { username: name }]
    }).exec();
    return userDoc ? this.toDomain(userDoc) : null;
  }

  public async updateRefreshToken(id: string, token: string | null): Promise<void> {
    await UserModel.findByIdAndUpdate(id, { refreshToken: token }).exec();
  }
}
