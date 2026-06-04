import { container } from "tsyringe";
import { IAuditLogRepository } from "../interfaces/repositories/IAuditLogRepository";

export class AuditLogger {
  public static async log(user: string, action: string, module: string, details: string): Promise<void> {
    try {
      const repo = container.resolve<IAuditLogRepository>("AuditLogRepository");
      await repo.create({
        user,
        action,
        module,
        details,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error("Failed to log audit action:", error);
    }
  }
}
