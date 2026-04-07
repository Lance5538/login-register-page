import { Router } from "express";
import { authMiddleware, requireRole } from "../../middlewares/auth.middleware";
import { ApprovalController } from "./approval.controller";

const router = Router();

router.use(authMiddleware);

router.get("/", ApprovalController.getApprovalQueue);
router.post("/:module/:id/approve", requireRole("ADMIN"), ApprovalController.approve);
router.post("/:module/:id/reject", requireRole("ADMIN"), ApprovalController.reject);

export default router;
