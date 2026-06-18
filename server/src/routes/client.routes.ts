import { Router } from "express";
import { ClientController } from "../controllers/ClientController";
import { requireAuth } from "../middleware/auth.middleware";
import { validateDto } from "../middleware/dto.middleware";
import { CreateClientSchema, UpdateClientSchema } from "../dtos/client.dto";
import { enquiryDrawingUpload } from "../middleware/upload.middleware";

const router = Router();
const controller = new ClientController();

// Require auth for all client endpoints
router.use(requireAuth);

router.post("/", validateDto(CreateClientSchema), controller.create);
router.get("/stats", controller.getStats);
router.get("/parent-companies/report", controller.getParentCompanyReport);
router.post("/upload-logo", enquiryDrawingUpload.single("logo"), controller.uploadLogo);
router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.put("/:id", validateDto(UpdateClientSchema), controller.update);
router.delete("/:id", controller.delete);

export const clientRouter = router;
