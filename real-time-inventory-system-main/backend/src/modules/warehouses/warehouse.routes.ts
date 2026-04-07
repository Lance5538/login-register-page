import { Router } from "express";
import { WarehouseController } from "./warehouse.controller";
import {
  authMiddleware,
  requireRole,
} from "../../middlewares/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/", WarehouseController.getWarehouses);
router.get("/:id", WarehouseController.getWarehouseById);

router.post("/", requireRole("ADMIN"), WarehouseController.createWarehouse);
router.patch("/:id", requireRole("ADMIN"), WarehouseController.updateWarehouse);
router.delete("/:id", requireRole("ADMIN"), WarehouseController.deleteWarehouse);

export default router;