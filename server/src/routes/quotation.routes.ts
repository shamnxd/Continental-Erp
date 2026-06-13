import { Router } from "express";
import { QuotationController } from "../controllers/QuotationController";
import { requireAuth } from "../middleware/auth.middleware";
import { validateDto } from "../middleware/dto.middleware";
import { CreateQuotationSchema, UpdateQuotationSchema } from "../dtos/quotation.dto";
import { AddQuotationRemarkSchema, EditQuotationRemarkSchema } from "../dtos/quotationRemark.dto";

const router = Router();
const controller = new QuotationController();

router.use(requireAuth);

router.post("/", validateDto(CreateQuotationSchema), controller.create);
router.post("/:id/revision", controller.createRevision);
router.get("/stats", controller.getStats);
router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.put("/:id", validateDto(UpdateQuotationSchema), controller.update);
router.post("/:id/remarks", validateDto(AddQuotationRemarkSchema), controller.addRemark);
router.put("/:id/remarks/:remarkId", validateDto(EditQuotationRemarkSchema), controller.editRemark);
router.delete("/:id", controller.delete);

export const quotationRouter = router;
