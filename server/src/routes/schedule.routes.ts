import { Router } from "express";
import { ScheduleController } from "../controllers/ScheduleController";
import { requireAuth } from "../middleware/auth.middleware";
import { validateDto } from "../middleware/dto.middleware";
import { CreateScheduleSchema, UpdateScheduleSchema } from "../dtos/schedule.dto";

const router = Router();
const controller = new ScheduleController();

router.use(requireAuth);

router.post("/", validateDto(CreateScheduleSchema), controller.create);
router.get("/", controller.getAll);
router.put("/:id", validateDto(UpdateScheduleSchema), controller.update);
router.delete("/:id", controller.delete);

export const scheduleRouter = router;
