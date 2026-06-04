import { Response, NextFunction } from "express";
import { inject, autoInjectable } from "tsyringe";
import bcrypt from "bcryptjs";
import { IUserRepository } from "../interfaces/repositories/IUserRepository";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { StatusCode } from "../constants/statusCodes";
import { AppError } from "../errors/AppError";

@autoInjectable()
export class AdminController {
  constructor(
    @inject("UserRepository")
    private _userRepository?: IUserRepository
  ) {}

  public getAll = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (req.user?.permissions && !req.user.permissions.administration) {
        throw new AppError("You do not have permission to view administrator accounts", StatusCode.FORBIDDEN);
      }

      const users = await this._userRepository!.findAll();
      const sanitized = users.map(user => {
        const { passwordHash, ...rest } = user;
        return rest;
      });

      res.status(StatusCode.OK).json({ success: true, data: sanitized });
    } catch (error) {
      next(error);
    }
  };

  public create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (req.user?.permissions && !req.user.permissions.administration) {
        throw new AppError("You do not have permission to create administrator accounts", StatusCode.FORBIDDEN);
      }

      const { name, email, password, permissions } = req.body;

      if (!name || !email || !password) {
        throw new AppError("Name, email and password are required", StatusCode.BAD_REQUEST);
      }

      if (name.trim().toLowerCase() === "admin") {
        throw new AppError("The name 'admin' is reserved for the default super administrator", StatusCode.BAD_REQUEST);
      }

      const existingEmail = await this._userRepository!.findByEmail(email);
      if (existingEmail) {
        throw new AppError("A user with this email already exists", StatusCode.BAD_REQUEST);
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const newUser = await this._userRepository!.create({
        name,
        email,
        passwordHash,
        role: "admin",
        permissions: permissions || { crm: true, operations: true, finance: true, administration: true }
      });

      const { passwordHash: _, ...sanitized } = newUser;
      res.status(StatusCode.CREATED).json({ success: true, data: sanitized });
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (req.user?.permissions && !req.user.permissions.administration) {
        throw new AppError("You do not have permission to edit administrator accounts", StatusCode.FORBIDDEN);
      }

      const { id } = req.params;
      const { name, email, password, permissions } = req.body;

      const user = await this._userRepository!.findById(id);
      if (!user) {
        throw new AppError("User not found", StatusCode.NOT_FOUND);
      }

      const updateData: any = {};

      // If the target user being updated is the default super admin
      if (user.name === "admin") {
        if (name && name !== "admin") {
          throw new AppError("The default super administrator's name cannot be modified", StatusCode.BAD_REQUEST);
        }
        updateData.name = "admin";

        if (permissions) {
          // Verify that all permissions are true
          const allEnabled = permissions.crm && permissions.operations && permissions.finance && permissions.administration;
          if (!allEnabled) {
            throw new AppError("The default super administrator must retain all permissions", StatusCode.BAD_REQUEST);
          }
          updateData.permissions = {
            crm: true,
            operations: true,
            finance: true,
            administration: true
          };
        }
      } else {
        // For other users
        if (name) {
          if (name.trim().toLowerCase() === "admin") {
            throw new AppError("The name 'admin' is reserved for the default super administrator", StatusCode.BAD_REQUEST);
          }
          updateData.name = name;
        }

        if (permissions) {
          updateData.permissions = permissions;
        }
      }

      if (email) {
        if (email !== user.email) {
          const existing = await this._userRepository!.findByEmail(email);
          if (existing) {
            throw new AppError("A user with this email already exists", StatusCode.BAD_REQUEST);
          }
        }
        updateData.email = email;
      }
      if (password) {
        updateData.passwordHash = await bcrypt.hash(password, 10);
      }

      const updatedUser = await this._userRepository!.update(id, updateData);
      if (!updatedUser) {
        throw new AppError("Failed to update user", StatusCode.INTERNAL_SERVER_ERROR);
      }

      const { passwordHash: _, ...sanitized } = updatedUser;
      res.status(StatusCode.OK).json({ success: true, data: sanitized });
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (req.user?.permissions && !req.user.permissions.administration) {
        throw new AppError("You do not have permission to delete administrator accounts", StatusCode.FORBIDDEN);
      }

      const { id } = req.params;

      if (req.user?.id === id) {
        throw new AppError("You cannot delete your own administrator account", StatusCode.BAD_REQUEST);
      }

      const userToDelete = await this._userRepository!.findById(id);
      if (!userToDelete) {
        throw new AppError("User not found", StatusCode.NOT_FOUND);
      }

      if (userToDelete.name === "admin") {
        throw new AppError("The default super administrator account ('admin') cannot be deleted", StatusCode.BAD_REQUEST);
      }

      const success = await this._userRepository!.delete(id);
      if (!success) {
        throw new AppError("User could not be deleted", StatusCode.INTERNAL_SERVER_ERROR);
      }

      res.status(StatusCode.OK).json({ success: true, message: "Administrator deleted successfully" });
    } catch (error) {
      next(error);
    }
  };
}
