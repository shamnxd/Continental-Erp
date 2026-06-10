import { Router } from "express";
import { RemarkController } from "../controllers/RemarkController";
import { requireAuth } from "../middleware/auth.middleware";
import { validateDto } from "../middleware/dto.middleware";
import { AddRemarkSchema } from "../dtos/remark.dto";
import { enquiryDrawingUpload } from "../middleware/upload.middleware";

const router = Router();
const controller = new RemarkController();

router.use(requireAuth);

router.get("/", controller.getAll);
router.post("/", enquiryDrawingUpload.single("file"), validateDto(AddRemarkSchema), controller.add);

export const remarkRouter = router;
