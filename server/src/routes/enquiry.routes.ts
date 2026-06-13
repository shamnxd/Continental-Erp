import { Router } from "express";
import { EnquiryController } from "../controllers/EnquiryController";
import { requireAuth } from "../middleware/auth.middleware";
import { validateDto } from "../middleware/dto.middleware";
import { CreateEnquirySchema, UpdateEnquirySchema } from "../dtos/enquiry.dto";
import { AddEnquiryRemarkSchema, EditEnquiryRemarkSchema } from "../dtos/enquiryRemark.dto";
import { enquiryDrawingUpload } from "../middleware/upload.middleware";

const router = Router();
const controller = new EnquiryController();

router.use(requireAuth);

router.post("/", validateDto(CreateEnquirySchema), controller.create);
router.get("/stats", controller.getStats);
router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.put("/:id", validateDto(UpdateEnquirySchema), controller.update);
router.post("/:id/remarks", validateDto(AddEnquiryRemarkSchema), controller.addRemark);
router.put("/:id/remarks/:remarkId", validateDto(EditEnquiryRemarkSchema), controller.editRemark);
router.post(
  "/:id/drawings",
  enquiryDrawingUpload.single("file"),
  controller.uploadDrawing,
);
router.delete("/:id", controller.delete);

export const enquiryRouter = router;
