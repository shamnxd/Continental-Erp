import { Router } from "express";
import { ComplaintController } from "../controllers/ComplaintController";
import { requireAuth } from "../middleware/auth.middleware";
import { validateDto } from "../middleware/dto.middleware";
import { CreateComplaintSchema, UpdateComplaintSchema } from "../dtos/complaint.dto";

const router = Router();
const controller = new ComplaintController();

// Require auth for all complaints endpoints
router.use(requireAuth);

router.post("/", validateDto(CreateComplaintSchema), controller.create);
router.get("/stats", controller.getStats);
router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.put("/:id", validateDto(UpdateComplaintSchema), controller.update);
router.delete("/:id", controller.delete);

export const complaintRouter = router;
