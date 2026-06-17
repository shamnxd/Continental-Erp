import { Router } from "express";
import { ScheduleController } from "../controllers/ScheduleController";
import { requireAuth } from "../middleware/auth.middleware";
import { validateDto } from "../middleware/dto.middleware";
import { CreateScheduleSchema, UpdateScheduleSchema } from "../dtos/schedule.dto";
import { enquiryDrawingUpload } from "../middleware/upload.middleware";

const router = Router();
const controller = new ScheduleController();

router.use(requireAuth);

router.post("/", validateDto(CreateScheduleSchema), controller.create);
router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.put("/:id", validateDto(UpdateScheduleSchema), controller.update);
router.put("/:id/complete", enquiryDrawingUpload.single("file"), controller.complete);
router.delete("/:id", controller.delete);

export const scheduleRouter = router;
