import { Router } from "express";
import { AdminController } from "../controllers/AdminController";
import { requireAuth } from "../middleware/auth.middleware";
import { validateDto } from "../middleware/dto.middleware";
import { CreateAdminSchema, UpdateAdminSchema } from "../dtos/admin.dto";

const router = Router();
const controller = new AdminController();

router.use(requireAuth);

router.get("/", controller.getAll);
router.post("/", validateDto(CreateAdminSchema), controller.create);
router.put("/:id", validateDto(UpdateAdminSchema), controller.update);
router.delete("/:id", controller.delete);

export const adminRouter = router;
