import { Router } from "express";
import { StaffController } from "../controllers/StaffController";
import { requireAuth } from "../middleware/auth.middleware";
import { validateDto } from "../middleware/dto.middleware";
import { CreateStaffSchema, UpdateStaffSchema } from "../dtos/staff.dto";

const router = Router();
const controller = new StaffController();

router.use(requireAuth);

router.post("/", validateDto(CreateStaffSchema), controller.create);
router.get("/", controller.getAll);
router.get("/:id/work-history", controller.getWorkHistory);
router.get("/:id", controller.getById);
router.put("/:id", validateDto(UpdateStaffSchema), controller.update);
router.put("/:id/password", controller.changePassword);
router.delete("/:id", controller.delete);

export const staffRouter = router;
