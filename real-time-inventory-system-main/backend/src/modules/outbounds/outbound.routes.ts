import { Router } from "express";
import { authMiddleware, requireRole } from "../../middlewares/auth.middleware";
import { OutboundController } from "./outbound.controller";

const router = Router();

router.use(authMiddleware);

router.get("/", OutboundController.getOutboundOrders);
router.get("/:id", OutboundController.getOutboundOrderById);
router.post("/", requireRole("ADMIN", "STAFF"), OutboundController.createOutboundOrder);
router.patch("/:id", requireRole("ADMIN", "STAFF"), OutboundController.updateOutboundOrder);

export default router;
