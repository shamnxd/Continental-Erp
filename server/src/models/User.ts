import { Schema, model, Document } from "mongoose";
import { IUser } from "../interfaces/models/IUser";

export interface IUserDocument extends Document, Omit<IUser, "id"> {
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true, trim: true },
    username: { type: String }, // Legacy username for backwards compatibility fallback
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    refreshToken: { type: String, default: null },
    role: { type: String, default: "admin" },
    permissions: {
      crm: { type: Boolean, default: true },
      operations: { type: Boolean, default: true },
      finance: { type: Boolean, default: true },
      administration: { type: Boolean, default: true }
    }
  },
  { timestamps: true }
);

export const UserModel = model<IUserDocument>("User", userSchema);
