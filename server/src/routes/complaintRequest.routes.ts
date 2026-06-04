import { Router } from "express";
import { ComplaintRequestController } from "../controllers/ComplaintRequestController";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();
const controller = new ComplaintRequestController();

// Public route to submit complaint
router.post("/public", controller.submitPublicComplaint);

// Admin-only protected routes
router.use(requireAuth);
router.get("/", controller.getAll);
router.put("/:id/reject", controller.reject);
router.put("/:id/convert", controller.convert);

export const complaintRequestRouter = router;
