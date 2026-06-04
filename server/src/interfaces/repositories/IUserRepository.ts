import { IBaseRepository } from "./IBaseRepository";
import { IUser } from "../models/IUser";

export interface IUserRepository extends IBaseRepository<IUser> {
  findByEmail(email: string): Promise<IUser | null>;
  findByName(name: string): Promise<IUser | null>;
  updateRefreshToken(id: string, token: string | null): Promise<void>;
}
