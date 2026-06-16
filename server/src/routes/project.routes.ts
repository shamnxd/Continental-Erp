import { Router } from "express";
import { ProjectController } from "../controllers/ProjectController";
import { requireAuth } from "../middleware/auth.middleware";
import { validateDto } from "../middleware/dto.middleware";
import { CreateProjectSchema, UpdateProjectSchema } from "../dtos/project.dto";
import { enquiryDrawingUpload } from "../middleware/upload.middleware";

const router = Router();
const controller = new ProjectController();

router.use(requireAuth);

router.post("/", validateDto(CreateProjectSchema), controller.create);
router.get("/", controller.getAll);
router.get("/all-subcontracts", controller.getAllSubcontracts);
router.get("/all-purchase-orders", controller.getAllPurchaseOrders);
router.get("/:id", controller.getById);
router.put("/:id", validateDto(UpdateProjectSchema), controller.update);
router.delete("/:id", controller.delete);

// --- Task Routes ---
router.post("/:id/tasks", controller.createTask);
router.get("/:id/tasks", controller.getTasks);
router.put("/:id/tasks/:taskId", controller.updateTask);
router.delete("/:id/tasks/:taskId", controller.deleteTask);

// --- Subcontract Routes ---
router.post("/:id/subcontracts", controller.createSubcontract);
router.get("/:id/subcontracts", controller.getSubcontracts);
router.put("/:id/subcontracts/:subcontractId", controller.updateSubcontract);
router.delete("/:id/subcontracts/:subcontractId", controller.deleteSubcontract);

// --- Purchase Order Routes ---
router.post("/:id/purchase-orders", controller.createPo);
router.get("/:id/purchase-orders", controller.getPos);
router.put("/:id/purchase-orders/:poId", controller.updatePo);
router.delete("/:id/purchase-orders/:poId", controller.deletePo);
router.post("/:id/purchase-orders/:poId/pdf", enquiryDrawingUpload.single("file"), controller.uploadPoPdf);

// --- Handover Report Routes ---
router.post("/:id/handover", enquiryDrawingUpload.single("file"), controller.uploadHandoverDoc);

// --- Subcontract Report Routes ---
router.post("/:id/subcontracts/:subcontractId/report", enquiryDrawingUpload.single("file"), controller.uploadSubcontractReport);


export const projectRouter = router;

