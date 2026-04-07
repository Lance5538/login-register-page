import { Router } from "express";
import { authMiddleware, requireRole } from "../../middlewares/auth.middleware";
import { InboundController } from "./inbound.controller";

const router = Router();

router.use(authMiddleware);

router.get("/", InboundController.getInboundOrders);
router.get("/:id", InboundController.getInboundOrderById);
router.post("/", requireRole("ADMIN", "STAFF"), InboundController.createInboundOrder);
router.patch("/:id", requireRole("ADMIN", "STAFF"), InboundController.updateInboundOrder);

export default router;
