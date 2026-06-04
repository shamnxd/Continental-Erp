import { Router } from "express";
import { StaffAuthController } from "../controllers/StaffAuthController";

const router = Router();
const controller = new StaffAuthController();

router.post("/login", controller.login);
router.post("/logout", controller.logout);

export const staffAuthRouter = router;
