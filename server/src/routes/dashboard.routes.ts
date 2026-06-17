import { Router } from "express";
import { DashboardController } from "../controllers/DashboardController";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();
const controller = new DashboardController();

// Restrict dashboard access to authenticated admin users
router.use(requireAuth);

router.get("/", controller.getMetrics);

export const dashboardRouter = router;
