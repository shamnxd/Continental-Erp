import { Router } from "express";
import { WarrantyController } from "../controllers/WarrantyController";
import { requireAuth } from "../middleware/auth.middleware";
import { validateDto } from "../middleware/dto.middleware";
import { CreateWarrantySchema, UpdateWarrantySchema } from "../dtos/warranty.dto";

const router = Router();
const controller = new WarrantyController();

router.use(requireAuth);

router.post("/", validateDto(CreateWarrantySchema), controller.create);
router.get("/", controller.getAll);
router.get("/project/:projectId", controller.getByProjectId);
router.get("/:id", controller.getById);
router.put("/:id", validateDto(UpdateWarrantySchema), controller.update);

export const warrantyRouter = router;
