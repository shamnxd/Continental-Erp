import { Router } from "express";
import { StaffPortalController } from "../controllers/StaffPortalController";
import { requireStaffAuth } from "../middleware/staff.middleware";

const router = Router();
const controller = new StaffPortalController();

router.use(requireStaffAuth as any);

router.get("/me", controller.getMe);
router.get("/tasks", controller.getTasks);
router.get("/leaves", controller.getLeaves);
router.post("/leaves", controller.createLeave);

export const staffPortalRouter = router;
