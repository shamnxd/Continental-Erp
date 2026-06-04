import { Router } from "express";
import { LeaveController } from "../controllers/LeaveController";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();
const controller = new LeaveController();

router.use(requireAuth);

router.get("/", controller.getAll);
router.put("/:id/status", controller.updateStatus);

export const leaveRouter = router;
