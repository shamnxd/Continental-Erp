import { Router } from "express";
import { AuditLogController } from "../controllers/AuditLogController";
import { requireAuth } from "../middleware/auth.middleware";
import { AppError } from "../errors/AppError";
import { StatusCode } from "../constants/statusCodes";

const router = Router();
const controller = new AuditLogController();

router.use(requireAuth);

// Guard to only allow administration module permission
router.use((req: any, res, next) => {
  if (!req.user || !req.user.permissions?.administration) {
    throw new AppError("Access denied: Administration permission required", StatusCode.FORBIDDEN);
  }
  next();
});

router.get("/", controller.getLogs);

export const auditLogRouter = router;
