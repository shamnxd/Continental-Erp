import { injectable, inject } from "tsyringe";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { IUseCase } from "../../interfaces/usecases/IUseCase";
import { IStaffRepository } from "../../interfaces/repositories/IStaffRepository";
import { IEmailService } from "../../interfaces/services/IEmailService";
import { CreateStaffDto } from "../../dtos/staff.dto";
import { IStaff } from "../../interfaces/models/IStaff";

@injectable()
export class CreateStaffUseCase implements IUseCase<CreateStaffDto, IStaff> {
  constructor(
    @inject("StaffRepository")
    private _staffRepository: IStaffRepository,
    @inject("EmailService")
    private _emailService: IEmailService
  ) {}

  public async execute(dto: CreateStaffDto): Promise<IStaff> {
    // Generate a secure random 12-character password
    const rawPassword = crypto.randomBytes(9).toString("base64url").slice(0, 12);
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    const staff = await this._staffRepository.create({
      ...dto,
      customRole: dto.role === "Custom" ? dto.customRole : "",
      passwordHash,
    });

    // Send welcome email with credentials (non-blocking — failure won't break creation)
    this._emailService.sendStaffWelcomeEmail({
      recipientEmail: staff.email,
      staffName: staff.fullName,
      staffNo: staff.staffNo,
      password: rawPassword,
    }).catch((err) => {
      console.error("Failed to send staff welcome email:", err);
    });

    return staff;
  }
}
