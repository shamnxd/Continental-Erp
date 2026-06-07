import { Router } from "express";
import { CopperPipeRateController } from "../controllers/CopperPipeRateController";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();
const controller = new CopperPipeRateController();

router.use(requireAuth);

router.get("/", controller.getAll);
router.post("/", controller.create);
router.put("/sync", controller.sync);
router.put("/:id", controller.update);
router.delete("/:id", controller.delete);

export const copperPipeRateRouter = router;
