import { Router } from "express";
import { ComplaintRequestController } from "../controllers/ComplaintRequestController";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();
const controller = new ComplaintRequestController();

// Public route to submit complaint
router.post("/public", controller.submitPublicComplaint);

// Admin-only protected routes
router.use(requireAuth);
router.get("/stats", controller.getStats);
router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.put("/:id/reject", controller.reject);
router.put("/:id/convert", controller.convert);
router.put("/:id/remarks", controller.addRemark);

export const complaintRequestRouter = router;
