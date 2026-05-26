import { Router } from "express";
import { AmcController } from "../controllers/AmcController";
import { requireAuth } from "../middleware/auth.middleware";
import { validateDto } from "../middleware/dto.middleware";
import { CreateAmcSchema, UpdateAmcSchema } from "../dtos/amc.dto";
import { ScheduleAmcVisitSchema, UpdateAmcVisitSchema } from "../dtos/amcVisit.dto";
import { AddAmcRemarkSchema, RecordAmcPaymentSchema } from "../dtos/amcRemark.dto";

const router = Router();
const controller = new AmcController();

router.use(requireAuth);

router.post("/", validateDto(CreateAmcSchema), controller.create);
router.get("/", controller.getAll);
router.post("/:id/remarks", validateDto(AddAmcRemarkSchema), controller.addRemark);
router.post("/:id/payments", validateDto(RecordAmcPaymentSchema), controller.recordPayment);
router.get("/:id/visits", controller.getVisits);
router.get("/:id/visits/:visitId/smr", controller.getVisitSmr);
router.post("/:id/visits", validateDto(ScheduleAmcVisitSchema), controller.scheduleVisit);
router.patch("/:id/visits/:visitId", validateDto(UpdateAmcVisitSchema), controller.updateVisit);
router.get("/:id", controller.getById);
router.put("/:id", validateDto(UpdateAmcSchema), controller.update);
router.delete("/:id", controller.delete);

export const amcRouter = router;
