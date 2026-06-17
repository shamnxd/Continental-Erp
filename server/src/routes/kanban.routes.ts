import { Router } from "express";
import { KanbanController } from "../controllers/KanbanController";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();
const controller = new KanbanController();

router.use(requireAuth);

router.get("/", controller.getAll);

export const kanbanRouter = router;
