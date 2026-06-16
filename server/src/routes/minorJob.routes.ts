import { Router } from "express";
import { MinorJobController } from "../controllers/MinorJobController";
import { requireAuth } from "../middleware/auth.middleware";
import { validateDto } from "../middleware/dto.middleware";
import { CreateMinorJobSchema, UpdateMinorJobSchema } from "../dtos/minorJob.dto";

const router = Router();
const controller = new MinorJobController();

router.use(requireAuth);

router.post("/", validateDto(CreateMinorJobSchema), controller.create);
router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.put("/:id", validateDto(UpdateMinorJobSchema), controller.update);
router.delete("/:id", controller.delete);

export const minorJobRouter = router;
