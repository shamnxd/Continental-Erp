import { Router } from "express";
import { CostingController } from "../controllers/CostingController";
import { requireAuth } from "../middleware/auth.middleware";
import { validateDto } from "../middleware/dto.middleware";
import { CreateCostingSchema, UpdateCostingSchema } from "../dtos/costing.dto";

const router = Router();
const controller = new CostingController();

router.use(requireAuth);

router.post("/", validateDto(CreateCostingSchema), controller.create);
router.get("/enquiry/:enquiryId", controller.getByEnquiryId);
router.put("/:id", validateDto(UpdateCostingSchema), controller.update);
router.post("/:id/revision", controller.createRevision);

export const costingRouter = router;
